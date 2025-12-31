"""The iPIXEL Color integration."""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.event import async_track_time_interval

from .api import iPIXELAPI, iPIXELConnectionError, iPIXELTimeoutError
from .const import DOMAIN, CONF_ADDRESS, CONF_NAME
from .schedule import iPIXELScheduleManager, ScheduleItem

_LOGGER = logging.getLogger(__name__)

# Platforms supported by this integration
PLATFORMS: list[Platform] = [
    Platform.SWITCH,
    Platform.TEXT,
    Platform.SENSOR,
    Platform.SELECT,
    Platform.NUMBER,
    Platform.BUTTON,
    Platform.LIGHT,
    Platform.MEDIA_PLAYER,
]

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

# Frontend card registration flag
FRONTEND_REGISTERED = False


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Register the Lovelace card as a frontend resource."""
    global FRONTEND_REGISTERED

    if FRONTEND_REGISTERED:
        return

    # Get the path to our www folder
    www_path = Path(__file__).parent / "www"
    card_url = f"/{DOMAIN}/ipixel-display-card.js"

    # Register static path for serving the card
    await hass.http.async_register_static_paths([
        StaticPathConfig(card_url, str(www_path / "ipixel-display-card.js"), cache_headers=False)
    ])

    # Add the card as a Lovelace resource
    # This uses the built-in resource registration
    hass.data.setdefault("lovelace_resources", set())
    if card_url not in hass.data["lovelace_resources"]:
        hass.data["lovelace_resources"].add(card_url)

        # Fire event to notify frontend of new resource
        hass.bus.async_fire("lovelace_updated", {"url_path": card_url})

    FRONTEND_REGISTERED = True
    _LOGGER.info("iPIXEL Display Card frontend registered at %s", card_url)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up iPIXEL Color from a config entry."""
    address = entry.data[CONF_ADDRESS]
    name = entry.data[CONF_NAME]

    _LOGGER.debug("Setting up iPIXEL Color for %s (%s)", name, address)

    # Create API instance with hass for Bluetooth proxy support
    api = iPIXELAPI(hass, address)

    # Test connection
    try:
        if not await api.connect():
            raise ConfigEntryNotReady(f"Failed to connect to iPIXEL device at {address}")

        _LOGGER.info("Successfully connected to iPIXEL device %s", address)

        # Get device info for sensors
        await api.get_device_info()

    except iPIXELTimeoutError as err:
        _LOGGER.error("Connection timeout to iPIXEL device %s: %s", address, err)
        raise ConfigEntryNotReady(f"Connection timeout: {err}") from err

    except iPIXELConnectionError as err:
        _LOGGER.error("Failed to connect to iPIXEL device %s: %s", address, err)
        raise ConfigEntryNotReady(f"Connection failed: {err}") from err

    # Store API instance in hass.data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = api
    entry.runtime_data = api

    # Initialize schedule manager
    schedule_manager = iPIXELScheduleManager(hass, api, address)
    await schedule_manager.async_load()
    hass.data[DOMAIN][f"{entry.entry_id}_schedule"] = schedule_manager

    # Register Lovelace card frontend resources
    await _async_register_frontend(hass)

    # Set up hourly time sync
    async def _sync_time(now=None) -> None:
        """Sync time to device hourly."""
        try:
            if api.is_connected:
                await api.sync_time()
                _LOGGER.debug("Hourly time sync completed")
        except Exception as err:
            _LOGGER.warning("Hourly time sync failed: %s", err)

    # Register the hourly sync
    entry.async_on_unload(
        async_track_time_interval(hass, _sync_time, timedelta(hours=1))
    )

    # Register services
    await _async_register_services(hass, entry, api, schedule_manager)

    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def _async_register_services(
    hass: HomeAssistant,
    entry: ConfigEntry,
    api: iPIXELAPI,
    schedule_manager: iPIXELScheduleManager
) -> None:
    """Register iPIXEL services."""

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

    async def handle_display_text(call: ServiceCall) -> None:
        """Handle display_text service call."""
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
        schedule_id = call.data.get("schedule_id")
        if schedule_id:
            await schedule_manager.remove_schedule(schedule_id)
            _LOGGER.info("Removed schedule: %s", schedule_id)

    async def handle_trigger_schedule(call: ServiceCall) -> None:
        """Handle trigger_schedule service call."""
        schedule_id = call.data.get("schedule_id")
        if schedule_id:
            success = await schedule_manager.trigger_schedule(schedule_id)
            if success:
                _LOGGER.info("Triggered schedule: %s", schedule_id)
            else:
                _LOGGER.error("Failed to trigger schedule: %s", schedule_id)

    async def handle_set_playlist(call: ServiceCall) -> None:
        """Handle set_playlist service call."""
        schedule_ids_str = call.data.get("schedule_ids", "")
        schedule_ids = [s.strip() for s in schedule_ids_str.split(",") if s.strip()]

        if schedule_ids:
            await schedule_manager.set_playlist(schedule_ids)
            _LOGGER.info("Set playlist: %s", schedule_ids)

    async def handle_sync_time(call: ServiceCall) -> None:
        """Handle sync_time service call."""
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

    async def handle_clear_pixels(call: ServiceCall) -> None:
        """Handle clear_pixels service call."""
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
        try:
            await schedule_manager.stop_playlist_loop()
            _LOGGER.info("Playlist stopped")
        except Exception as err:
            _LOGGER.error("Error stopping playlist: %s", err)

    async def handle_set_power_schedule(call: ServiceCall) -> None:
        """Handle set_power_schedule service call."""
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


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.debug("Unloading iPIXEL Color integration")

    # Unload platforms
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # Stop schedule manager playlist loop
        schedule_manager = hass.data[DOMAIN].pop(f"{entry.entry_id}_schedule", None)
        if schedule_manager:
            try:
                await schedule_manager.stop_playlist_loop()
                _LOGGER.debug("Stopped schedule manager")
            except Exception as err:
                _LOGGER.debug("Error stopping schedule manager: %s", err)

        # Disconnect from device
        api: iPIXELAPI = hass.data[DOMAIN].pop(entry.entry_id)
        try:
            await api.disconnect()
            _LOGGER.debug("Disconnected from iPIXEL device")
        except Exception as err:
            _LOGGER.error("Error disconnecting from device: %s", err)

    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)