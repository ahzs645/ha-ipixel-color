/**
 * iPIXEL Cards for Home Assistant
 * Modular Lovelace cards for controlling iPIXEL Color LED displays
 *
 * Cards included:
 * - ipixel-display-card: LED matrix preview with power control
 * - ipixel-controls-card: Brightness, mode, and orientation controls
 * - ipixel-text-card: Text input with effects and colors
 * - ipixel-playlist-card: Playlist management
 * - ipixel-schedule-card: Power schedule and time slots
 *
 * Source files in /cards folder for development reference.
 * This bundled file is used by Home Assistant.
 *
 * @version 2.2.0
 * @author iPIXEL Color Team
 * @license MIT
 */

const CARD_VERSION = '2.2.0';

// =============================================================================
// SHARED STYLES
// =============================================================================

const iPIXELCardStyles = `
  :host {
    --ipixel-primary: var(--primary-color, #03a9f4);
    --ipixel-accent: var(--accent-color, #ff9800);
    --ipixel-text: var(--primary-text-color, #fff);
    --ipixel-bg: var(--ha-card-background, #1c1c1c);
    --ipixel-border: var(--divider-color, #333);
  }

  .card-content { padding: 16px; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 1.1em;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4caf50;
  }
  .status-dot.off { background: #f44336; }
  .status-dot.unavailable { background: #9e9e9e; }

  .section-title {
    font-size: 0.85em;
    font-weight: 500;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .control-row { margin-bottom: 12px; }

  /* Buttons */
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 500;
    transition: all 0.2s;
  }
  .btn-primary { background: var(--ipixel-primary); color: #fff; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-secondary {
    background: rgba(255,255,255,0.1);
    color: var(--ipixel-text);
    border: 1px solid var(--ipixel-border);
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.15); }
  .btn-danger { background: #f44336; color: #fff; }
  .btn-success { background: #4caf50; color: #fff; }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.1);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    color: inherit;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.15); }
  .icon-btn.active {
    background: rgba(3, 169, 244, 0.3);
    border-color: var(--ipixel-primary);
  }
  .icon-btn svg { width: 20px; height: 20px; fill: currentColor; }

  /* Slider */
  .slider-row { display: flex; align-items: center; gap: 12px; }
  .slider-label { min-width: 70px; font-size: 0.85em; }
  .slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right,
      var(--ipixel-primary) 0%,
      var(--ipixel-primary) var(--value, 50%),
      rgba(255,255,255,0.25) var(--value, 50%),
      rgba(255,255,255,0.25) 100%);
    outline: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
  }
  .slider-value { min-width: 40px; text-align: right; font-size: 0.85em; font-weight: 500; }

  /* Dropdown */
  .dropdown {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    cursor: pointer;
  }

  /* Input */
  .text-input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    box-sizing: border-box;
  }
  .text-input:focus { outline: none; border-color: var(--ipixel-primary); }

  /* Button Grid */
  .button-grid { display: grid; gap: 8px; }
  .button-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .button-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .button-grid-2 { grid-template-columns: repeat(2, 1fr); }

  /* Mode buttons */
  .mode-btn {
    padding: 10px 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    font-size: 0.8em;
    color: inherit;
    transition: all 0.2s;
  }
  .mode-btn:hover { background: rgba(255,255,255,0.12); }
  .mode-btn.active { background: rgba(3, 169, 244, 0.25); border-color: var(--ipixel-primary); }

  /* Color picker */
  .color-row { display: flex; align-items: center; gap: 12px; }
  .color-picker {
    width: 40px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--ipixel-border);
    border-radius: 4px;
    cursor: pointer;
    background: none;
  }

  /* List items */
  .list-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    margin-bottom: 8px;
    gap: 12px;
  }
  .list-item:last-child { margin-bottom: 0; }
  .list-item-info { flex: 1; }
  .list-item-name { font-weight: 500; font-size: 0.9em; }
  .list-item-meta { font-size: 0.75em; opacity: 0.6; margin-top: 2px; }
  .list-item-actions { display: flex; gap: 4px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 24px; opacity: 0.6; font-size: 0.9em; }

  @media (max-width: 400px) {
    .button-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
`;


// =============================================================================
// BASE CLASS
// =============================================================================

class iPIXELCardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please define an entity');
    this._config = config;
    this.render();
  }

  getEntity() {
    if (!this._hass || !this._config.entity) return null;
    return this._hass.states[this._config.entity];
  }

  getRelatedEntity(domain, suffix = '') {
    if (!this._hass || !this._config.entity) return null;

    // Extract base name from config entity (e.g., "led_ble_28b0e78e" from "text.led_ble_28b0e78e_display")
    const baseName = this._config.entity.replace(/^[^.]+\./, '').replace(/_?(text|display|gif_url)$/i, '');

    // Try exact match first
    const exactId = `${domain}.${baseName}${suffix}`;
    if (this._hass.states[exactId]) return this._hass.states[exactId];

    // Search for matching entities in the domain
    const matches = Object.keys(this._hass.states).filter(id => {
      if (!id.startsWith(`${domain}.`)) return false;
      const entityName = id.replace(/^[^.]+\./, '');
      return entityName.includes(baseName) || baseName.includes(entityName.replace(suffix, ''));
    });

    // Prefer entities without suffix for power switch, with suffix for others
    if (suffix) {
      const withSuffix = matches.find(id => id.endsWith(suffix));
      if (withSuffix) return this._hass.states[withSuffix];
    } else {
      // For power switch, find the one that matches the base name most closely
      const sorted = matches.sort((a, b) => a.length - b.length);
      if (sorted.length > 0) return this._hass.states[sorted[0]];
    }

    return matches.length > 0 ? this._hass.states[matches[0]] : null;
  }

  async callService(domain, service, data = {}) {
    if (!this._hass) return;
    try {
      await this._hass.callService(domain, service, data);
    } catch (err) {
      console.error(`iPIXEL service call failed: ${domain}.${service}`, err);
    }
  }

  getResolution() {
    const widthEntity = this.getRelatedEntity('sensor', '_width') || this._hass?.states['sensor.display_width'];
    const heightEntity = this.getRelatedEntity('sensor', '_height') || this._hass?.states['sensor.display_height'];
    if (widthEntity && heightEntity) {
      const w = parseInt(widthEntity.state), h = parseInt(heightEntity.state);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return [w, h];
    }
    return [64, 16];
  }

  isOn() {
    return this.getRelatedEntity('switch')?.state === 'on';
  }

  hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 255, 255];
  }

  render() { /* Override */ }
  getCardSize() { return 2; }
}


// =============================================================================
// DISPLAY CARD
// =============================================================================

class iPIXELDisplayCard extends iPIXELCardBase {
  constructor() {
    super();
    this._pixelFont = this._createPixelFont();
  }

  // Simple 5x7 pixel font for common characters
  _createPixelFont() {
    return {
      'A': [0x7C,0x12,0x11,0x12,0x7C], 'B': [0x7F,0x49,0x49,0x49,0x36], 'C': [0x3E,0x41,0x41,0x41,0x22],
      'D': [0x7F,0x41,0x41,0x22,0x1C], 'E': [0x7F,0x49,0x49,0x49,0x41], 'F': [0x7F,0x09,0x09,0x09,0x01],
      'G': [0x3E,0x41,0x49,0x49,0x7A], 'H': [0x7F,0x08,0x08,0x08,0x7F], 'I': [0x00,0x41,0x7F,0x41,0x00],
      'J': [0x20,0x40,0x41,0x3F,0x01], 'K': [0x7F,0x08,0x14,0x22,0x41], 'L': [0x7F,0x40,0x40,0x40,0x40],
      'M': [0x7F,0x02,0x0C,0x02,0x7F], 'N': [0x7F,0x04,0x08,0x10,0x7F], 'O': [0x3E,0x41,0x41,0x41,0x3E],
      'P': [0x7F,0x09,0x09,0x09,0x06], 'Q': [0x3E,0x41,0x51,0x21,0x5E], 'R': [0x7F,0x09,0x19,0x29,0x46],
      'S': [0x46,0x49,0x49,0x49,0x31], 'T': [0x01,0x01,0x7F,0x01,0x01], 'U': [0x3F,0x40,0x40,0x40,0x3F],
      'V': [0x1F,0x20,0x40,0x20,0x1F], 'W': [0x3F,0x40,0x38,0x40,0x3F], 'X': [0x63,0x14,0x08,0x14,0x63],
      'Y': [0x07,0x08,0x70,0x08,0x07], 'Z': [0x61,0x51,0x49,0x45,0x43],
      '0': [0x3E,0x51,0x49,0x45,0x3E], '1': [0x00,0x42,0x7F,0x40,0x00], '2': [0x42,0x61,0x51,0x49,0x46],
      '3': [0x21,0x41,0x45,0x4B,0x31], '4': [0x18,0x14,0x12,0x7F,0x10], '5': [0x27,0x45,0x45,0x45,0x39],
      '6': [0x3C,0x4A,0x49,0x49,0x30], '7': [0x01,0x71,0x09,0x05,0x03], '8': [0x36,0x49,0x49,0x49,0x36],
      '9': [0x06,0x49,0x49,0x29,0x1E], ':': [0x00,0x36,0x36,0x00,0x00], ' ': [0x00,0x00,0x00,0x00,0x00],
      '.': [0x00,0x60,0x60,0x00,0x00], '!': [0x00,0x00,0x5F,0x00,0x00], '-': [0x08,0x08,0x08,0x08,0x08],
    };
  }

  // Render text to pixel array
  _textToPixels(text, width, height, fgColor = '#ff6600', bgColor = '#111') {
    const pixels = [];
    const charWidth = 6; // 5 pixels + 1 space
    const charHeight = 7;
    const startY = Math.floor((height - charHeight) / 2);

    // Initialize all pixels to background
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixels.push(bgColor);
      }
    }

    // Render each character
    let xOffset = 1;
    for (const char of text.toUpperCase()) {
      const charData = this._pixelFont[char] || this._pixelFont[' '];
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 7; row++) {
          const pixelOn = (charData[col] >> row) & 1;
          const px = xOffset + col;
          const py = startY + row;
          if (px < width && py < height && py >= 0) {
            pixels[py * width + px] = pixelOn ? fgColor : bgColor;
          }
        }
      }
      xOffset += charWidth;
      if (xOffset >= width) break;
    }
    return pixels;
  }

  // Create SVG pixel display
  _createPixelSvg(width, height, pixels, pixelGap = 1) {
    const svgWidth = 100; // percentage-based
    const pxWidth = svgWidth / width;
    const pxHeight = pxWidth; // square pixels

    let rects = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = pixels[y * width + x] || '#111';
        const isLit = color !== '#111' && color !== '#000' && color !== '#1a1a1a';
        rects += `<rect x="${x * pxWidth}" y="${y * pxHeight}" width="${pxWidth - pixelGap * 0.1}" height="${pxHeight - pixelGap * 0.1}" fill="${color}" rx="0.3" ${isLit ? `style="filter: drop-shadow(0 0 1px ${color})"` : ''}/>`;
      }
    }
    return `<svg viewBox="0 0 ${svgWidth} ${height * pxHeight}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">${rects}</svg>`;
  }

  render() {
    if (!this._hass) return;
    const [width, height] = this.getResolution();
    const isOn = this.isOn();
    const name = this._config.name || this.getEntity()?.attributes?.friendly_name || 'iPIXEL Display';

    // Get current display content
    const textEntity = this.getEntity();
    const currentText = textEntity?.state || '';
    const modeEntity = this.getRelatedEntity('select', '_mode');
    const currentMode = modeEntity?.state || 'text';

    // Determine content and colors
    let displayText = '';
    let fgColor = '#ff6600';
    let bgColor = '#111';

    if (!isOn) {
      displayText = '';
      bgColor = '#050505';
    } else if (currentMode === 'clock') {
      const now = new Date();
      displayText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      fgColor = '#00ff88';
    } else if (currentMode === 'gif') {
      displayText = 'GIF';
      fgColor = '#ff44ff';
    } else if (currentMode === 'rhythm') {
      displayText = '***';
      fgColor = '#44aaff';
    } else {
      displayText = currentText || '';
    }

    // Generate pixel data
    const pixels = this._textToPixels(displayText, width, height, fgColor, bgColor);
    const pixelSvg = this._createPixelSvg(width, height, pixels);

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
            <div class="display-screen">${pixelSvg}</div>
            <div class="display-footer">
              <span>${width} x ${height}</span>
              <span class="mode-badge">${isOn ? currentMode : 'Off'}</span>
            </div>
          </div>
        </div>
      </ha-card>`;

    // Power button - use stored switch entity ID for reliability
    this.shadowRoot.getElementById('power-btn')?.addEventListener('click', () => {
      // Try to find switch entity
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
        // Fallback: search for any ipixel switch
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


// =============================================================================
// CONTROLS CARD
// =============================================================================

class iPIXELControlsCard extends iPIXELCardBase {
  render() {
    if (!this._hass) return;
    const isOn = this.isOn();

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}</style>
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
          <div class="section-title">Orientation</div>
          <div class="control-row">
            <select class="dropdown" id="orientation">
              <option value="0">0° (Normal)</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </div>
        </div>
      </ha-card>`;

    this._attachControlListeners();
  }

  _attachControlListeners() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action === 'power') {
          const sw = this.getRelatedEntity('switch');
          if (sw) {
            this._hass.callService('switch', 'toggle', { entity_id: sw.entity_id });
          } else {
            console.warn('iPIXEL: No power switch found for toggle');
          }
        } else if (action === 'clear') this.callService('ipixel_color', 'clear_pixels');
        else if (action === 'clock') this.callService('ipixel_color', 'set_clock_mode', { style: 1 });
        else if (action === 'sync') this.callService('ipixel_color', 'sync_time');
      });
    });

    const slider = this.shadowRoot.getElementById('brightness');
    if (slider) {
      slider.style.setProperty('--value', `${slider.value}%`);
      slider.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('brightness-val').textContent = `${e.target.value}%`;
      });
      slider.addEventListener('change', (e) => this.callService('ipixel_color', 'set_brightness', { level: parseInt(e.target.value) }));
    }

    this.shadowRoot.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        const modeEntity = this.getRelatedEntity('select', '_mode');
        if (modeEntity) this._hass.callService('select', 'select_option', { entity_id: modeEntity.entity_id, option: mode });
        this.shadowRoot.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    this.shadowRoot.getElementById('orientation')?.addEventListener('change', (e) => {
      const orientEntity = this.getRelatedEntity('select', '_orientation');
      if (orientEntity) this._hass.callService('select', 'select_option', { entity_id: orientEntity.entity_id, option: e.target.value });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}


// =============================================================================
// TEXT CARD
// =============================================================================

class iPIXELTextCard extends iPIXELCardBase {
  render() {
    if (!this._hass) return;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
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
              <option value="fixed">Fixed</option>
              <option value="scroll_ltr" selected>Scroll Left to Right</option>
              <option value="scroll_rtl">Scroll Right to Left</option>
              <option value="blink">Blink</option>
              <option value="breeze">Breeze</option>
              <option value="snow">Snow</option>
              <option value="laser">Laser</option>
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
              <input type="color" class="color-picker" id="text-color" value="#ffffff">
              <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
              <input type="color" class="color-picker" id="bg-color" value="#000000">
            </div>
          </div>
        </div>
      </ha-card>`;

    const speed = this.shadowRoot.getElementById('speed');
    if (speed) {
      speed.style.setProperty('--value', `${speed.value}%`);
      speed.addEventListener('input', (e) => {
        e.target.style.setProperty('--value', `${e.target.value}%`);
        this.shadowRoot.getElementById('speed-val').textContent = e.target.value;
      });
    }

    this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => {
      const text = this.shadowRoot.getElementById('text-input')?.value;
      if (text) {
        this.callService('ipixel_color', 'display_text', {
          text,
          effect: this.shadowRoot.getElementById('effect')?.value,
          speed: parseInt(this.shadowRoot.getElementById('speed')?.value || '50'),
          color_fg: this.hexToRgb(this.shadowRoot.getElementById('text-color')?.value),
          color_bg: this.hexToRgb(this.shadowRoot.getElementById('bg-color')?.value),
        });
      }
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}


// =============================================================================
// PLAYLIST CARD
// =============================================================================

class iPIXELPlaylistCard extends iPIXELCardBase {
  render() {
    if (!this._hass) return;
    const playlist = this._config.items || [];

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .playlist-actions { display: flex; gap: 8px; margin-top: 12px; }
        .playlist-actions .btn { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header"><div class="card-title">Playlist</div></div>
          <div id="playlist-items">
            ${playlist.length === 0 ? '<div class="empty-state">No playlist items yet</div>' :
              playlist.map((item, i) => `
                <div class="list-item">
                  <div class="list-item-info">
                    <div class="list-item-name">${item.name || `Item ${i + 1}`}</div>
                    <div class="list-item-meta">${item.mode || 'text'} - ${(item.duration_ms || 5000) / 1000}s</div>
                  </div>
                  <div class="list-item-actions">
                    <button class="icon-btn" style="width:28px;height:28px;">
                      <svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                    </button>
                  </div>
                </div>`).join('')}
          </div>
          <div class="playlist-actions">
            <button class="btn btn-success" id="start-btn">▶ Start</button>
            <button class="btn btn-danger" id="stop-btn">■ Stop</button>
            <button class="btn btn-secondary" id="add-btn">+ Add</button>
          </div>
        </div>
      </ha-card>`;

    this.shadowRoot.getElementById('start-btn')?.addEventListener('click', () => this.callService('ipixel_color', 'start_playlist'));
    this.shadowRoot.getElementById('stop-btn')?.addEventListener('click', () => this.callService('ipixel_color', 'stop_playlist'));
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}


// =============================================================================
// SCHEDULE CARD
// =============================================================================

class iPIXELScheduleCard extends iPIXELCardBase {
  render() {
    if (!this._hass) return;
    const now = new Date();
    const nowPos = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; left: ${nowPos}%; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] { padding: 6px 10px; background: rgba(255,255,255,0.08); border: 1px solid var(--ipixel-border); border-radius: 4px; color: inherit; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Today's Timeline</div>
          <div class="timeline">
            <div class="timeline-header"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
            <div class="timeline-bar"><div class="timeline-now"></div></div>
          </div>
          <div class="section-title">Power Schedule</div>
          <div class="control-row">
            <div class="power-row">
              <label>On:</label><input type="time" id="power-on" value="07:00">
              <label>Off:</label><input type="time" id="power-off" value="22:00">
              <button class="btn btn-primary" id="save-power">Save</button>
            </div>
          </div>
          <div class="section-title">Time Slots</div>
          <div id="time-slots"><div class="empty-state">No time slots configured</div></div>
          <button class="btn btn-secondary" id="add-slot" style="width: 100%; margin-top: 8px;">+ Add Time Slot</button>
        </div>
      </ha-card>`;

    this.shadowRoot.getElementById('save-power')?.addEventListener('click', () => {
      this.callService('ipixel_color', 'set_power_schedule', {
        enabled: true,
        on_time: this.shadowRoot.getElementById('power-on')?.value,
        off_time: this.shadowRoot.getElementById('power-off')?.value,
      });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}


// =============================================================================
// EDITOR
// =============================================================================

class iPIXELSimpleEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(config) { this._config = config; this.render(); }
  set hass(hass) { this._hass = hass; this.render(); }

  render() {
    if (!this._hass) return;
    const entities = Object.keys(this._hass.states).filter(e => e.startsWith('text.') || e.startsWith('switch.')).sort();

    this.shadowRoot.innerHTML = `
      <style>
        .row { margin-bottom: 12px; }
        label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; }
        select, input { width: 100%; padding: 8px; border: 1px solid var(--divider-color, #ccc); border-radius: 4px; background: var(--card-background-color); color: inherit; box-sizing: border-box; }
      </style>
      <div class="row">
        <label>Entity</label>
        <select id="entity">
          <option value="">Select entity</option>
          ${entities.map(e => `<option value="${e}" ${this._config?.entity === e ? 'selected' : ''}>${this._hass.states[e]?.attributes?.friendly_name || e}</option>`).join('')}
        </select>
      </div>
      <div class="row">
        <label>Name (optional)</label>
        <input type="text" id="name" value="${this._config?.name || ''}" placeholder="Display name">
      </div>`;

    this.shadowRoot.querySelectorAll('select, input').forEach(el => el.addEventListener('change', () => this.fireConfig()));
  }

  fireConfig() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { type: this._config?.type || 'custom:ipixel-display-card', entity: this.shadowRoot.getElementById('entity')?.value, name: this.shadowRoot.getElementById('name')?.value || undefined } },
      bubbles: true, composed: true,
    }));
  }
}


// =============================================================================
// REGISTER CARDS
// =============================================================================

customElements.define('ipixel-display-card', iPIXELDisplayCard);
customElements.define('ipixel-controls-card', iPIXELControlsCard);
customElements.define('ipixel-text-card', iPIXELTextCard);
customElements.define('ipixel-playlist-card', iPIXELPlaylistCard);
customElements.define('ipixel-schedule-card', iPIXELScheduleCard);
customElements.define('ipixel-simple-editor', iPIXELSimpleEditor);

window.customCards = window.customCards || [];
[
  { type: 'ipixel-display-card', name: 'iPIXEL Display', description: 'LED matrix preview with power control' },
  { type: 'ipixel-controls-card', name: 'iPIXEL Controls', description: 'Brightness, mode, and orientation controls' },
  { type: 'ipixel-text-card', name: 'iPIXEL Text', description: 'Text input with effects and colors' },
  { type: 'ipixel-playlist-card', name: 'iPIXEL Playlist', description: 'Playlist management' },
  { type: 'ipixel-schedule-card', name: 'iPIXEL Schedule', description: 'Power schedule and time slots' },
].forEach(card => window.customCards.push({ ...card, preview: true, documentationURL: 'https://github.com/cagcoach/ha-ipixel-color' }));

console.info(`%c iPIXEL Cards %c ${CARD_VERSION} `, 'background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;', 'background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;');
