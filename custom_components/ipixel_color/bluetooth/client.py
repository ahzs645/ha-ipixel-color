"""Bluetooth transport for iPIXEL Color devices.

Uses the Home Assistant Bluetooth stack (local adapters and ESPHome/Shelly
Bluetooth proxies) through ``bleak-retry-connector``. All writes are
serialised with a lock so that concurrent entity/service calls never
interleave their BLE windows, and the connection is (re)established on demand.
"""
from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable, Iterable
from typing import Any

from bleak.exc import BleakError
from bleak_retry_connector import (
    BleakClientWithServiceCache,
    BleakNotFoundError,
    establish_connection,
)
from homeassistant.components import bluetooth
from homeassistant.core import HomeAssistant, callback
from pypixelcolor.lib.command_result import CommandResult
from pypixelcolor.lib.device_info import DeviceInfo
from pypixelcolor.lib.transport.ack_manager import AckManager
from pypixelcolor.lib.transport.send_plan import SendPlan, single_window_plan

from ..const import (
    ACK_SECONDS_PER_KB,
    AUTO_RECONNECT_INTERVAL,
    BLE_CHUNK_SIZE,
    BLE_MIN_CHUNK_SIZE,
    BLE_PROXY_CHUNK_SIZE,
    DEFAULT_ACK_TIMEOUT,
    MAX_CONNECT_ATTEMPTS,
    NOTIFY_UUID,
    WRITE_UUID,
)
from ..device.info import build_device_info_command, handle_device_info_response
from ..exceptions import iPIXELConnectionError, iPIXELError, iPIXELTimeoutError

_LOGGER = logging.getLogger(__name__)

ResponseHandler = Callable[[Any, bytes], Awaitable[Any]]


def _chunk_bytes(buf: bytes, size: int) -> Iterable[bytes]:
    """Yield ``buf`` in pieces of at most ``size`` bytes."""
    for pos in range(0, len(buf), size):
        yield buf[pos : pos + size]


class BluetoothClient:
    """Manages the BLE connection to a single iPIXEL panel."""

    def __init__(
        self,
        hass: HomeAssistant,
        address: str,
        *,
        name: str | None = None,
        ack_timeout: float = DEFAULT_ACK_TIMEOUT,
        size_override: tuple[int, int] | None = None,
        chunk_size: int | None = None,
    ) -> None:
        """Initialise the client.

        ``chunk_size`` forces the BLE write size; by default it depends on
        whether the panel is reached through a local adapter or a Bluetooth
        proxy, and it is halved automatically when bulk writes keep failing.
        """
        self._hass = hass
        self._address = address
        self._name = name or address
        self._ack_timeout = ack_timeout
        self._size_override = size_override
        self._chunk_override = int(chunk_size) if chunk_size else None
        self._chunk_limit: int | None = self._chunk_override

        self._client: BleakClientWithServiceCache | None = None
        self._ack = AckManager()
        self._ack_handler = self._ack.make_notify_handler()
        self._response_future: asyncio.Future[bytes] | None = None
        self._connect_lock = asyncio.Lock()
        self._op_lock = asyncio.Lock()
        self._device_info: DeviceInfo | None = None
        self._listeners: list[Callable[[], None]] = []
        self._reconnect_listeners: list[Callable[[], None]] = []
        self._advertisement_unsub: Callable[[], None] | None = None
        self._last_auto_connect = 0.0

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------
    @property
    def address(self) -> str:
        """Return the Bluetooth address."""
        return self._address

    @property
    def name(self) -> str:
        """Return the device name used for logging."""
        return self._name

    @property
    def is_connected(self) -> bool:
        """Return True when the BLE link is up."""
        return bool(self._client is not None and self._client.is_connected)

    @property
    def device_info(self) -> DeviceInfo | None:
        """Return the cached device info (kept across reconnects)."""
        return self._device_info

    @property
    def chunk_size(self) -> int:
        """Return the current maximum BLE write size."""
        return self._chunk_limit or BLE_CHUNK_SIZE

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        """Register a callback for connection state changes."""
        self._listeners.append(listener)

        def _remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return _remove

    def _notify_listeners(self) -> None:
        for listener in list(self._listeners):
            try:
                listener()
            except Exception:  # noqa: BLE001 - never let a listener break the client
                _LOGGER.exception("Error in connection listener for %s", self._address)

    @callback
    def async_add_reconnect_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        """Register a callback for connections made automatically after the panel reappeared."""
        self._reconnect_listeners.append(listener)

        def _remove() -> None:
            if listener in self._reconnect_listeners:
                self._reconnect_listeners.remove(listener)

        return _remove

    # ------------------------------------------------------------------
    # Automatic reconnection
    # ------------------------------------------------------------------
    @callback
    def _async_watch_advertisements(self) -> None:
        """Reconnect as soon as the panel advertises again after a dropped link."""
        if self._advertisement_unsub is not None:
            return
        self._advertisement_unsub = bluetooth.async_register_callback(
            self._hass,
            self._async_advertisement_seen,
            bluetooth.BluetoothCallbackMatcher(address=self._address, connectable=True),
            bluetooth.BluetoothScanningMode.ACTIVE,
        )

    @callback
    def _async_stop_watching(self) -> None:
        if self._advertisement_unsub is not None:
            self._advertisement_unsub()
            self._advertisement_unsub = None

    @callback
    def _async_advertisement_seen(self, _service_info: Any, _change: Any) -> None:
        if self.is_connected or self._connect_lock.locked():
            return
        now = time.monotonic()
        if now - self._last_auto_connect < AUTO_RECONNECT_INTERVAL:
            return
        self._last_auto_connect = now
        _LOGGER.debug("%s advertises again; reconnecting", self._address)
        self._hass.async_create_task(self._async_auto_connect())

    async def _async_auto_connect(self) -> None:
        try:
            await self.async_connect()
        except iPIXELError as err:
            _LOGGER.debug("Automatic reconnect to %s failed: %s", self._address, err)
            return
        except Exception:  # noqa: BLE001 - a background attempt must never leave a stray traceback
            _LOGGER.exception("Unexpected error while reconnecting to %s", self._address)
            return
        _LOGGER.info("Reconnected to %s (%s) after it reappeared", self._name, self._address)
        for listener in list(self._reconnect_listeners):
            try:
                listener()
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Error in reconnect listener for %s", self._address)

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------
    async def async_connect(self) -> DeviceInfo:
        """Connect (if needed) and return the device info."""
        async with self._connect_lock:
            self._async_watch_advertisements()
            if self.is_connected and self._device_info is not None:
                return self._device_info

            await self._async_close_locked()

            ble_device = bluetooth.async_ble_device_from_address(
                self._hass, self._address, connectable=True
            )
            if ble_device is None:
                raise iPIXELConnectionError(
                    f"iPIXEL device {self._address} is not currently reachable via "
                    "the Home Assistant Bluetooth stack (out of range, powered off, "
                    "or no connectable adapter/proxy available)"
                )

            if self._chunk_limit is None:
                self._chunk_limit = self._default_chunk_limit()
            _LOGGER.debug(
                "Connecting to %s (%s), %d byte writes", self._name, self._address, self._chunk_limit
            )
            try:
                client = await establish_connection(
                    BleakClientWithServiceCache,
                    ble_device,
                    self._name,
                    disconnected_callback=self._on_disconnected,
                    max_attempts=MAX_CONNECT_ATTEMPTS,
                    use_services_cache=True,
                )
            except BleakNotFoundError as err:
                raise iPIXELConnectionError(
                    f"iPIXEL device {self._address} not found: {err}"
                ) from err
            except (TimeoutError, BleakError, OSError) as err:
                raise iPIXELConnectionError(
                    f"Failed to connect to iPIXEL device {self._address}: {err}"
                ) from err

            self._client = client

            try:
                await client.start_notify(NOTIFY_UUID, self._on_notify)
            except (TimeoutError, BleakError) as err:
                _LOGGER.warning(
                    "Could not enable notifications on %s: %s (ACKs will time out)",
                    self._address,
                    err,
                )

            try:
                info = await self._async_fetch_device_info()
            except (TimeoutError, BleakError, OSError) as err:
                await self._async_close_locked()
                raise iPIXELConnectionError(
                    f"Connected to iPIXEL device {self._address} but could not read its device info: {err}"
                ) from err
            except Exception:
                await self._async_close_locked()
                raise

            self._device_info = info
            _LOGGER.info(
                "Connected to %s (%s): %dx%d pixels",
                self._name,
                self._address,
                info.width,
                info.height,
            )
            self._notify_listeners()
            return info

    def _default_chunk_limit(self) -> int:
        """Pick the write size for the path the panel is reached through."""
        info = bluetooth.async_last_service_info(self._hass, self._address, connectable=True)
        if info is not None:
            scanner = bluetooth.async_scanner_by_source(self._hass, info.source)
            if isinstance(scanner, bluetooth.BaseHaRemoteScanner):
                _LOGGER.debug("%s is reached via Bluetooth proxy %s", self._address, info.source)
                return BLE_PROXY_CHUNK_SIZE
        return BLE_CHUNK_SIZE

    def _reduce_chunk_size(self) -> bool:
        """Halve the write size after a failed bulk write; False when at the minimum."""
        current = self.chunk_size
        if current <= BLE_MIN_CHUNK_SIZE:
            return False
        self._chunk_limit = max(BLE_MIN_CHUNK_SIZE, current // 2)
        return True

    async def async_disconnect(self) -> None:
        """Disconnect from the device and stop reconnecting automatically."""
        async with self._connect_lock:
            self._async_stop_watching()
            await self._async_close_locked()
        self._notify_listeners()

    async def _async_close_locked(self) -> None:
        client = self._client
        self._client = None
        if client is None:
            return
        try:
            if client.is_connected:
                try:
                    await client.stop_notify(NOTIFY_UUID)
                except (TimeoutError, BleakError):
                    pass
                await client.disconnect()
        except (TimeoutError, BleakError, OSError) as err:
            _LOGGER.debug("Error while disconnecting from %s: %s", self._address, err)

    def _on_disconnected(self, _client: BleakClientWithServiceCache) -> None:
        """Handle an unexpected disconnect from the device."""
        _LOGGER.debug("iPIXEL device %s disconnected", self._address)
        future = self._response_future
        if future is not None and not future.done():
            future.set_exception(iPIXELConnectionError("Device disconnected"))
        # Wake up anybody waiting on an ACK so they fail fast.
        self._ack.window_event.set()
        self._ack.all_event.set()
        self._notify_listeners()

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------
    def _on_notify(self, _char: Any, data: bytearray) -> None:
        payload = bytes(data)
        _LOGGER.debug("Notify from %s: %s", self._address, payload.hex())
        future = self._response_future
        if future is not None and not future.done():
            # The first frame after a request expecting a response is that
            # response (matches the behaviour of pypixelcolor).
            future.set_result(payload)
            return
        self._ack_handler(_char, payload)

    async def _async_fetch_device_info(self) -> DeviceInfo:
        plan = single_window_plan(
            "get_device_info",
            build_device_info_command(),
            requires_ack=False,
            response_handler=handle_device_info_response,
        )
        async with self._op_lock:
            result = await self._async_send_locked(plan)
        if result.data is None:
            raise iPIXELConnectionError("Device did not report its device info")
        info: DeviceInfo = result.data
        if self._size_override is not None:
            width, height = self._size_override
            _LOGGER.debug(
                "Overriding detected size %dx%d with %dx%d for %s",
                info.width,
                info.height,
                width,
                height,
                self._address,
            )
            info.width = width
            info.height = height
        return info

    # ------------------------------------------------------------------
    # Sending
    # ------------------------------------------------------------------
    async def async_send_command(
        self,
        plan_id: str,
        data: bytes,
        *,
        requires_ack: bool = False,
        response_handler: ResponseHandler | None = None,
    ) -> CommandResult:
        """Send a single-window command."""
        plan = single_window_plan(
            plan_id,
            data,
            requires_ack=requires_ack,
            response_handler=response_handler,
        )
        return await self.async_send_plan(plan)

    async def async_send_plan(self, plan: SendPlan) -> CommandResult:
        """Send a (possibly multi-window) plan, connecting first if needed.

        A failed multi-packet write (typically GATT error 133 through a
        Bluetooth proxy) is retried with half the write size, down to the
        minimum, before the error is reported.
        """
        while True:
            await self.async_connect()
            async with self._op_lock:
                try:
                    return await self._async_send_locked(plan)
                except (BleakError, OSError) as err:
                    chunked = any(len(window.data) > BLE_MIN_CHUNK_SIZE for window in plan.windows)
                    if chunked and self._reduce_chunk_size():
                        _LOGGER.warning(
                            "BLE error while sending '%s' to %s: %s; retrying with %d byte writes",
                            plan.id,
                            self._address,
                            err,
                            self.chunk_size,
                        )
                        continue
                    _LOGGER.warning(
                        "BLE error while sending '%s' to %s: %s", plan.id, self._address, err
                    )
                    raise iPIXELConnectionError(
                        f"BLE error while sending '{plan.id}' to {self._address}: {err}"
                    ) from err

    async def _async_send_locked(self, plan: SendPlan) -> CommandResult:
        client = self._client
        if client is None or not client.is_connected:
            raise iPIXELConnectionError(f"Not connected to {self._address}")

        chunk_size = self._chunk_size(client, plan.chunk_size)
        loop = asyncio.get_running_loop()
        expects_response = plan.response_handler is not None
        if expects_response:
            self._response_future = loop.create_future()

        _LOGGER.debug("Sending plan '%s' to %s (chunk=%d)", plan.id, self._address, chunk_size)
        try:
            for index, window in enumerate(plan.windows):
                self._ack.reset()
                for piece in _chunk_bytes(window.data, chunk_size):
                    await client.write_gatt_char(WRITE_UUID, piece, response=True)
                if plan.ack_policy.ack_per_window and window.requires_ack:
                    await self._async_wait(
                        self._ack.window_event.wait(),
                        f"window {index + 1} of '{plan.id}'",
                        timeout=self._upload_timeout(len(window.data)),
                    )

            if plan.ack_policy.ack_final:
                await self._async_wait(
                    self._ack.all_event.wait(),
                    f"final ACK of '{plan.id}'",
                    timeout=self._upload_timeout(sum(len(w.data) for w in plan.windows)),
                )

            if expects_response and self._response_future is not None:
                data = await self._async_wait(self._response_future, f"response to '{plan.id}'")
                assert plan.response_handler is not None
                parsed = await plan.response_handler(client, data)
                return CommandResult(success=True, data=parsed)

            return CommandResult(success=True)
        finally:
            future = self._response_future
            self._response_future = None
            if future is not None and future.done() and not future.cancelled():
                # A disconnect may have failed the future while the write itself
                # raised; retrieving the exception keeps asyncio from logging it.
                future.exception()

    def _upload_timeout(self, size: int) -> float:
        """ACK timeout that grows with the amount of data the panel has to process."""
        return self._ack_timeout + size / 1024 * ACK_SECONDS_PER_KB

    async def _async_wait(self, awaitable: Awaitable[Any], what: str, *, timeout: float | None = None) -> Any:
        try:
            result = await asyncio.wait_for(awaitable, timeout=timeout or self._ack_timeout)
        except TimeoutError as err:
            raise iPIXELTimeoutError(
                f"Timeout waiting for {what} from {self._address}"
            ) from err
        if not self.is_connected:
            raise iPIXELConnectionError(f"Connection to {self._address} was lost")
        return result

    def _chunk_size(self, client: BleakClientWithServiceCache, requested: int) -> int:
        """Pick a chunk size that fits the negotiated MTU and the current limit."""
        try:
            mtu = int(client.mtu_size)
        except Exception:  # noqa: BLE001 - backend specific
            mtu = 0
        size = min(requested or BLE_CHUNK_SIZE, self.chunk_size)
        if mtu > 3:
            size = min(size, mtu - 3)
        return max(BLE_MIN_CHUNK_SIZE, min(size, BLE_CHUNK_SIZE))
