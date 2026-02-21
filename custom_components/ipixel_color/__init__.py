"""The iPIXEL Color integration."""
from __future__ import annotations

import logging
from datetime import timedelta

from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigType
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.event import async_track_time_interval

from .api import iPIXELAPI, iPIXELConnectionError, iPIXELTimeoutError
from .const import DOMAIN, CONF_ADDRESS, CONF_NAME
from .common import update_ipixel_display
from .schedule import iPIXELScheduleManager, ScheduleItem
from .services import async_setup_services

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
    Platform.CAMERA,
]


# Frontend card registration flag
FRONTEND_REGISTERED = False

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Bring! services."""

    async_setup_services(hass)
    return True

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

        await api.set_power(True)  # Ensure device is on at startup

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

    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.debug("Unloading iPIXEL Color integration")

    # Unload platforms
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # Stop animation controller if running
        animation_controller = hass.data[DOMAIN].pop(f"{entry.entry_id}_animation", None)
        if animation_controller:
            try:
                await animation_controller.stop()
                _LOGGER.debug("Stopped animation controller")
            except Exception as err:
                _LOGGER.debug("Error stopping animation controller: %s", err)

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