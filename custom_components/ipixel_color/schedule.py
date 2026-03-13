"""Enhanced schedule manager for iPIXEL displays - Digital Signage System.

Provides:
1. Playlists with per-item durations
2. Power scheduling (auto on/off)
3. Time-based content triggers
4. Loop/shuffle playlist modes
5. Multiple playlist support

Reference: UniFi Display Connect-style functionality
"""
from __future__ import annotations

import asyncio
import logging
import random
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, time, timedelta
from typing import Any, Callable, TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from homeassistant.helpers.storage import Store
from homeassistant.helpers.event import (
    async_track_time_interval,
    async_track_time_change,
)

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 2
STORAGE_KEY = "ipixel_color_schedules"

# Default settings
DEFAULT_DURATION_MS = 5000
MIN_DURATION_MS = 1000
MAX_DURATION_MS = 3600000  # 1 hour


@dataclass
class ScheduleItem:
    """Represents a scheduled display item with its own duration."""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    text: str = ""
    mode: str = "textimage"  # textimage, text, clock, gif, rhythm
    duration_ms: int = DEFAULT_DURATION_MS  # Per-item duration
    slot: int | None = None  # Device slot to show (for pre-loaded content)
    gif_url: str | None = None
    color: str = "ffffff"
    bg_color: str = "000000"
    font: str | None = None
    font_size: float | None = None
    animation: int = 0
    speed: int = 80
    rainbow_mode: int = 0
    clock_style: int = 1
    rhythm_style: int = 0
    rhythm_speed: int = 4
    enabled: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ScheduleItem":
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class Playlist:
    """A playlist containing schedule items with playback options."""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = "Default Playlist"
    item_ids: list[str] = field(default_factory=list)  # Order of schedule item IDs
    loop: bool = True  # Loop when reaching end
    shuffle: bool = False  # Randomize order
    enabled: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Playlist":
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class TimeSlot:
    """A time-based schedule slot - show specific playlist at specific time."""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    playlist_id: str = ""  # Which playlist to play
    start_time: str = "00:00"  # HH:MM format
    end_time: str = "23:59"  # HH:MM format
    days: list[str] = field(default_factory=lambda: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
    priority: int = 0  # Higher priority overrides lower
    enabled: bool = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TimeSlot":
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    def is_active_now(self) -> bool:
        """Check if this time slot is currently active."""
        if not self.enabled:
            return False

        now = datetime.now()
        day_name = now.strftime("%a").lower()

        if day_name not in self.days:
            return False

        try:
            start = datetime.strptime(self.start_time, "%H:%M").time()
            end = datetime.strptime(self.end_time, "%H:%M").time()
            current = now.time()

            # Handle overnight slots (e.g., 22:00 to 06:00)
            if start <= end:
                return start <= current <= end
            else:
                return current >= start or current <= end
        except ValueError:
            return False


@dataclass
class PowerSchedule:
    """Power on/off schedule for the display."""

    enabled: bool = False
    on_time: str = "07:00"  # HH:MM format
    off_time: str = "22:00"  # HH:MM format
    days: list[str] = field(default_factory=lambda: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"])

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PowerSchedule":
        """Create from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    def should_be_on(self) -> bool:
        """Check if display should be on right now."""
        if not self.enabled:
            return True  # Default to on if schedule disabled

        now = datetime.now()
        day_name = now.strftime("%a").lower()

        if day_name not in self.days:
            return True  # No schedule for today, default on

        try:
            on = datetime.strptime(self.on_time, "%H:%M").time()
            off = datetime.strptime(self.off_time, "%H:%M").time()
            current = now.time()

            if on <= off:
                return on <= current <= off
            else:
                return current >= on or current <= off
        except ValueError:
            return True


class iPIXELScheduleManager:
    """Enhanced schedule manager with digital signage features.

    Features:
    - Per-item duration in playlists
    - Multiple playlists with loop/shuffle
    - Time-based playlist switching
    - Power on/off scheduling
    - Integration with HA automations
    """

    def __init__(
        self,
        hass: "HomeAssistant",
        api: Any,
        address: str,
    ) -> None:
        """Initialize schedule manager.

        Args:
            hass: Home Assistant instance
            api: iPIXEL API instance for device control
            address: Device Bluetooth address (for unique storage)
        """
        self._hass = hass
        self._api = api
        self._address = address

        # Storage
        safe_address = address.replace(":", "").lower()
        self._store: Store = Store(
            hass, STORAGE_VERSION, f"{STORAGE_KEY}_{safe_address}"
        )

        # Schedule items (content library)
        self._schedules: dict[str, ScheduleItem] = {}

        # Playlists
        self._playlists: dict[str, Playlist] = {}
        self._active_playlist_id: str | None = None

        # Time slots
        self._time_slots: list[TimeSlot] = []

        # Power schedule
        self._power_schedule = PowerSchedule()

        # Playback state
        self._current_item_index: int = 0
        self._shuffled_order: list[str] = []
        self._is_running: bool = False
        self._loop_task: asyncio.Task | None = None

        # Timer handles
        self._power_check_unsub: Callable | None = None
        self._time_slot_unsub: Callable | None = None
        self._time_sync_unsub: Callable | None = None

    # =========================================================================
    # Storage
    # =========================================================================

    async def async_load(self) -> None:
        """Load all data from storage."""
        try:
            data = await self._store.async_load()
            if data:
                # Load schedule items
                for item_data in data.get("schedules", []):
                    item = ScheduleItem.from_dict(item_data)
                    self._schedules[item.id] = item

                # Load playlists
                for playlist_data in data.get("playlists", []):
                    playlist = Playlist.from_dict(playlist_data)
                    self._playlists[playlist.id] = playlist

                # Load time slots
                self._time_slots = [
                    TimeSlot.from_dict(ts) for ts in data.get("time_slots", [])
                ]

                # Load power schedule
                if "power_schedule" in data:
                    self._power_schedule = PowerSchedule.from_dict(data["power_schedule"])

                # Load active playlist
                self._active_playlist_id = data.get("active_playlist_id")

                _LOGGER.info(
                    "Loaded %d schedules, %d playlists, %d time slots for %s",
                    len(self._schedules), len(self._playlists),
                    len(self._time_slots), self._address
                )
        except Exception as err:
            _LOGGER.error("Error loading schedules: %s", err)

    async def async_save(self) -> None:
        """Save all data to storage."""
        try:
            data = {
                "schedules": [item.to_dict() for item in self._schedules.values()],
                "playlists": [pl.to_dict() for pl in self._playlists.values()],
                "time_slots": [ts.to_dict() for ts in self._time_slots],
                "power_schedule": self._power_schedule.to_dict(),
                "active_playlist_id": self._active_playlist_id,
            }
            await self._store.async_save(data)
            _LOGGER.debug("Saved schedule data")
        except Exception as err:
            _LOGGER.error("Error saving schedules: %s", err)

    # =========================================================================
    # Schedule Item CRUD (Content Library)
    # =========================================================================

    async def add_schedule(self, item: ScheduleItem) -> str:
        """Add a schedule item to the content library."""
        self._schedules[item.id] = item
        await self.async_save()
        _LOGGER.info("Added schedule item '%s' (id=%s)", item.name, item.id)
        return item.id

    async def remove_schedule(self, schedule_id: str) -> bool:
        """Remove a schedule item."""
        if schedule_id in self._schedules:
            del self._schedules[schedule_id]
            # Remove from all playlists
            for playlist in self._playlists.values():
                playlist.item_ids = [i for i in playlist.item_ids if i != schedule_id]
            await self.async_save()
            _LOGGER.info("Removed schedule id=%s", schedule_id)
            return True
        return False

    async def update_schedule(self, schedule_id: str, **kwargs) -> bool:
        """Update a schedule item."""
        if schedule_id in self._schedules:
            item = self._schedules[schedule_id]
            for key, value in kwargs.items():
                if hasattr(item, key):
                    setattr(item, key, value)
            await self.async_save()
            return True
        return False

    def get_schedule(self, schedule_id: str) -> ScheduleItem | None:
        """Get a schedule item by ID."""
        return self._schedules.get(schedule_id)

    def get_all_schedules(self) -> list[ScheduleItem]:
        """Get all schedule items."""
        return list(self._schedules.values())

    # =========================================================================
    # Playlist Management
    # =========================================================================

    async def create_playlist(
        self,
        name: str,
        item_ids: list[str] | None = None,
        loop: bool = True,
        shuffle: bool = False
    ) -> str:
        """Create a new playlist."""
        playlist = Playlist(
            name=name,
            item_ids=item_ids or [],
            loop=loop,
            shuffle=shuffle,
        )
        self._playlists[playlist.id] = playlist
        await self.async_save()
        _LOGGER.info("Created playlist '%s' (id=%s)", name, playlist.id)
        return playlist.id

    async def delete_playlist(self, playlist_id: str) -> bool:
        """Delete a playlist."""
        if playlist_id in self._playlists:
            del self._playlists[playlist_id]
            # Remove from time slots
            for ts in self._time_slots:
                if ts.playlist_id == playlist_id:
                    ts.playlist_id = ""
            if self._active_playlist_id == playlist_id:
                self._active_playlist_id = None
                await self.stop_playlist_loop()
            await self.async_save()
            return True
        return False

    async def add_to_playlist(self, playlist_id: str, schedule_id: str, position: int | None = None) -> bool:
        """Add a schedule item to a playlist."""
        if playlist_id not in self._playlists:
            return False
        if schedule_id not in self._schedules:
            return False

        playlist = self._playlists[playlist_id]
        if position is None:
            playlist.item_ids.append(schedule_id)
        else:
            playlist.item_ids.insert(position, schedule_id)
        await self.async_save()
        return True

    async def remove_from_playlist(self, playlist_id: str, schedule_id: str) -> bool:
        """Remove a schedule item from a playlist."""
        if playlist_id not in self._playlists:
            return False

        playlist = self._playlists[playlist_id]
        if schedule_id in playlist.item_ids:
            playlist.item_ids.remove(schedule_id)
            await self.async_save()
            return True
        return False

    async def reorder_playlist(self, playlist_id: str, item_ids: list[str]) -> bool:
        """Reorder items in a playlist."""
        if playlist_id not in self._playlists:
            return False

        playlist = self._playlists[playlist_id]
        # Validate all IDs exist
        valid_ids = [i for i in item_ids if i in self._schedules]
        playlist.item_ids = valid_ids
        await self.async_save()
        return True

    async def set_playlist_options(
        self,
        playlist_id: str,
        loop: bool | None = None,
        shuffle: bool | None = None
    ) -> bool:
        """Update playlist options."""
        if playlist_id not in self._playlists:
            return False

        playlist = self._playlists[playlist_id]
        if loop is not None:
            playlist.loop = loop
        if shuffle is not None:
            playlist.shuffle = shuffle
            if shuffle:
                self._regenerate_shuffle_order(playlist)
        await self.async_save()
        return True

    def get_playlist(self, playlist_id: str) -> Playlist | None:
        """Get a playlist by ID."""
        return self._playlists.get(playlist_id)

    def get_all_playlists(self) -> list[Playlist]:
        """Get all playlists."""
        return list(self._playlists.values())

    # =========================================================================
    # Playlist Playback (Per-Item Duration)
    # =========================================================================

    async def start_playlist(self, playlist_id: str | None = None) -> bool:
        """Start playing a playlist with per-item durations."""
        if self._is_running:
            await self.stop_playlist_loop()

        target_id = playlist_id or self._active_playlist_id
        if not target_id or target_id not in self._playlists:
            _LOGGER.warning("No valid playlist to start")
            return False

        playlist = self._playlists[target_id]
        if not playlist.item_ids:
            _LOGGER.warning("Playlist '%s' is empty", playlist.name)
            return False

        self._active_playlist_id = target_id
        self._current_item_index = 0
        self._is_running = True

        if playlist.shuffle:
            self._regenerate_shuffle_order(playlist)

        _LOGGER.info(
            "Starting playlist '%s' (%d items, loop=%s, shuffle=%s)",
            playlist.name, len(playlist.item_ids), playlist.loop, playlist.shuffle
        )

        # Start the playback loop
        self._loop_task = asyncio.create_task(self._playback_loop())
        await self.async_save()
        return True

    async def stop_playlist_loop(self) -> None:
        """Stop playlist playback."""
        self._is_running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
            self._loop_task = None
        _LOGGER.info("Playlist stopped")

    async def _playback_loop(self) -> None:
        """Main playback loop - uses per-item durations."""
        while self._is_running:
            try:
                playlist = self._playlists.get(self._active_playlist_id)
                if not playlist or not playlist.item_ids:
                    break

                # Get current item (respecting shuffle order)
                if playlist.shuffle and self._shuffled_order:
                    item_id = self._shuffled_order[self._current_item_index]
                else:
                    item_id = playlist.item_ids[self._current_item_index]

                item = self._schedules.get(item_id)
                if item and item.enabled:
                    _LOGGER.debug(
                        "Playing '%s' for %dms (%d/%d)",
                        item.name, item.duration_ms,
                        self._current_item_index + 1, len(playlist.item_ids)
                    )

                    # Display the item
                    await self._display_item(item)

                    # Wait for item's duration
                    await asyncio.sleep(item.duration_ms / 1000.0)

                # Advance to next item
                self._current_item_index += 1

                # Handle end of playlist
                total_items = len(self._shuffled_order if playlist.shuffle else playlist.item_ids)
                if self._current_item_index >= total_items:
                    if playlist.loop:
                        self._current_item_index = 0
                        if playlist.shuffle:
                            self._regenerate_shuffle_order(playlist)
                        _LOGGER.debug("Playlist looped")
                    else:
                        _LOGGER.info("Playlist '%s' completed", playlist.name)
                        break

            except asyncio.CancelledError:
                break
            except Exception as err:
                _LOGGER.error("Error in playback loop: %s", err)
                await asyncio.sleep(1)

        self._is_running = False

    def _regenerate_shuffle_order(self, playlist: Playlist) -> None:
        """Generate new shuffled order for playlist."""
        self._shuffled_order = playlist.item_ids.copy()
        random.shuffle(self._shuffled_order)

    async def _display_item(self, item: ScheduleItem) -> None:
        """Display a schedule item on the device."""
        try:
            # If item has a slot, just show the slot (instant, no BLE transfer)
            if item.slot is not None:
                await self._api.show_slot(item.slot)
                return

            # Otherwise, send content based on mode
            from .common import update_ipixel_display

            # Get device name for entity lookups
            device_name = self._address.replace(":", "").lower()

            if item.mode == "clock":
                await self._api.set_clock_mode(
                    style=item.clock_style,
                    show_date=True,
                    format_24=True
                )
            elif item.mode == "rhythm":
                await self._api.set_rhythm_mode(
                    style=item.rhythm_style,
                    speed=item.rhythm_speed
                )
            elif item.mode == "gif" and item.gif_url:
                await self._api.display_image_url(item.gif_url)
            elif item.mode in ("text", "textimage"):
                # Use the common update function with item's text
                await update_ipixel_display(
                    self._hass, device_name, self._api, item.text
                )

        except Exception as err:
            _LOGGER.error("Error displaying item '%s': %s", item.name, err)

    # =========================================================================
    # Time Slots (Time-Based Content)
    # =========================================================================

    async def add_time_slot(
        self,
        name: str,
        playlist_id: str,
        start_time: str,
        end_time: str,
        days: list[str] | None = None,
        priority: int = 0
    ) -> str:
        """Add a time-based schedule slot."""
        time_slot = TimeSlot(
            name=name,
            playlist_id=playlist_id,
            start_time=start_time,
            end_time=end_time,
            days=days or ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
            priority=priority,
        )
        self._time_slots.append(time_slot)
        self._time_slots.sort(key=lambda ts: ts.priority, reverse=True)
        await self.async_save()
        _LOGGER.info("Added time slot '%s' (%s-%s)", name, start_time, end_time)
        return time_slot.id

    async def remove_time_slot(self, time_slot_id: str) -> bool:
        """Remove a time slot."""
        original_count = len(self._time_slots)
        self._time_slots = [ts for ts in self._time_slots if ts.id != time_slot_id]
        if len(self._time_slots) < original_count:
            await self.async_save()
            return True
        return False

    def get_active_time_slot(self) -> TimeSlot | None:
        """Get the currently active time slot (highest priority)."""
        for ts in self._time_slots:  # Already sorted by priority
            if ts.is_active_now():
                return ts
        return None

    async def start_time_slot_monitoring(self) -> None:
        """Start monitoring time slots and switching playlists automatically."""
        if self._time_slot_unsub:
            return

        async def check_time_slots(now: datetime) -> None:
            """Check and switch playlists based on time slots."""
            active_slot = self.get_active_time_slot()

            if active_slot and active_slot.playlist_id:
                if self._active_playlist_id != active_slot.playlist_id:
                    _LOGGER.info(
                        "Time slot '%s' activated, switching to playlist",
                        active_slot.name
                    )
                    await self.start_playlist(active_slot.playlist_id)

        # Check every minute
        self._time_slot_unsub = async_track_time_interval(
            self._hass, check_time_slots, timedelta(minutes=1)
        )
        _LOGGER.info("Time slot monitoring started")

    def stop_time_slot_monitoring(self) -> None:
        """Stop time slot monitoring."""
        if self._time_slot_unsub:
            self._time_slot_unsub()
            self._time_slot_unsub = None

    # =========================================================================
    # Power Schedule
    # =========================================================================

    async def set_power_schedule(
        self,
        enabled: bool = True,
        on_time: str = "07:00",
        off_time: str = "22:00",
        days: list[str] | None = None
    ) -> None:
        """Configure power on/off schedule."""
        self._power_schedule = PowerSchedule(
            enabled=enabled,
            on_time=on_time,
            off_time=off_time,
            days=days or ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        )
        await self.async_save()
        _LOGGER.info(
            "Power schedule %s: on=%s, off=%s",
            "enabled" if enabled else "disabled", on_time, off_time
        )

    async def start_power_schedule_monitoring(self) -> None:
        """Start monitoring and applying power schedule."""
        if self._power_check_unsub:
            return

        last_state: bool | None = None

        async def check_power(now: datetime) -> None:
            nonlocal last_state
            should_be_on = self._power_schedule.should_be_on()

            if last_state != should_be_on:
                last_state = should_be_on
                try:
                    await self._api.set_power(should_be_on)
                    _LOGGER.info(
                        "Power schedule: turned %s",
                        "ON" if should_be_on else "OFF"
                    )
                except Exception as err:
                    _LOGGER.error("Error applying power schedule: %s", err)

        # Check every minute
        self._power_check_unsub = async_track_time_interval(
            self._hass, check_power, timedelta(minutes=1)
        )
        _LOGGER.info("Power schedule monitoring started")

    def stop_power_schedule_monitoring(self) -> None:
        """Stop power schedule monitoring."""
        if self._power_check_unsub:
            self._power_check_unsub()
            self._power_check_unsub = None

    # =========================================================================
    # Manual Triggers (for HA Automations)
    # =========================================================================

    async def trigger_schedule(self, schedule_id: str) -> bool:
        """Manually trigger a specific schedule item."""
        item = self._schedules.get(schedule_id)
        if not item:
            _LOGGER.warning("Schedule not found: %s", schedule_id)
            return False

        await self._display_item(item)
        _LOGGER.info("Triggered schedule '%s'", item.name)
        return True

    async def trigger_playlist(self, playlist_id: str) -> bool:
        """Start playing a specific playlist."""
        return await self.start_playlist(playlist_id)

    # =========================================================================
    # Compatibility with existing set_playlist service
    # =========================================================================

    async def set_playlist(self, schedule_ids: list[str]) -> None:
        """Set playlist from list of IDs (legacy compatibility)."""
        # Create or update default playlist
        default_id = "default"
        if default_id not in self._playlists:
            await self.create_playlist("Default", schedule_ids)
            # Get the newly created playlist ID
            for pl in self._playlists.values():
                if pl.name == "Default":
                    default_id = pl.id
                    break
        else:
            self._playlists[default_id].item_ids = schedule_ids

        self._active_playlist_id = default_id
        await self.async_save()

    async def start_playlist_loop(self, interval_ms: int = 5000) -> None:
        """Start playlist loop (legacy compatibility)."""
        # For backwards compatibility - start the active playlist
        await self.start_playlist()

    # =========================================================================
    # Properties
    # =========================================================================

    @property
    def is_running(self) -> bool:
        """Return True if playlist is running."""
        return self._is_running

    @property
    def current_schedule(self) -> ScheduleItem | None:
        """Get currently playing schedule item."""
        if not self._is_running or not self._active_playlist_id:
            return None

        playlist = self._playlists.get(self._active_playlist_id)
        if not playlist or not playlist.item_ids:
            return None

        if playlist.shuffle and self._shuffled_order:
            item_id = self._shuffled_order[self._current_item_index]
        else:
            item_id = playlist.item_ids[self._current_item_index]

        return self._schedules.get(item_id)

    @property
    def active_playlist(self) -> Playlist | None:
        """Get active playlist."""
        if self._active_playlist_id:
            return self._playlists.get(self._active_playlist_id)
        return None

    @property
    def power_schedule(self) -> PowerSchedule:
        """Get power schedule."""
        return self._power_schedule

    @property
    def schedule_count(self) -> int:
        """Get number of schedule items."""
        return len(self._schedules)

    @property
    def playlist_count(self) -> int:
        """Get number of playlists."""
        return len(self._playlists)

    # =========================================================================
    # Cleanup
    # =========================================================================

    async def async_shutdown(self) -> None:
        """Shutdown the schedule manager."""
        await self.stop_playlist_loop()
        self.stop_time_slot_monitoring()
        self.stop_power_schedule_monitoring()
        await self.async_save()
