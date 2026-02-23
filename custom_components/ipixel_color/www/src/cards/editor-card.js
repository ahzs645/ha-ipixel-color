/**
 * iPIXEL Pixel Editor Card
 * Canvas-based pixel art editor for LED matrix displays
 * Adapted from iPIXEL PNG Editor by opa-gamert
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';

// Color palette (same as original editor)
const PALETTE_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00',
  '#0080FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FF8000', '#8000FF', '#2EC4FF', '#0010A0',
  '#A0FF00', '#FF80C0', '#808080', '#C0C0C0'
];

// Common resolution presets (quick-select, not a hard limit)
const RESOLUTION_PRESETS = [
  { value: '16x16', label: '16×16' },
  { value: '32x8', label: '32×8' },
  { value: '32x16', label: '32×16' },
  { value: '32x32', label: '32×32' },
  { value: '64x16', label: '64×16' },
  { value: '64x20', label: '64×20' },
  { value: '64x64', label: '64×64' },
  { value: '96x16', label: '96×16' },
  { value: '128x16', label: '128×16' },
  { value: '192x16', label: '192×16' },
];

// Background color for LED backplate
const BG_COLOR = { r: 25, g: 25, b: 25 };

export class iPIXELEditorCard extends iPIXELCardBase {
  constructor() {
    super();
    // Editor state
    this._width = 64;
    this._height = 16;
    this._tool = 'pen';
    this._drawing = false;
    this._gridOn = true;
    this._currentColor = '#ff6600';
    this._scale = 8;
    this._sending = false;

    // Canvases (created once, reused)
    this._logicalCanvas = document.createElement('canvas');
    this._ctx = this._logicalCanvas.getContext('2d');
    this._displayCanvas = null;
    this._dctx = null;
    this._initialized = false;
  }

  setConfig(config) {
    // Allow empty entity in test mode
    if (!config.entity && !this.isInTestMode()) {
      this._config = config;
      return;
    }
    this._config = config;
    // Don't call render here - wait for hass
  }

  set hass(hass) {
    const hadHass = !!this._hass;
    this._hass = hass;

    // Only do full render on first hass set or config change
    if (!hadHass) {
      // Get resolution from device (or use defaults in test mode)
      const [w, h] = this.getResolution();
      this._width = w;
      this._height = h;
      this._logicalCanvas.width = w;
      this._logicalCanvas.height = h;
      this.render();
    }
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const entity = this.getEntity();
    const isOn = this.isOn();
    const [deviceWidth, deviceHeight] = this.getResolution();

    // Build resolution preset buttons
    const currentRes = `${this._width}x${this._height}`;
    const presetButtons = RESOLUTION_PRESETS.map(opt => {
      const active = opt.value === currentRes ? 'active' : '';
      return `<button class="preset-btn ${active}" data-res="${opt.value}">${opt.label}</button>`;
    }).join('');

    // Build palette swatches
    const paletteSwatches = PALETTE_COLORS.map(color => {
      const active = color.toLowerCase() === this._currentColor.toLowerCase() ? 'active' : '';
      return `<div class="color-swatch ${active}" data-color="${color}" style="background:${color}"></div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${iPIXELCardStyles}

        .editor-toolbar {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .tool-group {
          display: flex;
          gap: 4px;
        }

        .color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 12px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          box-sizing: border-box;
        }

        .color-swatch:hover {
          border-color: rgba(255,255,255,0.5);
        }

        .color-swatch.active {
          border-color: var(--ipixel-primary);
          box-shadow: 0 0 0 1px var(--ipixel-primary);
        }

        .canvas-container {
          background: #050608;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 12px;
          overflow: auto;
          text-align: center;
        }

        #editor-canvas {
          display: inline-block;
          cursor: crosshair;
          image-rendering: pixelated;
          touch-action: none;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75em;
          opacity: 0.6;
          margin-bottom: 8px;
        }

        .tool-icon {
          font-size: 16px;
        }

        .resolution-inputs {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .resolution-inputs input {
          width: 48px;
          padding: 5px 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border);
          border-radius: 6px;
          color: inherit;
          font-size: 0.85em;
          text-align: center;
        }

        .resolution-inputs span {
          opacity: 0.5;
          font-size: 0.85em;
        }

        .resolution-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }

        .preset-btn {
          padding: 3px 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--ipixel-border);
          border-radius: 4px;
          color: inherit;
          font-size: 0.7em;
          cursor: pointer;
          opacity: 0.7;
        }

        .preset-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,0.12);
        }

        .preset-btn.active {
          border-color: var(--ipixel-primary);
          opacity: 1;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>

      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${isOn ? '' : 'off'}"></span>
              ${this._config.name || 'Pixel Editor'}
            </div>
          </div>

          <!-- Toolbar -->
          <div class="editor-toolbar">
            <div class="tool-group">
              <button class="icon-btn ${this._tool === 'pen' ? 'active' : ''}" id="pen-tool" title="Pen Tool">
                <span class="tool-icon">&#9998;</span>
              </button>
              <button class="icon-btn ${this._tool === 'eraser' ? 'active' : ''}" id="eraser-tool" title="Eraser Tool">
                <span class="tool-icon">&#9746;</span>
              </button>
            </div>
            <input type="color" class="color-picker" id="color-picker" value="${this._currentColor}" title="Pick Color">
            <button class="icon-btn ${this._gridOn ? 'active' : ''}" id="grid-toggle" title="Toggle LED Grid">
              <span class="tool-icon">&#9638;</span>
            </button>
            <div class="resolution-inputs">
              <input type="number" id="res-width" value="${this._width}" min="1" max="512" title="Width">
              <span>×</span>
              <input type="number" id="res-height" value="${this._height}" min="1" max="512" title="Height">
            </div>
          </div>

          <!-- Resolution Presets -->
          <div class="resolution-presets" id="res-presets">
            ${presetButtons}
          </div>

          <!-- Color Palette -->
          <div class="color-palette" id="palette">
            ${paletteSwatches}
          </div>

          <!-- Canvas -->
          <div class="canvas-container">
            <canvas id="editor-canvas"></canvas>
          </div>

          <!-- Info -->
          <div class="info-row">
            <span>Tool: ${this._tool} | Grid: ${this._gridOn ? 'LED' : 'Flat'}</span>
            <span>Device: ${deviceWidth}×${deviceHeight}</span>
          </div>

          <!-- Actions -->
          <div class="button-grid button-grid-3">
            <button class="btn btn-secondary" id="clear-btn">Clear</button>
            <button class="btn btn-secondary" id="import-btn">Import</button>
            <button class="btn btn-primary send-btn" id="send-btn" ${this._sending ? 'disabled' : ''}>
              ${this._sending ? 'Sending...' : (testMode ? 'Preview Only' : 'Send to Device')}
            </button>
          </div>

          <!-- Hidden file input for import -->
          <input type="file" id="file-input" accept="image/png,image/gif,image/jpeg" style="display:none">
        </div>
      </ha-card>
    `;

    this._initCanvas();
    this._attachListeners();
  }

  _initCanvas() {
    this._displayCanvas = this.shadowRoot.getElementById('editor-canvas');
    if (!this._displayCanvas) return;

    this._dctx = this._displayCanvas.getContext('2d');

    // Ensure logical canvas matches dimensions
    if (this._logicalCanvas.width !== this._width || this._logicalCanvas.height !== this._height) {
      this._logicalCanvas.width = this._width;
      this._logicalCanvas.height = this._height;
    }

    this._updateDisplaySize();
    this._renderDisplay();
    this._initialized = true;
  }

  _updateDisplaySize() {
    if (!this._displayCanvas) return;
    this._displayCanvas.width = this._width * this._scale;
    this._displayCanvas.height = this._height * this._scale;
  }

  _renderDisplay() {
    if (!this._dctx || !this._ctx) return;

    this._updateDisplaySize();

    // Panel background
    this._dctx.fillStyle = '#050608';
    this._dctx.fillRect(0, 0, this._displayCanvas.width, this._displayCanvas.height);

    const imgData = this._ctx.getImageData(0, 0, this._width, this._height).data;
    const cellSize = this._scale;
    const ledRadius = cellSize * 0.38;

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        const idx = (y * this._width + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];

        const isOffPixel = (a === 0);

        const sx = x * cellSize;
        const sy = y * cellSize;
        const cx = sx + cellSize / 2;
        const cy = sy + cellSize / 2;

        // Background square (backplate)
        this._dctx.fillStyle = `rgb(${BG_COLOR.r},${BG_COLOR.g},${BG_COLOR.b})`;
        this._dctx.fillRect(sx, sy, cellSize, cellSize);

        if (this._gridOn) {
          if (!isOffPixel) {
            // On-pixel: colored LED + glow
            const grad = this._dctx.createRadialGradient(
              cx, cy, ledRadius * 0.3,
              cx, cy, ledRadius * 1.8
            );
            grad.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            this._dctx.fillStyle = grad;
            this._dctx.beginPath();
            this._dctx.arc(cx, cy, ledRadius * 1.8, 0, Math.PI * 2);
            this._dctx.fill();

            // Core LED (solid circle)
            this._dctx.fillStyle = `rgb(${r},${g},${b})`;
            this._dctx.beginPath();
            this._dctx.arc(cx, cy, ledRadius, 0, Math.PI * 2);
            this._dctx.fill();
          } else {
            // Off-pixel: dark LED dot
            this._dctx.fillStyle = 'rgb(5,5,5)';
            this._dctx.beginPath();
            this._dctx.arc(cx, cy, ledRadius, 0, Math.PI * 2);
            this._dctx.fill();
          }
        } else {
          // Flat view (no LED grid)
          if (!isOffPixel) {
            this._dctx.fillStyle = `rgb(${r},${g},${b})`;
          } else {
            this._dctx.fillStyle = `rgb(${BG_COLOR.r},${BG_COLOR.g},${BG_COLOR.b})`;
          }
          this._dctx.fillRect(sx, sy, cellSize, cellSize);
        }
      }
    }
  }

  _getPixelPos(evt) {
    if (!this._displayCanvas) return null;
    const rect = this._displayCanvas.getBoundingClientRect();
    const cellW = rect.width / this._width;
    const cellH = rect.height / this._height;

    // Handle both mouse and touch events
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;

    const x = Math.floor((clientX - rect.left) / cellW);
    const y = Math.floor((clientY - rect.top) / cellH);

    if (x < 0 || y < 0 || x >= this._width || y >= this._height) return null;
    return { x, y };
  }

  _drawAt(evt) {
    const p = this._getPixelPos(evt);
    if (!p) return;

    if (this._tool === 'pen') {
      this._ctx.fillStyle = this._currentColor;
      this._ctx.fillRect(p.x, p.y, 1, 1);
    } else {
      this._ctx.clearRect(p.x, p.y, 1, 1);
    }
    this._renderDisplay();
  }

  _attachListeners() {
    const canvas = this.shadowRoot.getElementById('editor-canvas');
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._drawing = true;
      this._drawAt(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this._drawing) this._drawAt(e);
    });

    window.addEventListener('mouseup', () => {
      this._drawing = false;
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._drawing = true;
      this._drawAt(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this._drawing) this._drawAt(e);
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this._drawing = false;
    });

    // Tool selection
    this.shadowRoot.getElementById('pen-tool')?.addEventListener('click', () => {
      this._tool = 'pen';
      this.render();
    });

    this.shadowRoot.getElementById('eraser-tool')?.addEventListener('click', () => {
      this._tool = 'eraser';
      this.render();
    });

    // Color picker
    this.shadowRoot.getElementById('color-picker')?.addEventListener('input', (e) => {
      this._currentColor = e.target.value;
      this._updatePaletteSelection();
    });

    // Palette swatches
    this.shadowRoot.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this._currentColor = swatch.dataset.color;
        this.shadowRoot.getElementById('color-picker').value = this._currentColor;
        this._updatePaletteSelection();
      });
    });

    // Grid toggle
    this.shadowRoot.getElementById('grid-toggle')?.addEventListener('click', () => {
      this._gridOn = !this._gridOn;
      this.render();
    });

    // Resolution change via custom inputs
    const applyResInputs = () => {
      const w = parseInt(this.shadowRoot.getElementById('res-width')?.value, 10);
      const h = parseInt(this.shadowRoot.getElementById('res-height')?.value, 10);
      if (w > 0 && h > 0 && (w !== this._width || h !== this._height)) {
        this._resizeCanvas(w, h);
      }
    };
    this.shadowRoot.getElementById('res-width')?.addEventListener('change', applyResInputs);
    this.shadowRoot.getElementById('res-height')?.addEventListener('change', applyResInputs);

    // Resolution preset buttons
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const [w, h] = btn.dataset.res.split('x').map(v => parseInt(v, 10));
        this._resizeCanvas(w, h);
        // Update the number inputs to match
        const widthInput = this.shadowRoot.getElementById('res-width');
        const heightInput = this.shadowRoot.getElementById('res-height');
        if (widthInput) widthInput.value = w;
        if (heightInput) heightInput.value = h;
      });
    });

    // Clear button
    this.shadowRoot.getElementById('clear-btn')?.addEventListener('click', () => {
      this._clearCanvas();
    });

    // Import button
    this.shadowRoot.getElementById('import-btn')?.addEventListener('click', () => {
      this.shadowRoot.getElementById('file-input')?.click();
    });

    // File input handler
    this.shadowRoot.getElementById('file-input')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this._handleImport(file);
    });

    // Send button
    this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => {
      this._sendToDevice();
    });
  }

  _updatePaletteSelection() {
    this.shadowRoot.querySelectorAll('.color-swatch').forEach(swatch => {
      if (swatch.dataset.color.toLowerCase() === this._currentColor.toLowerCase()) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });
  }

  _resizeCanvas(w, h) {
    // Save current content
    const oldData = this._ctx.getImageData(0, 0, this._width, this._height);

    this._width = w;
    this._height = h;
    this._logicalCanvas.width = w;
    this._logicalCanvas.height = h;

    // Restore content (will be clipped if smaller)
    this._ctx.putImageData(oldData, 0, 0);

    this._updateDisplaySize();
    this._renderDisplay();

    // Update info row
    const infoRow = this.shadowRoot.querySelector('.info-row span:first-child');
    if (infoRow) {
      infoRow.textContent = `Tool: ${this._tool} | Grid: ${this._gridOn ? 'LED' : 'Flat'}`;
    }
  }

  _clearCanvas() {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._renderDisplay();
  }

  _handleImport(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Scale image to canvas size
        this._ctx.clearRect(0, 0, this._width, this._height);
        this._ctx.imageSmoothingEnabled = false;
        this._ctx.drawImage(img, 0, 0, this._width, this._height);
        this._renderDisplay();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async _sendToDevice() {
    if (this._sending) return;

    this._sending = true;
    this.render();

    try {
      const imgData = this._ctx.getImageData(0, 0, this._width, this._height).data;
      const pixels = [];

      for (let y = 0; y < this._height; y++) {
        for (let x = 0; x < this._width; x++) {
          const idx = (y * this._width + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          // Only send non-transparent pixels
          if (a > 0) {
            pixels.push({
              x,
              y,
              color: this._rgbToHex(r, g, b)
            });
          }
        }
      }

      if (pixels.length > 0) {
        // Call set_pixels service
        await this.callService('ipixel_color', 'set_pixels', {
          pixels
        });
      }
    } catch (err) {
      console.error('Failed to send pixels to device:', err);
    } finally {
      this._sending = false;
      this.render();
    }
  }

  _rgbToHex(r, g, b) {
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  static getConfigElement() {
    return document.createElement('ipixel-simple-editor');
  }

  static getStubConfig() {
    return { entity: '' };
  }

  getCardSize() {
    return 4;
  }
}
