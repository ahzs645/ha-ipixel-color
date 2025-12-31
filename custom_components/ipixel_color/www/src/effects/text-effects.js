/**
 * Text Effects Module
 * Effects that modify how text is displayed on the LED matrix
 */

/**
 * Text Effects class - handles text-based visual effects
 */
export class TextEffects {
  constructor(renderer) {
    this.renderer = renderer;
  }

  /**
   * Initialize effect state
   */
  init(effectName, state) {
    const { width, height } = this.renderer;

    switch (effectName) {
      case 'scroll_ltr':
      case 'scroll_rtl':
        state.offset = 0;
        break;

      case 'blink':
        state.visible = true;
        break;

      case 'snow':
      case 'breeze':
        state.phases = [];
        for (let i = 0; i < width * height; i++) {
          state.phases[i] = Math.random() * Math.PI * 2;
        }
        break;

      case 'laser':
        state.position = 0;
        break;

      case 'fade':
        state.opacity = 0;
        state.direction = 1; // 1 = fading in, -1 = fading out
        break;

      case 'typewriter':
        state.charIndex = 0;
        state.cursorVisible = true;
        break;

      case 'bounce':
        state.offset = 0;
        state.direction = 1;
        break;

      case 'sparkle':
        state.sparkles = [];
        // Pre-generate sparkle positions
        for (let i = 0; i < Math.floor(width * height * 0.1); i++) {
          state.sparkles.push({
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            brightness: Math.random(),
            speed: 0.05 + Math.random() * 0.1
          });
        }
        break;
    }
  }

  /**
   * Step effect forward
   */
  step(effectName, state) {
    const { width, extendedWidth } = this.renderer;

    switch (effectName) {
      case 'scroll_ltr':
        state.offset -= 1;
        if (state.offset <= -(extendedWidth || width)) {
          state.offset = width;
        }
        break;

      case 'scroll_rtl':
        state.offset += 1;
        if (state.offset >= (extendedWidth || width)) {
          state.offset = -width;
        }
        break;

      case 'blink':
        state.visible = !state.visible;
        break;

      case 'laser':
        state.position = (state.position + 1) % width;
        break;

      case 'fade':
        state.opacity += state.direction * 0.05;
        if (state.opacity >= 1) {
          state.opacity = 1;
          state.direction = -1;
        } else if (state.opacity <= 0) {
          state.opacity = 0;
          state.direction = 1;
        }
        break;

      case 'typewriter':
        if (state.tick % 3 === 0) {
          state.charIndex++;
        }
        state.cursorVisible = state.tick % 10 < 5;
        break;

      case 'bounce':
        state.offset += state.direction;
        const maxOffset = Math.max(0, (extendedWidth || width) - width);
        if (state.offset >= maxOffset) {
          state.offset = maxOffset;
          state.direction = -1;
        } else if (state.offset <= 0) {
          state.offset = 0;
          state.direction = 1;
        }
        break;

      case 'sparkle':
        // Update sparkle brightnesses
        for (const sparkle of state.sparkles) {
          sparkle.brightness += sparkle.speed;
          if (sparkle.brightness > 1) {
            sparkle.brightness = 0;
            sparkle.x = Math.floor(Math.random() * width);
            sparkle.y = Math.floor(Math.random() * this.renderer.height);
          }
        }
        break;
    }
  }

  /**
   * Render effect to buffer
   */
  render(effectName, state, pixels, extendedPixels, extendedWidth) {
    const { width, height } = this.renderer;
    const srcPixels = extendedPixels || pixels || [];
    const displayPixels = pixels || [];
    const srcWidth = extendedWidth || width;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let color;
        let sourceX = x;

        // Get source pixel (with offset for scrolling effects)
        if (effectName === 'scroll_ltr' || effectName === 'scroll_rtl' || effectName === 'bounce') {
          sourceX = x - (state.offset || 0);
          while (sourceX < 0) sourceX += srcWidth;
          while (sourceX >= srcWidth) sourceX -= srcWidth;
          color = srcPixels[y * srcWidth + sourceX] || '#111';
        } else if (effectName === 'typewriter') {
          // Only show characters up to charIndex
          const charWidth = 6;
          const maxX = (state.charIndex || 0) * charWidth;
          if (x < maxX) {
            color = displayPixels[y * width + x] || '#111';
          } else if (x === maxX && state.cursorVisible) {
            color = '#ffffff'; // Cursor
          } else {
            color = '#111';
          }
        } else {
          color = displayPixels[y * width + x] || '#111';
        }

        // Convert to RGB
        let [r, g, b] = this._hexToRgb(color);
        const isLit = r > 20 || g > 20 || b > 20;

        // Apply effect modifiers
        if (isLit) {
          switch (effectName) {
            case 'blink':
              if (!state.visible) {
                r = g = b = 17;
              }
              break;

            case 'snow': {
              const phase = state.phases?.[y * width + x] || 0;
              const tick = state.tick || 0;
              const factor = 0.3 + 0.7 * Math.abs(Math.sin(phase + tick * 0.3));
              r *= factor;
              g *= factor;
              b *= factor;
              break;
            }

            case 'breeze': {
              const phase = state.phases?.[y * width + x] || 0;
              const tick = state.tick || 0;
              const factor = 0.4 + 0.6 * Math.abs(Math.sin(phase + tick * 0.15 + x * 0.2));
              r *= factor;
              g *= factor;
              b *= factor;
              break;
            }

            case 'laser': {
              const pos = state.position || 0;
              const dist = Math.abs(x - pos);
              const factor = dist < 3 ? 1 : 0.3;
              r *= factor;
              g *= factor;
              b *= factor;
              break;
            }

            case 'fade': {
              const opacity = state.opacity || 1;
              r *= opacity;
              g *= opacity;
              b *= opacity;
              break;
            }
          }
        }

        // Sparkle overlay (add sparkles on top of lit pixels)
        if (effectName === 'sparkle' && state.sparkles) {
          for (const sparkle of state.sparkles) {
            if (sparkle.x === x && sparkle.y === y) {
              const sparkleIntensity = Math.sin(sparkle.brightness * Math.PI);
              r = Math.min(255, r + sparkleIntensity * 200);
              g = Math.min(255, g + sparkleIntensity * 200);
              b = Math.min(255, b + sparkleIntensity * 200);
            }
          }
        }

        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  /**
   * Convert hex color to RGB array
   */
  _hexToRgb(hex) {
    if (!hex || hex === '#111' || hex === '#000') return [17, 17, 17];
    if (hex === '#050505') return [5, 5, 5];

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [17, 17, 17];
  }
}
