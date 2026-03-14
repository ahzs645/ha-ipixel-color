/**
 * WebBluetooth Device Bridge for iPIXEL
 * Allows direct connection to iPIXEL devices from the browser for testing
 * Based on iPixel-Control by nicehunter
 */

// BLE UUIDs for iPIXEL devices (from APK reverse engineering)
const SERVICE_UUID = '000000fa-0000-1000-8000-00805f9b34fb';   // GATT service 0x00FA
const WRITE_UUID = '0000fa02-0000-1000-8000-00805f9b34fb';     // Write characteristic 0xFA02
const NOTIFY_UUID = '0000fa03-0000-1000-8000-00805f9b34fb';    // Notify characteristic 0xFA03

// Keep old name as alias for internal references
const CHAR_UUID = WRITE_UUID;

// Device type byte → LED type mapping (from pypixelcolor DEVICE_TYPE_MAP)
const DEVICE_TYPE_MAP = {
  128: 0,  129: 2,  130: 4,  131: 3,  132: 1,  133: 5,
  134: 6,  135: 7,  136: 8,  137: 9,  138: 10, 139: 11,
  140: 12, 141: 13, 142: 14, 143: 15, 144: 16, 145: 17,
  146: 18, 147: 19,
};

// LED type → (width, height) mapping (from pypixelcolor LED_SIZE_MAP)
const LED_SIZE_MAP = {
  0: [64, 64],  1: [96, 16],   2: [32, 32],  3: [64, 16],
  4: [32, 16],  5: [64, 20],   6: [128, 32], 7: [144, 16],
  8: [192, 16], 9: [48, 24],  10: [64, 32], 11: [96, 32],
  12: [128, 32], 13: [96, 32], 14: [160, 32], 15: [192, 32],
  16: [256, 32], 17: [320, 32], 18: [384, 32], 19: [448, 32],
};

// Connection state
let device = null;
let server = null;
let characteristic = null;   // Write characteristic (0xFA02)
let notifyChar = null;       // Notify characteristic (0xFA03)
let isConnected = false;

// Notification/ACK state
let _notifyListeners = [];   // External listeners for raw notifications
let _pendingAck = null;      // { resolve, reject, timer } for awaiting ACK
let _pendingDeviceInfo = null; // { resolve, timer } for awaiting device info response
let _lastNotification = null; // Last received notification data
let _notifyLog = [];         // Recent notifications for debugging (max 50)
let _queriedDimensions = null; // Dimensions queried from device info

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
  _pendingAck = null;
  console.log('iPIXEL BLE: Lock reset');
}

// =========================================================================
// Notification / ACK handling (characteristic 0xFA03)
// =========================================================================

/**
 * Internal notification handler — called by the BLE stack when FA03 fires.
 *
 * ACK format (5 bytes): [0x05, 0x00, opcode_lo, opcode_hi, status]
 *   status 0x00 = chunk/window ACK
 *   status 0x01 = transfer complete
 *   status 0x03 = CRC / transfer error
 *
 * Device info responses are longer (variable length) and are emitted as
 * 'notify' events for consumers to parse.
 */
function _handleNotification(event) {
  const data = new Uint8Array(event.target.value.buffer);

  // Keep a debug log (ring buffer, max 50)
  const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
  _notifyLog.push({ time: Date.now(), hex, len: data.length });
  if (_notifyLog.length > 50) _notifyLog.shift();

  _lastNotification = data;

  // Parse ACK
  if (data.length >= 5 && data[0] === 0x05) {
    const opcode = (data[3] << 8) | data[2];
    const status = data[4];
    const statusName =
      status === 0x00 ? 'chunk-ack' :
      status === 0x01 ? 'complete' :
      status === 0x03 ? 'error' : `unknown(0x${status.toString(16)})`;

    console.log(`iPIXEL BLE: ACK opcode=0x${opcode.toString(16).padStart(4, '0')} status=${statusName}`);

    // Resolve pending ACK promise
    if (_pendingAck) {
      clearTimeout(_pendingAck.timer);
      _pendingAck.resolve({ opcode, status, statusName, raw: data });
      _pendingAck = null;
    }
  } else {
    // Non-ACK notification — could be device info response
    console.log(`iPIXEL BLE: Notification (${data.length}B): ${hex}`);

    // Device info response: parse device type from byte[4]
    if (data.length >= 5 && _pendingDeviceInfo) {
      const deviceTypeByte = data[4];
      const ledType = DEVICE_TYPE_MAP[deviceTypeByte];
      const dims = ledType !== undefined ? LED_SIZE_MAP[ledType] : undefined;

      console.log(`iPIXEL BLE: Device type byte=${deviceTypeByte}, ledType=${ledType}, dims=${dims}`);

      clearTimeout(_pendingDeviceInfo.timer);
      _pendingDeviceInfo.resolve({
        deviceTypeByte,
        ledType: ledType !== undefined ? ledType : null,
        width: dims ? dims[0] : null,
        height: dims ? dims[1] : null,
        raw: data,
      });
      _pendingDeviceInfo = null;
    }
  }

  // Emit to external listeners
  emit('notify', { data, hex });
}

/**
 * Send a command and wait for an ACK response on FA03.
 * Falls back to fire-and-forget if notifications aren't available.
 *
 * @param {Uint8Array|number[]} data - Command bytes
 * @param {number} timeout - ACK timeout in ms (default 3000)
 * @returns {Promise<{opcode: number, status: number, statusName: string, raw: Uint8Array}|null>}
 */
export async function sendCommandWithAck(data, timeout = 3000) {
  const ackPromise = notifyChar ? new Promise((resolve, reject) => {
    // Cancel any previous pending ACK
    if (_pendingAck) {
      clearTimeout(_pendingAck.timer);
      _pendingAck.resolve(null);
    }
    const timer = setTimeout(() => {
      _pendingAck = null;
      resolve(null); // Timeout → return null, don't reject
    }, timeout);
    _pendingAck = { resolve, reject, timer };
  }) : Promise.resolve(null);

  // Send the command
  await sendCommand(data);

  // Wait for ACK
  return ackPromise;
}

/**
 * Check if notify characteristic is connected
 */
export function hasNotify() {
  return notifyChar !== null;
}

/**
 * Get the last N notification entries (for debugging)
 * @param {number} count - Number of entries (default 10)
 */
export function getNotifyLog(count = 10) {
  return _notifyLog.slice(-count);
}

/**
 * Get last notification data
 */
export function getLastNotification() {
  return _lastNotification;
}

/**
 * Register a listener for raw notification data.
 * Listener receives (Uint8Array) on every FA03 notification.
 * @param {Function} callback
 */
export function onNotify(callback) {
  _notifyListeners.push(callback);
}

/**
 * Remove a notification listener
 */
export function offNotify(callback) {
  _notifyListeners = _notifyListeners.filter(cb => cb !== callback);
}

// Event callbacks
const listeners = {
  connect: [],
  disconnect: [],
  error: [],
  notify: []
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
 * Get device dimensions from device name or queried device info.
 * First tries parsing from name (e.g., "LED_BLE_96x16"), then falls back
 * to dimensions queried via queryDeviceInfo().
 * @returns {{width: number, height: number}|null}
 */
export function getDeviceDimensions() {
  // Try parsing from device name first
  const name = device?.name;
  if (name) {
    const match = name.match(/(\d+)x(\d+)/i);
    if (match) {
      return {
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10)
      };
    }
  }

  // Fall back to queried dimensions
  if (_queriedDimensions) {
    return { ..._queriedDimensions };
  }

  return null;
}

/**
 * Query device info by sending time-sync and parsing the response.
 * The device responds with its LED type, which maps to display dimensions.
 * @param {number} timeout - Response timeout in ms (default 5000)
 * @returns {Promise<{deviceTypeByte: number, ledType: number|null, width: number|null, height: number|null, raw: Uint8Array}|null>}
 */
export async function queryDeviceInfo(timeout = 5000) {
  if (!notifyChar) {
    console.warn('iPIXEL BLE: Cannot query device info — no notify characteristic');
    return null;
  }

  // Set up promise to catch the device info response
  const infoPromise = new Promise((resolve) => {
    if (_pendingDeviceInfo) {
      clearTimeout(_pendingDeviceInfo.timer);
      _pendingDeviceInfo.resolve(null);
    }
    const timer = setTimeout(() => {
      _pendingDeviceInfo = null;
      resolve(null);
    }, timeout);
    _pendingDeviceInfo = { resolve, timer };
  });

  // Send time-sync command (this triggers the device info response)
  const now = new Date();
  await sendCommand([
    0x08, 0x00, 0x01, 0x80,
    now.getHours(), now.getMinutes(), now.getSeconds(), 0x00,
  ]);

  const info = await infoPromise;

  if (info && info.width && info.height) {
    _queriedDimensions = { width: info.width, height: info.height };
    console.log(`iPIXEL BLE: Device dimensions queried: ${info.width}x${info.height}`);
  }

  return info;
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

    // Get service and characteristics
    const service = await server.getPrimaryService(SERVICE_UUID);

    // Write characteristic (0xFA02)
    characteristic = await service.getCharacteristic(WRITE_UUID);
    console.log('iPIXEL BLE: Got write characteristic (FA02)');

    // Notify characteristic (0xFA03) — for ACK responses and device info
    try {
      notifyChar = await service.getCharacteristic(NOTIFY_UUID);
      await notifyChar.startNotifications();
      notifyChar.addEventListener('characteristicvaluechanged', _handleNotification);
      console.log('iPIXEL BLE: Notifications enabled on FA03');
    } catch (e) {
      console.warn('iPIXEL BLE: Could not enable notifications on FA03:', e.message);
      notifyChar = null;
    }

    isConnected = true;
    _queriedDimensions = null;

    // Handle disconnection
    device.addEventListener('gattserverdisconnected', () => {
      console.log('iPIXEL BLE: Device disconnected');
      isConnected = false;
      notifyChar = null;
      _pendingAck = null;
      _pendingDeviceInfo = null;
      _queriedDimensions = null;
      emit('disconnect', { device: device.name });
    });

    // Auto-query device info if name doesn't contain dimensions
    let deviceInfo = null;
    if (notifyChar && !device.name?.match(/(\d+)x(\d+)/i)) {
      console.log('iPIXEL BLE: Name has no dimensions, querying device info...');
      try {
        deviceInfo = await queryDeviceInfo();
      } catch (e) {
        console.warn('iPIXEL BLE: Device info query failed:', e.message);
      }
    }

    emit('connect', {
      device: device.name,
      hasNotify: notifyChar !== null,
      dimensions: getDeviceDimensions(),
      deviceInfo,
    });
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
  // Stop notifications before disconnecting
  if (notifyChar) {
    try {
      notifyChar.removeEventListener('characteristicvaluechanged', _handleNotification);
      await notifyChar.stopNotifications();
    } catch (e) {
      // ignore
    }
    notifyChar = null;
  }
  if (device?.gatt?.connected) {
    await device.gatt.disconnect();
  }
  isConnected = false;
  device = null;
  server = null;
  characteristic = null;
  _pendingAck = null;
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
 * Enter rhythm/music visualizer mode on the device.
 * Must be called before sending level data.
 * @param {number} style - Visualizer style (0-4)
 * @param {number} speed - Animation speed (0-7)
 */
export async function enterRhythmMode(style = 0, speed = 4) {
  // Opcode 0x00, 0x02 = RHYTHM_MODE
  await sendCommand([
    0x06, 0x00, 0x00, 0x02,
    Math.max(0, Math.min(7, speed)),
    Math.max(0, Math.min(4, style)),
  ]);
}

/**
 * Send rhythm level data (11 frequency band levels).
 * The device should already be in rhythm mode (call enterRhythmMode first).
 * @param {number} style - Style (0-4)
 * @param {number[]} levels - Array of 11 level values (0-15 each)
 */
export async function setRhythmLevelMode(style = 0, levels = []) {
  const l = levels.length === 11 ? levels : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Opcode 0x01, 0x02 = RHYTHM_LEVELS
  const data = [
    0x10, 0x00, 0x01, 0x02,
    Math.max(0, Math.min(4, style)),
    ...l.map(v => Math.max(0, Math.min(15, v)))
  ];
  await sendCommand(data);
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
 * Select visible screen buffer (1-9).
 * This switches between the 9 screen "pages" on the device.
 * @param {number} screen - Screen buffer number (1-9)
 */
export async function selectScreen(screen) {
  const s = Math.max(1, Math.min(9, screen));
  await sendCommand([0x05, 0x00, 0x07, 0x80, s]);
}

/**
 * Show/play a saved slot's content on the display.
 * Same packet shape as reserveSlot — the device interprets by context:
 * if the slot has saved content it displays it, otherwise it reserves it.
 * @param {number} slot - Saved slot number (1-255)
 */
export async function showSlot(slot) {
  const s = Math.max(1, Math.min(255, slot));
  await sendCommandWithAck([0x07, 0x00, 0x08, 0x80, 0x01, 0x00, s]);
}

/**
 * Program mode: auto-cycle through a list of saved slots.
 * The device loops through the given slots continuously.
 * @param {number[]} slots - Array of slot numbers to cycle (max 9)
 */
export async function programMode(slots) {
  if (!slots.length || slots.length > 9) throw new Error('1-9 slots required');
  const totalLen = 6 + slots.length;
  const cmd = [
    totalLen & 0xFF, (totalLen >> 8) & 0xFF,
    0x08, 0x80,
    slots.length & 0xFF, (slots.length >> 8) & 0xFF,
    ...slots.map(s => Math.max(1, Math.min(255, s)) & 0xFF),
  ];
  await sendCommand(cmd);
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

// =========================================================================
// New APK features (countdown, scoreboard, stopwatch, etc.)
// =========================================================================

/**
 * Start a countdown timer on the device
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 */
export async function setCountdownTimer(hours, minutes, seconds) {
  await sendCommand([0x07, 0x00, 0x0D, 0x80, hours & 0xFF, minutes & 0xFF, seconds & 0xFF]);
}

/**
 * Display scoreboard on device
 * @param {number} scoreA - Score for team A (0-999)
 * @param {number} scoreB - Score for team B (0-999)
 */
export async function setScoreboard(scoreA, scoreB) {
  await sendCommand([
    0x08, 0x00, 0x0A, 0x80,
    (scoreA >> 8) & 0xFF, scoreA & 0xFF,
    (scoreB >> 8) & 0xFF, scoreB & 0xFF,
  ]);
}

/**
 * Control stopwatch/chronograph
 * @param {number} mode - 0=stop, 1=start, 2=reset
 */
export async function setStopwatch(mode) {
  await sendCommand([0x05, 0x00, 0x09, 0x80, mode & 0xFF]);
}

/**
 * Exit the current device mode (return to idle/default)
 */
export async function exitMode() {
  await sendCommand([0x04, 0x00, 0x01, 0x01]);
}

/**
 * Set the device's weekday
 * @param {number} weekday - 1=Monday through 7=Sunday (ISO 8601)
 */
export async function setWeekday(weekday) {
  await sendCommand([0x05, 0x00, 0x12, 0x80, weekday & 0xFF]);
}

/**
 * Reserve a slot before uploading content
 * @param {number} slot - Slot number (1-255)
 */
export async function reserveSlot(slot) {
  return sendCommandWithAck([0x07, 0x00, 0x08, 0x80, 0x01, 0x00, slot & 0xFF]);
}

/**
 * Delete multiple slots at once
 * @param {number[]} slots - Array of slot numbers (1-255)
 */
export async function deleteSlots(slots) {
  const totalLen = 6 + slots.length;
  const cmd = [
    totalLen & 0xFF, (totalLen >> 8) & 0xFF,
    0x02, 0x01,
    slots.length & 0xFF, (slots.length >> 8) & 0xFF,
    ...slots.map(s => s & 0xFF),
  ];
  await sendCommand(cmd);
}

// =========================================================================
// Slot save protocol (payloadChannel)
// =========================================================================

// CRC32 lookup table
const _crcT = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  _crcT[i] = c;
}
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = _crcT[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Build payloadChannel packets for saving content to a device slot.
 *
 * Packet layout (15-byte header + chunk data):
 *   [0:2]  packet length (LE16)
 *   [2:4]  data type (LE16) — 2=image, 3=gif, 4=text
 *   [4]    option — 0=first chunk, 2=continuation
 *   [5:9]  chunk content length (LE32)
 *   [9:13] CRC32 of this chunk's content (LE32)
 *   [13]   mode/storage flag (0 = normal save)
 *   [14]   slot index
 *   [15:]  content chunk bytes
 *
 * The device stores CRC from the first chunk header and verifies after
 * assembling all chunks. content_length = total across all chunks.
 */
function buildPayloadChannelPackets(dataType, content, slot, mode = 0) {
  const LOGICAL_CHUNK = 12288;
  const contentBytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  const totalLen = contentBytes.length;
  const totalCrc = crc32(contentBytes);
  const packets = [];
  const numChunks = Math.max(1, Math.ceil(totalLen / LOGICAL_CHUNK));

  for (let i = 0; i < numChunks; i++) {
    const start = i * LOGICAL_CHUNK;
    const end = Math.min(start + LOGICAL_CHUNK, totalLen);
    const chunkData = contentBytes.slice(start, end);
    const pktLen = 15 + chunkData.length;

    const pkt = new Uint8Array(pktLen);
    // Packet length (LE16)
    pkt[0] = pktLen & 0xFF;
    pkt[1] = (pktLen >> 8) & 0xFF;
    // Data type (LE16)
    pkt[2] = dataType & 0xFF;
    pkt[3] = (dataType >> 8) & 0xFF;
    // Option: 0=first, 2=continuation
    pkt[4] = i === 0 ? 0 : 2;
    // Total content length (LE32)
    pkt[5] = totalLen & 0xFF;
    pkt[6] = (totalLen >> 8) & 0xFF;
    pkt[7] = (totalLen >> 16) & 0xFF;
    pkt[8] = (totalLen >> 24) & 0xFF;
    // CRC32 of entire content (LE32)
    pkt[9] = totalCrc & 0xFF;
    pkt[10] = (totalCrc >> 8) & 0xFF;
    pkt[11] = (totalCrc >> 16) & 0xFF;
    pkt[12] = (totalCrc >> 24) & 0xFF;
    // Mode + slot
    pkt[13] = mode & 0xFF;
    pkt[14] = slot & 0xFF;
    // Content chunk
    pkt.set(chunkData, 15);

    packets.push(pkt);
  }
  return packets;
}

/**
 * Send data using writeValue (with BLE response) — slower but reliable.
 * pypixelcolor uses this for slot saves: write_gatt_char(uuid, chunk, response=True)
 */
async function sendLargeDataReliable(data) {
  const BLE_CHUNK_SIZE = 244;
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  const totalChunks = Math.ceil(uint8Data.length / BLE_CHUNK_SIZE);

  console.log(`iPIXEL BLE: sendReliable ${uint8Data.length} bytes in ${totalChunks} chunks`);

  for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
    const pos = chunkNum * BLE_CHUNK_SIZE;
    const end = Math.min(pos + BLE_CHUNK_SIZE, uint8Data.length);
    const chunk = uint8Data.slice(pos, end);

    if (!isDeviceConnected() || !characteristic) {
      throw new Error('Not connected to device');
    }
    // Use writeValueWithResponse — guarantees delivery before next write
    // (matches pypixelcolor's write_gatt_char(response=True))
    if (typeof characteristic.writeValueWithResponse === 'function') {
      await characteristic.writeValueWithResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }

    if ((chunkNum + 1) % 10 === 0 || chunkNum === totalChunks - 1) {
      console.log(`iPIXEL BLE: Sent chunk ${chunkNum + 1}/${totalChunks}`);
    }
  }
}

/**
 * Wait for a device notification ACK (window-level).
 * Returns the ACK or null on timeout.
 */
function waitForWindowAck(timeout = 8000) {
  if (!notifyChar) return Promise.resolve(null);
  return new Promise((resolve) => {
    if (_pendingAck) {
      clearTimeout(_pendingAck.timer);
      _pendingAck.resolve(null);
    }
    const timer = setTimeout(() => { _pendingAck = null; resolve(null); }, timeout);
    _pendingAck = { resolve, reject: () => {}, timer };
  });
}

/**
 * Save raw RGB image data to a device slot.
 * @param {number} slot  Slot number (1-255)
 * @param {string[]} pixels  Hex color strings (#RRGGBB)
 * @param {number} width
 * @param {number} height
 * @param {function} [onProgress]  Callback(stage, detail)
 */
export async function saveImageToSlot(slot, pixels, width, height, onProgress) {
  if (!isDeviceConnected()) throw new Error('Not connected');

  onProgress?.('reserve', { slot });
  await reserveSlot(slot);
  await new Promise(r => setTimeout(r, 150));

  // Build raw RGB bytes
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const c = pixels[i] || '#000000';
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
    if (m) {
      rgb[i * 3]     = parseInt(m[1], 16);
      rgb[i * 3 + 1] = parseInt(m[2], 16);
      rgb[i * 3 + 2] = parseInt(m[3], 16);
    }
  }

  const packets = buildPayloadChannelPackets(2, rgb, slot); // type 2 = IMAGE
  for (let i = 0; i < packets.length; i++) {
    onProgress?.('upload', { chunk: i + 1, total: packets.length });
    const ackPromise = waitForWindowAck();
    await sendLargeDataReliable(packets[i]);
    await ackPromise; // wait for device ACK before next window
  }
  onProgress?.('done', { slot });
}

/**
 * Save GIF binary to a device slot.
 * @param {number} slot  Slot number (1-255)
 * @param {Uint8Array} gifBytes  Complete GIF file bytes
 * @param {function} [onProgress]  Callback(stage, detail)
 */
export async function saveGifToSlot(slot, gifBytes, onProgress) {
  if (!isDeviceConnected()) throw new Error('Not connected');

  onProgress?.('reserve', { slot });
  await reserveSlot(slot);
  await new Promise(r => setTimeout(r, 150));

  const packets = buildPayloadChannelPackets(3, gifBytes, slot, 0x02); // type 3 = GIF, mode 0x02
  for (let i = 0; i < packets.length; i++) {
    onProgress?.('upload', { chunk: i + 1, total: packets.length, bytes: packets[i].length });
    const ackPromise = waitForWindowAck();
    await sendLargeDataReliable(packets[i]);
    await ackPromise; // wait for device ACK before next window
  }

  // Show the slot after upload so the device displays it
  await new Promise(r => setTimeout(r, 200));
  await showSlot(slot);
  onProgress?.('done', { slot, size: gifBytes.length });
}

/**
 * Query device time/status (sends current time, device responds with LED type)
 * @returns {Promise<Object|null>} ACK response or null
 */
export async function queryDeviceTime() {
  const now = new Date();
  return sendCommandWithAck([
    0x08, 0x00, 0x01, 0x80,
    now.getHours(), now.getMinutes(), now.getSeconds(), 0x00,
  ]);
}

/**
 * Query device with full date/time (getLedTypeMecha)
 * @returns {Promise<Object|null>} ACK response or null
 */
export async function queryDeviceDateTime() {
  const now = new Date();
  const yy = now.getFullYear() - 2000;
  const mm = now.getMonth() + 1;
  const dd = now.getDate();
  const wd = now.getDay() || 7;
  return sendCommandWithAck([
    0x0B, 0x00, 0x01, 0x80,
    yy, mm, dd, wd,
    now.getHours(), now.getMinutes(), now.getSeconds(),
  ]);
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
    hasCharacteristic: characteristic !== null,
    hasNotify: notifyChar !== null,
    notifyLogCount: _notifyLog.length,
    lastNotification: _lastNotification ? Array.from(_lastNotification).map(b => b.toString(16).padStart(2, '0')).join(' ') : null,
  };
}
