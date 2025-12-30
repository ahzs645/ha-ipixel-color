"""Font location utilities for iPIXEL Color integration."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

_LOGGER = logging.getLogger(__name__)


@dataclass
class FontMetrics:
    """Font rendering metrics for a specific height."""

    font_size: int
    offset: tuple[int, int]
    pixel_threshold: int
    var_width: bool

    @classmethod
    def from_dict(cls, data: dict) -> "FontMetrics":
        """Create FontMetrics from dictionary."""
        return cls(
            font_size=data.get("font_size", 16),
            offset=tuple(data.get("offset", [0, 0])),
            pixel_threshold=data.get("pixel_threshold", 128),
            var_width=data.get("var_width", True)
        )


def load_font_metrics(font_path: Path) -> dict[int, FontMetrics]:
    """Load JSON metrics file alongside TTF font.

    Looks for a .json file with the same name as the font file,
    containing height-specific rendering metrics.

    Example metrics.json:
    {
        "16": {"font_size": 16, "offset": [0, -2], "pixel_threshold": 128, "var_width": true},
        "32": {"font_size": 32, "offset": [0, -3], "pixel_threshold": 100, "var_width": true}
    }

    Args:
        font_path: Path to the TTF/OTF font file

    Returns:
        Dictionary mapping display heights to FontMetrics
    """
    metrics_path = font_path.with_suffix(".json")
    result: dict[int, FontMetrics] = {}

    if not metrics_path.exists():
        _LOGGER.debug("No metrics file found for font: %s", font_path.name)
        return result

    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for height_str, metrics_data in data.items():
            try:
                height = int(height_str)
                result[height] = FontMetrics.from_dict(metrics_data)
                _LOGGER.debug("Loaded metrics for height %d: %s", height, result[height])
            except (ValueError, KeyError) as e:
                _LOGGER.warning("Invalid metrics entry for height %s: %s", height_str, e)

    except (json.JSONDecodeError, OSError) as e:
        _LOGGER.warning("Could not load font metrics from %s: %s", metrics_path, e)

    return result


def get_font_metrics(font_name: str, height: int) -> Optional[FontMetrics]:
    """Get font metrics for a specific display height.

    Args:
        font_name: Font filename
        height: Display height in pixels

    Returns:
        FontMetrics if found for exact or nearest height, None otherwise
    """
    font_path = get_font_path(font_name)
    if not font_path:
        return None

    metrics = load_font_metrics(font_path)
    if not metrics:
        return None

    # Exact match
    if height in metrics:
        return metrics[height]

    # Find nearest height
    if metrics:
        nearest = min(metrics.keys(), key=lambda h: abs(h - height))
        _LOGGER.debug("Using metrics for height %d (requested: %d)", nearest, height)
        return metrics[nearest]

    return None


def get_font_locations() -> list[Path]:
    """Get list of font directories sorted by priority.

    Priority order:
    1. Custom fonts from this integration's fonts/ folder
    2. Fonts from pypixelcolor package
    3. System fonts (Linux standard locations)

    Returns:
        List of Path objects for font directories that exist
    """
    locations = []

    # 1st priority: Custom fonts from this integration
    custom_fonts_dir = Path(__file__).parent / "fonts"
    if custom_fonts_dir.exists() and custom_fonts_dir.is_dir():
        locations.append(custom_fonts_dir)
        _LOGGER.debug("Added custom fonts directory: %s", custom_fonts_dir)

    # 2nd priority: pypixelcolor package fonts
    try:
        import pypixelcolor
        pypixelcolor_fonts_dir = Path(pypixelcolor.__file__).parent / "fonts"
        if pypixelcolor_fonts_dir.exists() and pypixelcolor_fonts_dir.is_dir():
            locations.append(pypixelcolor_fonts_dir)
            _LOGGER.debug("Added pypixelcolor fonts directory: %s", pypixelcolor_fonts_dir)
    except (ImportError, AttributeError) as e:
        _LOGGER.debug("Could not locate pypixelcolor fonts: %s", e)

    # 3rd priority: System fonts (Linux standard locations)
    system_font_paths = [
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
        Path.home() / ".fonts",
        Path.home() / "fonts",
        Path.home() / "homeassistant/fonts",
        Path.home() / ".local/share/fonts",
    ]

    for font_path in system_font_paths:
        if font_path.exists() and font_path.is_dir():
            locations.append(font_path)
            _LOGGER.debug("Added system fonts directory: %s", font_path)

    if not locations:
        _LOGGER.warning("No font directories found!")

    return locations


def get_font_path(font_name: str, locations: list[Path] | None = None) -> Path | None:
    """Find font file in available font locations.

    Args:
        font_name: Font filename (with or without extension)
        locations: Optional list of font directories to search (uses get_font_locations() if None)

    Returns:
        Path to font file if found, None otherwise
    """
    # Add common font extensions if not present
    if not any(font_name.lower().endswith(ext) for ext in ['.ttf', '.otf', '.woff', '.woff2']):
        font_name += '.ttf'

    # Get font locations if not provided
    if locations is None:
        locations = get_font_locations()

    # Search each location in priority order
    for location in locations:
        font_path = location / font_name
        if font_path.exists() and font_path.is_file():
            _LOGGER.debug("Found font %s in %s", font_name, location)
            return font_path

        # Also search subdirectories (common for system fonts)
        for subfont_path in location.rglob(font_name):
            if subfont_path.is_file():
                _LOGGER.debug("Found font %s in %s", font_name, subfont_path.parent)
                return subfont_path

    _LOGGER.warning("Font %s not found in any location", font_name)
    return None


def get_available_fonts(locations: list[Path] | None = None) -> list[str]:
    """Get list of available font filenames from all locations.

    Args:
        locations: Optional list of font directories to search (uses get_font_locations() if None)

    Returns:
        Sorted list of unique font filenames
    """
    if locations is None:
        locations = get_font_locations()

    fonts = set()

    # Scan each location for fonts
    for location in locations:
        try:
            # Scan for TTF fonts
            for font_file in location.glob("*.ttf"):
                fonts.add(font_file.name)

            # Scan for OTF fonts
            for font_file in location.glob("*.otf"):
                fonts.add(font_file.name)

            # Also check subdirectories (for system fonts)
            for font_file in location.rglob("*.ttf"):
                if font_file.is_file():
                    fonts.add(font_file.name)

            for font_file in location.rglob("*.otf"):
                if font_file.is_file():
                    fonts.add(font_file.name)

        except (OSError, PermissionError) as e:
            _LOGGER.debug("Could not scan directory %s: %s", location, e)

    # Ensure we have at least a default font
    if not fonts:
        fonts.add("OpenSans-Light.ttf")

    _LOGGER.debug("Found %d unique fonts across all locations", len(fonts))
    return sorted(list(fonts))
