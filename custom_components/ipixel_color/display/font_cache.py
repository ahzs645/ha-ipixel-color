"""Font caching system for variable-width text rendering.

Caches rendered characters as PNG files for faster text rendering,
especially useful for repeated text updates with the same font.

Reference: iPixel-CLI-for-hass-main/img_2_pix.py
"""
from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import TYPE_CHECKING

from PIL import Image, ImageDraw, ImageFont

if TYPE_CHECKING:
    pass

_LOGGER = logging.getLogger(__name__)

# Default cache directory (relative to integration)
DEFAULT_CACHE_DIR = Path(__file__).parent.parent / "font_cache"


class FontCache:
    """Caches rendered characters as PNG files for variable-width fonts.

    Cache structure:
        font_cache/{font_hash}/{height}px/{unicode_hex}.png

    Each cached image includes the character and its measured width.
    """

    def __init__(self, cache_dir: Path | None = None) -> None:
        """Initialize font cache.

        Args:
            cache_dir: Directory for cache files (default: font_cache/)
        """
        self._cache_dir = cache_dir or DEFAULT_CACHE_DIR
        self._memory_cache: dict[str, tuple[Image.Image, int]] = {}
        self._font_cache: dict[str, ImageFont.FreeTypeFont] = {}

        # Ensure cache directory exists
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_font_hash(self, font_path: str) -> str:
        """Get a short hash for font identification."""
        return hashlib.md5(font_path.encode()).hexdigest()[:8]

    def _get_cache_path(
        self,
        char: str,
        font_path: str,
        height: int
    ) -> Path:
        """Get cache file path for a character.

        Args:
            char: Character to cache
            font_path: Path to font file
            height: Target height in pixels

        Returns:
            Path to cache file
        """
        font_hash = self._get_font_hash(font_path)
        char_hex = f"{ord(char):04X}"
        return self._cache_dir / font_hash / f"{height}px" / f"{char_hex}.png"

    def _get_memory_key(
        self,
        char: str,
        font_path: str,
        height: int
    ) -> str:
        """Get memory cache key."""
        return f"{font_path}:{height}:{ord(char)}"

    def _load_font(
        self,
        font_path: str,
        font_size: int
    ) -> ImageFont.FreeTypeFont:
        """Load and cache font object.

        Args:
            font_path: Path to font file
            font_size: Font size in points

        Returns:
            PIL FreeTypeFont object
        """
        cache_key = f"{font_path}:{font_size}"
        if cache_key not in self._font_cache:
            try:
                self._font_cache[cache_key] = ImageFont.truetype(
                    font_path, font_size
                )
            except Exception as err:
                _LOGGER.warning(
                    "Could not load font %s: %s, using default",
                    font_path, err
                )
                self._font_cache[cache_key] = ImageFont.load_default()

        return self._font_cache[cache_key]

    def get_char_image(
        self,
        char: str,
        font_path: str,
        height: int,
        font_size: int | None = None,
        color: tuple[int, int, int] = (255, 255, 255)
    ) -> tuple[Image.Image, int]:
        """Get rendered character image and its width.

        Uses caching for performance. Characters are rendered in white
        and can be colorized later.

        Args:
            char: Character to render
            font_path: Path to font file
            height: Target height in pixels
            font_size: Font size (defaults to height)
            color: RGB color tuple

        Returns:
            Tuple of (PIL Image, character width in pixels)
        """
        if font_size is None:
            font_size = height

        # Check memory cache first
        mem_key = self._get_memory_key(char, font_path, height)
        if mem_key in self._memory_cache:
            return self._memory_cache[mem_key]

        # Check disk cache
        cache_path = self._get_cache_path(char, font_path, height)
        if cache_path.exists():
            try:
                img = Image.open(cache_path)
                width = img.width
                self._memory_cache[mem_key] = (img, width)
                return img, width
            except Exception as err:
                _LOGGER.debug("Cache read error: %s", err)

        # Render the character
        img, width = self._render_char(char, font_path, height, font_size)

        # Save to disk cache
        try:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(cache_path, "PNG")
        except Exception as err:
            _LOGGER.debug("Cache write error: %s", err)

        # Save to memory cache
        self._memory_cache[mem_key] = (img, width)

        return img, width

    def _render_char(
        self,
        char: str,
        font_path: str,
        height: int,
        font_size: int
    ) -> tuple[Image.Image, int]:
        """Render a character with variable width.

        Args:
            char: Character to render
            font_path: Path to font file
            height: Target height in pixels
            font_size: Font size in points

        Returns:
            Tuple of (PIL Image, character width)
        """
        font = self._load_font(font_path, font_size)

        # Create temporary image to measure text
        temp_img = Image.new("RGBA", (height * 2, height * 2), (0, 0, 0, 0))
        temp_draw = ImageDraw.Draw(temp_img)

        # Get bounding box for accurate width measurement
        bbox = temp_draw.textbbox((0, 0), char, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Clamp width to reasonable bounds (min 1, max 2*height)
        text_width = max(1, min(text_width, height * 2))

        # Create final image with exact width
        img = Image.new("RGBA", (text_width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Center vertically
        y_offset = (height - text_height) // 2 - bbox[1]

        # Draw character in white (for later colorization)
        draw.text((-bbox[0], y_offset), char, font=font, fill=(255, 255, 255, 255))

        return img, text_width

    def render_text_variable_width(
        self,
        text: str,
        font_path: str,
        height: int,
        max_width: int | None = None,
        font_size: int | None = None,
        spacing: int = 0,
        color: tuple[int, int, int] = (255, 255, 255),
        bg_color: tuple[int, int, int] = (0, 0, 0)
    ) -> Image.Image:
        """Render text with variable character widths.

        Args:
            text: Text to render
            font_path: Path to font file
            height: Height in pixels
            max_width: Maximum width (for scrolling text)
            font_size: Font size (defaults to height)
            spacing: Extra spacing between characters
            color: Text color RGB
            bg_color: Background color RGB

        Returns:
            PIL Image with rendered text
        """
        if not text:
            # Return empty image
            width = max_width or height
            return Image.new("RGB", (width, height), bg_color)

        # Get all character images and calculate total width
        char_images = []
        total_width = 0

        for char in text:
            img, width = self.get_char_image(char, font_path, height, font_size)
            char_images.append((img, width))
            total_width += width + spacing

        total_width -= spacing  # Remove last spacing

        # Determine final width
        if max_width:
            final_width = max(total_width, max_width)
        else:
            final_width = total_width

        # Create output image
        result = Image.new("RGB", (final_width, height), bg_color)

        # Paste characters
        x = 0
        for char_img, width in char_images:
            # Colorize character (originally white)
            colored = self._colorize(char_img, color)
            result.paste(colored, (x, 0), char_img)
            x += width + spacing

        return result

    def _colorize(
        self,
        img: Image.Image,
        color: tuple[int, int, int]
    ) -> Image.Image:
        """Colorize a white-on-transparent image.

        Args:
            img: Source image (white text on transparent)
            color: Target RGB color

        Returns:
            Colorized image
        """
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        # Create colored version
        colored = Image.new("RGBA", img.size, (*color, 255))

        # Use original alpha as mask
        r, g, b, a = img.split()
        colored.putalpha(a)

        return colored

    def preload_ascii(
        self,
        font_path: str,
        height: int,
        font_size: int | None = None
    ) -> int:
        """Pre-render ASCII characters to cache.

        Args:
            font_path: Path to font file
            height: Target height
            font_size: Font size (defaults to height)

        Returns:
            Number of characters cached
        """
        count = 0
        for code in range(32, 127):  # Printable ASCII
            char = chr(code)
            try:
                self.get_char_image(char, font_path, height, font_size)
                count += 1
            except Exception as err:
                _LOGGER.debug("Could not cache char %r: %s", char, err)

        _LOGGER.info(
            "Preloaded %d ASCII characters for %s at %dpx",
            count, font_path, height
        )
        return count

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._memory_cache.clear()
        self._font_cache.clear()

        # Optionally clear disk cache
        try:
            import shutil
            if self._cache_dir.exists():
                shutil.rmtree(self._cache_dir)
                self._cache_dir.mkdir(parents=True, exist_ok=True)
            _LOGGER.info("Font cache cleared")
        except Exception as err:
            _LOGGER.warning("Could not clear disk cache: %s", err)

    def get_cache_stats(self) -> dict:
        """Get cache statistics."""
        return {
            "memory_entries": len(self._memory_cache),
            "fonts_loaded": len(self._font_cache),
            "cache_dir": str(self._cache_dir),
        }


# Global cache instance
_global_cache: FontCache | None = None


def get_font_cache() -> FontCache:
    """Get the global font cache instance."""
    global _global_cache
    if _global_cache is None:
        _global_cache = FontCache()
    return _global_cache
