/**
 * LED Matrix Renderer
 * Uses discrete pixel stepping like a real LED display
 * With modular effect system and state preservation
 */

import { EffectManager, EFFECTS } from './effects/index.js';

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
    this.prevBuffer = [];
    this._initBuffer();

    // Extended pixels for scrolling
    this._colorPixels = [];
    this._extendedColorPixels = [];
    this.extendedWidth = this.width;

    // Animation state
    this.effect = 'fixed';
    this.speed = 50;
    this.animationId = null;
    this.lastFrameTime = 0;
    this._isRunning = false;

    // SVG elements cache
    this.pixelElements = [];
    this.svgCreated = false;
    this._svg = null;

    // Effect manager
    this.effectManager = new EffectManager(this);
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

    // Only update container if it exists and is connected
    if (this.container && this.container.isConnected !== false) {
      this.container.innerHTML = '';
      this.container.appendChild(svg);
    }

    this._svg = svg;
    this.svgCreated = true;
  }

  /**
   * Ensure SVG is in the container (handles re-renders)
   */
  _ensureSvgInContainer() {
    if (!this.container) return false;

    // Check if our SVG is still in the container
    if (this._svg && this._svg.parentNode === this.container) {
      return true;
    }

    // SVG exists but not in container - re-attach it
    if (this._svg && this.container.isConnected !== false) {
      this.container.innerHTML = '';
      this.container.appendChild(this._svg);
      return true;
    }

    // Need to create new SVG
    return false;
  }

  /**
   * Set pixel in buffer (call flush() to update display)
   */
  setPixel(x, y, color) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const idx = y * this.width + x;
      if (idx < this.buffer.length) {
        this.buffer[idx] = color;
      }
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
    // Ensure SVG exists and is in container
    if (!this.svgCreated) {
      this._createSvg();
    } else if (!this._ensureSvgInContainer()) {
      this._createSvg();
    }

    for (let i = 0; i < this.buffer.length; i++) {
      const bufferItem = this.buffer[i];
      const prevItem = this.prevBuffer[i];

      // Skip if buffer item is invalid
      if (!bufferItem || !Array.isArray(bufferItem)) continue;
      if (!prevItem || !Array.isArray(prevItem)) {
        this.prevBuffer[i] = [-1, -1, -1];
        continue;
      }

      const [r, g, b] = bufferItem;
      const [pr, pg, pb] = prevItem;

      // Only update if changed
      if (r !== pr || g !== pg || b !== pb) {
        const rect = this.pixelElements[i];
        if (rect) {
          const isLit = r > 20 || g > 20 || b > 20;
          rect.setAttribute('fill', `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);

          // Add/remove glow effect
          if (isLit) {
            rect.style.filter = `drop-shadow(0 0 2px rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}))`;
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
    this._colorPixels = pixels || [];

    if (extendedPixels) {
      this._extendedColorPixels = extendedPixels;
      this.extendedWidth = extendedWidth || this.width;
    } else {
      this._extendedColorPixels = pixels || [];
      this.extendedWidth = this.width;
    }
  }

  /**
   * Set animation effect and speed
   */
  setEffect(effect, speed = 50) {
    const wasRunning = this._isRunning;

    // Only reinitialize if effect changed
    if (this.effect !== effect) {
      this.effect = effect;
      this.effectManager.initEffect(effect, { speed });
    }

    this.speed = speed;

    // Restart if was running
    if (wasRunning && effect !== 'fixed') {
      this.start();
    }
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this._isRunning) return;
    this._isRunning = true;
    this.lastFrameTime = performance.now();
    this._animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this._isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Check if animation is running
   */
  get isRunning() {
    return this._isRunning;
  }

  /**
   * Animation loop
   */
  _animate() {
    if (!this._isRunning) return;

    const now = performance.now();

    // Frame interval based on speed (1 = slow ~500ms, 100 = fast ~30ms)
    const frameInterval = 500 - (this.speed - 1) * 4.7;

    if (now - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = now;
      this.effectManager.step();
    }

    this._renderFrame();
    this.animationId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Render current frame to buffer and flush
   */
  _renderFrame() {
    this.effectManager.render(
      this._colorPixels,
      this._extendedColorPixels,
      this.extendedWidth
    );
    this.flush();
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
   * Update dimensions (recreates buffers if needed)
   */
  setDimensions(width, height) {
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.extendedWidth = width;
      this._initBuffer();
      this.svgCreated = false;

      // Reinitialize effect manager
      this.effectManager = new EffectManager(this);
      if (this.effect !== 'fixed') {
        this.effectManager.initEffect(this.effect, { speed: this.speed });
      }
    }
  }

  /**
   * Update container reference (for re-renders)
   */
  setContainer(container) {
    if (container !== this.container) {
      this.container = container;
      // Re-attach existing SVG or create new one
      if (this._svg && container) {
        container.innerHTML = '';
        container.appendChild(this._svg);
      }
    }
  }

  /**
   * Destroy renderer and clean up
   */
  destroy() {
    this.stop();
    this.pixelElements = [];
    this._svg = null;
    this.svgCreated = false;
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

// Export effects list for UI
export { EFFECTS, EffectManager };
