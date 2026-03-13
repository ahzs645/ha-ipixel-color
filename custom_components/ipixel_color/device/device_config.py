"""Device configuration map from iPIXEL vendor data.

Maps device cidpid codes to capabilities and display dimensions.
Recovered from homeConfig.json bundled in the APK.

The official app fetches this from http://app.heaton.cn/homeConfig.json
but we embed it locally to avoid external dependency.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

_LOGGER = logging.getLogger(__name__)


@dataclass
class DeviceCapabilities:
    """Capabilities of a specific iPIXEL device model."""

    cidpid: str
    supports_timer_and_score: bool = False
    logo_url: str = ""


# From homeConfig.json in the APK
# cidpid groups and their capabilities
_TIMER_SCORE_CIDPIDS = {
    "002501", "002502", "002503", "002504", "002505",
    "002506", "002507", "002508", "002509", "002510",
    "002511", "002512",
}

_DEVICE_CONFIGS = [
    {
        "cidpids": ["002501", "002502", "002503", "002504", "002505",
                     "002506", "002507", "002508", "002509"],
        "logo": "http://app.heaton.cn/ipixellogo_hy.png",
    },
    {
        "cidpids": ["002510", "002511", "002512"],
        "logo": "http://app.heaton.cn/ipixellogo_ezyevy.png",
    },
]

# LED type to display dimensions mapping
# Recovered from device info parsing in the APK
LED_TYPE_DIMENSIONS: dict[int, tuple[int, int]] = {
    0: (64, 64),
    1: (96, 16),
    2: (32, 32),
    3: (64, 16),
    4: (32, 16),
    5: (64, 20),
    6: (128, 16),
    7: (144, 16),
    8: (192, 16),
    9: (48, 24),
    10: (64, 32),
    11: (96, 32),
    12: (128, 32),
    13: (160, 32),
    14: (192, 32),
    15: (256, 32),
    16: (128, 64),
    17: (192, 64),
    18: (320, 32),
    19: (384, 32),
    20: (448, 32),
}

# LED type byte offset (the device reports type as signed byte, offset by 128)
LED_TYPE_BYTE_OFFSET = 128

# Border animation dimensions available per display size
# Maps (width, height) to whether border animations exist for that size
BORDER_DIMENSIONS = {
    (64, 16), (64, 20), (64, 32),
    (96, 16), (96, 32),
    (128, 32), (128, 64),
    (144, 16),
    (160, 32),
    (192, 16), (192, 32), (192, 64),
    (256, 32),
    (320, 32),
    (384, 32),
    (448, 32),
}

# Number of border animation styles
BORDER_STYLE_COUNT = 24


def get_device_capabilities(cidpid: str) -> DeviceCapabilities:
    """Look up device capabilities by cidpid code.

    Args:
        cidpid: Device cidpid identifier string

    Returns:
        DeviceCapabilities for the device
    """
    caps = DeviceCapabilities(cidpid=cidpid)
    caps.supports_timer_and_score = cidpid in _TIMER_SCORE_CIDPIDS

    for config in _DEVICE_CONFIGS:
        if cidpid in config["cidpids"]:
            caps.logo_url = config["logo"]
            break

    return caps


def get_dimensions_for_led_type(led_type: int) -> tuple[int, int] | None:
    """Get display dimensions for a given LED type number.

    Args:
        led_type: LED type number (0-20, or raw device byte)

    Returns:
        (width, height) tuple, or None if unknown
    """
    # Handle raw device byte (signed, offset by 128)
    if led_type >= LED_TYPE_BYTE_OFFSET:
        led_type = led_type - 256 + LED_TYPE_BYTE_OFFSET
    elif led_type < 0:
        led_type = led_type + LED_TYPE_BYTE_OFFSET

    return LED_TYPE_DIMENSIONS.get(led_type)


def supports_border_animations(width: int, height: int) -> bool:
    """Check if border animations are available for given display dimensions.

    Args:
        width: Display width
        height: Display height

    Returns:
        True if border animations exist for this size
    """
    return (width, height) in BORDER_DIMENSIONS


def get_border_filename(width: int, height: int, style: int) -> str:
    """Get the border animation PNG filename for given parameters.

    Args:
        width: Display width
        height: Display height
        style: Border style (1-24)

    Returns:
        Filename string like 'ani_border_128_32_1.png'
    """
    if style < 1 or style > BORDER_STYLE_COUNT:
        raise ValueError(f"Border style must be 1-{BORDER_STYLE_COUNT}")
    return f"ani_border_{width}_{height}_{style}.png"
