"""Wi-Fi socket client for iPIXEL devices.

The iPIXEL app uses a raw TCP socket to 192.168.4.1:80 (not HTTP).
The same binary command frames used over BLE work over Wi-Fi, but with
larger chunk sizes (12KB vs BLE's 244 bytes), making image/GIF transfers
significantly faster.

Recovered from APK reverse engineering of com.wifiled.ipixels v3.5.6.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from ..const import (
    WIFI_DEFAULT_HOST,
    WIFI_DEFAULT_PORT,
    WIFI_WRITE_CHUNK_SIZE,
    WIFI_SOCKET_TIMEOUT,
)

_LOGGER = logging.getLogger(__name__)


class WifiAckInfo:
    """Parsed ACK response from the device.

    The device answers every command with a 5-byte frame
    [0x05, 0x00, cmd_lo, cmd_hi, RET]. RET means different things depending on
    the command class (ipixel-ctrl docs/DeviceCommands.md):

      simple control commands : 0x00 = NG, 0x01 = OK
      bulk data (0x0002/0x0003/0x0004/0x0100) : 0x03 = OK, anything else = NG

    pypixelcolor's BLE AckManager uses the same reading: 0 and 1 acknowledge a
    window, 3 signals the whole transfer landed.
    """

    # Bulk-data opcodes, where 0x03 is success rather than an error.
    BULK_OPCODES = frozenset({0x0002, 0x0003, 0x0004, 0x0100})

    ACK_WINDOW = 0x00
    ACK_OK = 0x01
    ACK_COMPLETE = 0x03

    def __init__(self, raw: bytes) -> None:
        self.raw = raw
        self.ack_kind: str | None = None
        self.opcode: int | None = None
        self.status: int | None = None

        if len(raw) >= 5 and raw[0] == 0x05:
            self.opcode = ((raw[3] & 0xFF) << 8) | (raw[2] & 0xFF)
            self.status = raw[4] & 0xFF
            if self.status == self.ACK_COMPLETE:
                self.ack_kind = "transfer-complete"
            elif self.status == self.ACK_WINDOW:
                self.ack_kind = "chunk-ack"
            elif self.status == self.ACK_OK:
                self.ack_kind = "ok"
            else:
                self.ack_kind = "error"

    @property
    def is_error(self) -> bool:
        """Return True if this ACK reports a failure."""
        if self.status is None:
            return False
        if self.opcode in self.BULK_OPCODES:
            # Mid-transfer windows are acknowledged with 0/1; only the final
            # window reports 0x03. Anything else is a failure.
            return self.status not in (
                self.ACK_WINDOW,
                self.ACK_OK,
                self.ACK_COMPLETE,
            )
        return self.status == 0x00


class WifiClient:
    """Async Wi-Fi socket client for iPIXEL devices.

    Sends the same binary frames as BLE but over a raw TCP socket,
    enabling much faster data transfer (12KB chunks vs 244 bytes).
    """

    def __init__(
        self,
        host: str = WIFI_DEFAULT_HOST,
        port: int = WIFI_DEFAULT_PORT,
        timeout: float = WIFI_SOCKET_TIMEOUT,
    ) -> None:
        self._host = host
        self._port = port
        self._timeout = timeout
        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None
        self._connected = False

    async def connect(self) -> None:
        """Establish TCP connection to the iPIXEL device."""
        if self._connected:
            return

        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self._host, self._port),
                timeout=self._timeout,
            )
            self._connected = True
            _LOGGER.info(
                "Connected to iPIXEL via Wi-Fi at %s:%d", self._host, self._port
            )
        except asyncio.TimeoutError:
            raise ConnectionError(
                f"Timeout connecting to {self._host}:{self._port}"
            )
        except OSError as err:
            raise ConnectionError(
                f"Failed to connect to {self._host}:{self._port}: {err}"
            )

    async def disconnect(self) -> None:
        """Close the TCP connection."""
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except Exception:
                pass
        self._reader = None
        self._writer = None
        self._connected = False
        _LOGGER.debug("Disconnected from iPIXEL Wi-Fi")

    async def send(self, data: bytes) -> None:
        """Send raw bytes to the device.

        For large payloads, data is automatically chunked at WIFI_WRITE_CHUNK_SIZE.
        """
        if not self._connected or not self._writer:
            await self.connect()

        assert self._writer is not None

        # Chunk large sends like the official app does
        for offset in range(0, len(data), WIFI_WRITE_CHUNK_SIZE):
            chunk = data[offset : offset + WIFI_WRITE_CHUNK_SIZE]
            self._writer.write(chunk)
            await self._writer.drain()

    async def recv(self, size: int = 4096) -> bytes:
        """Read response bytes from the device."""
        if not self._connected or not self._reader:
            raise ConnectionError("Not connected")

        try:
            data = await asyncio.wait_for(
                self._reader.read(size), timeout=self._timeout
            )
            return data
        except asyncio.TimeoutError:
            return b""

    async def send_command(self, payload: bytes, wait_ack: bool = True) -> WifiAckInfo | None:
        """Send a command and optionally wait for an ACK response.

        Args:
            payload: Command bytes to send
            wait_ack: Whether to wait for a response

        Returns:
            Parsed ACK info, or None if wait_ack is False
        """
        await self.send(payload)

        if not wait_ack:
            return None

        data = await self.recv()
        if data:
            ack = WifiAckInfo(data)
            _LOGGER.debug(
                "Wi-Fi ACK: kind=%s opcode=0x%04x status=0x%02x",
                ack.ack_kind,
                ack.opcode or 0,
                ack.status or 0,
            )
            return ack
        return None

    async def send_data_windowed(
        self,
        data: bytes,
        data_type: int,
        slot: int = 1,
    ) -> bool:
        """Send large data using the windowed protocol (images, GIFs, text).

        Mirrors the app's payloadChannel() wrapper format:
        [length(2)][type(2)][option(1)][content_len(4)][crc32(4)][mode(1)][slot(1)][data...]

        The logical content type is translated to its on-wire bytes -- they are
        not the same value. Text is 0x0100 and templates are 0x0004, so writing
        the logical constant straight into the frame sends the wrong command.

        Args:
            data: Content bytes to send
            data_type: Logical content type (TYPE_IMAGE, TYPE_GIF, TYPE_TEXT,
                TYPE_TEM, ...)
            slot: Storage slot on device. 1-100 persists, 0x65 (101) is
                temporary.

        Returns:
            True if transfer completed successfully
        """
        import zlib

        from ..device.commands import get_data_mode_byte, get_data_type_bytes

        type_bytes = get_data_type_bytes(data_type)
        mode_byte = get_data_mode_byte(data_type)

        crc = zlib.crc32(data) & 0xFFFFFFFF
        total_len = len(data)

        pos = 0
        window_index = 0
        window_size = WIFI_WRITE_CHUNK_SIZE

        while pos < total_len:
            chunk_end = min(pos + window_size, total_len)
            chunk = data[pos:chunk_end]

            option = 0x00 if window_index == 0 else 0x02

            # Build frame header
            header = bytearray()
            header.extend(type_bytes)  # On-wire data type
            header.append(option)  # Option
            header.extend(total_len.to_bytes(4, "little"))  # Total content length
            header.extend(crc.to_bytes(4, "little"))  # CRC32
            header.append(mode_byte)  # Storage mode
            header.append(slot & 0xFF)  # Slot

            frame = header + chunk

            # Prepend 2-byte frame length
            frame_len = len(frame) + 2
            message = frame_len.to_bytes(2, "little") + frame

            await self.send(message)

            # Wait for ACK
            ack = await self.recv()
            if ack:
                ack_info = WifiAckInfo(ack)
                if ack_info.is_error:
                    _LOGGER.error(
                        "Wi-Fi transfer failed at window %d (status=0x%02x)",
                        window_index,
                        ack_info.status or 0,
                    )
                    return False

            window_index += 1
            pos = chunk_end

        _LOGGER.info(
            "Wi-Fi transfer complete: %d bytes in %d windows (type=%d, slot=%d)",
            total_len,
            window_index,
            data_type,
            slot,
        )
        return True

    @property
    def is_connected(self) -> bool:
        """Return True if connected."""
        return self._connected

    @property
    def host(self) -> str:
        """Return the device host."""
        return self._host
