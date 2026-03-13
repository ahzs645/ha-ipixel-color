"""Device information management for iPIXEL Color devices."""
from __future__ import annotations

import logging
from typing import Any

from bleak_retry_connector import BleakClientWithServiceCache

try:
    from pypixelcolor.lib.internal_commands import build_get_device_info_command, _handle_device_info_response
    from pypixelcolor.lib.device_info import DeviceInfo, DEVICE_TYPE_MAP, LED_SIZE_MAP
except ImportError:
    build_get_device_info_command = None
    _handle_device_info_response = None
    DEVICE_TYPE_MAP = None
    LED_SIZE_MAP = None

_LOGGER = logging.getLogger(__name__)

def device_info_to_dict(device_info: DeviceInfo) -> dict[str, Any]:
    """Convert a DeviceInfo object to a dictionary for easier access.

    Args:
        device_info: The DeviceInfo object to convert.
    Returns:
        A dictionary containing the device information.
    
    Raises:
        ImportError: If pypixelcolor is not available.
    """
    if DEVICE_TYPE_MAP is None:
        raise ImportError("pypixelcolor library is not installed")
    
    device_type_id = DEVICE_TYPE_MAP.get(device_info.device_type, -1)

    led_type = LED_SIZE_MAP.get(device_type_id, ("...", "..."))

    device_type_str = str(device_type_id) + " " + str(led_type[0]) + "x" + str(led_type[1])
    return {
        "width": device_info.width,
        "height": device_info.height,
        "device_type_str": device_type_str,
        "mcu_version": device_info.mcu_version,
        "wifi_version": device_info.wifi_version,
    }

def build_device_info_command() -> bytes:
    """Build device info query command using pypixelcolor.

    Returns:
        Command bytes to query device information.

    Raises:
        ImportError: If pypixelcolor is not available.
    """
    if build_get_device_info_command is None:
        raise ImportError("pypixelcolor library is not installed")

    return build_get_device_info_command()

async def handle_device_info_response(client: BleakClientWithServiceCache, response_bytes: bytes) -> DeviceInfo:
    """Parse device info response bytes into a DeviceInfo object.

    Args:
        response_bytes: Raw bytes received from the device in response to a device info query.

    Returns:
        DeviceInfo object containing parsed information about the device.

    Raises:
        ImportError: If pypixelcolor is not available.
        ValueError: If the response cannot be parsed into a valid DeviceInfo.
    """
    if _handle_device_info_response is None:
        raise ImportError("pypixelcolor library is not installed")

    try:
        device_info = await _handle_device_info_response(client, response_bytes)
        return device_info
    except Exception as e:
        _LOGGER.error(f"Failed to parse device info response: {e}")
        raise ValueError("Invalid device info response") from e