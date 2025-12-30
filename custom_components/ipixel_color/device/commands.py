"""Command building for iPIXEL Color devices."""
from __future__ import annotations


def make_power_command(on: bool) -> bytes:
    """Build power control command.
    
    Command format from protocol documentation:
    [5, 0, 7, 1, on_byte] where on_byte = 1 for on, 0 for off
    """
    on_byte = 1 if on else 0
    return bytes([5, 0, 7, 1, on_byte])


def make_brightness_command(brightness: int) -> bytes:
    """Build brightness control command.

    Command 0x8004 from ipixel-ctrl set_brightness.py

    Args:
        brightness: Brightness level from 1 to 100

    Returns:
        Command bytes for brightness control

    Raises:
        ValueError: If brightness is not in valid range (1-100)
    """
    if brightness < 1 or brightness > 100:
        raise ValueError("Brightness must be between 1 and 100")

    return make_command_payload(0x8004, bytes([brightness]))


def make_command_payload(opcode: int, payload: bytes) -> bytes:
    """Create command with header (following ipixel-ctrl/common.py format)."""
    total_length = len(payload) + 4  # +4 for length and opcode

    command = bytearray()
    command.extend(total_length.to_bytes(2, 'little'))  # Length (little-endian)
    command.extend(opcode.to_bytes(2, 'little'))        # Opcode (little-endian)
    command.extend(payload)                             # Payload data

    return bytes(command)


def make_orientation_command(orientation: int) -> bytes:
    """Build orientation control command.

    Command format from pypixelcolor:
    [5, 0, 6, 0x80, orientation]

    Args:
        orientation: 0=normal, 1=90°, 2=180°, 3=270°

    Returns:
        Command bytes for orientation control
    """
    if orientation < 0 or orientation > 3:
        raise ValueError("Orientation must be 0-3")

    return bytes([5, 0, 6, 0x80, orientation])


def make_rhythm_mode_command(style: int, speed: int = 4) -> bytes:
    """Build rhythm/music visualizer mode command.

    Command format from pypixelcolor (set_rhythm_mode_2):
    [6, 0, 0, 2, speed, style]

    Args:
        style: Rhythm style 0-4 (5 different visualizer styles)
        speed: Animation speed 0-7 (8 speed levels)

    Returns:
        Command bytes for rhythm mode
    """
    if style < 0 or style > 4:
        raise ValueError("Rhythm style must be 0-4")
    if speed < 0 or speed > 7:
        raise ValueError("Rhythm speed must be 0-7")

    return bytes([6, 0, 0, 2, speed, style])


def make_fun_mode_command(enable: bool) -> bytes:
    """Build fun mode (pixel control mode) command.

    Command format from pypixelcolor:
    [5, 0, 4, 1, enable_byte]

    Args:
        enable: True to enable fun mode, False to disable

    Returns:
        Command bytes for fun mode control
    """
    enable_byte = 1 if enable else 0
    return bytes([5, 0, 4, 1, enable_byte])


def make_pixel_command(x: int, y: int, color: str) -> bytes:
    """Build single pixel control command.

    Command format from pypixelcolor:
    [10, 0, 5, 1, 0, R, G, B, x, y]

    Args:
        x: X coordinate (0 to width-1)
        y: Y coordinate (0 to height-1)
        color: Hex color string (e.g., 'ff0000' for red)

    Returns:
        Command bytes for pixel control
    """
    # Parse hex color
    color = color.lstrip('#')
    if len(color) != 6:
        raise ValueError("Color must be 6 hex characters")

    r = int(color[0:2], 16)
    g = int(color[2:4], 16)
    b = int(color[4:6], 16)

    return bytes([10, 0, 5, 1, 0, r, g, b, x, y])


def make_clear_command() -> bytes:
    """Build clear display command.

    Command format from pypixelcolor:
    [4, 0, 3, 0x80]

    Note: This clears the display content without affecting power state.

    Returns:
        Command bytes for clearing display
    """
    return bytes([4, 0, 3, 0x80])


def make_show_slot_command(slot: int) -> bytes:
    """Build show slot command to display content from a stored slot.

    Command format from pypixelcolor:
    [7, 0, 8, 0x80, 1, 0, slot]

    Args:
        slot: Slot number to display (0-255)

    Returns:
        Command bytes for showing slot
    """
    if slot < 0 or slot > 255:
        raise ValueError("Slot must be 0-255")

    return bytes([7, 0, 8, 0x80, 1, 0, slot])


def make_delete_slot_command(slot: int) -> bytes:
    """Build delete slot command to remove content from a stored slot.

    Command format from pypixelcolor:
    [7, 0, 2, 1, 1, 0, slot]

    Args:
        slot: Slot index to delete (0-255)

    Returns:
        Command bytes for deleting slot
    """
    if slot < 0 or slot > 255:
        raise ValueError("Slot must be 0-255")

    return bytes([7, 0, 2, 1, 1, 0, slot])


def make_set_time_command(hour: int, minute: int, second: int) -> bytes:
    """Build set time command to set specific time on device.

    Command format from pypixelcolor:
    [8, 0, 1, 0x80, hour, minute, second, 0]

    Args:
        hour: Hour (0-23)
        minute: Minute (0-59)
        second: Second (0-59)

    Returns:
        Command bytes for setting time
    """
    if hour < 0 or hour > 23:
        raise ValueError("Hour must be 0-23")
    if minute < 0 or minute > 59:
        raise ValueError("Minute must be 0-59")
    if second < 0 or second > 59:
        raise ValueError("Second must be 0-59")

    return bytes([8, 0, 1, 0x80, hour, minute, second, 0])