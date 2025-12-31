/**
 * LED Matrix Renderer
 * Uses discrete pixel stepping like a real LED display
 */

/**
 * LED Matrix Renderer class - manages animation with requestAnimationFrame
 */
export class LEDMatrixRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 64;
    this.height = options.height || 16;
    this.pixelGap = options.pixelGap || 1;
    this.pixels = [];
    this.extendedPixels = []; // For scrolling content wider than display
    this.extendedWidth = this.width;
    this.offset = 0;
    this.effect = 'fixed';
    this.speed = 50;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.effectState = {}; // For blink/snow/etc state
  }

  /**
   * Set the pixel data
   * @param {string[]} pixels - Array of color values (width * height)
   * @param {string[]} extendedPixels - Optional extended array for scrolling
   * @param {number} extendedWidth - Width of extended content
   */
  setData(pixels, extendedPixels = null, extendedWidth = null) {
    this.pixels = pixels;
    if (extendedPixels) {
      this.extendedPixels = extendedPixels;
      this.extendedWidth = extendedWidth || this.width;
    } else {
      this.extendedPixels = pixels;
      this.extendedWidth = this.width;
    }
  }

  /**
   * Set animation effect and speed
   */
  setEffect(effect, speed = 50) {
    this.effect = effect;
    this.speed = speed;
    this.offset = 0;
    this.effectState = {};

    // Initialize effect state
    if (effect === 'snow' || effect === 'breeze') {
      // Random phase for each pixel
      this.effectState.phases = [];
      for (let i = 0; i < this.width * this.height; i++) {
        this.effectState.phases[i] = Math.random() * Math.PI * 2;
      }
    }
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.animationId) return;
    this.lastFrameTime = performance.now();
    this.animate();
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
   * Animation loop using requestAnimationFrame
   */
  animate() {
    const now = performance.now();

    // Calculate frame interval based on speed (1 = slow, 100 = fast)
    // Speed 1 = 500ms per frame, Speed 100 = 30ms per frame
    const frameInterval = 500 - (this.speed - 1) * 4.7; // ~500ms to ~30ms

    if (now - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = now;
      this.step();
    }

    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Advance animation by one step
   */
  step() {
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
    }
  }

  /**
   * Get the visible pixel color at display position (x, y)
   */
  getPixelAt(x, y) {
    let sourceX = x;

    // Apply scroll offset
    if (this.effect === 'scroll_ltr' || this.effect === 'scroll_rtl') {
      sourceX = x - this.offset;
      // Wrap around
      while (sourceX < 0) sourceX += this.extendedWidth;
      while (sourceX >= this.extendedWidth) sourceX -= this.extendedWidth;

      // Get from extended pixels
      if (sourceX >= 0 && sourceX < this.extendedWidth) {
        return this.extendedPixels[y * this.extendedWidth + sourceX] || '#111';
      }
      return '#111';
    }

    // Non-scrolling: get from regular pixels
    return this.pixels[y * this.width + x] || '#111';
  }

  /**
   * Apply effect modifiers to a pixel color
   */
  applyEffect(color, x, y) {
    const isLit = color !== '#111' && color !== '#000' && color !== '#1a1a1a' && color !== '#050505';
    if (!isLit) return { color, opacity: 1, glow: false };

    let opacity = 1;
    let glow = true;

    if (this.effect === 'blink') {
      opacity = this.effectState.visible ? 1 : 0;
    } else if (this.effect === 'snow') {
      const phase = this.effectState.phases?.[y * this.width + x] || 0;
      const tick = this.effectState.tick || 0;
      opacity = 0.3 + 0.7 * Math.abs(Math.sin(phase + tick * 0.3));
    } else if (this.effect === 'breeze') {
      const phase = this.effectState.phases?.[y * this.width + x] || 0;
      const tick = this.effectState.tick || 0;
      opacity = 0.4 + 0.6 * Math.abs(Math.sin(phase + tick * 0.15 + x * 0.2));
    } else if (this.effect === 'laser') {
      const tick = this.effectState.tick || 0;
      const wave = (tick + x) % this.width;
      opacity = wave < 3 ? 1 : 0.3;
    }

    return { color, opacity, glow };
  }

  /**
   * Render the current frame to SVG
   */
  render() {
    const svgWidth = 100;
    const pxWidth = svgWidth / this.width;
    const pxHeight = pxWidth;
    const svgHeight = this.height * pxHeight;
    const gap = this.pixelGap * 0.1;

    let rects = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const baseColor = this.getPixelAt(x, y);
        const { color, opacity, glow } = this.applyEffect(baseColor, x, y);

        const style = glow && opacity > 0.5
          ? `opacity:${opacity};filter:drop-shadow(0 0 2px ${color});`
          : `opacity:${opacity};`;

        rects += `<rect x="${x * pxWidth}" y="${y * pxHeight}" width="${pxWidth - gap}" height="${pxHeight - gap}" fill="${color}" rx="0.3" style="${style}"/>`;
      }
    }

    this.container.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
        ${rects}
      </svg>`;
  }

  /**
   * Render a single static frame (no animation)
   */
  renderStatic() {
    this.render();
  }
}

/**
 * Create static SVG (for non-animated display or initial render)
 */
export function createPixelSvg(width, height, pixels, pixelGap = 1, effect = 'fixed', speed = 50) {
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
