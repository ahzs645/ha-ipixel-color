"""Runtime object shared by all entities and services of one config entry.

The runtime owns the :class:`Display` (a single panel or a combined
display), the user settings that describe what should be shown, and the
logic that turns those settings into commands. Entities only read and write
settings; the runtime takes care of rendering, debouncing, template
tracking and error reporting.
"""
from __future__ import annotations

import asyncio
import io
import logging
from dataclasses import dataclass, field, fields
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.event import (
    TrackTemplate,
    TrackTemplateResult,
    async_track_template_result,
    async_track_time_interval,
)
from homeassistant.helpers.template import Template, is_template_string
from PIL import Image

from .common import process_escapes, resolve_template_variables
from .const import (
    DEFAULT_CLOCK_STYLE,
    DEFAULT_EFFECT,
    DEFAULT_FONT,
    DEFAULT_MODE,
    DEFAULT_NATIVE_FONT,
    DEFAULT_ORIENTATION,
    DEFAULT_RHYTHM_STYLE,
    DOMAIN,
    MANUFACTURER,
    MODE_CLOCK,
    MODE_GIF,
    MODE_RHYTHM,
    MODE_TEXT,
    MODE_TEXT_IMAGE,
    ORIENTATION_MAP,
    TIME_SYNC_INTERVAL_HOURS,
    UPDATE_DEBOUNCE_SECONDS,
)
from .display.base import Display
from .display.composite import CompositeDisplay
from .display.effects import apply_effect
from .display.panel import PanelDisplay
from .display.text_renderer import render_text_image
from .exceptions import iPIXELCommandError, iPIXELError, iPIXELNotAvailableError
from .fonts import get_font_path

if TYPE_CHECKING:
    from .display.animation_controller import AnimationController
    from .schedule import iPIXELScheduleManager

_LOGGER = logging.getLogger(__name__)


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    """Convert an RGB tuple to ``rrggbb``."""
    return f"{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


@dataclass
class ColorSetting:
    """A colour picked through a light entity."""

    rgb: tuple[int, int, int] = (255, 255, 255)
    brightness: int = 255
    is_on: bool = True

    def as_hex(self, *, off_value: str | None = "000000") -> str | None:
        """Return the effective colour as hex (brightness applied)."""
        if not self.is_on:
            return off_value
        factor = max(0, min(255, self.brightness)) / 255.0
        return rgb_to_hex(tuple(int(c * factor) for c in self.rgb))  # type: ignore[arg-type]


@dataclass
class DisplaySettings:
    """Everything the user configured through entities."""

    mode: str = DEFAULT_MODE
    text: str = ""
    gif_url: str = ""
    font: str = DEFAULT_FONT
    font_size: float = 0.0
    line_spacing: int = 0
    antialias: bool = True
    text_color: ColorSetting = field(default_factory=lambda: ColorSetting((255, 255, 255)))
    background_color: ColorSetting = field(default_factory=lambda: ColorSetting((0, 0, 0)))
    text_animation: int = 0
    text_speed: int = 80
    text_rainbow: int = 0
    clock_style: str = DEFAULT_CLOCK_STYLE
    clock_24h: bool = True
    clock_show_date: bool = True
    rhythm_style: str = DEFAULT_RHYTHM_STYLE
    rhythm_speed: int = 4
    effect: str = DEFAULT_EFFECT
    orientation: str = DEFAULT_ORIENTATION
    brightness: int = 50
    auto_update: bool = False
    power: bool = True
    fun_mode: bool = False
    screen_visible: bool = True
    schedule_interval_ms: int = 5000

    def as_dict(self) -> dict[str, Any]:
        """Return a plain dict (for diagnostics)."""
        result: dict[str, Any] = {}
        for item in fields(self):
            value = getattr(self, item.name)
            if isinstance(value, ColorSetting):
                value = {"rgb": list(value.rgb), "brightness": value.brightness, "is_on": value.is_on}
            result[item.name] = value
        return result


# Which settings influence the output of which mode. Changing a setting
# that is not relevant for the current mode never triggers a re-render.
SETTING_MODES: dict[str, tuple[str, ...]] = {
    "text": (MODE_TEXT_IMAGE, MODE_TEXT),
    "gif_url": (MODE_GIF,),
    "font": (MODE_TEXT_IMAGE, MODE_TEXT),
    "font_size": (MODE_TEXT_IMAGE, MODE_TEXT),
    "line_spacing": (MODE_TEXT_IMAGE,),
    "antialias": (MODE_TEXT_IMAGE,),
    "text_color": (MODE_TEXT_IMAGE, MODE_TEXT),
    "background_color": (MODE_TEXT_IMAGE, MODE_TEXT),
    "text_animation": (MODE_TEXT,),
    "text_speed": (MODE_TEXT,),
    "text_rainbow": (MODE_TEXT,),
    "clock_style": (MODE_CLOCK,),
    "clock_24h": (MODE_CLOCK,),
    "clock_show_date": (MODE_CLOCK,),
    "rhythm_style": (MODE_RHYTHM,),
    "rhythm_speed": (MODE_RHYTHM,),
    "effect": (MODE_TEXT_IMAGE, MODE_GIF),
}


class iPIXELRuntime:
    """State and behaviour for one config entry (panel or combined display)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, display: Display) -> None:
        """Initialise the runtime."""
        self.hass = hass
        self.entry = entry
        self.display = display
        self.settings = DisplaySettings()
        self.schedule_manager: iPIXELScheduleManager | None = None
        self.animation_controller: AnimationController | None = None

        self._last_frame: Image.Image | None = None
        self._last_frame_png: bytes | None = None
        self._listeners: list[CALLBACK_TYPE] = []
        self._update_lock = asyncio.Lock()
        self._template_unsub: CALLBACK_TYPE | None = None
        self._tracked_template: str | None = None
        self._unsubs: list[CALLBACK_TYPE] = []
        self._last_error: str | None = None
        # Arguments of the last successful render, replayed after a reconnect.
        self._last_render: tuple[str | None, str | None, dict[str, Any] | None] | None = None
        self._debouncer = Debouncer(
            hass,
            _LOGGER,
            cooldown=UPDATE_DEBOUNCE_SECONDS,
            immediate=False,
            function=self._async_debounced_update,
        )

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------
    @property
    def is_group(self) -> bool:
        """Return True for a combined display."""
        return isinstance(self.display, CompositeDisplay)

    @property
    def unique_prefix(self) -> str:
        """Prefix for entity unique ids (address for panels, keeps old ids stable)."""
        if isinstance(self.display, PanelDisplay):
            return self.display.api.address
        return f"group_{self.entry.entry_id}"

    @property
    def name(self) -> str:
        """Return the display name."""
        return self.display.name

    @property
    def available(self) -> bool:
        """Return True when the display can be driven."""
        return self.display.available

    @property
    def last_error(self) -> str | None:
        """Return the last update error message (for diagnostics/attributes)."""
        return self._last_error

    @property
    def device_info(self) -> DeviceInfo:
        """Return the device registry info for this display."""
        if isinstance(self.display, PanelDisplay):
            api = self.display.api
            info = api.device_info
            model = f"LED Matrix {info.width}x{info.height}" if info else "LED Matrix Display"
            return DeviceInfo(
                identifiers={(DOMAIN, api.address)},
                name=self.display.name,
                manufacturer=MANUFACTURER,
                model=model,
                sw_version=(info.mcu_version if info and info.mcu_version != "unknown" else None),
            )
        panels = len(self.display.members) if isinstance(self.display, CompositeDisplay) else 0
        return DeviceInfo(
            identifiers={(DOMAIN, self.unique_prefix)},
            name=self.display.name,
            manufacturer=MANUFACTURER,
            model=f"Combined display ({panels} panels)",
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    async def async_setup(self) -> None:
        """Finish initialisation (schedule store, timers)."""
        from .schedule import iPIXELScheduleManager

        self.schedule_manager = iPIXELScheduleManager(self.hass, self)
        await self.schedule_manager.async_load()

        self._unsubs.append(self.display.add_listener(self._notify_listeners))

        if isinstance(self.display, PanelDisplay):
            self._unsubs.append(self.display.api.add_reconnect_listener(self._on_reconnected))
            self._unsubs.append(
                async_track_time_interval(
                    self.hass, self._async_hourly_time_sync, timedelta(hours=TIME_SYNC_INTERVAL_HOURS)
                )
            )

    # ------------------------------------------------------------------
    # Restoring content after (re)connects
    # ------------------------------------------------------------------
    @callback
    def async_schedule_startup_restore(self) -> None:
        """Render the restored settings at start-up when auto update is on."""
        if self.settings.auto_update and self.display.is_connected:
            self.hass.async_create_task(self.async_restore_content())

    @callback
    def _on_reconnected(self) -> None:
        self.hass.async_create_task(self._async_after_reconnect())

    async def _async_after_reconnect(self) -> None:
        """A panel came back: restore the HA content it (or its combined display) showed."""
        restored = await self.async_restore_content()
        for group in self._groups_containing_me():
            restored = await group.async_restore_content() or restored
        if restored:
            _LOGGER.info("%s reconnected; its content was restored", self.name)
        else:
            _LOGGER.debug("%s reconnected; it showed no Home Assistant content", self.name)

    async def async_restore_content(self) -> bool:
        """Show again what this display was showing before a link dropped.

        The display is cleared first so nothing stale remains. With auto update
        on, the current settings are rendered (templates are re-evaluated);
        otherwise the last successful render is repeated. A display that never
        showed Home Assistant content is left alone. Returns True when restored.
        """
        if self.settings.auto_update:
            args: tuple = (None, None, None)
        elif self._last_render is not None:
            args = self._last_render
        else:
            return False
        text, mode, overrides = args
        try:
            await self.display.async_clear()
            if not self.settings.power:
                await self.display.async_set_power(False)
            await self.async_update_display(text, mode=mode, overrides=overrides)
        except iPIXELError as err:
            _LOGGER.warning("Could not restore the content of %s: %s", self.name, err)
            return False
        return True

    def _groups_containing_me(self) -> list[iPIXELRuntime]:
        runtimes = self.hass.data.get(DOMAIN, {}).values()
        return [
            runtime
            for runtime in runtimes
            if isinstance(runtime, iPIXELRuntime)
            and isinstance(runtime.display, CompositeDisplay)
            and any(member.key == self.entry.entry_id for member in runtime.display.members)
        ]

    async def async_shutdown(self) -> None:
        """Stop everything and disconnect."""
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        self._stop_template_tracking()
        self._debouncer.async_cancel()
        if self.animation_controller is not None:
            await self.animation_controller.stop()
            self.animation_controller = None
        if self.schedule_manager is not None:
            await self.schedule_manager.async_shutdown()
        if isinstance(self.display, CompositeDisplay):
            self.display.shutdown()
        else:
            try:
                await self.display.async_disconnect()
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Error disconnecting %s: %s", self.name, err)

    async def _async_hourly_time_sync(self, _now: Any = None) -> None:
        if not self.display.is_connected:
            return
        try:
            await self.display.async_sync_time()
        except iPIXELError as err:
            _LOGGER.debug("Hourly time sync for %s failed: %s", self.name, err)

    # ------------------------------------------------------------------
    # Listeners (entities refresh their state through these)
    # ------------------------------------------------------------------
    @callback
    def async_add_listener(self, listener: CALLBACK_TYPE) -> CALLBACK_TYPE:
        """Register a listener called whenever runtime state changes."""
        self._listeners.append(listener)

        @callback
        def _remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return _remove

    @callback
    def _notify_listeners(self) -> None:
        for listener in list(self._listeners):
            listener()

    # ------------------------------------------------------------------
    # Preview
    # ------------------------------------------------------------------
    @property
    def last_frame(self) -> Image.Image | None:
        """Return the last rendered canvas."""
        return self._last_frame

    @property
    def last_frame_png(self) -> bytes | None:
        """Return the last rendered canvas as PNG."""
        return self._last_frame_png

    def set_last_frame(self, image: Image.Image | None) -> None:
        """Store the last rendered canvas for the camera preview."""
        self._last_frame = image
        if image is None:
            self._last_frame_png = None
        else:
            buffer = io.BytesIO()
            image.convert("RGB").save(buffer, format="PNG")
            self._last_frame_png = buffer.getvalue()
        self._notify_listeners()

    # ------------------------------------------------------------------
    # Settings changes
    # ------------------------------------------------------------------
    @callback
    def async_setting_changed(self, key: str, *, force: bool = False) -> None:
        """Notify the runtime that ``settings.<key>`` changed.

        Schedules a debounced display update when auto update is enabled and
        the setting is relevant for the current mode.
        """
        self._notify_listeners()
        if key in ("text", "mode", "auto_update"):
            self._refresh_template_tracking()
        if not force and not self.settings.auto_update:
            return
        relevant = SETTING_MODES.get(key)
        if key == "mode" or force or relevant is None or self.settings.mode in relevant:
            self.async_request_update()

    @callback
    def async_settings_restored(self) -> None:
        """Called after an entity restored a setting at startup (no device update)."""
        self._refresh_template_tracking()
        self._notify_listeners()

    @callback
    def async_request_update(self) -> None:
        """Schedule a (debounced) display update; errors are logged."""
        self.hass.async_create_task(self._debouncer.async_call())

    async def _async_debounced_update(self) -> None:
        try:
            await self.async_update_display()
        except iPIXELError as err:
            _LOGGER.error("Display update for %s failed: %s", self.name, err)
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Unexpected error while updating %s", self.name)

    # ------------------------------------------------------------------
    # Template tracking
    # ------------------------------------------------------------------
    def _refresh_template_tracking(self) -> None:
        settings = self.settings
        wanted = (
            settings.auto_update
            and settings.mode in (MODE_TEXT_IMAGE, MODE_TEXT)
            and bool(settings.text)
            and is_template_string(settings.text)
        )
        if not wanted:
            self._stop_template_tracking()
            return
        if self._tracked_template == settings.text and self._template_unsub is not None:
            return
        self._stop_template_tracking()
        try:
            template = Template(settings.text, self.hass)
            self._template_unsub = async_track_template_result(
                self.hass,
                [TrackTemplate(template, None)],
                self._on_template_result,
            ).async_remove
            self._tracked_template = settings.text
            _LOGGER.debug("Tracking template changes for %s", self.name)
        except Exception as err:  # noqa: BLE001 - invalid template
            _LOGGER.warning("Cannot track template '%s': %s", settings.text, err)

    def _stop_template_tracking(self) -> None:
        if self._template_unsub is not None:
            self._template_unsub()
            self._template_unsub = None
        self._tracked_template = None

    @callback
    def _on_template_result(self, _event: Any, updates: list[TrackTemplateResult]) -> None:
        for update in updates:
            if isinstance(update.result, Exception):
                _LOGGER.debug("Template error for %s: %s", self.name, update.result)
                return
        _LOGGER.debug("Template result changed for %s, refreshing display", self.name)
        self.async_request_update()

    # ------------------------------------------------------------------
    # Rendering / updating
    # ------------------------------------------------------------------
    async def async_update_display(
        self,
        text: str | None = None,
        *,
        mode: str | None = None,
        overrides: dict[str, Any] | None = None,
    ) -> None:
        """Render the current settings (optionally overridden) to the display.

        Raises :class:`iPIXELError` when the update fails.
        """
        settings = self.settings
        mode = mode or settings.mode
        overrides = overrides or {}

        async with self._update_lock:
            try:
                if mode == MODE_TEXT_IMAGE:
                    await self._async_update_textimage(text, overrides)
                elif mode == MODE_TEXT:
                    await self._async_update_native_text(text, overrides)
                elif mode == MODE_CLOCK:
                    await self._async_update_clock(overrides)
                elif mode == MODE_GIF:
                    await self._async_update_gif(overrides)
                elif mode == MODE_RHYTHM:
                    await self._async_update_rhythm(overrides)
                else:
                    raise iPIXELCommandError(f"Unknown display mode: {mode}")
            except iPIXELError as err:
                self._last_error = str(err)
                self._notify_listeners()
                raise
            self._last_error = None
            self._last_render = (text, mode, overrides)
            self._notify_listeners()

    async def _resolve_text(self, text: str | None) -> str:
        if text is None:
            text = self.settings.text
        if not text:
            raise iPIXELCommandError("No text to display")
        rendered = await resolve_template_variables(self.hass, text)
        return process_escapes(rendered)

    def _require_canvas(self) -> tuple[int, int]:
        width, height = self.display.width, self.display.height
        if not width or not height:
            raise iPIXELNotAvailableError(
                f"Display '{self.name}' is not available (no panel size known yet)"
            )
        return width, height

    def _apply_effect(self, image: Image.Image, effect: str | None) -> Image.Image:
        effect = effect if effect is not None else self.settings.effect
        if effect and effect != DEFAULT_EFFECT:
            try:
                return apply_effect(image, effect).convert("RGB")
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Could not apply effect %s: %s", effect, err)
        return image

    async def _async_update_textimage(self, text: str | None, overrides: dict[str, Any]) -> None:
        settings = self.settings
        processed = await self._resolve_text(text)
        width, height = self._require_canvas()

        text_color = overrides.get("text_color") or settings.text_color.as_hex(off_value="000000")
        bg_color = overrides.get("bg_color") or settings.background_color.as_hex(off_value="000000")
        font = overrides.get("font", settings.font)
        font_size = overrides.get("font_size", settings.font_size)
        antialias = overrides.get("antialias", settings.antialias)
        line_spacing = overrides.get("line_spacing", settings.line_spacing)

        image = await self.hass.async_add_executor_job(
            render_text_image,
            processed,
            width,
            height,
            antialias,
            font_size or None,
            font,
            line_spacing,
            text_color,
            bg_color,
        )
        image = self._apply_effect(image, overrides.get("effect"))
        await self.display.async_show_image(image)
        self.set_last_frame(image)
        _LOGGER.info("%s: rendered text image '%s' (%dx%d)", self.name, processed, width, height)

    async def _async_update_native_text(self, text: str | None, overrides: dict[str, Any]) -> None:
        settings = self.settings
        processed = await self._resolve_text(text)

        color = overrides.get("text_color") or settings.text_color.as_hex(off_value="000000")
        bg_color = overrides.get("bg_color", settings.background_color.as_hex(off_value=None))
        if color == "000000":
            # The panel treats pure black as "no colour"; use the darkest visible tint
            # of the channel that is least noticeable against the background.
            bg = bg_color or "000000"
            r, g, b = int(bg[0:2], 16) * 333, int(bg[2:4], 16) * 169, int(bg[4:6], 16) * 909
            color = "000100" if g >= r and g >= b else ("000001" if b >= r else "010000")

        font = overrides.get("font", settings.font)
        font_size = overrides.get("font_size", settings.font_size)
        # Resolving a font file walks the font directories; keep that off the event loop.
        native_font = await self.hass.async_add_executor_job(self._native_font, font)

        kwargs = {
            "color": color,
            "bg_color": bg_color,
            "font": native_font,
            "animation": int(overrides.get("animation", settings.text_animation)),
            "speed": int(overrides.get("speed", settings.text_speed)),
            "rainbow_mode": int(overrides.get("rainbow_mode", settings.text_rainbow)),
            "char_height": int(font_size) if font_size else None,
        }
        await self.display.async_show_native_text(processed, **kwargs)
        self.set_last_frame(None)
        _LOGGER.info("%s: sent native text '%s'", self.name, processed)

    @staticmethod
    def _native_font(font: str | None) -> str:
        """Map a font selection to something pypixelcolor understands."""
        if not font or font.upper() in ("UNIFONT", "DEFAULT"):
            return DEFAULT_NATIVE_FONT
        if font.lower().endswith((".ttf", ".otf")):
            path = get_font_path(font)
            return str(path) if path else DEFAULT_NATIVE_FONT
        return font

    async def _async_update_clock(self, overrides: dict[str, Any]) -> None:
        settings = self.settings
        style = int(overrides.get("clock_style", settings.clock_style))
        await self.display.async_set_clock_mode(
            style=style,
            date=overrides.get("date", ""),
            show_date=bool(overrides.get("show_date", settings.clock_show_date)),
            format_24=bool(overrides.get("format_24", settings.clock_24h)),
        )
        self.set_last_frame(None)
        _LOGGER.info("%s: clock mode style %d", self.name, style)

    async def _async_update_gif(self, overrides: dict[str, Any]) -> None:
        url = overrides.get("gif_url") or self.settings.gif_url
        if not url:
            raise iPIXELCommandError("No GIF/image URL configured")
        url = await resolve_template_variables(self.hass, url)
        data, extension = await self.async_fetch_image(url)
        self._require_canvas()
        first = await self.async_show_image_bytes(data, extension, effect=overrides.get("effect"))
        self.set_last_frame(first)
        _LOGGER.info("%s: displayed image from %s", self.name, url)

    async def _async_update_rhythm(self, overrides: dict[str, Any]) -> None:
        settings = self.settings
        style = int(overrides.get("rhythm_style", settings.rhythm_style))
        speed = int(overrides.get("rhythm_speed", settings.rhythm_speed))
        await self.display.async_set_rhythm_mode(style, speed)
        self.set_last_frame(None)
        _LOGGER.info("%s: rhythm mode style %d speed %d", self.name, style, speed)

    # ------------------------------------------------------------------
    # Helpers used by services
    # ------------------------------------------------------------------
    async def async_fetch_image(self, url: str) -> tuple[bytes, str]:
        """Download an image and guess its extension."""
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(url, timeout=30) as response:
                if response.status != 200:
                    raise iPIXELCommandError(f"Failed to download {url}: HTTP {response.status}")
                data = await response.read()
                content_type = response.headers.get("Content-Type", "").lower()
        except iPIXELError:
            raise
        except Exception as err:  # noqa: BLE001
            raise iPIXELCommandError(f"Failed to download {url}: {err}") from err

        lowered = url.lower().split("?")[0]
        if "gif" in content_type or lowered.endswith(".gif"):
            extension = ".gif"
        elif "jpeg" in content_type or "jpg" in content_type or lowered.endswith((".jpg", ".jpeg")):
            extension = ".jpg"
        elif "bmp" in content_type or lowered.endswith(".bmp"):
            extension = ".bmp"
        elif "webp" in content_type or lowered.endswith(".webp"):
            extension = ".webp"
        else:
            extension = ".png"
        return data, extension

    async def async_show_image_bytes(
        self,
        data: bytes,
        extension: str = ".png",
        *,
        effect: str | None = None,
        save_slot: int = 0,
    ) -> Image.Image:
        """Decode an image/GIF, spread it over the display and return the first frame."""
        from .device.image import split_gif_frames
        from .display.base import fit_to_canvas

        width, height = self._require_canvas()
        try:
            frames, durations, loop = await self.hass.async_add_executor_job(split_gif_frames, data)
        except Exception as err:  # noqa: BLE001
            raise iPIXELCommandError(f"Cannot decode image ({extension}): {err}") from err

        sized = [self._apply_effect(fit_to_canvas(frame, width, height), effect) for frame in frames]
        if len(sized) == 1:
            await self.display.async_show_image(sized[0], save_slot=save_slot)
        else:
            await self.display.async_show_gif(sized, durations, loop=loop, save_slot=save_slot)
        self.set_last_frame(sized[0])
        return sized[0]

    async def async_show_image(self, image: Image.Image, *, save_slot: int = 0) -> None:
        """Show a PIL image (canvas sized or resized) and store the preview."""
        from .display.base import fit_to_canvas

        width, height = self._require_canvas()
        canvas = fit_to_canvas(image, width, height)
        await self.display.async_show_image(canvas, save_slot=save_slot)
        self.set_last_frame(canvas)

    async def async_set_power(self, on: bool) -> None:
        """Set power and remember it."""
        await self.display.async_set_power(on)
        self.settings.power = on
        self._notify_listeners()

    async def async_set_brightness(self, level: int) -> None:
        """Set brightness and remember it."""
        await self.display.async_set_brightness(int(level))
        self.settings.brightness = int(level)
        self._notify_listeners()

    async def async_set_orientation(self, orientation: str | int) -> None:
        """Set orientation (``"90"`` or ``1``) and remember it."""
        if isinstance(orientation, str):
            value = ORIENTATION_MAP.get(orientation)
            if value is None:
                raise iPIXELCommandError(f"Invalid orientation {orientation}")
            key = orientation
        else:
            value = int(orientation)
            key = next((k for k, v in ORIENTATION_MAP.items() if v == value), None)
            if key is None:
                raise iPIXELCommandError(f"Invalid orientation {orientation}")
        await self.display.async_set_orientation(value)
        self.settings.orientation = key
        self._notify_listeners()

    def get_animation_controller(self) -> AnimationController:
        """Return (and lazily create) the animation controller."""
        if self.animation_controller is None:
            from .display.animation_controller import AnimationController

            self.animation_controller = AnimationController(self.hass, self)
        return self.animation_controller
