/**
 * iPIXEL Text Card
 * Text input with effects and colors - with tabbed interface
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState } from '../state.js';
import {
  renderSlider, attachSlider,
  renderGridSelector, attachGridSelector,
  renderColorRow, attachColorRow,
  renderTabs, attachTabs, renderPanel,
} from '../components/index.js';
import { EFFECTS, EFFECT_CATEGORIES } from 'react-pixel-display/core';

const RAINBOW_MODES = [
  { value: 0, name: 'None' },
  { value: 1, name: 'Rainbow Wave' },
  { value: 2, name: 'Rainbow Cycle' },
  { value: 3, name: 'Rainbow Pulse' },
  { value: 4, name: 'Rainbow Fade' },
  { value: 5, name: 'Rainbow Chase' },
  { value: 6, name: 'Rainbow Sparkle' },
  { value: 7, name: 'Rainbow Gradient' },
  { value: 8, name: 'Rainbow Theater' },
  { value: 9, name: 'Rainbow Fire' },
];

const RHYTHM_STYLES = [
  { value: 0, name: 'Classic Bars' },
  { value: 1, name: 'Mirrored Bars' },
  { value: 2, name: 'Center Out' },
  { value: 3, name: 'Wave Style' },
  { value: 4, name: 'Particle Style' },
];

const RHYTHM_BAND_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '12kHz', '16kHz'];

const TABS = [
  { id: 'text', label: 'Text' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'rhythm', label: 'Rhythm' },
  { id: 'advanced', label: 'GFX' },
];

export class iPIXELTextCard extends iPIXELCardBase {
  constructor() {
    super();
    this._activeTab = 'text';
    this._rhythmLevels = new Array(11).fill(0);
    this._selectedRhythmStyle = 0;
    this._selectedAmbient = 'rainbow';
  }

  _ambientItems() {
    return Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT)
      .map(([name, info]) => ({ value: name, name: info.name }));
  }

  _buildTextEffectOptions() {
    const byCategory = (cat) => Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === cat)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');
    return `
      <optgroup label="Text Effects">${byCategory(EFFECT_CATEGORIES.TEXT)}</optgroup>
      <optgroup label="Color Effects">${byCategory(EFFECT_CATEGORIES.COLOR)}</optgroup>`;
  }

  _renderTextTab() {
    return `
      <div class="section-title">Display Text</div>
      <div class="input-row">
        <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
        <button class="btn btn-primary" id="send-btn">Send</button>
      </div>
      <div class="two-col">
        <div>
          <div class="section-title">Effect</div>
          <div class="control-row">
            <select class="dropdown" id="text-effect">${this._buildTextEffectOptions()}</select>
          </div>
        </div>
        <div>
          <div class="section-title">Rainbow Mode</div>
          <div class="control-row">
            <select class="dropdown" id="rainbow-mode">
              ${RAINBOW_MODES.map(m => `<option value="${m.value}">${m.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="section-title">Speed</div>
      <div class="control-row">
        ${renderSlider({ id: 'text-speed', min: 1, max: 100, value: 50 })}
      </div>
      <div class="section-title">Font</div>
      <div class="control-row">
        <select class="dropdown" id="font-select">
          <option value="VCR_OSD_MONO">VCR OSD Mono</option>
          <option value="CUSONG">CUSONG</option>
          <option value="LEGACY">Legacy (Bitmap)</option>
        </select>
      </div>
      <div class="section-title">Colors</div>
      <div class="control-row">
        ${renderColorRow([
          { id: 'text-color', label: 'Text', value: '#ff6600' },
          { id: 'bg-color', label: 'Background', value: '#000000' },
        ])}
      </div>`;
  }

  _renderAmbientTab() {
    return `
      <div class="section-title">Ambient Effect</div>
      ${renderGridSelector(this._ambientItems(), {
        selected: this._selectedAmbient,
        itemClass: 'effect-btn',
        gridClass: 'effect-grid',
        dataAttr: 'effect',
      })}
      <div class="section-title">Speed</div>
      <div class="control-row">
        ${renderSlider({ id: 'ambient-speed', min: 1, max: 100, value: 50 })}
      </div>
      <button class="btn btn-primary" id="apply-ambient-btn" style="width:100%;margin-top:8px;">Apply Effect</button>`;
  }

  _renderRhythmTab() {
    return `
      <div class="section-title">Visualization Style</div>
      ${renderGridSelector(RHYTHM_STYLES, {
        selected: this._selectedRhythmStyle,
        itemClass: 'style-btn',
        gridClass: 'style-grid',
        dataAttr: 'style',
      })}
      <div class="section-title">Frequency Levels (0-15)</div>
      <div class="rhythm-container">
        ${this._rhythmLevels.map((level, i) => `
          <div class="rhythm-band">
            <label>${RHYTHM_BAND_LABELS[i]}</label>
            <input type="range" class="rhythm-slider" data-band="${i}" min="0" max="15" value="${level}">
            <span class="rhythm-val">${level}</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary" id="apply-rhythm-btn" style="width:100%;margin-top:12px;">Apply Rhythm</button>`;
  }

  _renderGfxTab() {
    return `
      <div class="section-title">GFX JSON Data</div>
      <textarea class="gfx-textarea" id="gfx-json" placeholder='Enter GFX JSON data...
Example:
{
  "width": 64,
  "height": 16,
  "pixels": [
    {"x": 0, "y": 0, "color": "#ff0000"},
    {"x": 1, "y": 0, "color": "#00ff00"}
  ]
}'></textarea>
      <button class="btn btn-primary" id="apply-gfx-btn" style="width:100%;margin-top:12px;">Render GFX</button>
      <div class="section-title" style="margin-top:16px;">Per-Character Colors</div>
      <div class="input-row">
        <input type="text" class="text-input" id="multicolor-text" placeholder="Text (e.g., HELLO)">
      </div>
      <div class="input-row">
        <input type="text" class="text-input" id="multicolor-colors" placeholder="Colors (e.g., #ff0000,#00ff00,#0000ff)">
      </div>
      <button class="btn btn-primary" id="apply-multicolor-btn" style="width:100%;margin-top:8px;">Send Multicolor Text</button>`;
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const active = this._activeTab;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--ipixel-text); }
        select option { font-weight: normal; }
        .effect-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
        .style-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
        .effect-btn, .style-btn {
          padding: 12px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--ipixel-text);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75em;
          text-align: center;
          transition: all 0.2s ease;
        }
        .effect-btn:hover, .style-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .effect-btn.active, .style-btn.active { background: var(--ipixel-primary); border-color: var(--ipixel-primary); }
        .rhythm-band { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .rhythm-band label { width: 50px; font-size: 0.75em; opacity: 0.8; }
        .rhythm-slider { flex: 1; height: 4px; }
        .rhythm-val { width: 20px; font-size: 0.75em; text-align: right; }
        .rhythm-container { max-height: 300px; overflow-y: auto; padding-right: 8px; }
        .gfx-textarea {
          width: 100%; min-height: 150px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--ipixel-text);
          font-family: monospace; font-size: 0.8em;
          padding: 12px; resize: vertical;
        }
        .gfx-textarea:focus { outline: none; border-color: var(--ipixel-primary); }
      </style>
      <ha-card>
        <div class="card-content">
          ${renderTabs(TABS, active)}
          ${renderPanel('text', active === 'text', this._renderTextTab())}
          ${renderPanel('ambient', active === 'ambient', this._renderAmbientTab())}
          ${renderPanel('rhythm', active === 'rhythm', this._renderRhythmTab())}
          ${renderPanel('advanced', active === 'advanced', this._renderGfxTab())}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _getTextFormValues() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    return {
      text: $('text-input')?.value || '',
      effect: $('text-effect')?.value || 'fixed',
      rainbowMode: parseInt($('rainbow-mode')?.value || '0'),
      speed: parseInt($('text-speed')?.value || '50'),
      fgColor: $('text-color')?.value || '#ff6600',
      bgColor: $('bg-color')?.value || '#000000',
      font: $('font-select')?.value || 'VCR_OSD_MONO',
    };
  }

  _getAmbientFormValues() {
    return {
      effect: this._selectedAmbient || 'rainbow',
      speed: parseInt(this.shadowRoot.getElementById('ambient-speed')?.value || '50'),
    };
  }

  _getRhythmFormValues() {
    return { style: this._selectedRhythmStyle || 0, levels: [...this._rhythmLevels] };
  }

  _getGfxFormValues() {
    try { return JSON.parse(this.shadowRoot.getElementById('gfx-json')?.value || ''); }
    catch { return null; }
  }

  _getMulticolorFormValues() {
    const text = this.shadowRoot.getElementById('multicolor-text')?.value || '';
    const colors = (this.shadowRoot.getElementById('multicolor-colors')?.value || '')
      .split(',').map(c => c.trim()).filter(Boolean);
    return { text, colors };
  }

  _updateTextPreview() {
    const { text, effect, speed, fgColor, bgColor, font } = this._getTextFormValues();
    updateDisplayState({ text: text || 'Preview', mode: 'text', effect, speed, fgColor, bgColor, font });
  }

  _updateAmbientPreview() {
    const { effect, speed } = this._getAmbientFormValues();
    updateDisplayState({ text: '', mode: 'ambient', effect, speed, fgColor: '#ffffff', bgColor: '#000000' });
  }

  _attachListeners() {
    attachTabs(this.shadowRoot, (id) => { this._activeTab = id; this.render(); });

    // Text tab
    attachSlider(this.shadowRoot, 'text-speed', { onInput: () => this._updateTextPreview() });
    ['text-effect', 'rainbow-mode', 'font-select'].forEach(id => {
      this.shadowRoot.getElementById(id)?.addEventListener('change', () => this._updateTextPreview());
    });
    attachColorRow(this.shadowRoot, ['text-color', 'bg-color'], () => this._updateTextPreview());
    this.shadowRoot.getElementById('text-input')?.addEventListener('input', () => this._updateTextPreview());
    this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => this._sendText());

    // Ambient tab
    attachGridSelector(this.shadowRoot, '.effect-btn', {
      onSelect: (v) => { this._selectedAmbient = v; this._updateAmbientPreview(); },
      attr: 'effect',
    });
    attachSlider(this.shadowRoot, 'ambient-speed', { onInput: () => this._updateAmbientPreview() });
    this.shadowRoot.getElementById('apply-ambient-btn')?.addEventListener('click', () => {
      const { effect, speed } = this._getAmbientFormValues();
      updateDisplayState({ text: '', mode: 'ambient', effect, speed, fgColor: '#ffffff', bgColor: '#000000' });
    });

    // Rhythm tab
    attachGridSelector(this.shadowRoot, '.style-btn', {
      onSelect: (v) => { this._selectedRhythmStyle = parseInt(v); },
      attr: 'style',
    });
    this.shadowRoot.querySelectorAll('.rhythm-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const band = parseInt(e.target.dataset.band);
        const value = parseInt(e.target.value);
        this._rhythmLevels[band] = value;
        e.target.nextElementSibling.textContent = value;
      });
    });
    this.shadowRoot.getElementById('apply-rhythm-btn')?.addEventListener('click', () => {
      const { style, levels } = this._getRhythmFormValues();
      updateDisplayState({ text: '', mode: 'rhythm', rhythmStyle: style, rhythmLevels: levels });
      this.callService('ipixel_color', 'set_rhythm_level', { style, levels });
    });

    // GFX tab
    this.shadowRoot.getElementById('apply-gfx-btn')?.addEventListener('click', () => {
      const gfxData = this._getGfxFormValues();
      if (!gfxData) { console.warn('iPIXEL: Invalid GFX JSON'); return; }
      updateDisplayState({ text: '', mode: 'gfx', gfxData });
      this.callService('ipixel_color', 'render_gfx', { data: gfxData });
    });
    this.shadowRoot.getElementById('apply-multicolor-btn')?.addEventListener('click', () => {
      const { text, colors } = this._getMulticolorFormValues();
      if (!text || !colors.length) return;
      updateDisplayState({ text, mode: 'multicolor', colors });
      this.callService('ipixel_color', 'display_multicolor_text', {
        text, colors: colors.map(c => this.hexToRgb(c)),
      });
    });
  }

  _sendText() {
    const { text, effect, rainbowMode, speed, fgColor, bgColor, font } = this._getTextFormValues();
    if (!text) return;

    updateDisplayState({ text, mode: 'text', effect, speed, fgColor, bgColor, font, rainbowMode });
    if (this.isInTestMode()) return;

    if (this._config.entity && this._hass) {
      this._hass.callService('text', 'set_value', { entity_id: this._config.entity, value: text });
    }

    const backendFont = font === 'LEGACY' ? 'CUSONG' : font;
    this.callService('ipixel_color', 'display_text', {
      text, effect, speed,
      color_fg: this.hexToRgb(fgColor),
      color_bg: this.hexToRgb(bgColor),
      font: backendFont,
      rainbow_mode: rainbowMode,
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
