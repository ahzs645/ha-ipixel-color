"""iPIXEL Color Bluetooth API client - Refactored version."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, TYPE_CHECKING
from bleak.exc import BleakError

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from .const import NOTIFY_UUID, WRITE_UUID
from .bluetooth.client import BluetoothClient
from .device.commands import (
    make_power_command,
    make_brightness_command,
    make_orientation_command,
    make_rhythm_mode_command,
    make_fun_mode_command,
    make_pixel_command,
    make_clear_command,
    make_show_slot_command,
    make_delete_slot_command,
    make_set_time_command,
    make_upside_down_command,
    make_default_mode_command,
    make_erase_data_command,
    make_program_mode_command,
    make_rhythm_mode_advanced_command,
    make_screen_command,
    make_diy_mode_command,
    make_raw_command,
    make_set_password_command,
    make_verify_password_command,
    make_mix_data_command,
    make_mix_data_raw_command,
    make_mix_block_header,
    MIX_BLOCK_TYPE_TEXT,
    MIX_BLOCK_TYPE_GIF,
    MIX_BLOCK_TYPE_PNG,
    # Batch pixel commands (from go-ipxl)
    make_batch_pixel_command,
    group_pixels_by_color,
    # Raw RGB camera protocol (from go-ipxl)
    make_raw_rgb_chunk_command,
    split_rgb_into_chunks,
    image_to_rgb_bytes,
    RAW_RGB_CHUNK_SIZE,
)
from .device.clock import make_clock_mode_command, make_time_command
from .device.text import make_text_command
from .device.image import make_image_command
from .device.gif import make_gif_windows, extract_and_process_gif, get_gif_frame_count
from .device.info import build_device_info_command, parse_device_response
from .display.text_renderer import render_text_to_png
from .display.effects import apply_effect
from .exceptions import iPIXELConnectionError

_LOGGER = logging.getLogger(__name__)


class iPIXELAPI:
    """iPIXEL Color device API client - simplified facade."""

    def __init__(self, hass: HomeAssistant, address: str) -> None:
        """Initialize the API client.

        Args:
            hass: Home Assistant instance
            address: Bluetooth MAC address
        """
        self._address = address
        self._bluetooth = BluetoothClient(hass, address)
        self._power_state = True  # Assume on until we check
        self._device_info: dict[str, Any] | None = None
        self._device_response: bytes | None = None
        # Frame diffing support for draw_visuals
        self._last_frame_bytes: bytes | None = None
        self._last_frame_png: bytes | None = None
        
    async def connect(self) -> bool:
        """Connect to the iPIXEL device."""
        return await self._bluetooth.connect(self._notification_handler)
    
    async def disconnect(self) -> None:
        """Disconnect from the device."""
        await self._bluetooth.disconnect()
    
    async def set_power(self, on: bool) -> bool:
        """Set device power state."""
        command = make_power_command(on)
        success = await self._bluetooth.send_command(command)
        
        if success:
            self._power_state = on
            _LOGGER.debug("Power set to %s", "ON" if on else "OFF")
        return success
    
    async def set_brightness(self, brightness: int) -> bool:
        """Set device brightness level.
        
        Args:
            brightness: Brightness level from 1 to 100
            
        Returns:
            True if command was sent successfully
        """
        try:
            command = make_brightness_command(brightness)
            success = await self._bluetooth.send_command(command)
            
            if success:
                _LOGGER.debug("Brightness set to %d", brightness)
            else:
                _LOGGER.error("Failed to set brightness to %d", brightness)
            return success
            
        except ValueError as err:
            _LOGGER.error("Invalid brightness value: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting brightness: %s", err)
            return False

    async def sync_time(self) -> bool:
        """Sync current time to the device.

        This is useful for keeping the clock display accurate,
        especially after the device has been running for a while.

        Returns:
            True if time was synced successfully
        """
        try:
            time_command = make_time_command()
            success = await self._bluetooth.send_command(time_command)

            if success:
                _LOGGER.debug("Time synchronized to device")
            else:
                _LOGGER.error("Failed to sync time")
            return success

        except Exception as err:
            _LOGGER.error("Error syncing time: %s", err)
            return False

    async def set_orientation(self, orientation: int) -> bool:
        """Set display orientation.

        Args:
            orientation: 0=normal, 1=90°, 2=180°, 3=270°

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_orientation_command(orientation)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.debug("Orientation set to %d", orientation)
            else:
                _LOGGER.error("Failed to set orientation to %d", orientation)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid orientation value: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting orientation: %s", err)
            return False

    async def set_rhythm_mode(self, style: int, speed: int = 4) -> bool:
        """Set rhythm/music visualizer mode.

        Args:
            style: Rhythm style 0-4 (5 different visualizer styles)
            speed: Animation speed 0-7 (8 speed levels)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_rhythm_mode_command(style, speed)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Rhythm mode set: style=%d, speed=%d", style, speed)
            else:
                _LOGGER.error("Failed to set rhythm mode")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid rhythm mode parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting rhythm mode: %s", err)
            return False

    async def set_fun_mode(self, enable: bool) -> bool:
        """Enable or disable fun mode (required for pixel control).

        Args:
            enable: True to enable fun mode, False to disable

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_fun_mode_command(enable)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.debug("Fun mode %s", "enabled" if enable else "disabled")
            else:
                _LOGGER.error("Failed to set fun mode")
            return success

        except Exception as err:
            _LOGGER.error("Error setting fun mode: %s", err)
            return False

    async def set_pixel(self, x: int, y: int, color: str) -> bool:
        """Set a single pixel color.

        Note: Fun mode must be enabled first for this to work.

        Args:
            x: X coordinate (0 to width-1)
            y: Y coordinate (0 to height-1)
            color: Hex color string (e.g., 'ff0000' for red)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_pixel_command(x, y, color)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.debug("Pixel set at (%d, %d) to #%s", x, y, color)
            else:
                _LOGGER.error("Failed to set pixel at (%d, %d)", x, y)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid pixel parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting pixel: %s", err)
            return False

    async def set_pixels(self, pixels: list[dict]) -> bool:
        """Set multiple pixels at once (sends one command per pixel).

        Note: Fun mode must be enabled first for this to work.
        For better performance with many pixels, use set_pixels_batched() instead.

        Args:
            pixels: List of dicts with 'x', 'y', and 'color' keys

        Returns:
            True if all commands were sent successfully
        """
        try:
            all_success = True
            for pixel in pixels:
                x = pixel.get('x', 0)
                y = pixel.get('y', 0)
                color = pixel.get('color', 'ffffff')
                success = await self.set_pixel(x, y, color)
                if not success:
                    all_success = False

            if all_success:
                _LOGGER.debug("Set %d pixels successfully", len(pixels))
            else:
                _LOGGER.warning("Some pixels failed to set")
            return all_success

        except Exception as err:
            _LOGGER.error("Error setting pixels: %s", err)
            return False

    async def set_pixels_batched(self, pixels: list[dict]) -> bool:
        """Set multiple pixels using batched commands grouped by color.

        This is more efficient than set_pixels() when drawing shapes or patterns
        because it groups pixels by color and sends them in batches, reducing
        the number of BLE round-trips.

        Based on go-ipxl's rawSendPixels implementation.

        Note: Fun mode must be enabled first for this to work.

        Args:
            pixels: List of dicts with 'x', 'y', and 'color' keys
                    color can be hex string ('ff0000') or RGB tuple (255, 0, 0)

        Returns:
            True if all commands were sent successfully
        """
        try:
            # Group pixels by color
            color_groups = group_pixels_by_color(pixels)

            if not color_groups:
                _LOGGER.warning("No valid pixels to set")
                return False

            all_success = True
            total_pixels = 0

            for (r, g, b), positions in color_groups.items():
                # Skip black pixels (they're "off")
                if r == 0 and g == 0 and b == 0:
                    continue

                # Split into chunks if too many positions (max ~118 per packet)
                MAX_POSITIONS = 118
                for i in range(0, len(positions), MAX_POSITIONS):
                    chunk_positions = positions[i:i + MAX_POSITIONS]

                    command = make_batch_pixel_command(r, g, b, chunk_positions)
                    success = await self._bluetooth.send_command(command)

                    if not success:
                        _LOGGER.error(
                            "Failed to send batch pixel command for color #%02x%02x%02x",
                            r, g, b
                        )
                        all_success = False
                    else:
                        total_pixels += len(chunk_positions)

            if all_success:
                _LOGGER.info(
                    "Set %d pixels in %d color groups (batched)",
                    total_pixels, len(color_groups)
                )
            else:
                _LOGGER.warning("Some batched pixel commands failed")

            return all_success

        except Exception as err:
            _LOGGER.error("Error setting batched pixels: %s", err)
            return False

    async def display_image_raw_rgb(
        self,
        image_bytes: bytes,
        file_extension: str = ".png",
        brightness: int = 100
    ) -> bool:
        """Display image using raw RGB protocol (camera mode).

        This sends the image as raw RGB bytes in 12KB chunks, which can be
        faster than PNG encoding for real-time applications like camera feeds
        or live animations.

        Based on go-ipxl's SendImage implementation.

        Args:
            image_bytes: Raw image file bytes (PNG, JPEG, etc.)
            file_extension: Image format hint for decoding
            brightness: Brightness level 1-100 (applied to RGB data)

        Returns:
            True if image was sent successfully
        """
        try:
            # Get device dimensions
            device_info = await self.get_device_info()
            width = device_info["width"]
            height = device_info["height"]

            # Convert image to raw RGB bytes
            rgb_data = image_to_rgb_bytes(image_bytes, width, height, file_extension)

            expected_size = width * height * 3
            if len(rgb_data) != expected_size:
                _LOGGER.error(
                    "RGB data size mismatch: expected %d, got %d",
                    expected_size, len(rgb_data)
                )
                return False

            # Split into chunks
            chunks = split_rgb_into_chunks(rgb_data, RAW_RGB_CHUNK_SIZE)

            _LOGGER.debug(
                "Sending raw RGB image: %dx%d (%d bytes, %d chunks)",
                width, height, len(rgb_data), len(chunks)
            )

            # Send each chunk
            for i, chunk in enumerate(chunks):
                command = make_raw_rgb_chunk_command(
                    chunk_data=chunk,
                    total_rgb_data=rgb_data,
                    chunk_index=i,
                    brightness=brightness
                )

                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send RGB chunk %d/%d", i + 1, len(chunks))
                    return False

            _LOGGER.info(
                "Raw RGB image sent: %dx%d, %d bytes, %d chunks",
                width, height, len(rgb_data), len(chunks)
            )
            return True

        except Exception as err:
            _LOGGER.error("Error displaying raw RGB image: %s", err)
            return False

    async def display_image_raw_rgb_url(
        self,
        url: str,
        brightness: int = 100
    ) -> bool:
        """Download and display image using raw RGB protocol.

        Args:
            url: URL to image file
            brightness: Brightness level 1-100

        Returns:
            True if image was sent successfully
        """
        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status != 200:
                        _LOGGER.error("Failed to download image: HTTP %d", response.status)
                        return False

                    image_bytes = await response.read()
                    content_type = response.headers.get('Content-Type', '')

            # Determine file extension from content type or URL
            if 'png' in content_type or url.lower().endswith('.png'):
                file_ext = '.png'
            elif 'jpeg' in content_type or 'jpg' in content_type or url.lower().endswith(('.jpg', '.jpeg')):
                file_ext = '.jpg'
            else:
                file_ext = '.png'  # Default to PNG

            _LOGGER.debug("Downloaded image from %s (%d bytes)", url, len(image_bytes))
            return await self.display_image_raw_rgb(image_bytes, file_ext, brightness)

        except Exception as err:
            _LOGGER.error("Error downloading image from %s: %s", url, err)
            return False

    async def display_frame_with_diff(
        self,
        frame: "Image.Image",
        brightness: int = 100
    ) -> bool:
        """Display frame only if different from last frame (frame diffing).

        Compares the new frame with the previously sent frame to avoid
        redundant BLE transmissions. Stores the frame for camera preview.

        Args:
            frame: PIL Image to display (RGB mode)
            brightness: Brightness level 1-100

        Returns:
            True if frame was sent or skipped (unchanged), False on error
        """
        try:
            from PIL import Image
            import io

            # Ensure RGB mode
            if frame.mode != "RGB":
                frame = frame.convert("RGB")

            # Get frame bytes for comparison
            frame_bytes = frame.tobytes()

            # Check if frame has changed
            if frame_bytes == self._last_frame_bytes:
                _LOGGER.debug("Frame unchanged, skipping BLE send")
                return True

            # Convert to PNG for storage and sending
            png_buffer = io.BytesIO()
            frame.save(png_buffer, format="PNG")
            png_bytes = png_buffer.getvalue()

            # Store for frame diffing and camera preview
            self._last_frame_bytes = frame_bytes
            self._last_frame_png = png_bytes

            # Send via raw RGB protocol (faster for animations)
            return await self.display_image_raw_rgb(png_bytes, ".png", brightness)

        except Exception as err:
            _LOGGER.error("Error displaying frame with diff: %s", err)
            return False

    def get_last_frame_png(self) -> bytes | None:
        """Get last rendered frame as PNG bytes for camera preview.

        Returns:
            PNG image bytes or None if no frame has been sent
        """
        return self._last_frame_png

    def clear_frame_cache(self) -> None:
        """Clear the frame diffing cache.

        Call this when starting a new animation or clearing the display.
        """
        self._last_frame_bytes = None
        self._last_frame_png = None

    async def draw_solid_color(self, color: str) -> bool:
        """Fill the entire display with a solid color using raw RGB protocol.

        This is faster than setting each pixel individually.

        Args:
            color: Hex color string (e.g., 'ff0000' for red)

        Returns:
            True if command was sent successfully
        """
        try:
            # Parse color
            color = color.lstrip('#')
            if len(color) != 6:
                raise ValueError("Color must be 6 hex characters")
            r = int(color[0:2], 16)
            g = int(color[2:4], 16)
            b = int(color[4:6], 16)

            # Get device dimensions
            device_info = await self.get_device_info()
            width = device_info["width"]
            height = device_info["height"]

            # Create solid color RGB data
            total_pixels = width * height
            rgb_data = bytes([r, g, b] * total_pixels)

            # Split into chunks and send
            chunks = split_rgb_into_chunks(rgb_data, RAW_RGB_CHUNK_SIZE)

            for i, chunk in enumerate(chunks):
                command = make_raw_rgb_chunk_command(
                    chunk_data=chunk,
                    total_rgb_data=rgb_data,
                    chunk_index=i,
                    brightness=100
                )
                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send solid color chunk %d/%d", i + 1, len(chunks))
                    return False

            _LOGGER.info("Filled display with color #%s", color)
            return True

        except ValueError as err:
            _LOGGER.error("Invalid color: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error drawing solid color: %s", err)
            return False

    async def clear_display(self) -> bool:
        """Clear the display (blank screen).

        This blanks the screen without affecting power state.

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_clear_command()
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.debug("Display cleared")
            else:
                _LOGGER.error("Failed to clear display")
            return success

        except Exception as err:
            _LOGGER.error("Error clearing display: %s", err)
            return False

    async def show_slot(self, slot: int) -> bool:
        """Display content from a stored slot.

        Args:
            slot: Slot number to display (0-255)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_show_slot_command(slot)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Showing slot %d", slot)
            else:
                _LOGGER.error("Failed to show slot %d", slot)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid slot number: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error showing slot: %s", err)
            return False

    async def delete_slot(self, slot: int) -> bool:
        """Delete content from a stored slot.

        Args:
            slot: Slot index to delete (0-255)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_delete_slot_command(slot)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Deleted slot %d", slot)
            else:
                _LOGGER.error("Failed to delete slot %d", slot)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid slot number: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error deleting slot: %s", err)
            return False

    async def set_time(self, hour: int, minute: int, second: int) -> bool:
        """Set specific time on device.

        Args:
            hour: Hour (0-23)
            minute: Minute (0-59)
            second: Second (0-59)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_set_time_command(hour, minute, second)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Time set to %02d:%02d:%02d", hour, minute, second)
            else:
                _LOGGER.error("Failed to set time")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid time value: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting time: %s", err)
            return False

    async def set_clock_mode(
        self,
        style: int = 1,
        date: str = "",
        show_date: bool = True,
        format_24: bool = True
    ) -> bool:
        """Set device to clock display mode.

        Args:
            style: Clock style (0-8)
            date: Date in DD/MM/YYYY format (defaults to today)
            show_date: Whether to show the date
            format_24: Whether to use 24-hour format

        Returns:
            True if command was sent successfully
        """
        try:
            # Set clock mode
            command = make_clock_mode_command(style, date, show_date, format_24)
            success = await self._bluetooth.send_command(command)

            if not success:
                _LOGGER.error("Failed to set clock mode")
                return False

            _LOGGER.info("Clock mode set: style=%d, 24h=%s, show_date=%s",
                       style, format_24, show_date)

            # Sync current time to the device
            time_success = await self.sync_time()
            if not time_success:
                _LOGGER.warning("Clock mode set but time sync failed")

            return success

        except ValueError as err:
            _LOGGER.error("Invalid clock mode parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting clock mode: %s", err)
            return False
    
    async def get_device_info(self) -> dict[str, Any] | None:
        """Query device information and store it."""
        if self._device_info is not None:
            return self._device_info
            
        try:
            command = build_device_info_command()
            
            # Set up notification response
            self._device_response = None
            response_received = asyncio.Event()
            
            def response_handler(sender: Any, data: bytearray) -> None:
                self._device_response = bytes(data)
                response_received.set()
            
            try:
                # Ensure notifications are stopped before starting new ones
                await self._bluetooth._client.stop_notify(
                    NOTIFY_UUID
                )
            except (KeyError, BleakError):
                pass

            try:
                # Enable notifications temporarily
                await self._bluetooth._client.start_notify(
                    NOTIFY_UUID, response_handler
                )
            except Exception as err:
                _LOGGER.error("Failed to start notifications for device info: %s", err)
            
            try:
                # Send command
                await self._bluetooth._client.write_gatt_char(
                    WRITE_UUID, command
                )
                _LOGGER.debug("Device info command sent, waiting for response...")
                
                # Wait for response (5 second timeout)
                await asyncio.wait_for(response_received.wait(), timeout=5.0)
                _LOGGER.debug("Device info response received: %s", self._device_response)
                
                if self._device_response:
                    self._device_info = parse_device_response(self._device_response)
                else:
                    raise Exception("No response received")
                    
            finally:
                await self._bluetooth._client.stop_notify(
                    NOTIFY_UUID
                )
                # Reset response handler to default for future notifications
                await self._bluetooth._client.start_notify(
                    NOTIFY_UUID, self._notification_handler
                )
            
            _LOGGER.info("Device info retrieved: %s", self._device_info)
            return self._device_info
            
        except Exception as err:
            _LOGGER.error("Failed to get device info: %s", err)
            # Return default values
            self._device_info = {
                "width": 32,
                "height": 32,
                "device_type": 0,
                "device_type_str": "Unknown",
                "led_type": 0,
                "mcu_version": "Unknown",
                "wifi_version": "Unknown",
                "has_wifi": False,
                "password_flag": 255
            }
            return self._device_info
    
    async def display_text(self, text: str, antialias: bool = True, font_size: float | None = None, font: str | None = None, line_spacing: int = 0, text_color: str = "ffffff", bg_color: str = "000000") -> bool:
        """Display text as image using PIL and pypixelcolor with color gradient mapping.

        Args:
            text: Text to display (supports multiline with \n)
            antialias: Enable text antialiasing for smoother rendering
            font_size: Fixed font size in pixels (can be fractional), or None for auto-sizing
            font: Font name from fonts/ folder, or None for default
            line_spacing: Additional spacing between lines in pixels
            text_color: Foreground/text color in hex format (e.g., 'ffffff')
            bg_color: Background color in hex format (e.g., '000000')
        """
        try:
            # Get device dimensions
            device_info = await self.get_device_info()
            width = device_info["width"]
            height = device_info["height"]

            # Render text to PNG with color gradient
            png_data = render_text_to_png(text, width, height, antialias, font_size, font, line_spacing, text_color, bg_color)

            # Generate image commands using pypixelcolor
            commands = make_image_command(
                image_bytes=png_data,
                file_extension=".png",
                resize_method="crop",
                device_info_dict=device_info
            )

            # Send all command frames
            for i, command in enumerate(commands):
                _LOGGER.debug(
                    "Sending pypixelcolor image frame %d/%d: %d bytes",
                    i + 1,
                    len(commands),
                    len(command)
                )
                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send image frame %d/%d", i + 1, len(commands))
                    return False

            _LOGGER.info(
                "Text rendered as image: '%s' (%dx%d, %d bytes PNG, %d frames)",
                text,
                width,
                height,
                len(png_data),
                len(commands)
            )
            return True

        except Exception as err:
            _LOGGER.error("Error displaying text: %s", err)
            return False

    async def display_text_pypixelcolor(
        self,
        text: str,
        color: str = "ffffff",
        bg_color: str | None = None,
        font: str = "CUSONG",
        animation: int = 0,
        speed: int = 80,
        rainbow_mode: int = 0,
        matrix_height: int | None = None
    ) -> bool:
        """Display text using pypixelcolor.

        Args:
            text: Text to display (supports emojis)
            color: Text color in hex format (e.g., 'ffffff')
            bg_color: Background color in hex format (e.g., '000000'), or None for transparent
            font: Font name ('CUSONG', 'SIMSUN', 'VCR_OSD_MONO') or file path
            animation: Animation type (0-7)
            speed: Animation speed (0-100)
            rainbow_mode: Rainbow mode (0-9)
            matrix_height: Override device height for text rendering (16, 20, 24, or 32)

        Returns:
            True if text was sent successfully
        """
        try:
            # Get device info for height
            device_info = await self.get_device_info()
            device_height = matrix_height if matrix_height else device_info["height"]

            # Generate text commands using pypixelcolor
            commands = make_text_command(
                text=text,
                color=color,
                bg_color=bg_color,
                font=font,
                animation=animation,
                speed=speed,
                rainbow_mode=rainbow_mode,
                save_slot=0,
                device_height=device_height
            )

            # Send all command frames
            for i, command in enumerate(commands):
                _LOGGER.debug(
                    "Sending pypixelcolor text frame %d/%d: %d bytes",
                    i + 1,
                    len(commands),
                    len(command)
                )
                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send text frame %d/%d", i + 1, len(commands))
                    return False

            _LOGGER.info(
                "Pypixelcolor text sent: '%s' (color=%s, bg=%s, font=%s, anim=%d, speed=%d, frames=%d)",
                text,
                color,
                bg_color or "none",
                font,
                animation,
                speed,
                len(commands)
            )
            return True

        except Exception as err:
            _LOGGER.error("Error displaying pypixelcolor text: %s", err)
            return False

    async def display_gif(
        self,
        gif_bytes: bytes,
        buffer_slot: int = 1
    ) -> bool:
        """Display GIF animation on the device.

        Uses windowed protocol for reliable transfer of large GIFs.

        Args:
            gif_bytes: Raw GIF file bytes
            buffer_slot: Storage slot on device (1-255)

        Returns:
            True if GIF was sent successfully
        """
        try:
            # Get device info for dimensions
            device_info = await self.get_device_info()

            # Process GIF for device dimensions
            processed_gif = extract_and_process_gif(
                gif_bytes,
                device_info["width"],
                device_info["height"]
            )

            # Build windowed command
            windows = make_gif_windows(
                processed_gif,
                buffer_slot=buffer_slot
            )

            # Send using windowed protocol
            success = await self._bluetooth.send_windowed_command(windows)

            if success:
                frame_count = get_gif_frame_count(gif_bytes)
                _LOGGER.info(
                    "GIF sent: %d frames, %d bytes, %d windows",
                    frame_count, len(processed_gif), len(windows)
                )

            return success

        except Exception as err:
            _LOGGER.error("Error displaying GIF: %s", err)
            return False

    async def display_gif_url(
        self,
        url: str,
        buffer_slot: int = 1
    ) -> bool:
        """Download and display GIF from URL.

        Args:
            url: URL to GIF file
            buffer_slot: Storage slot on device (1-255)

        Returns:
            True if GIF was sent successfully
        """
        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status != 200:
                        _LOGGER.error("Failed to download GIF: HTTP %d", response.status)
                        return False

                    gif_bytes = await response.read()

            _LOGGER.debug("Downloaded GIF from %s (%d bytes)", url, len(gif_bytes))
            return await self.display_gif(gif_bytes, buffer_slot)

        except Exception as err:
            _LOGGER.error("Error downloading GIF from %s: %s", url, err)
            return False

    async def display_image_with_effect(
        self,
        image_bytes: bytes,
        effect: str = "none",
        file_extension: str = ".png"
    ) -> bool:
        """Display image with optional visual effect.

        Args:
            image_bytes: Raw image data bytes
            effect: Effect name to apply (e.g., 'blur', 'sharpen')
            file_extension: File extension for image type

        Returns:
            True if image was sent successfully
        """
        try:
            from PIL import Image
            import io

            # Get device dimensions
            device_info = await self.get_device_info()

            # Load and apply effect
            img = Image.open(io.BytesIO(image_bytes))

            if effect and effect != "none":
                img = apply_effect(img, effect)
                _LOGGER.debug("Applied effect: %s", effect)

            # Convert back to bytes
            output = io.BytesIO()
            img.save(output, format=file_extension.lstrip('.').upper())
            processed_bytes = output.getvalue()

            # Generate image commands
            commands = make_image_command(
                image_bytes=processed_bytes,
                file_extension=file_extension,
                resize_method="crop",
                device_info_dict=device_info
            )

            # Send all command frames
            for i, command in enumerate(commands):
                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send image frame %d/%d", i + 1, len(commands))
                    return False

            return True

        except Exception as err:
            _LOGGER.error("Error displaying image with effect: %s", err)
            return False

    async def set_upside_down(self, upside_down: bool) -> bool:
        """Set display upside down (flip 180°).

        Args:
            upside_down: True to flip display 180°, False for normal

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_upside_down_command(upside_down)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Upside down mode %s", "enabled" if upside_down else "disabled")
            else:
                _LOGGER.error("Failed to set upside down mode")
            return success

        except Exception as err:
            _LOGGER.error("Error setting upside down mode: %s", err)
            return False

    async def set_default_mode(self) -> bool:
        """Reset device to factory default display mode.

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_default_mode_command()
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Device reset to default mode")
            else:
                _LOGGER.error("Failed to reset to default mode")
            return success

        except Exception as err:
            _LOGGER.error("Error resetting to default mode: %s", err)
            return False

    async def erase_data(
        self,
        buffers: list[int] | None = None,
        erase_all: bool = False
    ) -> bool:
        """Erase stored data from device EEPROM.

        Args:
            buffers: List of buffer numbers to erase (1-255), or None with erase_all=True
            erase_all: True to erase all stored data

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_erase_data_command(buffers, erase_all)
            success = await self._bluetooth.send_command(command)

            if success:
                if erase_all:
                    _LOGGER.info("Erased all stored data from device")
                else:
                    _LOGGER.info("Erased buffers %s from device", buffers)
            else:
                _LOGGER.error("Failed to erase data")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid erase parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error erasing data: %s", err)
            return False

    async def set_program_mode(self, buffers: list[int]) -> bool:
        """Set program mode to auto-cycle through stored screens.

        Args:
            buffers: List of buffer numbers to cycle through (1-9)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_program_mode_command(buffers)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Program mode set with buffers: %s", buffers)
            else:
                _LOGGER.error("Failed to set program mode")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid program mode parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting program mode: %s", err)
            return False

    async def set_rhythm_mode_advanced(
        self,
        style: int,
        levels: list[int]
    ) -> bool:
        """Set advanced rhythm mode with 11 frequency band levels.

        Args:
            style: Rhythm style 0-4 (5 different visualizer styles)
            levels: List of 11 integers (0-15) for each frequency band level

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_rhythm_mode_advanced_command(style, levels)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Advanced rhythm mode set: style=%d, levels=%s", style, levels)
            else:
                _LOGGER.error("Failed to set advanced rhythm mode")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid rhythm mode parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting advanced rhythm mode: %s", err)
            return False

    async def set_screen(self, screen: int) -> bool:
        """Select visible screen buffer.

        Args:
            screen: Screen number to display (1-9)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_screen_command(screen)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Screen set to %d", screen)
            else:
                _LOGGER.error("Failed to set screen to %d", screen)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid screen value: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting screen: %s", err)
            return False

    async def set_diy_mode(self, mode: int | bool) -> bool:
        """Set DIY mode with extended options.

        DIY mode allows custom pixel manipulation and content creation.

        DIY Mode options:
            0: QUIT_NOSAVE_KEEP_PREV  - Exit DIY mode, don't save, keep previous display
            1: ENTER_CLEAR_CUR_SHOW   - Enter DIY mode, clear display
            2: QUIT_STILL_CUR_SHOW    - Exit DIY mode, keep current display
            3: ENTER_NO_CLEAR_CUR_SHOW - Enter DIY mode, preserve current content

        Args:
            mode: DIY mode option (0-3), or bool for backwards compatibility
                  True = mode 1 (enter + clear), False = mode 0 (exit + keep prev)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_diy_mode_command(mode)
            success = await self._bluetooth.send_command(command)

            mode_names = {
                0: "exit (keep previous)",
                1: "enter (clear display)",
                2: "exit (keep current)",
                3: "enter (preserve content)"
            }
            # Handle bool for logging
            if isinstance(mode, bool):
                mode = 1 if mode else 0

            if success:
                _LOGGER.info("DIY mode set to: %s", mode_names.get(mode, str(mode)))
            else:
                _LOGGER.error("Failed to set DIY mode")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid DIY mode: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting DIY mode: %s", err)
            return False

    async def send_raw_command(self, hex_data: str) -> bool:
        """Send raw hex command to device for expert/debugging use.

        This allows sending arbitrary commands to the device for testing
        or accessing undocumented features. Use with caution.

        Args:
            hex_data: Hex string (e.g., 'AABBCC' or 'AA BB CC')

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_raw_command(hex_data)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Raw command sent: %s (%d bytes)", hex_data, len(command))
            else:
                _LOGGER.error("Failed to send raw command: %s", hex_data)
            return success

        except ValueError as err:
            _LOGGER.error("Invalid raw command: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error sending raw command: %s", err)
            return False

    async def display_image_url(
        self,
        url: str,
        buffer_slot: int = 1
    ) -> bool:
        """Download and display image from URL (PNG, JPG, BMP).

        Args:
            url: URL to image file
            buffer_slot: Storage slot on device (1-255)

        Returns:
            True if image was sent successfully
        """
        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status != 200:
                        _LOGGER.error("Failed to download image: HTTP %d", response.status)
                        return False

                    image_bytes = await response.read()
                    content_type = response.headers.get('Content-Type', '')

            # Determine file extension from content type or URL
            if 'png' in content_type or url.lower().endswith('.png'):
                file_ext = '.png'
            elif 'jpeg' in content_type or 'jpg' in content_type or url.lower().endswith(('.jpg', '.jpeg')):
                file_ext = '.jpg'
            elif 'bmp' in content_type or url.lower().endswith('.bmp'):
                file_ext = '.bmp'
            elif 'gif' in content_type or url.lower().endswith('.gif'):
                # For GIFs, use the existing GIF method
                _LOGGER.debug("URL is a GIF, using display_gif method")
                return await self.display_gif(image_bytes, buffer_slot)
            else:
                file_ext = '.png'  # Default to PNG

            _LOGGER.debug("Downloaded image from %s (%d bytes, type=%s)", url, len(image_bytes), file_ext)

            # Get device info for dimensions
            device_info = await self.get_device_info()

            # Generate image commands
            commands = make_image_command(
                image_bytes=image_bytes,
                file_extension=file_ext,
                resize_method="crop",
                device_info_dict=device_info
            )

            # Send all command frames
            for i, command in enumerate(commands):
                success = await self._bluetooth.send_command(command)
                if not success:
                    _LOGGER.error("Failed to send image frame %d/%d", i + 1, len(commands))
                    return False

            _LOGGER.info("Image from URL displayed successfully: %s", url)
            return True

        except Exception as err:
            _LOGGER.error("Error displaying image from URL %s: %s", url, err)
            return False

    async def set_password(self, enabled: bool, password: str) -> bool:
        """Set device password protection.

        Args:
            enabled: True to enable password protection, False to disable
            password: 6-digit password string (e.g., '123456')

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_set_password_command(enabled, password)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Password protection %s", "enabled" if enabled else "disabled")
            else:
                _LOGGER.error("Failed to set password")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid password: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error setting password: %s", err)
            return False

    async def verify_password(self, password: str) -> bool:
        """Verify device password.

        This must be called after connecting to a password-protected device
        before other commands will work.

        Args:
            password: 6-digit password string (e.g., '123456')

        Returns:
            True if password was verified successfully
        """
        try:
            command = make_verify_password_command(password)
            success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Password verified successfully")
            else:
                _LOGGER.error("Password verification failed")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid password format: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error verifying password: %s", err)
            return False

    async def send_mix_data(
        self,
        blocks: list[tuple[bytes, bytes]],
        screen_slot: int = 1
    ) -> bool:
        """Send mixed data (PNG + GIF + TEXT combined) to device.

        This allows combining multiple content types into a single display,
        each positioned at different areas of the screen.

        Args:
            blocks: List of (header, data) tuples. Each tuple contains:
                    - header: 16-byte block header
                    - data: Raw content data (PNG, GIF, or text bytes)
            screen_slot: Storage slot on device (1-255)

        Returns:
            True if command was sent successfully
        """
        try:
            command = make_mix_data_command(blocks, screen_slot)

            # Use windowed transfer for large payloads
            if len(command) > 244:
                # Split into windows for large data
                windows = self._split_into_windows(command)
                success = await self._bluetooth.send_windowed_command(windows)
            else:
                success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Mixed data sent: %d blocks to slot %d", len(blocks), screen_slot)
            else:
                _LOGGER.error("Failed to send mixed data")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid mixed data parameters: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error sending mixed data: %s", err)
            return False

    async def send_mix_data_raw(
        self,
        raw_hex_data: str,
        screen_slot: int = 1
    ) -> bool:
        """Send pre-built mixed data from hex string.

        This is for advanced users who want to send raw mixed data blocks
        built manually or captured from other tools.

        Args:
            raw_hex_data: Hex string of mixed data (e.g., '8000 0000 0300...')
            screen_slot: Storage slot on device (1-255)

        Returns:
            True if command was sent successfully
        """
        try:
            # Parse hex string to bytes
            hex_clean = raw_hex_data.replace(" ", "")
            raw_data = bytes.fromhex(hex_clean)

            command = make_mix_data_raw_command(raw_data, screen_slot)

            # Use windowed transfer for large payloads
            if len(command) > 244:
                windows = self._split_into_windows(command)
                success = await self._bluetooth.send_windowed_command(windows)
            else:
                success = await self._bluetooth.send_command(command)

            if success:
                _LOGGER.info("Raw mixed data sent: %d bytes to slot %d", len(raw_data), screen_slot)
            else:
                _LOGGER.error("Failed to send raw mixed data")
            return success

        except ValueError as err:
            _LOGGER.error("Invalid hex data: %s", err)
            return False
        except Exception as err:
            _LOGGER.error("Error sending raw mixed data: %s", err)
            return False

    def _split_into_windows(self, data: bytes, chunk_size: int = 244) -> list[bytes]:
        """Split data into chunks for windowed transfer.

        Args:
            data: Data to split
            chunk_size: Maximum size of each chunk

        Returns:
            List of data chunks
        """
        return [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]

    def _notification_handler(self, sender: Any, data: bytearray) -> None:
        """Handle notifications from the device."""
        _LOGGER.debug("Notification from %s: %s", sender, data.hex())
    
    @property
    def is_connected(self) -> bool:
        """Return True if connected to device."""
        return self._bluetooth.is_connected
    
    @property
    def power_state(self) -> bool:
        """Return current power state."""
        return self._power_state
    
    @property
    def address(self) -> str:
        """Return device address."""
        return self._address


# Export at module level for convenience
__all__ = ["iPIXELAPI", "iPIXELError", "iPIXELConnectionError", "iPIXELTimeoutError"]
from .exceptions import iPIXELError, iPIXELConnectionError, iPIXELTimeoutError