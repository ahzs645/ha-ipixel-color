/**
 * iPIXEL Display Card for Home Assistant
 * A Lovelace card for controlling iPIXEL Color LED displays
 */

const CARD_VERSION = '1.1.0';

class iPIXELDisplayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._activeTab = 'display';
  }

  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    this._config = {
      show_header: true,
      show_display: true,
      show_controls: true,
      show_quick_actions: true,
      show_playlist: true,
      resolution: 'auto',
      matrix_padding: 1,
      border_radius: 8,
      border_width: 2,
      border_color: '#333',
      ...config,
    };

    this.render();
  }

  getResolution() {
    // If explicitly set (not 'auto'), use that
    if (this._config.resolution && this._config.resolution !== 'auto') {
      return this._config.resolution.split('x').map(Number);
    }

    // Try to auto-detect from device sensors
    if (this._hass && this._config.entity) {
      const baseName = this._config.entity.replace('text.', '');

      const patterns = [
        [`sensor.${baseName}_width`, `sensor.${baseName}_height`],
        [`sensor.${baseName}_display_width`, `sensor.${baseName}_display_height`],
        [`sensor.display_width`, `sensor.display_height`],
      ];

      for (const [widthEntity, heightEntity] of patterns) {
        const widthState = this._hass.states[widthEntity];
        const heightState = this._hass.states[heightEntity];

        if (widthState && heightState) {
          const width = parseInt(widthState.state);
          const height = parseInt(heightState.state);
          if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
            return [width, height];
          }
        }
      }
    }

    // Default fallback
    return [64, 16];
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getStyles() {
    return `
      <style>
        :host {
          --primary-color: var(--ha-card-primary-color, #03a9f4);
          --accent-color: var(--ha-card-accent-color, #ff9800);
          --text-color: var(--primary-text-color, #fff);
          --bg-color: var(--ha-card-background, #1c1c1c);
          --border-color: var(--divider-color, #333);
        }

        .card-container {
          padding: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-title {
          font-size: 1.2em;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4caf50;
        }

        .status-indicator.off {
          background: #f44336;
        }

        .status-indicator.unavailable {
          background: #9e9e9e;
        }

        /* Tab Navigation */
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 16px;
        }

        .tab {
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          opacity: 0.7;
          transition: all 0.2s;
        }

        .tab:hover {
          opacity: 1;
        }

        .tab.active {
          border-bottom-color: var(--primary-color);
          opacity: 1;
        }

        /* Display Preview */
        .display-container {
          background: #000;
          border-radius: var(--border-radius, 8px);
          padding: 8px;
          margin-bottom: 16px;
          position: relative;
        }

        .display-preview {
          width: 100%;
          aspect-ratio: 4/1;
          display: grid;
          gap: 1px;
          background: #111;
          border-radius: 4px;
          overflow: hidden;
        }

        .pixel {
          background: #1a1a1a;
          transition: background-color 0.1s;
        }

        .pixel.on {
          background: var(--pixel-color, #ff6600);
          box-shadow: 0 0 3px var(--pixel-color, #ff6600);
        }

        .display-info {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 0.8em;
          opacity: 0.7;
        }

        /* Control Sections */
        .control-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 0.9em;
          font-weight: 500;
          margin-bottom: 8px;
          opacity: 0.8;
        }

        /* Quick Actions */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: var(--primary-color);
        }

        .action-btn.active {
          background: rgba(3, 169, 244, 0.2);
          border-color: var(--primary-color);
        }

        .action-btn svg {
          width: 24px;
          height: 24px;
          margin-bottom: 4px;
          fill: currentColor;
        }

        .action-btn span {
          font-size: 0.7em;
          opacity: 0.8;
        }

        /* Sliders */
        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }

        .slider-label {
          min-width: 80px;
          font-size: 0.85em;
        }

        .slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) var(--value, 50%), rgba(255,255,255,0.3) var(--value, 50%), rgba(255,255,255,0.3) 100%);
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--primary-color);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--primary-color);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.3);
        }

        .slider-value {
          min-width: 45px;
          text-align: right;
          font-size: 0.9em;
          font-weight: 500;
        }

        /* Dropdown */
        .dropdown {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: inherit;
          font-size: 0.9em;
        }

        /* Text Input */
        .text-input-container {
          display: flex;
          gap: 8px;
        }

        .text-input {
          flex: 1;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: inherit;
          font-size: 0.9em;
        }

        .send-btn {
          padding: 8px 16px;
          background: var(--primary-color);
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          font-weight: 500;
        }

        .send-btn:hover {
          opacity: 0.9;
        }

        /* Color Picker */
        .color-picker-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .color-picker {
          width: 40px;
          height: 32px;
          padding: 0;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
        }

        /* Playlist Section */
        .playlist-container {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
        }

        .playlist-item {
          display: flex;
          align-items: center;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          margin-bottom: 8px;
          gap: 12px;
        }

        .playlist-item:last-child {
          margin-bottom: 0;
        }

        .playlist-item-handle {
          cursor: grab;
          opacity: 0.5;
        }

        .playlist-item-info {
          flex: 1;
        }

        .playlist-item-name {
          font-weight: 500;
          font-size: 0.9em;
        }

        .playlist-item-meta {
          font-size: 0.75em;
          opacity: 0.6;
        }

        .playlist-item-actions {
          display: flex;
          gap: 4px;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
        }

        .icon-btn:hover {
          background: rgba(255,255,255,0.1);
          opacity: 1;
        }

        /* Schedule Timeline */
        .timeline-container {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
          margin-top: 16px;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8em;
          opacity: 0.6;
          margin-bottom: 8px;
        }

        .timeline-bar {
          height: 32px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .timeline-slot {
          position: absolute;
          height: 100%;
          background: var(--primary-color);
          opacity: 0.7;
          border-radius: 2px;
        }

        .timeline-now {
          position: absolute;
          width: 2px;
          height: 100%;
          background: #f44336;
          top: 0;
        }

        /* Power Schedule */
        .power-schedule {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
        }

        .time-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .time-input input {
          width: 80px;
          padding: 6px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: inherit;
          text-align: center;
        }

        /* Mode Buttons */
        .mode-buttons {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .mode-btn {
          padding: 10px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          font-size: 0.8em;
          transition: all 0.2s;
        }

        .mode-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .mode-btn.active {
          background: rgba(3, 169, 244, 0.2);
          border-color: var(--primary-color);
        }

        /* Responsive */
        @media (max-width: 400px) {
          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }
          .mode-buttons {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      </style>
    `;
  }

  getEntityState() {
    if (!this._hass || !this._config.entity) return null;
    return this._hass.states[this._config.entity];
  }

  getSwitchEntity() {
    const entityId = this._config.entity.replace('text.', 'switch.');
    if (!this._hass) return null;
    return this._hass.states[entityId];
  }

  render() {
    if (!this._config) return;

    const entity = this.getEntityState();
    const switchEntity = this.getSwitchEntity();
    const isOn = switchEntity?.state === 'on';
    const isAvailable = entity?.state !== 'unavailable';

    const [width, height] = this.getResolution();

    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <ha-card>
        <div class="card-container">
          ${this._config.show_header ? this.renderHeader(entity, isOn, isAvailable) : ''}
          ${this.renderTabs()}
          ${this.renderTabContent(entity, isOn, width, height)}
        </div>
      </ha-card>
    `;

    this.attachEventListeners();
  }

  renderHeader(entity, isOn, isAvailable) {
    const name = this._config.name || entity?.attributes?.friendly_name || 'iPIXEL Display';
    const statusClass = !isAvailable ? 'unavailable' : (isOn ? '' : 'off');

    return `
      <div class="header">
        <div class="header-title">
          <div class="status-indicator ${statusClass}"></div>
          ${name}
        </div>
        <div class="header-actions">
          <button class="icon-btn" data-action="power">
            <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12C19,15.87 15.87,19 12,19C8.13,19 5,15.87 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  renderTabs() {
    const tabs = [
      { id: 'display', label: 'Display' },
      { id: 'text', label: 'Text' },
      { id: 'playlist', label: 'Playlist' },
      { id: 'schedule', label: 'Schedule' },
    ];

    return `
      <div class="tabs">
        ${tabs.map(tab => `
          <div class="tab ${this._activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            ${tab.label}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderTabContent(entity, isOn, width, height) {
    switch (this._activeTab) {
      case 'display':
        return this.renderDisplayTab(entity, isOn, width, height);
      case 'text':
        return this.renderTextTab();
      case 'playlist':
        return this.renderPlaylistTab();
      case 'schedule':
        return this.renderScheduleTab();
      default:
        return '';
    }
  }

  renderDisplayTab(entity, isOn, width, height) {
    return `
      <div class="tab-content">
        ${this._config.show_display ? this.renderDisplayPreview(width, height, isOn) : ''}
        ${this._config.show_quick_actions ? this.renderQuickActions(isOn) : ''}
        ${this._config.show_controls ? this.renderControls() : ''}
      </div>
    `;
  }

  renderDisplayPreview(width, height, isOn) {
    const pixelCount = Math.min(width * height, 1024);
    const cols = width;

    return `
      <div class="display-container">
        <div class="display-preview" style="grid-template-columns: repeat(${cols}, 1fr);">
          ${Array(pixelCount).fill(0).map((_, i) => `
            <div class="pixel ${isOn ? 'on' : ''}" data-index="${i}"></div>
          `).join('')}
        </div>
        <div class="display-info">
          <span>${width}x${height}</span>
          <span>${isOn ? 'Active' : 'Off'}</span>
        </div>
      </div>
    `;
  }

  renderQuickActions(isOn) {
    return `
      <div class="quick-actions">
        <button class="action-btn ${isOn ? 'active' : ''}" data-action="power">
          <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
          <span>Power</span>
        </button>
        <button class="action-btn" data-action="clear">
          <svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
          <span>Clear</span>
        </button>
        <button class="action-btn" data-action="clock">
          <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>
          <span>Clock</span>
        </button>
        <button class="action-btn" data-action="sync_time">
          <svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.47 16.5,3.5 14.5,3.12V5.17C15.86,5.5 17.08,6.23 18.2,7.27M12,20A8,8 0 0,1 4,12H2A10,10 0 0,0 12,22V20M19.62,18.15L18.2,16.73C17.08,17.77 15.86,18.5 14.5,18.83V20.88C16.5,20.5 18.27,19.53 19.62,18.15M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12Z"/></svg>
          <span>Sync</span>
        </button>
      </div>
    `;
  }

  renderControls() {
    return `
      <div class="control-section">
        <div class="section-title">Brightness</div>
        <div class="slider-container">
          <input type="range" class="slider" id="brightness" min="1" max="100" value="50">
          <span class="slider-value" id="brightness-value">50%</span>
        </div>
      </div>

      <div class="control-section">
        <div class="section-title">Display Mode</div>
        <div class="mode-buttons">
          <button class="mode-btn active" data-mode="textimage">Text+Image</button>
          <button class="mode-btn" data-mode="text">Text</button>
          <button class="mode-btn" data-mode="clock">Clock</button>
          <button class="mode-btn" data-mode="gif">GIF</button>
          <button class="mode-btn" data-mode="rhythm">Rhythm</button>
        </div>
      </div>

      <div class="control-section">
        <div class="section-title">Orientation</div>
        <select class="dropdown" id="orientation">
          <option value="0">0° (Normal)</option>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select>
      </div>
    `;
  }

  renderTextTab() {
    return `
      <div class="tab-content">
        <div class="control-section">
          <div class="section-title">Display Text</div>
          <div class="text-input-container">
            <input type="text" class="text-input" id="display-text" placeholder="Enter text to display...">
            <button class="send-btn" data-action="send_text">Send</button>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Effect</div>
          <select class="dropdown" id="text-effect">
            <option value="fixed">Fixed</option>
            <option value="scroll_ltr" selected>Scroll Left to Right</option>
            <option value="scroll_rtl">Scroll Right to Left</option>
            <option value="blink">Blink</option>
            <option value="breeze">Breeze</option>
            <option value="snow">Snow</option>
            <option value="laser">Laser</option>
          </select>
        </div>

        <div class="control-section">
          <div class="section-title">Speed</div>
          <div class="slider-container">
            <input type="range" class="slider" id="text-speed" min="1" max="100" value="50">
            <span class="slider-value" id="speed-value">50</span>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Colors</div>
          <div class="color-picker-container">
            <label>Text:</label>
            <input type="color" class="color-picker" id="text-color" value="#ffffff">
            <label style="margin-left: 16px;">Background:</label>
            <input type="color" class="color-picker" id="bg-color" value="#000000">
          </div>
        </div>
      </div>
    `;
  }

  renderPlaylistTab() {
    return `
      <div class="tab-content">
        <div class="control-section">
          <div class="section-title">Active Playlist</div>
          <div class="playlist-container">
            <div class="playlist-item">
              <span class="playlist-item-handle">&#9776;</span>
              <div class="playlist-item-info">
                <div class="playlist-item-name">Welcome Message</div>
                <div class="playlist-item-meta">Text Mode - 5s</div>
              </div>
              <div class="playlist-item-actions">
                <button class="icon-btn" data-action="edit_item">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                </button>
                <button class="icon-btn" data-action="delete_item">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                </button>
              </div>
            </div>
            <div class="playlist-item">
              <span class="playlist-item-handle">&#9776;</span>
              <div class="playlist-item-info">
                <div class="playlist-item-name">Current Time</div>
                <div class="playlist-item-meta">Clock Mode - 10s</div>
              </div>
              <div class="playlist-item-actions">
                <button class="icon-btn" data-action="edit_item">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                </button>
                <button class="icon-btn" data-action="delete_item">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="control-section">
          <div style="display: flex; gap: 8px;">
            <button class="send-btn" data-action="start_playlist" style="flex: 1;">
              &#9654; Start
            </button>
            <button class="send-btn" data-action="stop_playlist" style="flex: 1; background: #f44336;">
              &#9632; Stop
            </button>
            <button class="send-btn" data-action="add_item" style="flex: 1; background: #4caf50;">
              + Add
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderScheduleTab() {
    const now = new Date();
    const currentHour = now.getHours();
    const nowPosition = (currentHour / 24) * 100;

    return `
      <div class="tab-content">
        <div class="control-section">
          <div class="section-title">Power Schedule</div>
          <div class="power-schedule">
            <div class="time-input">
              <label>On:</label>
              <input type="time" id="power-on-time" value="07:00">
            </div>
            <div class="time-input">
              <label>Off:</label>
              <input type="time" id="power-off-time" value="22:00">
            </div>
            <button class="send-btn" data-action="set_power_schedule">Save</button>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Today's Timeline</div>
          <div class="timeline-container">
            <div class="timeline-header">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <div class="timeline-bar">
              <div class="timeline-slot" style="left: 29%; width: 17%;"></div>
              <div class="timeline-slot" style="left: 50%; width: 17%; background: #ff9800;"></div>
              <div class="timeline-now" style="left: ${nowPosition}%;"></div>
            </div>
          </div>
        </div>

        <div class="control-section">
          <div class="section-title">Time Slots</div>
          <div class="playlist-container">
            <div class="playlist-item">
              <div class="playlist-item-info">
                <div class="playlist-item-name">Morning Shift</div>
                <div class="playlist-item-meta">07:00 - 12:00 | Mon-Fri</div>
              </div>
              <div class="playlist-item-actions">
                <button class="icon-btn" data-action="edit_slot">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                </button>
                <button class="icon-btn" data-action="delete_slot">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                </button>
              </div>
            </div>
            <div class="playlist-item">
              <div class="playlist-item-info">
                <div class="playlist-item-name">Afternoon Shift</div>
                <div class="playlist-item-meta">12:00 - 18:00 | Mon-Fri</div>
              </div>
              <div class="playlist-item-actions">
                <button class="icon-btn" data-action="edit_slot">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                </button>
                <button class="icon-btn" data-action="delete_slot">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <button class="send-btn" data-action="add_time_slot" style="width: 100%; margin-top: 8px; background: #4caf50;">
            + Add Time Slot
          </button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Tab switching
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this._activeTab = e.target.dataset.tab;
        this.render();
      });
    });

    // Action buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleAction(e.target.closest('[data-action]').dataset.action);
      });
    });

    // Mode buttons
    this.shadowRoot.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleModeChange(e.target.dataset.mode);
      });
    });

    // Brightness slider
    const brightnessSlider = this.shadowRoot.getElementById('brightness');
    if (brightnessSlider) {
      // Set initial fill
      brightnessSlider.style.setProperty('--value', `${brightnessSlider.value}%`);
      brightnessSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        e.target.style.setProperty('--value', `${value}%`);
        this.shadowRoot.getElementById('brightness-value').textContent = `${value}%`;
      });
      brightnessSlider.addEventListener('change', (e) => {
        this.callService('ipixel_color', 'set_brightness', { level: parseInt(e.target.value) });
      });
    }

    // Speed slider
    const speedSlider = this.shadowRoot.getElementById('text-speed');
    if (speedSlider) {
      // Set initial fill
      speedSlider.style.setProperty('--value', `${speedSlider.value}%`);
      speedSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        e.target.style.setProperty('--value', `${value}%`);
        this.shadowRoot.getElementById('speed-value').textContent = value;
      });
    }

    // Orientation dropdown
    const orientationSelect = this.shadowRoot.getElementById('orientation');
    if (orientationSelect) {
      orientationSelect.addEventListener('change', (e) => {
        const entityId = this._config.entity.replace('text.', 'select.').replace('_text', '_orientation');
        this._hass.callService('select', 'select_option', {
          entity_id: entityId,
          option: e.target.value,
        });
      });
    }
  }

  handleAction(action) {
    const entityId = this._config.entity;
    const switchId = entityId.replace('text.', 'switch.');
    const baseEntityId = entityId.split('.')[1].replace('_text', '');

    switch (action) {
      case 'power':
        this._hass.callService('switch', 'toggle', { entity_id: switchId });
        break;

      case 'clear':
        this.callService('ipixel_color', 'clear_pixels', {});
        break;

      case 'clock':
        this.callService('ipixel_color', 'set_clock_mode', { style: 1, show_date: true, format_24: true });
        break;

      case 'sync_time':
        this.callService('ipixel_color', 'sync_time', {});
        break;

      case 'send_text':
        const text = this.shadowRoot.getElementById('display-text')?.value;
        const effect = this.shadowRoot.getElementById('text-effect')?.value;
        const speed = parseInt(this.shadowRoot.getElementById('text-speed')?.value || '50');
        const textColor = this.hexToRgb(this.shadowRoot.getElementById('text-color')?.value || '#ffffff');
        const bgColor = this.hexToRgb(this.shadowRoot.getElementById('bg-color')?.value || '#000000');

        if (text) {
          this.callService('ipixel_color', 'display_text', {
            text,
            effect,
            speed,
            color_fg: textColor,
            color_bg: bgColor,
          });
        }
        break;

      case 'start_playlist':
        this.callService('ipixel_color', 'start_playlist', {});
        break;

      case 'stop_playlist':
        this.callService('ipixel_color', 'stop_playlist', {});
        break;

      case 'set_power_schedule':
        const onTime = this.shadowRoot.getElementById('power-on-time')?.value;
        const offTime = this.shadowRoot.getElementById('power-off-time')?.value;
        this.callService('ipixel_color', 'set_power_schedule', {
          enabled: true,
          on_time: onTime,
          off_time: offTime,
        });
        break;
    }
  }

  handleModeChange(mode) {
    const entityId = this._config.entity.replace('text.', 'select.').replace('_text', '_mode');
    this._hass.callService('select', 'select_option', {
      entity_id: entityId,
      option: mode,
    });

    // Update UI
    this.shadowRoot.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  callService(domain, service, data) {
    const entityId = this._config.entity;
    const switchId = entityId.replace('text.', 'switch.');

    this._hass.callService(domain, service, {
      entity_id: switchId,
      ...data,
    });
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ] : [255, 255, 255];
  }

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement('ipixel-display-card-editor');
  }

  static getStubConfig() {
    return {
      entity: '',
      name: 'iPIXEL Display',
      show_header: true,
      show_display: true,
      show_controls: true,
      show_quick_actions: true,
      show_playlist: true,
      resolution: '64x16',
    };
  }
}

// Card Editor
class iPIXELDisplayCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass) return;

    // Show all text entities - iPIXEL devices may have various naming patterns
    // (e.g., LED_BLE_*, ipixel_*, etc.)
    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith('text.'))
      .sort();

    this.shadowRoot.innerHTML = `
      <style>
        .form-row {
          margin-bottom: 16px;
        }
        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        select, input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #000);
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .checkbox-row input {
          width: auto;
        }
      </style>

      <div class="form-row">
        <label>Entity</label>
        <select id="entity">
          <option value="">Select an entity</option>
          ${entities.map(e => `
            <option value="${e}" ${this._config?.entity === e ? 'selected' : ''}>
              ${this._hass.states[e]?.attributes?.friendly_name || e}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-row">
        <label>Name (optional)</label>
        <input type="text" id="name" value="${this._config?.name || ''}" placeholder="iPIXEL Display">
      </div>

      <div class="form-row">
        <label>Resolution</label>
        <select id="resolution">
          <option value="auto" ${!this._config?.resolution || this._config?.resolution === 'auto' ? 'selected' : ''}>Auto-detect</option>
          <option value="32x8" ${this._config?.resolution === '32x8' ? 'selected' : ''}>32x8</option>
          <option value="64x16" ${this._config?.resolution === '64x16' ? 'selected' : ''}>64x16</option>
          <option value="64x32" ${this._config?.resolution === '64x32' ? 'selected' : ''}>64x32</option>
          <option value="96x16" ${this._config?.resolution === '96x16' ? 'selected' : ''}>96x16</option>
          <option value="128x32" ${this._config?.resolution === '128x32' ? 'selected' : ''}>128x32</option>
        </select>
      </div>

      <div class="form-row">
        <label>Options</label>
        <div class="checkbox-row">
          <input type="checkbox" id="show_header" ${this._config?.show_header !== false ? 'checked' : ''}>
          <label for="show_header">Show Header</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_display" ${this._config?.show_display !== false ? 'checked' : ''}>
          <label for="show_display">Show Display Preview</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_controls" ${this._config?.show_controls !== false ? 'checked' : ''}>
          <label for="show_controls">Show Controls</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="show_quick_actions" ${this._config?.show_quick_actions !== false ? 'checked' : ''}>
          <label for="show_quick_actions">Show Quick Actions</label>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('select, input').forEach(el => {
      el.addEventListener('change', () => this.updateConfig());
    });
  }

  updateConfig() {
    const entityId = this.shadowRoot.getElementById('entity').value;

    // Try to auto-detect resolution from device sensors
    let resolution = this.shadowRoot.getElementById('resolution').value;
    if (entityId && this._hass) {
      const detectedRes = this.detectResolution(entityId);
      if (detectedRes) {
        resolution = detectedRes;
      }
    }

    const config = {
      type: 'custom:ipixel-display-card',
      entity: entityId,
      name: this.shadowRoot.getElementById('name').value || undefined,
      resolution: resolution,
      show_header: this.shadowRoot.getElementById('show_header').checked,
      show_display: this.shadowRoot.getElementById('show_display').checked,
      show_controls: this.shadowRoot.getElementById('show_controls').checked,
      show_quick_actions: this.shadowRoot.getElementById('show_quick_actions').checked,
    };

    const event = new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  detectResolution(entityId) {
    // Try to find width/height sensors for this device
    // Entity patterns: text.display -> sensor.display_width, sensor.display_height
    // Or: text.led_ble_xxx -> sensor.led_ble_xxx_display_width
    if (!this._hass) return null;

    const baseName = entityId.replace('text.', '');

    // Try different sensor naming patterns
    const patterns = [
      [`sensor.${baseName}_width`, `sensor.${baseName}_height`],
      [`sensor.${baseName}_display_width`, `sensor.${baseName}_display_height`],
      [`sensor.display_width`, `sensor.display_height`],
    ];

    for (const [widthEntity, heightEntity] of patterns) {
      const widthState = this._hass.states[widthEntity];
      const heightState = this._hass.states[heightEntity];

      if (widthState && heightState) {
        const width = parseInt(widthState.state);
        const height = parseInt(heightState.state);
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
          return `${width}x${height}`;
        }
      }
    }

    return null;
  }
}

// Register custom elements
customElements.define('ipixel-display-card', iPIXELDisplayCard);
customElements.define('ipixel-display-card-editor', iPIXELDisplayCardEditor);

// Register card with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ipixel-display-card',
  name: 'iPIXEL Display Card',
  description: 'Control your iPIXEL Color LED display with this feature-rich card',
  preview: true,
  documentationURL: 'https://github.com/cagcoach/ha-ipixel-color',
});

console.info(
  `%c iPIXEL Display Card %c ${CARD_VERSION} `,
  'background: #03a9f4; color: #fff; padding: 2px 4px; border-radius: 4px 0 0 4px;',
  'background: #333; color: #fff; padding: 2px 4px; border-radius: 0 4px 4px 0;'
);
