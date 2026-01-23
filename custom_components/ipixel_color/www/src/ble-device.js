/**
 * WebBluetooth Device Bridge for iPIXEL
 * Allows direct connection to iPIXEL devices from the browser for testing
 * Based on iPixel-Control by nicehunter
 */

// BLE UUIDs for iPIXEL devices
const SERVICE_UUID = '000000fa-0000-1000-8000-00805f9b34fb';
const CHAR_UUID = '0000fa02-0000-1000-8000-00805f9b34fb';

// Connection state
let device = null;
let server = null;
let characteristic = null;
let isConnected = false;

// Event callbacks
const listeners = {
  connect: [],
  disconnect: [],
  error: []
};

/**
 * Check if WebBluetooth is available
 */
export function isWebBluetoothAvailable() {
  return navigator.bluetooth !== undefined;
}

/**
 * Check if currently connected
 */
export function isDeviceConnected() {
  return isConnected && device?.gatt?.connected;
}

/**
 * Get connected device name
 */
export function getDeviceName() {
  return device?.name || null;
}

/**
 * Add event listener
 */
export function addEventListener(event, callback) {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
}

/**
 * Remove event listener
 */
export function removeEventListener(event, callback) {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
}

/**
 * Emit event to listeners
 */
function emit(event, data) {
  if (listeners[event]) {
    listeners[event].forEach(cb => cb(data));
  }
}

/**
 * Connect to an iPIXEL device
 */
export async function connectDevice() {
  if (!isWebBluetoothAvailable()) {
    throw new Error('WebBluetooth is not available. Use Chrome or Edge.');
  }

  try {
    // Request device with LED_BLE_ prefix
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'LED_BLE_' }],
      optionalServices: [SERVICE_UUID]
    });

    console.log(`iPIXEL BLE: Found device: ${device.name}`);

    // Connect to GATT server
    server = await device.gatt.connect();
    console.log('iPIXEL BLE: Connected to GATT server');

    // Get service and characteristic
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHAR_UUID);
    console.log('iPIXEL BLE: Got characteristic');

    isConnected = true;

    // Handle disconnection
    device.addEventListener('gattserverdisconnected', () => {
      console.log('iPIXEL BLE: Device disconnected');
      isConnected = false;
      emit('disconnect', { device: device.name });
    });

    emit('connect', { device: device.name });
    return device.name;
  } catch (error) {
    console.error('iPIXEL BLE: Connection failed:', error);
    emit('error', { error });
    throw error;
  }
}

/**
 * Disconnect from device
 */
export async function disconnectDevice() {
  if (device?.gatt?.connected) {
    await device.gatt.disconnect();
  }
  isConnected = false;
  device = null;
  server = null;
  characteristic = null;
}

/**
 * Send raw command to device
 */
export async function sendCommand(data) {
  if (!isDeviceConnected() || !characteristic) {
    throw new Error('Not connected to device');
  }

  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  await characteristic.writeValue(uint8Data);
  console.log('iPIXEL BLE: Sent command:', Array.from(uint8Data).map(b => b.toString(16).padStart(2, '0')).join(' '));
}

/**
 * Power on the device
 */
export async function powerOn() {
  await sendCommand([0x05, 0x00, 0x07, 0x01, 0x01]);
}

/**
 * Power off the device
 */
export async function powerOff() {
  await sendCommand([0x05, 0x00, 0x07, 0x01, 0x00]);
}

/**
 * Set brightness (1-100)
 */
export async function setBrightness(value) {
  const brightness = Math.max(1, Math.min(100, value));
  await sendCommand([0x05, 0x00, 0x04, 0x80, brightness]);
}

/**
 * Sync time to device
 */
export async function syncTime() {
  const now = new Date();
  await sendCommand([
    0x08, 0x00, 0x01, 0x80,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    0x00
  ]);
}

/**
 * Enter DIY mode (for direct pixel control)
 */
export async function enterDiyMode() {
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x01]);
}

/**
 * Exit DIY mode
 */
export async function exitDiyMode() {
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x00]);
}

/**
 * Set a single pixel color
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 */
export async function setPixel(x, y, r, g, b) {
  await sendCommand([
    0x0A, 0x00, 0x05, 0x01,
    r, g, b, 0xFF,  // RGBA
    x, y            // Position
  ]);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Send pixel array to device (DIY mode)
 * @param {string[]} pixels - Array of hex color strings
 * @param {number} width - Display width
 * @param {number} height - Display height
 */
export async function sendPixels(pixels, width, height) {
  if (!isDeviceConnected()) {
    throw new Error('Not connected to device');
  }

  // Enter DIY mode first
  await enterDiyMode();
  await new Promise(r => setTimeout(r, 100));

  // Send each pixel that's not black
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = pixels[idx] || '#000000';
      const rgb = hexToRgb(color);

      // Skip dark pixels (background)
      if (rgb.r > 10 || rgb.g > 10 || rgb.b > 10) {
        await setPixel(x, y, rgb.r, rgb.g, rgb.b);
        // Small delay to prevent BLE buffer overflow
        await new Promise(r => setTimeout(r, 5));
      }
    }
  }

  console.log('iPIXEL BLE: Finished sending pixels');
}

/**
 * Clear display immediately
 */
export async function clearDisplay() {
  // Enter DIY mode and clear
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x01]); // Enter DIY
  await new Promise(r => setTimeout(r, 50));
  // The device clears when entering DIY mode with specific flag
}

/**
 * Delete a saved screen slot (1-10)
 */
export async function deleteScreen(slot) {
  const s = Math.max(1, Math.min(10, slot));
  // Erase data command: [length, 0x00, 0x02, 0x01, count_low, count_high, ...slots]
  await sendCommand([0x07, 0x00, 0x02, 0x01, 0x01, 0x00, s]);
}

/**
 * Set clock mode
 * @param {number} style - Clock style (1-8)
 * @param {boolean} format24 - Use 24-hour format
 * @param {boolean} showDate - Show date
 */
export async function setClockMode(style = 1, format24 = true, showDate = false) {
  const now = new Date();

  // First sync time
  await syncTime();
  await new Promise(r => setTimeout(r, 100));

  // Then set clock mode
  // Command: [0x0b, 0x00, 0x06, 0x01, style, is24h, showDate, year, month, day, weekday]
  await sendCommand([
    0x0B, 0x00, 0x06, 0x01,
    Math.max(1, Math.min(8, style)),
    format24 ? 0x01 : 0x00,
    showDate ? 0x01 : 0x00,
    now.getFullYear() % 100,
    now.getMonth() + 1,
    now.getDate(),
    now.getDay() || 7  // Sunday = 7, not 0
  ]);
}

/**
 * Set rhythm level mode (music visualization)
 * @param {number} style - Style (0-4)
 * @param {number[]} levels - Array of 11 level values (0-15 each)
 */
export async function setRhythmLevelMode(style = 0, levels = []) {
  // Default levels if not provided
  const l = levels.length === 11 ? levels : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Command structure for rhythm level
  const data = [
    0x11, 0x00, 0x08, 0x01,  // Header
    Math.max(0, Math.min(4, style)),
    ...l.map(v => Math.max(0, Math.min(15, v)))
  ];
  await sendCommand(data);
}

/**
 * Set rhythm animation mode
 * @param {number} style - Style (0-1)
 * @param {number} frame - Frame (0-7)
 */
export async function setRhythmAnimationMode(style = 0, frame = 0) {
  await sendCommand([
    0x06, 0x00, 0x09, 0x01,
    Math.max(0, Math.min(1, style)),
    Math.max(0, Math.min(7, frame))
  ]);
}

/**
 * Set orientation/rotation
 * @param {number} orientation - 0=normal, 1=180°, 2=mirror
 */
export async function setOrientation(orientation) {
  const o = Math.max(0, Math.min(2, orientation));
  await sendCommand([0x05, 0x00, 0x06, 0x80, o]);
}

/**
 * Select a saved screen slot to display
 * @param {number} slot - Screen slot (1-9)
 */
export async function selectScreen(slot) {
  const s = Math.max(1, Math.min(9, slot));
  await sendCommand([0x05, 0x00, 0x07, 0x80, s]);
}

/**
 * Set rainbow mode for text
 * @param {number} mode - Rainbow mode (0-9)
 *   0=None, 1=Wave, 2=Cycle, 3=Pulse, 4=Fade,
 *   5=Chase, 6=Sparkle, 7=Gradient, 8=Theater, 9=Fire
 */
export async function setRainbowMode(mode) {
  const m = Math.max(0, Math.min(9, mode));
  // Rainbow mode command based on iPixel-ESP32 protocol
  await sendCommand([0x05, 0x00, 0x0A, 0x01, m]);
}

/**
 * Send text with per-character colors
 * @param {string} text - Text to display
 * @param {Array<{r: number, g: number, b: number}>} colors - Array of RGB colors for each character
 */
export async function sendMulticolorText(text, colors) {
  if (!text || colors.length === 0) return;

  // Build the multicolor text command
  // Format: [length_lo, length_hi, 0x03, 0x01, char_count, ...char_data]
  // Each char_data: [char_code, r, g, b]
  const charData = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const color = colors[i % colors.length]; // Cycle colors if fewer than chars
    charData.push(charCode, color.r, color.g, color.b);
  }

  const length = 4 + charData.length; // header + char data
  const data = [
    length & 0xFF,
    (length >> 8) & 0xFF,
    0x03, 0x01,  // Multicolor text command
    text.length,
    ...charData
  ];

  await sendCommand(data);
}

/**
 * Send GFX pixel data (DIY mode)
 * @param {Array<{x: number, y: number, color: string}>} pixels - Array of pixel data
 */
export async function sendGfxPixels(pixels) {
  if (!pixels || pixels.length === 0) return;

  // Enter DIY mode first
  await enterDiyMode();
  await new Promise(r => setTimeout(r, 100));

  // Send each pixel
  for (const pixel of pixels) {
    const rgb = hexToRgb(pixel.color);
    if (rgb.r > 0 || rgb.g > 0 || rgb.b > 0) {
      await setPixel(pixel.x, pixel.y, rgb.r, rgb.g, rgb.b);
      await new Promise(r => setTimeout(r, 5));
    }
  }

  console.log('iPIXEL BLE: Finished sending GFX pixels');
}

// Export connection state for debugging
export function getConnectionState() {
  return {
    isConnected,
    deviceName: device?.name || null,
    hasCharacteristic: characteristic !== null
  };
}
