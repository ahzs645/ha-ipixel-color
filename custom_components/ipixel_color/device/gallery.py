"""Gallery asset pipeline for iPIXEL vendor content.

The official iPIXEL app downloads gallery assets from vendor endpoints
and de-obfuscates them before sending to the device. This module
replicates that pipeline so HA can access the vendor gallery.

Recovered from APK reverse engineering of com.wifiled.ipixels v3.5.6.
"""
from __future__ import annotations

import base64
import logging
import re
import urllib.parse
from io import BytesIO

_LOGGER = logging.getLogger(__name__)

# Regex for fixing malformed percent-encoded sequences
_INVALID_PERCENT_RE = re.compile(r"%(?![0-9a-fA-F]{2})")


def deobfuscate_gallery_asset(text: str) -> bytes | None:
    """De-obfuscate a gallery asset text blob into raw file bytes.

    The vendor encodes gallery assets by:
    1. Base64-encoding the file bytes
    2. Reversing the string
    3. URL-encoding it
    4. Padding 32 random chars on each end

    This function reverses that process.

    Args:
        text: Raw text blob from vendor endpoint

    Returns:
        Decoded file bytes (JPEG/GIF/PNG), or None if input is too short
    """
    if len(text) <= 64:
        return None

    # Strip 32 chars from front and back
    middle = text[32:-32]

    # URL-decode
    try:
        decoded = urllib.parse.unquote_plus(middle)
    except Exception:
        # Fallback: fix malformed percent escapes first
        fixed = _INVALID_PERCENT_RE.sub("%25", middle)
        decoded = urllib.parse.unquote(fixed)

    # Reverse the string and clean whitespace
    reversed_text = decoded[::-1].strip().replace("\r", "").replace("\n", "")

    # Base64 decode to get original file bytes
    return base64.b64decode(reversed_text)


async def fetch_gallery_asset(url: str) -> bytes:
    """Fetch and de-obfuscate a gallery asset from a vendor URL.

    Args:
        url: Vendor gallery asset URL

    Returns:
        De-obfuscated file bytes (JPEG/GIF/PNG)

    Raises:
        ValueError: If the response is too short or invalid
        aiohttp.ClientError: If the HTTP request fails
    """
    import aiohttp

    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status != 200:
                raise ValueError(f"Gallery fetch failed: HTTP {resp.status}")
            text = await resp.text(encoding="utf-8", errors="replace")

    data = deobfuscate_gallery_asset(text)
    if data is None:
        raise ValueError("Gallery asset text was too short to reconstruct")

    _LOGGER.debug("De-obfuscated gallery asset: %d bytes from %s", len(data), url)
    return data


def prepare_image_send_bytes(
    file_bytes: bytes,
    led_width: int,
    led_height: int,
    led_type: int,
) -> bytes:
    """Choose the correct send bytes for an image based on LED type.

    The official app has specific logic for which byte format to use
    depending on the LED type. This replicates ImageFragment.sendData().

    Args:
        file_bytes: Raw image file bytes (JPEG/PNG)
        led_width: Display width in pixels
        led_height: Display height in pixels
        led_type: Device LED type number

    Returns:
        Bytes to send to device (either raw file or RGB triplets)
    """
    from PIL import Image

    raw_led_size = led_width * led_height * 3

    # Generate RGB triplets from the image
    with Image.open(BytesIO(file_bytes)) as img:
        rgb_img = img.convert("RGB").resize((led_width, led_height))
        rgb_bytes = rgb_img.tobytes()

    # ImageFragment.sendData() branch logic from APK:
    # - For led_type 16 or 24 <= led_type < 29: use file bytes (PNG/JPEG)
    # - Otherwise: use raw RGB triplets
    if led_type == 16 or 24 <= led_type < 29:
        return file_bytes

    return rgb_bytes
