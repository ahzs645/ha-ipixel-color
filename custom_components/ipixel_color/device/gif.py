"""GIF command builder for iPIXEL Color devices.

Implements GIF animation support with:
- Frame extraction and processing using PIL
- Duration preservation for accurate playback timing
- Windowed protocol for reliable large file transfers
- CRC32 checksum validation

Reference implementations:
- iPixel-CLI-for-hass-main/ipixelcli.py (windowed protocol)
- pypixelcolor-main/commands/send_image.py (frame extraction)
- ipixel-ctrl-main/commands/write_data_gif.py (command structure)
"""
from __future__ import annotations

import io
import logging
import zlib
from typing import Optional

from PIL import Image, ImageSequence

_LOGGER = logging.getLogger(__name__)

# GIF protocol constants
GIF_TYPE_BYTE = 0x03
WINDOW_SIZE = 12 * 1024  # 12KB windows
CHUNK_SIZE = 244  # BLE chunk size


def calculate_crc32(data: bytes) -> bytes:
    """Calculate CRC32 checksum as little-endian bytes.

    Args:
        data: Data to calculate checksum for

    Returns:
        4-byte little-endian CRC32 checksum
    """
    crc = zlib.crc32(data) & 0xFFFFFFFF
    return crc.to_bytes(4, 'little')


def extract_and_process_gif(
    gif_bytes: bytes,
    target_width: int,
    target_height: int,
    resize_method: str = "crop"
) -> bytes:
    """Extract GIF frames, resize for device, and re-encode.

    Args:
        gif_bytes: Raw GIF file bytes
        target_width: Target display width
        target_height: Target display height
        resize_method: 'crop' (fill and crop) or 'fit' (maintain aspect with padding)

    Returns:
        Processed GIF bytes ready for device
    """
    try:
        img = Image.open(io.BytesIO(gif_bytes))

        if not hasattr(img, 'is_animated') or not img.is_animated:
            # Single frame - process as static image
            _LOGGER.debug("Processing single-frame GIF")
            processed = _resize_frame(img, target_width, target_height, resize_method)
            output = io.BytesIO()
            processed.save(output, format='GIF')
            return output.getvalue()

        # Multi-frame animated GIF
        frames = []
        durations = []
        disposal_methods = []

        # Extract all frames with metadata
        for frame in ImageSequence.Iterator(img):
            # Get frame timing (duration in ms, default 100ms)
            duration = frame.info.get('duration', img.info.get('duration', 100))
            durations.append(duration)

            # Get disposal method (2 = restore to background)
            disposal = frame.info.get('disposal', img.info.get('disposal', 2))
            disposal_methods.append(disposal)

            # Process frame
            processed = _resize_frame(frame.copy(), target_width, target_height, resize_method)

            # Convert to palette mode for GIF
            if processed.mode in ('RGBA', 'LA'):
                # Handle transparency
                pframe = processed.convert('P', palette=Image.Palette.ADAPTIVE, colors=255)
            elif processed.mode != 'P':
                pframe = processed.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
            else:
                pframe = processed

            frames.append(pframe)

        if not frames:
            raise ValueError("No frames extracted from GIF")

        # Re-encode with preserved timing
        output = io.BytesIO()
        frames[0].save(
            output,
            format='GIF',
            save_all=True,
            append_images=frames[1:] if len(frames) > 1 else [],
            duration=durations,
            loop=img.info.get('loop', 0),
            disposal=disposal_methods[0] if disposal_methods else 2,
            optimize=False
        )

        _LOGGER.debug(
            "Processed GIF: %d frames, dimensions %dx%d",
            len(frames), target_width, target_height
        )

        return output.getvalue()

    except Exception as err:
        _LOGGER.error("Error processing GIF: %s", err)
        raise


def _resize_frame(
    frame: Image.Image,
    target_width: int,
    target_height: int,
    resize_method: str
) -> Image.Image:
    """Resize a single frame to target dimensions.

    Args:
        frame: PIL Image frame
        target_width: Target width
        target_height: Target height
        resize_method: 'crop' or 'fit'

    Returns:
        Resized frame
    """
    # Convert to RGBA for processing
    if frame.mode != 'RGBA':
        frame = frame.convert('RGBA')

    orig_width, orig_height = frame.size

    if resize_method == "fit":
        # Maintain aspect ratio, add black padding
        ratio = min(target_width / orig_width, target_height / orig_height)
        new_width = int(orig_width * ratio)
        new_height = int(orig_height * ratio)

        resized = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Create black background and paste centered
        result = Image.new('RGBA', (target_width, target_height), (0, 0, 0, 255))
        paste_x = (target_width - new_width) // 2
        paste_y = (target_height - new_height) // 2
        result.paste(resized, (paste_x, paste_y))
        return result
    else:
        # Crop method: fill entire target and crop excess
        ratio = max(target_width / orig_width, target_height / orig_height)
        new_width = int(orig_width * ratio)
        new_height = int(orig_height * ratio)

        resized = frame.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Center crop
        left = (new_width - target_width) // 2
        top = (new_height - target_height) // 2
        return resized.crop((left, top, left + target_width, top + target_height))


def make_gif_windows(
    gif_bytes: bytes,
    buffer_slot: int = 1,
    device_info: Optional[dict] = None
) -> list[dict]:
    """Build GIF upload windows for windowed protocol.

    Args:
        gif_bytes: Processed GIF bytes
        buffer_slot: Storage slot on device (1-255)
        device_info: Device info dict with width/height

    Returns:
        List of window dicts with 'data', 'option', 'is_last' keys
    """
    # Process GIF if device info provided
    if device_info:
        width = device_info.get('width', 64)
        height = device_info.get('height', 16)
        gif_bytes = extract_and_process_gif(gif_bytes, width, height)

    # Calculate CRC32 for entire GIF
    crc_bytes = calculate_crc32(gif_bytes)
    size_bytes = len(gif_bytes).to_bytes(4, 'little')

    windows = []
    pos = 0
    window_index = 0

    while pos < len(gif_bytes):
        window_end = min(pos + WINDOW_SIZE, len(gif_bytes))
        chunk_payload = gif_bytes[pos:window_end]

        # Option byte: 0x00 for first window, 0x02 for continuation
        option = 0x00 if window_index == 0 else 0x02

        # Serial byte: 0x01 for first, 0x65 for rest
        serial = 0x01 if window_index == 0 else 0x65

        # Build header: [0x03, 0x00, option] + size + crc + [0x02, serial]
        header = bytes([GIF_TYPE_BYTE, 0x00, option])
        header += size_bytes
        header += crc_bytes
        header += bytes([0x02, serial])

        # Complete frame
        frame = header + chunk_payload

        # Add 2-byte length prefix (big-endian, value = len(frame) + 2)
        total_len = len(frame) + 2
        prefix = total_len.to_bytes(2, 'big')

        windows.append({
            'data': prefix + frame,
            'option': option,
            'is_last': window_end >= len(gif_bytes),
            'window_index': window_index
        })

        window_index += 1
        pos = window_end

    _LOGGER.debug(
        "Built %d windows for GIF (%d bytes, CRC=%s)",
        len(windows), len(gif_bytes), crc_bytes.hex()
    )

    return windows


def make_gif_command(
    gif_bytes: bytes,
    buffer_slot: int = 1,
    device_info_dict: Optional[dict] = None
) -> list[bytes]:
    """Build GIF display command using pypixelcolor-style interface.

    This is a compatibility wrapper that returns flat list of command bytes
    similar to make_image_command.

    Args:
        gif_bytes: Raw GIF file bytes
        buffer_slot: Storage slot on device (1-255)
        device_info_dict: Device info dict with width/height

    Returns:
        List of command bytes (one per window)
    """
    windows = make_gif_windows(gif_bytes, buffer_slot, device_info_dict)
    return [w['data'] for w in windows]


def get_gif_frame_count(gif_bytes: bytes) -> int:
    """Get the number of frames in a GIF.

    Args:
        gif_bytes: Raw GIF file bytes

    Returns:
        Number of frames (1 for static, >1 for animated)
    """
    try:
        img = Image.open(io.BytesIO(gif_bytes))
        if hasattr(img, 'n_frames'):
            return img.n_frames
        return 1
    except Exception:
        return 0


def get_gif_duration(gif_bytes: bytes) -> int:
    """Get total duration of GIF animation in milliseconds.

    Args:
        gif_bytes: Raw GIF file bytes

    Returns:
        Total duration in milliseconds
    """
    try:
        img = Image.open(io.BytesIO(gif_bytes))
        total_duration = 0

        for frame in ImageSequence.Iterator(img):
            duration = frame.info.get('duration', img.info.get('duration', 100))
            total_duration += duration

        return total_duration
    except Exception:
        return 0
