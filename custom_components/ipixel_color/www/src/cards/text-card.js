/**
 * iPIXEL Text Card
 * Text input with effects and colors - with tabbed interface
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState } from '../state.js';
import { EFFECTS, EFFECT_CATEGORIES } from '../effects/index.js';

// Rainbow mode names (0-9)
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
  { value: 9, name: 'Rainbow Fire' }
];

// Rhythm visualization styles (0-4)
const RHYTHM_STYLES = [
  { value: 0, name: 'Classic Bars' },
  { value: 1, name: 'Mirrored Bars' },
  { value: 2, name: 'Center Out' },
  { value: 3, name: 'Wave Style' },
  { value: 4, name: 'Particle Style' }
];

export class iPIXELTextCard extends iPIXELCardBase {
  constructor() {
    super();
    this._activeTab = 'text'; // 'text', 'ambient', 'rhythm', or 'advanced'
    this._rhythmLevels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 11 frequency bands
    this._selectedRhythmStyle = 0;
    this._selectedAmbient = 'rainbow';
  }

  /**
   * Generate text effect options (text + color effects)
   */
  _buildTextEffectOptions() {
    const textEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.TEXT)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    const colorEffects = Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.COLOR)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');

    return `
      <optgroup label="Text Effects">
        ${textEffects}
      </optgroup>
      <optgroup label="Color Effects">
        ${colorEffects}
      </optgroup>
    `;
  }

  /**
   * Generate ambient effect options
   */
  _buildAmbientEffectOptions() {
    return Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT)
      .map(([name, info]) => `<option value="${name}">${info.name}</option>`)
      .join('');
  }

  /**
   * Build ambient effects as a button grid
   */
  _buildAmbientGrid() {
    const selected = this._selectedAmbient || 'rainbow';
    return Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT)
      .map(([name, info]) => `
        <button class="effect-btn ${name === selected ? 'active' : ''}" data-effect="${name}">
          ${info.name}
        </button>
      `)
      .join('');
  }

  /**
   * Build rainbow mode options for dropdown
   */
  _buildRainbowOptions() {
    return RAINBOW_MODES.map(mode =>
      `<option value="${mode.value}">${mode.name}</option>`
    ).join('');
  }

  /**
   * Build rhythm style grid
   */
  _buildRhythmStyleGrid() {
    const selected = this._selectedRhythmStyle || 0;
    return RHYTHM_STYLES.map(style => `
      <button class="style-btn ${style.value === selected ? 'active' : ''}" data-style="${style.value}">
        ${style.name}
      </button>
    `).join('');
  }

  /**
   * Build rhythm level sliders (11 frequency bands)
   */
  _buildRhythmLevelSliders() {
    const labels = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '12kHz', '16kHz'];
    return this._rhythmLevels.map((level, i) => `
      <div class="rhythm-band">
        <label>${labels[i]}</label>
        <input type="range" class="rhythm-slider" data-band="${i}" min="0" max="15" value="${level}">
        <span class="rhythm-val">${level}</span>
      </div>
    `).join('');
  }

  render() {
    if (!this._hass) return;

    const isTextTab = this._activeTab === 'text';
    const isAmbientTab = this._activeTab === 'ambient';
    const isRhythmTab = this._activeTab === 'rhythm';
    const isAdvancedTab = this._activeTab === 'advanced';

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
        .tab {
          flex: 1;
          padding: 10px 8px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          cursor: pointer;
          border-radius: 8px;
          font-size: 0.8em;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .tab:hover { background: rgba(255,255,255,0.1); }
        .tab.active {
          background: var(--primary-color, #03a9f4);
          color: #fff;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--primary-text-color, #fff); }
        select option { font-weight: normal; }
        .effect-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .effect-btn, .style-btn {
          padding: 12px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75em;
          text-align: center;
          transition: all 0.2s ease;
        }
        .effect-btn:hover, .style-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .effect-btn.active, .style-btn.active {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .rhythm-band {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rhythm-band label {
          width: 50px;
          font-size: 0.75em;
          opacity: 0.8;
        }
        .rhythm-slider {
          flex: 1;
          height: 4px;
        }
        .rhythm-val {
          width: 20px;
          font-size: 0.75em;
          text-align: right;
        }
        .rhythm-container {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .gfx-textarea {
          width: 100%;
          min-height: 150px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--primary-text-color, #fff);
          font-family: monospace;
          font-size: 0.8em;
          padding: 12px;
          resize: vertical;
        }
        .gfx-textarea:focus {
          outline: none;
          border-color: var(--primary-color, #03a9f4);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="tabs">
            <button class="tab ${isTextTab ? 'active' : ''}" id="tab-text">Text</button>
            <button class="tab ${isAmbientTab ? 'active' : ''}" id="tab-ambient">Ambient</button>
            <button class="tab ${isRhythmTab ? 'active' : ''}" id="tab-rhythm">Rhythm</button>
            <button class="tab ${isAdvancedTab ? 'active' : ''}" id="tab-advanced">GFX</button>
          </div>

          <!-- Text Tab -->
          <div class="tab-content ${isTextTab ? 'active' : ''}" id="content-text">
            <div class="section-title">Display Text</div>
            <div class="input-row">
              <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
              <button class="btn btn-primary" id="send-btn">Send</button>
            </div>
            <div class="two-col">
              <div>
                <div class="section-title">Effect</div>
                <div class="control-row">
                  <select class="dropdown" id="text-effect">
                    ${this._buildTextEffectOptions()}
                  </select>
                </div>
              </div>
              <div>
                <div class="section-title">Rainbow Mode</div>
                <div class="control-row">
                  <select class="dropdown" id="rainbow-mode">
                    ${this._buildRainbowOptions()}
                  </select>
                </div>
              </div>
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="text-speed" min="1" max="100" value="50">
                <span class="slider-value" id="text-speed-val">50</span>
              </div>
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
              <div class="color-row">
                <span style="font-size: 0.85em;">Text:</span>
                <input type="color" class="color-picker" id="text-color" value="#ff6600">
                <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
                <input type="color" class="color-picker" id="bg-color" value="#000000">
              </div>
            </div>
          </div>

          <!-- Ambient Tab -->
          <div class="tab-content ${isAmbientTab ? 'active' : ''}" id="content-ambient">
            <div class="section-title">Ambient Effect</div>
            <div class="effect-grid" id="ambient-grid">
              ${this._buildAmbientGrid()}
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="ambient-speed" min="1" max="100" value="50">
                <span class="slider-value" id="ambient-speed-val">50</span>
              </div>
            </div>
            <button class="btn btn-primary" id="apply-ambient-btn" style="width: 100%; margin-top: 8px;">Apply Effect</button>
          </div>

          <!-- Rhythm Tab -->
          <div class="tab-content ${isRhythmTab ? 'active' : ''}" id="content-rhythm">
            <div class="section-title">Visualization Style</div>
            <div class="style-grid" id="rhythm-style-grid">
              ${this._buildRhythmStyleGrid()}
            </div>
            <div class="section-title">Frequency Levels (0-15)</div>
            <div class="rhythm-container">
              ${this._buildRhythmLevelSliders()}
            </div>
            <button class="btn btn-primary" id="apply-rhythm-btn" style="width: 100%; margin-top: 12px;">Apply Rhythm</button>
          </div>

          <!-- Advanced/GFX Tab -->
          <div class="tab-content ${isAdvancedTab ? 'active' : ''}" id="content-advanced">
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
            <button class="btn btn-primary" id="apply-gfx-btn" style="width: 100%; margin-top: 12px;">Render GFX</button>
            <div class="section-title" style="margin-top: 16px;">Per-Character Colors</div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-text" placeholder="Text (e.g., HELLO)">
            </div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-colors" placeholder="Colors (e.g., #ff0000,#00ff00,#0000ff)">
            </div>
            <button class="btn btn-primary" id="apply-multicolor-btn" style="width: 100%; margin-top: 8px;">Send Multicolor Text</button>
          </div>
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  /**
   * Get text tab form values
   */
  _getTextFormValues() {
    return {
      text: this.shadowRoot.getElementById('text-input')?.value || '',
      effect: this.shadowRoot.getElementById('text-effect')?.value || 'fixed',
      rainbowMode: parseInt(this.shadowRoot.getElementById('rainbow-mode')?.value || '0'),
      speed: parseInt(this.shadowRoot.getElementById('text-speed')?.value || '50'),
      fgColor: this.shadowRoot.getElementById('text-color')?.value || '#ff6600',
      bgColor: this.shadowRoot.getElementById('bg-color')?.value || '#000000',
      font: this.shadowRoot.getElementById('font-select')?.value || 'VCR_OSD_MONO'
    };
  }

  /**
   * Get rhythm tab form values
   */
  _getRhythmFormValues() {
    return {
      style: this._selectedRhythmStyle || 0,
      levels: [...this._rhythmLevels]
    };
  }

  /**
   * Get GFX/advanced tab form values
   */
  _getGfxFormValues() {
    const jsonText = this.shadowRoot.getElementById('gfx-json')?.value || '';
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get multicolor text form values
   */
  _getMulticolorFormValues() {
    const text = this.shadowRoot.getElementById('multicolor-text')?.value || '';
    const colorsStr = this.shadowRoot.getElementById('multicolor-colors')?.value || '';
    const colors = colorsStr.split(',').map(c => c.trim()).filter(c => c);
    return { text, colors };
  }

  /**
   * Get ambient tab form values
   */
  _getAmbientFormValues() {
    return {
      effect: this._selectedAmbient || 'rainbow',
      speed: parseInt(this.shadowRoot.getElementById('ambient-speed')?.value || '50')
    };
  }

  /**
   * Update text preview (without sending to device)
   */
  _updateTextPreview() {
    const { text, effect, speed, fgColor, bgColor, font } = this._getTextFormValues();

    updateDisplayState({
      text: text || 'Preview',
      mode: 'text',
      effect,
      speed,
      fgColor,
      bgColor,
      font
    });
  }

  /**
   * Update ambient preview
   */
  _updateAmbientPreview() {
    const { effect, speed } = this._getAmbientFormValues();

    updateDisplayState({
      text: '',
      mode: 'ambient',
      effect,
      speed,
      fgColor: '#ffffff',
      bgColor: '#000000'
    });
  }

  _attachListeners() {
    // Tab switching
    this.shadowRoot.getElementById('tab-text')?.addEventListener('click', () => {
      this._activeTab = 'text';
      this.render();
    });

    this.shadowRoot.getElementById('tab-ambient')?.addEventListener('click', () => {
      this._activeTab = 'ambient';
      this.render();
    });

    this.shadowRoot.getElementById('tab-rhythm')?.addEventListener('click', () => {
      this._activeTab = 'rhythm';
      this.render();
    });

    this.shadowRoot.getElementById('tab-advanced')?.addEventListener('click', () => {
      this._activeTab = 'advanced';
      this.render();
    });

    // === Text Tab Listeners ===

    // Text speed slider with live preview
    const textSpeed = this.shadowRoot.getElementById('text-speed');
    if (textSpeed) {
      textSpeed.style.setProperty('--value', `${textSpeed.value}%`);
      textSpeed.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('text-speed-val').textContent = e.target.value;
        this._updateTextPreview();
      });
    }

    // Text effect dropdown with live preview
    this.shadowRoot.getElementById('text-effect')?.addEventListener('change', () => {
      this._updateTextPreview();
    });

    // Rainbow mode dropdown with live preview
    this.shadowRoot.getElementById('rainbow-mode')?.addEventListener('change', () => {
      this._updateTextPreview();
    });

    // Font selector with live preview
    this.shadowRoot.getElementById('font-select')?.addEventListener('change', () => {
      this._updateTextPreview();
    });

    // Color pickers with live preview
    this.shadowRoot.getElementById('text-color')?.addEventListener('input', () => {
      this._updateTextPreview();
    });
    this.shadowRoot.getElementById('bg-color')?.addEventListener('input', () => {
      this._updateTextPreview();
    });

    // Text input with live preview on typing
    this.shadowRoot.getElementById('text-input')?.addEventListener('input', () => {
      this._updateTextPreview();
    });

    // Send text button
    this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => {
      const { text, effect, rainbowMode, speed, fgColor, bgColor, font } = this._getTextFormValues();

      if (text) {
        updateDisplayState({
          text,
          mode: 'text',
          effect,
          speed,
          fgColor,
          bgColor,
          font,
          rainbowMode
        });

        if (this._config.entity) {
          this._hass.callService('text', 'set_value', {
            entity_id: this._config.entity,
            value: text
          });
        }

        // Map font name for backend (LEGACY uses default CUSONG)
        const backendFont = font === 'LEGACY' ? 'CUSONG' : font;

        this.callService('ipixel_color', 'display_text', {
          text,
          effect,
          speed,
          color_fg: this.hexToRgb(fgColor),
          color_bg: this.hexToRgb(bgColor),
          font: backendFont,
          rainbow_mode: rainbowMode,
        });
      }
    });

    // === Ambient Tab Listeners ===

    // Ambient effect grid buttons
    this.shadowRoot.querySelectorAll('.effect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const effect = e.target.dataset.effect;
        this._selectedAmbient = effect;

        // Update button states
        this.shadowRoot.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Live preview
        this._updateAmbientPreview();
      });
    });

    // Ambient speed slider
    const ambientSpeed = this.shadowRoot.getElementById('ambient-speed');
    if (ambientSpeed) {
      ambientSpeed.style.setProperty('--value', `${ambientSpeed.value}%`);
      ambientSpeed.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('ambient-speed-val').textContent = e.target.value;
        this._updateAmbientPreview();
      });
    }

    // Apply ambient effect button
    this.shadowRoot.getElementById('apply-ambient-btn')?.addEventListener('click', () => {
      const { effect, speed } = this._getAmbientFormValues();

      updateDisplayState({
        text: '',
        mode: 'ambient',
        effect,
        speed,
        fgColor: '#ffffff',
        bgColor: '#000000'
      });

      // TODO: Send ambient effect to device when service is available
      // For now just update the preview
    });

    // === Rhythm Tab Listeners ===

    // Rhythm style buttons
    this.shadowRoot.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const style = parseInt(e.target.dataset.style);
        this._selectedRhythmStyle = style;

        // Update button states
        this.shadowRoot.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Rhythm level sliders
    this.shadowRoot.querySelectorAll('.rhythm-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const band = parseInt(e.target.dataset.band);
        const value = parseInt(e.target.value);
        this._rhythmLevels[band] = value;
        e.target.nextElementSibling.textContent = value;
      });
    });

    // Apply rhythm button
    this.shadowRoot.getElementById('apply-rhythm-btn')?.addEventListener('click', () => {
      const { style, levels } = this._getRhythmFormValues();

      updateDisplayState({
        text: '',
        mode: 'rhythm',
        rhythmStyle: style,
        rhythmLevels: levels
      });

      // Call rhythm service if available
      this.callService('ipixel_color', 'set_rhythm_level', {
        style,
        levels
      });
    });

    // === Advanced/GFX Tab Listeners ===

    // Apply GFX button
    this.shadowRoot.getElementById('apply-gfx-btn')?.addEventListener('click', () => {
      const gfxData = this._getGfxFormValues();
      if (!gfxData) {
        console.warn('iPIXEL: Invalid GFX JSON');
        return;
      }

      updateDisplayState({
        text: '',
        mode: 'gfx',
        gfxData
      });

      // Call GFX service if available
      this.callService('ipixel_color', 'render_gfx', {
        data: gfxData
      });
    });

    // Apply multicolor text button
    this.shadowRoot.getElementById('apply-multicolor-btn')?.addEventListener('click', () => {
      const { text, colors } = this._getMulticolorFormValues();

      if (text && colors.length > 0) {
        updateDisplayState({
          text,
          mode: 'multicolor',
          colors
        });

        // Call multicolor text service if available
        this.callService('ipixel_color', 'display_multicolor_text', {
          text,
          colors: colors.map(c => this.hexToRgb(c))
        });
      }
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
