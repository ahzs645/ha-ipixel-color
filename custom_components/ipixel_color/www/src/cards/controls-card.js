/**
 * iPIXEL Controls Card
 * Tabbed: Main / Clock / Slots / Advanced
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { updateDisplayState, createStorage } from '../state.js';
import {
  renderSlider, attachSlider,
  renderGridSelector, attachGridSelector,
  renderToggle, attachToggle,
  renderTabs, attachTabs, renderPanel,
} from '../components/index.js';

const slotsStore = createStorage('iPIXEL_SavedSlots', () => ({}));

const CLOCK_STYLES = [
  { value: 1, name: 'Style 1 (Digital)' },
  { value: 2, name: 'Style 2 (Minimal)' },
  { value: 3, name: 'Style 3 (Bold)' },
  { value: 4, name: 'Style 4 (Retro)' },
  { value: 5, name: 'Style 5 (Neon)' },
  { value: 6, name: 'Style 6 (Matrix)' },
  { value: 7, name: 'Style 7 (Classic)' },
  { value: 8, name: 'Style 8 (Modern)' },
];

const ANIMATION_MODES = [
  { value: 0, name: 'Static' },
  { value: 1, name: 'Scroll Left' },
  { value: 2, name: 'Scroll Right' },
  { value: 3, name: 'Scroll Up' },
  { value: 4, name: 'Scroll Down' },
  { value: 5, name: 'Flash' },
  { value: 6, name: 'Fade In/Out' },
  { value: 7, name: 'Bounce' },
];

const DISPLAY_MODES = [
  { value: 'textimage', name: 'Text+Image' },
  { value: 'text', name: 'Text' },
  { value: 'clock', name: 'Clock' },
  { value: 'gif', name: 'GIF' },
  { value: 'rhythm', name: 'Rhythm' },
];

const MODE_COLORS = {
  text: '#ff6600', textimage: '#ff6600', clock: '#00ff88', gif: '#ff44ff', rhythm: '#44aaff',
};

const SLOTS_1_9 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const TABS = [
  { id: 'main', label: 'Main' },
  { id: 'clock', label: 'Clock' },
  { id: 'slots', label: 'Slots' },
  { id: 'advanced', label: 'Advanced' },
];

const ICON_POWER = '<svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>';
const ICON_CLEAR = '<svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>';
const ICON_CLOCK = '<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>';
const ICON_SYNC = '<svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.5 16.5,3.5 14.5,3.13V5.17C15.86,5.5 17.08,6.23 18.2,7.27M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12M5.8,16.73L4.38,18.15C5.73,19.5 7.5,20.5 9.5,20.87V18.83C8.14,18.5 6.92,17.77 5.8,16.73M4,12H2A10,10 0 0,0 12,22V20A8,8 0 0,1 4,12Z"/></svg>';

export class iPIXELControlsCard extends iPIXELCardBase {
  constructor() {
    super();
    this._activeTab = 'main';
    this._clockStyle = 1;
    this._is24Hour = true;
    this._showDate = false;
    this._upsideDown = false;
    this._animationMode = 0;
    this._programSlots = '';
    // Persisted across tab switches
    this._fontSize = 16;
    this._fontOffsetX = 0;
    this._fontOffsetY = 0;
    this._saveSlotNum = 1;
    this._saveType = 'gif';
    this._saveFrames = 30;
    this._saveDelay = 100;
  }

  _switchTab(id) {
    this._captureSlotsForm();
    this._activeTab = id;
    this.render();
  }

  _captureSlotsForm() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    if ($('font-size')) this._fontSize = parseInt($('font-size').value) || this._fontSize;
    if ($('font-offset-x')) this._fontOffsetX = parseInt($('font-offset-x').value) || 0;
    if ($('font-offset-y')) this._fontOffsetY = parseInt($('font-offset-y').value) || 0;
    if ($('save-slot')) this._saveSlotNum = parseInt($('save-slot').value) || 1;
    if ($('save-type')) this._saveType = $('save-type').value || 'gif';
    if ($('save-frames')) this._saveFrames = parseInt($('save-frames').value) || 30;
    if ($('save-delay')) this._saveDelay = parseInt($('save-delay').value) || 100;
    if ($('program-slots')) this._programSlots = $('program-slots').value || '';
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;
    const isOn = this.isOn();

    // Read upside down state from entity if present
    const upsideDownEntity = this.getRelatedEntity('switch', '_upside_down');
    if (upsideDownEntity) this._upsideDown = upsideDownEntity.state === 'on';

    const active = this._activeTab;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .compact-row { display: flex; gap: 8px; align-items: center; }
        .compact-row select { flex: 1; }
        .screen-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .screen-btn {
          padding: 8px 4px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--ipixel-text);
          border-radius: 6px; cursor: pointer;
          font-size: 0.8em; text-align: center; transition: all 0.2s;
        }
        .screen-btn:hover { background: rgba(255,255,255,0.1); }
        .screen-btn.active { background: var(--ipixel-primary); border-color: var(--ipixel-primary); }
        .screen-btn.saved { background: rgba(76,175,80,0.2); border-color: rgba(76,175,80,0.4); }
        .screen-btn.delete { background: rgba(244,67,54,0.2); border-color: rgba(244,67,54,0.3); color: #f44336; }
        .screen-btn.delete:hover { background: rgba(244,67,54,0.4); }
      </style>
      <ha-card>
        <div class="card-content">
          ${renderTabs(TABS, active)}
          ${renderPanel('main', active === 'main', this._renderMainTab(isOn))}
          ${renderPanel('clock', active === 'clock', this._renderClockTab())}
          ${renderPanel('slots', active === 'slots', this._renderSlotsTab())}
          ${renderPanel('advanced', active === 'advanced', this._renderAdvancedTab())}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _renderMainTab(isOn) {
    return `
      <div class="section-title">Quick Actions</div>
      <div class="control-row">
        <div class="button-grid button-grid-4">
          <button class="icon-btn ${isOn ? 'active' : ''}" data-action="power" title="Power">${ICON_POWER}</button>
          <button class="icon-btn" data-action="clear" title="Clear">${ICON_CLEAR}</button>
          <button class="icon-btn" data-action="clock" title="Clock">${ICON_CLOCK}</button>
          <button class="icon-btn" data-action="sync" title="Sync Time">${ICON_SYNC}</button>
        </div>
      </div>

      <div class="section-title">Brightness</div>
      <div class="control-row">
        ${renderSlider({ id: 'brightness', min: 1, max: 100, value: 50, unit: '%' })}
      </div>

      <div class="section-title">Display Mode</div>
      <div class="control-row">
        ${renderGridSelector(DISPLAY_MODES, {
          selected: null,
          itemClass: 'mode-btn',
          gridClass: 'button-grid button-grid-3',
          dataAttr: 'mode',
        })}
      </div>`;
  }

  _renderClockTab() {
    return `
      <div class="section-title">Clock Settings</div>
      <div class="subsection">
        <div class="compact-row" style="margin-bottom: 12px;">
          <select class="dropdown" id="clock-style">
            ${CLOCK_STYLES.map(s => `<option value="${s.value}"${s.value === this._clockStyle ? ' selected' : ''}>${s.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="apply-clock-btn">Apply</button>
        </div>
        ${renderToggle({ id: 'toggle-24h', active: this._is24Hour, label: '24-Hour Format' })}
        ${renderToggle({ id: 'toggle-date', active: this._showDate, label: 'Show Date' })}
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
          ${renderToggle({ id: 'toggle-upside-down', active: this._upsideDown, label: 'Upside Down', padding: '4px 0' })}
        </div>
      </div>`;
  }

  _renderSlotsTab() {
    const savedSlots = slotsStore.load();
    const slotItems = SLOTS_1_9.map(n => {
      const saved = savedSlots[String(n)];
      return { value: n, name: `${n}${saved ? '*' : ''}`, saved, title: saved ? saved.name : 'Empty' };
    });

    return `
      <div class="section-title">Screen Slots</div>
      <div class="subsection">
        <div class="subsection-title">Show Saved Slot</div>
        <div style="margin-bottom: 12px;">
          ${renderGridSelector(slotItems, {
            selected: null,
            itemClass: 'screen-btn',
            gridClass: 'screen-grid',
            dataAttr: 'show-slot',
            extraClass: (i) => i.saved ? 'saved' : '',
            title: (i) => i.title,
          })}
        </div>
        <div class="subsection-title">Auto-Cycle Slots</div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
          <input type="text" class="text-input" id="program-slots" placeholder="e.g. 1,2,3" style="flex: 1;" value="${this._programSlots}">
          <button class="btn btn-secondary" id="program-mode-btn">Cycle</button>
        </div>
        <div class="subsection-title">Select Screen Buffer (1-9)</div>
        <div style="margin-bottom: 12px;">
          ${renderGridSelector(SLOTS_1_9.map(n => ({ value: n, name: String(n) })), {
            selected: null,
            itemClass: 'screen-btn',
            gridClass: 'screen-grid',
            dataAttr: 'screen',
          })}
        </div>
        <div class="subsection-title">Save Effect to Slot</div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
          <select class="dropdown" id="save-slot" style="width: 70px;">
            ${SLOTS_1_9.map(n => `<option value="${n}"${n === this._saveSlotNum ? ' selected' : ''}>Slot ${n}</option>`).join('')}
          </select>
          <select class="dropdown" id="save-type" style="flex: 1;">
            <option value="gif"${this._saveType === 'gif' ? ' selected' : ''}>Animation (GIF)</option>
            <option value="image"${this._saveType === 'image' ? ' selected' : ''}>Static Image</option>
          </select>
          <button class="btn btn-primary" id="save-to-slot-btn">Save</button>
        </div>
        <div id="save-gif-options" style="display: ${this._saveType === 'gif' ? 'flex' : 'none'}; gap: 6px; align-items: center; margin-bottom: 12px;">
          <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Frames</label>
          <input type="number" class="text-input" id="save-frames" value="${this._saveFrames}" min="5" max="120" style="width: 60px;">
          <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Delay ms</label>
          <input type="number" class="text-input" id="save-delay" value="${this._saveDelay}" min="20" max="500" step="10" style="width: 60px;">
        </div>
        <div id="save-progress" style="display: none; font-size: 0.8em; color: var(--ipixel-primary); margin-bottom: 12px;"></div>
        <div class="subsection-title">Delete Screen</div>
        ${renderGridSelector([...SLOTS_1_9, 10].map(n => ({ value: n, name: `×${n}` })), {
          selected: null,
          itemClass: 'screen-btn delete',
          gridClass: 'screen-grid',
          dataAttr: 'delete',
        })}
      </div>

      <div class="section-title">Font Settings</div>
      <div class="subsection">
        <div class="two-col">
          <div>
            <div class="subsection-title">Size (1-128)</div>
            <input type="number" class="text-input" id="font-size" value="${this._fontSize}" min="1" max="128" style="width: 100%;">
          </div>
          <div>
            <div class="subsection-title">Offset X, Y</div>
            <div style="display: flex; gap: 4px;">
              <input type="number" class="text-input" id="font-offset-x" value="${this._fontOffsetX}" min="-64" max="64" style="width: 50%;">
              <input type="number" class="text-input" id="font-offset-y" value="${this._fontOffsetY}" min="-32" max="32" style="width: 50%;">
            </div>
          </div>
        </div>
      </div>`;
  }

  _renderAdvancedTab() {
    return `
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
      </div>`;
  }

  _attachListeners() {
    attachTabs(this.shadowRoot, (id) => this._switchTab(id));
    this._attachMainTab();
    this._attachClockTab();
    this._attachSlotsTab();
    this._attachAdvancedTab();
  }

  _attachMainTab() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => this._handleAction(e.currentTarget.dataset.action));
    });
    attachSlider(this.shadowRoot, 'brightness', {
      unit: '%',
      onChange: (v) => this.callService('ipixel_color', 'set_brightness', { level: v }),
    });
    attachGridSelector(this.shadowRoot, '[data-mode]', {
      onSelect: (mode) => this._selectMode(mode),
      attr: 'mode',
    });
  }

  _attachClockTab() {
    this.shadowRoot.getElementById('clock-style')?.addEventListener('change', (e) => {
      this._clockStyle = parseInt(e.target.value);
    });
    this.shadowRoot.getElementById('apply-clock-btn')?.addEventListener('click', () => this._applyClockSettings());
    attachToggle(this.shadowRoot, 'toggle-24h', (v) => { this._is24Hour = v; });
    attachToggle(this.shadowRoot, 'toggle-date', (v) => { this._showDate = v; });
    this.shadowRoot.getElementById('animation-mode')?.addEventListener('change', (e) => {
      this._animationMode = parseInt(e.target.value);
      updateDisplayState({ animationMode: this._animationMode });
      this.callService('ipixel_color', 'set_animation_mode', { mode: this._animationMode });
    });
    this.shadowRoot.getElementById('orientation')?.addEventListener('change', (e) => {
      this.callService('ipixel_color', 'set_orientation', { orientation: parseInt(e.target.value) });
    });
    attachToggle(this.shadowRoot, 'toggle-upside-down', (v) => {
      this._upsideDown = v;
      const entity = this.getRelatedEntity('switch', '_upside_down');
      if (entity) {
        this._hass.callService('switch', v ? 'turn_on' : 'turn_off', { entity_id: entity.entity_id });
      } else {
        this.callService('ipixel_color', 'set_upside_down', { enabled: v });
      }
    });
  }

  _attachSlotsTab() {
    attachGridSelector(this.shadowRoot, '[data-show-slot]', {
      onSelect: (v) => this.callService('ipixel_color', 'show_slot', { slot: parseInt(v) }),
      attr: 'showSlot',
    });

    this.shadowRoot.getElementById('program-mode-btn')?.addEventListener('click', () => {
      const input = this.shadowRoot.getElementById('program-slots')?.value || '';
      const slots = input.split(/[,\s]+/).map(Number).filter(n => n >= 1 && n <= 255);
      if (slots.length) {
        this._programSlots = input;
        this.callService('ipixel_color', 'program_mode', { slots });
      }
    });

    attachGridSelector(this.shadowRoot, '[data-screen]', {
      onSelect: (v) => this.callService('ipixel_color', 'set_screen', { screen: parseInt(v) }),
      attr: 'screen',
    });

    this.shadowRoot.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slot = parseInt(e.currentTarget.dataset.delete);
        if (confirm(`Delete screen slot ${slot}?`)) {
          this.callService('ipixel_color', 'delete_screen', { slot });
          const slots = slotsStore.load();
          delete slots[String(slot)];
          slotsStore.save(slots);
          this.render();
        }
      });
    });

    this.shadowRoot.getElementById('save-type')?.addEventListener('change', (e) => {
      const gifOpts = this.shadowRoot.getElementById('save-gif-options');
      if (gifOpts) gifOpts.style.display = e.target.value === 'gif' ? 'flex' : 'none';
    });

    this.shadowRoot.getElementById('save-to-slot-btn')?.addEventListener('click', async () => {
      await this._saveToSlot();
    });

    this.shadowRoot.getElementById('font-size')?.addEventListener('change', (e) => {
      const size = parseInt(e.target.value);
      updateDisplayState({ fontSize: size });
      this.callService('ipixel_color', 'set_font_size', { size });
    });
    ['font-offset-x', 'font-offset-y'].forEach(id => {
      this.shadowRoot.getElementById(id)?.addEventListener('change', () => this._updateFontOffset());
    });
  }

  _attachAdvancedTab() {
    this.shadowRoot.getElementById('diy-mode')?.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode !== '') {
        this.callService('ipixel_color', 'set_diy_mode', { mode });
        setTimeout(() => { e.target.value = ''; }, 500);
      }
    });

    const sendRaw = () => {
      const hex = this.shadowRoot.getElementById('raw-command')?.value?.trim();
      if (hex) this.callService('ipixel_color', 'send_raw_command', { hex_data: hex });
    };
    this.shadowRoot.getElementById('send-raw-btn')?.addEventListener('click', sendRaw);
    this.shadowRoot.getElementById('raw-command')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendRaw();
    });
  }

  _handleAction(action) {
    if (action === 'power') {
      const sw = this.getRelatedEntity('switch');
      if (sw) this._hass.callService('switch', 'toggle', { entity_id: sw.entity_id });
    } else if (action === 'clear') {
      updateDisplayState({ text: '', mode: 'text', effect: 'fixed', speed: 50, fgColor: '#ff6600', bgColor: '#000000' });
      this.callService('ipixel_color', 'clear_pixels');
    } else if (action === 'clock') {
      this._applyClockSettings();
    } else if (action === 'sync') {
      this.callService('ipixel_color', 'sync_time');
    }
  }

  _selectMode(mode) {
    const modeEntity = this.getRelatedEntity('select', '_mode');
    if (modeEntity) {
      this._hass.callService('select', 'select_option', { entity_id: modeEntity.entity_id, option: mode });
    }
    updateDisplayState({
      mode,
      fgColor: MODE_COLORS[mode] || '#ff6600',
      text: mode === 'clock' ? '' : window.iPIXELDisplayState?.text || '',
    });
  }

  _applyClockSettings() {
    updateDisplayState({
      text: '', mode: 'clock', effect: 'fixed', speed: 50,
      fgColor: '#00ff88', bgColor: '#000000',
      clockStyle: this._clockStyle, is24Hour: this._is24Hour, showDate: this._showDate,
    });
    this.callService('ipixel_color', 'set_clock_mode', {
      style: this._clockStyle,
      format_24h: this._is24Hour,
      show_date: this._showDate,
    });
  }

  _updateFontOffset() {
    const x = parseInt(this.shadowRoot.getElementById('font-offset-x')?.value || '0');
    const y = parseInt(this.shadowRoot.getElementById('font-offset-y')?.value || '0');
    updateDisplayState({ fontOffsetX: x, fontOffsetY: y });
    this.callService('ipixel_color', 'set_font_offset', { x, y });
  }

  async _saveToSlot() {
    const $ = (id) => this.shadowRoot.getElementById(id);
    const slot = parseInt($('save-slot')?.value || '1');
    const type = $('save-type')?.value || 'gif';
    const frames = parseInt($('save-frames')?.value || '30');
    const delay = parseInt($('save-delay')?.value || '100');
    const progress = $('save-progress');
    const btn = $('save-to-slot-btn');

    if (progress) { progress.style.display = 'block'; progress.textContent = 'Starting...'; }
    if (btn) btn.disabled = true;

    try {
      await this.callService('ipixel_color', 'save_to_slot', { slot, type, frames, delay });

      const state = window.iPIXELDisplayState || {};
      const slots = slotsStore.load();
      slots[String(slot)] = {
        name: state.text || state.effect || type,
        type,
        frames: type === 'gif' ? frames : 1,
        savedAt: new Date().toISOString(),
      };
      slotsStore.save(slots);

      if (progress) progress.textContent = 'Saved!';
      setTimeout(() => this.render(), 1500);
    } catch (err) {
      if (progress) progress.textContent = 'Error: ' + err.message;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
