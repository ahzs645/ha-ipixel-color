# iPIXEL Color - Home Assistant Integration

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A4747U9)

A Home Assistant custom integration for iPIXEL Color LED matrix displays via Bluetooth.
These displays have been recently available as B.K. Light LED Pixel Board from Action and thus get increasing popularity.

## Features

- **Multiple Display Modes**: Text Image, Native Text, Clock, GIF, and Rhythm modes
- **RGB Color Support**: Separate text and background colors via RGB light entities
- **Clock Display**: 9 different clock styles with automatic time synchronization
- **Rich Text Display**: Custom fonts, sizes, multiline text with `\n`, antialiasing
- **Template Support**: Use Home Assistant variables like `{{ states('sensor.temperature') }}°C`
- **Font Management**: Load TTF/OTF fonts from `fonts/` folder
- **Brightness Control**: Adjustable display brightness (1-100)
- **Orientation Control**: Rotate display (0°, 90°, 180°, 270°)
- **Rhythm/Music Visualizer**: Audio-reactive display with 5 visual styles
- **Direct Pixel Control**: Set individual LED pixels via service calls
- **Digital Signage**: Playlists, time slots, power scheduling
- **Lovelace Card**: Built-in visual control card
- **Auto/Manual Updates**: Choose automatic updates or manual refresh
- **State Persistence**: Settings preserved across HA restarts
- **Bluetooth Proxy Support**: Compatible with Bluetooth proxy devices
- **Auto-discovery**: Finds iPIXEL devices automatically via Bluetooth

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click on the three dots in the top right corner
3. Select **Custom repositories**
4. Add the repository URL: `https://github.com/cagcoach/ha-ipixel-color`
5. Select **Integration** as the category
6. Click **Add**
7. Search for "iPIXEL Color" in HACS and install it
8. Restart Home Assistant
9. Add the integration via Settings → Devices & Services → Add Integration

### Manual Installation

1. Copy `custom_components/ipixel_color` to your HA `custom_components` directory
2. Restart Home Assistant
3. Add integration via Settings → Devices & Services → Add Integration

### Optional: Custom Fonts

Place `.ttf`/`.otf` font files in the `fonts/` folder within the integration directory for additional font options.

## Entities

Once configured, you'll get these entities:

**Display Control:**
- `select.{device}_mode` - Display mode (textimage, text, clock)
- `text.{device}_display` - Enter text with templates and `\n` for newlines
- `switch.{device}_power` - Turn display on/off
- `number.{device}_brightness` - Display brightness level (1-100)

**Text Appearance:**
- `select.{device}_font` - Choose from available fonts
- `number.{device}_font_size` - Font size (0=auto, supports decimals like 12.5)
- `number.{device}_line_spacing` - Spacing between lines (0-20px)
- `switch.{device}_antialiasing` - Smooth vs sharp text
- `light.{device}_text_color` - RGB text color
- `light.{device}_background_color` - RGB background color

**Clock Mode:**
- `select.{device}_clock_style` - Clock style (0-8)
- `switch.{device}_clock_24h_format` - 24-hour time format
- `switch.{device}_clock_show_date` - Show date below time

**Update Control:**
- `switch.{device}_auto_update` - Auto-update on changes
- `button.{device}_update_display` - Manual refresh

**Device Info:**
- `sensor.{device}_width` - Display width in pixels
- `sensor.{device}_height` - Display height in pixels
- `sensor.{device}_device_type` - Device model information

## Template Examples

```jinja2
Time: {{ now().strftime('%H:%M') }}
Temp: {{ states('sensor.temperature') | round(1) }}°C
{% if is_state('sun.sun', 'above_horizon') %}Day{% else %}Night{% endif %}
```

## Quick Start

**Text Mode:**
1. Select mode: `textimage` (for RGB colors) or `text` (native)
2. Set text: `"Hello\nWorld"`
3. Choose text and background colors using light entities
4. Select font and size (or use auto-sizing)
5. Toggle auto-update ON or use manual update button

**Clock Mode:**
1. Select mode: `clock`
2. Choose clock style (0-8)
3. Set 24-hour format and date display preferences
4. Time syncs automatically

**Templates:**
- Templates update automatically with sensor changes when auto-update is ON

## Font Management

- Place `.ttf`/`.otf` files in `fonts/` folder
- Restart HA to see new fonts in dropdown
- Recommended: pixel fonts like 5x5.ttf, 7x7.ttf

## Safety Notes

These displays store content in SPI flash and re-read it at every boot, so a
bad write can leave the device unable to start.

- **Text animations 3 and 4 boot-loop non-32×32 panels.** They are blocked by
  this integration and omitted from the service pickers. Recovery from a boot
  loop means racing a clear command into a very short window at power-on, so
  don't try to send them via `send_raw_command` either.
- **Test content before writing it to a slot.** If a payload displays correctly
  without `buffer_slot`, it is safe to save. A corrupt payload written to a slot
  is replayed on every boot.
- **`ipixel_color.set_default_mode` is destructive.** It erases every saved slot
  and the device settings. To blank the screen, use `ipixel_color.clear_pixels`
  or turn off the screen switch — both are non-destructive.

## Troubleshooting

**Device not found / won't connect**

The panel accepts only one Bluetooth connection at a time, and it stops
advertising entirely while something is connected to it. This is the most common
cause of discovery failures:

1. Force-close the official iPIXEL Color app on every phone in range (leaving it
   backgrounded is often enough to hold the connection).
2. If the panel was paired to a phone, unpair it there.
3. Power-cycle the panel and retry discovery in Home Assistant.

Only one controller can drive the display — pick either Home Assistant or the
phone app, not both.

**Other issues**

- Enable debug logging: `custom_components.ipixel_color: debug`
- Check auto-update is ON or use manual update button
- Verify templates in Developer Tools → Template
- Ensure device is in Bluetooth range

## Lovelace Card

The integration includes a built-in Lovelace card for visual control. After installation, add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /ipixel_color/ipixel-display-card.js
    type: module
```

Then add the card to your dashboard:

```yaml
type: custom:ipixel-display-card
entity: text.ipixel_living_room_text
name: Living Room Display
resolution: 64x16
show_header: true
show_display: true
show_controls: true
show_quick_actions: true
```

**Card Features:**
- Display preview with LED matrix visualization
- Quick actions: Power, Clear, Clock, Sync Time
- Text input with effects (scroll, blink, breeze, snow, laser)
- Brightness and orientation controls
- Playlist management
- Power schedule configuration

## Services

The integration provides these services for automation:

| Service | Description |
|---------|-------------|
| `ipixel_color.display_text` | Display text with effects and colors |
| `ipixel_color.set_brightness` | Set brightness level (1-100) |
| `ipixel_color.set_clock_mode` | Enable clock display with style options |
| `ipixel_color.sync_time` | Sync current time to device |
| `ipixel_color.upload_gif` | Upload and display GIF animation |
| `ipixel_color.set_pixel` | Set a single pixel color |
| `ipixel_color.set_pixels` | Set multiple pixels (batch) |
| `ipixel_color.clear_pixels` | Clear the display |
| `ipixel_color.show_slot` | Display content from stored slot |
| `ipixel_color.delete_slot` | Delete stored slot content |
| `ipixel_color.create_playlist` | Create content playlist |
| `ipixel_color.start_playlist` | Start playlist playback |
| `ipixel_color.stop_playlist` | Stop playlist |
| `ipixel_color.add_schedule` | Add scheduled display item |
| `ipixel_color.set_power_schedule` | Configure auto on/off times |
| `ipixel_color.add_time_slot` | Schedule playlist for specific times |

## Status

| Feature | Status |
|---------|--------|
| ✅ Text Display (3 modes) | Complete |
| ✅ RGB Colors | Complete |
| ✅ Clock Mode (9 styles) | Complete |
| ✅ Custom Fonts | Complete |
| ✅ Templates | Complete |
| ✅ State Persistence | Complete |
| ✅ Brightness Control | Complete |
| ✅ Orientation Control | Complete |
| ✅ Rhythm/Music Mode | Complete |
| ✅ Pixel Control | Complete |
| ✅ Digital Signage | Complete |
| ✅ Lovelace Card | Complete |
| 🔄 GIF Animations | In Progress |
| 🔄 Animated Variable-Width Fonts | Planned |

## Technical

- Requires: Home Assistant 2024.1+ and HACS

## Acknowledgments

Special thanks to the authors of [pypixelcolor](https://github.com/lucagoc/pypixelcolor) for their excellent library that powers the core functionality of this integration. Their work in reverse-engineering the iPIXEL protocol has been invaluable.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.