"""Gallery catalog from iPIXEL vendor data (sucai_define.json).

Provides browsable gallery categories organized by display size,
enabling users to discover available content from the vendor library.

Extracted from assets/sucai_define.json bundled in the APK.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

# Category translations (Chinese → English)
_CATEGORY_TRANSLATIONS = {
    "热点": "Hotspot",
    "表情": "Emoji",
    "驾驶": "Driving",
    "时节": "Season",
    "创意": "Originality",
    "商业": "Trade",
    "眼睛": "Eyes",
    "二合一": "2-in-1",
}


@dataclass
class GalleryCategory:
    """A content category in the gallery."""

    language_key: str  # English key (e.g., "hotspot", "emoji")
    request_key: str  # Chinese label used for API requests
    display_name: str = ""  # Human-readable name

    def __post_init__(self):
        if not self.display_name:
            self.display_name = (
                _CATEGORY_TRANSLATIONS.get(self.request_key)
                or self.language_key.replace("_", " ").title()
            )


@dataclass
class GallerySizeConfig:
    """Gallery configuration for a specific display size."""

    size: str  # e.g., "64x64", "32x32"
    width: int = 0
    height: int = 0
    cidpid: str = ""
    label: str = ""
    animations: list[GalleryCategory] = field(default_factory=list)
    pictures: list[GalleryCategory] = field(default_factory=list)
    animations_vertical: list[GalleryCategory] = field(default_factory=list)
    pictures_vertical: list[GalleryCategory] = field(default_factory=list)

    def __post_init__(self):
        if "x" in self.size and not self.width:
            parts = self.size.split("x")
            self.width = int(parts[0])
            self.height = int(parts[1])


def _load_raw_catalog() -> list[dict]:
    """Load the raw sucai_define.json from bundled assets."""
    catalog_path = Path(__file__).parent.parent / "assets" / "sucai_define.json"
    if not catalog_path.exists():
        _LOGGER.warning("Gallery catalog not found at %s", catalog_path)
        return []

    with open(catalog_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_categories(raw_list: list[dict]) -> list[GalleryCategory]:
    """Parse a list of raw category dicts into GalleryCategory objects."""
    return [
        GalleryCategory(
            language_key=item.get("languageKey", ""),
            request_key=item.get("requestKey", ""),
        )
        for item in raw_list
    ]


def load_gallery_catalog() -> list[GallerySizeConfig]:
    """Load and parse the full gallery catalog.

    Returns:
        List of GallerySizeConfig objects, one per display size + cidpid combo
    """
    raw = _load_raw_catalog()
    configs = []

    for entry in raw:
        cats = entry.get("categorys", {})
        config = GallerySizeConfig(
            size=entry.get("size", ""),
            cidpid=entry.get("cidpid", ""),
            label=entry.get("label", ""),
            animations=_parse_categories(cats.get("ani", [])),
            pictures=_parse_categories(cats.get("pic", [])),
            animations_vertical=_parse_categories(cats.get("aniVertical", [])),
            pictures_vertical=_parse_categories(cats.get("picVertical", [])),
        )
        configs.append(config)

    _LOGGER.debug("Loaded gallery catalog: %d entries", len(configs))
    return configs


def get_categories_for_size(
    width: int, height: int
) -> GallerySizeConfig | None:
    """Get gallery categories available for a specific display size.

    Args:
        width: Display width in pixels
        height: Display height in pixels

    Returns:
        GallerySizeConfig for the matching size, or None
    """
    size_str = f"{width}x{height}"
    catalog = load_gallery_catalog()

    # Find the generic (no cidpid) entry for this size
    for config in catalog:
        if config.size == size_str and config.cidpid == "":
            return config

    # Fall back to any entry for this size
    for config in catalog:
        if config.size == size_str:
            return config

    return None


def get_all_display_sizes() -> list[str]:
    """Get all display sizes that have gallery content.

    Returns:
        Sorted list of size strings (e.g., ["16x16", "32x32", "64x64", ...])
    """
    catalog = load_gallery_catalog()
    sizes = sorted(set(c.size for c in catalog))
    return sizes
