"""Media player entity for showing images/GIFs from a URL."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.media_player import (
    MediaPlayerEntity,
    MediaPlayerEntityFeature,
    MediaPlayerState,
    MediaType,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN
from .entity import iPIXELDeviceEntity
from .runtime import iPIXELRuntime

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the media player."""
    runtime: iPIXELRuntime = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([iPIXELMediaPlayer(runtime)])


class iPIXELMediaPlayer(iPIXELDeviceEntity, MediaPlayerEntity, RestoreEntity):
    """Play an image or GIF (from a URL) on the display."""

    _attr_translation_key = "gif_player"
    _attr_supported_features = (
        MediaPlayerEntityFeature.PLAY
        | MediaPlayerEntityFeature.PAUSE
        | MediaPlayerEntityFeature.STOP
        | MediaPlayerEntityFeature.PLAY_MEDIA
        | MediaPlayerEntityFeature.TURN_ON
        | MediaPlayerEntityFeature.TURN_OFF
    )

    def __init__(self, runtime: iPIXELRuntime) -> None:
        """Initialise the media player."""
        super().__init__(runtime, key="media_player")
        self._state = MediaPlayerState.IDLE
        self._current_url: str | None = None
        self._media_title: str | None = None

    async def async_added_to_hass(self) -> None:
        """Restore the last URL."""
        await super().async_added_to_hass()
        if (last_state := await self.async_get_last_state()) is not None:
            if last_state.attributes.get("media_content_id"):
                self._current_url = last_state.attributes["media_content_id"]
            if last_state.attributes.get("media_title"):
                self._media_title = last_state.attributes["media_title"]

    @property
    def state(self) -> MediaPlayerState:
        """Return the player state."""
        if not self.settings.power:
            return MediaPlayerState.OFF
        return self._state

    @property
    def media_content_id(self) -> str | None:
        """Return the URL."""
        return self._current_url

    @property
    def media_content_type(self) -> MediaType | None:
        """Return the media type."""
        return MediaType.IMAGE if self._current_url else None

    @property
    def media_title(self) -> str | None:
        """Return the title."""
        return self._media_title

    async def async_play_media(self, media_type: MediaType | str, media_id: str, **kwargs: Any) -> None:
        """Show an image/GIF from a URL."""
        self._current_url = media_id
        self._media_title = media_id.rsplit("/", 1)[-1] if "/" in media_id else media_id
        await self._async_run(self._async_show(media_id))
        self._state = MediaPlayerState.PLAYING
        self.async_write_ha_state()

    async def _async_show(self, url: str) -> None:
        data, extension = await self.runtime.async_fetch_image(url)
        await self.runtime.async_show_image_bytes(data, extension)

    async def async_media_play(self) -> None:
        """Replay the stored URL."""
        if self._current_url:
            await self.async_play_media(MediaType.IMAGE, self._current_url)

    async def async_media_pause(self) -> None:
        """The device cannot pause; only the state is updated."""
        if self._state == MediaPlayerState.PLAYING:
            self._state = MediaPlayerState.PAUSED
            self.async_write_ha_state()

    async def async_media_stop(self) -> None:
        """Clear the display."""
        await self._async_run(self.runtime.async_clear())
        self._state = MediaPlayerState.IDLE
        self.async_write_ha_state()

    async def async_turn_on(self) -> None:
        """Power on."""
        await self._async_run(self.runtime.async_set_power(True))

    async def async_turn_off(self) -> None:
        """Power off."""
        await self._async_run(self.runtime.async_set_power(False))
        self._state = MediaPlayerState.IDLE
