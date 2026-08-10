"""Native text protocol for iPIXEL devices.

The official app sends text as a structured binary payload rather than
rendering it to a PNG. This module implements the properties header and glyph
record format used by opcode 0x0100.

Payload structure:
  [properties (14 bytes)] [record1] [record2] ...

Properties header (14 bytes):
  bytes 0-1:  glyph/record count (2-byte LE)
  byte 2:     horizontal alignment  (the app always sends 0x01)
  byte 3:     vertical alignment    (the app always sends 0x01)
  byte 4:     animation / effect (see the TEXT_ANIM_* constants in const.py)
  byte 5:     speed (0-100)
  byte 6:     rainbow / style mode (0-9)
  bytes 7-9:  foreground RGB
  byte 10:    background enable flag (the app always sends 0x01)
  bytes 11-13: background RGB

Glyph records come in two shapes, distinguished by the leading byte:

  0x00  ->  [00][R][G][B][bitmap]      8x16  glyph, 1 byte per row
  0x01  ->  [01][R][G][B][bitmap]     16x16  glyph, 2 bytes per row
  0x02  ->  [02][R][G][B][bitmap]     16x32  glyph, 2 bytes per row
  0x80  ->  [80][R][G][B][W][H][bitmap]  variable W x H glyph

The 0x80 variable-size form is *not* supported by the 32x32 LED Pixel Board
(DonKracho, ESPHome-component-iPixel-ble helpers.cpp), so this module emits the
fixed-size forms.

Row bits are packed MSB-first and then the bits of every byte are reversed --
equivalently the legacy invertFrames -> switchEndian -> logicReverseBitsOrder
chain, which nets out to the same per-byte reversal.

Cross-checked against:
  - lucagoc/pypixelcolor commands/send_text (encoding.py, image_processing.py)
  - DonKracho/ESPHome-component-iPixel-ble (iPixelCommands.cpp, helpers.cpp)
  - sdolphin-JP/ipixel-ctrl docs/DeviceCommands.md section 0x0100
  - ToBiDi0410/iPixel-ESP32 iPixelCommands.cpp
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from ..const import (
    SAFE_ANIMATION_DIMENSIONS,
    TEXT_ANIM_BLINK,
    TEXT_ANIM_BREEZE,
    TEXT_ANIM_LASER,
    TEXT_ANIM_SCROLL_LEFT,
    TEXT_ANIM_SCROLL_RIGHT,
    TEXT_ANIM_SNOW,
    TEXT_ANIM_STATIC,
    UNSAFE_TEXT_ANIMATIONS,
)

_LOGGER = logging.getLogger(__name__)

# Max text payload buffer size (from app)
MAX_TEXT_BUFFER = 102400

# Max glyphs the device accepts in one text payload
MAX_TEXT_RECORDS = 500

# Text alignment constants
ALIGN_LEFT = 0
ALIGN_CENTER = 1
ALIGN_RIGHT = 2
ALIGN_TOP = 0
ALIGN_MIDDLE = 1
ALIGN_BOTTOM = 2

# Text effects. Re-exported under the historical EFFECT_* names; the values now
# follow the ipixel-ctrl spec rather than a guessed sequential ordering.
EFFECT_STATIC = TEXT_ANIM_STATIC
EFFECT_SCROLL_LEFT = TEXT_ANIM_SCROLL_LEFT
EFFECT_SCROLL_RIGHT = TEXT_ANIM_SCROLL_RIGHT
EFFECT_BLINK = TEXT_ANIM_BLINK
EFFECT_BREEZE = TEXT_ANIM_BREEZE
EFFECT_SNOW = TEXT_ANIM_SNOW
EFFECT_LASER = TEXT_ANIM_LASER

# Glyph record types: record_type -> (width, height, bytes_per_row)
GLYPH_RECORD_TYPES: dict[int, tuple[int, int, int]] = {
    0x00: (8, 16, 1),
    0x01: (16, 16, 2),
    0x02: (16, 32, 2),
}


class UnsafeAnimationError(ValueError):
    """Raised when a caller asks for an animation known to brick the device."""


def validate_animation(
    animation: int,
    width: int | None = None,
    height: int | None = None,
) -> int:
    """Reject text animations that are known to boot-loop the device.

    Animations 3 and 4 write a payload the firmware cannot re-read at boot on
    panels other than 32x32. Recovery requires racing a clear command into a
    very short window at power-on, so this is treated as a hard error rather
    than a warning.

    Args:
        animation: Requested animation value.
        width: Panel width, if known.
        height: Panel height, if known.

    Returns:
        The animation value, unchanged, when it is safe to send.

    Raises:
        UnsafeAnimationError: If the animation is known-unsafe for this panel.
        ValueError: If the animation is outside the accepted range.
    """
    animation = int(animation)

    if animation < 0 or animation > 8:
        raise ValueError(f"Text animation must be 0-8, got {animation}")

    if animation not in UNSAFE_TEXT_ANIMATIONS:
        return animation

    is_known_safe_panel = (
        width is not None
        and height is not None
        and (width, height) == SAFE_ANIMATION_DIMENSIONS
    )
    if is_known_safe_panel:
        _LOGGER.warning(
            "Text animation %d is only known to work on %dx%d panels. "
            "Sending it because this device reports %dx%d, but a malformed "
            "payload can still boot-loop the device.",
            animation,
            *SAFE_ANIMATION_DIMENSIONS,
            width,
            height,
        )
        return animation

    raise UnsafeAnimationError(
        f"Text animation {animation} is known to put non-32x32 iPIXEL panels "
        f"into a boot loop and is blocked "
        f"(device reports {width}x{height}). "
        f"Use 0 (static), 1 (scroll left) or 2 (scroll right) instead."
    )


@dataclass
class TextStyle:
    """Style settings for native text display.

    The alignment and background-enable defaults match what the official app
    sends on the wire; no other values have been observed in a capture.
    """

    h_align: int = 1
    v_align: int = 1
    effect: int = EFFECT_SCROLL_LEFT
    speed: int = 50
    rainbow_mode: int = 0
    fg_color: tuple[int, int, int] = (255, 255, 255)
    bg_color: tuple[int, int, int] = (0, 0, 0)
    bg_enabled: bool = True


def build_text_header(record_count: int, style: TextStyle) -> bytes:
    """Build the 14-byte text properties header.

    Args:
        record_count: Number of glyph records following the header.
        style: Text style configuration.

    Returns:
        14-byte header.
    """
    header = bytearray()

    # Glyph count (2 bytes LE)
    header.extend((record_count & 0xFFFF).to_bytes(2, "little"))

    # Alignment
    header.append(style.h_align & 0xFF)
    header.append(style.v_align & 0xFF)

    # Animation and speed
    header.append(style.effect & 0xFF)
    header.append(style.speed & 0xFF)

    # Rainbow / style mode
    header.append(style.rainbow_mode & 0xFF)

    # Foreground colour
    header.extend(bytes(style.fg_color))

    # Background enable flag + colour
    header.append(0x01 if style.bg_enabled else 0x00)
    header.extend(bytes(style.bg_color))

    return bytes(header)


def pick_record_type(font_size: int) -> int:
    """Choose a glyph record type for the requested character height.

    Args:
        font_size: Requested character height in pixels.

    Returns:
        Record type byte (a key of GLYPH_RECORD_TYPES).
    """
    if font_size >= 32:
        return 0x02
    if font_size > 8:
        return 0x01
    return 0x00


def _reverse_bits(value: int) -> int:
    """Reverse the bits of a single byte."""
    value = ((value & 0xF0) >> 4) | ((value & 0x0F) << 4)
    value = ((value & 0xCC) >> 2) | ((value & 0x33) << 2)
    value = ((value & 0xAA) >> 1) | ((value & 0x55) << 1)
    return value & 0xFF


def _load_font(size: int):
    """Load a bitmap-friendly font at the requested size."""
    from PIL import ImageFont

    bundled_fonts_dir = Path(__file__).parent.parent / "assets" / "fonts"
    candidates = [
        bundled_fonts_dir / "PixeloidSans.ttf",
        bundled_fonts_dir / "ARIAL.TTF",
        bundled_fonts_dir / "GoogleSans-Medium.ttf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for font_path in candidates:
        try:
            return ImageFont.truetype(str(font_path), size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def render_glyph_bitmap(
    char: str,
    record_type: int,
    pixel_threshold: int = 70,
) -> bytes:
    """Render one character into the fixed-size bitmap the device expects.

    Args:
        char: Single character to render.
        record_type: Glyph record type (key of GLYPH_RECORD_TYPES).
        pixel_threshold: Greyscale cutoff for the 1-bit conversion.

    Returns:
        Packed bitmap, exactly height * bytes_per_row bytes.
    """
    width, height, row_bytes = GLYPH_RECORD_TYPES[record_type]

    try:
        from PIL import Image, ImageDraw
    except ImportError:
        _LOGGER.warning("Pillow not available, emitting blank glyph for %r", char)
        return bytes(height * row_bytes)

    font = _load_font(height)

    img = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(img)

    # Centre the glyph inside the fixed cell.
    bbox = draw.textbbox((0, 0), char, font=font)
    offset_x = -bbox[0] + max(0, (width - (bbox[2] - bbox[0])) // 2)
    offset_y = -bbox[1] + max(0, (height - (bbox[3] - bbox[1])) // 2)
    draw.text((offset_x, offset_y), char, fill=255, font=font)

    bitmap = bytearray()
    for y in range(height):
        row = 0
        for x in range(width):
            if img.getpixel((x, y)) > pixel_threshold:
                row |= 1 << (width - 1 - x)
        row_data = row.to_bytes(row_bytes, "big")
        # The device reads each byte LSB-first.
        bitmap.extend(_reverse_bits(b) for b in row_data)

    return bytes(bitmap)


def build_char_record(
    char: str,
    color: tuple[int, int, int] = (255, 255, 255),
    record_type: int = 0x02,
) -> bytes:
    """Build a single glyph record.

    Record format: [record_type][R][G][B][bitmap...]

    Args:
        char: Single character.
        color: RGB colour tuple for this glyph.
        record_type: Glyph record type (key of GLYPH_RECORD_TYPES).

    Returns:
        Glyph record bytes.
    """
    if record_type not in GLYPH_RECORD_TYPES:
        raise ValueError(
            f"Unsupported glyph record type 0x{record_type:02x}; "
            f"expected one of {sorted(GLYPH_RECORD_TYPES)}"
        )

    record = bytearray()
    record.append(record_type & 0xFF)
    record.extend(bytes(color))
    record.extend(render_glyph_bitmap(char, record_type))
    return bytes(record)


def build_native_text_payload(
    text: str,
    style: TextStyle | None = None,
    font_size: int = 16,
    color: tuple[int, int, int] = (255, 255, 255),
) -> bytes:
    """Build a complete native text protocol payload.

    Args:
        text: Text string to display.
        style: Text style (defaults to a left-scrolling white style).
        font_size: Requested glyph height; selects the record type.
        color: Default text colour, used when no style is supplied.

    Returns:
        Complete text payload, ready to be wrapped in 0x0100 frames.
    """
    if style is None:
        style = TextStyle(fg_color=color)

    record_type = pick_record_type(font_size)

    records = []
    for char in text:
        if len(records) >= MAX_TEXT_RECORDS:
            _LOGGER.warning(
                "Text exceeds %d glyphs, truncating", MAX_TEXT_RECORDS
            )
            break
        records.append(build_char_record(char, style.fg_color, record_type))

    payload = bytearray(build_text_header(len(records), style))
    for record in records:
        payload.extend(record)

    if len(payload) > MAX_TEXT_BUFFER:
        raise ValueError(
            f"Text payload is {len(payload)} bytes, device limit is "
            f"{MAX_TEXT_BUFFER}"
        )

    return bytes(payload)
