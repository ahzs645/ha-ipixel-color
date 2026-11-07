"""Integration tests: setup, entities, services and combined displays."""
from __future__ import annotations

import asyncio

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from custom_components.ipixel_color.const import DOMAIN

from .conftest import get_device, make_group_entry, make_panel_entry
from .fake_panel import DEVICE_TYPE_32X32, DEVICE_TYPE_64X16

LEFT = "AA:BB:CC:DD:EE:01"
RIGHT = "AA:BB:CC:DD:EE:02"


async def _setup_panel(hass: HomeAssistant, fake_bluetooth, address: str, name: str, entry_id: str, device_type=DEVICE_TYPE_64X16):
    fake_bluetooth.add(address, device_type)
    entry = make_panel_entry(address, name, entry_id=entry_id)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED
    return entry


async def _settle(hass: HomeAssistant) -> None:
    """Wait for the debounced display update."""
    for _ in range(3):
        await asyncio.sleep(0.5)
        await hass.async_block_till_done()


def _entity(hass: HomeAssistant, platform: str, unique_id: str) -> str:
    entity_id = er.async_get(hass).async_get_entity_id(platform, DOMAIN, unique_id)
    assert entity_id, f"entity {platform}/{unique_id} missing"
    return entity_id


async def test_panel_setup_creates_entities(hass: HomeAssistant, fake_bluetooth):
    entry = await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]

    assert hass.states.get(_entity(hass, "sensor", f"{LEFT}_width")).state == "64"
    assert hass.states.get(_entity(hass, "sensor", f"{LEFT}_height")).state == "16"
    assert hass.states.get(_entity(hass, "switch", f"{LEFT}_power")).state == "on"
    assert hass.states.get(_entity(hass, "text", f"{LEFT}_text_display")).state == ""
    assert hass.states.get(_entity(hass, "select", f"{LEFT}_mode_select")).state == "textimage"

    # Connecting only queried the device info; nothing else was sent at startup.
    assert [f.command for f in panel.frames] == [(1, 0x80)]

    device = get_device(hass, LEFT, "left")
    assert device is not None and device.model == "LED Matrix 64x16"

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert not panel.is_connected


async def test_power_and_brightness_send_commands(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    panel.clear()

    await hass.services.async_call(
        "switch", "turn_off", {ATTR_ENTITY_ID: _entity(hass, "switch", f"{LEFT}_power")}, blocking=True
    )
    assert panel.frames[-1].data == bytes([5, 0, 7, 1, 0])
    assert hass.states.get(_entity(hass, "switch", f"{LEFT}_power")).state == "off"

    await hass.services.async_call(
        "number",
        "set_value",
        {ATTR_ENTITY_ID: _entity(hass, "number", f"{LEFT}_brightness"), "value": 25},
        blocking=True,
    )
    assert panel.frames[-1].data == bytes([5, 0, 4, 0x80, 25])


async def test_auto_update_renders_text_image(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]

    # Without auto update nothing is sent.
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: _entity(hass, "text", f"{LEFT}_text_display"), "value": "Hi"}, blocking=True
    )
    await _settle(hass)
    assert panel.frames_for((0x02, 0x00)) == []

    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: _entity(hass, "switch", f"{LEFT}_auto_update")}, blocking=True
    )
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: _entity(hass, "text", f"{LEFT}_text_display"), "value": "Hello"}, blocking=True
    )
    await _settle(hass)

    image = panel.last_image()
    assert image is not None and image.size == (64, 16)
    # White text on black: at least one lit pixel
    assert any(image.getpixel((x, y)) != (0, 0, 0) for x in range(64) for y in range(16))

    # Camera preview shows the rendered frame
    runtime = hass.data[DOMAIN]["left"]
    assert runtime.last_frame_png is not None


async def test_template_text_updates_automatically(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    hass.states.async_set("sensor.temp", "21")

    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: _entity(hass, "switch", f"{LEFT}_auto_update")}, blocking=True
    )
    await hass.services.async_call(
        "text",
        "set_value",
        {ATTR_ENTITY_ID: _entity(hass, "text", f"{LEFT}_text_display"), "value": "{{ states('sensor.temp') }}C"},
        blocking=True,
    )
    await _settle(hass)
    first = len(panel.frames_for((0x02, 0x00)))
    assert first >= 1

    hass.states.async_set("sensor.temp", "22")
    await _settle(hass)
    assert len(panel.frames_for((0x02, 0x00))) > first


async def test_display_text_service_native_and_errors(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    panel.clear()

    # Single display: no target needed.
    await hass.services.async_call(DOMAIN, "display_text", {"text": "Hey", "effect": 1}, blocking=True)
    assert panel.frames_for((0x00, 0x01)), "native text upload expected"

    await hass.services.async_call(DOMAIN, "set_clock_mode", {"style": 2}, blocking=True)
    assert panel.frames_for((6, 1))

    # Errors surface to the caller instead of being swallowed.
    panel.is_connected = False
    panel.fail_connect = True
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(DOMAIN, "set_brightness", {"level": 10}, blocking=True)


async def test_service_target_by_device_and_entity(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right")
    left, right = fake_bluetooth.panels[LEFT], fake_bluetooth.panels[RIGHT]
    left.clear()
    right.clear()

    # Two displays and no target -> validation error
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(DOMAIN, "sync_time", {}, blocking=True)

    device = get_device(hass, RIGHT, "right")
    await hass.services.async_call(DOMAIN, "set_brightness", {"device_id": device.id, "level": 77}, blocking=True)
    assert right.frames[-1].data == bytes([5, 0, 4, 0x80, 77]) and not left.frames

    await hass.services.async_call(
        DOMAIN, "set_brightness", {"entity_id": _entity(hass, "switch", f"{LEFT}_power"), "level": 11}, blocking=True
    )
    assert left.frames[-1].data == bytes([5, 0, 4, 0x80, 11])


async def test_combined_display(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right")
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall")
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()
    assert group.state is ConfigEntryState.LOADED

    prefix = "group_wall"
    assert hass.states.get(_entity(hass, "sensor", f"{prefix}_width")).state == "128"
    assert hass.states.get(_entity(hass, "sensor", f"{prefix}_height")).state == "16"
    assert hass.states.get(_entity(hass, "sensor", f"{prefix}_panel_count")).state == "2/2"

    left, right = fake_bluetooth.panels[LEFT], fake_bluetooth.panels[RIGHT]
    left.clear()
    right.clear()

    # Brightness is broadcast to both panels.
    await hass.services.async_call(
        "number", "set_value", {ATTR_ENTITY_ID: _entity(hass, "number", f"{prefix}_brightness"), "value": 60}, blocking=True
    )
    assert left.frames[-1].data == bytes([5, 0, 4, 0x80, 60])
    assert right.frames[-1].data == bytes([5, 0, 4, 0x80, 60])

    # Rendered text is spread over both panels as one 128x16 image.
    await hass.services.async_call(
        "switch", "turn_on", {ATTR_ENTITY_ID: _entity(hass, "switch", f"{prefix}_auto_update")}, blocking=True
    )
    await hass.services.async_call(
        "text", "set_value", {ATTR_ENTITY_ID: _entity(hass, "text", f"{prefix}_text_display"), "value": "WIDE TEXT"}, blocking=True
    )
    await _settle(hass)
    left_img, right_img = left.last_image(), right.last_image()
    assert left_img.size == (64, 16) and right_img.size == (64, 16)
    lit = lambda img: sum(1 for x in range(64) for y in range(16) if img.getpixel((x, y)) != (0, 0, 0))  # noqa: E731
    assert lit(left_img) > 0 and lit(right_img) > 0

    runtime = hass.data[DOMAIN]["wall"]
    assert runtime.last_frame.size == (128, 16)

    # Pixels use combined coordinates and are routed to the right panel.
    left.clear()
    right.clear()
    await hass.services.async_call(
        DOMAIN,
        "set_pixels",
        {"entity_id": _entity(hass, "switch", f"{prefix}_power"), "pixels": [{"x": 70, "y": 2, "color": "ff0000"}]},
        blocking=True,
    )
    assert right.frames[-1].data[8:10] == bytes([6, 2]) and not left.frames_for((5, 1))

    # Unloading a member panel keeps the group working with the remaining panel.
    assert await hass.config_entries.async_unload("right")
    await hass.async_block_till_done()
    assert hass.states.get(_entity(hass, "sensor", f"{prefix}_width")).state == "64"
    assert hass.states.get(_entity(hass, "sensor", f"{prefix}_panel_count")).state == "1/2"


async def test_group_with_mixed_sizes(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Wide", "wide", DEVICE_TYPE_64X16)
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Square", "square", DEVICE_TYPE_32X32)
    group = make_group_entry("Mixed", [("wide", 0, 0), ("square", 0, 1)], entry_id="mixed")
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(_entity(hass, "sensor", "group_mixed_width")).state == "96"
    assert hass.states.get(_entity(hass, "sensor", "group_mixed_height")).state == "32"


async def test_panel_not_reachable_retries(hass: HomeAssistant, fake_bluetooth):
    fake_bluetooth.add(LEFT).fail_connect = True
    entry = make_panel_entry(LEFT, "Left", entry_id="left")
    entry.add_to_hass(hass)
    assert not await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_RETRY


async def test_reconnect_after_disconnect(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]

    # Simulate the panel dropping the link.
    panel.is_connected = False
    panel.disconnected_callback(panel)
    await hass.async_block_till_done()

    await hass.services.async_call(DOMAIN, "set_brightness", {"level": 33}, blocking=True)
    assert panel.connect_count == 2
    assert panel.frames[-1].data == bytes([5, 0, 4, 0x80, 33])


async def test_migrate_v1_entry(hass: HomeAssistant, fake_bluetooth):
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    fake_bluetooth.add(LEFT)
    entry = MockConfigEntry(domain=DOMAIN, title="Old", unique_id=LEFT, version=1, data={"address": LEFT, "name": "Old"})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.version == 2 and entry.data["entry_type"] == "panel"


async def test_diagnostics(hass: HomeAssistant, fake_bluetooth):
    from custom_components.ipixel_color.diagnostics import async_get_config_entry_diagnostics

    entry = await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    data = await async_get_config_entry_diagnostics(hass, entry)
    assert data["display"]["type"] == "panel"
    assert data["display"]["device_info"]["width"] == 64
    assert data["settings"]["mode"] == "textimage"


async def test_clear_display_and_gif_url(hass: HomeAssistant, fake_bluetooth):
    import io

    from PIL import Image

    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    panel.clear()
    await hass.services.async_call(DOMAIN, "clear_display", {}, blocking=True)
    assert panel.frames[-1].data == bytes([4, 0, 3, 0x80])

    # Animated GIF from a URL is uploaded as a GIF resized to the panel.
    frames = [Image.new("RGB", (100, 30), (255, 0, 0)), Image.new("RGB", (100, 30), (0, 255, 0))]
    buffer = io.BytesIO()
    frames[0].save(buffer, format="GIF", save_all=True, append_images=frames[1:], duration=80, loop=0)
    runtime = hass.data[DOMAIN]["left"]

    async def _fake_fetch(url):
        return buffer.getvalue(), ".gif"

    runtime.async_fetch_image = _fake_fetch
    await hass.services.async_call(DOMAIN, "display_image", {"url": "http://x/a.gif"}, blocking=True)
    decoded = panel.last_gif_frames()
    assert len(decoded) == 2 and decoded[0].size == (64, 16)
    assert runtime.last_frame.size == (64, 16)


async def test_four_panels_as_one_display(hass: HomeAssistant, fake_bluetooth):
    """Four 64x16 panels: 2x2 grid (128x32) and a single row (256x16)."""
    from PIL import Image

    addresses = [f"AA:BB:CC:DD:EE:0{i}" for i in range(1, 5)]
    for index, address in enumerate(addresses):
        await _setup_panel(hass, fake_bluetooth, address, f"P{index}", f"p{index}")

    # 2 x 2 grid
    group = make_group_entry("Quad", [("p0", 0, 0), ("p1", 0, 1), ("p2", 1, 0), ("p3", 1, 1)], entry_id="quad")
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(_entity(hass, "sensor", "group_quad_width")).state == "128"
    assert hass.states.get(_entity(hass, "sensor", "group_quad_height")).state == "32"

    # One distinct colour per quadrant must end up on the matching panel.
    canvas = Image.new("RGB", (128, 32))
    colours = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
    for index, colour in enumerate(colours):
        x0, y0 = (index % 2) * 64, (index // 2) * 16
        canvas.paste(Image.new("RGB", (64, 16), colour), (x0, y0))
    runtime = hass.data[DOMAIN]["quad"]
    for panel in fake_bluetooth.panels.values():
        panel.clear()
    await runtime.async_show_image(canvas)
    for index, address in enumerate(addresses):
        image = fake_bluetooth.panels[address].last_image()
        assert image.size == (64, 16)
        assert image.getpixel((5, 5)) == colours[index]

    assert await hass.config_entries.async_unload(group.entry_id)
    await hass.async_block_till_done()

    # One long row
    row = make_group_entry("Strip", [("p0", 0, 0), ("p1", 0, 1), ("p2", 0, 2), ("p3", 0, 3)], entry_id="strip")
    row.add_to_hass(hass)
    assert await hass.config_entries.async_setup(row.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(_entity(hass, "sensor", "group_strip_width")).state == "256"
    assert hass.states.get(_entity(hass, "sensor", "group_strip_height")).state == "16"

    runtime = hass.data[DOMAIN]["strip"]
    for panel in fake_bluetooth.panels.values():
        panel.clear()
    await hass.services.async_call(
        DOMAIN,
        "display_text",
        {"entity_id": _entity(hass, "text", "group_strip_text_display"), "text": "ONE LONG MESSAGE", "mode": "textimage"},
        blocking=True,
    )
    assert runtime.last_frame.size == (256, 16)
    for address in addresses:
        assert fake_bluetooth.panels[address].last_image().size == (64, 16)


async def _gif_bytes(size=(100, 100)) -> bytes:
    import io

    from PIL import Image

    frames = [Image.new("RGB", size, (255, 0, 0)), Image.new("RGB", size, (0, 0, 255))]
    buffer = io.BytesIO()
    frames[0].save(buffer, format="GIF", save_all=True, append_images=frames[1:], duration=80, loop=0)
    return buffer.getvalue()


async def test_combined_gif_starts_synchronised_from_slot(hass: HomeAssistant, fake_bluetooth):
    """Default: GIFs are stored in slot 1 on every panel, then shown with one command."""
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left", DEVICE_TYPE_32X32)
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right", DEVICE_TYPE_32X32)
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall")
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()

    runtime = hass.data[DOMAIN]["wall"]
    gif = await _gif_bytes()

    async def _fake_fetch(url):
        return gif, ".gif"

    runtime.async_fetch_image = _fake_fetch
    for panel in fake_bluetooth.panels.values():
        panel.clear()
    await hass.services.async_call(
        DOMAIN, "display_image", {"entity_id": _entity(hass, "switch", "group_wall_power"), "url": "http://x/a.gif"}, blocking=True
    )
    for panel in fake_bluetooth.panels.values():
        gif_frames = panel.frames_for((0x03, 0x00))
        assert gif_frames, "GIF upload expected"
        assert all(f.data[14] == 1 for f in gif_frames), "GIF must be stored in slot 1"
        assert len(panel.last_gif_frames()) == 2 and panel.last_gif_frames()[0].size == (32, 32)
        # the show_slot command comes after the upload
        assert panel.frames[-1].data == bytes([7, 0, 8, 0x80, 1, 0, 1])


async def test_combined_gif_without_sync_slot(hass: HomeAssistant, fake_bluetooth):
    """sync_slot 0 disables the slot mechanism: GIFs are shown directly."""
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left", DEVICE_TYPE_32X32)
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right", DEVICE_TYPE_32X32)
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall", sync_slot=0)
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()

    runtime = hass.data[DOMAIN]["wall"]
    gif = await _gif_bytes()
    await runtime.async_show_image_bytes(gif, ".gif")
    for panel in fake_bluetooth.panels.values():
        gif_frames = panel.frames_for((0x03, 0x00))
        assert gif_frames and all(f.data[14] == 0 for f in gif_frames)
        assert not panel.frames_for((8, 0x80))


async def test_deprecated_service_aliases(hass: HomeAssistant, fake_bluetooth, caplog):
    """Old service names keep working and log a deprecation warning."""
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    panel.clear()
    await hass.services.async_call(DOMAIN, "clear_pixels", {}, blocking=True)
    assert panel.frames[-1].data == bytes([4, 0, 3, 0x80])
    assert "clear_pixels is deprecated" in caplog.text

    await hass.services.async_call(DOMAIN, "set_rhythm_mode_advanced", {"style": 1, "levels": "1,2,3,4,5,6,7,8,9,10,11"}, blocking=True)
    assert panel.frames[-1].data == bytes([16, 0, 1, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])

    await hass.services.async_call(DOMAIN, "set_pixels_batched", {"pixels": [{"x": 1, "y": 2, "color": "00ff00"}]}, blocking=True)
    assert panel.frames[-1].data[8:10] == bytes([1, 2])


async def test_display_image_from_path_and_stream(hass: HomeAssistant, fake_bluetooth, tmp_path):
    from PIL import Image

    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    image_path = tmp_path / "pic.png"
    Image.new("RGB", (10, 10), (0, 255, 0)).save(image_path)
    hass.config.allowlist_external_dirs = {str(tmp_path)}

    # upload (stored image protocol)
    panel.clear()
    await hass.services.async_call(DOMAIN, "display_image", {"path": str(image_path)}, blocking=True)
    assert panel.last_image().getpixel((3, 3)) == (0, 255, 0)

    # stream (raw rgb protocol, command 0x0000)
    panel.clear()
    await hass.services.async_call(DOMAIN, "display_image", {"path": str(image_path), "method": "stream"}, blocking=True)
    assert panel.frames_for((0, 0)), "raw RGB stream expected"
    assert not panel.frames_for((2, 0))

    # path outside the allowlist is rejected
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call(DOMAIN, "display_image", {"path": "/etc/hostname"}, blocking=True)


async def test_service_target_by_area(hass: HomeAssistant, fake_bluetooth):
    from homeassistant.helpers import area_registry as ar

    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right")
    area = ar.async_get(hass).async_get_or_create("Living room")
    device = get_device(hass, RIGHT, "right")
    dr.async_get(hass).async_update_device(device.id, area_id=area.id)

    left, right = fake_bluetooth.panels[LEFT], fake_bluetooth.panels[RIGHT]
    left.clear()
    right.clear()
    await hass.services.async_call(DOMAIN, "set_brightness", {"area_id": area.id, "level": 42}, blocking=True)
    assert right.frames[-1].data == bytes([5, 0, 4, 0x80, 42]) and not left.frames


async def test_display_text_parameter_aliases(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    panel = fake_bluetooth.panels[LEFT]
    panel.clear()
    await hass.services.async_call(
        DOMAIN, "display_text", {"text": "Hi", "animation": 2, "text_color": "ff0000", "font_size": 16}, blocking=True
    )
    upload = panel.frames_for((0x00, 0x01))
    assert upload, "native text upload expected"
    payload = upload[0].data[15:]
    # payload: [num_chars][00 01 01][animation][speed][rainbow][r g b]...
    assert payload[4] == 2 and payload[7:10] == bytes([255, 0, 0])


async def test_panels_are_linked_via_group_device(hass: HomeAssistant, fake_bluetooth):
    await _setup_panel(hass, fake_bluetooth, LEFT, "Left", "left")
    await _setup_panel(hass, fake_bluetooth, RIGHT, "Right", "right")
    group = make_group_entry("Wall", [("left", 0, 0), ("right", 0, 1)], entry_id="wall")
    group.add_to_hass(hass)
    assert await hass.config_entries.async_setup(group.entry_id)
    await hass.async_block_till_done()

    group_device = get_device(hass, "group_wall", "wall")
    for address, entry_id in ((LEFT, "left"), (RIGHT, "right")):
        assert get_device(hass, address, entry_id).via_device_id == group_device.id

    assert await hass.config_entries.async_unload(group.entry_id)
    await hass.async_block_till_done()
    assert get_device(hass, LEFT, "left").via_device_id is None
