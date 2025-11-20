"""iPIXEL Color Bluetooth API client."""
from __future__ import annotations

import asyncio
import io
import logging
from typing import Any
from zlib import crc32

from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError
from PIL import Image, ImageDraw, ImageFont

from homeassistant.exceptions import HomeAssistantError

from .const import WRITE_UUID, NOTIFY_UUID, DEVICE_NAME_PREFIX, CONNECTION_TIMEOUT, RECONNECT_ATTEMPTS, RECONNECT_DELAY

_LOGGER = logging.getLogger(__name__)


class iPIXELError(HomeAssistantError):
    """Base iPIXEL error."""


class iPIXELConnectionError(iPIXELError):
    """iPIXEL connection error."""


class iPIXELTimeoutError(iPIXELError):
    """iPIXEL timeout error."""


class iPIXELAPI:
    """iPIXEL Color device API client."""

    def __init__(self, address: str) -> None:
        """Initialize the API client."""
        self._address = address
        self._client: BleakClient | None = None
        self._connected = False
        self._power_state = False
        self._device_info: dict[str, Any] | None = None
        
    async def connect(self) -> bool:
        """Connect to the iPIXEL device."""
        _LOGGER.debug("Connecting to iPIXEL device at %s", self._address)
        
        try:
            self._client = BleakClient(self._address)
            await asyncio.wait_for(
                self._client.connect(), timeout=CONNECTION_TIMEOUT
            )
            self._connected = True
            
            # Enable notifications
            await self._client.start_notify(NOTIFY_UUID, self._notification_handler)
            _LOGGER.info("Successfully connected to iPIXEL device")
            return True
            
        except asyncio.TimeoutError as err:
            _LOGGER.error("Connection timeout to %s: %s", self._address, err)
            raise iPIXELTimeoutError(f"Connection timeout: {err}") from err
        except BleakError as err:
            _LOGGER.error("Failed to connect to %s: %s", self._address, err)
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

    async def _send_command(self, command: bytes) -> bool:
        """Send command to the device and log any response."""
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
                await self._client.stop_notify(NOTIFY_UUID)
            
            return True
        except BleakError as err:
            _LOGGER.error("Failed to send command: %s", err)
            return False

    async def set_power(self, on: bool) -> bool:
        """Set device power state.
        
        Command format from protocol documentation:
        [5, 0, 7, 1, on_byte] where on_byte = 1 for on, 0 for off
        """
        on_byte = 1 if on else 0
        command = bytes([5, 0, 7, 1, on_byte])
        
        success = await self._send_command(command)
        if success:
            self._power_state = on
            _LOGGER.debug("Power set to %s", "ON" if on else "OFF")
        return success
    
    async def get_device_info(self) -> dict[str, Any] | None:
        """Query device information and store it."""
        if self._device_info is not None:
            return self._device_info
            
        try:
            # Send device info query command (from go-ipxl device_info.go)
            # Format: [8, 0, 1, 128, hour, minute, second, language]
            import time
            now = time.localtime()
            command = bytes([
                8,              # Command header
                0,              # Reserved 
                1,              # Sub-command
                128,            # 0x80 (corresponds to -128 in signed byte)
                now.tm_hour,    # Current hour
                now.tm_min,     # Current minute  
                now.tm_sec,     # Current second
                0               # Language (0 for default)
            ])
            
            # Set up notification response
            self._device_response = None
            response_received = asyncio.Event()
            
            def response_handler(sender: Any, data: bytearray) -> None:
                self._device_response = bytes(data)
                response_received.set()
            
            # Enable notifications temporarily
            await self._client.start_notify(NOTIFY_UUID, response_handler)
            
            try:
                # Send command
                await self._client.write_gatt_char(WRITE_UUID, command)
                
                # Wait for response (5 second timeout)
                await asyncio.wait_for(response_received.wait(), timeout=5.0)
                
                if self._device_response:
                    self._device_info = self._parse_device_response(self._device_response)
                else:
                    raise Exception("No response received")
                    
            finally:
                await self._client.stop_notify(NOTIFY_UUID)
            
            _LOGGER.info("Device info retrieved: %s", self._device_info)
            return self._device_info
            
        except Exception as err:
            _LOGGER.error("Failed to get device info: %s", err)
            # Return default values
            self._device_info = {
                "width": 64,
                "height": 16,
                "device_type": "Unknown", 
                "mcu_version": "Unknown",
                "wifi_version": "Unknown"
            }
            return self._device_info
    
    def _parse_device_response(self, response: bytes) -> dict[str, Any]:
        """Parse device info response (from go-ipxl parseDeviceInfo)."""
        if len(response) < 5:
            raise Exception(f"Response too short: got {len(response)} bytes, need at least 5")
        
        _LOGGER.debug("Device response: %s", response.hex())
        _LOGGER.info("Raw device response bytes: %s", [hex(b) for b in response])
        
        # Device type from byte 4
        device_type_byte = response[4]
        _LOGGER.info("Device type byte: %d (0x%02x)", device_type_byte, device_type_byte)
        
        # Device type mapping (exact copy from go-ipxl/consts.go deviceTypeMap)
        device_type_map = {
            129: 2,  # -127 -> Type 2 (32x32)
            128: 0,  # -128 -> Type 0 (64x64)
            130: 4,  # -126 -> Type 4 (32x16)
            131: 3,  # -125 -> Type 3 (64x16)
            132: 1,  # -124 -> Type 1 (96x16)
            133: 5,  # -123 -> Type 5 (64x20)
            134: 6,  # -122 -> Type 6 (128x32)
            135: 7,  # -121 -> Type 7 (144x16)
            136: 8,  # -120 -> Type 8 (192x16)
            137: 9,  # -119 -> Type 9 (48x24)
            138: 10, # -118 -> Type 10 (64x32)
            139: 11, # -117 -> Type 11 (96x32)
            140: 12, # -116 -> Type 12 (128x32)
            141: 13, # -115 -> Type 13 (96x32)
            142: 14, # -114 -> Type 14 (160x32)
            143: 15, # -113 -> Type 15 (192x32)
            144: 16, # -112 -> Type 16 (256x32)
            145: 17, # -111 -> Type 17 (320x32)
            146: 18, # -110 -> Type 18 (384x32)
            147: 19, # -109 -> Type 19 (448x32)
        }
        
        # LED size mapping (exact copy from go-ipxl/consts.go ledSizeMap) 
        led_size_map = {
            0:  [64, 64],  # Type 0
            1:  [96, 16],  # Type 1
            2:  [32, 32],  # Type 2
            3:  [64, 16],  # Type 3
            4:  [32, 16],  # Type 4
            5:  [64, 20],  # Type 5
            6:  [128, 32], # Type 6
            7:  [144, 16], # Type 7
            8:  [192, 16], # Type 8
            9:  [48, 24],  # Type 9
            10: [64, 32],  # Type 10
            11: [96, 32],  # Type 11
            12: [128, 32], # Type 12
            13: [96, 32],  # Type 13
            14: [160, 32], # Type 14
            15: [192, 32], # Type 15
            16: [256, 32], # Type 16
            17: [320, 32], # Type 17
            18: [384, 32], # Type 18
            19: [448, 32], # Type 19
        }
        
        led_type = device_type_map.get(device_type_byte, 0)
        width, height = led_size_map.get(led_type, [64, 64])
        
        device_info = {
            "width": width,
            "height": height,
            "device_type": f"Type {device_type_byte}",
        }
        
        # Parse version info if response is long enough
        if len(response) >= 8:
            # MCU Version (bytes 4-5)
            mcu_major = response[4]  
            mcu_minor = response[5]
            device_info["mcu_version"] = f"{mcu_major}.{mcu_minor:02d}"
            
            # WiFi Version (bytes 6-7)
            wifi_major = response[6]
            wifi_minor = response[7] 
            device_info["wifi_version"] = f"{wifi_major}.{wifi_minor:02d}"
        else:
            device_info["mcu_version"] = "Unknown"
            device_info["wifi_version"] = "Unknown"
            
        return device_info

    async def display_text(self, text: str) -> bool:
        """Display text as image using PIL."""
        try:
            # Get device dimensions
            device_info = await self.get_device_info()
            width = device_info["width"]
            height = device_info["height"]
            
            # Create image with device dimensions
            img = Image.new('RGB', (width, height), (0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Draw white text
            draw.text((2, 2), text, fill=(255, 255, 255))
            
            # Convert to PNG bytes
            png_buffer = io.BytesIO()
            img.save(png_buffer, format='PNG')
            png_data = png_buffer.getvalue()
            
            # Send as PNG following ipixel-ctrl write_data_png.py exactly
            data_size = len(png_data)
            data_crc = crc32(png_data) & 0xFFFFFFFF
            
            # 1. First exit program mode and enter default mode
            default_mode_command = self._make_command_payload(0x8003, bytes())  # Default mode
            _LOGGER.debug("Setting default mode to exit slideshow")
            await self._send_command(default_mode_command)
            #await asyncio.sleep(0.1)
            
            # 2. Enable DIY mode (mode 1 = enter and clear current, show new)
            diy_command = bytes([5, 0, 4, 1, 1])
            _LOGGER.debug("Sending DIY mode command: %s", diy_command.hex())
            diy_success = await self._send_command(diy_command)
            if not diy_success:
                _LOGGER.error("DIY mode command failed")
                return False
            
            # Small delay to let DIY mode activate
            #await asyncio.sleep(0.1)
            
            # 2. Build payload exactly like ipixel-ctrl
            payload = bytearray()
            payload.append(0x00)  # Fixed byte
            payload.extend(data_size.to_bytes(4, 'little'))  # Data size
            payload.extend(data_crc.to_bytes(4, 'little'))   # CRC32
            payload.append(0x00)  # Fixed byte  
            payload.append(0x01)  # Buffer number (screen 1)
            payload.extend(png_data)  # PNG data
            
            # 3. Build complete command
            command = bytearray()
            total_length = len(payload) + 4  # +4 for length(2) + command(2)
            command.extend(total_length.to_bytes(2, 'little'))  # Length
            command.extend([0x02, 0x00])  # Command 0x0002
            command.extend(payload)  # Payload
            
            _LOGGER.debug("Sending PNG command: length=%d, payload_size=%d", 
                         total_length, len(payload))
            _LOGGER.debug("PNG header: %s", command[:20].hex())
            
            success = await self._send_command(bytes(command))
            if success:
                _LOGGER.info("PNG sent: %s (%dx%d, %d bytes, CRC: 0x%08x, cmd_len: %d)", 
                           text, width, height, data_size, data_crc, len(command))
            else:
                _LOGGER.error("PNG command failed to send")
            return success
            
        except Exception as err:
            _LOGGER.error("Error displaying text: %s", err)
            return False

    def _make_command_payload(self, opcode: int, payload: bytes) -> bytes:
        """Create command with header (following ipixel-ctrl/common.py format)."""
        total_length = len(payload) + 4  # +4 for length and opcode
        
        command = bytearray()
        command.extend(total_length.to_bytes(2, 'little'))  # Length (little-endian)
        command.extend(opcode.to_bytes(2, 'little'))        # Opcode (little-endian)
        command.extend(payload)                             # Payload data
        
        return bytes(command)

    def _notification_handler(self, sender: Any, data: bytearray) -> None:
        """Handle notifications from the device."""
        _LOGGER.debug("Notification from %s: %s", sender, data.hex())
        # For this basic version, we just log notifications
        # Future versions will parse responses and update state

    @property
    def is_connected(self) -> bool:
        """Return True if connected to device."""
        return self._connected and self._client and self._client.is_connected

    @property
    def power_state(self) -> bool:
        """Return current power state."""
        return self._power_state

    @property
    def address(self) -> str:
        """Return device address."""
        return self._address


async def discover_ipixel_devices(timeout: int = 10) -> list[dict[str, Any]]:
    """Discover iPIXEL devices via Bluetooth scanning."""
    _LOGGER.debug("Starting iPIXEL device discovery")
    devices = []

    def detection_callback(device, advertisement_data):
        """Handle device detection."""
        if device.name and device.name.startswith(DEVICE_NAME_PREFIX):
            device_info = {
                "address": device.address,
                "name": device.name,
                "rssi": advertisement_data.rssi,
            }
            devices.append(device_info)
            _LOGGER.debug("Found iPIXEL device: %s", device_info)

    try:
        scanner = BleakScanner(detection_callback)
        await scanner.start()
        await asyncio.sleep(timeout)
        await scanner.stop()
        
        _LOGGER.debug("Discovery completed, found %d devices", len(devices))
        return devices
        
    except BleakError as err:
        _LOGGER.error("Discovery failed: %s", err)
        return []