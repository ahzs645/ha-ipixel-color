"""Media player entity for iPIXEL GIF playback control."""
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
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN, CONF_ADDRESS, CONF_NAME

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up iPIXEL media player from a config entry."""
    address = config_entry.data[CONF_ADDRESS]
    name = config_entry.data.get(CONF_NAME, "iPIXEL Display")

    api = hass.data[DOMAIN][config_entry.entry_id]

    async_add_entities([
        iPIXELMediaPlayer(api, address, name),
    ])


class iPIXELMediaPlayer(MediaPlayerEntity, RestoreEntity):
    """Media player for iPIXEL GIF animations.

    Provides playback control for GIF animations:
    - Play: Start/resume GIF display
    - Pause: Pause GIF (show static frame)
    - Stop: Clear display
    - Play Media: Load and display GIF from URL
    """

    _attr_has_entity_name = True
    _attr_supported_features = (
        MediaPlayerEntityFeature.PLAY
        | MediaPlayerEntityFeature.PAUSE
        | MediaPlayerEntityFeature.STOP
        | MediaPlayerEntityFeature.PLAY_MEDIA
    )

    def __init__(self, api, address: str, device_name: str) -> None:
        """Initialize the media player.

        Args:
            api: iPIXEL API instance
            address: Bluetooth address
            device_name: Device name
        """
        self._api = api
        self._address = address
        self._device_name = device_name

        # State
        self._state = MediaPlayerState.IDLE
        self._current_gif_url: str | None = None
        self._media_title: str | None = None

        # Entity attributes
        self._attr_unique_id = f"{address}_media_player"
        self._attr_name = "GIF Player"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, address)},
            name=device_name,
            manufacturer="iPIXEL",
            model="LED Matrix Display",
        )

    async def async_added_to_hass(self) -> None:
        """Restore state when entity is added."""
        await super().async_added_to_hass()

        if (last_state := await self.async_get_last_state()) is not None:
            if last_state.state in (
                MediaPlayerState.PLAYING,
                MediaPlayerState.PAUSED,
                MediaPlayerState.IDLE,
            ):
                self._state = MediaPlayerState(last_state.state)

            # Restore attributes
            if last_state.attributes.get("media_content_id"):
                self._current_gif_url = last_state.attributes["media_content_id"]
            if last_state.attributes.get("media_title"):
                self._media_title = last_state.attributes["media_title"]

    @property
    def state(self) -> MediaPlayerState:
        """Return the state of the player."""
        return self._state

    @property
    def media_content_id(self) -> str | None:
        """Return the content ID of current playing media."""
        return self._current_gif_url

    @property
    def media_content_type(self) -> MediaType | None:
        """Return the content type of current playing media."""
        if self._current_gif_url:
            return MediaType.IMAGE
        return None

    @property
    def media_title(self) -> str | None:
        """Return the title of current playing media."""
        return self._media_title

    async def async_play_media(
        self,
        media_type: MediaType | str,
        media_id: str,
        **kwargs: Any
    ) -> None:
        """Play a piece of media.

        Args:
            media_type: Type of media (image, gif)
            media_id: URL or path to the media
            **kwargs: Additional arguments
        """
        _LOGGER.debug("Play media: type=%s, id=%s", media_type, media_id)

        # Store the URL
        self._current_gif_url = media_id

        # Extract title from URL
        if "/" in media_id:
            self._media_title = media_id.split("/")[-1]
        else:
            self._media_title = media_id

        # Connect if needed
        if not self._api.is_connected:
            await self._api.connect()

        # Display the GIF
        success = await self._api.display_gif_url(media_id)

        if success:
            self._state = MediaPlayerState.PLAYING
            _LOGGER.info("Playing GIF: %s", media_id)
        else:
            self._state = MediaPlayerState.IDLE
            _LOGGER.error("Failed to play GIF: %s", media_id)

        self.async_write_ha_state()

    async def async_media_play(self) -> None:
        """Send play command.

        If we have a stored GIF URL, replay it.
        """
        if self._current_gif_url:
            await self.async_play_media(MediaType.IMAGE, self._current_gif_url)
        else:
            _LOGGER.warning("No GIF URL stored - nothing to play")

    async def async_media_pause(self) -> None:
        """Send pause command.

        For iPIXEL, pause means show a static frame.
        We'll just update the state - the device doesn't have true pause.
        """
        if self._state == MediaPlayerState.PLAYING:
            self._state = MediaPlayerState.PAUSED
            _LOGGER.debug("GIF playback paused (state only)")
            self.async_write_ha_state()

    async def async_media_stop(self) -> None:
        """Send stop command.

        Clear the display and reset state.
        """
        try:
            # Connect if needed
            if not self._api.is_connected:
                await self._api.connect()

            # Turn off or clear the display
            await self._api.set_power(False)

            self._state = MediaPlayerState.IDLE
            _LOGGER.info("GIF playback stopped")

        except Exception as err:
            _LOGGER.error("Error stopping playback: %s", err)

        self.async_write_ha_state()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra state attributes."""
        attrs = {}
        if self._current_gif_url:
            attrs["gif_url"] = self._current_gif_url
        return attrs
