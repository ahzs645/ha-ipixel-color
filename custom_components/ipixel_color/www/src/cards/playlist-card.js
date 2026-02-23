/**
 * iPIXEL Playlist Card
 * Manage presets and scenes for quick display configurations
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { getDisplayState, updateDisplayState } from '../state.js';

// Storage key for presets
const PRESETS_STORAGE_KEY = 'iPIXEL_Presets';

export class iPIXELPlaylistCard extends iPIXELCardBase {
  constructor() {
    super();
    this._presets = this._loadPresets();
    this._editingPreset = null;
    this._selectedIcon = '📺';
  }

  _loadPresets() {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  _savePresets() {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(this._presets));
    } catch (e) {
      console.warn('iPIXEL: Failed to save presets', e);
    }
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .preset-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          max-height: 300px;
          overflow-y: auto;
        }
        .preset-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-item:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }
        .preset-item.active {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.1);
        }
        .preset-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2em;
        }
        .preset-info {
          flex: 1;
          min-width: 0;
        }
        .preset-name {
          font-weight: 500;
          font-size: 0.9em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preset-desc {
          font-size: 0.75em;
          opacity: 0.6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preset-actions {
          display: flex;
          gap: 4px;
        }
        .preset-actions button {
          padding: 6px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .preset-actions button:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .preset-actions button.delete:hover {
          background: rgba(244,67,54,0.2);
          color: #f44;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          opacity: 0.5;
        }
        .empty-state svg {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .add-preset-form {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 16px;
        }
        .form-row {
          margin-bottom: 12px;
        }
        .form-row label {
          display: block;
          font-size: 0.8em;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .icon-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          margin-top: 8px;
        }
        .icon-option {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1em;
          transition: all 0.2s;
          background: transparent;
        }
        .icon-option:hover {
          background: rgba(255,255,255,0.1);
        }
        .icon-option.selected {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.2);
        }
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
            ${this._presets.length === 0 ? `
              <div class="empty-state">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"/></svg>
                <div>No presets saved</div>
                <div style="font-size: 0.85em; margin-top: 4px;">Click + to save current display</div>
              </div>
            ` : this._presets.map((preset, i) => `
              <div class="preset-item" data-index="${i}">
                <div class="preset-icon" style="background: ${preset.fgColor || '#ff6600'}20; color: ${preset.fgColor || '#ff6600'}">
                  ${preset.icon || '📺'}
                </div>
                <div class="preset-info">
                  <div class="preset-name">${this._escapeHtml(preset.name)}</div>
                  <div class="preset-desc">${preset.mode} · ${preset.effect || 'fixed'}${preset.text ? ' · "' + preset.text.substring(0, 15) + (preset.text.length > 15 ? '...' : '') + '"' : ''}</div>
                </div>
                <div class="preset-actions">
                  <button class="edit" data-action="edit" data-index="${i}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                  </button>
                  <button class="delete" data-action="delete" data-index="${i}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="add-preset-form" id="preset-form" style="display: none;">
            <div class="form-row">
              <label>Preset Name</label>
              <input type="text" class="text-input" id="preset-name" placeholder="My Preset">
            </div>
            <div class="form-row">
              <label>Icon</label>
              <div class="icon-grid" id="icon-grid">
                ${['📺', '💬', '⏰', '🎵', '🎨', '⭐', '❤️', '🔥', '💡', '🌈', '🎮', '📢', '🏠', '🔔', '✨', '🎉'].map(icon => `
                  <button type="button" class="icon-option${icon === this._selectedIcon ? ' selected' : ''}" data-icon="${icon}">${icon}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" id="cancel-preset-btn">Cancel</button>
              <button class="btn btn-primary" id="save-preset-btn">Save Preset</button>
            </div>
          </div>
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _attachListeners() {
    // Add preset button
    this.shadowRoot.getElementById('add-preset-btn')?.addEventListener('click', () => {
      this._editingPreset = null;
      this._selectedIcon = '📺';
      this.shadowRoot.getElementById('preset-form').style.display = 'block';
      this.shadowRoot.getElementById('preset-name').value = '';
      this.shadowRoot.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      this.shadowRoot.querySelector('.icon-option')?.classList.add('selected');
    });

    // Cancel button
    this.shadowRoot.getElementById('cancel-preset-btn')?.addEventListener('click', () => {
      this.shadowRoot.getElementById('preset-form').style.display = 'none';
      this._editingPreset = null;
    });

    // Save button
    this.shadowRoot.getElementById('save-preset-btn')?.addEventListener('click', () => {
      const name = this.shadowRoot.getElementById('preset-name').value.trim() || 'Preset';
      const selectedIcon = this.shadowRoot.querySelector('.icon-option.selected');
      const icon = selectedIcon?.dataset.icon || '📺';
      const currentState = getDisplayState();

      const preset = {
        name,
        icon,
        text: currentState.text || '',
        mode: currentState.mode || 'text',
        effect: currentState.effect || 'fixed',
        speed: currentState.speed || 50,
        fgColor: currentState.fgColor || '#ff6600',
        bgColor: currentState.bgColor || '#000000',
        font: currentState.font || 'VCR_OSD_MONO',
        rainbowMode: currentState.rainbowMode || 0,
        createdAt: Date.now()
      };

      if (this._editingPreset !== null) {
        this._presets[this._editingPreset] = preset;
      } else {
        this._presets.push(preset);
      }

      this._savePresets();
      this.shadowRoot.getElementById('preset-form').style.display = 'none';
      this._editingPreset = null;
      this.render();
    });

    // Icon selection
    this.shadowRoot.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        this.shadowRoot.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this._selectedIcon = e.currentTarget.dataset.icon;
      });
    });

    // Preset item click (apply preset)
    this.shadowRoot.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't apply if clicking action buttons
        if (e.target.closest('.preset-actions')) return;

        const index = parseInt(item.dataset.index);
        const preset = this._presets[index];
        if (preset) {
          updateDisplayState({
            text: preset.text,
            mode: preset.mode,
            effect: preset.effect,
            speed: preset.speed,
            fgColor: preset.fgColor,
            bgColor: preset.bgColor,
            font: preset.font,
            rainbowMode: preset.rainbowMode
          });

          // Also send to device if text mode
          if (preset.mode === 'text' && preset.text) {
            this.callService('ipixel_color', 'display_text', {
              text: preset.text,
              effect: preset.effect,
              speed: preset.speed,
              color_fg: this.hexToRgb(preset.fgColor),
              color_bg: this.hexToRgb(preset.bgColor),
              font: preset.font,
              rainbow_mode: preset.rainbowMode
            });
          }

          // Update active state
          this.shadowRoot.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
          item.classList.add('active');
        }
      });
    });

    // Edit preset
    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        const preset = this._presets[index];
        if (preset) {
          this._editingPreset = index;
          this._selectedIcon = preset.icon || '📺';
          this.shadowRoot.getElementById('preset-form').style.display = 'block';
          this.shadowRoot.getElementById('preset-name').value = preset.name;
          this.shadowRoot.querySelectorAll('.icon-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.icon === preset.icon);
          });
        }
      });
    });

    // Delete preset
    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index);
        if (confirm('Delete this preset?')) {
          this._presets.splice(index, 1);
          this._savePresets();
          this.render();
        }
      });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
