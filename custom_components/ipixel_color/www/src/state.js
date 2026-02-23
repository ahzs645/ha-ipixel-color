/**
 * Shared state management for iPIXEL cards
 * Handles localStorage persistence and cross-card synchronization
 */

export const IPIXEL_STORAGE_KEY = 'iPIXEL_DisplayState';
export const IPIXEL_TEST_MODE_KEY = 'iPIXEL_TestMode';

const DEFAULT_STATE = {
  text: '',
  mode: 'text',
  effect: 'fixed',
  speed: 50,
  fgColor: '#ff6600',
  bgColor: '#000000',
  font: 'VCR_OSD_MONO',
  lastUpdate: 0
};

export function loadDisplayState() {
  try {
    const saved = localStorage.getItem(IPIXEL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('iPIXEL: Could not load saved state', e);
  }
  return { ...DEFAULT_STATE };
}

export function saveDisplayState(state) {
  try {
    localStorage.setItem(IPIXEL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('iPIXEL: Could not save state', e);
  }
}

// Initialize global state
if (!window.iPIXELDisplayState) {
  window.iPIXELDisplayState = loadDisplayState();
}

export function getDisplayState() {
  return window.iPIXELDisplayState;
}

export function updateDisplayState(updates) {
  window.iPIXELDisplayState = {
    ...window.iPIXELDisplayState,
    ...updates,
    lastUpdate: Date.now()
  };
  saveDisplayState(window.iPIXELDisplayState);
  window.dispatchEvent(new CustomEvent('ipixel-display-update', {
    detail: window.iPIXELDisplayState
  }));
  return window.iPIXELDisplayState;
}

/**
 * Test mode management
 * Allows cards to function without a real device for demo/preview purposes
 */
export function isTestMode() {
  if (window.iPIXELTestMode !== undefined) return window.iPIXELTestMode;
  try {
    return localStorage.getItem(IPIXEL_TEST_MODE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setTestMode(enabled) {
  window.iPIXELTestMode = enabled;
  try {
    localStorage.setItem(IPIXEL_TEST_MODE_KEY, String(enabled));
  } catch (e) { }
  window.dispatchEvent(new CustomEvent('ipixel-test-mode-change', { detail: { enabled } }));
}

/**
 * Detect missing browser features relevant to iPIXEL cards
 */
export function detectMissingFeatures() {
  const missing = [];
  if (typeof navigator !== 'undefined' && !navigator.bluetooth) {
    missing.push('WebBluetooth');
  }
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('2d')) missing.push('Canvas');
  } catch (e) {
    missing.push('Canvas');
  }
  return missing;
}
