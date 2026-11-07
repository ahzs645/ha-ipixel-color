# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Works with Home Assistant 2026.x: the version check of the Lovelace card no longer reads
  the manifest on the event loop and native text no longer resolves font files on the event loop.
- Development setup follows Home Assistant's own dependency pins (`bleak`, `habluetooth`, ...)
  and installs `aiousbwatcher`; the simulated panel works with bleak 1.x, 2.x and 3.x and
  `make test` finds `libstdc++` on NixOS.

## [0.2.0] - 2026-09-12

### Added
- New `ipixel-wall-card`: live preview of the frame Home Assistant sent (camera preview),
  panels of a combined display drawn as tiles, power, brightness, mode and quick text.
- A combined display can be created directly from panels that are not configured yet
  (they are added as panel devices on the fly); panel devices are linked *via* their
  combined display in the device registry.
- Services use the standard Home Assistant target selector (device, entity or area).
- `display_image` replaces `display_image_url`, `upload_gif`, `display_gif`,
  `display_image_raw_rgb` and `display_image_raw_rgb_url` (`url` or `path`, `method: upload|stream`);
  `set_rhythm_mode` takes optional `levels` (replaces `set_rhythm_mode_advanced`);
  `clear_display` replaces `clear_pixels`; `set_pixels` replaces `set_pixels_batched`.
  The old names keep working with a deprecation warning.
- The Lovelace cards find their entities through the entity registry (any entity naming
  works) and only call services and entities that exist.
- Combined displays start animations synchronously: GIFs are stored in a configurable slot on
  every panel and then shown with one simultaneous show-slot command (*Animation sync slot*
  option, default 1, 0 = off).
- **Combined displays**: group several panels on a grid (row/column) and drive them as one
  large screen. Rendered text, images/GIFs, `draw_visuals` and pixel services are sliced over
  the panels and uploaded in parallel; native features (power, brightness, clock, native text,
  rhythm) are broadcast to every panel. Panels and positions can be changed via *Configure*.
- Options flow for panels: width/height override and command timeout.
- Template tracking: text containing templates is re-rendered automatically when the
  referenced entities change (Auto update on).
- Services `update_display`, `set_power`, `set_orientation`, `set_rhythm_mode`,
  `stop_visuals`, plus aliases `clear_display`, `display_image`, `display_gif`.
- Services accept `entity_id` as target and default to the only display when just one is
  configured (this also makes the bundled Lovelace cards work again).
- Diagnostics download, Dutch translation, entity translation keys.
- Test suite with a simulated panel (no hardware needed); `requirements_dev.txt`, `pyproject.toml`,
  `Makefile` and a dev container for local development.

### Changed
- Complete refactor around a `Display` abstraction (`PanelDisplay` / `CompositeDisplay`) and
  a per-entry runtime that owns the settings; entities no longer scrape each other's states.
- Bluetooth transport rewritten on top of the Home Assistant Bluetooth stack: connections are
  established on demand with retries, all writes are serialised with a lock, notifications are
  handled by one handler and the chunk size follows the negotiated MTU.
- Setting changes are debounced into one display update; nothing is sent to panels at startup.
- Entity names use `has_entity_name` (existing entity ids are kept through their unique ids).
- Config entries migrated to version 2 (`entry_type`).
- Font cache moved to the system temp directory instead of the integration folder.
- `pypixelcolor` 0.5.0 or newer is required.

### Fixed
- Time slots and the power schedule use the Home Assistant timezone instead of the OS clock.
- Errors are raised to the UI/service caller instead of being logged and swallowed.
- `send_mix_data` crashed with a `NameError` in the window builder.
- Clock 24h / show date switches sent a display update on every start-up and lost their
  restored state (duplicate `async_added_to_hass`).
- Number entities looked up related entities by guessed entity ids.
- Camera preview used a deprecated supported-features value.
- Lovelace resource registration used a non-existent `hass.data` key.
- Debug `print()` left in the text renderer; per-pixel colour mapping replaced by LUTs.

## [0.1.0] - 2024-11-19

### Added
- Initial release of iPIXEL Color Home Assistant integration
- Bluetooth auto-discovery of iPIXEL devices (`LED_BLE_*` pattern)
- Basic power on/off control via switch entity
- Manual device configuration as fallback
- Proper Home Assistant device registry integration
- Connection management with error handling
- Configuration flow with discovery and manual entry options
- English translations and UI strings

### Technical Details
- Implements core Bluetooth protocol commands based on reverse-engineered documentation
- Uses `bleak` library for cross-platform Bluetooth Low Energy communication
- Follows Home Assistant integration best practices
- Power commands: `[5, 0, 7, 1, 1]` (on) / `[5, 0, 7, 1, 0]` (off)
- Bluetooth UUIDs:
  - Write: `0000fa02-0000-1000-8000-00805f9b34fb`
  - Notify: `0000fa03-0000-1000-8000-00805f9b34fb`

### Limitations
- Only basic power control in this version
- No brightness, color, or image upload features yet
- Single switch entity per device

### Coming in Future Versions
- v0.2.0: Brightness control and basic light entity
- v0.3.0: RGB color control and display modes
- v0.4.0: Image/GIF upload and media player entity
- v1.0.0: Complete feature set and HACS submission