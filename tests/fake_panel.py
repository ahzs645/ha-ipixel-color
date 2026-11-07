"""A simulated iPIXEL panel speaking the BLE protocol."""
from __future__ import annotations

import asyncio
import io
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from PIL import Image

# Device type bytes from pypixelcolor's DEVICE_TYPE_MAP
DEVICE_TYPE_64X16 = 131
DEVICE_TYPE_32X32 = 129
DEVICE_TYPE_64X64 = 128
DEVICE_TYPE_96X16 = 132


@dataclass
class Frame:
    """One protocol frame received by the panel."""

    data: bytes

    @property
    def command(self) -> tuple[int, int]:
        return (self.data[2], self.data[3])


@dataclass
class FakePanel:
    """Simulates one panel; records every frame it receives."""

    address: str
    device_type: int = DEVICE_TYPE_64X16
    frames: list[Frame] = field(default_factory=list)
    buffer: bytes = b""
    notify_handler: Callable[[Any, bytearray], None] | None = None
    is_connected: bool = False
    mtu_size: int = 247
    disconnected_callback: Callable[[Any], None] | None = None
    fail_connect: bool = False
    connect_count: int = 0
    max_write: int | None = None
    rejected_writes: int = 0

    # --- BleakClient interface -------------------------------------------------
    async def start_notify(self, uuid: str, handler) -> None:
        self.notify_handler = handler

    async def stop_notify(self, uuid: str) -> None:
        self.notify_handler = None

    async def disconnect(self) -> None:
        self.is_connected = False

    async def write_gatt_char(self, uuid: str, data: bytes, response: bool = True) -> None:
        from bleak.exc import BleakError

        if not self.is_connected:
            raise BleakError("Not connected")
        if self.max_write is not None and len(data) > self.max_write:
            # A proxy drops the link when a write is too large for the panel.
            self.rejected_writes += 1
            self.is_connected = False
            if self.disconnected_callback is not None:
                self.disconnected_callback(self)
            raise BleakError("Bluetooth GATT Error handle=6 error=133 description=Error")
        self.buffer += bytes(data)
        while len(self.buffer) >= 2:
            frame_len = int.from_bytes(self.buffer[:2], "little")
            if frame_len < 2 or len(self.buffer) < frame_len:
                break
            frame = self.buffer[:frame_len]
            self.buffer = self.buffer[frame_len:]
            self._handle_frame(frame)

    # --- protocol simulation ---------------------------------------------------
    def _notify(self, data: bytes) -> None:
        handler = self.notify_handler
        if handler is None:
            return
        asyncio.get_running_loop().call_soon(handler, None, bytearray(data))

    def _handle_frame(self, frame: bytes) -> None:
        self.frames.append(Frame(frame))
        cmd = (frame[2], frame[3])
        if cmd == (1, 0x80):
            # get device info / set time -> respond with device info
            self._notify(bytes([0x0B, 0x00, 0x01, 0x80, self.device_type, 1, 0, 1, 0, 0, 0xFF]))
            return
        # Multi-window uploads ([cmd][option][size4][crc4][tail2]) and commands
        # that require an ACK: acknowledge the window and the whole transfer.
        if cmd in ((0x02, 0x00), (0x03, 0x00), (0x00, 0x01), (0x04, 0x00), (0x01, 0x02), (0x00, 0x02)):
            self._notify(bytes([0x05, 0x00, cmd[0], cmd[1], 0x01]))
            self._notify(bytes([0x05, 0x00, cmd[0], cmd[1], 0x03]))

    # --- helpers for assertions ---------------------------------------------------
    def frames_for(self, command: tuple[int, int]) -> list[Frame]:
        return [f for f in self.frames if f.command == command]

    def clear(self) -> None:
        self.frames.clear()

    def uploaded_payload(self, command: tuple[int, int]) -> bytes:
        """Reassemble the payload of a (possibly multi window) upload."""
        payload = b""
        for frame in self.frames_for(command):
            # [len2][cmd2][option1][size4][crc4][tail2][chunk]
            payload += frame.data[15:]
        return payload

    def last_image(self) -> Image.Image | None:
        payload = self.uploaded_payload((0x02, 0x00))
        if not payload:
            return None
        return Image.open(io.BytesIO(payload)).convert("RGB")

    def last_gif_frames(self) -> list[Image.Image]:
        from PIL import ImageSequence

        payload = self.uploaded_payload((0x03, 0x00))
        if not payload:
            return []
        image = Image.open(io.BytesIO(payload))
        return [frame.convert("RGB") for frame in ImageSequence.Iterator(image)]


class FakeBluetooth:
    """Registry of fake panels used by the patched connection helpers."""

    def __init__(self) -> None:
        self.panels: dict[str, FakePanel] = {}
        self.callbacks: dict[str, list] = {}

    def register_callback(self, hass, callback, matcher, mode):
        """Stand-in for bluetooth.async_register_callback."""
        address = matcher["address"]
        self.callbacks.setdefault(address, []).append(callback)

        def _unsub() -> None:
            if callback in self.callbacks.get(address, []):
                self.callbacks[address].remove(callback)

        return _unsub

    def advertise(self, address: str) -> None:
        """Simulate an advertisement of a panel reaching Home Assistant."""
        for callback in list(self.callbacks.get(address, [])):
            callback(None, None)

    def add(self, address: str, device_type: int = DEVICE_TYPE_64X16) -> FakePanel:
        panel = FakePanel(address=address, device_type=device_type)
        self.panels[address] = panel
        return panel

    def ble_device(self, hass, address: str, connectable: bool = True):
        import inspect

        from bleak.backends.device import BLEDevice

        if address not in self.panels:
            return None
        name = f"LED_BLE_{address[-5:]}"
        # bleak < 1.0 requires a positional ``rssi``; bleak >= 1.0 dropped it
        # and 3.x rejects it, so only pass it when the constructor accepts it.
        if "rssi" in inspect.signature(BLEDevice.__init__).parameters:
            return BLEDevice(address, name, {}, -60)
        return BLEDevice(address, name, {})

    async def establish_connection(self, client_class, device, name, disconnected_callback=None, **kwargs):
        from bleak.exc import BleakError

        panel = self.panels[device.address]
        panel.connect_count += 1
        if panel.fail_connect:
            raise BleakError("simulated connection failure")
        panel.is_connected = True
        panel.buffer = b""
        panel.disconnected_callback = disconnected_callback
        return panel
