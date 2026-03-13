"""Device slot state tracking for iPIXEL devices.

Mirrors the official app's ChannelIndex/mapSaveChannel() behavior:
- Tracks which device slots are occupied locally
- Enforces the 100-slot limit
- Persists state via Home Assistant's storage helper
- Requires slot reservation before content upload

Recovered from APK reverse engineering of com.wifiled.ipixels v3.5.6.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

_LOGGER = logging.getLogger(__name__)

# Maximum slots the device supports (app-side limit, not hardware)
MAX_DEVICE_SLOTS = 100

# Slot range
MIN_SLOT = 1
MAX_SLOT = 255


@dataclass
class SlotInfo:
    """Metadata for a single occupied slot."""

    slot: int
    content_type: str = ""  # "image", "gif", "text", "template"
    label: str = ""  # User-visible label
    timestamp: str = ""  # ISO timestamp when saved


@dataclass
class SlotState:
    """Tracks all occupied slots for a device."""

    device_address: str
    led_type: int = 0
    slots: dict[int, SlotInfo] = field(default_factory=dict)

    @property
    def occupied_count(self) -> int:
        """Number of occupied slots."""
        return len(self.slots)

    @property
    def is_full(self) -> bool:
        """Whether the device has reached the 100-slot limit."""
        return self.occupied_count >= MAX_DEVICE_SLOTS

    def next_free_slot(self) -> int | None:
        """Find the next available slot number.

        Returns:
            Next free slot number (1-255), or None if full
        """
        if self.is_full:
            return None

        occupied = set(self.slots.keys())
        for i in range(MIN_SLOT, MAX_SLOT + 1):
            if i not in occupied:
                return i
        return None

    def reserve(self, slot: int, content_type: str = "", label: str = "") -> bool:
        """Mark a slot as occupied.

        Args:
            slot: Slot number (1-255)
            content_type: Type of content stored
            label: User-visible label

        Returns:
            True if reserved successfully, False if already occupied or full
        """
        if slot < MIN_SLOT or slot > MAX_SLOT:
            _LOGGER.error("Invalid slot number: %d", slot)
            return False

        if slot in self.slots:
            _LOGGER.warning("Slot %d already occupied, overwriting", slot)

        if self.is_full and slot not in self.slots:
            _LOGGER.error(
                "Cannot reserve slot %d: device at %d/%d capacity",
                slot, self.occupied_count, MAX_DEVICE_SLOTS,
            )
            return False

        import datetime
        self.slots[slot] = SlotInfo(
            slot=slot,
            content_type=content_type,
            label=label,
            timestamp=datetime.datetime.now().isoformat(),
        )
        _LOGGER.debug(
            "Slot %d reserved (%s). %d/%d slots used.",
            slot, content_type, self.occupied_count, MAX_DEVICE_SLOTS,
        )
        return True

    def release(self, slot: int) -> bool:
        """Mark a slot as free.

        Args:
            slot: Slot number to release

        Returns:
            True if released, False if wasn't occupied
        """
        if slot in self.slots:
            del self.slots[slot]
            _LOGGER.debug(
                "Slot %d released. %d/%d slots used.",
                slot, self.occupied_count, MAX_DEVICE_SLOTS,
            )
            return True
        return False

    def release_multiple(self, slots: list[int]) -> int:
        """Release multiple slots at once.

        Args:
            slots: List of slot numbers to release

        Returns:
            Number of slots actually released
        """
        count = 0
        for slot in slots:
            if self.release(slot):
                count += 1
        return count

    def clear_all(self) -> None:
        """Clear all slot tracking state."""
        count = len(self.slots)
        self.slots.clear()
        _LOGGER.info("Cleared all %d slot records", count)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict for persistence."""
        return {
            "device_address": self.device_address,
            "led_type": self.led_type,
            "slots": {
                str(k): {
                    "slot": v.slot,
                    "content_type": v.content_type,
                    "label": v.label,
                    "timestamp": v.timestamp,
                }
                for k, v in self.slots.items()
            },
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SlotState:
        """Deserialize from dict."""
        state = cls(
            device_address=data.get("device_address", ""),
            led_type=data.get("led_type", 0),
        )
        for key, val in data.get("slots", {}).items():
            slot_num = int(key)
            state.slots[slot_num] = SlotInfo(
                slot=val.get("slot", slot_num),
                content_type=val.get("content_type", ""),
                label=val.get("label", ""),
                timestamp=val.get("timestamp", ""),
            )
        return state


class SlotManager:
    """Manages device slot state with Home Assistant storage persistence.

    Usage:
        manager = SlotManager(hass, device_address)
        await manager.async_load()

        # Before saving content:
        slot = manager.state.next_free_slot()
        if slot:
            manager.state.reserve(slot, "image", "My Photo")
            await manager.async_save()
            # ... then send reserve command + upload content

        # After deleting:
        manager.state.release(slot)
        await manager.async_save()
    """

    def __init__(self, hass: Any, device_address: str) -> None:
        self._hass = hass
        self._device_address = device_address
        self._store_key = f"ipixel_slots_{device_address.replace(':', '_')}"
        self.state = SlotState(device_address=device_address)

    async def async_load(self) -> None:
        """Load slot state from HA storage."""
        from homeassistant.helpers.storage import Store

        store = Store(self._hass, 1, self._store_key)
        data = await store.async_load()
        if data:
            self.state = SlotState.from_dict(data)
            _LOGGER.debug(
                "Loaded slot state for %s: %d slots occupied",
                self._device_address, self.state.occupied_count,
            )
        else:
            _LOGGER.debug("No saved slot state for %s", self._device_address)

    async def async_save(self) -> None:
        """Persist slot state to HA storage."""
        from homeassistant.helpers.storage import Store

        store = Store(self._hass, 1, self._store_key)
        await store.async_save(self.state.to_dict())
        _LOGGER.debug(
            "Saved slot state for %s: %d slots",
            self._device_address, self.state.occupied_count,
        )
