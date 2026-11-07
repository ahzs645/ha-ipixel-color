"""Per-panel API for iPIXEL Color devices.

Every method raises an :class:`iPIXELError` subclass when the command cannot be
delivered, so callers (entities, services) can surface the problem instead of
silently ignoring it.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from PIL import Image
from pypixelcolor.lib.device_info import DeviceInfo

from .bluetooth.client import BluetoothClient
from .const import DEFAULT_ACK_TIMEOUT
from .device.clock import make_clock_mode_command, make_time_command
from .device.commands import (
    RAW_RGB_CHUNK_SIZE,
    group_pixels_by_color,
    make_batch_pixel_command,
    make_brightness_command,
    make_clear_command,
    make_default_mode_command,
    make_delete_slot_command,
    make_diy_mode_command,
    make_erase_data_command,
    make_fun_mode_command,
    make_mix_data_plan,
    make_mix_data_raw_plan,
    make_orientation_command,
    make_pixel_command,
    make_power_command,
    make_program_mode_command,
    make_raw_command,
    make_raw_rgb_chunk_command,
    make_rhythm_mode_advanced_command,
    make_rhythm_mode_command,
    make_screen_command,
    make_set_password_command,
    make_set_time_command,
    make_show_slot_command,
    make_upside_down_command,
    make_verify_password_command,
    split_rgb_into_chunks,
)
from .device.image import frames_to_gif_bytes, image_to_png_bytes, make_image_plan
from .device.info import device_info_to_dict
from .device.text import make_text_plan
from .exceptions import iPIXELCommandError, iPIXELConnectionError, iPIXELError, iPIXELTimeoutError

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

MAX_BATCH_POSITIONS = 118


class iPIXELAPI:
    """High level command API for one physical iPIXEL panel."""

    def __init__(
        self,
        hass: HomeAssistant,
        address: str,
        *,
        name: str | None = None,
        ack_timeout: float = DEFAULT_ACK_TIMEOUT,
        size_override: tuple[int, int] | None = None,
        chunk_size: int | None = None,
    ) -> None:
        """Initialise the API."""
        self._address = address
        self._name = name or address
        self._bluetooth = BluetoothClient(
            hass,
            address,
            name=self._name,
            ack_timeout=ack_timeout,
            size_override=size_override,
            chunk_size=chunk_size,
        )
        self._power_state: bool | None = None

    # ------------------------------------------------------------------
    # Connection / info
    # ------------------------------------------------------------------
    @property
    def address(self) -> str:
        """Return the Bluetooth address."""
        return self._address

    @property
    def name(self) -> str:
        """Return the configured device name."""
        return self._name

    @property
    def is_connected(self) -> bool:
        """Return True when the BLE link is up."""
        return self._bluetooth.is_connected

    @property
    def power_state(self) -> bool | None:
        """Return the last power state we sent (None if unknown)."""
        return self._power_state

    @property
    def device_info(self) -> DeviceInfo | None:
        """Return the cached device info."""
        return self._bluetooth.device_info

    @property
    def width(self) -> int | None:
        """Return the panel width in pixels, if known."""
        info = self.device_info
        return info.width if info else None

    @property
    def height(self) -> int | None:
        """Return the panel height in pixels, if known."""
        info = self.device_info
        return info.height if info else None

    def add_reconnect_listener(self, listener) -> Any:
        """Register a callback for automatic reconnects (panel came back after a dropped link)."""
        return self._bluetooth.async_add_reconnect_listener(listener)

    def add_connection_listener(self, listener) -> Any:
        """Register a callback for connection state changes."""
        return self._bluetooth.async_add_listener(listener)

    async def connect(self) -> DeviceInfo:
        """Connect to the panel (no-op when already connected)."""
        return await self._bluetooth.async_connect()

    async def disconnect(self) -> None:
        """Disconnect from the panel."""
        await self._bluetooth.async_disconnect()

    async def get_device_info(self) -> dict[str, Any]:
        """Return device information as a dictionary (connects if needed)."""
        info = await self._require_device_info()
        return device_info_to_dict(info)

    async def _require_device_info(self) -> DeviceInfo:
        info = self.device_info
        if info is None:
            info = await self.connect()
        return info

    async def _send(self, plan_id: str, payload: bytes, *, requires_ack: bool = False) -> None:
        await self._bluetooth.async_send_command(plan_id, payload, requires_ack=requires_ack)

    async def _send_plan(self, plan) -> None:
        await self._bluetooth.async_send_plan(plan)

    @staticmethod
    def _build(builder, *args, **kwargs) -> bytes:
        try:
            return builder(*args, **kwargs)
        except ValueError as err:
            raise iPIXELCommandError(str(err)) from err

    # ------------------------------------------------------------------
    # Basic device control
    # ------------------------------------------------------------------
    async def set_power(self, on: bool) -> None:
        """Turn the panel on or off."""
        await self._send("set_power", make_power_command(on))
        self._power_state = on

    async def set_brightness(self, brightness: int) -> None:
        """Set brightness (1-100)."""
        await self._send("set_brightness", self._build(make_brightness_command, int(brightness)))

    async def set_orientation(self, orientation: int) -> None:
        """Set orientation (0=0deg, 1=90deg, 2=180deg, 3=270deg)."""
        await self._send("set_orientation", self._build(make_orientation_command, int(orientation)))

    async def set_upside_down(self, upside_down: bool) -> None:
        """Flip the panel 180 degrees."""
        await self._send("set_upside_down", make_upside_down_command(upside_down))

    async def sync_time(self) -> None:
        """Send the current time to the panel."""
        await self._send("set_time", make_time_command())

    async def set_time(self, hour: int, minute: int, second: int = 0) -> None:
        """Set a specific time on the panel."""
        await self._send("set_time", self._build(make_set_time_command, hour, minute, second))

    async def clear_display(self) -> None:
        """Clear the panel (keeps power state)."""
        await self._send("clear_display", make_clear_command())

    async def set_default_mode(self) -> None:
        """Reset the panel to its factory default display mode."""
        await self._send("set_default_mode", make_default_mode_command())

    async def set_fun_mode(self, enable: bool) -> None:
        """Enable/disable fun mode (required for pixel control)."""
        await self._send("set_fun_mode", make_fun_mode_command(enable))

    async def set_diy_mode(self, mode: int | bool) -> None:
        """Set DIY mode (0-3)."""
        await self._send("set_diy_mode", self._build(make_diy_mode_command, mode))

    async def set_screen(self, screen: int) -> None:
        """Select the visible screen buffer (1-9)."""
        await self._send("set_screen", self._build(make_screen_command, int(screen)))

    async def show_slot(self, slot: int) -> None:
        """Show stored content from a slot (0-255)."""
        await self._send("show_slot", self._build(make_show_slot_command, int(slot)))

    async def delete_slot(self, slot: int) -> None:
        """Delete stored content from a slot (0-255)."""
        await self._send("delete_slot", self._build(make_delete_slot_command, int(slot)))

    async def erase_data(self, buffers: list[int] | None = None, erase_all: bool = False) -> None:
        """Erase stored buffers from the panel."""
        await self._send("erase_data", self._build(make_erase_data_command, buffers, erase_all))

    async def set_program_mode(self, buffers: list[int]) -> None:
        """Cycle through stored screens."""
        await self._send("set_program_mode", self._build(make_program_mode_command, buffers))

    async def send_raw_command(self, hex_data: str) -> None:
        """Send raw bytes (expert use)."""
        await self._send("send_raw_command", self._build(make_raw_command, hex_data))

    async def set_password(self, enabled: bool, password: str) -> None:
        """Enable/disable password protection."""
        await self._send("set_password", self._build(make_set_password_command, enabled, password))

    async def verify_password(self, password: str) -> None:
        """Verify the panel password."""
        await self._send("verify_password", self._build(make_verify_password_command, password))

    # ------------------------------------------------------------------
    # Modes
    # ------------------------------------------------------------------
    async def set_clock_mode(
        self,
        style: int = 1,
        date: str = "",
        show_date: bool = True,
        format_24: bool = True,
    ) -> None:
        """Switch the panel to clock mode and sync the time."""
        payload = self._build(make_clock_mode_command, int(style), date, show_date, format_24)
        await self._send("set_clock_mode", payload)
        await self.sync_time()

    async def set_rhythm_mode(self, style: int, speed: int = 4) -> None:
        """Switch the panel to the music visualiser."""
        payload = self._build(make_rhythm_mode_command, int(style), int(speed))
        await self._send("set_rhythm_mode", payload, requires_ack=True)

    async def set_rhythm_mode_advanced(self, style: int, levels: list[int]) -> None:
        """Rhythm mode with 11 explicit band levels."""
        payload = self._build(make_rhythm_mode_advanced_command, int(style), levels)
        await self._send("set_rhythm_mode", payload)

    async def display_text_native(
        self,
        text: str,
        *,
        color: str = "ffffff",
        bg_color: str | None = None,
        font: str = "UNIFONT",
        animation: int = 0,
        speed: int = 80,
        rainbow_mode: int = 0,
        char_height: int | None = None,
        save_slot: int = 0,
    ) -> None:
        """Send text that the panel renders itself (with scroll/blink effects)."""
        info = await self._require_device_info()
        try:
            plan = make_text_plan(
                text=text,
                color=color,
                bg_color=bg_color,
                font=font,
                animation=animation,
                speed=speed,
                rainbow_mode=rainbow_mode,
                save_slot=save_slot,
                char_height=char_height,
                device_info=info,
            )
        except (ValueError, FileNotFoundError) as err:
            raise iPIXELCommandError(f"Cannot build text command: {err}") from err
        await self._send_plan(plan)

    # ------------------------------------------------------------------
    # Images
    # ------------------------------------------------------------------
    async def display_image(self, image: Image.Image, *, save_slot: int = 0) -> None:
        """Show a still image (resized/cropped to the panel)."""
        info = await self._require_device_info()
        if image.size != (info.width, info.height):
            image = _fit_image(image, info.width, info.height)
        png = image_to_png_bytes(image)
        plan = make_image_plan(png, ".png", "crop", info, save_slot)
        await self._send_plan(plan)

    async def display_gif_frames(
        self,
        frames: list[Image.Image],
        durations: list[int],
        *,
        loop: int = 0,
        save_slot: int = 0,
    ) -> None:
        """Show an animation from decoded frames (resized to the panel)."""
        info = await self._require_device_info()
        sized = [
            frame if frame.size == (info.width, info.height) else _fit_image(frame, info.width, info.height)
            for frame in frames
        ]
        gif = frames_to_gif_bytes(sized, durations, loop)
        plan = make_image_plan(gif, ".gif", "crop", info, save_slot)
        await self._send_plan(plan)

    async def display_image_bytes(
        self,
        image_bytes: bytes,
        file_extension: str = ".png",
        *,
        resize_method: str = "crop",
        save_slot: int = 0,
    ) -> None:
        """Upload an encoded image/GIF file as-is (pypixelcolor resizes it)."""
        info = await self._require_device_info()
        try:
            plan = make_image_plan(image_bytes, file_extension, resize_method, info, save_slot)
        except Exception as err:  # PIL / pypixelcolor decoding errors
            raise iPIXELCommandError(f"Cannot process image: {err}") from err
        await self._send_plan(plan)

    async def display_frame(self, image: Image.Image, brightness: int = 100) -> None:
        """Stream a frame using the raw RGB (camera) protocol - fast, not stored."""
        info = await self._require_device_info()
        if image.mode != "RGB":
            image = image.convert("RGB")
        if image.size != (info.width, info.height):
            image = image.resize((info.width, info.height), Image.Resampling.NEAREST)
        await self._send_rgb(image.tobytes(), brightness)

    async def draw_solid_color(self, color: str) -> None:
        """Fill the panel with a single colour."""
        info = await self._require_device_info()
        color = color.lstrip("#")
        if len(color) != 6:
            raise iPIXELCommandError("Color must be 6 hex characters")
        try:
            rgb = bytes.fromhex(color)
        except ValueError as err:
            raise iPIXELCommandError(f"Invalid color {color}") from err
        await self._send_rgb(rgb * (info.width * info.height), 100)

    async def _send_rgb(self, rgb_data: bytes, brightness: int) -> None:
        chunks = split_rgb_into_chunks(rgb_data, RAW_RGB_CHUNK_SIZE)
        for index, chunk in enumerate(chunks):
            payload = make_raw_rgb_chunk_command(
                chunk_data=chunk,
                total_rgb_data=rgb_data,
                chunk_index=index,
                brightness=brightness,
            )
            await self._send("send_raw_rgb", payload)

    # ------------------------------------------------------------------
    # Pixels
    # ------------------------------------------------------------------
    async def set_pixel(self, x: int, y: int, color: str) -> None:
        """Set one pixel (fun mode must be enabled)."""
        await self._send("set_pixel", self._build(make_pixel_command, int(x), int(y), color))

    async def set_pixels(self, pixels: list[dict]) -> None:
        """Set several pixels, batched per colour."""
        groups = group_pixels_by_color(pixels)
        if not groups:
            raise iPIXELCommandError("No valid pixels supplied")
        for (r, g, b), positions in groups.items():
            for start in range(0, len(positions), MAX_BATCH_POSITIONS):
                chunk = positions[start : start + MAX_BATCH_POSITIONS]
                await self._send("set_pixels_batch", make_batch_pixel_command(r, g, b, chunk))

    # ------------------------------------------------------------------
    # Mixed data
    # ------------------------------------------------------------------
    async def send_mix_data(self, blocks: list[tuple[bytes, bytes]], screen_slot: int = 1) -> None:
        """Send combined PNG/GIF/TEXT blocks."""
        await self._send_plan(self._build(make_mix_data_plan, blocks, screen_slot))

    async def send_mix_data_raw(self, raw_hex_data: str, screen_slot: int = 1) -> None:
        """Send pre-built mixed data from a hex string."""
        try:
            raw = bytes.fromhex(raw_hex_data.replace(" ", ""))
        except ValueError as err:
            raise iPIXELCommandError(f"Invalid hex data: {err}") from err
        await self._send_plan(self._build(make_mix_data_raw_plan, raw, screen_slot))


def _fit_image(image: Image.Image, width: int, height: int) -> Image.Image:
    """Resize with nearest-neighbour sampling (pixel art friendly) and crop to size."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    scale = max(width / image.width, height / image.height)
    new_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(new_size, Image.Resampling.NEAREST)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


__all__ = [
    "iPIXELAPI",
    "iPIXELError",
    "iPIXELConnectionError",
    "iPIXELTimeoutError",
    "iPIXELCommandError",
]
