/**
 * iPIXEL Controls Card
 * Brightness, mode, clock settings, and device controls
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState, saveDisplayState } from '../state.js';

// Clock styles supported by device (1-8)
const CLOCK_STYLES = [
  { value: 1, name: 'Style 1 (Digital)' },
  { value: 2, name: 'Style 2 (Minimal)' },
  { value: 3, name: 'Style 3 (Bold)' },
  { value: 4, name: 'Style 4 (Retro)' },
  { value: 5, name: 'Style 5 (Neon)' },
  { value: 6, name: 'Style 6 (Matrix)' },
  { value: 7, name: 'Style 7 (Classic)' },
  { value: 8, name: 'Style 8 (Modern)' }
];

// Text animation modes (0-7)
const ANIMATION_MODES = [
  { value: 0, name: 'Static' },
  { value: 1, name: 'Scroll Left' },
  { value: 2, name: 'Scroll Right' },
  { value: 3, name: 'Scroll Up' },
  { value: 4, name: 'Scroll Down' },
  { value: 5, name: 'Flash' },
  { value: 6, name: 'Fade In/Out' },
  { value: 7, name: 'Bounce' }
];

export class iPIXELControlsCard extends iPIXELCardBase {
  constructor() {
    super();
    this._clockStyle = 1;
    this._is24Hour = true;
    this._showDate = false;
    this._upsideDown = false;
    this._animationMode = 0;
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;
    const isOn = this.isOn();

    // Get upside down state from entity if available
    const upsideDownEntity = this.getRelatedEntity('switch', '_upside_down');
    if (upsideDownEntity) {
      this._upsideDown = upsideDownEntity.state === 'on';
    }

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }
        .toggle-label {
          font-size: 0.85em;
          color: var(--primary-text-color, #fff);
        }
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .toggle-switch.active {
          background: var(--primary-color, #03a9f4);
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .toggle-switch.active::after {
          transform: translateX(20px);
        }
        .subsection {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .subsection-title {
          font-size: 0.75em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.6;
          margin-bottom: 8px;
        }
        .screen-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .screen-btn {
          padding: 8px 4px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8em;
          text-align: center;
          transition: all 0.2s;
        }
        .screen-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .screen-btn.active {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .screen-btn.delete {
          background: rgba(244,67,54,0.2);
          border-color: rgba(244,67,54,0.3);
          color: #f44336;
        }
        .screen-btn.delete:hover {
          background: rgba(244,67,54,0.4);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .compact-row { display: flex; gap: 8px; align-items: center; }
        .compact-row select { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Quick Actions</div>
          <div class="control-row">
            <div class="button-grid button-grid-4">
              <button class="icon-btn ${isOn ? 'active' : ''}" data-action="power" title="Power">
                <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clear" title="Clear">
                <svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clock" title="Clock">
                <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>
              </button>
              <button class="icon-btn" data-action="sync" title="Sync Time">
                <svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.5 16.5,3.5 14.5,3.13V5.17C15.86,5.5 17.08,6.23 18.2,7.27M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12M5.8,16.73L4.38,18.15C5.73,19.5 7.5,20.5 9.5,20.87V18.83C8.14,18.5 6.92,17.77 5.8,16.73M4,12H2A10,10 0 0,0 12,22V20A8,8 0 0,1 4,12Z"/></svg>
              </button>
            </div>
          </div>

          <div class="section-title">Brightness</div>
          <div class="control-row">
            <div class="slider-row">
              <input type="range" class="slider" id="brightness" min="1" max="100" value="50">
              <span class="slider-value" id="brightness-val">50%</span>
            </div>
          </div>

          <div class="section-title">Display Mode</div>
          <div class="control-row">
            <div class="button-grid button-grid-3">
              <button class="mode-btn" data-mode="textimage">Text+Image</button>
              <button class="mode-btn" data-mode="text">Text</button>
              <button class="mode-btn" data-mode="clock">Clock</button>
              <button class="mode-btn" data-mode="gif">GIF</button>
              <button class="mode-btn" data-mode="rhythm">Rhythm</button>
            </div>
          </div>

          <div class="section-title">Clock Settings</div>
          <div class="subsection">
            <div class="compact-row" style="margin-bottom: 12px;">
              <select class="dropdown" id="clock-style">
                ${CLOCK_STYLES.map(s => `<option value="${s.value}"${s.value === this._clockStyle ? ' selected' : ''}>${s.name}</option>`).join('')}
              </select>
              <button class="btn btn-primary" id="apply-clock-btn">Apply</button>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">24-Hour Format</span>
              <div class="toggle-switch ${this._is24Hour ? 'active' : ''}" id="toggle-24h"></div>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">Show Date</span>
              <div class="toggle-switch ${this._showDate ? 'active' : ''}" id="toggle-date"></div>
            </div>
          </div>

          <div class="section-title">Text Animation</div>
          <div class="control-row">
            <select class="dropdown" id="animation-mode">
              ${ANIMATION_MODES.map(m => `<option value="${m.value}"${m.value === this._animationMode ? ' selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>

          <div class="section-title">Orientation & Display</div>
          <div class="two-col">
            <div>
              <div class="subsection-title">Rotation</div>
              <select class="dropdown" id="orientation">
                <option value="0">0° (Normal)</option>
                <option value="1">180°</option>
              </select>
            </div>
            <div>
              <div class="subsection-title">Flip</div>
              <div class="toggle-row" style="padding: 4px 0;">
                <span class="toggle-label">Upside Down</span>
                <div class="toggle-switch ${this._upsideDown ? 'active' : ''}" id="toggle-upside-down"></div>
              </div>
            </div>
          </div>

          <div class="section-title">Screen Slots</div>
          <div class="subsection">
            <div class="subsection-title">Select Screen (1-9)</div>
            <div class="screen-grid" style="margin-bottom: 12px;">
              ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="screen-btn" data-screen="${n}">${n}</button>`).join('')}
            </div>
            <div class="subsection-title">Delete Screen</div>
            <div class="screen-grid">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `<button class="screen-btn delete" data-delete="${n}">×${n}</button>`).join('')}
            </div>
          </div>

          <div class="section-title">Font Settings</div>
          <div class="subsection">
            <div class="two-col" style="margin-bottom: 12px;">
              <div>
                <div class="subsection-title">Size (1-128)</div>
                <input type="number" class="text-input" id="font-size" value="16" min="1" max="128" style="width: 100%;">
              </div>
              <div>
                <div class="subsection-title">Offset X, Y</div>
                <div style="display: flex; gap: 4px;">
                  <input type="number" class="text-input" id="font-offset-x" value="0" min="-64" max="64" style="width: 50%;">
                  <input type="number" class="text-input" id="font-offset-y" value="0" min="-32" max="32" style="width: 50%;">
                </div>
              </div>
            </div>
          </div>

          <div class="section-title">DIY Mode</div>
          <div class="control-row">
            <select class="dropdown" id="diy-mode">
              <option value="">-- Select Action --</option>
              <option value="1">Enter (Clear Display)</option>
              <option value="3">Enter (Preserve Content)</option>
              <option value="0">Exit (Keep Previous)</option>
              <option value="2">Exit (Keep Current)</option>
            </select>
          </div>

          <div class="section-title">Raw Command</div>
          <div class="control-row" style="margin-top: 8px;">
            <div style="display: flex; gap: 8px;">
              <input type="text" class="text-input" id="raw-command" placeholder="Raw hex (e.g., 05 00 07 01 01)" style="flex: 1;">
              <button class="btn btn-secondary" id="send-raw-btn">Send</button>
            </div>
          </div>
        </div>
      </ha-card>`;

    this._attachControlListeners();
  }

  _attachControlListeners() {
    // Action buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === 'power') {
          const sw = this.getRelatedEntity('switch');
          if (sw) {
            this._hass.callService('switch', 'toggle', { entity_id: sw.entity_id });
          }
        } else if (action === 'clear') {
          updateDisplayState({ text: '', mode: 'text', effect: 'fixed', speed: 50, fgColor: '#ff6600', bgColor: '#000000' });
          this.callService('ipixel_color', 'clear_pixels');
        } else if (action === 'clock') {
          this._applyClockSettings();
        } else if (action === 'sync') {
          this.callService('ipixel_color', 'sync_time');
        }
      });
    });

    // Brightness slider
    const slider = this.shadowRoot.getElementById('brightness');
    if (slider) {
      slider.style.setProperty('--value', `${slider.value}%`);
      slider.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('brightness-val').textContent = `${e.target.value}%`;
      });
      slider.addEventListener('change', (e) => {
        this.callService('ipixel_color', 'set_brightness', { level: parseInt(e.target.value) });
      });
    }

    // Mode buttons
    this.shadowRoot.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        const modeEntity = this.getRelatedEntity('select', '_mode');
        if (modeEntity) {
          this._hass.callService('select', 'select_option', { entity_id: modeEntity.entity_id, option: mode });
        }

        const modeColors = {
          'text': '#ff6600', 'textimage': '#ff6600', 'clock': '#00ff88',
          'gif': '#ff44ff', 'rhythm': '#44aaff'
        };
        updateDisplayState({
          mode: mode,
          fgColor: modeColors[mode] || '#ff6600',
          text: mode === 'clock' ? '' : window.iPIXELDisplayState?.text || ''
        });

        this.shadowRoot.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Clock style dropdown and apply button
    this.shadowRoot.getElementById('clock-style')?.addEventListener('change', (e) => {
      this._clockStyle = parseInt(e.target.value);
    });

    this.shadowRoot.getElementById('apply-clock-btn')?.addEventListener('click', () => {
      this._applyClockSettings();
    });

    // Clock toggles
    this.shadowRoot.getElementById('toggle-24h')?.addEventListener('click', (e) => {
      this._is24Hour = !this._is24Hour;
      e.currentTarget.classList.toggle('active', this._is24Hour);
    });

    this.shadowRoot.getElementById('toggle-date')?.addEventListener('click', (e) => {
      this._showDate = !this._showDate;
      e.currentTarget.classList.toggle('active', this._showDate);
    });

    // Animation mode
    this.shadowRoot.getElementById('animation-mode')?.addEventListener('change', (e) => {
      this._animationMode = parseInt(e.target.value);
      updateDisplayState({ animationMode: this._animationMode });
      this.callService('ipixel_color', 'set_animation_mode', { mode: this._animationMode });
    });

    // Orientation dropdown
    this.shadowRoot.getElementById('orientation')?.addEventListener('change', (e) => {
      const orientation = parseInt(e.target.value);
      this.callService('ipixel_color', 'set_orientation', { orientation });
    });

    // Upside down toggle
    this.shadowRoot.getElementById('toggle-upside-down')?.addEventListener('click', (e) => {
      this._upsideDown = !this._upsideDown;
      e.currentTarget.classList.toggle('active', this._upsideDown);

      const upsideDownEntity = this.getRelatedEntity('switch', '_upside_down');
      if (upsideDownEntity) {
        this._hass.callService('switch', this._upsideDown ? 'turn_on' : 'turn_off', {
          entity_id: upsideDownEntity.entity_id
        });
      } else {
        this.callService('ipixel_color', 'set_upside_down', { enabled: this._upsideDown });
      }
    });

    // Screen buffer selection
    this.shadowRoot.querySelectorAll('[data-screen]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screen = parseInt(e.currentTarget.dataset.screen);
        this.callService('ipixel_color', 'set_screen', { screen: screen });
        // Update active state
        this.shadowRoot.querySelectorAll('[data-screen]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Screen deletion
    this.shadowRoot.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.currentTarget.dataset.delete);
        if (confirm(`Delete screen slot ${slot}?`)) {
          this.callService('ipixel_color', 'delete_screen', { slot });
        }
      });
    });

    // Font settings
    this.shadowRoot.getElementById('font-size')?.addEventListener('change', (e) => {
      const size = parseInt(e.target.value);
      updateDisplayState({ fontSize: size });
      this.callService('ipixel_color', 'set_font_size', { size });
    });

    this.shadowRoot.getElementById('font-offset-x')?.addEventListener('change', () => {
      this._updateFontOffset();
    });

    this.shadowRoot.getElementById('font-offset-y')?.addEventListener('change', () => {
      this._updateFontOffset();
    });

    // DIY mode dropdown
    this.shadowRoot.getElementById('diy-mode')?.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode !== '') {
        this.callService('ipixel_color', 'set_diy_mode', { mode: mode });
        // Reset dropdown after action
        setTimeout(() => { e.target.value = ''; }, 500);
      }
    });

    // Raw command input
    this.shadowRoot.getElementById('send-raw-btn')?.addEventListener('click', () => {
      const hexData = this.shadowRoot.getElementById('raw-command')?.value;
      if (hexData && hexData.trim()) {
        this.callService('ipixel_color', 'send_raw_command', { hex_data: hexData.trim() });
      }
    });

    // Also allow Enter key to send raw command
    this.shadowRoot.getElementById('raw-command')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const hexData = e.target.value;
        if (hexData && hexData.trim()) {
          this.callService('ipixel_color', 'send_raw_command', { hex_data: hexData.trim() });
        }
      }
    });
  }

  _applyClockSettings() {
    updateDisplayState({
      text: '',
      mode: 'clock',
      effect: 'fixed',
      speed: 50,
      fgColor: '#00ff88',
      bgColor: '#000000',
      clockStyle: this._clockStyle,
      is24Hour: this._is24Hour,
      showDate: this._showDate
    });
    this.callService('ipixel_color', 'set_clock_mode', {
      style: this._clockStyle,
      format_24h: this._is24Hour,
      show_date: this._showDate
    });
  }

  _updateFontOffset() {
    const x = parseInt(this.shadowRoot.getElementById('font-offset-x')?.value || '0');
    const y = parseInt(this.shadowRoot.getElementById('font-offset-y')?.value || '0');
    updateDisplayState({ fontOffsetX: x, fontOffsetY: y });
    this.callService('ipixel_color', 'set_font_offset', { x, y });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
