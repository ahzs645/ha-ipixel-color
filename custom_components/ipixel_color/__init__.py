"""The iPIXEL Color integration.

Controls one or more iPIXEL Color LED matrix panels over the Home Assistant
Bluetooth stack. Panels can be combined into one large virtual display.
"""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryError, ConfigEntryNotReady
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .api import iPIXELAPI
from .const import (
    CARD_URL_PATH,
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
)
from .display.composite import CompositeDisplay, MemberSpec
from .display.panel import PanelDisplay
from .exceptions import iPIXELError
from .runtime import iPIXELRuntime
from .services import async_setup_services

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [
    Platform.BUTTON,
    Platform.CAMERA,
    Platform.LIGHT,
    Platform.MEDIA_PLAYER,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.TEXT,
]

_FRONTEND_REGISTERED_KEY = f"{DOMAIN}_frontend_registered"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the services (they target displays by device id)."""
    hass.data.setdefault(DOMAIN, {})
    async_setup_services(hass)
    return True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate config entries created before combined displays existed."""
    if entry.version == 1:
        data = {**entry.data}
        data.setdefault(CONF_ENTRY_TYPE, ENTRY_TYPE_PANEL)
        data.setdefault(CONF_NAME, entry.title or DEFAULT_NAME)
        hass.config_entries.async_update_entry(entry, data=data, version=2)
        _LOGGER.info("Migrated iPIXEL config entry %s to version 2", entry.title)
    if entry.data.get(CONF_ENTRY_TYPE) == ENTRY_TYPE_GROUP and CONF_MEMBERS in entry.options:
        # Early builds stored edited group layouts in options; data is the single source now.
        data = {**entry.data, **{k: v for k, v in entry.options.items() if k in (CONF_NAME, CONF_MEMBERS, CONF_SYNC_SLOT)}}
        hass.config_entries.async_update_entry(entry, data=data, options={})
    return True


def get_runtime(hass: HomeAssistant, entry_id: str) -> iPIXELRuntime | None:
    """Return the runtime of a loaded config entry."""
    runtime = hass.data.get(DOMAIN, {}).get(entry_id)
    return runtime if isinstance(runtime, iPIXELRuntime) else None


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a panel or a combined display."""
    hass.data.setdefault(DOMAIN, {})
    kind = entry.data.get(CONF_ENTRY_TYPE, ENTRY_TYPE_PANEL)

    if kind == ENTRY_TYPE_GROUP:
        runtime = _create_group_runtime(hass, entry)
    else:
        runtime = await _async_create_panel_runtime(hass, entry)

    await runtime.async_setup()
    hass.data[DOMAIN][entry.entry_id] = runtime

    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    await _async_register_frontend(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    runtime.async_schedule_startup_restore()

    if kind == ENTRY_TYPE_PANEL:
        # Groups resolve their members lazily; tell them a panel (re)appeared.
        _notify_groups(hass)
    _async_link_group_devices(hass)
    return True


async def _async_create_panel_runtime(hass: HomeAssistant, entry: ConfigEntry) -> iPIXELRuntime:
    address: str = entry.data[CONF_ADDRESS]
    name: str = entry.data.get(CONF_NAME) or entry.title or DEFAULT_NAME
    options = entry.options
    width = int(options.get(CONF_WIDTH, 0) or 0)
    height = int(options.get(CONF_HEIGHT, 0) or 0)
    size_override = (width, height) if width and height else None

    api = iPIXELAPI(
        hass,
        address,
        name=name,
        ack_timeout=float(options.get(CONF_ACK_TIMEOUT, DEFAULT_ACK_TIMEOUT)),
        size_override=size_override,
        chunk_size=int(options.get(CONF_CHUNK_SIZE, 0) or 0) or None,
    )
    try:
        await api.connect()
    except iPIXELError as err:
        await api.disconnect()  # also stops the client from reconnecting in the background
        raise ConfigEntryNotReady(f"{name} ({address}): {err}") from err

    display = PanelDisplay(api, key=entry.entry_id, name=name)
    return iPIXELRuntime(hass, entry, display)


def _create_group_runtime(hass: HomeAssistant, entry: ConfigEntry) -> iPIXELRuntime:
    name: str = entry.data.get(CONF_NAME) or entry.title
    members_conf = entry.data.get(CONF_MEMBERS) or []
    members: list[MemberSpec] = []
    for member in members_conf:
        member_id = member.get(CONF_MEMBER_ENTRY_ID)
        if hass.config_entries.async_get_entry(member_id) is None:
            _LOGGER.warning(
                "Combined display '%s' references a panel that no longer exists (%s)", name, member_id
            )
            continue
        members.append(MemberSpec(key=member_id, row=int(member.get(CONF_ROW, 0)), col=int(member.get(CONF_COL, 0))))
    if not members:
        raise ConfigEntryError(f"Combined display '{name}' has no valid panels; edit its options")

    def _resolve(key: str) -> PanelDisplay | None:
        runtime = get_runtime(hass, key)
        if runtime is None or not isinstance(runtime.display, PanelDisplay):
            return None
        return runtime.display

    sync_slot = entry.data.get(CONF_SYNC_SLOT, DEFAULT_SYNC_SLOT)
    display = CompositeDisplay(
        name=name, members=members, resolver=_resolve, sync_slot=int(sync_slot or 0) or None
    )
    return iPIXELRuntime(hass, entry, display)


@callback
def async_get_device(registry: dr.DeviceRegistry, runtime: iPIXELRuntime) -> dr.DeviceEntry | None:
    """Return the device registry entry of a display.

    Home Assistant 2026.9 deprecated looking devices up by identifier alone
    (identifiers are scoped to a config entry since then); older versions do
    not have the replacement yet.
    """
    identifier = (DOMAIN, runtime.unique_prefix)
    if hasattr(registry, "async_get_device_by_identifier"):
        return registry.async_get_device_by_identifier(identifier, runtime.entry.entry_id)
    return registry.async_get_device(identifiers={identifier})


@callback
def _async_link_group_devices(hass: HomeAssistant) -> None:
    """Mark panel devices as connected via their combined display (device registry)."""
    registry = dr.async_get(hass)
    for runtime in list(hass.data.get(DOMAIN, {}).values()):
        if not isinstance(runtime, iPIXELRuntime) or not isinstance(runtime.display, CompositeDisplay):
            continue
        group_device = async_get_device(registry, runtime)
        if group_device is None:
            continue
        for member in runtime.display.members:
            panel_runtime = get_runtime(hass, member.key)
            if panel_runtime is None:
                continue
            panel_device = async_get_device(registry, panel_runtime)
            if panel_device is not None and panel_device.via_device_id != group_device.id:
                registry.async_update_device(panel_device.id, via_device_id=group_device.id)


@callback
def _async_unlink_group_devices(hass: HomeAssistant, runtime: iPIXELRuntime) -> None:
    """Remove the via-device link of the panels of a combined display being unloaded."""
    registry = dr.async_get(hass)
    group_device = async_get_device(registry, runtime)
    if group_device is None:
        return
    for member in runtime.display.members:  # type: ignore[union-attr]
        panel_runtime = get_runtime(hass, member.key)
        if panel_runtime is None:
            continue
        panel_device = async_get_device(registry, panel_runtime)
        if panel_device is not None and panel_device.via_device_id == group_device.id:
            registry.async_update_device(panel_device.id, via_device_id=None)


def _notify_groups(hass: HomeAssistant) -> None:
    for runtime in list(hass.data.get(DOMAIN, {}).values()):
        if isinstance(runtime, iPIXELRuntime) and runtime.is_group:
            runtime.display._notify()  # noqa: SLF001 - refresh member subscriptions/entities


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the entry when its options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        runtime: iPIXELRuntime | None = hass.data[DOMAIN].pop(entry.entry_id, None)
        if runtime is not None:
            if isinstance(runtime.display, CompositeDisplay):
                _async_unlink_group_devices(hass, runtime)
            await runtime.async_shutdown()
        _notify_groups(hass)
    return unload_ok


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Serve the bundled Lovelace cards and register them as a dashboard resource."""
    if hass.data.get(_FRONTEND_REGISTERED_KEY):
        return
    hass.data[_FRONTEND_REGISTERED_KEY] = True

    card_path = Path(__file__).parent / "www" / "ipixel-display-card.js"
    if not card_path.exists():
        _LOGGER.debug("Frontend card bundle not found at %s", card_path)
        return

    try:
        # Home Assistant 2024.6+ has async_register_static_paths; older versions register_static_path.
        if hasattr(hass.http, "async_register_static_paths"):
            from homeassistant.components.http import StaticPathConfig

            await hass.http.async_register_static_paths(
                [StaticPathConfig(CARD_URL_PATH, str(card_path), False)]
            )
        else:  # pragma: no cover - old HA
            hass.http.register_static_path(CARD_URL_PATH, str(card_path), cache_headers=False)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Could not serve the iPIXEL Lovelace card: %s", err)
        return

    await _async_add_lovelace_resource(hass, f"{CARD_URL_PATH}?v={await _async_card_version(hass)}")


async def _async_card_version(hass: HomeAssistant) -> str:
    """Return the integration version (cache buster for the card URL)."""
    try:
        integration = await async_get_integration(hass, DOMAIN)
    except Exception:  # noqa: BLE001
        return "0"
    return str(integration.version or "0")


async def _async_add_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Add the card to the Lovelace resources (storage mode only)."""
    lovelace = hass.data.get("lovelace")
    if lovelace is None:
        _LOGGER.debug("Lovelace not loaded yet; add %s as a dashboard resource manually", url)
        return
    # 2024.x: dataclass with .resources / .mode; older: dict
    if isinstance(lovelace, dict):
        resources = lovelace.get("resources")
        mode = lovelace.get("mode")
    else:
        resources = getattr(lovelace, "resources", None)
        mode = getattr(lovelace, "mode", None)
    if resources is None or mode != "storage":
        _LOGGER.debug("Lovelace in %s mode; add %s as a resource manually", mode, url)
        return
    try:
        if hasattr(resources, "loaded") and not resources.loaded:
            await resources.async_load()
        base = url.split("?")[0]
        for item in resources.async_items():
            item_url = item.get("url", "")
            if item_url.split("?")[0] == base:
                if item_url != url:
                    await resources.async_update_item(item["id"], {"url": url})
                    _LOGGER.info("Updated iPIXEL card resource to %s", url)
                return
        await resources.async_create_item({"res_type": "module", "url": url})
        _LOGGER.info("Registered iPIXEL card as Lovelace resource %s", url)
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Could not register Lovelace resource %s: %s", url, err)
