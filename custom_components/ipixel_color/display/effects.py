"""Visual effects processor using PIL ImageFilter.

Provides various image effects that can be applied to text
and images before sending to the iPIXEL display.

No external dependencies - uses PIL's built-in filters.
"""
from __future__ import annotations

import logging
from typing import Callable

from PIL import Image, ImageFilter, ImageEnhance, ImageOps

_LOGGER = logging.getLogger(__name__)


# Effect definitions
# Each effect is a callable that takes an Image and returns an Image

def effect_none(image: Image.Image) -> Image.Image:
    """No effect - return original image."""
    return image


def effect_blur(image: Image.Image) -> Image.Image:
    """Apply blur effect."""
    return image.filter(ImageFilter.BLUR)


def effect_sharpen(image: Image.Image) -> Image.Image:
    """Apply sharpen effect."""
    return image.filter(ImageFilter.SHARPEN)


def effect_contour(image: Image.Image) -> Image.Image:
    """Apply contour/edge detection effect."""
    return image.filter(ImageFilter.CONTOUR)


def effect_edge_enhance(image: Image.Image) -> Image.Image:
    """Apply edge enhancement effect."""
    return image.filter(ImageFilter.EDGE_ENHANCE)


def effect_edge_enhance_more(image: Image.Image) -> Image.Image:
    """Apply stronger edge enhancement effect."""
    return image.filter(ImageFilter.EDGE_ENHANCE_MORE)


def effect_emboss(image: Image.Image) -> Image.Image:
    """Apply emboss effect."""
    return image.filter(ImageFilter.EMBOSS)


def effect_smooth(image: Image.Image) -> Image.Image:
    """Apply smoothing effect."""
    return image.filter(ImageFilter.SMOOTH)


def effect_detail(image: Image.Image) -> Image.Image:
    """Apply detail enhancement effect."""
    return image.filter(ImageFilter.DETAIL)


def effect_invert(image: Image.Image) -> Image.Image:
    """Invert colors."""
    if image.mode == "RGBA":
        r, g, b, a = image.split()
        rgb = Image.merge("RGB", (r, g, b))
        inverted = ImageOps.invert(rgb)
        r, g, b = inverted.split()
        return Image.merge("RGBA", (r, g, b, a))
    elif image.mode == "RGB":
        return ImageOps.invert(image)
    else:
        # Convert to RGB, invert, convert back
        rgb = image.convert("RGB")
        inverted = ImageOps.invert(rgb)
        return inverted.convert(image.mode)


def effect_grayscale(image: Image.Image) -> Image.Image:
    """Convert to grayscale."""
    return ImageOps.grayscale(image).convert(image.mode)


def effect_mirror(image: Image.Image) -> Image.Image:
    """Mirror horizontally."""
    return ImageOps.mirror(image)


def effect_flip(image: Image.Image) -> Image.Image:
    """Flip vertically."""
    return ImageOps.flip(image)


def effect_posterize(image: Image.Image) -> Image.Image:
    """Posterize (reduce colors) effect."""
    if image.mode == "RGBA":
        r, g, b, a = image.split()
        rgb = Image.merge("RGB", (r, g, b))
        posterized = ImageOps.posterize(rgb, 2)
        r, g, b = posterized.split()
        return Image.merge("RGBA", (r, g, b, a))
    elif image.mode == "RGB":
        return ImageOps.posterize(image, 2)
    else:
        return image


def effect_solarize(image: Image.Image) -> Image.Image:
    """Solarize effect."""
    if image.mode == "RGBA":
        r, g, b, a = image.split()
        rgb = Image.merge("RGB", (r, g, b))
        solarized = ImageOps.solarize(rgb, threshold=128)
        r, g, b = solarized.split()
        return Image.merge("RGBA", (r, g, b, a))
    elif image.mode == "RGB":
        return ImageOps.solarize(image, threshold=128)
    else:
        return image


def effect_high_contrast(image: Image.Image) -> Image.Image:
    """Increase contrast."""
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(2.0)


def effect_low_contrast(image: Image.Image) -> Image.Image:
    """Decrease contrast."""
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(0.5)


def effect_brighten(image: Image.Image) -> Image.Image:
    """Increase brightness."""
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(1.5)


def effect_darken(image: Image.Image) -> Image.Image:
    """Decrease brightness."""
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(0.5)


def effect_saturate(image: Image.Image) -> Image.Image:
    """Increase saturation."""
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")
    enhancer = ImageEnhance.Color(image)
    return enhancer.enhance(2.0)


def effect_desaturate(image: Image.Image) -> Image.Image:
    """Decrease saturation."""
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")
    enhancer = ImageEnhance.Color(image)
    return enhancer.enhance(0.5)


# Effect registry
EFFECTS: dict[str, Callable[[Image.Image], Image.Image]] = {
    "none": effect_none,
    "blur": effect_blur,
    "sharpen": effect_sharpen,
    "contour": effect_contour,
    "edge_enhance": effect_edge_enhance,
    "edge_enhance_more": effect_edge_enhance_more,
    "emboss": effect_emboss,
    "smooth": effect_smooth,
    "detail": effect_detail,
    "invert": effect_invert,
    "grayscale": effect_grayscale,
    "mirror": effect_mirror,
    "flip": effect_flip,
    "posterize": effect_posterize,
    "solarize": effect_solarize,
    "high_contrast": effect_high_contrast,
    "low_contrast": effect_low_contrast,
    "brighten": effect_brighten,
    "darken": effect_darken,
    "saturate": effect_saturate,
    "desaturate": effect_desaturate,
}

# List of effect names for UI
EFFECT_NAMES = list(EFFECTS.keys())


def apply_effect(image: Image.Image, effect_name: str) -> Image.Image:
    """Apply a named effect to an image.

    Args:
        image: PIL Image to process
        effect_name: Name of effect to apply

    Returns:
        Processed image (or original if effect not found)
    """
    effect_func = EFFECTS.get(effect_name.lower(), effect_none)
    try:
        return effect_func(image)
    except Exception as err:
        _LOGGER.warning("Effect '%s' failed: %s", effect_name, err)
        return image


def apply_effects(image: Image.Image, effect_names: list[str]) -> Image.Image:
    """Apply multiple effects in sequence.

    Args:
        image: PIL Image to process
        effect_names: List of effect names to apply in order

    Returns:
        Processed image
    """
    result = image
    for name in effect_names:
        result = apply_effect(result, name)
    return result


def get_effect_names() -> list[str]:
    """Get list of available effect names."""
    return EFFECT_NAMES.copy()


class EffectProcessor:
    """Stateful effect processor for consistent effect application.

    Allows setting a default effect that will be applied to all images.
    """

    def __init__(self, default_effect: str = "none") -> None:
        """Initialize effect processor.

        Args:
            default_effect: Default effect name to apply
        """
        self._default_effect = default_effect
        self._enabled = True

    @property
    def default_effect(self) -> str:
        """Get default effect name."""
        return self._default_effect

    @default_effect.setter
    def default_effect(self, value: str) -> None:
        """Set default effect name."""
        if value.lower() in EFFECTS:
            self._default_effect = value.lower()
        else:
            _LOGGER.warning("Unknown effect '%s', using 'none'", value)
            self._default_effect = "none"

    @property
    def enabled(self) -> bool:
        """Check if effects are enabled."""
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        """Enable or disable effects."""
        self._enabled = value

    def process(self, image: Image.Image) -> Image.Image:
        """Apply the default effect to an image.

        Args:
            image: PIL Image to process

        Returns:
            Processed image (or original if disabled)
        """
        if not self._enabled or self._default_effect == "none":
            return image
        return apply_effect(image, self._default_effect)

    def process_with(
        self,
        image: Image.Image,
        effect_name: str | None = None
    ) -> Image.Image:
        """Apply a specific effect (or default) to an image.

        Args:
            image: PIL Image to process
            effect_name: Effect to apply (uses default if None)

        Returns:
            Processed image
        """
        name = effect_name or self._default_effect
        if not self._enabled or name == "none":
            return image
        return apply_effect(image, name)


# Global effect processor instance
_global_processor: EffectProcessor | None = None


def get_effect_processor() -> EffectProcessor:
    """Get the global effect processor instance."""
    global _global_processor
    if _global_processor is None:
        _global_processor = EffectProcessor()
    return _global_processor
