"""Switch platform for iPIXEL Color."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from homeassistant.components.switch import SwitchEntity, SwitchEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN
from .entity import iPIXELDeviceEntity, iPIXELSettingEntity
from .runtime import iPIXELRuntime

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True, kw_only=True)
class iPIXELSettingSwitchDescription(SwitchEntityDescription):
    """Describes a boolean setting."""

    setting: str
    default: bool = True


SETTING_SWITCHES: tuple[iPIXELSettingSwitchDescription, ...] = (
    iPIXELSettingSwitchDescription(
        key="antialiasing",
        translation_key="antialiasing",
        icon="mdi:vector-selection",
        setting="antialias",
        entity_category=EntityCategory.CONFIG,
    ),
    iPIXELSettingSwitchDescription(
        key="auto_update",
        translation_key="auto_update",
        icon="mdi:auto-fix",
        setting="auto_update",
        default=False,
        entity_category=EntityCategory.CONFIG,
    ),
    iPIXELSettingSwitchDescription(
        key="clock_24h",
        translation_key="clock_24h",
        icon="mdi:clock-time-four-outline",
        setting="clock_24h",
        entity_category=EntityCategory.CONFIG,
    ),
    iPIXELSettingSwitchDescription(
        key="clock_show_date",
        translation_key="clock_show_date",
        icon="mdi:calendar-clock",
        setting="clock_show_date",
        entity_category=EntityCategory.CONFIG,
    ),
    iPIXELSettingSwitchDescription(
        key="status_pixel",
        translation_key="status_pixel",
        icon="mdi:circle-small",
        setting="status_pixel",
        default=False,
        entity_category=EntityCategory.CONFIG,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up switches."""
    runtime: iPIXELRuntime = hass.data[DOMAIN][entry.entry_id]
    entities: list[SwitchEntity] = [
        iPIXELSettingSwitch(runtime, description) for description in SETTING_SWITCHES
    ]
    entities += [
        iPIXELPowerSwitch(runtime),
        iPIXELFunModeSwitch(runtime),
        iPIXELScreenVisibleSwitch(runtime),
        iPIXELProgramListSwitch(runtime),
    ]
    async_add_entities(entities)


class iPIXELSettingSwitch(iPIXELSettingEntity, SwitchEntity):
    """A boolean setting that influences how content is rendered."""

    entity_description: iPIXELSettingSwitchDescription

    def __init__(self, runtime: iPIXELRuntime, description: iPIXELSettingSwitchDescription) -> None:
        """Initialise the switch."""
        super().__init__(runtime, description=description)
        self.setting = description.setting
        setattr(self.settings, self.setting, description.default)

    def _restore_from_state(self, state: State) -> None:
        setattr(self.settings, self.setting, state.state == "on")

    @property
    def is_on(self) -> bool:
        """Return the setting value."""
        return bool(getattr(self.settings, self.setting))

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Enable the setting."""
        self._set_setting(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disable the setting."""
        self._set_setting(False)


class iPIXELPowerSwitch(iPIXELDeviceEntity, SwitchEntity, RestoreEntity):
    """Power switch for the (combined) display."""

    _attr_translation_key = "power"
    _attr_icon = "mdi:power"

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the switch."""
        super().__init__(runtime, key="power")

    async def async_added_to_hass(self) -> None:
        """Restore the last known power state (without sending it to the device)."""
        await super().async_added_to_hass()
        last_state = await self.async_get_last_state()
        if last_state is not None and last_state.state in ("on", "off"):
            self.settings.power = last_state.state == "on"

    @property
    def is_on(self) -> bool:
        """Return the last power state we set."""
        return self.settings.power

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn on all panels."""
        await self._async_run(self.runtime.async_set_power(True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off all panels."""
        await self._async_run(self.runtime.async_set_power(False))


class iPIXELFunModeSwitch(iPIXELDeviceEntity, SwitchEntity, RestoreEntity):
    """Fun mode (direct pixel control) switch."""

    _attr_translation_key = "fun_mode"
    _attr_icon = "mdi:dots-grid"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the switch."""
        super().__init__(runtime, key="fun_mode")

    async def async_added_to_hass(self) -> None:
        """Restore the last state."""
        await super().async_added_to_hass()
        last_state = await self.async_get_last_state()
        if last_state is not None and last_state.state in ("on", "off"):
            self.settings.fun_mode = last_state.state == "on"

    @property
    def is_on(self) -> bool:
        """Return True when fun mode is enabled."""
        return self.settings.fun_mode

    async def _async_set(self, enable: bool) -> None:
        await self._async_run(self.runtime.display.async_set_fun_mode(enable))
        self.settings.fun_mode = enable
        self.async_write_ha_state()

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Enable fun mode."""
        await self._async_set(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disable fun mode."""
        await self._async_set(False)


class iPIXELScreenVisibleSwitch(iPIXELDeviceEntity, SwitchEntity):
    """Blank the screen (off) or re-render the current content (on)."""

    _attr_translation_key = "screen_visible"
    _attr_icon = "mdi:eye"

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the switch."""
        super().__init__(runtime, key="screen_visible")

    @property
    def is_on(self) -> bool:
        """Return True when content is shown."""
        return self.settings.screen_visible

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Re-render the current content."""
        await self._async_run(self.runtime.async_update_display())
        self.settings.screen_visible = True
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Clear the display."""
        await self._async_run(self.runtime.display.async_clear())
        self.settings.screen_visible = False
        self.async_write_ha_state()


class iPIXELProgramListSwitch(iPIXELDeviceEntity, SwitchEntity):
    """Start/stop the playlist loop of the schedule manager."""

    _attr_translation_key = "program_list"
    _attr_icon = "mdi:playlist-play"

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the switch."""
        super().__init__(runtime, key="program_list")

    @property
    def is_on(self) -> bool:
        """Return True while the playlist loop runs."""
        manager = self.runtime.schedule_manager
        return bool(manager and manager.is_running)

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Start the active playlist."""
        manager = self.runtime.schedule_manager
        if manager is None:
            return
        await manager.start_playlist_loop(self.settings.schedule_interval_ms)
        self.async_write_ha_state()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Stop the playlist."""
        manager = self.runtime.schedule_manager
        if manager is None:
            return
        await manager.stop_playlist_loop()
        self.async_write_ha_state()
