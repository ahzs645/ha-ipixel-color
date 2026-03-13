"""Bluetooth client management for iPIXEL Color devices."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, Optional, TYPE_CHECKING

from bleak.exc import BleakError
from bleak_retry_connector import (
    BleakClientWithServiceCache,
    establish_connection,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from homeassistant.components import bluetooth
try:
    from pypixelcolor.lib.transport.send_plan import SendPlan, send_plan as send_plan_pypixelcolor, single_window_plan
    from pypixelcolor.lib.transport.ack_manager import AckManager
    from pypixelcolor.lib.command_result import CommandResult
    from pypixelcolor.lib.device_info import DeviceInfo
except ImportError:
    SendPlan = None
    send_plan_pypixelcolor = None
    single_window_plan = None
    AckManager = None
    CommandResult = None
    DeviceInfo = None

from ..const import WRITE_UUID, NOTIFY_UUID
from ..exceptions import iPIXELConnectionError
from ..device.info import build_device_info_command, handle_device_info_response

_LOGGER = logging.getLogger(__name__)

# Windowed protocol constants
DEFAULT_CHUNK_SIZE = 244
DEFAULT_WINDOW_SIZE = 12 * 1024  # 12KB
DEFAULT_ACK_TIMEOUT = 30.0


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
        self._ack_mgr: Optional[AckManager] = None
        self._device_info: Optional[DeviceInfo] = None

    def _disconnected_callback(self, client: BleakClientWithServiceCache) -> None:
        """Called when device disconnects."""
        _LOGGER.warning("iPIXEL device %s disconnected", self._address)
        self._connected = False

    async def connect(self) -> DeviceInfo:
        """Connect to the iPIXEL device.

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

        except BleakError as err:
            _LOGGER.error("Failed to connect to %s: %s", self._address, err)
            raise iPIXELConnectionError(f"Connection failed: {err}") from err
        except Exception as err:
            _LOGGER.error("Unexpected error connecting to %s: %s", self._address, err)
            raise iPIXELConnectionError(f"Connection failed: {err}") from err

        self._connected = True
        _LOGGER.debug("Connected to %s, fetching device info", self._address)

        self._ack_mgr = AckManager()

        try:
            await self._client.start_notify(NOTIFY_UUID, self._ack_mgr.make_notify_handler())
        except Exception as e:
            _LOGGER.warning(f"Failed to enable notifications on {NOTIFY_UUID}: {e}")

        # Fetch device info immediately after connecting
        await self._fetch_device_info()

        if self._device_info:
            _LOGGER.info(f"Device info cached: {self._device_info.width}x{self._device_info.height} "
                        f"(Type {self._device_info.led_type})")
            return self._device_info
        else:
            raise RuntimeError("Failed to retrieve device info")


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
                self._ack_mgr = None
                self._device_info = None

    async def _fetch_device_info(self) -> None:
        """
        Internal method to fetch device info from the device.
        
        This is called automatically during connect().
        """
        
        if not self._client or not self._ack_mgr:
            raise RuntimeError("Client or AckManager not initialized")
        
        # Build and send the device info request
        payload = build_device_info_command()
        result = await self.send_command(
            "get_device_info_internal",
            payload,
            response_handler=handle_device_info_response
        )
        
        if result.data is None:
            raise RuntimeError("Failed to retrieve device info")
        
        self._device_info = result.data

    async def send_command(self, plan_id: str, data: bytes, response_handler: Optional[Callable[[Any, bytes], Awaitable[Any]]] = None, requires_ack=False) -> CommandResult:
        """Send a single command and optionally handle response.
        Args:
            plan_id: Identifier for the command type (used for logging)
            data: Command bytes to send
            response_handler: Optional async function to handle response notifications
        Returns:
            CommandResult containing success status and any response data

        Raises:
            ImportError: If pypixelcolor is not available
            iPIXELConnectionError: If not connected or command fails
        """
        if single_window_plan is None:
            raise ImportError("pypixelcolor library is not installed")
        
        plan = single_window_plan(
            plan_id=plan_id,
            data=data,
            requires_ack=requires_ack,
            response_handler=response_handler
        )
        return await self.send_plan(plan)


    async def send_plan(self, plan: SendPlan) -> CommandResult:
        """Send a SendPlan to the device.

        Args:
            plan: SendPlan object containing windows of command data

        Returns:
            True if plan sent successfully, False otherwise
        """
        if send_plan_pypixelcolor is None:
            raise ImportError("pypixelcolor library is not installed")
        
        return await send_plan_pypixelcolor(
            client=self._client,
            plan=plan,
            ack_mgr=self._ack_mgr,
            ack_timeout=DEFAULT_ACK_TIMEOUT,
        )

    @property
    def is_connected(self) -> bool:
        """Return True if connected to device."""
        return self._connected and self._client and self._client.is_connected

    @property
    def address(self) -> str:
        """Return device address."""
        return self._address
