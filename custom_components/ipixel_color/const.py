"""Constants for the iPIXEL Color integration."""
from __future__ import annotations

DOMAIN = "ipixel_color"
DEFAULT_NAME = "iPIXEL Display"
MANUFACTURER = "iPIXEL"

# Bluetooth UUIDs from protocol documentation
WRITE_UUID = "0000fa02-0000-1000-8000-00805f9b34fb"
NOTIFY_UUID = "0000fa03-0000-1000-8000-00805f9b34fb"
SERVICE_UUID = "0000fa01-0000-1000-8000-00805f9b34fb"

# Device discovery
DEVICE_NAME_PREFIX = "LED_BLE_"

# Configuration keys (config entry data)
CONF_ADDRESS = "address"
CONF_NAME = "name"
CONF_ENTRY_TYPE = "entry_type"
CONF_MEMBERS = "members"
CONF_MEMBER_ENTRY_ID = "entry_id"
CONF_ROW = "row"
CONF_COL = "col"
CONF_SYNC_SLOT = "sync_slot"

# Options keys
CONF_WIDTH = "width"
CONF_HEIGHT = "height"
CONF_ACK_TIMEOUT = "ack_timeout"
CONF_CHUNK_SIZE = "chunk_size"

ENTRY_TYPE_PANEL = "panel"
ENTRY_TYPE_GROUP = "group"

# Slot used to start animations on all panels of a combined display at once (0 = off)
DEFAULT_SYNC_SLOT = 1

# Connection settings
CONNECTION_TIMEOUT = 20.0
MAX_CONNECT_ATTEMPTS = 3
# How many panels of a combined display are driven at the same time (an
# ESPHome Bluetooth proxy offers at most 8 connection slots).
PANEL_UPLOAD_CONCURRENCY = 4
DEFAULT_ACK_TIMEOUT = 10.0
# Extra ACK wait per kilobyte of upload: panels decode and store large GIFs
# before they acknowledge, and a proxy shared by several panels is slower.
ACK_SECONDS_PER_KB = 2.0
# Minimum interval between automatic reconnect attempts after a panel
# advertises again (seconds).
AUTO_RECONNECT_INTERVAL = 30.0
# Status pixel: while a display shows no Home Assistant content, one pixel in
# the top-right corner toggles at this interval as long as HA is connected.
STATUS_PIXEL_INTERVAL = 10.0
# Native text animations that boot-loop panels other than 32x32 (ipixel-ctrl findings).
UNSAFE_TEXT_ANIMATIONS = (3, 4)
STATUS_PIXEL_COLOR = "00c000"
BLE_CHUNK_SIZE = 244
# Through an ESPHome/Shelly Bluetooth proxy 244 byte writes stall and fail with
# GATT error 133; 100 byte writes are reliable and several times faster.
BLE_PROXY_CHUNK_SIZE = 100
BLE_MIN_CHUNK_SIZE = 20
TIME_SYNC_INTERVAL_HOURS = 1

# Debounce for coalescing rapid setting changes into one display update
UPDATE_DEBOUNCE_SECONDS = 0.4

# Display modes
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

# Modes that are rendered by Home Assistant as an image (and can therefore be
# spread over multiple panels as one large screen).
IMAGE_MODES = (MODE_TEXT_IMAGE, MODE_GIF)

# Orientation options (0=normal, 90, 180, 270 degrees)
AVAILABLE_ORIENTATIONS = ["0", "90", "180", "270"]
DEFAULT_ORIENTATION = "0"
ORIENTATION_MAP = {"0": 0, "90": 1, "180": 2, "270": 3}

# Rhythm mode styles
AVAILABLE_RHYTHM_STYLES = ["0", "1", "2", "3", "4"]
DEFAULT_RHYTHM_STYLE = "0"

# Clock styles
AVAILABLE_CLOCK_STYLES = [str(i) for i in range(9)]
DEFAULT_CLOCK_STYLE = "1"

# Visual effects (applied to rendered images)
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

DEFAULT_FONT = "OpenSans-Light.ttf"
DEFAULT_NATIVE_FONT = "UNIFONT"

# Schedule settings
DEFAULT_SCHEDULE_INTERVAL_MS = 5000
MIN_SCHEDULE_INTERVAL_MS = 1000
MAX_SCHEDULE_INTERVAL_MS = 3600000  # 1 hour

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

# Frontend card
CARD_URL_PATH = f"/{DOMAIN}/ipixel-display-card.js"
