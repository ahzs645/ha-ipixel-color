/**
 * iPIXEL Display Card
 * LED matrix preview with power control and discrete pixel animation
 * Fixed to preserve renderer state and resolution across re-renders
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import {
  textToPixels, textToScrollPixels,
  textToPixelsCanvas, textToScrollPixelsCanvas, loadFont, isFontLoaded,
  textToPixelsBdf, textToScrollPixelsBdf, loadBdfFont, isBdfFontLoaded, getHeightKey,
  LEDMatrixRenderer, EFFECTS, configureFonts,
} from 'react-pixel-display/core';
import { getDisplayState, updateDisplayState, isTestMode, setTestMode, detectMissingFeatures } from '../state.js';

// Configure font resolution for HA environment
const isHA = typeof window !== 'undefined' && (
  typeof window.hassConnection !== 'undefined' ||
  document.querySelector('home-assistant') !== null
);

if (isHA) {
  configureFonts({
    ttfResolver: (name) => `/hacsfiles/ipixel_color/fonts/${name}.ttf`,
    bdfResolver: (_name, file) => `/hacsfiles/ipixel_color/fonts/${file || _name}`,
  });
} else if (typeof window !== 'undefined') {
  const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  configureFonts({ baseUrl: `${basePath}fonts` });
}

// Global renderer cache - preserves renderer across card re-renders
const rendererCache = new Map();

export class iPIXELDisplayCard extends iPIXELCardBase {
  constructor() {
    super();
    this._renderer = null;
    this._displayContainer = null;
    this._lastState = null;
    this._cachedResolution = null; // Cache resolution
    this._rendererId = null;

    this._handleDisplayUpdate = (e) => {
      this._updateDisplay(e.detail);
    };
    window.addEventListener('ipixel-display-update', this._handleDisplayUpdate);
  }

  connectedCallback() {
    // Generate unique ID for this card instance
    if (!this._rendererId) {
      this._rendererId = `renderer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Restore renderer from cache if available
    if (rendererCache.has(this._rendererId)) {
      this._renderer = rendererCache.get(this._rendererId);
    }

    // Preload BDF fonts (preferred for pixel-perfect rendering)
    loadBdfFont('VCR_OSD_MONO', 16).then(() => {
      if (this._lastState) this._updateDisplay(this._lastState);
    });
    loadBdfFont('VCR_OSD_MONO', 24);
    loadBdfFont('VCR_OSD_MONO', 32);
    loadBdfFont('CUSONG', 16);
    loadBdfFont('CUSONG', 24);
    loadBdfFont('CUSONG', 32);

    // Also preload TTF fonts as fallback
    loadFont('VCR_OSD_MONO');
    loadFont('CUSONG');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('ipixel-display-update', this._handleDisplayUpdate);

    // Don't destroy renderer - cache it for reconnection
    if (this._renderer && this._rendererId) {
      this._renderer.stop();
      rendererCache.set(this._rendererId, this._renderer);
    }
  }

  /**
   * Get resolution with caching and fallback
   */
  _getResolutionCached() {
    const [sensorWidth, sensorHeight] = this.getResolution();

    // If sensors return valid values, use them and cache
    if (sensorWidth > 0 && sensorHeight > 0) {
      this._cachedResolution = [sensorWidth, sensorHeight];
      // Also save to localStorage for persistence
      try {
        localStorage.setItem('iPIXEL_Resolution', JSON.stringify([sensorWidth, sensorHeight]));
      } catch (e) { }
      return this._cachedResolution;
    }

    // Check localStorage first (source of truth for preview mode / BLE auto-detect)
    try {
      const saved = localStorage.getItem('iPIXEL_Resolution');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2 && parsed[0] > 0 && parsed[1] > 0) {
          this._cachedResolution = parsed;
          return parsed;
        }
      }
    } catch (e) { }

    // If we have cached resolution (from previous sensor read), use it
    if (this._cachedResolution) {
      return this._cachedResolution;
    }

    // Fall back to config or default
    if (this._config?.width && this._config?.height) {
      return [this._config.width, this._config.height];
    }

    return [sensorWidth || 64, sensorHeight || 16];
  }

  /**
   * Update the display with new state
   */
  _updateDisplay(state) {
    if (!this._displayContainer) return;

    const [width, height] = this._getResolutionCached();
    const isOn = this.isOn();

    // Ensure renderer exists and has correct dimensions
    if (!this._renderer) {
      this._renderer = new LEDMatrixRenderer(this._displayContainer, { width, height });
      if (this._rendererId) {
        rendererCache.set(this._rendererId, this._renderer);
      }
    } else {
      // Update container reference in case it changed
      this._renderer.setContainer(this._displayContainer);
      // Update dimensions if changed
      if (this._renderer.width !== width || this._renderer.height !== height) {
        this._renderer.setDimensions(width, height);
      }
    }

    if (!isOn) {
      // Display off - show blank using renderer (consistent with on state)
      this._renderer.setData([]);
      this._renderer.setEffect('fixed', 50);
      this._renderer.stop();
      this._renderer.renderStatic();
      return;
    }

    const text = state?.text || '';
    const effect = state?.effect || 'fixed';
    const speed = state?.speed || 50;
    const fgColor = state?.fgColor || '#ff6600';
    const bgColor = state?.bgColor || '#111';
    const mode = state?.mode || 'text';
    const font = state?.font || 'VCR_OSD_MONO';

    // Store state for re-render after font loads
    this._lastState = state;

    // Determine display text based on mode
    let displayText = text;
    let displayFg = fgColor;

    if (mode === 'clock') {
      const now = new Date();
      displayText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      displayFg = '#00ff88';
    } else if (mode === 'gif') {
      displayText = 'GIF';
      displayFg = '#ff44ff';
    } else if (mode === 'rhythm') {
      displayText = '***';
      displayFg = '#44aaff';
    }

    // Check if effect is ambient (doesn't need text data)
    const effectInfo = EFFECTS[effect];
    const isAmbient = effectInfo?.category === 'ambient';

    if (isAmbient) {
      // Ambient effects don't need text pixels
      this._renderer.setData([], [], width);
    } else {
      // Helper to get pixels using appropriate renderer
      // Priority: BDF (pixel-perfect) → Canvas/TTF → Legacy bitmap
      const heightKey = getHeightKey(height);
      const useBdfFont = font !== 'LEGACY' && isBdfFontLoaded(font, heightKey);
      const useCanvasFont = font !== 'LEGACY' && isFontLoaded(font);

      const getPixels = (text, w, h, fg, bg) => {
        // Try BDF first (pixel-perfect)
        if (useBdfFont) {
          const bdfPixels = textToPixelsBdf(text, w, h, fg, bg, font);
          if (bdfPixels) return bdfPixels;
        }
        // Try Canvas/TTF as fallback
        if (useCanvasFont) {
          const canvasPixels = textToPixelsCanvas(text, w, h, fg, bg, font);
          if (canvasPixels) return canvasPixels;
        }
        // Fall back to legacy bitmap font
        return textToPixels(text, w, h, fg, bg);
      };

      const getScrollPixels = (text, displayW, h, fg, bg) => {
        // Try BDF first (pixel-perfect)
        if (useBdfFont) {
          const bdfResult = textToScrollPixelsBdf(text, displayW, h, fg, bg, font);
          if (bdfResult) return bdfResult;
        }
        // Try Canvas/TTF as fallback
        if (useCanvasFont) {
          const canvasResult = textToScrollPixelsCanvas(text, displayW, h, fg, bg, font);
          if (canvasResult) return canvasResult;
        }
        // Fall back to legacy bitmap font
        return textToScrollPixels(text, displayW, h, fg, bg);
      };

      // Estimate text width for scroll detection
      // For canvas fonts, we use the font's actual character width
      // For bitmap, we use 6 pixels per char
      const textPixelWidth = useCanvasFont
        ? displayText.length * 10 // Approximate for TTF fonts
        : displayText.length * 6;

      const needsScroll = (effect === 'scroll_ltr' || effect === 'scroll_rtl' || effect === 'bounce') && textPixelWidth > width;

      if (needsScroll) {
        // Generate extended pixel data for scrolling
        const scrollResult = getScrollPixels(displayText, width, height, displayFg, bgColor);
        const displayPixels = getPixels(displayText, width, height, displayFg, bgColor);
        this._renderer.setData(displayPixels, scrollResult.pixels, scrollResult.width);
      } else {
        // Static or non-scroll effects
        const pixels = getPixels(displayText, width, height, displayFg, bgColor);
        this._renderer.setData(pixels);
      }
    }

    // Set effect and speed
    this._renderer.setEffect(effect, speed);

    // Start or stop animation based on effect
    if (effect === 'fixed') {
      this._renderer.stop();
      this._renderer.renderStatic();
    } else {
      this._renderer.start();
    }
  }

  /**
   * Get sample state for test mode demo display
   */
  _getTestModeState() {
    const demos = [
      { text: 'iPIXEL', effect: 'scroll_ltr', speed: 40, fgColor: '#ff6600', bgColor: '#000000', mode: 'text', font: 'VCR_OSD_MONO' },
      { text: 'Hello!', effect: 'rainbow_cycle', speed: 50, fgColor: '#00ff88', bgColor: '#000000', mode: 'text', font: 'VCR_OSD_MONO' },
      { text: 'TEST', effect: 'fixed', speed: 50, fgColor: '#03a9f4', bgColor: '#111111', mode: 'text', font: 'VCR_OSD_MONO' },
      { text: '', effect: 'rainbow', speed: 60, fgColor: '#ffffff', bgColor: '#000000', mode: 'ambient', font: 'VCR_OSD_MONO' },
    ];
    // Rotate through demos based on time
    const idx = Math.floor(Date.now() / 10000) % demos.length;
    return demos[idx];
  }

  render() {
    // Allow render in test mode even without hass
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const [width, height] = this._getResolutionCached();
    const isOn = this.isOn();
    const name = this._config.name || this.getEntity()?.attributes?.friendly_name || 'iPIXEL Display';

    // Get current state (use sample data in test mode if no shared state)
    const sharedState = getDisplayState();
    const textEntity = this.getEntity();
    const entityText = textEntity?.state || '';
    const modeEntity = this.getRelatedEntity('select', '_mode');
    const currentMode = modeEntity?.state || sharedState.mode || 'text';

    const currentText = sharedState.text || entityText || (testMode ? 'iPIXEL' : '');
    const currentEffect = sharedState.effect || 'fixed';
    const currentSpeed = sharedState.speed || 50;
    const fgColor = sharedState.fgColor || '#ff6600';
    const bgColor = sharedState.bgColor || '#111';
    const currentFont = sharedState.font || 'VCR_OSD_MONO';

    // Check if effect is ambient
    const effectInfo = EFFECTS[currentEffect];
    const isAmbient = effectInfo?.category === 'ambient';

    // Detect missing features for the banner
    const missingFeatures = detectMissingFeatures();
    const testModeEnabled = isTestMode();

    // Build test mode banner
    let testModeBanner = '';
    if (testMode) {
      const featureWarnings = missingFeatures.length > 0
        ? `<div class="test-mode-features">Missing: ${missingFeatures.join(', ')}</div>`
        : '';
      testModeBanner = `
        <div class="test-mode-banner">
          <div class="test-mode-header">
            <span class="test-mode-label">Test Mode</span>
            <button class="test-mode-toggle ${testModeEnabled ? 'active' : ''}" id="test-mode-toggle">
              ${testModeEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="test-mode-desc">Preview display without a device</div>
          ${featureWarnings}
        </div>`;
    } else {
      // Show a small toggle to enter test mode
      testModeBanner = `
        <div class="test-mode-hint">
          <button class="test-mode-hint-btn" id="test-mode-toggle" title="Enable test mode for preview without a device">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15Z"/></svg>
            Test
          </button>
        </div>`;
    }

    // Build effect options grouped by category
    const textEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === 'text')
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    const ambientEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === 'ambient')
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    const colorEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === 'color')
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .display-container { background: #000; border-radius: 8px; padding: 8px; border: 2px solid #222; }
        .display-screen {
          background: #000;
          border-radius: 4px;
          overflow: hidden;
          min-height: 60px;
        }
        .display-footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75em; opacity: 0.6; }
        .mode-badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; text-transform: capitalize; }
        .effect-badge { background: rgba(100,149,237,0.2); padding: 2px 6px; border-radius: 3px; margin-left: 4px; }
        .test-mode-banner {
          background: linear-gradient(135deg, rgba(255,152,0,0.15), rgba(255,87,34,0.1));
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        .test-mode-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .test-mode-label {
          font-size: 0.85em;
          font-weight: 600;
          color: #ff9800;
        }
        .test-mode-toggle {
          padding: 3px 10px;
          border: 1px solid rgba(255,152,0,0.4);
          border-radius: 12px;
          background: rgba(255,152,0,0.1);
          color: #ff9800;
          cursor: pointer;
          font-size: 0.75em;
          font-weight: 600;
          transition: all 0.2s;
        }
        .test-mode-toggle.active {
          background: #ff9800;
          color: #000;
        }
        .test-mode-desc {
          font-size: 0.75em;
          opacity: 0.7;
        }
        .test-mode-features {
          font-size: 0.7em;
          opacity: 0.6;
          margin-top: 4px;
          font-style: italic;
        }
        .test-mode-hint {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .test-mode-hint-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: inherit;
          cursor: pointer;
          font-size: 0.7em;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .test-mode-hint-btn:hover { opacity: 0.8; }
        .test-mode-badge {
          background: rgba(255,152,0,0.2);
          color: #ff9800;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: 4px;
          font-size: 0.75em;
        }
        .demo-controls {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .demo-btn {
          padding: 5px 10px;
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 6px;
          background: rgba(255,152,0,0.08);
          color: inherit;
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .demo-btn:hover { background: rgba(255,152,0,0.2); }
        .demo-btn.active { background: rgba(255,152,0,0.25); border-color: #ff9800; }
      </style>
      <ha-card>
        <div class="card-content">
          ${testModeBanner}
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${isOn ? '' : 'off'}"></span>
              ${name}
              ${testMode ? '<span class="test-mode-badge">Demo</span>' : ''}
            </div>
            <button class="icon-btn ${isOn ? 'active' : ''}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${width} x ${height}</span>
              <span>
                <span class="mode-badge">${isOn ? currentMode : 'Off'}</span>
                ${isOn && currentEffect !== 'fixed' ? `<span class="effect-badge">${EFFECTS[currentEffect]?.name || currentEffect}</span>` : ''}
              </span>
            </div>
          </div>
          ${testMode ? `
          <div class="demo-controls">
            <button class="demo-btn" data-demo="text">Text</button>
            <button class="demo-btn" data-demo="scroll">Scroll</button>
            <button class="demo-btn" data-demo="rainbow">Rainbow</button>
            <button class="demo-btn" data-demo="clock">Clock</button>
            <button class="demo-btn" data-demo="fire">Fire</button>
            <button class="demo-btn" data-demo="stars">Stars</button>
          </div>` : ''}
        </div>
      </ha-card>`;

    // Get display container
    this._displayContainer = this.shadowRoot.getElementById('display-screen');

    // In test mode with no shared state text, show sample content
    const displayState = (testMode && !sharedState.text && sharedState.effect === 'fixed')
      ? this._getTestModeState()
      : {
          text: currentText,
          effect: currentEffect,
          speed: currentSpeed,
          fgColor: fgColor,
          bgColor: bgColor,
          mode: currentMode,
          font: currentFont
        };

    // Update display with current state (renderer will be created/updated in _updateDisplay)
    this._updateDisplay(displayState);

    this._attachPowerButton();
    this._attachTestModeListeners();
  }

  _attachPowerButton() {
    this.shadowRoot.getElementById('power-btn')?.addEventListener('click', () => {
      // In test mode, just toggle the display preview
      if (this.isInTestMode()) {
        this._testPowerState = !this._testPowerState;
        this.render();
        return;
      }

      let switchId = this._switchEntityId;
      if (!switchId) {
        const sw = this.getRelatedEntity('switch');
        if (sw) {
          this._switchEntityId = sw.entity_id;
          switchId = sw.entity_id;
        }
      }

      if (switchId && this._hass?.states[switchId]) {
        this._hass.callService('switch', 'toggle', { entity_id: switchId });
      } else {
        const allSwitches = Object.keys(this._hass?.states || {}).filter(e => e.startsWith('switch.'));
        const baseName = this._config.entity?.replace(/^[^.]+\./, '').replace(/_?(text|display|gif_url)$/i, '') || '';
        const match = allSwitches.find(s => s.includes(baseName.substring(0, 10)));
        if (match) {
          this._switchEntityId = match;
          this._hass.callService('switch', 'toggle', { entity_id: match });
        } else {
          console.warn('iPIXEL: No switch found. Entity:', this._config.entity, 'Available:', allSwitches);
        }
      }
    });
  }

  _attachTestModeListeners() {
    // Test mode toggle button
    this.shadowRoot.getElementById('test-mode-toggle')?.addEventListener('click', () => {
      setTestMode(!isTestMode());
    });

    // Demo quick-select buttons
    this.shadowRoot.querySelectorAll('[data-demo]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const demo = e.currentTarget.dataset.demo;
        const demoStates = {
          text: { text: 'iPIXEL', effect: 'fixed', speed: 50, fgColor: '#ff6600', bgColor: '#000000', mode: 'text', font: 'VCR_OSD_MONO' },
          scroll: { text: 'Hello World!', effect: 'scroll_ltr', speed: 40, fgColor: '#00ff88', bgColor: '#000000', mode: 'text', font: 'VCR_OSD_MONO' },
          rainbow: { text: '', effect: 'rainbow', speed: 60, fgColor: '#ffffff', bgColor: '#000000', mode: 'ambient', font: 'VCR_OSD_MONO' },
          clock: { text: '', effect: 'fixed', speed: 50, fgColor: '#00ff88', bgColor: '#000000', mode: 'clock', font: 'VCR_OSD_MONO' },
          fire: { text: '', effect: 'fire', speed: 50, fgColor: '#ffffff', bgColor: '#000000', mode: 'ambient', font: 'VCR_OSD_MONO' },
          stars: { text: '', effect: 'stars', speed: 40, fgColor: '#ffffff', bgColor: '#000000', mode: 'ambient', font: 'VCR_OSD_MONO' },
        };

        const state = demoStates[demo];
        if (state) {
          updateDisplayState(state);
          // Highlight active demo button
          this.shadowRoot.querySelectorAll('[data-demo]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
        }
      });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
