"""Bluetooth client management for iPIXEL Color devices."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, TYPE_CHECKING

from bleak.exc import BleakError
from bleak_retry_connector import (
    BleakClientWithServiceCache,
    establish_connection,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from homeassistant.components import bluetooth

from ..const import WRITE_UUID, NOTIFY_UUID
from ..exceptions import iPIXELConnectionError

_LOGGER = logging.getLogger(__name__)

# Windowed protocol constants
DEFAULT_CHUNK_SIZE = 244
DEFAULT_WINDOW_SIZE = 12 * 1024  # 12KB
DEFAULT_ACK_TIMEOUT = 8.0


class BleAckManager:
    """Manages ACK events for windowed BLE protocol.

    The iPIXEL device sends ACK notifications:
    - 5-byte frame with data[0]=0x05
    - data[4] in (0, 1): Window ACK (current window received)
    - data[4] == 3: Final ACK (all data received)
    """

    def __init__(self) -> None:
        """Initialize ACK manager."""
        self.window_event = asyncio.Event()
        self.all_event = asyncio.Event()

    def reset(self) -> None:
        """Reset all events for new transfer."""
        self.window_event.clear()
        self.all_event.clear()

    def handle_notification(self, data: bytes) -> None:
        """Process notification data for ACK signals.

        Args:
            data: Notification data bytes
        """
        if not data or len(data) < 5:
            return

        if data[0] == 0x05:
            ack_code = data[4]
            if ack_code in (0, 1):
                # Window ACK
                self.window_event.set()
                _LOGGER.debug("Window ACK received (code=%d)", ack_code)
            elif ack_code == 3:
                # Final ACK
                self.window_event.set()
                self.all_event.set()
                _LOGGER.debug("Final ACK received")


class BluetoothClient:
    """Manages Bluetooth connection and communication."""

    def __init__(self, hass: HomeAssistant, address: str) -> None:
        """Initialize Bluetooth client.

        Args:
            hass: Home Assistant instance
            address: Bluetooth MAC address
        """
        self._hass = hass
        self._address = address
        self._client: BleakClientWithServiceCache | None = None
        self._connected = False
        self._notification_handler: Callable | None = None

    def _disconnected_callback(self, client: BleakClientWithServiceCache) -> None:
        """Called when device disconnects."""
        _LOGGER.warning("iPIXEL device %s disconnected", self._address)
        self._connected = False

    async def connect(self, notification_handler: Callable[[Any, bytearray], None]) -> bool:
        """Connect to the iPIXEL device.

        Args:
            notification_handler: Callback for device notifications

        Returns:
            True if connected successfully

        Raises:
            iPIXELConnectionError: If connection fails
        """
        _LOGGER.debug("Connecting to iPIXEL device at %s", self._address)

        try:
            # Get BLEDevice from Home Assistant's Bluetooth integration
            ble_device = bluetooth.async_ble_device_from_address(
                self._hass, self._address, connectable=True
            )

            if not ble_device:
                raise iPIXELConnectionError(
                    f"Device {self._address} not found. "
                    "Ensure the device is powered on and in range."
                )

            # Use establish_connection with service caching for reliable connection
            # This handles retries, timeouts, and works with Bluetooth proxies
            _LOGGER.debug("Establishing connection to %s using bleak-retry-connector", self._address)
            self._client = await establish_connection(
                BleakClientWithServiceCache,
                ble_device,
                ble_device.name or "iPIXEL Display",
                disconnected_callback=self._disconnected_callback,
                max_attempts=3,
            )

            self._connected = True

            # Store and enable notifications
            self._notification_handler = notification_handler
            await self._client.start_notify(NOTIFY_UUID, notification_handler)
            _LOGGER.info("Successfully connected to iPIXEL device")
            return True

        except BleakError as err:
            _LOGGER.error("Failed to connect to %s: %s", self._address, err)
            raise iPIXELConnectionError(f"Connection failed: {err}") from err
        except Exception as err:
            _LOGGER.error("Unexpected error connecting to %s: %s", self._address, err)
            raise iPIXELConnectionError(f"Connection failed: {err}") from err

    async def disconnect(self) -> None:
        """Disconnect from the device."""
        if self._client and self._connected:
            try:
                await self._client.stop_notify(NOTIFY_UUID)
                await self._client.disconnect()
                _LOGGER.debug("Disconnected from iPIXEL device")
            except BleakError as err:
                _LOGGER.error("Error during disconnect: %s", err)
            finally:
                self._connected = False
                self._client = None  # Don't reuse client - create fresh for next connection

    async def send_command(self, command: bytes) -> bool:
        """Send command to the device and log any response.

        Args:
            command: Command bytes to send

        Returns:
            True if command was sent successfully

        Raises:
            iPIXELConnectionError: If not connected
        """
        if not self._connected or not self._client:
            raise iPIXELConnectionError("Device not connected")

        try:
            # Set up temporary response capture
            response_data = []
            response_received = asyncio.Event()

            def response_handler(sender: Any, data: bytearray) -> None:
                response_data.append(bytes(data))
                response_received.set()
                _LOGGER.info("Device response: %s", data.hex())

            # Stop existing notifications first to avoid "already enabled" error
            try:
                await self._client.stop_notify(NOTIFY_UUID)
            except (KeyError, BleakError) as e:
                # No callback was registered yet, which is fine
                _LOGGER.debug("Could not stop notifications (not started): %s", e)

            # Enable notifications to capture response
            await self._client.start_notify(NOTIFY_UUID, response_handler)

            try:
                _LOGGER.debug("Sending command: %s", command.hex())
                await self._client.write_gatt_char(WRITE_UUID, command)

                # Wait for response with short timeout
                try:
                    await asyncio.wait_for(response_received.wait(), timeout=2.0)
                    if response_data:
                        _LOGGER.info("Command response received: %s", response_data[-1].hex())
                    else:
                        _LOGGER.debug("No response received within timeout")
                except asyncio.TimeoutError:
                    _LOGGER.debug("No response received within 2 seconds")

            finally:
                # Restore the original notification handler
                try:
                    await self._client.stop_notify(NOTIFY_UUID)
                except (KeyError, BleakError) as e:
                    _LOGGER.debug("Could not stop notifications in cleanup: %s", e)

                if self._notification_handler:
                    try:
                        await self._client.start_notify(NOTIFY_UUID, self._notification_handler)
                    except BleakError as e:
                        _LOGGER.warning("Could not restart original notification handler: %s", e)

            return True
        except BleakError as err:
            _LOGGER.error("Failed to send command: %s", err)
            return False

    async def send_windowed_command(
        self,
        windows: list[dict],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        ack_timeout: float = DEFAULT_ACK_TIMEOUT
    ) -> bool:
        """Send large data using windowed ACK protocol.

        This is used for GIF and large image transfers where the device
        expects 12KB windows with ACK after each window.

        Args:
            windows: List of window dicts with 'data' key containing bytes
            chunk_size: Size of BLE chunks within each window (default 244)
            ack_timeout: Timeout waiting for ACK (default 8 seconds)

        Returns:
            True if all windows sent successfully

        Raises:
            iPIXELConnectionError: If not connected or transfer fails
        """
        if not self._connected or not self._client:
            raise iPIXELConnectionError("Device not connected")

        ack_mgr = BleAckManager()

        # Set up ACK notification handler
        def ack_handler(sender: Any, data: bytearray) -> None:
            ack_mgr.handle_notification(bytes(data))

        try:
            # Stop existing notifications and start ACK handler
            try:
                await self._client.stop_notify(NOTIFY_UUID)
            except (KeyError, BleakError):
                pass

            await self._client.start_notify(NOTIFY_UUID, ack_handler)

            # Send each window
            for i, window in enumerate(windows):
                window_data = window['data']
                is_last = window.get('is_last', i == len(windows) - 1)

                ack_mgr.window_event.clear()

                _LOGGER.debug(
                    "Sending window %d/%d (%d bytes)",
                    i + 1, len(windows), len(window_data)
                )

                # Send window in chunks
                pos = 0
                while pos < len(window_data):
                    end = min(pos + chunk_size, len(window_data))
                    chunk = window_data[pos:end]
                    await self._client.write_gatt_char(WRITE_UUID, chunk, response=True)
                    pos = end

                # Wait for window ACK
                try:
                    await asyncio.wait_for(
                        ack_mgr.window_event.wait(),
                        timeout=ack_timeout
                    )
                except asyncio.TimeoutError:
                    _LOGGER.error(
                        "Timeout waiting for window %d ACK",
                        i + 1
                    )
                    raise iPIXELConnectionError(
                        f"No ACK received for window {i + 1}"
                    )

            # Wait for final ACK
            try:
                await asyncio.wait_for(
                    ack_mgr.all_event.wait(),
                    timeout=ack_timeout
                )
                _LOGGER.debug("All windows sent and acknowledged")
            except asyncio.TimeoutError:
                # Final ACK timeout is not always fatal
                _LOGGER.debug("Final ACK timeout (may be normal)")

            return True

        except BleakError as err:
            _LOGGER.error("BLE error during windowed send: %s", err)
            raise iPIXELConnectionError(f"Windowed send failed: {err}") from err

        finally:
            # Restore original notification handler
            try:
                await self._client.stop_notify(NOTIFY_UUID)
            except (KeyError, BleakError):
                pass

            if self._notification_handler:
                try:
                    await self._client.start_notify(
                        NOTIFY_UUID,
                        self._notification_handler
                    )
                except BleakError as e:
                    _LOGGER.warning(
                        "Could not restore notification handler: %s", e
                    )

    async def send_chunked_command(
        self,
        data: bytes,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        window_size: int = DEFAULT_WINDOW_SIZE,
        ack_timeout: float = DEFAULT_ACK_TIMEOUT
    ) -> bool:
        """Send data using chunked protocol with window ACKs.

        Similar to windowed protocol but works with raw bytes,
        automatically splitting into windows.

        Args:
            data: Raw bytes to send
            chunk_size: Size of BLE chunks (default 244)
            window_size: Size of each window (default 12KB)
            ack_timeout: Timeout waiting for ACK (default 8 seconds)

        Returns:
            True if data sent successfully
        """
        if not self._connected or not self._client:
            raise iPIXELConnectionError("Device not connected")

        ack_mgr = BleAckManager()

        def ack_handler(sender: Any, data: bytearray) -> None:
            ack_mgr.handle_notification(bytes(data))

        try:
            try:
                await self._client.stop_notify(NOTIFY_UUID)
            except (KeyError, BleakError):
                pass

            await self._client.start_notify(NOTIFY_UUID, ack_handler)

            total = len(data)
            pos = 0
            window_index = 0

            while pos < total:
                window_end = min(pos + window_size, total)
                ack_mgr.window_event.clear()

                _LOGGER.debug(
                    "Sending window %d (bytes %d-%d of %d)",
                    window_index + 1, pos, window_end, total
                )

                # Send window in chunks
                chunk_pos = pos
                while chunk_pos < window_end:
                    end = min(chunk_pos + chunk_size, window_end)
                    chunk = data[chunk_pos:end]
                    await self._client.write_gatt_char(WRITE_UUID, chunk, response=True)
                    chunk_pos = end

                # Wait for window ACK
                try:
                    await asyncio.wait_for(
                        ack_mgr.window_event.wait(),
                        timeout=ack_timeout
                    )
                except asyncio.TimeoutError:
                    _LOGGER.error("Timeout waiting for window %d ACK", window_index + 1)
                    raise iPIXELConnectionError(f"No ACK for window {window_index + 1}")

                window_index += 1
                pos = window_end

            # Wait for final ACK
            try:
                await asyncio.wait_for(ack_mgr.all_event.wait(), timeout=ack_timeout)
            except asyncio.TimeoutError:
                _LOGGER.debug("Final ACK timeout (may be normal)")

            return True

        except BleakError as err:
            _LOGGER.error("BLE error during chunked send: %s", err)
            raise iPIXELConnectionError(f"Chunked send failed: {err}") from err

        finally:
            try:
                await self._client.stop_notify(NOTIFY_UUID)
            except (KeyError, BleakError):
                pass

            if self._notification_handler:
                try:
                    await self._client.start_notify(NOTIFY_UUID, self._notification_handler)
                except BleakError as e:
                    _LOGGER.warning("Could not restore notification handler: %s", e)

    @property
    def is_connected(self) -> bool:
        """Return True if connected to device."""
        return self._connected and self._client and self._client.is_connected

    @property
    def address(self) -> str:
        """Return device address."""
        return self._address
