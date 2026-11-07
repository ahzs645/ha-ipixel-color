"""Fixtures for the iPIXEL Color tests."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.ipixel_color.const import (
    CONF_ADDRESS,
    CONF_COL,
    CONF_ENTRY_TYPE,
    CONF_MEMBER_ENTRY_ID,
    CONF_MEMBERS,
    CONF_NAME,
    CONF_ROW,
    DOMAIN,
    ENTRY_TYPE_GROUP,
    ENTRY_TYPE_PANEL,
)

from .fake_panel import FakeBluetooth

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable loading custom integrations."""
    yield


@pytest.fixture
def fake_bluetooth(mock_bluetooth):
    """Patch the BLE helpers with the simulated panels (and mock the adapters)."""
    fake = FakeBluetooth()
    with patch(
        "custom_components.ipixel_color.bluetooth.client.bluetooth.async_ble_device_from_address",
        side_effect=fake.ble_device,
    ), patch(
        "custom_components.ipixel_color.bluetooth.client.establish_connection",
        side_effect=fake.establish_connection,
    ), patch(
        "custom_components.ipixel_color.bluetooth.client.bluetooth.async_register_callback",
        side_effect=fake.register_callback,
    ):
        yield fake


def make_panel_entry(address: str, name: str, entry_id: str | None = None) -> MockConfigEntry:
    """Create a panel config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title=name,
        unique_id=address,
        version=2,
        entry_id=entry_id,
        data={CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL, CONF_ADDRESS: address, CONF_NAME: name},
    )


def make_group_entry(
    name: str,
    members: list[tuple[str, int, int]],
    entry_id: str | None = None,
    sync_slot: int | None = None,
) -> MockConfigEntry:
    """Create a combined display entry from (entry_id, row, col) tuples."""
    data = {
        CONF_ENTRY_TYPE: ENTRY_TYPE_GROUP,
        CONF_NAME: name,
        CONF_MEMBERS: [
            {CONF_MEMBER_ENTRY_ID: member_id, CONF_ROW: row, CONF_COL: col}
            for member_id, row, col in members
        ],
    }
    if sync_slot is not None:
        data["sync_slot"] = sync_slot
    return MockConfigEntry(domain=DOMAIN, title=name, version=2, entry_id=entry_id, data=data)


def get_device(hass: HomeAssistant, identifier: str, entry_id: str) -> dr.DeviceEntry | None:
    """Return the device of a panel (address) or group (``group_<entry_id>``)."""
    registry = dr.async_get(hass)
    # HA 2026.9+ scopes identifiers to a config entry; older versions lack the new lookup.
    if hasattr(registry, "async_get_device_by_identifier"):
        return registry.async_get_device_by_identifier((DOMAIN, identifier), entry_id)
    return registry.async_get_device(identifiers={(DOMAIN, identifier)})
