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

// BLE operation lock to prevent concurrent GATT operations
let bleLock = Promise.resolve();
let lockCount = 0;

/**
 * Execute a BLE operation with lock to prevent concurrent GATT operations
 */
async function withBleLock(fn) {
  const myLockId = ++lockCount;
  const currentLock = bleLock;
  let resolve;
  bleLock = new Promise(r => resolve = r);

  // Add timeout to prevent deadlock
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('BLE lock timeout')), 5000)
  );

  try {
    await Promise.race([currentLock, timeout]);
  } catch (e) {
    console.warn(`iPIXEL BLE: Lock ${myLockId} timeout waiting, proceeding anyway`);
  }

  try {
    return await fn();
  } catch (e) {
    console.error(`iPIXEL BLE: Error in locked operation ${myLockId}:`, e);
    throw e;
  } finally {
    resolve();
  }
}

/**
 * Reset the BLE lock (use if lock gets stuck)
 */
export function resetBleLock() {
  bleLock = Promise.resolve();
  lockCount = 0;
  console.log('iPIXEL BLE: Lock reset');
}

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
 * Get device dimensions from device name (e.g., "LED_BLE_96x16" -> {width: 96, height: 16})
 * @returns {{width: number, height: number}|null}
 */
export function getDeviceDimensions() {
  const name = device?.name;
  if (!name) return null;

  // Parse dimensions from name like "LED_BLE_96x16" or "LED_BLE_64x16"
  const match = name.match(/(\d+)x(\d+)/i);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10)
    };
  }
  return null;
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
 * Send raw command to device (with lock to prevent concurrent GATT operations)
 */
export async function sendCommand(data) {
  return withBleLock(async () => {
    if (!isDeviceConnected() || !characteristic) {
      throw new Error('Not connected to device');
    }

    const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
    await characteristic.writeValue(uint8Data);
    console.log('iPIXEL BLE: Sent command:', Array.from(uint8Data).map(b => b.toString(16).padStart(2, '0')).join(' '));
  });
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
 * Command format from pypixelcolor: [10, 0, 5, 1, 0, R, G, B, x, y]
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 */
export async function setPixel(x, y, r, g, b) {
  await sendCommand([
    0x0A, 0x00, 0x05, 0x01,
    0x00,           // Reserved byte
    r, g, b,        // RGB color
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

  console.log(`iPIXEL BLE: sendPixels called with ${pixels.length} pixels, ${width}x${height}`);

  // Count non-black pixels first
  let nonBlackCount = 0;
  const pixelsToSend = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = pixels[idx] || '#000000';
      const rgb = hexToRgb(color);

      // Skip dark pixels (background)
      if (rgb.r > 10 || rgb.g > 10 || rgb.b > 10) {
        nonBlackCount++;
        pixelsToSend.push({ x, y, r: rgb.r, g: rgb.g, b: rgb.b, color });
      }
    }
  }

  console.log(`iPIXEL BLE: Found ${nonBlackCount} non-black pixels to send`);

  if (nonBlackCount === 0) {
    console.log('iPIXEL BLE: No pixels to send (all black)');
    return;
  }

  // Log first few pixels for debugging
  console.log('iPIXEL BLE: First 5 pixels:', pixelsToSend.slice(0, 5));

  // Enter DIY mode first
  console.log('iPIXEL BLE: Entering DIY mode...');
  await enterDiyMode();
  await new Promise(r => setTimeout(r, 100));

  // Send each pixel
  console.log('iPIXEL BLE: Sending pixels...');
  let sentCount = 0;
  for (const pixel of pixelsToSend) {
    await setPixel(pixel.x, pixel.y, pixel.r, pixel.g, pixel.b);
    sentCount++;
    // Delay between pixels - device needs time to process
    await new Promise(r => setTimeout(r, 50));

    // Log progress every 20 pixels
    if (sentCount % 20 === 0) {
      console.log(`iPIXEL BLE: Sent ${sentCount}/${nonBlackCount} pixels`);
    }
  }

  console.log(`iPIXEL BLE: Finished sending ${sentCount} pixels`);
}

/**
 * Send pixels and then exit DIY mode to "commit" them
 */
export async function sendPixelsAndCommit(pixels, width, height) {
  await sendPixels(pixels, width, height);

  // Wait a moment then exit DIY mode to commit
  await new Promise(r => setTimeout(r, 200));

  // Exit DIY mode with option 2: keep current display
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x02]);
  console.log('iPIXEL BLE: Exited DIY mode (committed)');
}

/**
 * Send batch of pixels with the same color (faster than individual setPixel calls)
 * Command format from go-ipxl: [length, 0, 5, 1, 0, R, G, B, x1, y1, x2, y2, ...]
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {Array<{x: number, y: number}>} positions - Array of {x, y} positions
 */
export async function setBatchPixels(r, g, b, positions) {
  if (positions.length === 0) return;

  // Build position bytes
  const posBytes = [];
  for (const pos of positions) {
    posBytes.push(pos.x, pos.y);
  }

  // Command format from go-ipxl: [len, 0, 5, 1, 0, R, G, B, positions...]
  // Header is 8 bytes, then positions
  const totalLen = 8 + posBytes.length;
  const command = [
    totalLen & 0xFF,  // Length low byte
    0x00,             // Length high byte (0 for small packets)
    0x05, 0x01,       // Command type for batch pixel
    0x00,             // Reserved
    r, g, b,          // Color
    ...posBytes       // x1, y1, x2, y2, ...
  ];

  await sendCommand(command);
}

/**
 * Send raw bytes to device in BLE-sized chunks (for large payloads)
 * The device reassembles based on the packet header's length field
 * Uses writeValueWithoutResponse for speed (like go-ipxl)
 * @param {Uint8Array|number[]} data - Data to send
 */
async function sendLargeData(data) {
  const BLE_CHUNK_SIZE = 244; // Same as Python backend
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  const totalChunks = Math.ceil(uint8Data.length / BLE_CHUNK_SIZE);

  console.log(`iPIXEL BLE: sendLargeData ${uint8Data.length} bytes in ${totalChunks} chunks`);

  // Check if writeValueWithoutResponse is available (faster, like go-ipxl)
  const useNoResponse = typeof characteristic.writeValueWithoutResponse === 'function';
  console.log(`iPIXEL BLE: Using ${useNoResponse ? 'writeValueWithoutResponse' : 'writeValue'}`);

  for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
    const pos = chunkNum * BLE_CHUNK_SIZE;
    const end = Math.min(pos + BLE_CHUNK_SIZE, uint8Data.length);
    const chunk = uint8Data.slice(pos, end);

    await withBleLock(async () => {
      if (!isDeviceConnected() || !characteristic) {
        throw new Error('Not connected to device');
      }
      if (useNoResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
    });

    // Log progress every 10 chunks
    if ((chunkNum + 1) % 10 === 0 || chunkNum === totalChunks - 1) {
      console.log(`iPIXEL BLE: Sent chunk ${chunkNum + 1}/${totalChunks}`);
    }

    // Small delay between chunks to prevent overwhelming the device
    if (end < uint8Data.length) {
      await new Promise(r => setTimeout(r, 2));
    }
  }
}

/**
 * Send image using TYPE_CAMERA protocol (fastest method, from go-ipxl)
 * This sends RGB data as a single logical packet, chunked for BLE transport
 * @param {string[]} pixels - Array of hex color strings
 * @param {number} width - Display width
 * @param {number} height - Display height
 */
export async function sendImageCamera(pixels, width, height) {
  if (!isDeviceConnected()) {
    throw new Error('Not connected to device');
  }

  console.log(`iPIXEL BLE: sendImageCamera ${width}x${height}`);

  // Clear the display first (stop any running animation/clock)
  await clearDisplayForCamera();

  // Convert hex pixels to RGB byte array with 50% brightness (device default)
  const brightness = 50;
  const rgbData = [];
  for (let i = 0; i < width * height; i++) {
    const color = pixels[i] || '#000000';
    const rgb = hexToRgb(color);
    // Apply brightness
    rgbData.push(
      Math.floor((rgb.r * brightness) / 100),
      Math.floor((rgb.g * brightness) / 100),
      Math.floor((rgb.b * brightness) / 100)
    );
  }

  // Build a single logical packet like go-ipxl does
  // go-ipxl uses CHUNK_SIZE=12288 for logical chunks, but our 96x16 display
  // only has 4608 bytes of RGB data, so it fits in one logical chunk
  const LOGICAL_CHUNK_SIZE = 12288;
  const DEFAULT_FRAME_SIZE = 1024;

  const totalLogicalChunks = Math.ceil(rgbData.length / LOGICAL_CHUNK_SIZE);
  console.log(`iPIXEL BLE: ${rgbData.length} RGB bytes, ${totalLogicalChunks} logical chunks`);

  for (let chunkIndex = 0; chunkIndex < totalLogicalChunks; chunkIndex++) {
    const startPos = chunkIndex * LOGICAL_CHUNK_SIZE;
    const endPos = Math.min(startPos + LOGICAL_CHUNK_SIZE, rgbData.length);
    const chunkData = rgbData.slice(startPos, endPos);

    // Option: 0 for first chunk, 2 for continuation
    const option = chunkIndex === 0 ? 0 : 2;

    // Build complete packet with header
    // Header format: [len_lo, len_hi, type_lo, type_hi, option, frame_len(4 bytes)]
    // TYPE_CAMERA = [0, 0], header is 9 bytes
    const headerLen = 9;
    const totalLen = headerLen + chunkData.length;

    const packet = new Uint8Array(totalLen);
    // Length (2 bytes, little-endian)
    packet[0] = totalLen & 0xFF;
    packet[1] = (totalLen >> 8) & 0xFF;
    // Type (TYPE_CAMERA = 0, 0)
    packet[2] = 0x00;
    packet[3] = 0x00;
    // Option
    packet[4] = option;
    // Frame length (4 bytes, little-endian)
    packet[5] = DEFAULT_FRAME_SIZE & 0xFF;
    packet[6] = (DEFAULT_FRAME_SIZE >> 8) & 0xFF;
    packet[7] = (DEFAULT_FRAME_SIZE >> 16) & 0xFF;
    packet[8] = (DEFAULT_FRAME_SIZE >> 24) & 0xFF;
    // RGB data
    for (let i = 0; i < chunkData.length; i++) {
      packet[headerLen + i] = chunkData[i];
    }

    console.log(`iPIXEL BLE: Sending logical chunk ${chunkIndex + 1}/${totalLogicalChunks} (${packet.length} bytes)`);
    console.log(`iPIXEL BLE: Header: ${Array.from(packet.slice(0, 9)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

    // Send the packet in BLE-sized chunks
    await sendLargeData(packet);

    // Delay between logical chunks if there are more
    if (chunkIndex < totalLogicalChunks - 1) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  console.log('iPIXEL BLE: Camera image send complete');
}

/**
 * Send pixels using batch commands grouped by color (faster than pixel-by-pixel)
 * @param {string[]} pixels - Array of hex color strings
 * @param {number} width - Display width
 * @param {number} height - Display height
 */
export async function sendPixelsBatch(pixels, width, height) {
  if (!isDeviceConnected()) {
    throw new Error('Not connected to device');
  }

  console.log(`iPIXEL BLE: sendPixelsBatch called with ${pixels.length} pixels, ${width}x${height}`);

  // Group pixels by color
  const colorGroups = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const color = pixels[idx] || '#000000';

      // Skip dark pixels
      const rgb = hexToRgb(color);
      if (rgb.r <= 10 && rgb.g <= 10 && rgb.b <= 10) continue;

      const colorKey = `${rgb.r},${rgb.g},${rgb.b}`;
      if (!colorGroups.has(colorKey)) {
        colorGroups.set(colorKey, { rgb, positions: [] });
      }
      colorGroups.get(colorKey).positions.push({ x, y });
    }
  }

  console.log(`iPIXEL BLE: Found ${colorGroups.size} unique colors`);

  // Enter DIY mode first
  await enterDiyMode();
  await new Promise(r => setTimeout(r, 200));

  // Send each color group in batches (max ~100 positions per batch due to BLE packet size)
  const MAX_POSITIONS_PER_BATCH = 50;
  let totalSent = 0;

  for (const [colorKey, group] of colorGroups) {
    const { rgb, positions } = group;

    // Split into smaller batches if needed
    for (let i = 0; i < positions.length; i += MAX_POSITIONS_PER_BATCH) {
      const batch = positions.slice(i, i + MAX_POSITIONS_PER_BATCH);
      await setBatchPixels(rgb.r, rgb.g, rgb.b, batch);
      totalSent += batch.length;
      await new Promise(r => setTimeout(r, 30));
    }
  }

  console.log(`iPIXEL BLE: Sent ${totalSent} pixels in batches`);
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

/**
 * Set upside down mode (flip display)
 * @param {boolean} enabled - Whether upside down is enabled
 */
export async function setUpsideDown(enabled) {
  await sendCommand([0x05, 0x00, 0x06, 0x80, enabled ? 0x01 : 0x00]);
}

/**
 * Set text animation mode
 * @param {number} mode - Animation mode (0-7)
 *   0=Static, 1=Scroll Left, 2=Scroll Right, 3=Scroll Up,
 *   4=Scroll Down, 5=Flash, 6=Fade In/Out, 7=Bounce
 */
export async function setAnimationMode(mode) {
  const m = Math.max(0, Math.min(7, mode));
  await sendCommand([0x05, 0x00, 0x0B, 0x01, m]);
}

/**
 * Set font size
 * @param {number} size - Font size (1-128)
 */
export async function setFontSize(size) {
  const s = Math.max(1, Math.min(128, size));
  await sendCommand([0x05, 0x00, 0x0C, 0x01, s]);
}

/**
 * Set font offset (position adjustment)
 * @param {number} x - X offset (-64 to 64)
 * @param {number} y - Y offset (-32 to 32)
 */
export async function setFontOffset(x, y) {
  // Convert to unsigned bytes (with offset for negative values)
  const xByte = Math.max(0, Math.min(255, x + 128));
  const yByte = Math.max(0, Math.min(255, y + 128));
  await sendCommand([0x06, 0x00, 0x0D, 0x01, xByte, yByte]);
}

/**
 * Delete a saved screen slot (1-10)
 * @param {number} slot - Screen slot to delete (1-10)
 */
export async function deleteScreenSlot(slot) {
  const s = Math.max(1, Math.min(10, slot));
  // Delete command: [length, 0x00, 0x02, 0x01, count_low, count_high, ...slots]
  await sendCommand([0x07, 0x00, 0x02, 0x01, 0x01, 0x00, s]);
}

/**
 * Set power schedule
 * @param {boolean} enabled - Whether schedule is enabled
 * @param {number} onHour - Hour to turn on (0-23)
 * @param {number} onMinute - Minute to turn on (0-59)
 * @param {number} offHour - Hour to turn off (0-23)
 * @param {number} offMinute - Minute to turn off (0-59)
 */
export async function setPowerSchedule(enabled, onHour, onMinute, offHour, offMinute) {
  await sendCommand([
    0x09, 0x00, 0x0E, 0x01,
    enabled ? 0x01 : 0x00,
    Math.max(0, Math.min(23, onHour)),
    Math.max(0, Math.min(59, onMinute)),
    Math.max(0, Math.min(23, offHour)),
    Math.max(0, Math.min(59, offMinute))
  ]);
}

/**
 * DIY Fun Mode constants (from go-ipxl)
 */
const DIY_MODE = {
  QUIT_NOSAVE_KEEP_PREV: 0,    // Exit DIY, don't save, keep previous display
  ENTER_CLEAR_CUR_SHOW: 1,     // Enter DIY, clear current display
  QUIT_STILL_CUR_SHOW: 2,      // Exit DIY, keep current display
  ENTER_NO_CLEAR_CUR_SHOW: 3   // Enter DIY, don't clear
};

/**
 * Switch to DIY Fun Mode (from go-ipxl)
 * This is needed to clear the display before sending camera data
 * @param {number} mode - DIY mode (0-3)
 */
export async function switchToDiyFunMode(mode) {
  await sendCommand([0x05, 0x00, 0x04, 0x01, mode]);
}

/**
 * Clear the display by entering DIY mode with clear flag
 */
export async function clearDisplayForCamera() {
  console.log('iPIXEL BLE: Clearing display (DIY_IMAGE_FUN_ENTER_CLEAR_CUR_SHOW)');
  await switchToDiyFunMode(DIY_MODE.ENTER_CLEAR_CUR_SHOW);
  // Give device time to clear
  await new Promise(r => setTimeout(r, 100));
}

/**
 * Test function: Send a small red square using camera protocol
 * This helps debug if the camera protocol is working at all
 */
export async function testCameraProtocol() {
  if (!isDeviceConnected()) {
    throw new Error('Not connected to device');
  }

  console.log('iPIXEL BLE: Testing camera protocol with 96x16 red gradient');

  // Clear the display first (stop any running animation/clock)
  await clearDisplayForCamera();

  // Create a simple test pattern - red gradient on left side
  const width = 96;
  const height = 16;
  const brightness = 50;

  // Build RGB data - red gradient on left 10 columns
  const rgbData = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < 10) {
        // Red gradient
        const r = Math.floor((255 * brightness / 100) * (x + 1) / 10);
        rgbData.push(r, 0, 0);
      } else {
        // Black
        rgbData.push(0, 0, 0);
      }
    }
  }

  // Build packet
  const DEFAULT_FRAME_SIZE = 1024;
  const headerLen = 9;
  const totalLen = headerLen + rgbData.length;

  const packet = new Uint8Array(totalLen);
  packet[0] = totalLen & 0xFF;
  packet[1] = (totalLen >> 8) & 0xFF;
  packet[2] = 0x00; // TYPE_CAMERA
  packet[3] = 0x00;
  packet[4] = 0x00; // option = 0 (first/only chunk)
  packet[5] = DEFAULT_FRAME_SIZE & 0xFF;
  packet[6] = (DEFAULT_FRAME_SIZE >> 8) & 0xFF;
  packet[7] = (DEFAULT_FRAME_SIZE >> 16) & 0xFF;
  packet[8] = (DEFAULT_FRAME_SIZE >> 24) & 0xFF;

  for (let i = 0; i < rgbData.length; i++) {
    packet[headerLen + i] = rgbData[i];
  }

  console.log(`iPIXEL BLE: Test packet size: ${packet.length} bytes`);
  console.log(`iPIXEL BLE: Header: ${Array.from(packet.slice(0, 9)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
  console.log(`iPIXEL BLE: First 30 RGB bytes: ${Array.from(packet.slice(9, 39)).join(',')}`);

  await sendLargeData(packet);
  console.log('iPIXEL BLE: Camera test complete');
}

// Animation streaming state
let animationRunning = false;
let animationFrameId = null;

/**
 * Check if animation is currently running
 */
export function isAnimationRunning() {
  return animationRunning;
}

/**
 * Stop any running animation
 */
export function stopAnimation() {
  animationRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  console.log('iPIXEL BLE: Animation stopped');
}

/**
 * Stream animation frames to device using TYPE_CAMERA protocol
 * @param {Function} getFramePixels - Function that returns current frame as hex color array
 * @param {number} width - Display width
 * @param {number} height - Display height
 * @param {number} targetFps - Target frames per second (limited by BLE bandwidth)
 */
export async function streamAnimation(getFramePixels, width, height, targetFps = 5) {
  if (!isDeviceConnected()) {
    throw new Error('Not connected to device');
  }

  // Stop any existing animation
  stopAnimation();

  animationRunning = true;
  console.log(`iPIXEL BLE: Starting animation stream at ${targetFps} fps`);

  // Clear display first
  await clearDisplayForCamera();

  const frameInterval = 1000 / targetFps;
  let lastFrameTime = 0;
  let frameCount = 0;

  const sendFrame = async () => {
    if (!animationRunning || !isDeviceConnected()) {
      console.log(`iPIXEL BLE: Animation ended after ${frameCount} frames`);
      return;
    }

    const now = performance.now();
    const elapsed = now - lastFrameTime;

    if (elapsed >= frameInterval) {
      try {
        // Get current frame pixels from the renderer
        const pixels = getFramePixels();
        if (pixels && pixels.length > 0) {
          // Send frame using camera protocol (without clearing each time)
          await sendFrameOnly(pixels, width, height);
          frameCount++;

          if (frameCount % 10 === 0) {
            const actualFps = 1000 / elapsed;
            console.log(`iPIXEL BLE: Frame ${frameCount}, ~${actualFps.toFixed(1)} fps`);
          }
        }
      } catch (e) {
        console.error('iPIXEL BLE: Frame send error:', e);
        // Continue trying unless disconnected
        if (!isDeviceConnected()) {
          stopAnimation();
          return;
        }
      }
      lastFrameTime = now;
    }

    // Schedule next frame
    animationFrameId = requestAnimationFrame(sendFrame);
  };

  // Start the animation loop
  sendFrame();
}

/**
 * Send a single frame without clearing (for animation streaming)
 */
async function sendFrameOnly(pixels, width, height) {
  // Convert hex pixels to RGB byte array with 50% brightness
  const brightness = 50;
  const rgbData = [];
  for (let i = 0; i < width * height; i++) {
    const color = pixels[i] || '#000000';
    const rgb = hexToRgb(color);
    rgbData.push(
      Math.floor((rgb.r * brightness) / 100),
      Math.floor((rgb.g * brightness) / 100),
      Math.floor((rgb.b * brightness) / 100)
    );
  }

  // Build packet (same as sendImageCamera but without clear)
  const DEFAULT_FRAME_SIZE = 1024;
  const headerLen = 9;
  const totalLen = headerLen + rgbData.length;

  const packet = new Uint8Array(totalLen);
  packet[0] = totalLen & 0xFF;
  packet[1] = (totalLen >> 8) & 0xFF;
  packet[2] = 0x00; // TYPE_CAMERA
  packet[3] = 0x00;
  packet[4] = 0x00; // option = 0
  packet[5] = DEFAULT_FRAME_SIZE & 0xFF;
  packet[6] = (DEFAULT_FRAME_SIZE >> 8) & 0xFF;
  packet[7] = (DEFAULT_FRAME_SIZE >> 16) & 0xFF;
  packet[8] = (DEFAULT_FRAME_SIZE >> 24) & 0xFF;

  for (let i = 0; i < rgbData.length; i++) {
    packet[headerLen + i] = rgbData[i];
  }

  await sendLargeData(packet);
}

// Export connection state for debugging
export function getConnectionState() {
  return {
    isConnected,
    deviceName: device?.name || null,
    hasCharacteristic: characteristic !== null
  };
}
