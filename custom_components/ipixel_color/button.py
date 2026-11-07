"""Button platform for iPIXEL Color."""
from __future__ import annotations

import logging

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import iPIXELDeviceEntity
from .runtime import iPIXELRuntime

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up buttons."""
    runtime: iPIXELRuntime = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        [
            iPIXELUpdateButton(runtime),
            iPIXELSyncTimeButton(runtime),
            iPIXELClearButton(runtime),
        ]
    )


class iPIXELUpdateButton(iPIXELDeviceEntity, ButtonEntity):
    """Render the current settings to the display."""

    _attr_translation_key = "update_display"
    _attr_icon = "mdi:refresh"

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the button."""
        super().__init__(runtime, key="update_button")

    async def async_press(self) -> None:
        """Update the display."""
        await self._async_run(self.runtime.async_update_display())


class iPIXELSyncTimeButton(iPIXELDeviceEntity, ButtonEntity):
    """Send the current time to the panels."""

    _attr_translation_key = "sync_time"
    _attr_icon = "mdi:clock-sync"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the button."""
        super().__init__(runtime, key="sync_time_button")

    async def async_press(self) -> None:
        """Sync the time."""
        await self._async_run(self.runtime.display.async_sync_time())


class iPIXELClearButton(iPIXELDeviceEntity, ButtonEntity):
    """Clear the display."""

    _attr_translation_key = "clear_display"
    _attr_icon = "mdi:eraser"

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the button."""
        super().__init__(runtime, key="clear_button")

    async def async_press(self) -> None:
        """Clear the display."""
        await self._async_run(self.runtime.async_clear())
