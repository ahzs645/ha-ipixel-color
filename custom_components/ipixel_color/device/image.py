"""Image display commands using pypixelcolor."""
from __future__ import annotations

from typing import Optional

try:
    from pypixelcolor.commands.send_image import send_image_hex
    from pypixelcolor.lib.transport.send_plan import SendPlan
    from pypixelcolor.lib.device_info import DeviceInfo
except ImportError:
    send_image_hex = None
    SendPlan = None


def make_image_plan(
    image_bytes: bytes,
    file_extension: str = ".png",
    resize_method: str = "crop",
    device_info: Optional[DeviceInfo] = None,
    save_slot: int = 0
) -> SendPlan:
    """Build image display plan using pypixelcolor.

    Args:
        image_bytes: Raw image data bytes (PNG, GIF, JPEG, etc.)
        file_extension: File extension to indicate image type (default: '.png')
        resize_method: Resize method - 'crop' (default) or 'fit'
                      'crop' will fill the entire target area and crop excess
                      'fit' will fit the entire image with black padding
        device_info: Device info object with dimensions and capabilities (optional)

    Returns:
        List of command bytes (one per window/frame)

    Raises:
        ImportError: If pypixelcolor is not available
    """
    if send_image_hex is None:
        raise ImportError("pypixelcolor library is not installed")

    # Convert bytes to hex string for pypixelcolor
    hex_string = image_bytes.hex()

    # Call pypixelcolor's send_image_hex function
    send_plan = send_image_hex(
        hex_string=hex_string,
        file_extension=file_extension,
        resize_method=resize_method,
        device_info=device_info,
        save_slot=save_slot
    )

    return send_plan
