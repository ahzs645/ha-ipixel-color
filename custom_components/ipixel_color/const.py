"""Constants for the iPIXEL Color integration."""

DOMAIN = "ipixel_color"
DEFAULT_NAME = "iPIXEL Display"

# Bluetooth UUIDs from protocol documentation
WRITE_UUID = "0000fa02-0000-1000-8000-00805f9b34fb"
NOTIFY_UUID = "0000fa03-0000-1000-8000-00805f9b34fb"
CCCD_UUID = "00002902-0000-1000-8000-00805f9b34fb"

# Device discovery
DEVICE_NAME_PREFIX = "LED_BLE_"

# Configuration keys
CONF_ADDRESS = "address"
CONF_NAME = "name"

# Update interval
SCAN_INTERVAL = 30

# Connection settings
CONNECTION_TIMEOUT = 10
RECONNECT_ATTEMPTS = 3
RECONNECT_DELAY = 1  # seconds between retry attempts

# Display modes (based on pypixelcolor capabilities)
MODE_TEXT_IMAGE = "textimage"
MODE_TEXT = "text"
MODE_CLOCK = "clock"
MODE_GIF = "gif"
MODE_RHYTHM = "rhythm"

AVAILABLE_MODES = [
    MODE_TEXT_IMAGE,
    MODE_TEXT,
    MODE_CLOCK,
    MODE_GIF,
    MODE_RHYTHM,
]

DEFAULT_MODE = MODE_TEXT_IMAGE

# Orientation options (0=normal, 1=90°, 2=180°, 3=270°)
AVAILABLE_ORIENTATIONS = ["0", "90", "180", "270"]
DEFAULT_ORIENTATION = "0"

# Rhythm mode styles (5 visualizer styles)
AVAILABLE_RHYTHM_STYLES = ["0", "1", "2", "3", "4"]
DEFAULT_RHYTHM_STYLE = "0"

# Native text animations (opcode 0x0100, properties byte 4).
# Labels follow ipixel-ctrl/docs/DeviceCommands.md section 0x0100, which is the
# only formal spec of this field. Note the gap at 3/4 -- see below.
TEXT_ANIM_STATIC = 0
TEXT_ANIM_SCROLL_LEFT = 1
TEXT_ANIM_SCROLL_RIGHT = 2
TEXT_ANIM_BLINK = 5
TEXT_ANIM_BREEZE = 6
TEXT_ANIM_SNOW = 7
TEXT_ANIM_LASER = 8

TEXT_ANIMATION_LABELS = {
    TEXT_ANIM_STATIC: "static",
    TEXT_ANIM_SCROLL_LEFT: "scroll_left",
    TEXT_ANIM_SCROLL_RIGHT: "scroll_right",
    TEXT_ANIM_BLINK: "blink",
    TEXT_ANIM_BREEZE: "breeze",
    TEXT_ANIM_SNOW: "snow",
    TEXT_ANIM_LASER: "laser",
}

# Animations 3 and 4 are known to put the device into a boot loop on panels that
# are not 32x32. The device stores the offending payload in SPI flash and then
# crashes re-reading it on every boot, so recovery means racing a clear command
# into a very short window at power-on.
#
# Every upstream implementation blocks them:
#   - pypixelcolor commands/send_text: raises for non-32x32 devices
#   - lucagoc/SuperIlu iPixel-CLI commands.py: raises unconditionally
#   - ToBiDi0410/iPixel-ESP32 iPixelCommands.cpp: returns an empty frame
#   - freijn ipixel_text_v2.h: silently remaps 3/4 to 0
UNSAFE_TEXT_ANIMATIONS = frozenset({3, 4})

# Panel size on which animations 3/4 have been observed to work.
SAFE_ANIMATION_DIMENSIONS = (32, 32)

# Visual effects
AVAILABLE_EFFECTS = [
    "none",
    "blur",
    "sharpen",
    "contour",
    "edge_enhance",
    "emboss",
    "smooth",
    "detail",
    "invert",
    "grayscale",
    "mirror",
    "flip",
    "posterize",
    "solarize",
    "high_contrast",
    "brighten",
    "darken",
]

DEFAULT_EFFECT = "none"

# Schedule settings
DEFAULT_SCHEDULE_INTERVAL_MS = 5000
MIN_SCHEDULE_INTERVAL_MS = 1000
MAX_SCHEDULE_INTERVAL_MS = 3600000  # 1 hour

# GIF settings
GIF_WINDOW_SIZE = 12 * 1024  # 12KB windows
GIF_CHUNK_SIZE = 244  # BLE chunk size
GIF_ACK_TIMEOUT = 8.0  # seconds

# Media player states
MEDIA_PLAYER_IDLE = "idle"
MEDIA_PLAYER_PLAYING = "playing"
MEDIA_PLAYER_PAUSED = "paused"

# Animation/FPS constants for draw_visuals service
FPS_MIN = 1
FPS_MAX = 30
FPS_DEFAULT = 10

# Element types for draw_visuals service
ELEMENT_TEXT = "text"
ELEMENT_TEXTSCROLL = "textscroll"
ELEMENT_TEXTLONG = "textlong"
ELEMENT_ICON = "icon"
ELEMENT_IMAGE = "image"
ELEMENT_PIXELS = "pixels"

ELEMENT_TYPES = [
    ELEMENT_TEXT,
    ELEMENT_TEXTSCROLL,
    ELEMENT_TEXTLONG,
    ELEMENT_ICON,
    ELEMENT_IMAGE,
    ELEMENT_PIXELS,
]

# Wi-Fi socket transport constants (from APK reverse engineering)
WIFI_DEFAULT_HOST = "192.168.4.1"
WIFI_DEFAULT_PORT = 80
WIFI_WRITE_CHUNK_SIZE = 12288  # 12KB chunks
WIFI_SOCKET_TIMEOUT = 5.0  # seconds
WIFI_MAX_DEVICE_SLOTS = 100

# BLE MTU negotiation (from APK)
BLE_REQUESTED_MTU = 512