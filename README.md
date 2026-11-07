# iPIXEL Color - Home Assistant Integration

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A4747U9)

A Home Assistant custom integration for iPIXEL Color LED matrix panels
(also sold as *B.K. Light LED Pixel Board* by Action). Panels are driven over
the **Home Assistant Bluetooth stack**, so local adapters *and* ESPHome /
Shelly Bluetooth proxies work. Several panels can be combined into **one large
virtual display**.

## Features

- **Multiple panels** – every panel is its own device with its own entities
- **Combined display** – place panels on a grid (for example 2×1 or 2×2) and drive
  them as one screen: text, images, GIFs and `draw_visuals` are rendered once and
  spread over the panels; power, brightness, clock and native text are sent to all
- **Display modes** – rendered text (`textimage`), native device text with scroll /
  blink effects (`text`), clock (9 styles), image / GIF from URL, music visualiser
- **Templates** – `{{ states('sensor.temperature') }}°C` is re-rendered automatically
  when the sensor changes (with *Auto update* on)
- **Colours, fonts, effects** – RGB text & background pickers, TTF/OTF fonts from
  the `fonts/` folder, image effects (blur, invert, mirror, ...)
- **Preview** – a camera entity shows what Home Assistant rendered last
- **Digital signage** – playlists, time slots and power schedules
- **Lovelace cards** – bundled cards are registered as a dashboard resource automatically
- **Robust Bluetooth** – one connection per panel, automatic reconnect, commands are
  serialised so uploads never interleave, errors are shown in the UI instead of
  being swallowed
- **Auto-discovery** – panels advertising as `LED_BLE_*` show up in *Devices & Services*

## Installation

### HACS (recommended)

1. HACS → three dots → **Custom repositories**
2. Add `https://github.com/wian007/ha-ipixel-color` as **Integration**
3. Install *iPIXEL Color* and restart Home Assistant
4. Settings → Devices & Services → **Add Integration** → *iPIXEL Color*

### Manual

Copy `custom_components/ipixel_color` into your `custom_components` folder and
restart Home Assistant.

### Requirements

- Home Assistant 2024.3 or newer with the Bluetooth integration set up
  (a local adapter or a Bluetooth proxy in range of every panel)
- The panel must **not** be connected to the phone app while Home Assistant uses it

## Setting up panels

*Add Integration → iPIXEL Color → Add a panel*. Pick the panel from the list of
Bluetooth devices Home Assistant sees (★ marks recognised iPIXEL panels) or enter
its address manually. The integration connects once to detect the panel size.

If the detected size is wrong you can override it under the panel's **Configure**
(options) dialog, together with the command timeout.

## Combining panels into one display

*Add Integration → iPIXEL Color → Combine panels into one display*.

1. Give the combined display a name and select its panels. The list shows the
   panels you already configured **and** panels Home Assistant currently sees over
   Bluetooth (marked *new*); new ones are added as panel devices automatically.
2. For every panel enter its **row** and **column** on the grid
   (row 0 = top, column 0 = left)

The result is two layers of devices: one device per panel (with its own entities,
usable on its own) and one device for the combined display. In the device list
the panels show up as *connected via* their combined display.

Two 64×16 panels on row 0, columns 0 and 1, become a 128×16 display; a 64×16 panel
above another one becomes 64×32. Mixed sizes work too (each grid row is as high as
its tallest panel).

Example with four 64×16 panels:

| Wanted | Positions (row, column) | Result |
|--------|-------------------------|--------|
| One long strip | (0,0) (0,1) (0,2) (0,3) | 256×16 |
| 2×2 wall | (0,0) (0,1) (1,0) (1,1) | 128×32 |
| Stacked | (0,0) (1,0) (2,0) (3,0) | 64×64 |

The flow pre-fills row 0 and the next free column, so for a strip you can simply
confirm each step.

**Bluetooth capacity:** every panel keeps its own BLE connection. An ESPHome
Bluetooth proxy handles 3 connections at a time, so for four panels use two
proxies (or a local adapter) with every panel in range of a free slot.

The combined display gets its own device with the same entities as a panel.
Everything Home Assistant renders itself is sliced over the panels and uploaded to
all of them in parallel:

| Content | Combined display behaviour |
|---------|----------------------------|
| Rendered text (`textimage` mode), image / GIF, `draw_visuals`, `set_pixels`, `draw_solid_color` | one canvas, spread over the panels |
| Native text (`text` mode), clock, rhythm | sent to every panel (each panel shows it on its own) |
| Power, brightness, orientation, clear, sync time, slots, ... | sent to every panel |

The layout (pixel rectangle per panel) is exposed as attributes of the combined
display's *Width* sensor. Panels that are temporarily unavailable are skipped; the
*Panels loaded* sensor shows how many are online. Change panels or positions later
through **Configure** on the combined display.

**Synchronised animations.** A GIF on a combined display is sliced into one GIF per
panel. By default (option *Animation sync slot* = 1) those GIFs are first stored in
that slot on every panel and, once all uploads have finished, started with a single
simultaneous show-slot command so the panels begin playing together. Set the option
to 0 to upload directly instead (each panel then starts as soon as its own upload is
done). The slot's previous content on the panels is overwritten.

## Entities

Every panel and every combined display provides:

| Entity | Purpose |
|--------|---------|
| `text.<name>_display` | Text to show (templates and `\n` supported) |
| `text.<name>_image_url` | Image / GIF URL for `gif` mode |
| `select.<name>_mode` | `textimage`, `text`, `clock`, `gif`, `rhythm` |
| `switch.<name>_auto_update` | Re-render automatically when a setting or template changes |
| `button.<name>_update_display` | Render the current settings now |
| `switch.<name>_power`, `number.<name>_brightness`, `select.<name>_orientation` | Device control (sent immediately) |
| `light.<name>_text_color`, `light.<name>_background_color` | Colour pickers |
| `select.<name>_font`, `number.<name>_font_size`, `number.<name>_line_spacing`, `switch.<name>_antialiasing` | Text rendering |
| `number.<name>_text_animation`, `number.<name>_text_speed`, `number.<name>_text_rainbow` | Native text effects |
| `select.<name>_clock_style`, `switch.<name>_clock_24h`, `switch.<name>_clock_show_date` | Clock mode |
| `select.<name>_rhythm_style`, `number.<name>_rhythm_speed` | Music visualiser |
| `select.<name>_effect` | Image effect applied to rendered content |
| `switch.<name>_screen_visible`, `button.<name>_clear_display`, `button.<name>_sync_time`, `switch.<name>_fun_mode` | Misc. device control |
| `switch.<name>_playlist`, `number.<name>_schedule_interval` | Playlist loop |
| `camera.<name>_preview` | Last rendered frame |
| `media_player.<name>_image_player` | Play an image / GIF URL |
| `sensor.<name>_width`, `sensor.<name>_height`, ... | Diagnostics |

Settings are restored after a restart; nothing is sent to the panels at startup.

## Services

Every service takes a standard Home Assistant **target**: the device of a panel or
combined display, any of its entities, or an area. When only one display is
configured the target can be omitted.

| Service | Description |
|---------|-------------|
| `ipixel_color.display_text` | Show text. `mode: text` = rendered by the panel (scroll/blink animations), `mode: textimage` = rendered by Home Assistant as one image over a combined display |
| `ipixel_color.update_display` | Re-render the current entity settings |
| `ipixel_color.display_image` | Show an image or GIF from a `url` or local `path`; `method: stream` sends raw pixels instead of an upload |
| `ipixel_color.draw_visuals` / `stop_visuals` | Multi-element canvas (text, scrolling text, images, pixels) with animation |
| `ipixel_color.draw_solid_color`, `set_pixel`, `set_pixels`, `clear_display` | Pixel level control (combined coordinates on a combined display) |
| `ipixel_color.set_power`, `set_brightness`, `set_orientation`, `set_upside_down` | Device control |
| `ipixel_color.set_clock_mode`, `set_rhythm_mode` | Native modes (`set_rhythm_mode` takes optional 11 band `levels`) |
| `ipixel_color.sync_time`, `set_time` | Clock |
| `ipixel_color.show_slot`, `delete_slot`, `erase_data`, `set_program_mode`, `set_screen`, `set_diy_mode`, `set_default_mode` | Storage / screens |
| `ipixel_color.add_schedule`, `remove_schedule`, `trigger_schedule`, `set_playlist`, `create_playlist`, `start_playlist`, `stop_playlist`, `set_power_schedule`, `add_time_slot` | Digital signage |
| `ipixel_color.send_raw_command`, `send_mix_data`, `set_password`, `verify_password` | Expert |

Old names (`clear_pixels`, `display_image_url`, `upload_gif`, `display_gif`,
`display_image_raw_rgb`, `display_image_raw_rgb_url`, `set_pixels_batched`,
`set_rhythm_mode_advanced`) keep working but log a deprecation warning.

Example:

```yaml
service: ipixel_color.display_text
target:
  device_id: 1a2b3c4d5e6f           # the combined display
data:
  text: "{{ states('sensor.outside_temperature') }}°C"
  mode: textimage
  color_fg: [255, 160, 0]
```

See [`examples/`](examples/) for automations.

## Lovelace cards

The bundled cards are served at `/ipixel_color/ipixel-display-card.js` and
registered as a dashboard resource automatically when your dashboards are in
storage mode (the default). In YAML mode add the resource yourself:

```yaml
resources:
  - url: /ipixel_color/ipixel-display-card.js
    type: module
```

### iPIXEL Wall card (recommended)

Shows what Home Assistant actually sent to the display: the preview frame drawn
as an LED matrix, with the panels of a combined display drawn as separate tiles.
Includes power, brightness, mode and a quick text input. Works for a single panel
and for a combined display; any entity of the display can be used as `entity`.

```yaml
type: custom:ipixel-wall-card
entity: text.living_room_wall_display
name: Living room wall      # optional
refresh: 2                  # seconds between frame refreshes (optional)
show_controls: true         # optional
show_panels: true           # draw the panels of a combined display (optional)
```

Native modes (device rendered text, clock, rhythm) have no frame; the card says so
instead of guessing.

### Other cards

| Card | Purpose |
|------|---------|
| `custom:ipixel-display-card` | Simulated LED preview with browser-side effects (also works without a device, *test mode*) |
| `custom:ipixel-text-card` | Text input with native animations, colours, rhythm levels, GFX JSON (`draw_visuals`) and multicolour text |
| `custom:ipixel-controls-card` | Brightness, orientation, clock settings, slots, DIY mode, raw commands |
| `custom:ipixel-playlist-card` / `custom:ipixel-schedule-card` | Playlists, power schedule and time slots |
| `custom:ipixel-editor-card` | Pixel editor that sends `set_pixels` (combined coordinates on a combined display) |

Example dashboard for a combined display and its panels:

```yaml
type: vertical-stack
cards:
  - type: custom:ipixel-wall-card
    entity: text.living_room_wall_display
  - type: entities
    title: Settings
    entities:
      - switch.living_room_wall_auto_update
      - select.living_room_wall_font
      - number.living_room_wall_font_size
      - light.living_room_wall_text_color
      - light.living_room_wall_background_color
      - select.living_room_wall_effect
  - type: grid
    columns: 2
    cards:
      - type: custom:ipixel-wall-card
        entity: text.panel_1_display
        show_controls: false
      - type: custom:ipixel-wall-card
        entity: text.panel_2_display
        show_controls: false
```

## Fonts

Put `.ttf` / `.otf` files in `custom_components/ipixel_color/fonts/` and restart.
They are available for rendered text; for native text mode the built-in
`UNIFONT` or a TTF file can be selected.

## Troubleshooting

- Enable debug logging: `custom_components.ipixel_color: debug`
- **Cannot connect** – the panel is off, out of range, or still connected to the
  phone app. With Bluetooth proxies make sure the panel is in range of a proxy
  that has a free connection slot.
- **Timeout waiting for ACK** – increase the command timeout in the panel options;
  large GIFs take a while over BLE.
- **Wrong size** – override width/height in the panel options.
- Download diagnostics from the device page for support requests.

## Development

```bash
make setup   # .venv with pytest-homeassistant-custom-component and HA's own dependency pins
make test    # pytest against a simulated panel, no hardware needed
make lint    # ruff
```

The pytest plugin pins the Home Assistant core the tests run against; releases for
Home Assistant 2026.3 and newer need Python 3.14 (`make setup PYTHON=python3.14`).
The Lovelace cards are built with `make card` (`npm run build` in
`custom_components/ipixel_color/www`).

## Acknowledgments

Thanks to the authors of [pypixelcolor](https://github.com/lucagoc/pypixelcolor) for
reverse-engineering the iPIXEL protocol; this integration uses it for command
encoding. Originally started by [cagcoach](https://github.com/cagcoach/ha-ipixel-color).

## License

GNU General Public License v3.0 – see the LICENSE file.
