"""Schedule manager for iPIXEL displays with dual storage support.

Provides both:
1. Built-in JSON storage for schedule persistence
2. Integration with Home Assistant automations via services

Reference: ESPHome component timer patterns from ipixel_ble.cpp
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass, field, asdict
from datetime import timedelta
from typing import Any, Callable, TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from homeassistant.helpers.storage import Store
from homeassistant.helpers.event import async_track_time_interval

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = "ipixel_color_schedules"

# Default schedule settings
DEFAULT_INTERVAL_MS = 5000
MIN_INTERVAL_MS = 1000
MAX_INTERVAL_MS = 3600000  # 1 hour


@dataclass
class ScheduleItem:
    """Represents a scheduled display item."""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    text: str = ""
    mode: str = "textimage"  # textimage, text, clock, gif
    duration_ms: int = 5000
    slot: int = 0
    gif_url: str | None = None
    color: str = "ffffff"
    bg_color: str = "000000"
    animation: int = 0
    speed: int = 80
    enabled: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ScheduleItem":
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class iPIXELScheduleManager:
    """Manages scheduled display updates with HA automations + built-in storage.

    Features:
    - Persistent JSON storage for schedules
    - Playlist cycling with configurable interval
    - Integration with HA automation services
    - Hourly time sync (like ESPHome component)
    """

    def __init__(
        self,
        hass: "HomeAssistant",
        address: str,
        update_callback: Callable[[ScheduleItem], Any] | None = None
    ) -> None:
        """Initialize schedule manager.

        Args:
            hass: Home Assistant instance
            address: Device Bluetooth address (for unique storage)
            update_callback: Async callback to update display with schedule item
        """
        self._hass = hass
        self._address = address
        self._update_callback = update_callback

        # Storage
        safe_address = address.replace(":", "").lower()
        self._store: Store = Store(
            hass, STORAGE_VERSION, f"{STORAGE_KEY}_{safe_address}"
        )

        # Schedule state
        self._schedules: list[ScheduleItem] = []
        self._playlist: list[str] = []  # List of schedule IDs in order
        self._current_index: int = 0
        self._is_running: bool = False
        self._interval_ms: int = DEFAULT_INTERVAL_MS

        # Timer handles
        self._playlist_timer: asyncio.TimerHandle | None = None
        self._time_sync_unsub: Callable | None = None

    async def async_load(self) -> None:
        """Load schedules from storage."""
        try:
            data = await self._store.async_load()
            if data:
                self._schedules = [
                    ScheduleItem.from_dict(item)
                    for item in data.get("schedules", [])
                ]
                self._playlist = data.get("playlist", [])
                self._interval_ms = data.get("interval_ms", DEFAULT_INTERVAL_MS)
                _LOGGER.info(
                    "Loaded %d schedules for %s",
                    len(self._schedules), self._address
                )
        except Exception as err:
            _LOGGER.error("Error loading schedules: %s", err)
            self._schedules = []
            self._playlist = []

    async def async_save(self) -> None:
        """Save schedules to storage."""
        try:
            data = {
                "schedules": [item.to_dict() for item in self._schedules],
                "playlist": self._playlist,
                "interval_ms": self._interval_ms,
            }
            await self._store.async_save(data)
            _LOGGER.debug("Saved %d schedules", len(self._schedules))
        except Exception as err:
            _LOGGER.error("Error saving schedules: %s", err)

    # Schedule CRUD operations

    async def add_schedule(self, item: ScheduleItem) -> str:
        """Add a schedule item.

        Args:
            item: Schedule item to add

        Returns:
            ID of the added schedule
        """
        self._schedules.append(item)
        await self.async_save()
        _LOGGER.info("Added schedule '%s' (id=%s)", item.name, item.id)
        return item.id

    async def remove_schedule(self, schedule_id: str) -> bool:
        """Remove a schedule by ID.

        Args:
            schedule_id: ID of schedule to remove

        Returns:
            True if schedule was removed
        """
        original_count = len(self._schedules)
        self._schedules = [s for s in self._schedules if s.id != schedule_id]

        if len(self._schedules) < original_count:
            # Also remove from playlist
            self._playlist = [p for p in self._playlist if p != schedule_id]
            await self.async_save()
            _LOGGER.info("Removed schedule id=%s", schedule_id)
            return True

        return False

    async def update_schedule(self, schedule_id: str, **kwargs) -> bool:
        """Update a schedule item.

        Args:
            schedule_id: ID of schedule to update
            **kwargs: Fields to update

        Returns:
            True if schedule was updated
        """
        for schedule in self._schedules:
            if schedule.id == schedule_id:
                for key, value in kwargs.items():
                    if hasattr(schedule, key):
                        setattr(schedule, key, value)
                await self.async_save()
                return True
        return False

    def get_schedule(self, schedule_id: str) -> ScheduleItem | None:
        """Get a schedule by ID."""
        for schedule in self._schedules:
            if schedule.id == schedule_id:
                return schedule
        return None

    def get_all_schedules(self) -> list[ScheduleItem]:
        """Get all schedules."""
        return self._schedules.copy()

    # Playlist management

    async def set_playlist(self, schedule_ids: list[str]) -> None:
        """Set the playlist order.

        Args:
            schedule_ids: List of schedule IDs in desired order
        """
        # Validate all IDs exist
        valid_ids = {s.id for s in self._schedules}
        self._playlist = [sid for sid in schedule_ids if sid in valid_ids]
        self._current_index = 0
        await self.async_save()
        _LOGGER.info("Playlist set: %s", self._playlist)

    async def set_interval(self, interval_ms: int) -> None:
        """Set playlist cycling interval.

        Args:
            interval_ms: Interval in milliseconds
        """
        self._interval_ms = max(MIN_INTERVAL_MS, min(interval_ms, MAX_INTERVAL_MS))
        await self.async_save()

        # Restart timer if running
        if self._is_running:
            await self.stop_playlist_loop()
            await self.start_playlist_loop()

    # Playlist loop

    async def start_playlist_loop(self) -> None:
        """Start cycling through playlist items."""
        if self._is_running:
            return

        if not self._playlist:
            _LOGGER.warning("Cannot start playlist: no items")
            return

        self._is_running = True
        self._current_index = 0
        _LOGGER.info(
            "Starting playlist loop (%d items, %dms interval)",
            len(self._playlist), self._interval_ms
        )

        # Schedule first update
        await self._playlist_tick()

    async def stop_playlist_loop(self) -> None:
        """Stop playlist cycling."""
        self._is_running = False
        if self._playlist_timer:
            self._playlist_timer.cancel()
            self._playlist_timer = None
        _LOGGER.info("Playlist loop stopped")

    async def _playlist_tick(self) -> None:
        """Execute one playlist tick."""
        if not self._is_running or not self._playlist:
            return

        try:
            # Get current schedule
            schedule_id = self._playlist[self._current_index]
            schedule = self.get_schedule(schedule_id)

            if schedule and schedule.enabled:
                _LOGGER.debug(
                    "Playing schedule '%s' (index %d/%d)",
                    schedule.name, self._current_index + 1, len(self._playlist)
                )

                # Trigger display update
                if self._update_callback:
                    await self._update_callback(schedule)

            # Advance to next item
            self._current_index = (self._current_index + 1) % len(self._playlist)

        except Exception as err:
            _LOGGER.error("Error in playlist tick: %s", err)

        # Schedule next tick
        if self._is_running:
            self._playlist_timer = self._hass.loop.call_later(
                self._interval_ms / 1000.0,
                lambda: asyncio.create_task(self._playlist_tick())
            )

    # HA Automation integration

    async def trigger_schedule(self, schedule_id: str) -> bool:
        """Manually trigger a specific schedule.

        This is called by HA automations to display a specific schedule item.

        Args:
            schedule_id: ID of schedule to trigger

        Returns:
            True if schedule was triggered
        """
        schedule = self.get_schedule(schedule_id)
        if not schedule:
            _LOGGER.warning("Schedule not found: %s", schedule_id)
            return False

        if self._update_callback:
            await self._update_callback(schedule)
            _LOGGER.info("Triggered schedule '%s'", schedule.name)
            return True

        return False

    # Time sync (like ESPHome hourly pattern)

    def start_time_sync(self, sync_callback: Callable[[], Any]) -> None:
        """Start hourly time sync.

        Args:
            sync_callback: Async callback to sync time
        """
        async def _sync_time(_: Any) -> None:
            try:
                await sync_callback()
                _LOGGER.debug("Hourly time sync completed")
            except Exception as err:
                _LOGGER.error("Time sync failed: %s", err)

        self._time_sync_unsub = async_track_time_interval(
            self._hass,
            _sync_time,
            timedelta(hours=1)
        )
        _LOGGER.info("Hourly time sync enabled")

    def stop_time_sync(self) -> None:
        """Stop hourly time sync."""
        if self._time_sync_unsub:
            self._time_sync_unsub()
            self._time_sync_unsub = None

    # Properties

    @property
    def is_running(self) -> bool:
        """Return True if playlist is running."""
        return self._is_running

    @property
    def current_schedule(self) -> ScheduleItem | None:
        """Get currently playing schedule."""
        if not self._playlist or not self._is_running:
            return None
        schedule_id = self._playlist[self._current_index]
        return self.get_schedule(schedule_id)

    @property
    def interval_ms(self) -> int:
        """Get current interval in milliseconds."""
        return self._interval_ms

    @property
    def playlist(self) -> list[str]:
        """Get current playlist."""
        return self._playlist.copy()

    @property
    def schedule_count(self) -> int:
        """Get number of schedules."""
        return len(self._schedules)

    # Cleanup

    async def async_shutdown(self) -> None:
        """Shutdown the schedule manager."""
        await self.stop_playlist_loop()
        self.stop_time_sync()
        await self.async_save()
