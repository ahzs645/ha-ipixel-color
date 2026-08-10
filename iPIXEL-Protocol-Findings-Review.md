# iPIXEL Protocol — Upstream Research & Implementation Review

**Date:** 2026-08-10
**Scope:** Audit of what this repository currently implements against every publicly
available reverse-engineering effort on the iPIXEL Color / B.K. Light LED Pixel Board
protocol, as of August 2026.

It records what other people have figured out since `iPIXEL-Protocol-Documentation.md`
was written, and lists the places where our implementation or our documented assumptions
disagree with the current consensus.

> **Status:** §3.1–§3.8 have been fixed. Items still open are marked *OPEN* in §3.11,
> plus everything in §5. See §7 for what changed.

---

## 1. The upstream landscape (who else is working on this)

`iPIXEL-Protocol-Documentation.md` cites only two sources (`go-ipxl`, `ipixel-ctrl`).
There are now at least ten independent implementations, several of them substantially
more advanced and more recently maintained:

| Project | Language | Last activity | Why it matters |
|---|---|---|---|
| [lucagoc/pypixelcolor](https://github.com/lucagoc/pypixelcolor) (formerly `iPixel-CLI`) | Python | 2026-06 | **Our actual dependency.** The reference implementation; derived from BLE captures of the official app. |
| [DonKracho/ESPHome-component-iPixel-ble](https://github.com/DonKracho/ESPHome-component-iPixel-ble) | C++ / ESPHome | **2026-03** | Newest and cleanest protocol description. Author owns a 32×32 Action board. Resolves several open questions. |
| [sdolphin-JP/ipixel-ctrl](https://github.com/sdolphin-JP/ipixel-ctrl) | Python | 2025-05 | Only source with a **formal command/response spec** (`docs/DeviceCommands.md`), incl. return codes and slot-number semantics. |
| [yyewolf/go-ipxl](https://github.com/yyewolf/go-ipxl) | Go | 2025-12 | Direct port of the Android SDK's `SendCore`; authoritative on the data-type byte table. |
| [ToBiDi0410/iPixel-ESP32](https://github.com/ToBiDi0410/iPixel-ESP32) | C++ | 2025-11 | Independent reimplementation; confirms the legacy text record format. |
| [SuperIlu/iPixel-CLI](https://github.com/SuperIlu/iPixel-CLI) | Python | 2025-11 | Fork of the pre-rewrite CLI; preserves the legacy text header maths. |
| [Cino2424/iPixel-CLI-ESP32](https://github.com/Cino2424/iPixel-CLI-ESP32) | Python | 2025-10 | ESP32 host port. |
| [lucagoc/iPixel-ESPHome](https://github.com/lucagoc/iPixel-ESPHome) | ESPHome YAML | 2025-11 | ESP32 BLE gateway approach. |
| [lucagoc/iPixel-CFW](https://github.com/lucagoc/iPixel-CFW) | — | 2025-11 | **Hardware teardown**: MCU is a JieLi AC6951C, flash is a ZBIT ZB25VQ32. |
| [freijn/iPixelLedBoard-MQTT-Homeassistant](https://github.com/freijn/iPixelLedBoard-MQTT-Homeassistant) | ESPHome/MQTT | 2025 | Alternative HA path; notable for its 30 s BLE keep-alive. |
| [Bram-diederik/iPixel-CLI-for-hass](https://github.com/Bram-diederik/iPixel-CLI-for-hass) | Python/MQTT | 2025 | MQTT bridge over the CLI's WebSocket server. |

Discussion threads worth tracking:
[#57 "The iPixel commands demystified"](https://github.com/lucagoc/pypixelcolor/discussions/57) ·
[#48 "[Chip identified] JieLi AC6951C"](https://github.com/lucagoc/pypixelcolor/discussions/48)

### Hardware facts now established

- **MCU:** JieLi AC6951C, 48-pin LQFP (a Bluetooth-audio SoC — which is why the firmware
  has rhythm/EQ and buzzer features). Community docs: [kagaimiq/jielie](https://github.com/kagaimiq/jielie).
- **Flash:** ZBIT ZB25VQ32 SPI ROM, holding **firmware *and* boot animation *and* user
  slots**. Cutting the SPI line yields `Flash ERR`. This is why bad slot writes brick the
  device into a bootloop.
- **BLE:** 1M PHY, negotiated MTU 512–517. `LED_BLE_xxxxxxxx` advertising name.
- **Device only advertises while unpaired.** If the phone app is connected, HA cannot
  discover or connect. Only one BLE central at a time. (Reported by
  [Ivan Morgillo, Apr 2026](https://www.ivanmorgillo.com/2026/04/27/hacking-a-15-led-matrix-with-an-ai-agent-python-and-a-webcam-feedback-loop/).)

---

## 2. Protocol facts now cross-validated

These are agreed by three or more independent implementations and can be treated as
settled.

### 2.1 Frame envelope for bulk data

```
[len_lo len_hi][type_lo type_hi][option][total_size:4 LE][crc32:4 LE][mode][slot][chunk…]
 └ 2 bytes ──┘ └── 2 bytes ──┘ └ 1 ─┘ └─── 4 ───────┘ └─── 4 ───┘ └ 1 ┘└ 1 ┘
```

- `len` = 15 + len(chunk) — the whole frame including the 2-byte prefix.
- `option` = `0x00` for the first 12 KB window, `0x02` for every continuation window.
- `total_size` / `crc32` describe the **whole** payload, repeated in every window.
- Windows are 12 KB; each window is written to the GATT characteristic in chunks and
  ACKed before the next window is sent.

| Content | `type` bytes | `mode` byte |
|---|---|---|
| PNG / static image | `02 00` | `0x00` |
| GIF / animation | `03 00` | `0x02` |
| Mixed (PNG+GIF+text zones) | `04 00` | `0x02` |
| **Text** | **`00 01`** | **`0x00`** |

Sources: `pypixelcolor/commands/send_image.py` + `commands/send_text/__init__.py`;
`DonKracho .../iPixelCommands.cpp::showText/showImage`;
`ToBiDi0410 .../iPixelCommands.cpp::sendPNG/sendGIF`;
`ipixel-ctrl/docs/DeviceCommands.md` §0x0002/0x0003/0x0004/0x0100.

### 2.2 Slot (`SCR_NO`) numbering — previously undocumented for us

From `ipixel-ctrl/docs/DeviceCommands.md`:

| Range | Meaning |
|---|---|
| `0x01`–`0x64` (1–100) | Persistent program slots (PRG) |
| `0x65` (101) | **DIY / temporary** — display now, do not persist |
| `0x6F`–`0x77` (111–119) | "Remocon" screens 1–9 |

And the two canonical send sequences:

- **Persist:** `set_prg_mode` → `send_png/gif/mix/text` to slot 1–100
- **Temporary:** `set_diy_mode` → `send_png/gif/mix/text` to slot `0x65`

`show_slot` (`[07 00 08 80 01 00 slot]`) is literally `set_prg_mode` with a one-entry
list — it is not a separate opcode.

### 2.3 ACK / return codes

The notify characteristic answers every command with a 5-byte frame
`[05 00 cmd_lo cmd_hi RET]`.

| Command class | RET meaning |
|---|---|
| Simple control commands (`0x0102`, `0x0104`, `0x0106`, `0x0107`, `0x8003`, `0x8004`, `0x8006`, `0x8008`, `0x0204`, `0x0205`) | `0x00` = NG, `0x01` = OK |
| **Bulk data** (`0x0002`, `0x0003`, `0x0004`, `0x0100`) | **`0x03` = OK / transfer complete**, anything else = NG |

`set_pixel` (`0x0105`), `set_rhythm_mode` and `set_rhythm_mode_2` send **no** ACK at all
(DonKracho explicitly sets `is_ready_ = true` for these without waiting).
`ipixel-ctrl` additionally notes `set_pixel` should be **sent three times** to take effect.

### 2.4 The `0x8001` response really is the device-info response

Real capture from a 32×32 board (DonKracho, `ipixel_ble.cpp`):

```
0C 00 01 80 81 39 2C 00 0C 01 00 01
 │  │  └──┴─ echo of cmd 0x8001
 │  └─ length 0x000C
 byte 4 = 0x81 → LED type byte 129 → 32×32
 byte 5 = 0x39 → minute echo (57)
 byte 6 = 0x2C → second echo (44)
 byte 7 = 0x00 → language (0 = non-China, 1 = China)
 byte 8 = 0x0C → hour echo (12)
 byte 9 = 0x01 → LED_SW — current power state
 byte 10 = 0x00 → PWD_SW — password-enabled flag
 byte 11 = 0x01 → unknown
```

Two consequences:

1. **Firmware versions do *not* come from this response.** `go-ipxl` parses bytes 5–7 as
   MCU/BLE version; those bytes are actually the minute/second/language echo. The real
   source is `0x8005` → `[MCU_major, MCU_minor, BLE_major, BLE_minor]`.
2. **`0x8001` powers the display on as a side effect** (`ipixel-ctrl`: *"It will
   automatically power on"*). Any time-sync therefore also switches the panel on.

### 2.5 Device-type byte → dimensions (the mapping is *not* linear)

`byte − 128` does **not** give the LED type. The real table
(`go-ipxl/consts.go`, `pypixelcolor/lib/device_info.py`, `DonKracho ipixel_ble.h` — all identical):

| Byte | Type | Size | | Byte | Type | Size |
|---|---|---|---|---|---|---|
| 128 | 0 | 64×64 | | 138 | 10 | 64×32 |
| 129 | 2 | 32×32 | | 139 | 11 | 96×32 |
| 130 | 4 | 32×16 | | 140 | 12 | 128×32 |
| 131 | 3 | 64×16 | | 141 | 13 | 96×32 |
| 132 | 1 | 96×16 | | 142 | 14 | 160×32 |
| 133 | 5 | 64×20 | | 143 | 15 | 192×32 |
| 134 | 6 | 128×32 | | 144 | 16 | 256×32 |
| 135 | 7 | 144×16 | | 145 | 17 | 320×32 |
| 136 | 8 | 192×16 | | 146 | 18 | 384×32 |
| 137 | 9 | 48×24 | | 147 | 19 | 448×32 |

Note 129→2 and 132→1 (swapped relative to a naive offset), and that there is **no**
128×64 or 192×64 type.

### 2.6 Native text payload (opcode `0x0100`)

14-byte properties header, then one record per glyph:

| Offset | Field | Notes |
|---|---|---|
| 0–1 | glyph/record count, LE | |
| 2 | horizontal alignment | app always sends `0x01` |
| 3 | vertical alignment | app always sends `0x01` |
| 4 | animation / effect | see §5.1 |
| 5 | speed | 0–100 |
| 6 | rainbow / style mode | 0–9 |
| 7–9 | foreground RGB | |
| 10 | background enable | app always sends `0x01` |
| 11–13 | background RGB | |

Glyph record — **two encodings exist and both are valid**, distinguished by the first
byte (this is the single most useful thing DonKracho's `Helpers::encodeText` clarifies):

| Lead byte | Layout | Glyph geometry |
|---|---|---|
| `0x00` | `00 R G B <bitmap>` | 8 × 16, 1 byte per row |
| `0x01` | `01 R G B <bitmap>` | 16 × 16, 2 bytes per row |
| `0x02` | `02 R G B <bitmap>` | 16 × 32, 2 bytes per row |
| `0x80` | `80 R G B W H <bitmap>` | **variable** W × H, explicit size bytes |

> DonKracho's source comment: the `0x80` variable-size form is **not supported by the
> 32×32 LED Pixel Board**. Fixed-size records are the safe default.

Bitmap bit order: each row is packed MSB-first, then **the bits of every byte are
reversed** (`pypixelcolor._logic_reverse_bits_order_bytes`; equivalently the legacy
`invertFrames → switchEndian → logicReverseBitsOrder` chain, which nets out to the same
per-byte bit reversal). Row stride follows the record type above, **not** `ceil(width/8)`.

Emoji are sent inline as **JPEG** blocks in the same record stream:

| Lead byte | Meaning |
|---|---|
| `0x08` | 16×16 emoji, then `size:2 LE`, `0x00`, JPEG bytes |
| `0x09` | 32×32 emoji, then `size:2 LE`, `0x00`, JPEG bytes |

`pypixelcolor` strips the JFIF APP0 segment (SOI + DQT + rest) because the official app
sends raw JPEG without JFIF metadata.

### 2.7 Program list / delete list share one shape

```
setProgramList : [len:2 LE][08 80][count:2 LE][slot…]   (up to 100 slots)
delProgramList : [len:2 LE][02 01][count:2 LE][slot…]   (up to 100 slots)
```

---

## 3. Where our implementation diverges

Ordered by likely user-visible impact. Every item cites the file and the disagreeing
upstream sources.

### 3.1 `display_native_text` sends text under the wrong data type — high

`api.py:1552` wraps the text payload with `_make_windows_from_payload(payload, slot, bytes([0x04, 0x00]))`,
i.e. command **`0x0004` (mixed data)**, and `device/commands.py:584` hardcodes the mode
byte to `0x02`. Text must go out as type **`00 01`** with mode byte **`0x00`**.

Agreed by: `pypixelcolor/commands/send_text`, `ipixel-ctrl §0x0100`, `DonKracho showText`,
`ToBiDi0410 sendText`, `SuperIlu send_text`.

### 3.2 `device/text_protocol.py` header and glyph records don't match any known encoding — high

- `build_text_header` writes `h_align`/`v_align` from `TextStyle`, whose defaults are
  `0`/`0`. Every working implementation sends `0x01`/`0x01`.
- Byte 6 is written as a `fg_enabled` flag (`0x01`). That byte is the **rainbow/style
  mode** (0–9) — sending `1` selects a style, it does not enable the foreground colour.
- Byte 10 is written as `bg_enabled`, which is `False` by default → `0x00`. The app
  sends `0x01`.
- `build_char_record` emits `0x80 R G B W H` with rows packed at `ceil(width/8)` bytes and
  **no bit reversal**. The `0x80` form needs 1-byte rows for W≤8 / 2-byte rows for W≤16
  *and* per-byte bit reversal — and it is reportedly unsupported on 32×32 panels anyway.

Net effect: `display_native_text` is almost certainly producing garbage on any panel.
It is a service (`services.yaml:1374`) so users can reach it.

### 3.3 `make_clock_mode_full_command` has two bytes swapped and one inverted — high

`device/commands.py:1020`:

```python
flag_a = 0x00 if show_date else 0x01     # byte 5
flag_b = 0x01 if format_24 else 0x00     # byte 6
```

Correct layout (`ipixel-ctrl §0x0106`, `pypixelcolor/set_clock_mode.py`,
`DonKracho showClock`, `ToBiDi0410 setClockMode` — four for four):

```
byte 5 = format_24 ? 1 : 0
byte 6 = show_date ? 1 : 0
```

So today `set_clock_mode_full` (a registered service) has `show_date` **inverted** and
swapped with `format_24`. The main `set_clock_mode` path is fine — it delegates to
pypixelcolor.

### 3.4 Wi-Fi client treats the success ACK as an error — high

`wifi/client.py:35-45`: `WifiAckInfo` maps `0x01` → `transfer-complete` and `0x03` →
`crc-or-transfer-error`, and `send_data_windowed` bails out on `0x03`. For bulk data
`0x03` is **success** (§2.3). Our own BLE path (pypixelcolor's `AckManager`) already
treats `3` as the final ACK, so the two transports contradict each other.

### 3.5 Wi-Fi client writes the wrong type bytes — high

`wifi/client.py:196` does `data_type.to_bytes(2, "little")` with callers passing the
logical constants `4 = text` and `7 = template`. On the wire those must be translated:

| Logical | Wire bytes |
|---|---|
| 0 camera | `00 00` |
| 1 video | `01 00` |
| 2 image | `02 00` |
| 3 gif | `03 00` |
| **4 text** | **`00 01`** |
| 5 diy image | `05 01` |
| **7 template** | **`04 00`** |

(`go-ipxl/packet_builder.go::getDataType`.) Today type 4 goes out as `04 00` (= mixed
data) and type 7 as `07 00` (not a command at all). The mode byte is also hardcoded to
`0x02` instead of varying per type.

### 3.6 `clear_display()` is documented as a soft clear but wipes the EEPROM — high

`api.py:609` and `device/commands.py:134` both describe `[04 00 03 80]` as "clears the
display content without affecting power state". Upstream calls it:

- pypixelcolor `clear()`: *"Clears the ROM data on the device… removes all stored
  content from the device's memory, **including device settings**."*
- SuperIlu/lucagoc CLI: *"Clear the EEPROM."*
- ipixel-ctrl: `set_default_mode` — reset to factory default.

This command is wired to the Lovelace card's **"Clear" quick action**. A user tapping it
loses every stored slot.

### 3.7 `device_config.LED_TYPE_DIMENSIONS` is wrong from type 6 upward — medium

`device/device_config.py:48` lists type 6 as 128×16 and invents 128×64 / 192×64 at types
16/17, shifting 13–20 out by one or two. Compare §2.5. Additionally
`get_dimensions_for_led_type()` converts the device byte with `byte − 256 + 128`, which
assumes a linear mapping — it produces type 1 for byte 129 (real answer: type 2) and
type 3 for byte 132 (real answer: type 1).

Blast radius is currently limited: device detection goes through pypixelcolor's correct
table, and this module is only consumed by `display_border_animation` (`api.py:1587`), so
border overlays pick the wrong asset size on the affected models.

### 3.8 Hourly time sync silently powers the display on — medium

`__init__.py:121-133` runs `api.sync_time()` every hour. `0x8001` auto-powers-on
(§2.4), so a display the user turned off will come back on within the hour, and
`switch.{device}_power` will disagree with reality.

The same response carries the true power state in byte 9 (`LED_SW`), which would let us
report power state instead of tracking it optimistically.

### 3.9 Effect numbering is unverified and exposes two known-bricking values — medium

`device/text_protocol.py:46-54` and `services.yaml:1394` publish
`0=Static 1=Scroll Left 2=Scroll Right 3=Scroll Up 4=Scroll Down 5=Flash 6=Snow 7=Laser`.

- **Animations 3 and 4 cause bootloops.** `pypixelcolor` raises on 3/4 for non-32×32
  devices, the legacy CLI raises unconditionally, and `freijn`'s ESPHome build silently
  remaps 3/4 → 0. We expose them as ordinary choices with no warning.
- The upper labels are disputed. `ipixel-ctrl §0x0100` lists
  `0=Fixed 1=RTL 2=LTR 5=Blink 6=Breeze 7=Snow 8=Laser`; DonKracho validates only 0–6.
  Our 5/6/7 labels are shifted by one relative to `ipixel-ctrl`.

### 3.10 `make_text_speed_command` opcode is unverified — medium (risk of data loss)

We emit `[05 00 03 01 speed]` (opcode `0x0103`). DonKracho emits `[05 00 03 80 speed]`
and annotates it *"ATTENTION: malformed command"*; ToBiDi emits a 4-byte
`[05 00 03 speed]`. Note `0x8003` **is the EEPROM-clearing command** — if the device
ignores the trailing byte, DonKracho's variant would wipe the panel. Nobody has a
confirmed capture. Ours is the most plausible but should be treated as unproven.

### 3.11 Smaller items — *OPEN*

- `make_program_mode_command` caps at 9 buffers; the wire format and DonKracho both
  allow **100**.
- `make_erase_data_command(erase_all=True)` sends `count = 0x00FF` but only 254 slot
  bytes, and no upstream source documents an "erase all" form. Speculative and
  destructive — worth gating or removing.
- `make_reserve_slot_command` / `make_template_handshake_command` produce bytes identical
  to `show_slot`; their docstrings describe a "slot reservation handshake" that is really
  just `set_prg_mode` with one entry.
- `get_hw_info()` sends `0x8005` but registers no response handler, so the MCU/BLE
  firmware versions are discarded. `device_info_to_dict` consequently always reports
  `mcu_version`/`wifi_version` as `"unknown"` (pypixelcolor never fills them).
- `iPIXEL-Protocol-Documentation.md` §3.3 documents `set_pixel` data as `[R,G,B,A,X,Y]`.
  It is `[0x00,R,G,B,X,Y]` — a fixed zero, not alpha. Our code is correct; the doc is not.
- `assets/emoji/` ships 525 JPEGs (2.2 MB) extracted from the app, in exactly the sizes
  the emoji record format wants (16/20/24/32/64) — and **nothing references them**.
  pypixelcolor downloads Twemoji from a CDN at runtime instead; we could feed our bundled
  set in and drop the network dependency.

---

## 4. Capabilities upstream has that we don't

- **Variable-width proportional text** (`README.md` lists this as "Planned").
  pypixelcolor 0.4.0 already ships it: per-font JSON metrics
  (`font_size`/`offset`/`pixel_threshold`/`var_width`), text rendered as one continuous
  image and sliced into 8 px (h ≤ 20) or 16 px (h > 20) chunks. See
  `pypixelcolor/lib/font_config.py` + `commands/send_text/image_processing.py`.
- **Emoji in text**, via the JPEG record types above.
- **RTL rendering** — animation 2 requires the chunk order to be reversed.
- **`rainbow_mode` 0–9.** DonKracho notes the foreground/background colours *"apply when
  rainbow mode is set to one only"* — untested but would explain colour behaving
  inconsistently.
- **`fit` vs `crop` resize** for images/GIFs, with per-frame GIF duration and disposal
  preserved on re-encode (`pypixelcolor/commands/send_image.py`). Our
  `image_to_rgb_bytes` uses NEAREST with no aspect handling.
- **HEIC/HEIF** input via `pillow-heif`.
- **Larger GATT writes.** pypixelcolor chunks at 244 bytes with write-with-response;
  DonKracho writes up to 500 bytes per write against the negotiated 512–517 MTU. We
  negotiate 512 in `bluetooth/client.py:167` and then inherit the 244-byte chunking —
  roughly 2× headroom left on the table for image/GIF uploads.
- **30 s BLE keep-alive** (`freijn/.../interval_keepalive.yaml`) — worth evaluating
  against our observed disconnect behaviour.

---

## 5. Open questions / genuine conflicts between sources

1. **Clock style range.** pypixelcolor says 0–8, `ipixel-ctrl` says 1–8, DonKracho
   validates 1–9. Our `select.{device}_clock_style` offers 0–8.
2. **Text properties bytes 2/3.** DonKracho labels them horizontal/vertical alignment and
   hardcodes `0x01,0x01`; pypixelcolor calls them "reserved" and also sends `0x01,0x01`.
   Nobody has tested other values. If they really are alignment, that's a free feature.
3. **Byte 10 of the text header.** `ipixel-ctrl` calls it *"0x01 fixed, text direction?"*,
   DonKracho hardcodes `0x01`, pypixelcolor uses it as a background-enable flag and sends
   `0x00` when no background is requested. Only pypixelcolor's reading has been exercised.
4. **`0x8002 get_last_space`** — documented by `ipixel-ctrl` as returning nothing.
   If it reports free EEPROM, it would make slot management far safer.
5. **Mixed-data block header** (`0x0004`) is still officially "unknown". `ipixel-ctrl`
   only publishes captured examples. Our `make_mix_block_header` is an inference and
   should stay labelled as such.
6. **`set_pixel` "send 3 times"** — is this a firmware quirk, packet loss mitigation, or
   an artefact of one capture? We send once.

---

## 6. Safety notes worth surfacing to users

- Writing malformed data to a **slot** can bootloop the device. Recovery requires sending
  `clear` inside the very short window before the firmware reads the EEPROM. Every
  upstream project carries this warning; our README does not.
  Corollary from pypixelcolor's docs: *verify a payload works without a slot before
  writing it to one.*
- Text animations **3 and 4** are the known trigger on non-32×32 panels.
- `clear` / "Clear" quick action is destructive (§3.6).
- The panel accepts one BLE central at a time and stops advertising while the phone app
  is connected — the most likely cause of "device not found" reports.

---

## 7. What has been fixed

| § | Change |
|---|---|
| 3.1 | `display_native_text` now sends data type `00 01` with mode byte `0x00`. `_make_windows_from_payload` takes the mode byte as a parameter instead of hardcoding `0x02`, and `DATA_TYPE_BYTES` / `DATA_MODE_BYTES` in `device/commands.py` map logical `TYPE_*` constants to their on-wire form. |
| 3.2 | `device/text_protocol.py` rewritten to §2.6: 14-byte properties header with `0x01/0x01` alignment, rainbow mode at byte 6, background flag at byte 10; glyph records use the fixed-size `0x00`/`0x01`/`0x02` forms with the correct row stride and per-byte bit reversal. |
| 3.3 | `make_clock_mode_full_command` byte 5 is now `format_24` and byte 6 is `show_date`, both `1 = on`. |
| 3.4 | `WifiAckInfo` treats `0x03` as success for bulk-data opcodes and exposes `is_error`, which `send_data_windowed` uses. |
| 3.5 | `send_data_windowed` translates the logical type to on-wire bytes and derives the mode byte per type. |
| 3.6 | `clear_display()` now sends the non-destructive DIY blank (`[05 00 04 01 01]`). The destructive `0x8003` moved to `erase_all_data()`, which `set_default_mode()` delegates to. `clear_pixels` and the screen switch are non-destructive; the screen switch restores via `restore_display()`. Service descriptions updated. |
| 3.7 | `LED_TYPE_DIMENSIONS` corrected and `DEVICE_TYPE_TO_LED_TYPE` replaces the linear byte→type arithmetic. |
| 3.8 | `set_power()` records the state; `sync_time(preserve_power=True)` re-applies it, so the hourly sync no longer resurrects a powered-off panel. |
| 3.9 | Animations 3 and 4 are rejected by `validate_animation()` on both text paths and removed from the `display_text` / `display_native_text` service pickers. Effect labels now follow the ipixel-ctrl spec. |
| Safety | README gained a Safety Notes section and a "device not found" troubleshooting entry covering the single-BLE-connection behaviour. |

Verified by encoding each affected command and comparing against the byte sequences in
§2 (clock flags, type/mode bytes, text frame envelope, blank vs erase, device-type
lookup, properties header, glyph record lengths, animation guard) plus a visual
round-trip of a rendered glyph through the bit reversal.

### Still to do

1. §3.10 — confirm the `set_text_speed` opcode with a capture before trusting it.
2. §3.11 — program-mode slot cap, speculative `erase_all`, `0x8005` response parsing so
   firmware versions stop reading `"unknown"`.
3. Parse `LED_SW` from the `0x8001` response for true power state rather than tracking it
   optimistically.
4. Opportunistic: wire up the bundled emoji assets, raise the BLE chunk size toward the
   negotiated MTU, adopt `fit`/`crop` resize semantics.

---

## 8. Web preview / Lovelace card review

Reviewed the GitHub Pages preview (`www/preview.html`, deployed by
`.github/workflows/deploy-preview.yml`) and the seven Lovelace cards behind it,
driving the page in headless Chromium to confirm each finding.

### Fixed

| Finding | Detail |
|---|---|
| Gallery card dead on Pages | `/gallery/manifest.json` returned 404 on the live site — the workflow copied `preview.html`, `src/`, `fonts/` and a nonexistent `lib/`, but never `assets/gallery`. Console showed `iPIXEL Gallery: Failed to load manifest`. Workflow now copies it and asserts every required asset exists before deploying. Gallery now loads 18 items. |
| Default font never rendered | `CUSONG.ttf` declares OS/2 **version 5** but ships a 96-byte (v4-sized) table, so Chromium's OTS rejected it: `OS/2: Failed to read version 5-specific fields`. CUSONG is the default font for `send_text`, so this broke the preview *and* Home Assistant. Fixed by declaring v4 and refreshing the table + `head` checksums. Same fix applied to `assets/fonts/cusong16_zitidi.ttf`. `VCR_OSD_MONO.ttf` declares v3 at 96 bytes, which is valid — left alone. |
| Text card's Send button was broken in HA | The card populates its Effect dropdown from the renderer's effect registry, so it sent `effect: "fixed"`, while `handle_display_text` did `int(effect)` → `ValueError`, swallowed as "Error displaying text". `resolve_animation()` now accepts renderer names, numeric codes and numeric strings; renderer-only effects (`plasma`, `neon`, …) fall back to static instead of raising. |
| Controls card offered the bricking animations | Its Animation dropdown listed "Scroll Up" (3) and "Scroll Down" (4). Now offers 0/1/2/5/6/7/8 with the ipixel-ctrl labels. |
| Controls card called a nonexistent service | `set_animation_mode` is not registered anywhere in the integration, so the dropdown was a no-op in HA. It now re-sends the current text with the chosen animation code, which is how the device actually applies it. |
| 400 KB of stale build output | `www/cards/*.js` (6 pre-refactor per-card bundles), `www/ipixel-base.js` and a 358 KB `ipixel-display-card.js.map` were committed and referenced by nothing; the production build emits no source map. Removed and `*.js.map` gitignored. |
| Connection panels buried the cards | Both "Real Device Connection" panels sat expanded inside `<div class="header">`, pushing all seven cards below roughly 600 px of controls. They are now `<details>`, collapsed by default. |
| Console noise | Added an inline favicon; the page now loads with zero console errors. |

Verified by serving the exact `_site` layout locally and asserting in Chromium:
all seven cards upgrade and render, the gallery manifest loads, both panels are
collapsed and expand on click, the animation dropdown excludes 3/4, sending text
calls `display_text`, changing the animation re-sends with a numeric code, the
display card keeps rendering, and no console errors or non-200 requests remain.

### Consolidation and unattested opcodes — also fixed

| Finding | Detail |
|---|---|
| Preview duplicated its whole transport layer | `preview.html` carried two near-identical connection panels and 44 `window.*` globals in paired `bleX`/`wifiX` form. The two modules already implemented almost the same API, so the divergence was UI-only: Bluetooth exposed rainbow/rhythm/orientation/debug, Wi-Fi exposed countdown/scoreboard/stopwatch/exit-mode, and neither offered the other's controls. Added `src/device-transport.js` (161 lines) as a façade with a capability map, and collapsed both panels into one with a transport selector. `preview.html` drops 1777 → 1326 lines and 44 → 32 globals; every control is now available on both transports, and transport-specific rows show or hide from the capability map rather than from duplicated markup. |
| Five unattested opcodes | `0x010A` `setRainbowMode`, `0x010B` `setAnimationMode`, `0x010C` `setFontSize`, `0x010D` `setFontOffset` and `0x0103` `sendMulticolorText` appear in no upstream source — and `0x800A`/`0x800D` are the documented scoreboard and countdown, so the `0x01xx` forms look invented. `0x0103` also collides with `set_text_speed`. All five removed from both transports; none of the removed calls had a working backend. The real mechanisms are per-glyph colour inside the text payload, the glyph record type for size, and the properties header for animation and rainbow. |
| Wi-Fi rhythm command was wrong | `wifi-device.js` sent `[0x11, 0x00, 0x08, 0x01, style, …]` — wrong opcode *and* wrong length. Corrected to `[0x10, 0x00, 0x01, 0x02, style, …]`, matching the BLE path, go-ipxl, pypixelcolor and DonKracho. |
| Nine card controls called services that do not exist | Cross-referencing every `callService('ipixel_color', …)` against the registered services found `delete_screen`, `program_mode`, `set_rhythm_level`, `set_orientation`, `set_font_size`, `set_font_offset`, `display_multicolor_text`, `save_to_slot` and `render_gfx` all unregistered — dead controls in Home Assistant. Four had real backends under other names and were repointed (`delete_slot`, `set_program_mode`, `set_rhythm_mode_advanced`, and the orientation *select entity*). The rest have no backend; `callService` in the card base now checks the service registry and logs a clear warning instead of failing silently. |
| Invented rainbow labels | The rainbow dropdown named modes "Wave, Cycle, Pulse, Fade, Chase, Sparkle, Gradient, Theater, Fire". No source names these, and the field is part of the text payload rather than a standalone command, so the control was removed along with the opcode. |
| Range mismatches | Clock styles were 1–8 in the preview but 0–8 in `select.clock_style`; now 0–8 in both. Orientation offered only "Normal / Upside Down" while the field is a 0–3 rotation, and `setOrientation` clamped to 0–2; both now offer 0°/90°/180°/270°. |

Verified in Chromium: one panel replaces two, the selector switches the façade,
transport-specific rows follow the capability map, an unavailable transport
disables Connect and explains why, all five removed opcodes are absent from both
modules, no stale `bleX`/`wifiX` globals remain, clock and orientation ranges are
correct, and the page loads with no console errors — plus the earlier suite
(cards render, gallery loads, animations 3/4 absent, text send and animation
change both reach `display_text`) still passes.

### Still open

- **Clock style 9.** DonKracho validates 1–9; pypixelcolor and this integration
  stop at 8. Untested whether style 9 exists on some panels.
- **Which of animation 1/2 is left vs right** (§5, item 2) — sources contradict
  each other, so the labels are a coin flip until someone checks on hardware.
- **`display_multicolor_text`, `save_to_slot`, `render_gfx`** have card UI but no
  backend. Per-glyph colour is genuinely supported by the text payload, so
  multicolor text could be implemented properly; the other two are preview-only
  features that would need new services.

## Sources

- https://github.com/lucagoc/pypixelcolor
- https://github.com/DonKracho/ESPHome-component-iPixel-ble
- https://github.com/sdolphin-JP/ipixel-ctrl
- https://github.com/yyewolf/go-ipxl
- https://github.com/ToBiDi0410/iPixel-ESP32
- https://github.com/SuperIlu/iPixel-CLI
- https://github.com/Cino2424/iPixel-CLI-ESP32
- https://github.com/lucagoc/iPixel-ESPHome
- https://github.com/lucagoc/iPixel-CFW
- https://github.com/freijn/iPixelLedBoard-MQTT-Homeassistant
- https://github.com/Bram-diederik/iPixel-CLI-for-hass
- https://github.com/lucagoc/pypixelcolor/discussions/57
- https://github.com/lucagoc/pypixelcolor/discussions/48
- https://yewolf.fr/blog/reverse-engineering-a-cheap-led-matrix/
- https://www.ivanmorgillo.com/2026/04/27/hacking-a-15-led-matrix-with-an-ai-agent-python-and-a-webcam-feedback-loop/
