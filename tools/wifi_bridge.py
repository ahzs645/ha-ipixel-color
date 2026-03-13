#!/usr/bin/env python3
"""WebSocket-to-TCP bridge for iPIXEL WiFi control from the browser.

The browser can't open raw TCP sockets, so this bridge:
  Browser (WebSocket) ←→ Bridge (this script) ←→ iPIXEL device (raw TCP)

Messages are binary frames — the bridge just forwards bytes transparently.

Usage:
    # Connect laptop to iPIXEL WiFi AP, then:
    python tools/wifi_bridge.py                                    # defaults
    python tools/wifi_bridge.py --device-host 192.168.4.1 --device-port 80
    python tools/wifi_bridge.py --ws-port 9000                     # custom WS port

    # Then open preview.html and click "Connect WiFi"
"""
from __future__ import annotations

import argparse
import asyncio
import logging

import websockets
from websockets.asyncio.server import serve, ServerConnection

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
_LOG = logging.getLogger("wifi_bridge")

# Known opcodes for logging
OPCODES: dict[tuple[int, int], str] = {
    (0x07, 0x01): "POWER",
    (0x04, 0x80): "BRIGHTNESS",
    (0x06, 0x80): "ORIENTATION",
    (0x03, 0x80): "CLEAR",
    (0x08, 0x80): "SHOW/RESERVE_SLOT",
    (0x07, 0x80): "SELECT_SCREEN",
    (0x02, 0x01): "DELETE_SLOT",
    (0x01, 0x80): "SET_TIME/QUERY",
    (0x04, 0x01): "DIY_MODE",
    (0x05, 0x01): "PIXEL",
    (0x00, 0x02): "RHYTHM",
    (0x08, 0x01): "RHYTHM_LEVEL",
    (0x0B, 0x01): "ANIMATION_MODE",
    (0x0A, 0x01): "RAINBOW_MODE",
    (0x06, 0x01): "CLOCK_MODE",
    (0x0D, 0x80): "COUNTDOWN",
    (0x0A, 0x80): "SCOREBOARD",
    (0x09, 0x80): "STOPWATCH",
    (0x01, 0x01): "EXIT_MODE",
    (0x12, 0x80): "SET_WEEKDAY",
    (0x06, 0x00): "SPORT_DATA",
    (0x03, 0x01): "MULTICOLOR_TEXT",
    (0x0C, 0x01): "FONT_SIZE",
    (0x0D, 0x01): "FONT_OFFSET",
    (0x0E, 0x01): "POWER_SCHEDULE",
    (0x09, 0x01): "RHYTHM_ANIM",
}


def describe_command(data: bytes) -> str:
    """One-line description of a command for logging."""
    if len(data) < 4:
        return f"SHORT({len(data)}B)"

    # Check for windowed data (camera/image/gif/text)
    frame_len = int.from_bytes(data[0:2], "little")
    if frame_len == len(data) and len(data) > 15:
        data_type = int.from_bytes(data[2:4], "little")
        types = {0: "CAM", 2: "IMG", 3: "GIF", 4: "TXT", 7: "TPL"}
        option = "FIRST" if data[4] == 0 else "CONT"
        content_len = int.from_bytes(data[5:9], "little")
        return f"DATA:{types.get(data_type, '?')} {option} {len(data)-15}B/{content_len}B"

    op = (data[2], data[3])
    name = OPCODES.get(op, f"0x{data[2]:02X}{data[3]:02X}")
    return f"{name} ({len(data)}B)"


class WiFiBridge:
    """Bridges WebSocket connections to a raw TCP iPIXEL device."""

    def __init__(self, device_host: str, device_port: int, ws_port: int) -> None:
        self.device_host = device_host
        self.device_port = device_port
        self.ws_port = ws_port
        self._tcp_reader: asyncio.StreamReader | None = None
        self._tcp_writer: asyncio.StreamWriter | None = None
        self._tcp_connected = False
        self._stats = {"tx_bytes": 0, "rx_bytes": 0, "tx_cmds": 0, "rx_acks": 0}

    async def _tcp_connect(self) -> bool:
        """Connect to the iPIXEL device over TCP."""
        if self._tcp_connected:
            return True
        try:
            self._tcp_reader, self._tcp_writer = await asyncio.wait_for(
                asyncio.open_connection(self.device_host, self.device_port),
                timeout=5.0,
            )
            self._tcp_connected = True
            _LOG.info(
                "TCP connected to device at %s:%d",
                self.device_host, self.device_port,
            )
            return True
        except (asyncio.TimeoutError, OSError) as e:
            _LOG.error("TCP connect failed: %s", e)
            return False

    async def _tcp_disconnect(self) -> None:
        """Disconnect from the device."""
        if self._tcp_writer:
            try:
                self._tcp_writer.close()
                await self._tcp_writer.wait_closed()
            except Exception:
                pass
        self._tcp_reader = None
        self._tcp_writer = None
        self._tcp_connected = False
        _LOG.info("TCP disconnected from device")

    async def _handle_ws(self, ws: ServerConnection) -> None:
        """Handle a WebSocket client connection."""
        client = ws.remote_address
        _LOG.info("WebSocket client connected: %s", client)

        # Connect to device
        if not await self._tcp_connect():
            await ws.send(b"\x00")  # Error signal
            await ws.close()
            return

        # Send connection success signal
        await ws.send(b"\x01")  # OK signal
        _LOG.info("Bridge active: browser <-> %s:%d", self.device_host, self.device_port)

        # Start TCP reader task (device responses → browser)
        tcp_reader_task = asyncio.create_task(self._tcp_to_ws(ws))

        try:
            async for message in ws:
                if isinstance(message, bytes):
                    desc = describe_command(message)
                    _LOG.info("WS→TCP  %s  (%d bytes)", desc, len(message))
                    self._stats["tx_bytes"] += len(message)
                    self._stats["tx_cmds"] += 1

                    if self._tcp_writer and self._tcp_connected:
                        self._tcp_writer.write(message)
                        await self._tcp_writer.drain()
                    else:
                        _LOG.warning("TCP not connected, reconnecting...")
                        if await self._tcp_connect():
                            assert self._tcp_writer
                            self._tcp_writer.write(message)
                            await self._tcp_writer.drain()
                elif isinstance(message, str):
                    # Text message = control command
                    if message == "ping":
                        await ws.send("pong")
                    elif message == "status":
                        import json
                        await ws.send(json.dumps({
                            "connected": self._tcp_connected,
                            "device": f"{self.device_host}:{self.device_port}",
                            **self._stats,
                        }))
                    elif message == "disconnect":
                        await self._tcp_disconnect()
                        await ws.send(b"\x02")  # Disconnect signal
                        break
        except websockets.exceptions.ConnectionClosed:
            _LOG.info("WebSocket client disconnected: %s", client)
        finally:
            tcp_reader_task.cancel()
            try:
                await tcp_reader_task
            except asyncio.CancelledError:
                pass
            await self._tcp_disconnect()
            _LOG.info(
                "Session ended. TX: %d cmds (%d bytes), RX: %d acks (%d bytes)",
                self._stats["tx_cmds"], self._stats["tx_bytes"],
                self._stats["rx_acks"], self._stats["rx_bytes"],
            )

    async def _tcp_to_ws(self, ws: ServerConnection) -> None:
        """Forward device TCP responses to the WebSocket client."""
        try:
            while self._tcp_connected and self._tcp_reader:
                data = await asyncio.wait_for(
                    self._tcp_reader.read(4096), timeout=30.0
                )
                if not data:
                    _LOG.warning("TCP connection closed by device")
                    self._tcp_connected = False
                    break
                self._stats["rx_bytes"] += len(data)
                self._stats["rx_acks"] += 1
                _LOG.debug("TCP→WS  ACK (%d bytes): %s", len(data), data.hex())
                await ws.send(data)
        except asyncio.TimeoutError:
            pass  # No data from device, normal
        except asyncio.CancelledError:
            raise
        except Exception as e:
            _LOG.debug("TCP reader stopped: %s", e)

    async def start(self) -> None:
        """Start the WebSocket server."""
        _LOG.info("WiFi Bridge starting...")
        _LOG.info("  WebSocket:  ws://localhost:%d", self.ws_port)
        _LOG.info("  Device:     %s:%d", self.device_host, self.device_port)
        _LOG.info("  Open preview.html and click 'Connect WiFi'")
        print()

        async with serve(self._handle_ws, "localhost", self.ws_port):
            await asyncio.Future()  # Run forever


def main() -> None:
    parser = argparse.ArgumentParser(
        description="WebSocket-to-TCP bridge for iPIXEL WiFi control"
    )
    parser.add_argument(
        "--device-host", default="192.168.4.1",
        help="iPIXEL device IP (default: 192.168.4.1)",
    )
    parser.add_argument(
        "--device-port", type=int, default=80,
        help="iPIXEL device port (default: 80)",
    )
    parser.add_argument(
        "--ws-port", type=int, default=9001,
        help="WebSocket listen port (default: 9001)",
    )
    args = parser.parse_args()

    bridge = WiFiBridge(args.device_host, args.device_port, args.ws_port)
    try:
        asyncio.run(bridge.start())
    except KeyboardInterrupt:
        _LOG.info("Bridge stopped")


if __name__ == "__main__":
    main()
