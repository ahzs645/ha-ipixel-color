/**
 * iPIXEL Display Card
 * LED matrix preview with power control and discrete pixel animation
 * Fixed to preserve renderer state and resolution across re-renders
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { textToPixels, textToScrollPixels } from '../font.js';
import { LEDMatrixRenderer, createPixelSvg, EFFECTS } from '../renderer.js';
import { getDisplayState, updateDisplayState } from '../state.js';

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
  }

  disconnectedCallback() {
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

    // If sensors return valid values, cache them
    if (sensorWidth > 0 && sensorHeight > 0 && sensorWidth !== 64) {
      this._cachedResolution = [sensorWidth, sensorHeight];
      // Also save to localStorage for persistence
      try {
        localStorage.setItem('iPIXEL_Resolution', JSON.stringify([sensorWidth, sensorHeight]));
      } catch (e) { }
    }

    // If we have cached resolution, use it
    if (this._cachedResolution) {
      return this._cachedResolution;
    }

    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('iPIXEL_Resolution');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) {
          this._cachedResolution = parsed;
          return parsed;
        }
      }
    } catch (e) { }

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
      // Display off - show blank
      this._renderer.stop();
      const pixels = textToPixels('', width, height, '#111', '#050505');
      this._displayContainer.innerHTML = createPixelSvg(width, height, pixels);
      return;
    }

    const text = state?.text || '';
    const effect = state?.effect || 'fixed';
    const speed = state?.speed || 50;
    const fgColor = state?.fgColor || '#ff6600';
    const bgColor = state?.bgColor || '#111';
    const mode = state?.mode || 'text';

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
      // Check if we need scrolling (text wider than display)
      const textPixelWidth = displayText.length * 6; // 6 pixels per char
      const needsScroll = (effect === 'scroll_ltr' || effect === 'scroll_rtl' || effect === 'bounce') && textPixelWidth > width;

      if (needsScroll) {
        // Generate extended pixel data for scrolling
        const { pixels: extendedPixels, width: extendedWidth } = textToScrollPixels(
          displayText, width, height, displayFg, bgColor
        );
        const displayPixels = textToPixels(displayText, width, height, displayFg, bgColor);
        this._renderer.setData(displayPixels, extendedPixels, extendedWidth);
      } else {
        // Static or non-scroll effects
        const pixels = textToPixels(displayText, width, height, displayFg, bgColor);
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

  render() {
    if (!this._hass) return;

    const [width, height] = this._getResolutionCached();
    const isOn = this.isOn();
    const name = this._config.name || this.getEntity()?.attributes?.friendly_name || 'iPIXEL Display';

    // Get current state
    const sharedState = getDisplayState();
    const textEntity = this.getEntity();
    const entityText = textEntity?.state || '';
    const modeEntity = this.getRelatedEntity('select', '_mode');
    const currentMode = modeEntity?.state || sharedState.mode || 'text';

    const currentText = sharedState.text || entityText;
    const currentEffect = sharedState.effect || 'fixed';
    const currentSpeed = sharedState.speed || 50;
    const fgColor = sharedState.fgColor || '#ff6600';
    const bgColor = sharedState.bgColor || '#111';

    // Check if effect is ambient
    const effectInfo = EFFECTS[currentEffect];
    const isAmbient = effectInfo?.category === 'ambient';

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
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${isOn ? '' : 'off'}"></span>
              ${name}
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
        </div>
      </ha-card>`;

    // Get display container
    this._displayContainer = this.shadowRoot.getElementById('display-screen');

    // Update display with current state (renderer will be created/updated in _updateDisplay)
    this._updateDisplay({
      text: currentText,
      effect: currentEffect,
      speed: currentSpeed,
      fgColor: fgColor,
      bgColor: bgColor,
      mode: currentMode
    });

    this._attachPowerButton();
  }

  _attachPowerButton() {
    this.shadowRoot.getElementById('power-btn')?.addEventListener('click', () => {
      let switchId = this._switchEntityId;
      if (!switchId) {
        const sw = this.getRelatedEntity('switch');
        if (sw) {
          this._switchEntityId = sw.entity_id;
          switchId = sw.entity_id;
        }
      }

      if (switchId && this._hass.states[switchId]) {
        this._hass.callService('switch', 'toggle', { entity_id: switchId });
      } else {
        const allSwitches = Object.keys(this._hass.states).filter(e => e.startsWith('switch.'));
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

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
