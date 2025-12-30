"""The iPIXEL Color integration."""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

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

# Type alias for iPIXEL config entries


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

    # Register all services if not already registered
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