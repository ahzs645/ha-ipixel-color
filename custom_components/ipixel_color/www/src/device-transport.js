/**
 * Transport facade for the preview harness.
 *
 * `ble-device.js` and `wifi-device.js` already expose nearly the same API --
 * power, brightness, time, clock, orientation, pixels, camera frames, slots,
 * streaming, timer/scoreboard/stopwatch and so on. The only real differences
 * are how a connection is opened and a handful of transport-specific extras.
 *
 * This module picks one of them as "active" and forwards every shared call to
 * it, so the preview needs a single set of controls instead of two duplicated
 * panels that had drifted to expose different feature sets.
 */

import * as BLE from './ble-device.js';
import * as WIFI from './wifi-device.js';

export const TRANSPORTS = {
  ble: {
    id: 'ble',
    label: 'Bluetooth',
    module: BLE,
    // WebBluetooth is Chromium-only and needs a user gesture to pick a device.
    isAvailable: () => BLE.isWebBluetoothAvailable(),
    unavailableReason: 'WebBluetooth is not available. Use Chrome or Edge on a supported platform.',
    connect: (opts) => BLE.connectDevice(),
    disconnect: () => BLE.disconnectDevice(),
    capabilities: {
      notify: true,      // reports ACK frames
      debugTools: true,  // test pattern / camera test / lock reset
      slotSave: true,    // saveImageToSlot / saveGifToSlot
      rhythm: true,      // enterRhythmMode + level streaming
      testPattern: false,
    },
  },
  wifi: {
    id: 'wifi',
    label: 'Wi-Fi',
    module: WIFI,
    isAvailable: () => true,
    unavailableReason: '',
    connect: (opts) => WIFI.connect(opts.wsUrl, { width: opts.width, height: opts.height }),
    disconnect: () => WIFI.disconnect(),
    capabilities: {
      notify: false,
      debugTools: false,
      slotSave: false,
      rhythm: true,
      testPattern: true,
    },
  },
};

let activeId = 'ble';

export function listTransports() {
  return Object.values(TRANSPORTS);
}

export function getActiveId() {
  return activeId;
}

export function getActive() {
  return TRANSPORTS[activeId];
}

export function setActive(id) {
  if (!TRANSPORTS[id]) throw new Error(`Unknown transport: ${id}`);
  activeId = id;
  return TRANSPORTS[id];
}

export function capabilities() {
  return getActive().capabilities;
}

/** The active transport module, for calls this facade does not wrap. */
export function api() {
  return getActive().module;
}

export function isConnected() {
  return getActive().module.isDeviceConnected();
}

/** True if any transport currently holds a connection. */
export function anyConnected() {
  return listTransports().some(t => t.module.isDeviceConnected());
}

export async function connect(opts = {}) {
  const t = getActive();
  if (!t.isAvailable()) throw new Error(t.unavailableReason);
  return t.connect(opts);
}

export async function disconnect() {
  return getActive().disconnect();
}

export function getDeviceDimensions() {
  return getActive().module.getDeviceDimensions();
}

export function getConnectionState() {
  return getActive().module.getConnectionState();
}

/**
 * Forward a call to the active transport, resolving to undefined when that
 * transport does not implement it. Keeps shared UI handlers free of
 * per-transport branching.
 */
export async function call(method, ...args) {
  const mod = getActive().module;
  const fn = mod[method];
  if (typeof fn !== 'function') {
    console.warn(`iPIXEL: ${getActive().label} transport has no ${method}()`);
    return undefined;
  }
  return fn(...args);
}

// Shared commands, in the order the preview panel presents them.
export const powerOn = () => call('powerOn');
export const powerOff = () => call('powerOff');
export const setBrightness = (v) => call('setBrightness', v);
export const syncTime = () => call('syncTime');
export const setClockMode = (style, f24, showDate) => call('setClockMode', style, f24, showDate);
export const setOrientation = (o) => call('setOrientation', o);
export const clearDisplay = () => call('clearDisplay');
export const sendImageCamera = (px, w, h) => call('sendImageCamera', px, w, h);
export const setRhythmLevelMode = (style, levels) => call('setRhythmLevelMode', style, levels);
export const setCountdownTimer = (h, m, s) => call('setCountdownTimer', h, m, s);
export const setScoreboard = (a, b) => call('setScoreboard', a, b);
export const setStopwatch = (m) => call('setStopwatch', m);
export const exitMode = () => call('exitMode');
export const selectScreen = (s) => call('selectScreen', s);
export const showSlot = (s) => call('showSlot', s);
export const programMode = (s) => call('programMode', s);
export const deleteScreen = (s) => call('deleteScreen', s);
export const enterDiyMode = () => call('enterDiyMode');
export const setPixel = (x, y, r, g, b) => call('setPixel', x, y, r, g, b);
export const setUpsideDown = (e) => call('setUpsideDown', e);
export const sendCommand = (bytes) => call('sendCommand', bytes);
export const streamAnimation = (get, w, h, fps) => call('streamAnimation', get, w, h, fps);
export const stopAnimation = () => call('stopAnimation');

export function isAnimationRunning() {
  const mod = getActive().module;
  return typeof mod.isAnimationRunning === 'function' ? mod.isAnimationRunning() : false;
}

/** Subscribe to an event on every transport, so the UI reacts either way. */
export function addEventListener(event, callback) {
  listTransports().forEach(t => t.module.addEventListener?.(event, callback));
}

export function removeEventListener(event, callback) {
  listTransports().forEach(t => t.module.removeEventListener?.(event, callback));
}
