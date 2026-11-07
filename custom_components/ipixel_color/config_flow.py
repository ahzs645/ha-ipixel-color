"""Config flow for the iPIXEL Color integration.

Two kinds of config entries exist:

* **panel** - one physical iPIXEL panel (Bluetooth address).
* **group** - a combined display made of several configured panels laid out
  on a grid so they behave like one large screen.
"""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.components.bluetooth import BluetoothServiceInfoBleak
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .api import iPIXELAPI
from .bluetooth.scanner import discover_ipixel_devices
from .const import (
    CONF_ACK_TIMEOUT,
    CONF_ADDRESS,
    CONF_CHUNK_SIZE,
    CONF_COL,
    CONF_ENTRY_TYPE,
    CONF_HEIGHT,
    CONF_MEMBER_ENTRY_ID,
    CONF_MEMBERS,
    CONF_NAME,
    CONF_ROW,
    CONF_SYNC_SLOT,
    CONF_WIDTH,
    DEFAULT_ACK_TIMEOUT,
    DEFAULT_NAME,
    DEFAULT_SYNC_SLOT,
    DOMAIN,
    ENTRY_TYPE_GROUP,
    ENTRY_TYPE_PANEL,
    MODE_TEXT_IMAGE,
)
from .exceptions import iPIXELError

_LOGGER = logging.getLogger(__name__)

MANUAL_OPTION = "manual"
NEW_PANEL_PREFIX = "new:"


def entry_type(entry: config_entries.ConfigEntry) -> str:
    """Return the entry type (entries created before groups existed are panels)."""
    return entry.data.get(CONF_ENTRY_TYPE, ENTRY_TYPE_PANEL)


def panel_entries(hass: HomeAssistant) -> list[config_entries.ConfigEntry]:
    """Return all configured panel entries."""
    return [
        entry
        for entry in hass.config_entries.async_entries(DOMAIN)
        if entry_type(entry) == ENTRY_TYPE_PANEL
    ]


async def async_validate_panel(hass: HomeAssistant, address: str, name: str) -> dict[str, Any]:
    """Connect once to make sure the panel is reachable; returns its size."""
    api = iPIXELAPI(hass, address, name=name)
    try:
        info = await api.connect()
    finally:
        await api.disconnect()
    return {"width": info.width, "height": info.height}


@callback
def async_show_panel_code(hass: HomeAssistant, entry_id: str) -> None:
    """Show the last characters of a panel's address on that panel (best effort).

    Used while the user places panels on the grid of a combined display, so
    it is obvious which physical panel is being asked about.
    """
    from . import get_runtime

    runtime = get_runtime(hass, entry_id)
    if runtime is None or runtime.is_group or not runtime.available:
        return
    code = runtime.unique_prefix.replace(":", "")[-4:].upper()
    width, height = runtime.display.width, runtime.display.height
    if width >= 3 * height:
        text, font_size = code, max(6, height - 2)
    else:
        text, font_size = f"{code[:2]}\n{code[2:]}", max(6, height // 2 - 2)

    async def _show() -> None:
        try:
            await runtime.async_update_display(
                text,
                mode=MODE_TEXT_IMAGE,
                overrides={"text_color": "ffffff", "bg_color": "000000", "font_size": font_size, "effect": "none"},
            )
        except iPIXELError as err:
            _LOGGER.debug("Could not show the code on panel %s: %s", runtime.name, err)

    hass.async_create_task(_show())


def _sync_slot_selector() -> NumberSelector:
    return NumberSelector(NumberSelectorConfig(min=0, max=255, step=1, mode=NumberSelectorMode.BOX))


def _position_schema(row: int, col: int) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_ROW, default=row): NumberSelector(
                NumberSelectorConfig(min=0, max=32, step=1, mode=NumberSelectorMode.BOX)
            ),
            vol.Required(CONF_COL, default=col): NumberSelector(
                NumberSelectorConfig(min=0, max=32, step=1, mode=NumberSelectorMode.BOX)
            ),
        }
    )


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the config flow."""

    VERSION = 2

    def __init__(self) -> None:
        """Initialise the flow."""
        self._discovered: dict[str, dict[str, Any]] = {}
        self._discovery_info: BluetoothServiceInfoBleak | None = None
        # group flow state
        self._group_name: str = ""
        self._group_pending: list[str] = []
        self._group_members: list[dict[str, Any]] = []
        self._group_sync_slot: int = DEFAULT_SYNC_SLOT

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> OptionsFlowHandler:
        """Return the options flow."""
        return OptionsFlowHandler(config_entry)

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------
    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Let the user choose between adding a panel or a combined display."""
        return self.async_show_menu(step_id="user", menu_options=["panel", "group"])

    # ------------------------------------------------------------------
    # Panel
    # ------------------------------------------------------------------
    async def async_step_panel(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Pick a discovered panel or go to manual entry."""
        errors: dict[str, str] = {}

        if user_input is not None:
            selected = user_input["device"]
            if selected == MANUAL_OPTION:
                return await self.async_step_manual()
            device = self._discovered.get(selected)
            if device is None:
                errors["base"] = "device_not_found"
            else:
                await self.async_set_unique_id(device["address"], raise_on_progress=False)
                self._abort_if_unique_id_configured()
                try:
                    await async_validate_panel(self.hass, device["address"], device["name"])
                except iPIXELError as err:
                    _LOGGER.warning("Validation of %s failed: %s", device["address"], err)
                    errors["base"] = "cannot_connect"
                except Exception:  # noqa: BLE001
                    _LOGGER.exception("Unexpected error validating %s", device["address"])
                    errors["base"] = "unknown"
                else:
                    return self.async_create_entry(
                        title=device["name"],
                        data={
                            CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL,
                            CONF_ADDRESS: device["address"],
                            CONF_NAME: device["name"],
                        },
                    )

        configured = {entry.data.get(CONF_ADDRESS) for entry in panel_entries(self.hass)}
        self._discovered = {
            device["address"]: device
            for device in discover_ipixel_devices(self.hass, return_all=True)
            if device["address"] not in configured
        }

        options = [
            SelectOptionDict(
                value=address,
                label=f"{'★ ' if device['is_compatible'] else ''}{device['name']} ({address})",
            )
            for address, device in self._discovered.items()
        ]
        options.append(SelectOptionDict(value=MANUAL_OPTION, label="Manual entry"))

        return self.async_show_form(
            step_id="panel",
            data_schema=vol.Schema(
                {
                    vol.Required("device"): SelectSelector(
                        SelectSelectorConfig(options=options, mode=SelectSelectorMode.LIST)
                    )
                }
            ),
            errors=errors,
            description_placeholders={"device_count": str(len(self._discovered))},
        )

    async def async_step_manual(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Manual Bluetooth address entry."""
        errors: dict[str, str] = {}
        if user_input is not None:
            address = user_input[CONF_ADDRESS].strip().upper()
            name = user_input.get(CONF_NAME) or DEFAULT_NAME
            if len(address.replace(":", "")) != 12:
                errors["base"] = "invalid_address"
            else:
                await self.async_set_unique_id(address, raise_on_progress=False)
                self._abort_if_unique_id_configured()
                try:
                    await async_validate_panel(self.hass, address, name)
                except iPIXELError as err:
                    _LOGGER.warning("Validation of %s failed: %s", address, err)
                    errors["base"] = "cannot_connect"
                except Exception:  # noqa: BLE001
                    _LOGGER.exception("Unexpected error validating %s", address)
                    errors["base"] = "unknown"
                else:
                    return self.async_create_entry(
                        title=name,
                        data={
                            CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL,
                            CONF_ADDRESS: address,
                            CONF_NAME: name,
                        },
                    )

        defaults = user_input or {}
        return self.async_show_form(
            step_id="manual",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_ADDRESS, default=defaults.get(CONF_ADDRESS, "")): str,
                    vol.Optional(CONF_NAME, default=defaults.get(CONF_NAME, DEFAULT_NAME)): str,
                }
            ),
            errors=errors,
        )

    async def async_step_import(self, import_data: dict[str, Any]) -> FlowResult:
        """Create a panel entry programmatically (used when a group adds new panels)."""
        address = import_data[CONF_ADDRESS]
        await self.async_set_unique_id(address, raise_on_progress=False)
        self._abort_if_unique_id_configured()
        name = import_data.get(CONF_NAME) or DEFAULT_NAME
        return self.async_create_entry(
            title=name,
            data={CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL, CONF_ADDRESS: address, CONF_NAME: name},
        )

    async def async_step_bluetooth(self, discovery_info: BluetoothServiceInfoBleak) -> FlowResult:
        """Handle a panel discovered by the Bluetooth integration."""
        await self.async_set_unique_id(discovery_info.address)
        self._abort_if_unique_id_configured()
        self._discovery_info = discovery_info
        name = discovery_info.name or f"iPIXEL {discovery_info.address[-8:]}"
        self.context["title_placeholders"] = {"name": name, "address": discovery_info.address}
        return await self.async_step_bluetooth_confirm()

    async def async_step_bluetooth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Confirm adding a discovered panel."""
        assert self._discovery_info is not None
        placeholders = self.context["title_placeholders"]
        errors: dict[str, str] = {}

        if user_input is not None:
            name = user_input.get(CONF_NAME) or placeholders["name"]
            try:
                await async_validate_panel(self.hass, self._discovery_info.address, name)
            except iPIXELError as err:
                _LOGGER.warning("Validation of %s failed: %s", self._discovery_info.address, err)
                errors["base"] = "cannot_connect"
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Unexpected error during Bluetooth confirm")
                errors["base"] = "unknown"
            else:
                return self.async_create_entry(
                    title=name,
                    data={
                        CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL,
                        CONF_ADDRESS: self._discovery_info.address,
                        CONF_NAME: name,
                    },
                )

        return self.async_show_form(
            step_id="bluetooth_confirm",
            data_schema=vol.Schema({vol.Optional(CONF_NAME, default=placeholders["name"]): str}),
            description_placeholders=placeholders,
            errors=errors,
        )

    # ------------------------------------------------------------------
    # Combined display (group)
    # ------------------------------------------------------------------
    async def async_step_group(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Name the combined display and pick its panels.

        Panels that are not configured yet but visible over Bluetooth can be
        selected too; they are added as panel entries on the fly.
        """
        errors: dict[str, str] = {}
        placeholders: dict[str, str] = {}
        panels = panel_entries(self.hass)
        configured = {entry.data.get(CONF_ADDRESS) for entry in panels}
        discovered = {
            device["address"]: device
            for device in discover_ipixel_devices(self.hass, return_all=False)
            if device["address"] not in configured
        }

        if user_input is not None:
            selected = list(user_input[CONF_MEMBERS])
            if len(selected) < 2:
                errors[CONF_MEMBERS] = "need_two_panels"
            else:
                members: list[str] = []
                for value in selected:
                    if not value.startswith(NEW_PANEL_PREFIX):
                        members.append(value)
                        continue
                    address = value[len(NEW_PANEL_PREFIX):]
                    device = discovered.get(address, {"name": address})
                    try:
                        entry_id = await self._async_add_panel(address, device["name"])
                    except iPIXELError as err:
                        _LOGGER.warning("Could not add panel %s: %s", address, err)
                        errors[CONF_MEMBERS] = "panel_cannot_connect"
                        placeholders["panel"] = device["name"]
                        break
                    members.append(entry_id)
                if not errors:
                    self._group_name = user_input[CONF_NAME]
                    self._group_sync_slot = int(user_input.get(CONF_SYNC_SLOT, DEFAULT_SYNC_SLOT))
                    self._group_pending = members
                    self._group_members = []
                    return await self.async_step_group_position()
            # refresh the lists; panels added above are configured now
            panels = panel_entries(self.hass)
            configured = {entry.data.get(CONF_ADDRESS) for entry in panels}
            discovered = {a: d for a, d in discovered.items() if a not in configured}

        if len(panels) + len(discovered) < 2:
            return self.async_abort(reason="not_enough_panels")

        options = [
            SelectOptionDict(value=entry.entry_id, label=f"{entry.title} ({entry.data.get(CONF_ADDRESS)})")
            for entry in panels
        ]
        options += [
            SelectOptionDict(value=f"{NEW_PANEL_PREFIX}{address}", label=f"+ {device['name']} ({address}) - new")
            for address, device in discovered.items()
        ]
        return self.async_show_form(
            step_id="group",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME, default="Combined display"): TextSelector(),
                    vol.Required(CONF_MEMBERS): SelectSelector(
                        SelectSelectorConfig(options=options, multiple=True, mode=SelectSelectorMode.LIST)
                    ),
                    vol.Optional(CONF_SYNC_SLOT, default=DEFAULT_SYNC_SLOT): _sync_slot_selector(),
                }
            ),
            errors=errors,
            description_placeholders=placeholders,
        )

    async def _async_add_panel(self, address: str, name: str) -> str:
        """Validate a new panel and create its config entry; returns the entry id."""
        await async_validate_panel(self.hass, address, name)
        result = await self.hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_IMPORT},
            data={CONF_ADDRESS: address, CONF_NAME: name},
        )
        if result.get("type") != "create_entry":
            raise iPIXELError(f"Panel {name} could not be added ({result.get('reason', 'unknown')})")
        return result["result"].entry_id

    async def async_step_group_position(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Ask the grid position of every selected panel, one at a time."""
        if user_input is not None:
            entry_id = self._group_pending.pop(0)
            self._group_members.append(
                {
                    CONF_MEMBER_ENTRY_ID: entry_id,
                    CONF_ROW: int(user_input[CONF_ROW]),
                    CONF_COL: int(user_input[CONF_COL]),
                }
            )
            if not self._group_pending:
                return self.async_create_entry(
                    title=self._group_name,
                    data={
                        CONF_ENTRY_TYPE: ENTRY_TYPE_GROUP,
                        CONF_NAME: self._group_name,
                        CONF_MEMBERS: self._group_members,
                        CONF_SYNC_SLOT: self._group_sync_slot,
                    },
                )

        entry = self.hass.config_entries.async_get_entry(self._group_pending[0])
        index = len(self._group_members)
        async_show_panel_code(self.hass, self._group_pending[0])
        return self.async_show_form(
            step_id="group_position",
            data_schema=_position_schema(row=0, col=index),
            description_placeholders={
                "panel": entry.title if entry else self._group_pending[0],
                "index": str(index + 1),
                "total": str(index + len(self._group_pending)),
            },
        )


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Options: panel size override / ACK timeout, or group layout."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialise the options flow."""
        self._entry = config_entry
        self._group_pending: list[str] = []
        self._group_members: list[dict[str, Any]] = []
        self._group_name: str = ""
        self._group_sync_slot: int = DEFAULT_SYNC_SLOT

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Dispatch on entry type."""
        if entry_type(self._entry) == ENTRY_TYPE_GROUP:
            return await self.async_step_group(user_input)
        return await self.async_step_panel(user_input)

    async def async_step_panel(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Panel options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        options = self._entry.options
        return self.async_show_form(
            step_id="panel",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_WIDTH, default=options.get(CONF_WIDTH, 0)): NumberSelector(
                        NumberSelectorConfig(min=0, max=512, step=1, mode=NumberSelectorMode.BOX)
                    ),
                    vol.Optional(CONF_HEIGHT, default=options.get(CONF_HEIGHT, 0)): NumberSelector(
                        NumberSelectorConfig(min=0, max=512, step=1, mode=NumberSelectorMode.BOX)
                    ),
                    vol.Optional(
                        CONF_ACK_TIMEOUT, default=options.get(CONF_ACK_TIMEOUT, DEFAULT_ACK_TIMEOUT)
                    ): NumberSelector(
                        NumberSelectorConfig(min=2, max=60, step=1, mode=NumberSelectorMode.BOX)
                    ),
                    vol.Optional(CONF_CHUNK_SIZE, default=options.get(CONF_CHUNK_SIZE, 0)): NumberSelector(
                        NumberSelectorConfig(min=0, max=244, step=1, mode=NumberSelectorMode.BOX)
                    ),
                }
            ),
        )

    async def async_step_group(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Change the panels of a combined display."""
        errors: dict[str, str] = {}
        panels = panel_entries(self.hass)
        current = self._entry.data.get(CONF_MEMBERS, [])

        if user_input is not None:
            members = list(user_input[CONF_MEMBERS])
            if len(members) < 2:
                errors[CONF_MEMBERS] = "need_two_panels"
            else:
                self._group_name = user_input[CONF_NAME]
                self._group_sync_slot = int(user_input.get(CONF_SYNC_SLOT, DEFAULT_SYNC_SLOT))
                self._group_pending = members
                self._group_members = []
                return await self.async_step_group_position()

        current_slot = self._entry.data.get(CONF_SYNC_SLOT, DEFAULT_SYNC_SLOT)
        options = [
            SelectOptionDict(value=entry.entry_id, label=f"{entry.title} ({entry.data.get(CONF_ADDRESS)})")
            for entry in panels
        ]
        default_members = [m[CONF_MEMBER_ENTRY_ID] for m in current if any(p.entry_id == m[CONF_MEMBER_ENTRY_ID] for p in panels)]
        return self.async_show_form(
            step_id="group",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_NAME, default=self._entry.data.get(CONF_NAME, self._entry.title)): TextSelector(),
                    vol.Required(CONF_MEMBERS, default=default_members): SelectSelector(
                        SelectSelectorConfig(options=options, multiple=True, mode=SelectSelectorMode.LIST)
                    ),
                    vol.Optional(CONF_SYNC_SLOT, default=int(current_slot)): _sync_slot_selector(),
                }
            ),
            errors=errors,
        )

    async def async_step_group_position(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Ask the grid position of every selected panel."""
        current = {m[CONF_MEMBER_ENTRY_ID]: m for m in self._entry.data.get(CONF_MEMBERS, [])}
        if user_input is not None:
            entry_id = self._group_pending.pop(0)
            self._group_members.append(
                {
                    CONF_MEMBER_ENTRY_ID: entry_id,
                    CONF_ROW: int(user_input[CONF_ROW]),
                    CONF_COL: int(user_input[CONF_COL]),
                }
            )
            if not self._group_pending:
                # The layout lives in entry.data (single source of truth); updating
                # it triggers the reload listener. Options stay empty for groups.
                self.hass.config_entries.async_update_entry(
                    self._entry,
                    title=self._group_name,
                    data={
                        **self._entry.data,
                        CONF_NAME: self._group_name,
                        CONF_MEMBERS: self._group_members,
                        CONF_SYNC_SLOT: self._group_sync_slot,
                    },
                )
                return self.async_create_entry(title="", data={})

        entry_id = self._group_pending[0]
        entry = self.hass.config_entries.async_get_entry(entry_id)
        index = len(self._group_members)
        previous = current.get(entry_id, {})
        async_show_panel_code(self.hass, entry_id)
        return self.async_show_form(
            step_id="group_position",
            data_schema=_position_schema(
                row=int(previous.get(CONF_ROW, 0)), col=int(previous.get(CONF_COL, index))
            ),
            description_placeholders={
                "panel": entry.title if entry else entry_id,
                "index": str(index + 1),
                "total": str(index + len(self._group_pending)),
            },
        )
