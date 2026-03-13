"""Native text protocol for iPIXEL devices.

The official app sends text as a structured binary payload rather than
rendering it to a PNG. This module implements the text header and record
format recovered from APK reverse engineering.

Text payload structure:
  [header (14-17 bytes)] [record1] [record2] ...

Header format:
  bytes 0-1:  number of text/emoji records (2-byte LE)
  byte 2:     horizontal alignment (0=left, 1=center, 2=right)
  byte 3:     vertical alignment (0=top, 1=center, 2=bottom)
  byte 4:     text effect/animation (0-7)
  byte 5:     text speed (0-100)
  byte 6:     foreground enabled flag (0 or 1)
  bytes 7-9:  foreground RGB
  byte 10:    background enabled flag (0 or 1)
  bytes 11-13: background RGB
  (for larger LED types, 3 additional bytes):
  byte 14:    border type
  byte 15:    border speed
  byte 16:    border effect

Recovered from APK reverse engineering of com.wifiled.ipixels v3.5.6.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

# Max text payload buffer size (from app)
MAX_TEXT_BUFFER = 102400

# Text alignment constants
ALIGN_LEFT = 0
ALIGN_CENTER = 1
ALIGN_RIGHT = 2
ALIGN_TOP = 0
ALIGN_MIDDLE = 1
ALIGN_BOTTOM = 2

# Text effects (animation types)
EFFECT_STATIC = 0
EFFECT_SCROLL_LEFT = 1
EFFECT_SCROLL_RIGHT = 2
EFFECT_SCROLL_UP = 3
EFFECT_SCROLL_DOWN = 4
EFFECT_FLASH = 5
EFFECT_SNOW = 6
EFFECT_LASER = 7


@dataclass
class TextStyle:
    """Style settings for native text display."""

    h_align: int = ALIGN_LEFT
    v_align: int = ALIGN_TOP
    effect: int = EFFECT_SCROLL_LEFT
    speed: int = 50
    fg_color: tuple[int, int, int] = (255, 255, 255)
    fg_enabled: bool = True
    bg_color: tuple[int, int, int] = (0, 0, 0)
    bg_enabled: bool = False
    border_type: int = 0
    border_speed: int = 0
    border_effect: int = 0


@dataclass
class TextRecord:
    """A single character/emoji record in the text payload."""

    char: str
    bitmap_data: bytes = field(default_factory=bytes)
    color: tuple[int, int, int] = (255, 255, 255)
    width: int = 0
    height: int = 0


def build_text_header(
    record_count: int,
    style: TextStyle,
    include_border: bool = False,
) -> bytes:
    """Build the text protocol header.

    Args:
        record_count: Number of text/emoji records following the header
        style: Text style configuration
        include_border: Whether to include 3 border bytes (for larger LED types)

    Returns:
        14 or 17 byte header
    """
    header = bytearray()

    # Record count (2 bytes LE)
    header.extend(record_count.to_bytes(2, "little"))

    # Alignment
    header.append(style.h_align & 0xFF)
    header.append(style.v_align & 0xFF)

    # Effect and speed
    header.append(style.effect & 0xFF)
    header.append(style.speed & 0xFF)

    # Foreground
    header.append(0x01 if style.fg_enabled else 0x00)
    header.extend(bytes(style.fg_color))

    # Background
    header.append(0x01 if style.bg_enabled else 0x00)
    header.extend(bytes(style.bg_color))

    # Border (optional, for larger LED types)
    if include_border:
        header.append(style.border_type & 0xFF)
        header.append(style.border_speed & 0xFF)
        header.append(style.border_effect & 0xFF)

    return bytes(header)


def render_char_bitmap(char: str, font_size: int = 16) -> tuple[bytes, int, int]:
    """Render a single character to a 1-bit bitmap suitable for the device.

    This replicates TextAgreement.getCharBitmap() → getTextData() from the app.
    The device expects a packed monochrome bitmap where each bit represents
    one pixel (1=foreground, 0=background).

    Args:
        char: Single character to render
        font_size: Font size in pixels (matches device text size: 16, 24, 32, 64)

    Returns:
        Tuple of (bitmap_bytes, width, height)
    """
    try:
        from PIL import Image, ImageDraw, ImageFont

        # Render character to image
        img = Image.new("1", (font_size * 2, font_size), 0)
        draw = ImageDraw.Draw(img)

        # Try bundled fonts first (extracted from iPIXEL APK), then system fallbacks
        font = None
        bundled_fonts_dir = Path(__file__).parent.parent / "assets" / "fonts"
        font_candidates = [
            bundled_fonts_dir / "PixeloidSans.ttf",
            bundled_fonts_dir / "ARIAL.TTF",
            bundled_fonts_dir / "GoogleSans-Medium.ttf",
        ]
        for font_path in font_candidates:
            try:
                font = ImageFont.truetype(str(font_path), font_size)
                break
            except (OSError, IOError):
                continue
        if font is None:
            try:
                font = ImageFont.truetype(
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size
                )
            except (OSError, IOError):
                font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), char, font=font)
        char_width = bbox[2] - bbox[0]
        char_height = bbox[3] - bbox[1]

        # Re-draw centered
        draw.text((-bbox[0], -bbox[1]), char, fill=1, font=font)

        # Crop to actual character bounds
        img = img.crop((0, 0, max(char_width, 1), max(char_height, font_size)))
        width, height = img.size

        # Convert to packed bits (MSB first, row by row)
        # Each row is padded to byte boundary
        row_bytes = (width + 7) // 8
        bitmap = bytearray()
        for y in range(height):
            row = 0
            for x in range(width):
                if img.getpixel((x, y)):
                    row |= 1 << (7 - (x % 8))
                if (x % 8 == 7) or x == width - 1:
                    bitmap.append(row & 0xFF)
                    row = 0

        return bytes(bitmap), width, height

    except ImportError:
        # Fallback: return a simple placeholder bitmap
        _LOGGER.warning("PIL not available, using placeholder bitmap for '%s'", char)
        width = font_size // 2
        height = font_size
        bitmap = bytes([0xFF] * ((width + 7) // 8) * height)
        return bitmap, width, height


def build_char_record(
    char: str,
    color: tuple[int, int, int] = (255, 255, 255),
    font_size: int = 16,
) -> bytes:
    """Build a single character record for the text protocol.

    Record format (from NewCommonTextProcess):
      [0x80] [R] [G] [B] [width] [height] [bitmap_data...]

    Args:
        char: Single character
        color: RGB color tuple
        font_size: Font size for bitmap rendering

    Returns:
        Character record bytes
    """
    bitmap, width, height = render_char_bitmap(char, font_size)

    record = bytearray()
    record.append(0x80)  # Record sentinel
    record.extend(bytes(color))
    record.append(width & 0xFF)
    record.append(height & 0xFF)
    record.extend(bitmap)

    return bytes(record)


def build_native_text_payload(
    text: str,
    style: TextStyle | None = None,
    font_size: int = 16,
    color: tuple[int, int, int] = (255, 255, 255),
    include_border: bool = False,
) -> bytes:
    """Build a complete native text protocol payload.

    This creates the structured binary text data that the device understands
    natively, enabling device-side text effects and scrolling.

    Args:
        text: Text string to display
        style: Text style (defaults to left-aligned scroll-left)
        font_size: Font size for character bitmaps
        color: Default text color
        include_border: Include border bytes in header

    Returns:
        Complete text payload bytes ready for send
    """
    if style is None:
        style = TextStyle(fg_color=color)

    records = []
    for char in text:
        if char == " ":
            # Space: small empty bitmap
            space_width = font_size // 4
            bitmap = bytes([0x00] * ((space_width + 7) // 8) * font_size)
            record = bytearray()
            record.append(0x80)
            record.extend(bytes(style.fg_color))
            record.append(space_width & 0xFF)
            record.append(font_size & 0xFF)
            record.extend(bitmap)
            records.append(bytes(record))
        else:
            records.append(build_char_record(char, style.fg_color, font_size))

    # Build header
    header = build_text_header(len(records), style, include_border)

    # Assemble payload
    payload = bytearray(header)
    for record in records:
        payload.extend(record)
        if len(payload) > MAX_TEXT_BUFFER:
            _LOGGER.warning("Text payload exceeds %d bytes, truncating", MAX_TEXT_BUFFER)
            break

    return bytes(payload)
