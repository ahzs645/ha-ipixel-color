/**
 * LED Matrix Renderer
 * Uses discrete pixel stepping like a real LED display
 * Inspired by infolab-lights: pre-create elements, update via setAttribute
 */

/**
 * Convert HSV to RGB
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} v - Value (0-1)
 * @returns {number[]} RGB array [0-255, 0-255, 0-255]
 */
function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return [r * 255, g * 255, b * 255];
}

/**
 * LED Matrix Renderer class
 * Pre-creates SVG rect elements and updates them efficiently
 */
export class LEDMatrixRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 64;
    this.height = options.height || 16;
    this.pixelGap = options.pixelGap || 0.1;

    // Double buffer: write here, then flush to DOM
    this.buffer = [];
    this.prevBuffer = []; // For dirty checking
    this._initBuffer();

    // Extended pixels for scrolling
    this.extendedPixels = [];
    this.extendedWidth = this.width;

    // Animation state
    this.offset = 0;
    this.effect = 'fixed';
    this.speed = 50;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.effectState = {};

    // SVG elements cache
    this.pixelElements = [];
    this.svgCreated = false;
  }

  _initBuffer() {
    this.buffer = [];
    this.prevBuffer = [];
    for (let i = 0; i < this.width * this.height; i++) {
      this.buffer.push([0, 0, 0]);
      this.prevBuffer.push([-1, -1, -1]); // Force initial update
    }
  }

  /**
   * Create the SVG with all pixel rect elements
   */
  _createSvg() {
    const svgWidth = 100;
    const pxWidth = svgWidth / this.width;
    const pxHeight = pxWidth;
    const svgHeight = this.height * pxHeight;
    const gap = this.pixelGap;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';

    // Create all pixel rects
    this.pixelElements = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x * pxWidth);
        rect.setAttribute('y', y * pxHeight);
        rect.setAttribute('width', pxWidth - gap);
        rect.setAttribute('height', pxHeight - gap);
        rect.setAttribute('rx', '0.3');
        rect.setAttribute('fill', 'rgb(17, 17, 17)');
        svg.appendChild(rect);
        this.pixelElements.push(rect);
      }
    }

    this.container.innerHTML = '';
    this.container.appendChild(svg);
    this.svgCreated = true;
  }

  /**
   * Set pixel in buffer (call flush() to update display)
   */
  setPixel(x, y, color) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const idx = y * this.width + x;
      this.buffer[idx] = color;
    }
  }

  /**
   * Clear buffer to black
   */
  clear() {
    for (let i = 0; i < this.buffer.length; i++) {
      this.buffer[i] = [0, 0, 0];
    }
  }

  /**
   * Flush buffer to display (only updates changed pixels)
   */
  flush() {
    if (!this.svgCreated) {
      this._createSvg();
    }

    for (let i = 0; i < this.buffer.length; i++) {
      const [r, g, b] = this.buffer[i];
      const [pr, pg, pb] = this.prevBuffer[i];

      // Only update if changed
      if (r !== pr || g !== pg || b !== pb) {
        const rect = this.pixelElements[i];
        if (rect) {
          const isLit = r > 20 || g > 20 || b > 20;
          rect.setAttribute('fill', `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);

          // Add/remove glow effect
          if (isLit) {
            rect.style.filter = `drop-shadow(0 0 2px rgb(${r}, ${g}, ${b}))`;
          } else {
            rect.style.filter = '';
          }
        }
        this.prevBuffer[i] = [r, g, b];
      }
    }
  }

  /**
   * Set pixel data from color string array
   */
  setData(pixels, extendedPixels = null, extendedWidth = null) {
    // Convert color strings to RGB arrays
    this._colorPixels = pixels;

    if (extendedPixels) {
      this._extendedColorPixels = extendedPixels;
      this.extendedWidth = extendedWidth || this.width;
    } else {
      this._extendedColorPixels = pixels;
      this.extendedWidth = this.width;
    }
  }

  /**
   * Parse hex color to RGB array
   */
  _hexToRgb(hex) {
    if (!hex || hex === '#111' || hex === '#000') return [17, 17, 17];
    if (hex === '#050505') return [5, 5, 5];

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [17, 17, 17];
  }

  /**
   * Set animation effect and speed
   */
  setEffect(effect, speed = 50) {
    this.effect = effect;
    this.speed = speed;
    this.offset = 0;
    this.effectState = {};

    if (effect === 'snow' || effect === 'breeze') {
      this.effectState.phases = [];
      for (let i = 0; i < this.width * this.height; i++) {
        this.effectState.phases[i] = Math.random() * Math.PI * 2;
      }
    }
    if (effect === 'blink') {
      this.effectState.visible = true;
    }

    // Rainbow effect
    if (effect === 'rainbow') {
      this.effectState.position = 0;
    }

    // Matrix rain effect
    if (effect === 'matrix') {
      // Choose random color mode
      const colorModes = [
        [0, 255, 0],    // Matrix green
        [0, 255, 255],  // Cyan
        [255, 0, 255],  // Purple
      ];
      this.effectState.colorMode = colorModes[Math.floor(Math.random() * colorModes.length)];
      // Create 2D buffer for rain trails
      this.effectState.buffer = [];
      for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let x = 0; x < this.width; x++) {
          row.push([0, 0, 0]);
        }
        this.effectState.buffer.push(row);
      }
    }

    // Plasma effect
    if (effect === 'plasma') {
      this.effectState.time = 0;
    }

    // Gradient effect
    if (effect === 'gradient') {
      this.effectState.time = 0;
    }
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.animationId) return;
    this.lastFrameTime = performance.now();
    this._animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Animation loop
   */
  _animate() {
    const now = performance.now();

    // Frame interval based on speed (1 = slow ~500ms, 100 = fast ~30ms)
    const frameInterval = 500 - (this.speed - 1) * 4.7;

    if (now - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = now;
      this._step();
    }

    this._renderFrame();
    this.animationId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Advance animation by one discrete step
   */
  _step() {
    if (this.effect === 'scroll_ltr') {
      this.offset -= 1;
      if (this.offset <= -this.extendedWidth) {
        this.offset = this.width;
      }
    } else if (this.effect === 'scroll_rtl') {
      this.offset += 1;
      if (this.offset >= this.extendedWidth) {
        this.offset = -this.width;
      }
    } else if (this.effect === 'blink') {
      this.effectState.visible = !this.effectState.visible;
    } else if (this.effect === 'snow' || this.effect === 'breeze' || this.effect === 'laser') {
      this.effectState.tick = (this.effectState.tick || 0) + 1;
    } else if (this.effect === 'rainbow') {
      this.effectState.position = (this.effectState.position + 0.01) % 1;
    } else if (this.effect === 'matrix') {
      this._stepMatrix();
    } else if (this.effect === 'plasma' || this.effect === 'gradient') {
      this.effectState.time = (this.effectState.time || 0) + 0.05;
    }
  }

  /**
   * Matrix rain step - shift rows down and add new drops
   */
  _stepMatrix() {
    const buffer = this.effectState.buffer;
    const colorMode = this.effectState.colorMode;
    const fadeAmount = 0.15;

    // Shift rows down (remove bottom, duplicate faded top)
    buffer.pop();
    const newRow = buffer[0].map(([r, g, b]) => [
      r * (1 - fadeAmount),
      g * (1 - fadeAmount),
      b * (1 - fadeAmount)
    ]);
    buffer.unshift(JSON.parse(JSON.stringify(newRow)));

    // Randomly place new drops in top row
    for (let x = 0; x < this.width; x++) {
      if (Math.random() < 0.08) {
        buffer[0][x] = [
          Math.floor(Math.random() * colorMode[0]),
          Math.floor(Math.random() * colorMode[1]),
          Math.floor(Math.random() * colorMode[2])
        ];
      }
    }
  }

  /**
   * Render current frame to buffer and flush
   */
  _renderFrame() {
    // Standalone effects (ignore text data)
    if (this.effect === 'rainbow') {
      this._renderRainbow();
      this.flush();
      return;
    }
    if (this.effect === 'matrix') {
      this._renderMatrix();
      this.flush();
      return;
    }
    if (this.effect === 'plasma') {
      this._renderPlasma();
      this.flush();
      return;
    }
    if (this.effect === 'gradient') {
      this._renderGradient();
      this.flush();
      return;
    }

    // Text-based effects
    const extPixels = this._extendedColorPixels || this._colorPixels || [];
    const pixels = this._colorPixels || [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let color;

        // Get source pixel based on scroll offset
        if (this.effect === 'scroll_ltr' || this.effect === 'scroll_rtl') {
          let sourceX = x - this.offset;
          while (sourceX < 0) sourceX += this.extendedWidth;
          while (sourceX >= this.extendedWidth) sourceX -= this.extendedWidth;
          color = extPixels[y * this.extendedWidth + sourceX] || '#111';
        } else {
          color = pixels[y * this.width + x] || '#111';
        }

        // Convert to RGB
        let [r, g, b] = this._hexToRgb(color);

        // Apply effect modifiers
        const isLit = r > 20 || g > 20 || b > 20;
        if (isLit) {
          if (this.effect === 'blink') {
            if (!this.effectState.visible) {
              r = g = b = 17;
            }
          } else if (this.effect === 'snow') {
            const phase = this.effectState.phases?.[y * this.width + x] || 0;
            const tick = this.effectState.tick || 0;
            const factor = 0.3 + 0.7 * Math.abs(Math.sin(phase + tick * 0.3));
            r *= factor; g *= factor; b *= factor;
          } else if (this.effect === 'breeze') {
            const phase = this.effectState.phases?.[y * this.width + x] || 0;
            const tick = this.effectState.tick || 0;
            const factor = 0.4 + 0.6 * Math.abs(Math.sin(phase + tick * 0.15 + x * 0.2));
            r *= factor; g *= factor; b *= factor;
          } else if (this.effect === 'laser') {
            const tick = this.effectState.tick || 0;
            const wave = (tick + x) % this.width;
            const factor = wave < 3 ? 1 : 0.3;
            r *= factor; g *= factor; b *= factor;
          }
        }

        this.setPixel(x, y, [r, g, b]);
      }
    }

    this.flush();
  }

  /**
   * Render rainbow effect - HSV gradient scrolling horizontally
   */
  _renderRainbow() {
    const position = this.effectState.position || 0;
    for (let x = 0; x < this.width; x++) {
      const hue = (position + x / this.width) % 1;
      const [r, g, b] = hsvToRgb(hue, 1, 0.6);
      for (let y = 0; y < this.height; y++) {
        this.setPixel(x, y, [r, g, b]);
      }
    }
  }

  /**
   * Render matrix rain effect - digital rain with fade trails
   */
  _renderMatrix() {
    const buffer = this.effectState.buffer;
    if (!buffer) return;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const [r, g, b] = buffer[y][x];
        this.setPixel(x, y, [r, g, b]);
      }
    }
  }

  /**
   * Render plasma effect - classic demoscene sine wave patterns
   */
  _renderPlasma() {
    const time = this.effectState.time || 0;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        // Distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Multiple sine waves combined
        const v1 = Math.sin(x / 8 + time);
        const v2 = Math.sin(y / 6 + time * 0.8);
        const v3 = Math.sin(dist / 6 - time * 1.2);
        const v4 = Math.sin((x + y) / 10 + time * 0.5);

        // Combine and normalize to 0-1
        const value = (v1 + v2 + v3 + v4 + 4) / 8;

        // Color cycling
        const r = Math.sin(value * Math.PI * 2) * 0.5 + 0.5;
        const g = Math.sin(value * Math.PI * 2 + 2) * 0.5 + 0.5;
        const b = Math.sin(value * Math.PI * 2 + 4) * 0.5 + 0.5;

        this.setPixel(x, y, [r * 255, g * 255, b * 255]);
      }
    }
  }

  /**
   * Render gradient effect - simple moving color gradients
   */
  _renderGradient() {
    const time = this.effectState.time || 0;
    const t = time * 10;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const r = (Math.sin((x + t) * 0.05) * 0.5 + 0.5) * 255;
        const g = (Math.cos((y + t) * 0.05) * 0.5 + 0.5) * 255;
        const b = (Math.sin((x + y + t) * 0.03) * 0.5 + 0.5) * 255;

        this.setPixel(x, y, [r, g, b]);
      }
    }
  }

  /**
   * Render a single static frame
   */
  renderStatic() {
    if (!this.svgCreated) {
      this._createSvg();
    }
    this._renderFrame();
  }

  /**
   * Update dimensions (recreates SVG)
   */
  setDimensions(width, height) {
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this._initBuffer();
      this.svgCreated = false;
    }
  }
}

/**
 * Create static SVG (for simple non-animated display)
 */
export function createPixelSvg(width, height, pixels, pixelGap = 1) {
  const svgWidth = 100;
  const pxWidth = svgWidth / width;
  const pxHeight = pxWidth;
  const svgHeight = height * pxHeight;
  const gap = pixelGap * 0.1;

  let rects = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y * width + x] || '#111';
      const isLit = color !== '#111' && color !== '#000' && color !== '#1a1a1a' && color !== '#050505';
      const style = isLit ? `filter:drop-shadow(0 0 2px ${color});` : '';

      rects += `<rect x="${x * pxWidth}" y="${y * pxHeight}" width="${pxWidth - gap}" height="${pxHeight - gap}" fill="${color}" rx="0.3" style="${style}"/>`;
    }
  }

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
      ${rects}
    </svg>`;
}
