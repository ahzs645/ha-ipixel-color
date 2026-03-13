/**
 * WiFi device transport for iPIXEL displays.
 *
 * Mirrors the ble-device.js API but sends commands over WebSocket
 * to a local bridge (tools/wifi_bridge.py) which forwards to the
 * device's raw TCP socket.
 *
 * Usage:
 *   import * as WIFI from './wifi-device.js';
 *   await WIFI.connect('ws://localhost:9001');
 *   await WIFI.powerOn();
 *   await WIFI.sendImageCamera(pixels, 64, 16);
 */

// --- State ---
let _ws = null;
let _connected = false;
let _deviceDimensions = null;
let _listeners = { connect: [], disconnect: [], error: [], ack: [] };
let _pendingAck = null; // { resolve, reject, timer }
let _animationRunning = false;
let _animationStop = false;

// Default WebSocket URL
const DEFAULT_WS_URL = 'ws://localhost:9001';

// ACK wait timeout (ms)
const ACK_TIMEOUT = 5000;

// Inter-command delay (ms) — device needs time between commands
const CMD_DELAY = 20;

// Chunk size for large data (camera frames)
const CHUNK_SIZE = 244;  // Match BLE MTU for compatibility

// Camera protocol constants
const DEFAULT_FRAME_SIZE = 1024;

// --- Events ---

export function addEventListener(event, callback) {
  if (_listeners[event]) _listeners[event].push(callback);
}

export function removeEventListener(event, callback) {
  if (_listeners[event]) {
    _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  }
}

function _emit(event, data) {
  if (_listeners[event]) {
    _listeners[event].forEach(cb => {
      try { cb(data); } catch (e) { console.error(`WiFi event error (${event}):`, e); }
    });
  }
}

// --- Connection ---

export async function connect(wsUrl = DEFAULT_WS_URL, dimensions = null) {
  if (_connected && _ws) {
    return 'Already connected';
  }

  _deviceDimensions = dimensions;

  return new Promise((resolve, reject) => {
    try {
      _ws = new WebSocket(wsUrl);
      _ws.binaryType = 'arraybuffer';

      _ws.onopen = () => {
        console.log('[WiFi] WebSocket connected to bridge');
      };

      _ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const data = new Uint8Array(event.data);

          // Connection status signals from bridge
          if (data.length === 1) {
            if (data[0] === 0x01) {
              // Success — bridge connected to device
              _connected = true;
              _emit('connect', { transport: 'wifi' });
              resolve('WiFi connected');
              return;
            } else if (data[0] === 0x00) {
              // Error — bridge couldn't reach device
              reject(new Error('Bridge failed to connect to device'));
              return;
            } else if (data[0] === 0x02) {
              // Disconnect signal
              _handleDisconnect();
              return;
            }
          }

          // Device ACK response
          if (_pendingAck) {
            clearTimeout(_pendingAck.timer);
            _pendingAck.resolve(data);
            _pendingAck = null;
          }
          _emit('ack', data);
        } else if (typeof event.data === 'string') {
          // Text response (status, pong)
          console.log('[WiFi] Bridge:', event.data);
        }
      };

      _ws.onerror = (err) => {
        console.error('[WiFi] WebSocket error:', err);
        _emit('error', err);
        if (!_connected) {
          reject(new Error('WebSocket connection failed — is wifi_bridge.py running?'));
        }
      };

      _ws.onclose = () => {
        if (_connected) {
          _handleDisconnect();
        }
      };
    } catch (e) {
      reject(e);
    }
  });
}

function _handleDisconnect() {
  _connected = false;
  _ws = null;
  _animationRunning = false;
  _animationStop = true;
  _emit('disconnect', {});
  console.log('[WiFi] Disconnected');
}

export async function disconnect() {
  if (_ws) {
    try {
      _ws.send('disconnect');
      await new Promise(r => setTimeout(r, 100));
      _ws.close();
    } catch (e) {
      // ignore
    }
  }
  _handleDisconnect();
}

export function isConnected() {
  return _connected;
}

export function isDeviceConnected() {
  return _connected;
}

export function getDeviceDimensions() {
  return _deviceDimensions;
}

export function getConnectionState() {
  return {
    isConnected: _connected,
    transport: 'wifi',
    hasCharacteristic: _connected,
  };
}

// --- Core send ---

async function _send(data) {
  if (!_connected || !_ws || _ws.readyState !== WebSocket.OPEN) {
    throw new Error('WiFi not connected');
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  _ws.send(bytes.buffer);
}

/**
 * Send a command and optionally wait for ACK.
 */
export async function sendCommand(data, waitAck = false) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  await _send(bytes);

  if (waitAck) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        _pendingAck = null;
        resolve(null); // Don't reject on timeout, just return null
      }, ACK_TIMEOUT);
      _pendingAck = { resolve, reject, timer };
    });
  }

  await _delay(CMD_DELAY);
  return null;
}

/**
 * Send large data in chunks (mirrors BLE chunking).
 * For WiFi we can send bigger chunks, but we still chunk to avoid
 * overwhelming the device and to match the protocol expectations.
 */
export async function sendLargeData(data, chunkSize = 12288) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.slice(offset, offset + chunkSize);
    await _send(chunk);
    await _delay(2); // Small inter-chunk delay
  }
}

function _delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Power & Control ---

export async function powerOn() {
  await sendCommand([0x05, 0x00, 0x07, 0x01, 0x01]);
}

export async function powerOff() {
  await sendCommand([0x05, 0x00, 0x07, 0x01, 0x00]);
}

export async function setBrightness(value) {
  value = Math.max(1, Math.min(100, value));
  await sendCommand([0x05, 0x00, 0x04, 0x80, value]);
}

// --- Time & Clock ---

export async function syncTime() {
  const now = new Date();
  await sendCommand([
    0x08, 0x00, 0x01, 0x80,
    now.getHours(), now.getMinutes(), now.getSeconds(), 0x00,
  ]);
}

export async function setClockMode(style = 1, format24 = true, showDate = false) {
  const now = new Date();
  const yy = now.getFullYear() - 2000;
  const mm = now.getMonth() + 1;
  const dd = now.getDate();
  const wd = now.getDay() || 7; // Sunday=0 → 7
  const flagA = showDate ? 0x00 : 0x01;
  const flagB = format24 ? 0x01 : 0x00;
  await sendCommand([
    0x0B, 0x00, 0x06, 0x01,
    style, flagA, flagB,
    yy, mm, dd, wd,
  ]);
}

// --- Display ---

export async function setOrientation(orientation) {
  await sendCommand([0x05, 0x00, 0x06, 0x80, orientation]);
}

export async function setUpsideDown(enabled) {
  await sendCommand([0x05, 0x00, 0x06, 0x80, enabled ? 1 : 0]);
}

export async function clearDisplay() {
  await enterDiyMode();
}

export async function selectScreen(slot) {
  await sendCommand([0x05, 0x00, 0x07, 0x80, slot]);
}

export async function deleteScreen(slot) {
  await sendCommand([0x07, 0x00, 0x02, 0x01, 0x01, 0x00, slot]);
}

// --- DIY Mode ---

export async function enterDiyMode() {
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x01]);
}

export async function exitDiyMode() {
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x00]);
}

export async function clearDisplayForCamera() {
  await sendCommand([0x05, 0x00, 0x04, 0x01, 0x01]); // ENTER_CLEAR_CUR_SHOW
  await _delay(100);
}

// --- Pixel Commands ---

export async function setPixel(x, y, r, g, b) {
  await sendCommand([0x0A, 0x00, 0x05, 0x01, 0x00, r, g, b, x, y]);
}

export async function setBatchPixels(r, g, b, positions) {
  const header = [0, 0, 0x05, 0x01, 0x00, r, g, b];
  const body = [];
  for (const { x, y } of positions) {
    body.push(x & 0xFF, y & 0xFF);
  }
  const totalLen = header.length + body.length;
  header[0] = totalLen & 0xFF;
  header[1] = (totalLen >> 8) & 0xFF;
  await sendCommand([...header, ...body]);
}

// --- Camera Protocol (fast full-frame) ---

export async function sendImageCamera(pixels, width, height) {
  // Clear display first
  await clearDisplayForCamera();

  // Convert hex color array to RGB bytes
  const rgbData = _pixelsToRgb(pixels, width, height, 0.5);

  // Build camera protocol frame
  const frameSize = DEFAULT_FRAME_SIZE;
  const totalLen = 9 + rgbData.length;
  const header = new Uint8Array([
    totalLen & 0xFF, (totalLen >> 8) & 0xFF,
    0x00, 0x00,  // TYPE_CAMERA
    0x00,        // option: first frame
    frameSize & 0xFF, (frameSize >> 8) & 0xFF,
    (frameSize >> 16) & 0xFF, (frameSize >> 24) & 0xFF,
  ]);

  // Combine header + RGB data
  const frame = new Uint8Array(header.length + rgbData.length);
  frame.set(header);
  frame.set(rgbData, header.length);

  // Send — WiFi can handle the whole thing at once
  await sendLargeData(frame);
}

/**
 * Send a single frame without clearing (for animation streaming).
 */
async function sendFrameOnly(pixels, width, height) {
  const rgbData = _pixelsToRgb(pixels, width, height, 0.5);
  const frameSize = DEFAULT_FRAME_SIZE;
  const totalLen = 9 + rgbData.length;
  const header = new Uint8Array([
    totalLen & 0xFF, (totalLen >> 8) & 0xFF,
    0x00, 0x00, 0x00,
    frameSize & 0xFF, (frameSize >> 8) & 0xFF,
    (frameSize >> 16) & 0xFF, (frameSize >> 24) & 0xFF,
  ]);
  const frame = new Uint8Array(header.length + rgbData.length);
  frame.set(header);
  frame.set(rgbData, header.length);
  await sendLargeData(frame);
}

// --- Animation Streaming ---

export async function streamAnimation(getFramePixels, width, height, targetFps = 5) {
  if (_animationRunning) return;
  _animationRunning = true;
  _animationStop = false;

  await clearDisplayForCamera();
  const interval = 1000 / targetFps;

  while (!_animationStop && _connected) {
    const start = performance.now();
    const pixels = getFramePixels();
    if (pixels && pixels.length > 0) {
      try {
        await sendFrameOnly(pixels, width, height);
      } catch (e) {
        console.error('[WiFi] Stream error:', e);
        break;
      }
    }
    const elapsed = performance.now() - start;
    const wait = Math.max(0, interval - elapsed);
    if (wait > 0) await _delay(wait);
  }

  _animationRunning = false;
}

export function stopAnimation() {
  _animationStop = true;
  _animationRunning = false;
}

export function isAnimationRunning() {
  return _animationRunning;
}

// --- Text & Font ---

export async function setFontSize(size) {
  await sendCommand([0x05, 0x00, 0x0C, 0x01, size & 0xFF]);
}

export async function setFontOffset(x, y) {
  const xByte = (x + 128) & 0xFF;
  const yByte = (y + 128) & 0xFF;
  await sendCommand([0x06, 0x00, 0x0D, 0x01, xByte, yByte]);
}

export async function sendMulticolorText(text, colors) {
  const chars = [...text];
  const body = [];
  for (let i = 0; i < chars.length; i++) {
    const code = chars[i].charCodeAt(0);
    const color = colors[i % colors.length] || { r: 255, g: 255, b: 255 };
    body.push(code & 0xFF, color.r, color.g, color.b);
  }
  const totalLen = 5 + body.length;
  await sendCommand([
    totalLen & 0xFF, (totalLen >> 8) & 0xFF,
    0x03, 0x01, chars.length,
    ...body,
  ]);
}

// --- Modes ---

export async function setAnimationMode(mode) {
  await sendCommand([0x05, 0x00, 0x0B, 0x01, mode]);
}

export async function setRainbowMode(mode) {
  await sendCommand([0x05, 0x00, 0x0A, 0x01, mode]);
}

export async function setRhythmLevelMode(style, levels) {
  const cmd = [0x11, 0x00, 0x08, 0x01, style];
  for (let i = 0; i < 11; i++) {
    cmd.push((levels[i] || 0) & 0x0F);
  }
  await sendCommand(cmd);
}

export async function setRhythmAnimationMode(style, frame) {
  await sendCommand([0x06, 0x00, 0x09, 0x01, style, frame]);
}

// --- New APK Features ---

export async function setCountdownTimer(hours, minutes, seconds) {
  await sendCommand([0x07, 0x00, 0x0D, 0x80, hours, minutes, seconds]);
}

export async function setScoreboard(scoreA, scoreB) {
  await sendCommand([
    0x08, 0x00, 0x0A, 0x80,
    (scoreA >> 8) & 0xFF, scoreA & 0xFF,
    (scoreB >> 8) & 0xFF, scoreB & 0xFF,
  ]);
}

export async function setStopwatch(mode) {
  await sendCommand([0x05, 0x00, 0x09, 0x80, mode]);
}

export async function exitMode() {
  await sendCommand([0x04, 0x00, 0x01, 0x01]);
}

export async function setWeekday(weekday) {
  await sendCommand([0x05, 0x00, 0x12, 0x80, weekday]);
}

// --- Scheduling ---

export async function setPowerSchedule(enabled, onHour, onMinute, offHour, offMinute) {
  await sendCommand([
    0x09, 0x00, 0x0E, 0x01,
    enabled ? 1 : 0,
    onHour, onMinute, offHour, offMinute,
  ]);
}

// --- Helpers ---

function _pixelsToRgb(pixels, width, height, brightness = 1.0) {
  const totalPixels = width * height;
  const rgb = new Uint8Array(totalPixels * 3);

  for (let i = 0; i < totalPixels; i++) {
    const p = pixels[i];
    let r = 0, g = 0, b = 0;

    if (p) {
      if (typeof p === 'string') {
        const hex = p.replace('#', '');
        if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        }
      } else if (Array.isArray(p) && p.length >= 3) {
        r = Math.floor(p[0]);
        g = Math.floor(p[1]);
        b = Math.floor(p[2]);
      }
    }

    rgb[i * 3] = Math.min(255, Math.floor(r * brightness));
    rgb[i * 3 + 1] = Math.min(255, Math.floor(g * brightness));
    rgb[i * 3 + 2] = Math.min(255, Math.floor(b * brightness));
  }

  return rgb;
}

// Test pattern: red gradient
export async function testPattern() {
  if (!_connected) throw new Error('Not connected');

  const width = _deviceDimensions?.width || 64;
  const height = _deviceDimensions?.height || 16;
  const pixels = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.floor((x / width) * 255).toString(16).padStart(2, '0');
      pixels.push(`#${r}0000`);
    }
  }

  await sendImageCamera(pixels, width, height);
}

export function resetLock() {
  // No lock mechanism needed for WiFi (unlike BLE)
  _pendingAck = null;
}
