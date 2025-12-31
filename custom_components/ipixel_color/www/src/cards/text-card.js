/**
 * iPIXEL Text Card
 * Text input with effects and colors
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState } from '../state.js';
import { EFFECTS, EFFECT_CATEGORIES } from '../effects/index.js';

export class iPIXELTextCard extends iPIXELCardBase {
  /**
   * Generate effect options grouped by category
   */
  _buildEffectOptions() {
    const textEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.TEXT)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    const colorEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.COLOR)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    const ambientEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    return `
      <optgroup label="Text Effects">
        ${textEffects}
      </optgroup>
      <optgroup label="Color Effects">
        ${colorEffects}
      </optgroup>
      <optgroup label="Ambient Effects">
        ${ambientEffects}
      </optgroup>
    `;
  }

  render() {
    if (!this._hass) return;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--primary-text-color, #fff); }
        select option { font-weight: normal; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Display Text</div>
          <div class="input-row">
            <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
            <button class="btn btn-primary" id="send-btn">Send</button>
          </div>
          <div class="section-title">Effect</div>
          <div class="control-row">
            <select class="dropdown" id="effect">
              ${this._buildEffectOptions()}
            </select>
          </div>
          <div class="section-title">Speed</div>
          <div class="control-row">
            <div class="slider-row">
              <input type="range" class="slider" id="speed" min="1" max="100" value="50">
              <span class="slider-value" id="speed-val">50</span>
            </div>
          </div>
          <div class="section-title">Colors</div>
          <div class="control-row">
            <div class="color-row">
              <span style="font-size: 0.85em;">Text:</span>
              <input type="color" class="color-picker" id="text-color" value="#ff6600">
              <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
              <input type="color" class="color-picker" id="bg-color" value="#000000">
            </div>
          </div>
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  /**
   * Get current form values
   */
  _getFormValues() {
    return {
      text: this.shadowRoot.getElementById('text-input')?.value || '',
      effect: this.shadowRoot.getElementById('effect')?.value || 'fixed',
      speed: parseInt(this.shadowRoot.getElementById('speed')?.value || '50'),
      fgColor: this.shadowRoot.getElementById('text-color')?.value || '#ff6600',
      bgColor: this.shadowRoot.getElementById('bg-color')?.value || '#000000'
    };
  }

  /**
   * Update preview display (without sending to device)
   */
  _updatePreview() {
    const { text, effect, speed, fgColor, bgColor } = this._getFormValues();

    updateDisplayState({
      text: text || 'Preview',
      mode: 'text',
      effect,
      speed,
      fgColor,
      bgColor
    });
  }

  _attachListeners() {
    // Speed slider with live preview
    const speed = this.shadowRoot.getElementById('speed');
    if (speed) {
      speed.style.setProperty('--value', `${speed.value}%`);
      speed.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('speed-val').textContent = e.target.value;
        this._updatePreview();
      });
    }

    // Effect dropdown with live preview
    this.shadowRoot.getElementById('effect')?.addEventListener('change', () => {
      this._updatePreview();
    });

    // Color pickers with live preview
    this.shadowRoot.getElementById('text-color')?.addEventListener('input', () => {
      this._updatePreview();
    });
    this.shadowRoot.getElementById('bg-color')?.addEventListener('input', () => {
      this._updatePreview();
    });

    // Text input with live preview on typing
    this.shadowRoot.getElementById('text-input')?.addEventListener('input', () => {
      this._updatePreview();
    });

    // Send button - sends to actual device
    this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => {
      const { text, effect, speed, fgColor, bgColor } = this._getFormValues();

      if (text) {
        // Update shared state
        updateDisplayState({
          text,
          mode: 'text',
          effect,
          speed,
          fgColor,
          bgColor
        });

        // Update text entity
        if (this._config.entity) {
          this._hass.callService('text', 'set_value', {
            entity_id: this._config.entity,
            value: text
          });
        }

        // Send to device
        this.callService('ipixel_color', 'display_text', {
          text,
          effect,
          speed,
          color_fg: this.hexToRgb(fgColor),
          color_bg: this.hexToRgb(bgColor),
        });
      }
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
