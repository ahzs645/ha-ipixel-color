#!/usr/bin/env python3
"""Mock iPIXEL device simulator for local testing.

Listens on TCP and responds to the iPIXEL binary protocol,
logging all received commands in human-readable form.

Usage:
    python tools/mock_device.py                    # default: 127.0.0.1:8888
    python tools/mock_device.py --host 0.0.0.0 --port 80
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import struct
import sys
from datetime import datetime

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
_LOG = logging.getLogger("mock_device")

# Known opcodes → human-readable names
OPCODES: dict[tuple[int, int], str] = {
    (0x07, 0x01): "POWER",
    (0x04, 0x80): "BRIGHTNESS",  # 0x8004
    (0x06, 0x80): "ORIENTATION/UPSIDE_DOWN",
    (0x03, 0x80): "CLEAR/DEFAULT_MODE",
    (0x08, 0x80): "SHOW_SLOT / RESERVE_SLOT",
    (0x07, 0x80): "SELECT_SCREEN",
    (0x02, 0x01): "DELETE_SLOT(S)/ERASE",
    (0x01, 0x80): "SET_TIME / QUERY_DEVICE",
    (0x04, 0x01): "FUN_MODE/DIY",
    (0x05, 0x01): "PIXEL",
    (0x00, 0x02): "RHYTHM_MODE",
    (0x01, 0x02): "RHYTHM_LEVELS",
    (0x08, 0x00): "PROGRAM_MODE",
    (0x04, 0x02): "SET_PASSWORD",
    (0x05, 0x02): "VERIFY_PASSWORD",
    (0x06, 0x01): "CLOCK_MODE_FULL",
    (0x0D, 0x80): "COUNTDOWN_TIMER",
    (0x0A, 0x80): "SCOREBOARD",
    (0x09, 0x80): "STOPWATCH",
    (0x01, 0x01): "EXIT_MODE",
    (0x12, 0x80): "SET_WEEKDAY",
    (0x06, 0x00): "SPORT_DATA",
}

# Windowed data type names
DATA_TYPES: dict[int, str] = {
    0: "CAMERA_RGB",
    1: "VIDEO",
    2: "IMAGE",
    3: "GIF",
    4: "TEXT",
    5: "DIY_IMAGE",
    6: "DIY_IMAGE_UNREDO",
    7: "TEMPLATE",
}


def decode_command(data: bytes) -> str:
    """Decode a command frame into a human-readable string."""
    if len(data) < 4:
        return f"SHORT_FRAME ({data.hex()})"

    # Check for windowed data transfer (has 2-byte length prefix + type/option/etc.)
    frame_len = int.from_bytes(data[0:2], "little")
    if frame_len == len(data) and len(data) > 15:
        # Looks like a windowed data frame
        data_type = int.from_bytes(data[2:4], "little")
        option = data[4]
        content_len = int.from_bytes(data[5:9], "little")
        crc = int.from_bytes(data[9:13], "little")
        mode = data[13]
        slot = data[14]
        chunk_len = len(data) - 15

        type_name = DATA_TYPES.get(data_type, f"UNKNOWN({data_type})")
        opt = "FIRST" if option == 0 else "CONTINUE"

        return (
            f"WINDOWED_DATA type={type_name} option={opt} "
            f"total={content_len}B crc=0x{crc:08X} mode={mode} slot={slot} "
            f"chunk={chunk_len}B"
        )

    # Simple command frame
    cmd_len = int.from_bytes(data[0:2], "little")
    op = (data[2], data[3])
    op_name = OPCODES.get(op, f"UNKNOWN(0x{data[2]:02X}, 0x{data[3]:02X})")
    payload = data[4:]

    detail = ""
    if op == (0x07, 0x01):  # POWER
        detail = f" state={'ON' if payload[0] else 'OFF'}" if payload else ""
    elif op[1] == 0x80 and op[0] == 0x04:  # BRIGHTNESS
        detail = f" level={payload[0]}" if payload else ""
    elif op == (0x0D, 0x80):  # COUNTDOWN
        if len(payload) >= 3:
            detail = f" {payload[0]:02d}:{payload[1]:02d}:{payload[2]:02d}"
    elif op == (0x0A, 0x80):  # SCOREBOARD
        if len(payload) >= 4:
            a = (payload[0] << 8) | payload[1]
            b = (payload[2] << 8) | payload[3]
            detail = f" A={a} B={b}"
    elif op == (0x09, 0x80):  # STOPWATCH
        modes = {0: "STOP", 1: "START", 2: "RESET"}
        detail = f" mode={modes.get(payload[0], payload[0])}" if payload else ""
    elif op == (0x12, 0x80):  # SET_WEEKDAY
        days = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"}
        detail = f" {days.get(payload[0], payload[0])}" if payload else ""
    elif op == (0x06, 0x01):  # CLOCK_MODE_FULL
        if len(payload) >= 7:
            detail = (
                f" mode={payload[0]} show_date={payload[1]==0} "
                f"24h={payload[2]==1} {2000+payload[3]}-{payload[4]:02d}-{payload[5]:02d} "
                f"wd={payload[6]}"
            )
    elif op == (0x01, 0x80):  # SET_TIME / QUERY
        if len(payload) >= 3:
            detail = f" {payload[0]:02d}:{payload[1]:02d}:{payload[2]:02d}"
            if len(payload) >= 7:
                detail = (
                    f" 20{payload[0]:02d}-{payload[1]:02d}-{payload[2]:02d} "
                    f"wd={payload[3]} {payload[4]:02d}:{payload[5]:02d}:{payload[6]:02d}"
                )
    elif op == (0x06, 0x00):  # SPORT_DATA
        if len(payload) >= 3:
            detail = f" a={payload[0]} b={payload[1]} c={payload[2]}"

    return f"{op_name} (len={cmd_len}){detail} [{data.hex()}]"


def make_ack(opcode_bytes: bytes, status: int = 0x01) -> bytes:
    """Build an ACK response.

    Format: [0x05, 0x00, op_lo, op_hi, status]
    status: 0x00=chunk-ack, 0x01=transfer-complete, 0x03=error
    """
    return bytes([0x05, 0x00, opcode_bytes[0], opcode_bytes[1], status])


class MockiPIXELDevice:
    """Simulated iPIXEL device that accepts TCP connections."""

    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
        self._server: asyncio.Server | None = None
        self.command_log: list[tuple[datetime, str]] = []
        self._windowed_transfers: dict[str, int] = {}  # addr → bytes received

    async def start(self) -> None:
        self._server = await asyncio.start_server(
            self._handle_client, self.host, self.port
        )
        _LOG.info(
            "Mock iPIXEL device listening on %s:%d", self.host, self.port
        )
        _LOG.info("Waiting for connections... (Ctrl+C to stop)")
        async with self._server:
            await self._server.serve_forever()

    async def _handle_client(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        addr = writer.get_extra_info("peername")
        _LOG.info("Client connected: %s", addr)

        try:
            while True:
                data = await reader.read(65536)
                if not data:
                    break

                decoded = decode_command(data)
                self.command_log.append((datetime.now(), decoded))
                _LOG.info("RX ← %s", decoded)

                # Send ACK
                if len(data) >= 4:
                    # Check if windowed data
                    frame_len = int.from_bytes(data[0:2], "little")
                    if frame_len == len(data) and len(data) > 15:
                        # Windowed: check if this is the last chunk
                        content_len = int.from_bytes(data[5:9], "little")
                        chunk_len = len(data) - 15
                        addr_key = str(addr)
                        option = data[4]

                        if option == 0:
                            self._windowed_transfers[addr_key] = chunk_len
                        else:
                            self._windowed_transfers[addr_key] = (
                                self._windowed_transfers.get(addr_key, 0) + chunk_len
                            )

                        received = self._windowed_transfers.get(addr_key, 0)
                        if received >= content_len:
                            # Transfer complete
                            ack = make_ack(data[2:4], status=0x01)
                            _LOG.info(
                                "TX → TRANSFER_COMPLETE (%d/%d bytes)",
                                received, content_len,
                            )
                            self._windowed_transfers.pop(addr_key, None)
                        else:
                            # Chunk ACK
                            ack = make_ack(data[2:4], status=0x00)
                            _LOG.info(
                                "TX → CHUNK_ACK (%d/%d bytes)",
                                received, content_len,
                            )
                    else:
                        # Simple command ACK
                        ack = make_ack(data[2:4], status=0x01)
                        _LOG.info("TX → ACK")

                    writer.write(ack)
                    await writer.drain()

        except (ConnectionResetError, BrokenPipeError):
            _LOG.info("Client disconnected: %s", addr)
        except Exception as e:
            _LOG.error("Error handling client %s: %s", addr, e)
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            _LOG.info("Connection closed: %s", addr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mock iPIXEL device simulator")
    parser.add_argument("--host", default="127.0.0.1", help="Listen address")
    parser.add_argument("--port", type=int, default=8888, help="Listen port")
    args = parser.parse_args()

    device = MockiPIXELDevice(args.host, args.port)
    try:
        asyncio.run(device.start())
    except KeyboardInterrupt:
        _LOG.info("Shutting down mock device")
        print(f"\nReceived {len(device.command_log)} commands total")


if __name__ == "__main__":
    main()
