"""Command building for iPIXEL Color devices."""
from __future__ import annotations

import logging
import zlib

from pypixelcolor.lib.transport.send_plan import SendPlan, Window

_LOGGER = logging.getLogger(__name__)

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


def make_upside_down_command(upside_down: bool) -> bytes:
    """Build upside down (flip display 180°) command.

    Command format from ipixel-ctrl (opcode 0x8006):
    [length, 0, 0x06, 0x80, flip_flag]

    Args:
        upside_down: True to flip display 180°, False for normal

    Returns:
        Command bytes for upside down mode
    """
    flip_byte = 0x01 if upside_down else 0x00
    return make_command_payload(0x8006, bytes([flip_byte]))


def make_default_mode_command() -> bytes:
    """Build command to reset device to factory default display mode.

    Command format from ipixel-ctrl (opcode 0x8003):
    [length, 0, 0x03, 0x80] (no payload)

    Returns:
        Command bytes for default mode reset
    """
    return make_command_payload(0x8003, bytes([]))


def make_erase_data_command(buffers: list[int] | None = None, erase_all: bool = False) -> bytes:
    """Build command to erase stored data from device EEPROM.

    Command format from ipixel-ctrl (opcode 0x0102):
    Selective: [length, 0, 0x02, 0x01, count_low, count_high, buffer1, buffer2, ...]
    All: [length, 0, 0x02, 0x01, 0xFF, 0x00, 0x01, 0x02, ..., 0xFE]

    Args:
        buffers: List of buffer numbers to erase (1-255), or None with erase_all=True
        erase_all: True to erase all stored data

    Returns:
        Command bytes for erasing data

    Raises:
        ValueError: If neither buffers nor erase_all specified
    """
    if erase_all:
        # Erase all buffers (0x01 to 0xFE)
        payload = bytearray()
        payload.extend((0x00FF).to_bytes(2, 'little'))  # Count = 0x00FF flag for all
        payload.extend(bytes(range(0x01, 0xFF)))  # All buffer numbers 1-254
        return make_command_payload(0x0102, bytes(payload))
    elif buffers:
        # Selective erase
        for buf in buffers:
            if buf < 1 or buf > 255:
                raise ValueError("Buffer numbers must be 1-255")
        payload = bytearray()
        payload.extend(len(buffers).to_bytes(2, 'little'))
        payload.extend(bytes(buffers))
        return make_command_payload(0x0102, bytes(payload))
    else:
        raise ValueError("Must specify buffers list or erase_all=True")


def make_program_mode_command(buffers: list[int]) -> bytes:
    """Build command to set program mode (auto-cycle through stored screens).

    Command format from ipixel-ctrl (opcode 0x8008):
    [length, 0, 0x08, 0x80, count_low, count_high, buffer1, buffer2, ...]

    Args:
        buffers: List of buffer numbers to cycle through (1-9 typically)

    Returns:
        Command bytes for program mode

    Raises:
        ValueError: If buffers list is empty or contains invalid values
    """
    if not buffers:
        raise ValueError("Must specify at least one buffer")
    if len(buffers) > 9:
        raise ValueError("Maximum 9 buffers in program mode")
    for buf in buffers:
        if buf < 1 or buf > 255:
            raise ValueError("Buffer numbers must be 1-255")

    payload = bytearray()
    payload.extend(len(buffers).to_bytes(2, 'little'))
    payload.extend(bytes(buffers))
    return make_command_payload(0x8008, bytes(payload))


def make_rhythm_mode_advanced_command(style: int, levels: list[int]) -> bytes:
    """Build advanced rhythm mode command with 11 frequency band levels.

    Command format from pypixelcolor set_rhythm_mode.py:
    [16, 0, 1, 2, style, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11]

    Args:
        style: Rhythm style 0-4 (5 different visualizer styles)
        levels: List of 11 integers (0-15) for each frequency band level

    Returns:
        Command bytes for advanced rhythm mode

    Raises:
        ValueError: If style or levels are out of valid range
    """
    if style < 0 or style > 4:
        raise ValueError("Rhythm style must be 0-4")
    if len(levels) != 11:
        raise ValueError("Must provide exactly 11 frequency levels")
    for i, level in enumerate(levels):
        if level < 0 or level > 15:
            raise ValueError(f"Level {i+1} must be 0-15, got {level}")

    # Build command: [16, 0, 1, 2, style, l1-l11]
    command = bytearray([16, 0, 1, 2, style])
    command.extend(levels)
    return bytes(command)


def make_screen_command(screen: int) -> bytes:
    """Build command to select visible screen buffer.

    Command format from ipixel-ctrl (opcode 0x8007):
    [length, 0, 0x07, 0x80, screen]

    Args:
        screen: Screen number to display (1-9)

    Returns:
        Command bytes for screen selection

    Raises:
        ValueError: If screen is not in valid range (1-9)
    """
    if screen < 1 or screen > 9:
        raise ValueError("Screen must be between 1 and 9")

    return make_command_payload(0x8007, bytes([screen]))


def make_diy_mode_command(mode: int) -> bytes:
    """Build command to control DIY mode with extended options.

    Command format from ipixel-ctrl/ipixel-shader (opcode 0x0104):
    [length, 0, 0x04, 0x01, mode_byte]

    DIY Mode options (from ipixel-shader):
        0: QUIT_NOSAVE_KEEP_PREV  - Exit DIY mode, don't save, keep previous display
        1: ENTER_CLEAR_CUR_SHOW   - Enter DIY mode, clear display
        2: QUIT_STILL_CUR_SHOW    - Exit DIY mode, keep current display
        3: ENTER_NO_CLEAR_CUR_SHOW - Enter DIY mode, preserve current content

    Args:
        mode: DIY mode option (0-3), or bool for backwards compatibility
              True = mode 1 (enter + clear), False = mode 0 (exit + keep prev)

    Returns:
        Command bytes for DIY mode control
    """
    # Handle backwards compatibility with bool
    if isinstance(mode, bool):
        mode_byte = 0x01 if mode else 0x00
    else:
        if mode < 0 or mode > 3:
            raise ValueError("DIY mode must be 0-3")
        mode_byte = mode

    return make_command_payload(0x0104, bytes([mode_byte]))


def make_raw_command(hex_data: str) -> bytes:
    """Build raw command from hex string for expert/debugging use.

    This allows sending arbitrary commands to the device for testing
    or accessing undocumented features.

    Args:
        hex_data: Hex string (e.g., 'AABBCC' or 'AA BB CC')

    Returns:
        Command bytes from the hex data

    Raises:
        ValueError: If hex_data is empty or invalid
    """
    if not hex_data or len(hex_data) < 1:
        raise ValueError("At least one byte must be specified")

    # Remove spaces and convert to bytes
    hex_clean = hex_data.replace(" ", "")
    try:
        return bytes.fromhex(hex_clean)
    except ValueError as err:
        raise ValueError(f"Invalid hex data: {err}") from err


def make_set_password_command(enabled: bool, password: str) -> bytes:
    """Build command to set device password.

    Command format from ipixel-ctrl (opcode 0x0204):
    [length, 0, 0x04, 0x02, pwd_sw, pwd_1, pwd_2, pwd_3]

    The password is a 6-digit number (e.g., '123456') split into 3 pairs:
    - pwd_1 = first 2 digits as integer (12)
    - pwd_2 = middle 2 digits as integer (34)
    - pwd_3 = last 2 digits as integer (56)

    Args:
        enabled: True to enable password protection, False to disable
        password: 6-digit password string (e.g., '123456')

    Returns:
        Command bytes for setting password

    Raises:
        ValueError: If password is not exactly 6 digits
    """
    # Validate password format
    if not password or len(password) != 6:
        raise ValueError("Password must be exactly 6 digits")
    if not password.isdigit():
        raise ValueError("Password must contain only digits")

    pwd_sw = 0x01 if enabled else 0x00
    pwd_1 = int(password[0:2])  # XX0000
    pwd_2 = int(password[2:4])  # 00XX00
    pwd_3 = int(password[4:6])  # 0000XX

    return make_command_payload(0x0204, bytes([pwd_sw, pwd_1, pwd_2, pwd_3]))


def make_verify_password_command(password: str) -> bytes:
    """Build command to verify device password.

    Command format from ipixel-ctrl (opcode 0x0205):
    [length, 0, 0x05, 0x02, pwd_1, pwd_2, pwd_3]

    The password is a 6-digit number split into 3 pairs.

    Args:
        password: 6-digit password string (e.g., '123456')

    Returns:
        Command bytes for verifying password

    Raises:
        ValueError: If password is not exactly 6 digits
    """
    # Validate password format
    if not password or len(password) != 6:
        raise ValueError("Password must be exactly 6 digits")
    if not password.isdigit():
        raise ValueError("Password must contain only digits")

    pwd_1 = int(password[0:2])  # XX0000
    pwd_2 = int(password[2:4])  # 00XX00
    pwd_3 = int(password[4:6])  # 0000XX

    return make_command_payload(0x0205, bytes([pwd_1, pwd_2, pwd_3]))


# Mixed Data Block Types
MIX_BLOCK_TYPE_TEXT = 0x8000
MIX_BLOCK_TYPE_GIF = 0x0001  # Varies based on size
MIX_BLOCK_TYPE_PNG = 0x0001


def make_mix_block_header(
    block_type: int,
    data_size: int,
    x: int = 0,
    y: int = 0,
    width: int = 32,
    height: int = 32,
    duration: int = 100
) -> bytes:
    """Build a block header for mixed data content.

    Block header format (16 bytes) based on protocol examples:
    - Bytes 0-1: Block type/size indicator (little-endian)
    - Bytes 2-3: Reserved (0x0000)
    - Bytes 4-5: Mode/flags
    - Bytes 6-7: X position (little-endian)
    - Bytes 8-9: Y position and flags
    - Bytes 10-11: Width (little-endian)
    - Bytes 12-13: Height (little-endian)
    - Bytes 14-15: Duration or reserved

    Note: Block header format is partially documented. This implementation
    is based on reverse engineering the protocol examples.

    Args:
        block_type: Type of block (MIX_BLOCK_TYPE_TEXT, etc.)
        data_size: Size of the data following this header
        x: X position on display
        y: Y position on display
        width: Width of content area
        height: Height of content area
        duration: Display duration (0-100)

    Returns:
        16-byte block header
    """
    header = bytearray(16)

    # Block type/size indicator (bytes 0-1)
    if block_type == MIX_BLOCK_TYPE_TEXT:
        header[0:2] = (0x8000).to_bytes(2, 'little')
        header[4:6] = (0x0003).to_bytes(2, 'little')  # Text mode flag
    else:
        # For GIF/PNG, use data size in header
        header[0:2] = (data_size & 0xFFFF).to_bytes(2, 'little')
        header[4:6] = (0x0001).to_bytes(2, 'little')  # Image mode flag

    # Reserved (bytes 2-3)
    header[2:4] = (0x0000).to_bytes(2, 'little')

    # Position X (bytes 6-7) - combined with Y offset
    pos_combined = (y << 8) | (x & 0xFF)
    header[6:8] = pos_combined.to_bytes(2, 'little')

    # Width/Height (bytes 8-9)
    size_combined = (height << 8) | (width & 0xFF)
    header[8:10] = size_combined.to_bytes(2, 'little')

    # Duration (bytes 10-11)
    header[10:12] = duration.to_bytes(2, 'little')

    # Reserved (bytes 12-15)
    header[12:14] = (0x0064).to_bytes(2, 'little')  # Common value from examples
    header[14:16] = (0x0000).to_bytes(2, 'little')

    return bytes(header)

def _make_windows_from_payload(payload: bytes, screen_slot: int, command: bytes) -> list[Window]:
    """Helper function to split payload into windows for SendPlan."""
    # Calculate CRC32 of mix data
    crc = zlib.crc32(payload) & 0xFFFFFFFF
    payload_size = len(payload)

    #########################
    #      MULTI-FRAME      #
    #########################

    windows = []
    window_size = 12 * 1024
    pos = 0
    window_index = 0
    
    while pos < payload_size:
        window_end = min(pos + window_size, payload_size)
        chunk_payload = payload[pos:window_end]
        
        # Option: 0x00 for first frame, 0x02 for subsequent frames
        option = 0x00 if window_index == 0 else 0x02
        
        # Construct header for this frame
        # [00 01 Option] [Payload Size (4)] [CRC (4)] [00 SaveSlot]
        
        frame_header = bytearray()
        frame_header += command  # Command (e.g., [0x04 0x00] for mix data)
        frame_header += bytes([
            option  # Option
        ])
        
        # Payload Size (Total) - 4 bytes little endian
        frame_header += payload_size.to_bytes(4, byteorder="little")
        
        # CRC - 4 bytes little endian
        frame_header += crc.to_bytes(4, byteorder="little")
        
        # Tail - 2 bytes
        frame_header += bytes([0x02])                   # Reserved
        frame_header += bytes([int(screen_slot) & 0xFF])  # save_slot
        
        # Combine header and chunk
        frame_content = frame_header + chunk_payload
        
        # Calculate frame length prefix
        # Total size = len(frame_content) + 2 (for the prefix itself)
        frame_len = len(frame_content) + 2
        prefix = frame_len.to_bytes(2, byteorder="little")
        
        message = prefix + frame_content
        windows.append(Window(data=message, requires_ack=True))
        
        window_index += 1
        pos = window_end

    return windows

def make_mix_data_plan(
    blocks: list[tuple[bytes, bytes]],
    screen_slot: int = 1
) -> SendPlan:
    """Build plan to send mixed data (PNG + GIF + TEXT combined).

    Command format from ipixel-ctrl (opcode 0x0004):
    [length, opcode, 0x00, data_size(4), crc32(4), 0x02, screen_slot, mix_data...]

    Args:
        blocks: List of (header, data) tuples. Each tuple contains:
                - header: 16-byte block header (use make_mix_block_header)
                - data: Raw content data (PNG bytes, GIF bytes, or text bytes)
        screen_slot: Storage slot on device (1-255)

    Returns:
        SendPlan for mixed data upload

    Raises:
        ValueError: If blocks list is empty or screen_slot is invalid
    """
    if not blocks:
        raise ValueError("At least one block must be provided")
    if screen_slot < 1 or screen_slot > 255:
        raise ValueError("Screen slot must be 1-255")

    # Build mixed data payload from all blocks
    data_payload = bytearray()
    for header, data in blocks:
        data_payload.extend(header)
        data_payload.extend(data)

    # Make windows
    windows = _make_windows_from_payload(bytes(data_payload), screen_slot, bytes([0x04, 0x00]))

    _LOGGER.info(f"Split mix data into {len(windows)} frames")
    return SendPlan("send_mix_data", windows)

def make_mix_data_raw_plan(
    raw_mix_data: bytes,
    screen_slot: int = 1
) -> SendPlan:
    """Build command to send pre-built mixed data.

    This is for advanced users who want to send raw mixed data blocks
    without using the block header builder.

    Args:
        raw_mix_data: Pre-built mixed data with headers
        screen_slot: Storage slot on device (1-255)

    Returns:
        Command bytes for mixed data upload
    """
    if not raw_mix_data:
        raise ValueError("Mix data cannot be empty")
    if screen_slot < 1 or screen_slot > 255:
        raise ValueError("Screen slot must be 1-255")

    # Make windows
    windows = _make_windows_from_payload(bytes(raw_mix_data), screen_slot, bytes([0x04, 0x00]))

    _LOGGER.info(f"Split raw mix data into {len(windows)} frames")
    return SendPlan("send_raw_mix_data", windows)

# =============================================================================
# Batch Pixel Commands (from go-ipxl)
# =============================================================================

def make_batch_pixel_command(r: int, g: int, b: int, positions: list[tuple[int, int]]) -> bytes:
    """Build command to set multiple pixels of the same color at once.

    This is more efficient than sending individual pixel commands when
    drawing shapes or patterns with the same color.

    Command format from go-ipxl (display.go):
    [length_low, length_high, 5, 1, 0, R, G, B, x1, y1, x2, y2, ...]

    Args:
        r: Red component (0-255)
        g: Green component (0-255)
        b: Blue component (0-255)
        positions: List of (x, y) coordinate tuples

    Returns:
        Command bytes for batch pixel control

    Raises:
        ValueError: If positions list is empty or exceeds max size
    """
    if not positions:
        raise ValueError("At least one position must be specified")

    # Max positions per packet (BLE MTU limitation)
    # Header is 8 bytes, each position is 2 bytes
    # Max packet ~244 bytes, so max positions = (244 - 8) / 2 = 118
    MAX_POSITIONS_PER_PACKET = 118

    if len(positions) > MAX_POSITIONS_PER_PACKET:
        raise ValueError(f"Too many positions ({len(positions)}), max is {MAX_POSITIONS_PER_PACKET}")

    # Build header: [length, 0, 5, 1, 0, R, G, B]
    header = bytearray([0, 0, 5, 1, 0, r, g, b])

    # Build body: [x1, y1, x2, y2, ...]
    body = bytearray()
    for x, y in positions:
        body.append(x & 0xFF)
        body.append(y & 0xFF)

    # Set total length in header
    total_len = len(header) + len(body)
    header[0] = total_len & 0xFF
    header[1] = (total_len >> 8) & 0xFF

    return bytes(header + body)


def group_pixels_by_color(pixels: list[dict]) -> dict[tuple[int, int, int], list[tuple[int, int]]]:
    """Group pixels by their color for efficient batch sending.

    Args:
        pixels: List of dicts with 'x', 'y', and 'color' keys
                color can be hex string ('ff0000') or RGB tuple (255, 0, 0)

    Returns:
        Dictionary mapping RGB tuples to lists of (x, y) positions
    """
    color_groups: dict[tuple[int, int, int], list[tuple[int, int]]] = {}

    for pixel in pixels:
        x = pixel.get('x', 0)
        y = pixel.get('y', 0)
        color = pixel.get('color', 'ffffff')

        # Parse color to RGB tuple
        if isinstance(color, str):
            color = color.lstrip('#')
            if len(color) != 6:
                continue
            r = int(color[0:2], 16)
            g = int(color[2:4], 16)
            b = int(color[4:6], 16)
        elif isinstance(color, (tuple, list)) and len(color) >= 3:
            r, g, b = color[0], color[1], color[2]
        else:
            continue

        rgb = (r, g, b)
        if rgb not in color_groups:
            color_groups[rgb] = []
        color_groups[rgb].append((x, y))

    return color_groups


# =============================================================================
# Raw RGB Camera Protocol (from go-ipxl)
# =============================================================================

# Data type constants (from go-ipxl consts.go)
TYPE_CAMERA = 0
TYPE_VIDEO = 1
TYPE_IMAGE = 2
TYPE_GIF = 3
TYPE_TEXT = 4
TYPE_DIY_IMAGE = 5
TYPE_DIY_IMAGE_UNREDO = 6
TYPE_TEM = 7

# Chunk size for raw RGB transfer (from go-ipxl)
RAW_RGB_CHUNK_SIZE = 12288  # 12KB chunks

# Default values
DEFAULT_BRIGHTNESS = 50
DEFAULT_LED_FRAME_SIZE = 1024


def make_raw_rgb_chunk_command(
    chunk_data: bytes,
    total_rgb_data: bytes,
    chunk_index: int,
    brightness: int = 100
) -> bytes:
    """Build command to send a chunk of raw RGB data using the camera protocol.

    This is the raw RGB protocol from go-ipxl that sends pixel data directly
    without PNG/GIF encoding. Useful for real-time streaming or live animations.

    Command format from go-ipxl (packet_builder.go):
    [length_low, length_high, type_low, type_high, option, frame_len(4), data...]

    For camera type with CRC:
    [length_low, length_high, 0, 0, option, frame_len(4), crc32(4), 0x00, data...]

    Args:
        chunk_data: Raw RGB bytes for this chunk [R,G,B,R,G,B,...]
        total_rgb_data: Complete RGB data (for CRC calculation)
        chunk_index: Chunk index (0 for first, 1+ for continuation)
        brightness: Brightness level 1-100 (default 100 = no modification)

    Returns:
        Command bytes for raw RGB chunk
    """
    import zlib

    # Apply brightness if not 100%
    if brightness != 100 and brightness > 0:
        chunk_data = _apply_brightness(chunk_data, brightness)

    # Option: 0 for first chunk, 2 for continuation
    option = 0 if chunk_index == 0 else 2

    # Data type bytes for TYPE_CAMERA
    data_type_bytes = bytes([0, 0])

    # Header length for camera type is 9
    header_length = 9

    # Calculate total packet length (no CRC for camera type in simplified version)
    total_length = header_length + len(chunk_data)

    # Build header
    header = bytearray()
    header.append(total_length & 0xFF)           # Length low
    header.append((total_length >> 8) & 0xFF)    # Length high
    header.extend(data_type_bytes)               # Data type [0, 0]
    header.append(option)                        # Option (0=first, 2=continue)

    # Frame length (4 bytes, little-endian)
    frame_len = DEFAULT_LED_FRAME_SIZE
    header.extend(frame_len.to_bytes(4, 'little'))

    return bytes(header) + chunk_data


def _apply_brightness(data: bytes, brightness: int) -> bytes:
    """Apply brightness modification to RGB data.

    Multiplies each byte by brightness percentage.

    Args:
        data: Raw RGB bytes
        brightness: Brightness level 1-100

    Returns:
        Modified RGB bytes
    """
    result = bytearray(len(data))
    for i, byte_val in enumerate(data):
        new_val = (byte_val * brightness) // 100
        result[i] = min(255, max(0, new_val))
    return bytes(result)


def split_rgb_into_chunks(rgb_data: bytes, chunk_size: int = RAW_RGB_CHUNK_SIZE) -> list[bytes]:
    """Split RGB data into chunks for transmission.

    Args:
        rgb_data: Complete RGB byte array [R,G,B,R,G,B,...]
        chunk_size: Size of each chunk (default 12KB)

    Returns:
        List of byte chunks
    """
    chunks = []
    for i in range(0, len(rgb_data), chunk_size):
        chunks.append(rgb_data[i:i + chunk_size])
    return chunks


def make_countdown_timer_command(hours: int, minutes: int, seconds: int) -> bytes:
    """Build countdown timer command.

    Command format from APK reverse engineering:
    [0x07, 0x00, 0x0D, 0x80, hh, mm, ss]

    Args:
        hours: Hours (0-23)
        minutes: Minutes (0-59)
        seconds: Seconds (0-59)

    Returns:
        Command bytes for countdown timer
    """
    if hours < 0 or hours > 23:
        raise ValueError("Hours must be 0-23")
    if minutes < 0 or minutes > 59:
        raise ValueError("Minutes must be 0-59")
    if seconds < 0 or seconds > 59:
        raise ValueError("Seconds must be 0-59")

    return bytes([0x07, 0x00, 0x0D, 0x80, hours, minutes, seconds])


def make_scoreboard_command(score_a: int, score_b: int) -> bytes:
    """Build scoreboard display command.

    Command format from APK reverse engineering:
    [0x08, 0x00, 0x0A, 0x80, a_hi, a_lo, b_hi, b_lo]

    Args:
        score_a: Score for team A (0-999)
        score_b: Score for team B (0-999)

    Returns:
        Command bytes for scoreboard display
    """
    if score_a < 0 or score_a > 999:
        raise ValueError("Score A must be 0-999")
    if score_b < 0 or score_b > 999:
        raise ValueError("Score B must be 0-999")

    return bytes([
        0x08, 0x00, 0x0A, 0x80,
        (score_a >> 8) & 0xFF, score_a & 0xFF,
        (score_b >> 8) & 0xFF, score_b & 0xFF,
    ])


def make_stopwatch_command(mode: int) -> bytes:
    """Build stopwatch/chronograph command.

    Command format from APK reverse engineering:
    [0x05, 0x00, 0x09, 0x80, mode]

    Args:
        mode: Stopwatch mode (0=stop, 1=start, 2=reset)

    Returns:
        Command bytes for stopwatch control
    """
    if mode < 0 or mode > 2:
        raise ValueError("Stopwatch mode must be 0-2")

    return bytes([0x05, 0x00, 0x09, 0x80, mode])


def make_exit_mode_command() -> bytes:
    """Build exit/leave current device mode command.

    Command format from APK reverse engineering:
    [0x04, 0x00, 0x01, 0x01]

    Returns device to its default/idle state.

    Returns:
        Command bytes for exiting current mode
    """
    return bytes([0x04, 0x00, 0x01, 0x01])


def make_set_weekday_command(weekday: int) -> bytes:
    """Build set weekday command.

    Command format from APK reverse engineering:
    [0x05, 0x00, 0x12, 0x80, weekday]

    Args:
        weekday: Day of week (1=Monday through 7=Sunday, ISO 8601)

    Returns:
        Command bytes for setting weekday
    """
    if weekday < 1 or weekday > 7:
        raise ValueError("Weekday must be 1-7 (Monday=1, Sunday=7)")

    return bytes([0x05, 0x00, 0x12, 0x80, weekday])


def make_clock_mode_full_command(
    mode: int,
    show_date: bool = True,
    format_24: bool = True,
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
    weekday: int | None = None,
) -> bytes:
    """Build clock mode command with full date fields.

    Command format from APK reverse engineering:
    [0x0B, 0x00, 0x06, 0x01, mode, flagA, flagB, yy, mm, dd, weekday]

    Where flagA controls date display and flagB controls 24h format.

    Args:
        mode: Clock style (0-8)
        show_date: Show date alongside time (flagA: True=0x00, False=0x01)
        format_24: Use 24-hour format (flagB: True=0x01, False=0x00)
        year: Year (e.g. 2026). Defaults to current year.
        month: Month (1-12). Defaults to current month.
        day: Day (1-31). Defaults to current day.
        weekday: Day of week (1=Mon..7=Sun). Defaults to current.

    Returns:
        Command bytes for clock mode with date
    """
    import datetime as dt

    if mode < 0 or mode > 8:
        raise ValueError("Clock mode must be 0-8")

    now = dt.date.today()
    if year is None:
        year = now.year
    if month is None:
        month = now.month
    if day is None:
        day = now.day
    if weekday is None:
        weekday = now.isoweekday()

    flag_a = 0x00 if show_date else 0x01
    flag_b = 0x01 if format_24 else 0x00
    yy = year - 2000

    return bytes([
        0x0B, 0x00, 0x06, 0x01,
        mode, flag_a, flag_b,
        yy, month, day, weekday,
    ])


def make_delete_slots_command(slots: list[int]) -> bytes:
    """Build command to delete multiple slots at once.

    Command format from APK reverse engineering:
    [len_lo, len_hi, 0x02, 0x01, count_lo, count_hi, slot1, slot2, ...]

    Args:
        slots: List of slot numbers to delete (1-255)

    Returns:
        Command bytes for multi-slot delete
    """
    if not slots:
        raise ValueError("At least one slot must be specified")
    for slot in slots:
        if slot < 1 or slot > 255:
            raise ValueError("Slot values must be 1-255")

    slot_bytes = bytes(slots)
    total_len = 6 + len(slot_bytes)
    count = len(slots)

    return (
        total_len.to_bytes(2, 'little')
        + bytes([0x02, 0x01])
        + count.to_bytes(2, 'little')
        + slot_bytes
    )


def make_sport_data_command(value_a: int, value_b: int, value_c: int) -> bytes:
    """Build sport/fitness data display command.

    Command format from APK reverse engineering:
    [0x07, 0x00, 0x06, 0x00, a, b, c]

    The exact semantics of a/b/c are not fully labeled in the APK,
    but they likely represent step count, calories, or distance
    split across three bytes.

    Args:
        value_a: First data byte (0-255)
        value_b: Second data byte (0-255)
        value_c: Third data byte (0-255)

    Returns:
        Command bytes for sport data display
    """
    return bytes([
        0x07, 0x00, 0x06, 0x00,
        value_a & 0xFF, value_b & 0xFF, value_c & 0xFF,
    ])


def make_dual_panel_command(
    left_rgb: bytes,
    right_rgb: bytes,
    width: int,
    height: int,
) -> tuple[bytes, bytes]:
    """Build dual-panel (Devil Eye) display commands.

    The official app sends separate left/right RGB data for devices
    with dual displays (like the Devil Eye models).

    Args:
        left_rgb: Raw RGB bytes for left panel [R,G,B,R,G,B,...]
        right_rgb: Raw RGB bytes for right panel [R,G,B,R,G,B,...]
        width: Panel width in pixels
        height: Panel height in pixels

    Returns:
        Tuple of (left_command, right_command) bytes
    """
    expected_size = width * height * 3
    if len(left_rgb) != expected_size:
        raise ValueError(
            f"Left RGB data must be {expected_size} bytes, got {len(left_rgb)}"
        )
    if len(right_rgb) != expected_size:
        raise ValueError(
            f"Right RGB data must be {expected_size} bytes, got {len(right_rgb)}"
        )

    return left_rgb, right_rgb


def make_reserve_slot_command(slot: int) -> bytes:
    """Build command to reserve a slot before content save.

    Command format from APK reverse engineering:
    [0x07, 0x00, 0x08, 0x80, 0x01, 0x00, slot]

    Expected ACK: [0x05, 0x00, 0x08, 0x80, 0x01]

    This must be sent before uploading content to a device slot.
    The device responds with an ACK confirming the slot is reserved.

    Args:
        slot: Slot number to reserve (1-255)

    Returns:
        Command bytes for slot reservation
    """
    if slot < 1 or slot > 255:
        raise ValueError("Slot must be 1-255")

    return bytes([0x07, 0x00, 0x08, 0x80, 0x01, 0x00, slot])


def make_query_device_time_command(
    hour: int, minute: int, second: int, mode: int = 0
) -> bytes:
    """Build device time-sync status query command (getLedType2).

    Command format from APK reverse engineering:
    [0x08, 0x00, 0x01, 0x80, hh, mm, ss, mode]

    Sends current time to device and queries its LED type / time-sync state.

    Args:
        hour: Current hour (0-23)
        minute: Current minute (0-59)
        second: Current second (0-59)
        mode: Query mode (0 = default)

    Returns:
        Command bytes for time-sync status query
    """
    return bytes([
        0x08, 0x00, 0x01, 0x80,
        hour & 0xFF, minute & 0xFF, second & 0xFF, mode & 0xFF,
    ])


def make_query_device_datetime_command(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
    weekday: int | None = None,
    hour: int | None = None,
    minute: int | None = None,
    second: int | None = None,
) -> bytes:
    """Build device full date/time status query command (getLedTypeMecha).

    Command format from APK reverse engineering:
    [0x0B, 0x00, 0x01, 0x80, yy, mm, dd, weekday, hh, mm, ss]

    Sends current date and time to device for full synchronization.

    Args:
        year: Year (e.g. 2026). Defaults to current.
        month: Month (1-12). Defaults to current.
        day: Day (1-31). Defaults to current.
        weekday: Day of week (1=Mon..7=Sun). Defaults to current.
        hour: Hour (0-23). Defaults to current.
        minute: Minute (0-59). Defaults to current.
        second: Second (0-59). Defaults to current.

    Returns:
        Command bytes for full date/time sync query
    """
    import datetime as dt

    now = dt.datetime.now()
    if year is None:
        year = now.year
    if month is None:
        month = now.month
    if day is None:
        day = now.day
    if weekday is None:
        weekday = now.isoweekday()
    if hour is None:
        hour = now.hour
    if minute is None:
        minute = now.minute
    if second is None:
        second = now.second

    yy = (year - 2000) & 0xFF

    return bytes([
        0x0B, 0x00, 0x01, 0x80,
        yy, month & 0xFF, day & 0xFF, weekday & 0xFF,
        hour & 0xFF, minute & 0xFF, second & 0xFF,
    ])


def image_to_rgb_bytes(
    image_bytes: bytes,
    width: int,
    height: int,
    file_extension: str = ".png"
) -> bytes:
    """Convert image to raw RGB byte array.

    Args:
        image_bytes: Raw image file bytes (PNG, JPEG, etc.)
        width: Target width to resize to
        height: Target height to resize to
        file_extension: Image format hint

    Returns:
        Raw RGB bytes [R,G,B,R,G,B,...] with length = width * height * 3
    """
    from PIL import Image
    import io

    # Load image
    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB (handles RGBA, grayscale, etc.)
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize to target dimensions using nearest neighbor (like go-ipxl)
    img = img.resize((width, height), Image.Resampling.NEAREST)

    # Extract RGB bytes
    rgb_data = bytearray()
    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            rgb_data.append(r)
            rgb_data.append(g)
            rgb_data.append(b)

    return bytes(rgb_data)


# =============================================================================
# Device Alarm Clock Protocol (from APK decompilation)
# =============================================================================

# Duration mapping for alarm clock display
ALARM_DURATION_MAP = {
    0: 10,    # 10 seconds
    1: 30,    # 30 seconds
    2: 60,    # 1 minute
    3: 300,   # 5 minutes
    4: 900,   # 15 minutes
}

MAX_ALARMS = 10
MAX_TIMERS = 10


def _encode_week_bitmask(enabled: bool, weekdays: list[bool] | None = None) -> int:
    """Encode enabled flag + weekday repeat pattern into a single byte.

    Bit layout (LSB first):
        bit 0 = enabled (1=active, 0=disabled)
        bit 1 = Monday
        bit 2 = Tuesday
        bit 3 = Wednesday
        bit 4 = Thursday
        bit 5 = Friday
        bit 6 = Saturday
        bit 7 = Sunday

    Args:
        enabled: Whether the alarm/timer is active.
        weekdays: List of 7 booleans [Mon, Tue, Wed, Thu, Fri, Sat, Sun].
                  None or empty means one-shot (no repeat).

    Returns:
        Single byte encoding enabled + day flags.
    """
    week = 0
    if enabled:
        week |= 0x01
    if weekdays:
        if len(weekdays) != 7:
            raise ValueError("weekdays must be a list of 7 booleans [Mon..Sun]")
        for i, day in enumerate(weekdays):
            if day:
                week |= (1 << (i + 1))
    return week & 0xFF


def _int2byte(value: int) -> bytes:
    """Convert int to 4-byte little-endian (matches APK int2byte)."""
    return (value & 0xFFFFFFFF).to_bytes(4, 'little')


def make_alarm_clock_command(
    slot: int,
    hour: int,
    minute: int,
    image_data: bytes,
    enabled: bool = True,
    weekdays: list[bool] | None = None,
    duration_index: int = 0,
    content_type: int = 1,
    buzzer: bool = False,
    option: int = 0,
) -> bytes:
    """Build alarm clock packet with image payload.

    Protocol from APK SendCore.payLoadAlarmClockData() (24-byte header + data).
    The image_data should already be chunked to getLedFrameSize().

    Args:
        slot: Alarm slot index (0-9).
        hour: Hour (0-23).
        minute: Minute (0-59).
        image_data: Image data chunk for this packet.
        enabled: Whether alarm is active.
        weekdays: Repeat days [Mon..Sun], None for one-shot.
        duration_index: Display duration (0=10s, 1=30s, 2=60s, 3=5min, 4=15min).
        content_type: 1=file image, 2=raw pixel data.
        buzzer: Enable buzzer sound.
        option: 0=first chunk, 2=continuation chunk.

    Returns:
        Command bytes for alarm clock with image payload.
    """
    if slot < 0 or slot >= MAX_ALARMS:
        raise ValueError(f"Alarm slot must be 0-{MAX_ALARMS - 1}")
    if hour < 0 or hour > 23:
        raise ValueError("Hour must be 0-23")
    if minute < 0 or minute > 59:
        raise ValueError("Minute must be 0-59")
    if duration_index not in ALARM_DURATION_MAP:
        raise ValueError(f"Duration index must be one of {list(ALARM_DURATION_MAP.keys())}")

    duration_seconds = ALARM_DURATION_MAP[duration_index]
    week = _encode_week_bitmask(enabled, weekdays)

    total_len = len(image_data) + 24
    header = bytearray(24)

    # [0-1] packet length (LE)
    header[0] = total_len & 0xFF
    header[1] = (total_len >> 8) & 0xFF
    # [2] fixed zero
    header[2] = 0x00
    # [3] command flag
    header[3] = 0x80
    # [4] alarm slot
    header[4] = slot & 0xFF
    # [5] week bitmask
    header[5] = week
    # [6] hour
    header[6] = hour & 0xFF
    # [7] minute
    header[7] = minute & 0xFF
    # [8-9] duration in seconds (LE)
    header[8] = duration_seconds & 0xFF
    header[9] = (duration_seconds >> 8) & 0xFF
    # [10] content type
    header[10] = content_type & 0xFF
    # [11] buzzer
    header[11] = 0x01 if buzzer else 0x00
    # [12] option (first=0, continue=2)
    header[12] = option & 0xFF
    # [13-16] total image data length (LE)
    header[13:17] = _int2byte(len(image_data))
    # [17-20] CRC32 of image data (LE)
    crc = zlib.crc32(image_data) & 0xFFFFFFFF
    header[17:21] = _int2byte(crc)
    # [21-22] reserved
    header[21] = 0x00
    header[22] = 0x00
    # [23] slot offset (num + 120)
    header[23] = (slot + 120) & 0xFF

    return bytes(header) + image_data


def make_alarm_clock_plan(
    slot: int,
    hour: int,
    minute: int,
    image_data: bytes,
    enabled: bool = True,
    weekdays: list[bool] | None = None,
    duration_index: int = 0,
    content_type: int = 1,
    buzzer: bool = False,
    chunk_size: int = 4096,
) -> SendPlan:
    """Build a SendPlan for alarm clock with chunked image upload.

    Args:
        slot: Alarm slot index (0-9).
        hour: Hour (0-23).
        minute: Minute (0-59).
        image_data: Complete image data to upload.
        enabled: Whether alarm is active.
        weekdays: Repeat days [Mon..Sun], None for one-shot.
        duration_index: Display duration index.
        content_type: 1=file image, 2=raw pixel data.
        buzzer: Enable buzzer sound.
        chunk_size: Bytes per chunk (4096 for BLE, 12288 for WiFi).

    Returns:
        SendPlan for chunked alarm clock upload.
    """
    windows = []
    total_crc = zlib.crc32(image_data) & 0xFFFFFFFF
    duration_seconds = ALARM_DURATION_MAP.get(duration_index, 10)
    week = _encode_week_bitmask(enabled, weekdays)

    for i in range(0, len(image_data), chunk_size):
        chunk = image_data[i:i + chunk_size]
        option = 0 if i == 0 else 2

        total_len = len(chunk) + 24
        header = bytearray(24)
        header[0] = total_len & 0xFF
        header[1] = (total_len >> 8) & 0xFF
        header[2] = 0x00
        header[3] = 0x80
        header[4] = slot & 0xFF
        header[5] = week
        header[6] = hour & 0xFF
        header[7] = minute & 0xFF
        header[8] = duration_seconds & 0xFF
        header[9] = (duration_seconds >> 8) & 0xFF
        header[10] = content_type & 0xFF
        header[11] = 0x01 if buzzer else 0x00
        header[12] = option & 0xFF
        header[13:17] = _int2byte(len(image_data))
        header[17:21] = _int2byte(total_crc)
        header[21] = 0x00
        header[22] = 0x00
        header[23] = (slot + 120) & 0xFF

        windows.append(Window(data=bytes(header) + chunk, requires_ack=True))

    _LOGGER.info("Alarm clock plan: slot=%d, %02d:%02d, %d chunks", slot, hour, minute, len(windows))
    return SendPlan("alarm_clock", windows)


# =============================================================================
# Device Timing/Schedule Protocol (from APK decompilation)
# =============================================================================

def make_timing_command(
    slot: int,
    hour: int,
    minute: int,
    enabled: bool = True,
    weekdays: list[bool] | None = None,
    buzzer: bool = False,
) -> bytes:
    """Build device timing/schedule command (9 bytes).

    Protocol from APK SendCore.sendTimingData():
    [0x09, 0x00, 0x11, 0x80, buzzer, slot, week, hour, min]

    This is a lightweight on/off timer -- no image payload.

    Args:
        slot: Timer slot number (0-9).
        hour: Hour (0-23).
        minute: Minute (0-59).
        enabled: Whether timer is active.
        weekdays: Repeat days [Mon..Sun], None for one-shot.
        buzzer: Enable buzzer sound when timer fires.

    Returns:
        9-byte command for device timing.
    """
    if slot < 0 or slot >= MAX_TIMERS:
        raise ValueError(f"Timer slot must be 0-{MAX_TIMERS - 1}")
    if hour < 0 or hour > 23:
        raise ValueError("Hour must be 0-23")
    if minute < 0 or minute > 59:
        raise ValueError("Minute must be 0-59")

    week = _encode_week_bitmask(enabled, weekdays)

    return bytes([
        0x09, 0x00, 0x11, 0x80,
        0x01 if buzzer else 0x00,
        slot & 0xFF,
        week,
        hour & 0xFF,
        minute & 0xFF,
    ])


# =============================================================================
# Template/Subzone Protocol (from APK decompilation)
# =============================================================================

# Template content type constants
TEMPLATE_CONTENT_EMPTY = 0
TEMPLATE_CONTENT_ANIMATION = 1
TEMPLATE_CONTENT_IMAGE = 2
TEMPLATE_CONTENT_TEXT = 3


def _compact_to_one_byte(value: int) -> int:
    """Encode values >255 into a single byte (lossy, from APK compactToOneByte)."""
    if value > 255:
        return (value & 0xF0) | ((value >> 8) & 0x0F)
    return value & 0xFF


def make_template_zone_header(
    content_data: bytes,
    content_type: int,
    x: int,
    y: int,
    width: int,
    height: int,
    border_index: int = 0,
    border_speed: int = 0,
    border_effect: int = 0,
    item_border_index: int = 0,
    item_border_speed: int = 0,
    item_border_effect: int = 0,
) -> bytes:
    """Build a 16-byte zone header for template/subzone protocol.

    Args:
        content_data: The zone's content data (text bytes, BGR pixels, or GIF).
        content_type: 0=empty, 1=animation/GIF, 2=image BGR, 3=text.
        x: Zone X position on LED matrix.
        y: Zone Y position on LED matrix.
        width: Zone width in pixels.
        height: Zone height in pixels.
        border_index: Per-zone border style.
        border_speed: Per-zone border animation speed.
        border_effect: Per-zone border effect.
        item_border_index: Shared/global border style.
        item_border_speed: Shared/global border speed.
        item_border_effect: Shared/global border effect.

    Returns:
        16-byte zone header.
    """
    header = bytearray(16)
    content_len = len(content_data)
    header[0:4] = _int2byte(content_len)
    header[4] = content_type & 0xFF
    header[5] = x & 0xFF
    header[6] = y & 0xFF
    header[7] = _compact_to_one_byte(width)
    header[8] = _compact_to_one_byte(height)
    # Border params (only meaningful for text zones)
    if content_type == TEMPLATE_CONTENT_TEXT:
        header[9] = border_index & 0xFF
        header[10] = border_speed & 0xFF
        header[11] = border_effect & 0xFF
        header[12] = item_border_index & 0xFF
        header[13] = item_border_speed & 0xFF
        header[14] = item_border_effect & 0xFF
    header[15] = 0x00  # reserved
    return bytes(header)


def make_template_handshake_command(channel_index: int) -> bytes:
    """Build the 7-byte handshake sent before template data.

    Expected ACK: [0x05, 0x00, 0x08, 0x80, 0x01]

    Args:
        channel_index: Channel/slot index for this template.

    Returns:
        7-byte handshake command.
    """
    return bytes([0x07, 0x00, 0x08, 0x80, 0x01, 0x00, channel_index & 0xFF])


def make_template_plan(
    zones: list[dict],
    channel_index: int = 1,
    save_to_device: bool = True,
    chunk_size: int = 4096,
) -> SendPlan:
    """Build a SendPlan for template/subzone upload.

    Each zone dict should have:
        - content_type: int (0-3)
        - x, y, width, height: int
        - data: bytes (content data)
        - border_index, border_speed, border_effect: int (optional, for text)
        - item_border_index, item_border_speed, item_border_effect: int (optional)

    Args:
        zones: List of zone dictionaries.
        channel_index: Device slot to save to.
        save_to_device: True to persist on device, False for preview only.
        chunk_size: Bytes per BLE chunk.

    Returns:
        SendPlan for template upload (includes handshake window).
    """
    if not zones:
        raise ValueError("At least one zone is required")

    # Build concatenated zone data: header(16) + data for each zone
    zone_payload = bytearray()
    for zone in zones:
        content_data = zone.get("data", b"")
        header = make_template_zone_header(
            content_data=content_data,
            content_type=zone.get("content_type", TEMPLATE_CONTENT_EMPTY),
            x=zone.get("x", 0),
            y=zone.get("y", 0),
            width=zone.get("width", 32),
            height=zone.get("height", 32),
            border_index=zone.get("border_index", 0),
            border_speed=zone.get("border_speed", 0),
            border_effect=zone.get("border_effect", 0),
            item_border_index=zone.get("item_border_index", 0),
            item_border_speed=zone.get("item_border_speed", 0),
            item_border_effect=zone.get("item_border_effect", 0),
        )
        zone_payload.extend(header)
        zone_payload.extend(content_data)

    total_data = bytes(zone_payload)
    total_crc = zlib.crc32(total_data) & 0xFFFFFFFF

    # Data type for template: type=7 -> [0x04, 0x00]
    data_type = bytes([0x04, 0x00])

    windows = []

    # First window: handshake
    handshake = make_template_handshake_command(channel_index)
    windows.append(Window(data=handshake, requires_ack=True))

    # Subsequent windows: payloadTemChannel chunks
    for i in range(0, len(total_data), chunk_size):
        chunk = total_data[i:i + chunk_size]
        option = 0x00 if i == 0 else 0x02

        # Build payloadTemChannel wrapper
        pkt_len = len(chunk) + 15
        pkt = bytearray()
        pkt.extend(pkt_len.to_bytes(2, 'little'))       # [0-1] length
        pkt.extend(data_type)                            # [2-3] data type
        pkt.append(option)                               # [4] option
        pkt.extend(_int2byte(len(total_data)))           # [5-8] total length
        pkt.extend(_int2byte(total_crc))                 # [9-12] CRC32
        pkt.append(0x02)                                 # [13] template marker
        if save_to_device:
            pkt.append(101)                              # [14] save flag (0x65)
        else:
            pkt.append(channel_index & 0xFF)             # [14] channel index
        pkt.extend(chunk)                                # [15+] data

        windows.append(Window(data=bytes(pkt), requires_ack=True))

    _LOGGER.info("Template plan: %d zones, %d chunks", len(zones), len(windows) - 1)
    return SendPlan("send_template", windows)


# =============================================================================
# Corrected/New Commands (from APK decompilation)
# =============================================================================

def make_hw_info_command() -> bytes:
    """Build hardware info request command.

    Corrected from APK: opcode is 0x8005 (not 0x0000).
    [0x04, 0x00, 0x05, 0x80]
    """
    return bytes([0x04, 0x00, 0x05, 0x80])


def make_text_speed_command(speed: int) -> bytes:
    """Build standalone text scroll speed command.

    Command format from APK BaseSend:
    [0x05, 0x00, 0x03, 0x01, speed]

    This changes the text scroll speed without resending text data.

    Args:
        speed: Scroll speed (0-100).

    Returns:
        Command bytes for text speed.
    """
    if speed < 0 or speed > 100:
        raise ValueError("Speed must be 0-100")
    return bytes([0x05, 0x00, 0x03, 0x01, speed & 0xFF])


def make_rhythm_eq_command(mode: int, levels: list[int]) -> bytes:
    """Build rhythm EQ visualization command with 11 frequency bars.

    Command format from APK SendCore.sendRhythmChart:
    [0x10, 0x00, 0x01, 0x02, mode, bar1..bar11]

    Each bar is scaled from 0-255 input to 1-15 device range.

    Args:
        mode: Rhythm style (0-4).
        levels: List of 11 integers (0-255) for each frequency band.

    Returns:
        16-byte command for rhythm EQ.
    """
    if mode < 0 or mode > 4:
        raise ValueError("Mode must be 0-4")
    if len(levels) != 11:
        raise ValueError("Must provide exactly 11 frequency levels")

    # Scale 0-255 to 1-15 (matching APK behavior)
    scaled = []
    for level in levels:
        if level < 0:
            level = 0
        elif level > 255:
            level = 255
        bar = max(1, (level * 15) // 255) if level > 0 else 1
        scaled.append(bar)

    return bytes([0x10, 0x00, 0x01, 0x02, mode] + scaled)
