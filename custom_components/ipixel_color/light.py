"""Light platform for iPIXEL Color - Color selection entities."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.light import (
    ATTR_RGB_COLOR,
    ColorMode,
    LightEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.restore_state import RestoreEntity

from .api import iPIXELAPI
from .const import DOMAIN, CONF_ADDRESS, CONF_NAME
from .color import rgb_to_hex

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the iPIXEL Color light entities."""
    address = entry.data[CONF_ADDRESS]
    name = entry.data[CONF_NAME]

    api = hass.data[DOMAIN][entry.entry_id]

    async_add_entities([
        iPIXELTextColorLight(hass, api, entry, address, name),
        iPIXELBackgroundColorLight(hass, api, entry, address, name),
    ])


class iPIXELColorLight(LightEntity, RestoreEntity):
    """Base class for iPIXEL color selection light entities."""

    _attr_color_mode = ColorMode.RGB
    _attr_supported_color_modes = {ColorMode.RGB}

    # Override these in subclasses
    _light_name: str = "Color"
    _entity_suffix: str = "color"
    _default_rgb: tuple[int, int, int] = (255, 255, 255)
    _trigger_modes: list[str] = []

    def __init__(
        self,
        hass: HomeAssistant,
        api: iPIXELAPI,
        entry: ConfigEntry,
        address: str,
        name: str
    ) -> None:
        """Initialize the color light."""
        self.hass = hass
        self._api = api
        self._entry = entry
        self._address = address
        self._device_name = name
        self._attr_name = f"{name} {self._light_name}"
        self._attr_unique_id = f"{address}_{self._entity_suffix}"
        self._attr_is_on = True  # Always "on" since it's just a color picker
        self._attr_rgb_color = self._default_rgb

        # Device info for grouping in device registry
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, address)},
            name=name,
            manufacturer="iPIXEL",
            model="LED Matrix Display",
            sw_version="1.0",
        )

    async def async_added_to_hass(self) -> None:
        """Run when entity about to be added to hass."""
        await super().async_added_to_hass()

        # Restore last state if available
        last_state = await self.async_get_last_state()
        if last_state is not None and last_state.attributes.get(ATTR_RGB_COLOR):
            rgb = last_state.attributes[ATTR_RGB_COLOR]
            self._attr_rgb_color = tuple(rgb)
            _LOGGER.debug("Restored %s: RGB%s", self._light_name.lower(), self._attr_rgb_color)

    @property
    def is_on(self) -> bool:
        """Return true if light is on (always true for color pickers)."""
        return True

    @property
    def rgb_color(self) -> tuple[int, int, int]:
        """Return the RGB color value."""
        return self._attr_rgb_color

    def get_hex(self) -> str:
        """Get color as hex string (e.g., 'ffffff')."""
        r, g, b = self._attr_rgb_color
        return rgb_to_hex(r, g, b)

    def get_rgb(self) -> tuple[int, int, int]:
        """Get color as RGB tuple (0-255, 0-255, 0-255)."""
        return self._attr_rgb_color

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn on or set the color of the light."""
        if ATTR_RGB_COLOR in kwargs:
            rgb = kwargs[ATTR_RGB_COLOR]
            self._attr_rgb_color = (int(rgb[0]), int(rgb[1]), int(rgb[2]))
            _LOGGER.debug("%s set to: RGB%s (#%s)",
                         self._light_name, self._attr_rgb_color, self.get_hex())

            # Trigger auto-update if enabled and in appropriate mode
            await self._trigger_auto_update()

        # Always consider it "on" since it's a color picker
        self._attr_is_on = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off is not applicable for color pickers."""
        # Don't actually turn off, just acknowledge the command
        pass

    async def _trigger_auto_update(self) -> None:
        """Trigger display update if auto-update is enabled and in appropriate mode."""
        if not self._trigger_modes:
            return

        try:
            from .common import update_ipixel_display

            # Check if we're in one of the trigger modes
            mode_entity_id = f"select.{self._device_name.lower().replace(' ', '_')}_mode"
            mode_state = self.hass.states.get(mode_entity_id)

            if mode_state and mode_state.state in self._trigger_modes:
                # Check auto-update setting
                auto_update_entity_id = f"switch.{self._device_name.lower().replace(' ', '_')}_auto_update"
                auto_update_state = self.hass.states.get(auto_update_entity_id)

                if auto_update_state and auto_update_state.state == "on":
                    await update_ipixel_display(self.hass, self._device_name, self._api)
                    _LOGGER.debug("Auto-update triggered due to %s change", self._light_name.lower())
        except Exception as err:
            _LOGGER.debug("Could not trigger auto-update: %s", err)


class iPIXELTextColorLight(iPIXELColorLight):
    """Light entity for text/foreground color selection."""

    _light_name = "Text Color"
    _entity_suffix = "text_color"
    _default_rgb = (255, 255, 255)  # White
    _trigger_modes = ["text", "textimage"]


class iPIXELBackgroundColorLight(iPIXELColorLight):
    """Light entity for background color selection."""

    _light_name = "Background Color"
    _entity_suffix = "background_color"
    _default_rgb = (0, 0, 0)  # Black
    _trigger_modes = ["textimage"]
