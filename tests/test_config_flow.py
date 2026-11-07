"""Config flow tests."""
from __future__ import annotations

from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

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
from custom_components.ipixel_color.exceptions import iPIXELConnectionError

from .conftest import make_group_entry, make_panel_entry

ADDRESS = "AA:BB:CC:DD:EE:01"


async def test_manual_panel_flow(hass: HomeAssistant, fake_bluetooth):
    fake_bluetooth.add(ADDRESS)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] == FlowResultType.MENU
    assert result["menu_options"] == ["panel", "group"]

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "panel"})
    assert result["type"] == FlowResultType.FORM and result["step_id"] == "panel"

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"device": "manual"})
    assert result["step_id"] == "manual"

    with patch("custom_components.ipixel_color.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_ADDRESS: ADDRESS.lower(), CONF_NAME: "Kitchen"}
        )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"] == {CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL, CONF_ADDRESS: ADDRESS, CONF_NAME: "Kitchen"}
    assert result["result"].unique_id == ADDRESS


async def test_manual_panel_cannot_connect(hass: HomeAssistant, fake_bluetooth):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "panel"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"device": "manual"})
    with patch(
        "custom_components.ipixel_color.config_flow.async_validate_panel",
        side_effect=iPIXELConnectionError("nope"),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ADDRESS: ADDRESS})
    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {"base": "cannot_connect"}


async def test_discovered_panel_flow(hass: HomeAssistant, fake_bluetooth):
    fake_bluetooth.add(ADDRESS)
    discovered = [{"address": ADDRESS, "name": "LED_BLE_TEST", "rssi": -50, "is_compatible": True}]
    with patch("custom_components.ipixel_color.config_flow.discover_ipixel_devices", return_value=discovered), patch(
        "custom_components.ipixel_color.async_setup_entry", return_value=True
    ):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "panel"})
        assert result["description_placeholders"] == {"device_count": "1"}
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"device": ADDRESS})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == "LED_BLE_TEST"


async def test_group_flow(hass: HomeAssistant, fake_bluetooth):
    make_panel_entry("AA:BB:CC:DD:EE:01", "Left", entry_id="left").add_to_hass(hass)
    make_panel_entry("AA:BB:CC:DD:EE:02", "Right", entry_id="right").add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "group"})
    assert result["step_id"] == "group"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_NAME: "Wall", CONF_MEMBERS: ["left"]}
    )
    assert result["errors"] == {CONF_MEMBERS: "need_two_panels"}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_NAME: "Wall", CONF_MEMBERS: ["left", "right"], "sync_slot": 2}
    )
    assert result["step_id"] == "group_position"
    assert result["description_placeholders"]["panel"] == "Left"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 0})
    assert result["description_placeholders"] == {"panel": "Right", "index": "2", "total": "2"}
    with patch("custom_components.ipixel_color.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 1})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"] == {
        CONF_ENTRY_TYPE: ENTRY_TYPE_GROUP,
        CONF_NAME: "Wall",
        CONF_MEMBERS: [
            {CONF_MEMBER_ENTRY_ID: "left", CONF_ROW: 0, CONF_COL: 0},
            {CONF_MEMBER_ENTRY_ID: "right", CONF_ROW: 0, CONF_COL: 1},
        ],
        "sync_slot": 2,
    }


async def test_group_flow_four_panels_grid(hass: HomeAssistant, fake_bluetooth):
    for index in range(4):
        make_panel_entry(f"AA:BB:CC:DD:EE:0{index + 1}", f"P{index}", entry_id=f"p{index}").add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "group"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_NAME: "Quad", CONF_MEMBERS: ["p0", "p1", "p2", "p3"]}
    )
    positions = [(0, 0), (0, 1), (1, 0), (1, 1)]
    for index, (row, col) in enumerate(positions):
        assert result["step_id"] == "group_position"
        assert result["description_placeholders"]["index"] == str(index + 1)
        assert result["description_placeholders"]["total"] == "4"
        with patch("custom_components.ipixel_color.async_setup_entry", return_value=True):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ROW: row, CONF_COL: col})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert [(m[CONF_ROW], m[CONF_COL]) for m in result["data"][CONF_MEMBERS]] == positions


async def test_group_options_flow(hass: HomeAssistant, fake_bluetooth):
    make_panel_entry("AA:BB:CC:DD:EE:01", "Left", entry_id="left").add_to_hass(hass)
    make_panel_entry("AA:BB:CC:DD:EE:02", "Right", entry_id="right").add_to_hass(hass)
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall")
    group.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(group.entry_id)
    assert result["step_id"] == "group"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_NAME: "Wall 2", CONF_MEMBERS: ["left", "right"]}
    )
    assert result["step_id"] == "group_position"
    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 0})
    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_ROW: 1, CONF_COL: 0})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    # The layout lives in entry.data (single source of truth); options stay empty.
    assert group.options == {}
    assert group.data[CONF_NAME] == "Wall 2" and group.title == "Wall 2"
    assert group.data[CONF_MEMBERS][1] == {CONF_MEMBER_ENTRY_ID: "right", CONF_ROW: 1, CONF_COL: 0}
    assert group.data["sync_slot"] == 1  # default kept


async def test_panel_options_flow(hass: HomeAssistant, fake_bluetooth):
    entry = make_panel_entry(ADDRESS, "Left", entry_id="left")
    entry.add_to_hass(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["step_id"] == "panel"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"width": 96, "height": 16, "ack_timeout": 15}
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert entry.options == {"width": 96, "height": 16, "ack_timeout": 15, "chunk_size": 0}


async def test_group_options_show_panel_codes(hass: HomeAssistant, fake_bluetooth):
    """While placing panels on the grid, each panel shows the end of its address."""
    from homeassistant.config_entries import ConfigEntryState

    panels = {}
    for address, name, entry_id in (("AA:BB:CC:DD:EE:01", "Left", "left"), ("AA:BB:CC:DD:EE:02", "Right", "right")):
        panels[entry_id] = fake_bluetooth.add(address)
        entry = make_panel_entry(address, name, entry_id=entry_id)
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        assert entry.state is ConfigEntryState.LOADED
        panels[entry_id].clear()
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall")
    group.add_to_hass(hass)

    result = await hass.config_entries.options.async_init(group.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_NAME: "Wall", CONF_MEMBERS: ["left", "right"]}
    )
    await hass.async_block_till_done()
    assert result["step_id"] == "group_position" and result["description_placeholders"]["panel"] == "Left"
    assert panels["left"].last_image() is not None, "left panel should show its code"
    assert panels["right"].last_image() is None

    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 0})
    await hass.async_block_till_done()
    assert result["description_placeholders"]["panel"] == "Right"
    assert panels["right"].last_image() is not None, "right panel should show its code"


async def test_group_flow_aborts_without_panels(hass: HomeAssistant, fake_bluetooth):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "group"})
    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "not_enough_panels"


async def test_group_flow_adds_discovered_panels(hass: HomeAssistant, fake_bluetooth):
    """A group can be created directly from panels that are not configured yet."""
    make_panel_entry("AA:BB:CC:DD:EE:01", "Left", entry_id="left").add_to_hass(hass)
    fake_bluetooth.add("AA:BB:CC:DD:EE:02")
    discovered = [{"address": "AA:BB:CC:DD:EE:02", "name": "LED_BLE_RIGHT", "rssi": -50, "is_compatible": True}]

    with patch("custom_components.ipixel_color.config_flow.discover_ipixel_devices", return_value=discovered), patch(
        "custom_components.ipixel_color.async_setup_entry", return_value=True
    ):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "group"})
        assert result["step_id"] == "group"
        values = [o["value"] for o in result["data_schema"].schema[CONF_MEMBERS].config["options"]]
        assert values == ["left", "new:AA:BB:CC:DD:EE:02"]

        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_NAME: "Wall", CONF_MEMBERS: ["left", "new:AA:BB:CC:DD:EE:02"]}
        )
        assert result["step_id"] == "group_position"
        # the new panel got its own config entry
        new_entry = next(e for e in hass.config_entries.async_entries(DOMAIN) if e.unique_id == "AA:BB:CC:DD:EE:02")
        assert new_entry.data == {CONF_ENTRY_TYPE: ENTRY_TYPE_PANEL, CONF_ADDRESS: "AA:BB:CC:DD:EE:02", CONF_NAME: "LED_BLE_RIGHT"}

        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 0})
        assert result["description_placeholders"]["panel"] == "LED_BLE_RIGHT"
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_ROW: 0, CONF_COL: 1})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert [m[CONF_MEMBER_ENTRY_ID] for m in result["data"][CONF_MEMBERS]] == ["left", new_entry.entry_id]


async def test_group_flow_reports_unreachable_new_panel(hass: HomeAssistant, fake_bluetooth):
    make_panel_entry("AA:BB:CC:DD:EE:01", "Left", entry_id="left").add_to_hass(hass)
    fake_bluetooth.add("AA:BB:CC:DD:EE:02").fail_connect = True
    discovered = [{"address": "AA:BB:CC:DD:EE:02", "name": "LED_BLE_RIGHT", "rssi": -50, "is_compatible": True}]
    with patch("custom_components.ipixel_color.config_flow.discover_ipixel_devices", return_value=discovered):
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "group"})
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_NAME: "Wall", CONF_MEMBERS: ["left", "new:AA:BB:CC:DD:EE:02"]}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["errors"] == {CONF_MEMBERS: "panel_cannot_connect"}
    assert result["description_placeholders"] == {"panel": "LED_BLE_RIGHT"}
    assert len(hass.config_entries.async_entries(DOMAIN)) == 1
