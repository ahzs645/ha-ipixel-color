"""Support for services."""

from . import DOMAIN
from .api import iPIXELAPI
from .schedule import iPIXELScheduleManager, ScheduleItem
from homeassistant.const import ATTR_DEVICE_ID
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.helpers import device_registry as dr
import logging

_LOGGER = logging.getLogger(__name__)

# Service names
SERVICE_DISPLAY_TEXT = "display_text"
SERVICE_UPLOAD_GIF = "upload_gif"
SERVICE_ADD_SCHEDULE = "add_schedule"
SERVICE_REMOVE_SCHEDULE = "remove_schedule"
SERVICE_TRIGGER_SCHEDULE = "trigger_schedule"
SERVICE_SET_PLAYLIST = "set_playlist"
SERVICE_SYNC_TIME = "sync_time"
SERVICE_SET_PIXEL = "set_pixel"
SERVICE_SET_PIXELS = "set_pixels"
SERVICE_CLEAR_PIXELS = "clear_pixels"
SERVICE_SHOW_SLOT = "show_slot"
SERVICE_DELETE_SLOT = "delete_slot"
SERVICE_SET_BRIGHTNESS = "set_brightness"
SERVICE_SET_CLOCK_MODE = "set_clock_mode"
SERVICE_SET_TIME = "set_time"
# Enhanced scheduling services
SERVICE_CREATE_PLAYLIST = "create_playlist"
SERVICE_START_PLAYLIST = "start_playlist"
SERVICE_STOP_PLAYLIST = "stop_playlist"
SERVICE_SET_POWER_SCHEDULE = "set_power_schedule"
SERVICE_ADD_TIME_SLOT = "add_time_slot"
# New features from related projects
SERVICE_SET_UPSIDE_DOWN = "set_upside_down"
SERVICE_SET_DEFAULT_MODE = "set_default_mode"
SERVICE_ERASE_DATA = "erase_data"
SERVICE_SET_PROGRAM_MODE = "set_program_mode"
SERVICE_SET_RHYTHM_MODE_ADVANCED = "set_rhythm_mode_advanced"
SERVICE_DISPLAY_IMAGE_URL = "display_image_url"
# Screen and mode control (from ipixel-ctrl reference)
SERVICE_SET_SCREEN = "set_screen"
SERVICE_SET_DIY_MODE = "set_diy_mode"
SERVICE_SEND_RAW_COMMAND = "send_raw_command"
# Password management (from ipixel-ctrl protocol)
SERVICE_SET_PASSWORD = "set_password"
SERVICE_VERIFY_PASSWORD = "verify_password"
# Mixed data command (from ipixel-ctrl protocol)
SERVICE_SEND_MIX_DATA = "send_mix_data"
# Optimized pixel and image services (from go-ipxl)
SERVICE_SET_PIXELS_BATCHED = "set_pixels_batched"
SERVICE_DISPLAY_IMAGE_RAW_RGB = "display_image_raw_rgb"
SERVICE_DISPLAY_IMAGE_RAW_RGB_URL = "display_image_raw_rgb_url"
SERVICE_DRAW_SOLID_COLOR = "draw_solid_color"
# Visual rendering service (from UnexpectedMatrixPixels)
SERVICE_DRAW_VISUALS = "draw_visuals"

# Effect name to animation number mapping
EFFECT_MAP = {
    "fixed": 0,
    "scroll_ltr": 1,
    "scroll_rtl": 2,
    "blink": 3,
    "breeze": 4,
    "snow": 5,
    "laser": 6,
}

def rgb_to_hex(rgb) -> str:
    """Convert RGB array [r, g, b] to hex string 'rrggbb'."""
    if isinstance(rgb, (list, tuple)) and len(rgb) >= 3:
        return f"{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    return "ffffff"  # Default white

def async_get_entry_for_service_call(
    call: ServiceCall,
) -> tuple[dr.DeviceEntry, ConfigEntry]:
    """Get the entry ID related to a service call (by device ID)."""
    device_registry = dr.async_get(call.hass)
    device_id = call.data[ATTR_DEVICE_ID]

    _LOGGER.debug("Looking up device_id %o for service call %s", device_id, call.service)

    if (device_entry := device_registry.async_get(device_id)) is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="invalid_device_id",
            translation_placeholders={"device_id": device_id},
        )

    for entry_id in device_entry.config_entries:
        if (entry := call.hass.config_entries.async_get_entry(entry_id)) is None:
            continue
        if entry.domain == DOMAIN:
            if entry.state is not ConfigEntryState.LOADED:
                raise ServiceValidationError(
                    translation_domain=DOMAIN,
                    translation_key="entry_not_loaded",
                    translation_placeholders={"entry": entry.title},
                )
            return (device_entry, entry)

    raise ServiceValidationError(
        translation_domain=DOMAIN,
        translation_key="config_entry_not_found",
        translation_placeholders={"device_id": device_id},
    )

def get_schedule_manager(call: ServiceCall) -> iPIXELScheduleManager:
    """Helper to get schedule manager from hass.data."""
    entry_id = async_get_entry_for_service_call(call)[1].entry_id
    return call.hass.data[DOMAIN].get(f"{entry_id}_schedule")

def get_api(call: ServiceCall) -> iPIXELAPI:
    """Helper to get API instance from hass.data."""
    entry_id = async_get_entry_for_service_call(call)[1].entry_id
    return call.hass.data[DOMAIN][entry_id]

async def handle_display_text(call: ServiceCall) -> None:
    """Handle display_text service call."""
    api = get_api(call)

    text = call.data.get("text", "")
    effect = call.data.get("effect", "scroll_ltr")
    speed = call.data.get("speed", 50)
    color_fg = call.data.get("color_fg", [255, 255, 255])
    color_bg = call.data.get("color_bg", [0, 0, 0])
    font = call.data.get("font", "CUSONG")
    matrix_height_str = call.data.get("matrix_height", "")

    if not text:
        _LOGGER.warning("No text provided for display_text service")
        return

    try:
        # Convert effect name to animation number
        animation = EFFECT_MAP.get(effect, 0)

        # Convert RGB arrays to hex strings
        fg_hex = rgb_to_hex(color_fg)
        bg_hex = rgb_to_hex(color_bg)

        # Parse matrix height (empty string means auto)
        matrix_height = int(matrix_height_str) if matrix_height_str else None

        success = await api.display_text_pypixelcolor(
            text=text,
            color=fg_hex,
            bg_color=bg_hex,
            font=font,
            animation=animation,
            speed=speed,
            matrix_height=matrix_height
        )

        if success:
            _LOGGER.info("Text displayed: '%s' (effect=%s, speed=%d, font=%s)", text, effect, speed, font)
        else:
            _LOGGER.error("Failed to display text: '%s'", text)
    except Exception as err:
        _LOGGER.error("Error displaying text: %s", err)

async def handle_upload_gif(call: ServiceCall) -> None:
    """Handle upload_gif service call."""
    api = get_api(call)
    gif_url = call.data.get("gif_url")
    buffer_slot = call.data.get("buffer_slot", 1)

    if not gif_url:
        _LOGGER.error("No GIF URL provided")
        return

    try:
        success = await api.display_gif_url(gif_url, buffer_slot)
        if success:
            _LOGGER.info("GIF uploaded successfully from %s", gif_url)
        else:
            _LOGGER.error("Failed to upload GIF from %s", gif_url)
    except Exception as err:
        _LOGGER.error("Error uploading GIF: %s", err)

async def handle_add_schedule(call: ServiceCall) -> None:
    """Handle add_schedule service call."""
    import uuid
    schedule_manager = get_schedule_manager(call)

    schedule_id = str(uuid.uuid4())[:8]
    item = ScheduleItem(
        id=schedule_id,
        name=call.data.get("name", "Unnamed"),
        text=call.data.get("text", ""),
        mode=call.data.get("mode", "textimage"),
        duration_ms=call.data.get("duration_ms", 5000),
        slot=len(schedule_manager._schedules) + 1,
        time_trigger=None,
        enabled=True
    )

    await schedule_manager.add_schedule(item)
    _LOGGER.info("Added schedule: %s (%s)", item.name, item.id)

async def handle_remove_schedule(call: ServiceCall) -> None:
    """Handle remove_schedule service call."""
    schedule_manager = get_schedule_manager(call)
    schedule_id = call.data.get("schedule_id")
    if schedule_id:
        await schedule_manager.remove_schedule(schedule_id)
        _LOGGER.info("Removed schedule: %s", schedule_id)

async def handle_trigger_schedule(call: ServiceCall) -> None:
    """Handle trigger_schedule service call."""
    schedule_manager = get_schedule_manager(call)
    schedule_id = call.data.get("schedule_id")
    if schedule_id:
        success = await schedule_manager.trigger_schedule(schedule_id)
        if success:
            _LOGGER.info("Triggered schedule: %s", schedule_id)
        else:
            _LOGGER.error("Failed to trigger schedule: %s", schedule_id)

async def handle_set_playlist(call: ServiceCall) -> None:
    """Handle set_playlist service call."""
    schedule_manager = get_schedule_manager(call)
    schedule_ids_str = call.data.get("schedule_ids", "")
    schedule_ids = [s.strip() for s in schedule_ids_str.split(",") if s.strip()]

    if schedule_ids:
        await schedule_manager.set_playlist(schedule_ids)
        _LOGGER.info("Set playlist: %s", schedule_ids)

async def handle_sync_time(call: ServiceCall) -> None:
    """Handle sync_time service call."""
    api = get_api(call)
    try:
        success = await api.sync_time()
        if success:
            _LOGGER.info("Time synced to device")
        else:
            _LOGGER.error("Failed to sync time")
    except Exception as err:
        _LOGGER.error("Error syncing time: %s", err)

async def handle_set_pixel(call: ServiceCall) -> None:
    """Handle set_pixel service call."""
    api = get_api(call)
    x = call.data.get("x", 0)
    y = call.data.get("y", 0)
    color = call.data.get("color", "ffffff")

    try:
        # Ensure fun mode is enabled
        await api.set_fun_mode(True)

        success = await api.set_pixel(x, y, color)
        if success:
            _LOGGER.info("Pixel set at (%d, %d) to #%s", x, y, color)
        else:
            _LOGGER.error("Failed to set pixel at (%d, %d)", x, y)
    except Exception as err:
        _LOGGER.error("Error setting pixel: %s", err)

async def handle_set_pixels(call: ServiceCall) -> None:
    """Handle set_pixels service call."""
    api = get_api(call)
    pixels = call.data.get("pixels", [])

    if not pixels:
        _LOGGER.warning("No pixels provided")
        return

    try:
        # Ensure fun mode is enabled
        await api.set_fun_mode(True)

        success = await api.set_pixels(pixels)
        if success:
            _LOGGER.info("Set %d pixels successfully", len(pixels))
        else:
            _LOGGER.warning("Some pixels failed to set")
    except Exception as err:
        _LOGGER.error("Error setting pixels: %s", err)

async def handle_set_pixels_batched(call: ServiceCall) -> None:
    """Handle set_pixels_batched service call (optimized batch sending)."""
    api = get_api(call)
    pixels = call.data.get("pixels", [])

    if not pixels:
        _LOGGER.warning("No pixels provided")
        return

    try:
        # Ensure fun mode is enabled
        await api.set_fun_mode(True)

        success = await api.set_pixels_batched(pixels)
        if success:
            _LOGGER.info("Set %d pixels successfully (batched)", len(pixels))
        else:
            _LOGGER.warning("Some batched pixels failed to set")
    except Exception as err:
        _LOGGER.error("Error setting batched pixels: %s", err)

async def handle_display_image_raw_rgb(call: ServiceCall) -> None:
    """Handle display_image_raw_rgb service call (raw RGB protocol)."""
    api = get_api(call)
    image_path = call.data.get("image_path")
    brightness = call.data.get("brightness", 100)

    if not image_path:
        _LOGGER.error("No image_path provided")
        return

    try:
        import aiofiles
        async with aiofiles.open(image_path, 'rb') as f:
            image_bytes = await f.read()

        # Determine file extension
        file_ext = "." + image_path.split(".")[-1].lower() if "." in image_path else ".png"

        success = await api.display_image_raw_rgb(image_bytes, file_ext, brightness)
        if success:
            _LOGGER.info("Displayed raw RGB image: %s", image_path)
        else:
            _LOGGER.error("Failed to display raw RGB image")
    except FileNotFoundError:
        _LOGGER.error("Image file not found: %s", image_path)
    except Exception as err:
        _LOGGER.error("Error displaying raw RGB image: %s", err)

async def handle_display_image_raw_rgb_url(call: ServiceCall) -> None:
    """Handle display_image_raw_rgb_url service call (raw RGB from URL)."""
    api = get_api(call)
    url = call.data.get("url")
    brightness = call.data.get("brightness", 100)

    if not url:
        _LOGGER.error("No URL provided")
        return

    try:
        success = await api.display_image_raw_rgb_url(url, brightness)
        if success:
            _LOGGER.info("Displayed raw RGB image from URL: %s", url)
        else:
            _LOGGER.error("Failed to display raw RGB image from URL")
    except Exception as err:
        _LOGGER.error("Error displaying raw RGB image from URL: %s", err)

async def handle_draw_solid_color(call: ServiceCall) -> None:
    """Handle draw_solid_color service call (fill display with color)."""
    api = get_api(call)
    color = call.data.get("color", "000000")

    try:
        success = await api.draw_solid_color(color)
        if success:
            _LOGGER.info("Filled display with color #%s", color)
        else:
            _LOGGER.error("Failed to fill display with color")
    except Exception as err:
        _LOGGER.error("Error filling display with color: %s", err)

async def handle_draw_visuals(call: ServiceCall) -> None:
    """Handle draw_visuals service call (multi-element rendering with animation)."""
    from homeassistant.helpers.aiohttp_client import async_get_clientsession
    from .display.visual_renderer import VisualRenderer
    from .display.animation_controller import AnimationController
    from .display.font_cache import get_font_cache
    from .const import FPS_DEFAULT
    api = get_api(call)
    hass = call.hass
    entry = async_get_entry_for_service_call(call)[1] 

    elements = call.data.get("elements", [])
    background = call.data.get("background", [0, 0, 0])
    fps = call.data.get("fps", FPS_DEFAULT)

    if not elements:
        _LOGGER.warning("No elements provided for draw_visuals service")
        return

    try:
        # Parse background color
        if isinstance(background, list) and len(background) >= 3:
            bg_color = (int(background[0]), int(background[1]), int(background[2]))
        elif isinstance(background, str):
            from .color import hex_to_rgb
            bg_color = hex_to_rgb(background)
        else:
            bg_color = (0, 0, 0)

        # Get device info for dimensions
        device_info = await api.get_device_info()
        width = device_info.get("width", 64)
        height = device_info.get("height", 16)

        # Get HTTP session for image loading
        session = async_get_clientsession(hass)

        # Create renderer
        renderer = VisualRenderer(width, height, get_font_cache(), session)

        # Get or create animation controller
        controller_key = f"{entry.entry_id}_animation"
        if controller_key not in hass.data[DOMAIN]:
            hass.data[DOMAIN][controller_key] = AnimationController(hass, api, renderer)
        else:
            # Update renderer in existing controller
            controller = hass.data[DOMAIN][controller_key]
            controller._renderer = renderer

        controller = hass.data[DOMAIN][controller_key]

        # Prepare elements (async for image loading)
        prepared = await renderer.prepare_elements(elements, session)

        # Start rendering
        await controller.start(prepared, bg_color, fps)

        _LOGGER.info(
            "draw_visuals started: %d elements, fps=%d, animated=%s",
            len(elements), fps, renderer.detect_animation(prepared)
        )

    except Exception as err:
        _LOGGER.error("Error in draw_visuals: %s", err)

async def handle_clear_pixels(call: ServiceCall) -> None:
    """Handle clear_pixels service call."""
    api = get_api(call)
    try:
        success = await api.clear_display()
        if success:
            _LOGGER.info("Display cleared")
        else:
            _LOGGER.error("Failed to clear display")
    except Exception as err:
        _LOGGER.error("Error clearing display: %s", err)

async def handle_show_slot(call: ServiceCall) -> None:
    """Handle show_slot service call."""
    api = get_api(call)
    slot = call.data.get("slot", 0)

    try:
        success = await api.show_slot(slot)
        if success:
            _LOGGER.info("Showing slot %d", slot)
        else:
            _LOGGER.error("Failed to show slot %d", slot)
    except Exception as err:
        _LOGGER.error("Error showing slot: %s", err)

async def handle_delete_slot(call: ServiceCall) -> None:
    """Handle delete_slot service call."""
    api = get_api(call)
    slot = call.data.get("slot", 0)

    try:
        success = await api.delete_slot(slot)
        if success:
            _LOGGER.info("Deleted slot %d", slot)
        else:
            _LOGGER.error("Failed to delete slot %d", slot)
    except Exception as err:
        _LOGGER.error("Error deleting slot: %s", err)

async def handle_set_brightness(call: ServiceCall) -> None:
    """Handle set_brightness service call."""
    api = get_api(call)
    level = call.data.get("level", 50)

    try:
        success = await api.set_brightness(level)
        if success:
            _LOGGER.info("Brightness set to %d%%", level)
        else:
            _LOGGER.error("Failed to set brightness to %d%%", level)
    except Exception as err:
        _LOGGER.error("Error setting brightness: %s", err)

async def handle_set_clock_mode(call: ServiceCall) -> None:
    """Handle set_clock_mode service call."""
    api = get_api(call)
    style = call.data.get("style", 1)
    show_date = call.data.get("show_date", True)
    format_24 = call.data.get("format_24", True)
    date = call.data.get("date", "")

    try:
        success = await api.set_clock_mode(style, date, show_date, format_24)
        if success:
            _LOGGER.info("Clock mode set: style=%d, show_date=%s, 24h=%s", style, show_date, format_24)
        else:
            _LOGGER.error("Failed to set clock mode")
    except Exception as err:
        _LOGGER.error("Error setting clock mode: %s", err)

async def handle_set_time(call: ServiceCall) -> None:
    """Handle set_time service call."""
    api = get_api(call)
    hour = call.data.get("hour", 0)
    minute = call.data.get("minute", 0)
    second = call.data.get("second", 0)

    try:
        success = await api.set_time(hour, minute, second)
        if success:
            _LOGGER.info("Time set to %02d:%02d:%02d", hour, minute, second)
        else:
            _LOGGER.error("Failed to set time")
    except Exception as err:
        _LOGGER.error("Error setting time: %s", err)

async def handle_create_playlist(call: ServiceCall) -> None:
    """Handle create_playlist service call."""
    schedule_manager = get_schedule_manager(call)
    name = call.data.get("name", "New Playlist")
    loop = call.data.get("loop", True)
    shuffle = call.data.get("shuffle", False)

    try:
        playlist_id = await schedule_manager.create_playlist(name, loop=loop, shuffle=shuffle)
        _LOGGER.info("Created playlist '%s' (id=%s)", name, playlist_id)
    except Exception as err:
        _LOGGER.error("Error creating playlist: %s", err)

async def handle_start_playlist(call: ServiceCall) -> None:
    """Handle start_playlist service call."""
    schedule_manager = get_schedule_manager(call)
    playlist_id = call.data.get("playlist_id")

    try:
        success = await schedule_manager.start_playlist(playlist_id)
        if success:
            _LOGGER.info("Started playlist %s", playlist_id or "(active)")
        else:
            _LOGGER.error("Failed to start playlist")
    except Exception as err:
        _LOGGER.error("Error starting playlist: %s", err)

async def handle_stop_playlist(call: ServiceCall) -> None:
    """Handle stop_playlist service call."""
    schedule_manager = get_schedule_manager(call)
    try:
        await schedule_manager.stop_playlist_loop()
        _LOGGER.info("Playlist stopped")
    except Exception as err:
        _LOGGER.error("Error stopping playlist: %s", err)

async def handle_set_power_schedule(call: ServiceCall) -> None:
    """Handle set_power_schedule service call."""
    schedule_manager = get_schedule_manager(call)
    enabled = call.data.get("enabled", True)
    on_time = call.data.get("on_time", "07:00")
    off_time = call.data.get("off_time", "22:00")
    days = call.data.get("days")

    try:
        await schedule_manager.set_power_schedule(enabled, on_time, off_time, days)
        if enabled:
            await schedule_manager.start_power_schedule_monitoring()
        else:
            schedule_manager.stop_power_schedule_monitoring()
        _LOGGER.info("Power schedule configured: on=%s, off=%s", on_time, off_time)
    except Exception as err:
        _LOGGER.error("Error setting power schedule: %s", err)

async def handle_add_time_slot(call: ServiceCall) -> None:
    """Handle add_time_slot service call."""
    schedule_manager = get_schedule_manager(call)
    name = call.data.get("name", "Time Slot")
    playlist_id = call.data.get("playlist_id", "")
    start_time = call.data.get("start_time", "00:00")
    end_time = call.data.get("end_time", "23:59")
    days = call.data.get("days")
    priority = call.data.get("priority", 0)

    try:
        slot_id = await schedule_manager.add_time_slot(
            name, playlist_id, start_time, end_time, days, priority
        )
        await schedule_manager.start_time_slot_monitoring()
        _LOGGER.info("Added time slot '%s' (id=%s)", name, slot_id)
    except Exception as err:
        _LOGGER.error("Error adding time slot: %s", err)

# New feature handlers

async def handle_set_upside_down(call: ServiceCall) -> None:
    """Handle set_upside_down service call."""
    api = get_api(call)
    upside_down = call.data.get("upside_down", False)

    try:
        success = await api.set_upside_down(upside_down)
        if success:
            _LOGGER.info("Upside down mode %s", "enabled" if upside_down else "disabled")
        else:
            _LOGGER.error("Failed to set upside down mode")
    except Exception as err:
        _LOGGER.error("Error setting upside down mode: %s", err)

async def handle_set_default_mode(call: ServiceCall) -> None:
    """Handle set_default_mode service call."""
    api = get_api(call)
    try:
        success = await api.set_default_mode()
        if success:
            _LOGGER.info("Device reset to default mode")
        else:
            _LOGGER.error("Failed to reset to default mode")
    except Exception as err:
        _LOGGER.error("Error resetting to default mode: %s", err)

async def handle_erase_data(call: ServiceCall) -> None:
    """Handle erase_data service call."""
    api = get_api(call)
    erase_all = call.data.get("erase_all", False)
    buffers_str = call.data.get("buffers", "")

    try:
        # Parse buffers from comma-separated string
        buffers = None
        if buffers_str and not erase_all:
            buffers = [int(b.strip()) for b in buffers_str.split(",") if b.strip()]

        success = await api.erase_data(buffers=buffers, erase_all=erase_all)
        if success:
            if erase_all:
                _LOGGER.info("All data erased from device")
            else:
                _LOGGER.info("Buffers %s erased from device", buffers)
        else:
            _LOGGER.error("Failed to erase data")
    except Exception as err:
        _LOGGER.error("Error erasing data: %s", err)

async def handle_set_program_mode(call: ServiceCall) -> None:
    """Handle set_program_mode service call."""
    api = get_api(call)
    buffers_str = call.data.get("buffers", "")

    if not buffers_str:
        _LOGGER.error("No buffers specified for program mode")
        return

    try:
        # Parse buffers from comma-separated string
        buffers = [int(b.strip()) for b in buffers_str.split(",") if b.strip()]

        success = await api.set_program_mode(buffers)
        if success:
            _LOGGER.info("Program mode set with buffers: %s", buffers)
        else:
            _LOGGER.error("Failed to set program mode")
    except Exception as err:
        _LOGGER.error("Error setting program mode: %s", err)

async def handle_set_rhythm_mode_advanced(call: ServiceCall) -> None:
    """Handle set_rhythm_mode_advanced service call."""
    api = get_api(call)
    style = call.data.get("style", 0)
    levels_str = call.data.get("levels", "")

    if not levels_str:
        _LOGGER.error("No frequency levels specified")
        return

    try:
        # Parse levels from comma-separated string
        levels = [int(l.strip()) for l in levels_str.split(",") if l.strip()]

        if len(levels) != 11:
            _LOGGER.error("Must provide exactly 11 frequency levels, got %d", len(levels))
            return

        success = await api.set_rhythm_mode_advanced(style, levels)
        if success:
            _LOGGER.info("Advanced rhythm mode set: style=%d", style)
        else:
            _LOGGER.error("Failed to set advanced rhythm mode")
    except Exception as err:
        _LOGGER.error("Error setting advanced rhythm mode: %s", err)

async def handle_display_image_url(call: ServiceCall) -> None:
    """Handle display_image_url service call."""
    api = get_api(call)
    url = call.data.get("url")
    buffer_slot = call.data.get("buffer_slot", 1)

    if not url:
        _LOGGER.error("No URL provided for display_image_url")
        return

    try:
        success = await api.display_image_url(url, buffer_slot)
        if success:
            _LOGGER.info("Image from URL displayed: %s", url)
        else:
            _LOGGER.error("Failed to display image from URL: %s", url)
    except Exception as err:
        _LOGGER.error("Error displaying image from URL: %s", err)

# Screen and mode control handlers (from ipixel-ctrl reference)

async def handle_set_screen(call: ServiceCall) -> None:
    """Handle set_screen service call."""
    api = get_api(call)
    screen = call.data.get("screen", 1)

    try:
        success = await api.set_screen(screen)
        if success:
            _LOGGER.info("Screen set to %d", screen)
        else:
            _LOGGER.error("Failed to set screen to %d", screen)
    except Exception as err:
        _LOGGER.error("Error setting screen: %s", err)

async def handle_set_diy_mode(call: ServiceCall) -> None:
    """Handle set_diy_mode service call."""
    api = get_api(call)
    # Support both old 'enable' bool and new 'mode' int parameter
    mode_str = call.data.get("mode")
    enable = call.data.get("enable")

    if mode_str is not None:
        mode = int(mode_str)
    elif enable is not None:
        # Backwards compatibility with bool
        mode = 1 if enable else 0
    else:
        mode = 1  # Default to enter + clear

    mode_names = {
        0: "exit (keep previous)",
        1: "enter (clear display)",
        2: "exit (keep current)",
        3: "enter (preserve content)"
    }

    try:
        success = await api.set_diy_mode(mode)
        if success:
            _LOGGER.info("DIY mode set to: %s", mode_names.get(mode, str(mode)))
        else:
            _LOGGER.error("Failed to set DIY mode")
    except Exception as err:
        _LOGGER.error("Error setting DIY mode: %s", err)

async def handle_send_raw_command(call: ServiceCall) -> None:
    """Handle send_raw_command service call."""
    api = get_api(call)
    hex_data = call.data.get("hex_data", "")

    if not hex_data:
        _LOGGER.error("No hex data provided for send_raw_command")
        return

    try:
        success = await api.send_raw_command(hex_data)
        if success:
            _LOGGER.info("Raw command sent: %s", hex_data)
        else:
            _LOGGER.error("Failed to send raw command: %s", hex_data)
    except Exception as err:
        _LOGGER.error("Error sending raw command: %s", err)

# Password management handlers

async def handle_set_password(call: ServiceCall) -> None:
    """Handle set_password service call."""
    api = get_api(call)
    enabled = call.data.get("enabled", True)
    password = call.data.get("password", "")

    if not password:
        _LOGGER.error("No password provided for set_password")
        return

    try:
        success = await api.set_password(enabled, password)
        if success:
            _LOGGER.info("Password protection %s", "enabled" if enabled else "disabled")
        else:
            _LOGGER.error("Failed to set password")
    except Exception as err:
        _LOGGER.error("Error setting password: %s", err)

async def handle_verify_password(call: ServiceCall) -> None:
    """Handle verify_password service call."""
    api = get_api(call)
    password = call.data.get("password", "")

    if not password:
        _LOGGER.error("No password provided for verify_password")
        return

    try:
        success = await api.verify_password(password)
        if success:
            _LOGGER.info("Password verified successfully")
        else:
            _LOGGER.error("Password verification failed")
    except Exception as err:
        _LOGGER.error("Error verifying password: %s", err)

async def handle_send_mix_data(call: ServiceCall) -> None:
    """Handle send_mix_data service call."""
    api = get_api(call)
    hex_data = call.data.get("hex_data", "")
    screen_slot = call.data.get("screen_slot", 1)

    if not hex_data:
        _LOGGER.error("No hex data provided for send_mix_data")
        return

    try:
        success = await api.send_mix_data_raw(hex_data, screen_slot)
        if success:
            _LOGGER.info("Mixed data sent to slot %d", screen_slot)
        else:
            _LOGGER.error("Failed to send mixed data")
    except Exception as err:
        _LOGGER.error("Error sending mixed data: %s", err)


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register iPIXEL services."""

    # Register all services if not already registered
    if not hass.services.has_service(DOMAIN, SERVICE_DISPLAY_TEXT):
        hass.services.async_register(DOMAIN, SERVICE_DISPLAY_TEXT, handle_display_text)
    if not hass.services.has_service(DOMAIN, SERVICE_UPLOAD_GIF):
        hass.services.async_register(DOMAIN, SERVICE_UPLOAD_GIF, handle_upload_gif)
    if not hass.services.has_service(DOMAIN, SERVICE_ADD_SCHEDULE):
        hass.services.async_register(DOMAIN, SERVICE_ADD_SCHEDULE, handle_add_schedule)
    if not hass.services.has_service(DOMAIN, SERVICE_REMOVE_SCHEDULE):
        hass.services.async_register(DOMAIN, SERVICE_REMOVE_SCHEDULE, handle_remove_schedule)
    if not hass.services.has_service(DOMAIN, SERVICE_TRIGGER_SCHEDULE):
        hass.services.async_register(DOMAIN, SERVICE_TRIGGER_SCHEDULE, handle_trigger_schedule)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PLAYLIST):
        hass.services.async_register(DOMAIN, SERVICE_SET_PLAYLIST, handle_set_playlist)
    if not hass.services.has_service(DOMAIN, SERVICE_SYNC_TIME):
        hass.services.async_register(DOMAIN, SERVICE_SYNC_TIME, handle_sync_time)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PIXEL):
        hass.services.async_register(DOMAIN, SERVICE_SET_PIXEL, handle_set_pixel)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PIXELS):
        hass.services.async_register(DOMAIN, SERVICE_SET_PIXELS, handle_set_pixels)
    if not hass.services.has_service(DOMAIN, SERVICE_CLEAR_PIXELS):
        hass.services.async_register(DOMAIN, SERVICE_CLEAR_PIXELS, handle_clear_pixels)
    if not hass.services.has_service(DOMAIN, SERVICE_SHOW_SLOT):
        hass.services.async_register(DOMAIN, SERVICE_SHOW_SLOT, handle_show_slot)
    if not hass.services.has_service(DOMAIN, SERVICE_DELETE_SLOT):
        hass.services.async_register(DOMAIN, SERVICE_DELETE_SLOT, handle_delete_slot)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_BRIGHTNESS):
        hass.services.async_register(DOMAIN, SERVICE_SET_BRIGHTNESS, handle_set_brightness)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_CLOCK_MODE):
        hass.services.async_register(DOMAIN, SERVICE_SET_CLOCK_MODE, handle_set_clock_mode)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_TIME):
        hass.services.async_register(DOMAIN, SERVICE_SET_TIME, handle_set_time)
    if not hass.services.has_service(DOMAIN, SERVICE_CREATE_PLAYLIST):
        hass.services.async_register(DOMAIN, SERVICE_CREATE_PLAYLIST, handle_create_playlist)
    if not hass.services.has_service(DOMAIN, SERVICE_START_PLAYLIST):
        hass.services.async_register(DOMAIN, SERVICE_START_PLAYLIST, handle_start_playlist)
    if not hass.services.has_service(DOMAIN, SERVICE_STOP_PLAYLIST):
        hass.services.async_register(DOMAIN, SERVICE_STOP_PLAYLIST, handle_stop_playlist)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_POWER_SCHEDULE):
        hass.services.async_register(DOMAIN, SERVICE_SET_POWER_SCHEDULE, handle_set_power_schedule)
    if not hass.services.has_service(DOMAIN, SERVICE_ADD_TIME_SLOT):
        hass.services.async_register(DOMAIN, SERVICE_ADD_TIME_SLOT, handle_add_time_slot)
    # New feature services
    if not hass.services.has_service(DOMAIN, SERVICE_SET_UPSIDE_DOWN):
        hass.services.async_register(DOMAIN, SERVICE_SET_UPSIDE_DOWN, handle_set_upside_down)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_DEFAULT_MODE):
        hass.services.async_register(DOMAIN, SERVICE_SET_DEFAULT_MODE, handle_set_default_mode)
    if not hass.services.has_service(DOMAIN, SERVICE_ERASE_DATA):
        hass.services.async_register(DOMAIN, SERVICE_ERASE_DATA, handle_erase_data)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PROGRAM_MODE):
        hass.services.async_register(DOMAIN, SERVICE_SET_PROGRAM_MODE, handle_set_program_mode)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_RHYTHM_MODE_ADVANCED):
        hass.services.async_register(DOMAIN, SERVICE_SET_RHYTHM_MODE_ADVANCED, handle_set_rhythm_mode_advanced)
    if not hass.services.has_service(DOMAIN, SERVICE_DISPLAY_IMAGE_URL):
        hass.services.async_register(DOMAIN, SERVICE_DISPLAY_IMAGE_URL, handle_display_image_url)
    # Screen and mode control services (from ipixel-ctrl reference)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_SCREEN):
        hass.services.async_register(DOMAIN, SERVICE_SET_SCREEN, handle_set_screen)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_DIY_MODE):
        hass.services.async_register(DOMAIN, SERVICE_SET_DIY_MODE, handle_set_diy_mode)
    if not hass.services.has_service(DOMAIN, SERVICE_SEND_RAW_COMMAND):
        hass.services.async_register(DOMAIN, SERVICE_SEND_RAW_COMMAND, handle_send_raw_command)
    # Password management services (from ipixel-ctrl protocol)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PASSWORD):
        hass.services.async_register(DOMAIN, SERVICE_SET_PASSWORD, handle_set_password)
    if not hass.services.has_service(DOMAIN, SERVICE_VERIFY_PASSWORD):
        hass.services.async_register(DOMAIN, SERVICE_VERIFY_PASSWORD, handle_verify_password)
    # Mixed data service (from ipixel-ctrl protocol)
    if not hass.services.has_service(DOMAIN, SERVICE_SEND_MIX_DATA):
        hass.services.async_register(DOMAIN, SERVICE_SEND_MIX_DATA, handle_send_mix_data)
    # Optimized pixel and image services (from go-ipxl)
    if not hass.services.has_service(DOMAIN, SERVICE_SET_PIXELS_BATCHED):
        hass.services.async_register(DOMAIN, SERVICE_SET_PIXELS_BATCHED, handle_set_pixels_batched)
    if not hass.services.has_service(DOMAIN, SERVICE_DISPLAY_IMAGE_RAW_RGB):
        hass.services.async_register(DOMAIN, SERVICE_DISPLAY_IMAGE_RAW_RGB, handle_display_image_raw_rgb)
    if not hass.services.has_service(DOMAIN, SERVICE_DISPLAY_IMAGE_RAW_RGB_URL):
        hass.services.async_register(DOMAIN, SERVICE_DISPLAY_IMAGE_RAW_RGB_URL, handle_display_image_raw_rgb_url)
    if not hass.services.has_service(DOMAIN, SERVICE_DRAW_SOLID_COLOR):
        hass.services.async_register(DOMAIN, SERVICE_DRAW_SOLID_COLOR, handle_draw_solid_color)
    # Visual rendering service (from UnexpectedMatrixPixels)
    if not hass.services.has_service(DOMAIN, SERVICE_DRAW_VISUALS):
        hass.services.async_register(DOMAIN, SERVICE_DRAW_VISUALS, handle_draw_visuals)

