/**
 * iPIXEL Playlist Card
 * Manage presets and scenes for quick display configurations
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { getDisplayState, updateDisplayState, createStorage } from '../state.js';
import {
  renderGridSelector, attachGridSelector,
  renderFormDialog, attachFormDialog,
} from '../components/index.js';

const presetStore = createStorage('iPIXEL_Presets', () => []);

const PRESET_ICONS = ['📺', '💬', '⏰', '🎵', '🎨', '⭐', '❤️', '🔥', '💡', '🌈', '🎮', '📢', '🏠', '🔔', '✨', '🎉'];

const EDIT_ICON = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>';
const DELETE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';

export class iPIXELPlaylistCard extends iPIXELCardBase {
  constructor() {
    super();
    this._presets = presetStore.load();
    this._editingPreset = null;
    this._selectedIcon = PRESET_ICONS[0];
    this._formVisible = false;
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const iconItems = PRESET_ICONS.map(icon => ({ value: icon, name: icon }));

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .preset-list {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 16px; max-height: 300px; overflow-y: auto;
        }
        .preset-item {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer; transition: all 0.2s;
        }
        .preset-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .preset-item.active { border-color: var(--ipixel-primary); background: rgba(3, 169, 244, 0.1); }
        .preset-icon {
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; font-size: 1.2em;
        }
        .preset-info { flex: 1; min-width: 0; }
        .preset-name { font-weight: 500; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preset-desc { font-size: 0.75em; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preset-actions { display: flex; gap: 4px; }
        .preset-actions button {
          padding: 6px; background: transparent; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer; border-radius: 4px; transition: all 0.2s;
        }
        .preset-actions button:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .preset-actions button.delete:hover { background: rgba(244,67,54,0.2); color: #f44; }
        .empty-state svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
        .icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin-top: 8px; }
        .icon-option {
          width: 32px; height: 32px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1.1em; transition: all 0.2s; background: transparent;
        }
        .icon-option:hover { background: rgba(255,255,255,0.1); }
        .icon-option.active { border-color: var(--ipixel-primary); background: rgba(3, 169, 244, 0.2); }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">Presets</div>
            <button class="icon-btn" id="add-preset-btn" title="Save Current as Preset">
              <svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
            </button>
          </div>

          <div class="preset-list" id="preset-list">
            ${this._presets.length === 0 ? this._renderEmpty() : this._presets.map((p, i) => this._renderPresetItem(p, i)).join('')}
          </div>

          ${renderFormDialog({
            id: 'preset-form',
            visible: this._formVisible,
            submitLabel: 'Save Preset',
            body: `
              <div class="form-row">
                <label>Preset Name</label>
                <input type="text" class="text-input" id="preset-name" placeholder="My Preset">
              </div>
              <div class="form-row">
                <label>Icon</label>
                ${renderGridSelector(iconItems, {
                  selected: this._selectedIcon,
                  itemClass: 'icon-option',
                  gridClass: 'icon-grid',
                  dataAttr: 'icon',
                })}
              </div>`,
          })}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _renderEmpty() {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"/></svg>
        <div>No presets saved</div>
        <div style="font-size: 0.85em; margin-top: 4px;">Click + to save current display</div>
      </div>`;
  }

  _renderPresetItem(preset, i) {
    const textSnippet = preset.text
      ? ' · "' + preset.text.substring(0, 15) + (preset.text.length > 15 ? '...' : '') + '"'
      : '';
    return `
      <div class="preset-item" data-index="${i}">
        <div class="preset-icon" style="background: ${preset.fgColor || '#ff6600'}20; color: ${preset.fgColor || '#ff6600'}">
          ${preset.icon || '📺'}
        </div>
        <div class="preset-info">
          <div class="preset-name">${this.escapeHtml(preset.name)}</div>
          <div class="preset-desc">${preset.mode} · ${preset.effect || 'fixed'}${textSnippet}</div>
        </div>
        <div class="preset-actions">
          <button data-action="edit" data-index="${i}" title="Edit">${EDIT_ICON}</button>
          <button class="delete" data-action="delete" data-index="${i}" title="Delete">${DELETE_ICON}</button>
        </div>
      </div>`;
  }

  _showForm(preset = null, index = null) {
    this._editingPreset = index;
    this._selectedIcon = preset?.icon || PRESET_ICONS[0];
    this._formVisible = true;
    this.render();
    const nameInput = this.shadowRoot.getElementById('preset-name');
    if (nameInput) nameInput.value = preset?.name || '';
  }

  _applyPreset(preset, item) {
    updateDisplayState({
      text: preset.text, mode: preset.mode, effect: preset.effect, speed: preset.speed,
      fgColor: preset.fgColor, bgColor: preset.bgColor, font: preset.font,
      rainbowMode: preset.rainbowMode,
    });

    if (preset.mode === 'text' && preset.text) {
      this.callService('ipixel_color', 'display_text', {
        text: preset.text, effect: preset.effect, speed: preset.speed,
        color_fg: this.hexToRgb(preset.fgColor),
        color_bg: this.hexToRgb(preset.bgColor),
        font: preset.font, rainbow_mode: preset.rainbowMode,
      });
    }

    this.shadowRoot.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
  }

  _attachListeners() {
    this.shadowRoot.getElementById('add-preset-btn')?.addEventListener('click', () => this._showForm());

    attachFormDialog(this.shadowRoot, 'preset-form', {
      onCancel: () => { this._formVisible = false; this._editingPreset = null; },
      onSubmit: () => this._savePreset(),
    });

    attachGridSelector(this.shadowRoot, '.icon-option', {
      onSelect: (v) => { this._selectedIcon = v; },
      attr: 'icon',
    });

    this.shadowRoot.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.preset-actions')) return;
        const preset = this._presets[parseInt(item.dataset.index)];
        if (preset) this._applyPreset(preset, item);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        this._showForm(this._presets[index], index);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        if (confirm('Delete this preset?')) {
          this._presets.splice(index, 1);
          presetStore.save(this._presets);
          this.render();
        }
      });
    });
  }

  _savePreset() {
    const name = (this.shadowRoot.getElementById('preset-name')?.value || '').trim() || 'Preset';
    const currentState = getDisplayState();
    const preset = {
      name,
      icon: this._selectedIcon,
      text: currentState.text || '',
      mode: currentState.mode || 'text',
      effect: currentState.effect || 'fixed',
      speed: currentState.speed || 50,
      fgColor: currentState.fgColor || '#ff6600',
      bgColor: currentState.bgColor || '#000000',
      font: currentState.font || 'VCR_OSD_MONO',
      rainbowMode: currentState.rainbowMode || 0,
      createdAt: Date.now(),
    };

    if (this._editingPreset !== null) {
      this._presets[this._editingPreset] = preset;
    } else {
      this._presets.push(preset);
    }
    presetStore.save(this._presets);
    this._formVisible = false;
    this._editingPreset = null;
    this.render();
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
