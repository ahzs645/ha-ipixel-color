/**
 * iPIXEL Display Card
 * LED matrix preview with power control and discrete pixel animation
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { textToPixels, textToScrollPixels } from '../font.js';
import { LEDMatrixRenderer, createPixelSvg } from '../renderer.js';
import { getDisplayState } from '../state.js';

export class iPIXELDisplayCard extends iPIXELCardBase {
  constructor() {
    super();
    this._renderer = null;
    this._displayContainer = null;
    this._lastState = null;

    this._handleDisplayUpdate = (e) => {
      this._updateDisplay(e.detail);
    };
    window.addEventListener('ipixel-display-update', this._handleDisplayUpdate);
  }

  disconnectedCallback() {
    window.removeEventListener('ipixel-display-update', this._handleDisplayUpdate);
    if (this._renderer) {
      this._renderer.stop();
      this._renderer = null;
    }
  }

  /**
   * Update the display with new state
   */
  _updateDisplay(state) {
    if (!this._renderer || !this._displayContainer) return;

    const [width, height] = this.getResolution();
    const isOn = this.isOn();

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

    // Update renderer dimensions if changed
    if (this._renderer.width !== width || this._renderer.height !== height) {
      this._renderer.width = width;
      this._renderer.height = height;
    }

    // Check if we need scrolling (text wider than display)
    const textPixelWidth = displayText.length * 6; // 6 pixels per char
    const needsScroll = (effect === 'scroll_ltr' || effect === 'scroll_rtl') && textPixelWidth > width;

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
    const [width, height] = this.getResolution();
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
              <span class="mode-badge">${isOn ? (currentEffect !== 'fixed' ? currentEffect.replace('_', ' ') : currentMode) : 'Off'}</span>
            </div>
          </div>
        </div>
      </ha-card>`;

    // Get display container
    this._displayContainer = this.shadowRoot.getElementById('display-screen');

    // Create or update renderer
    if (!this._renderer) {
      this._renderer = new LEDMatrixRenderer(this._displayContainer, { width, height });
    } else {
      this._renderer.container = this._displayContainer;
      this._renderer.width = width;
      this._renderer.height = height;
    }

    // Update display with current state
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
