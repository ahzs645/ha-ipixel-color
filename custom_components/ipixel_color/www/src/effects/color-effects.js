/**
 * Color Effects Module
 * Effects that modify the colors of displayed text
 */

/**
 * Convert HSV to RGB
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
 * Color Effects class - effects that modify pixel colors
 */
export class ColorEffects {
  constructor(renderer) {
    this.renderer = renderer;
  }

  /**
   * Initialize effect state
   */
  init(effectName, state) {
    switch (effectName) {
      case 'color_cycle':
        state.hue = 0;
        break;

      case 'rainbow_text':
        state.offset = 0;
        break;

      case 'neon':
        state.glowIntensity = 0;
        state.direction = 1;
        state.baseColor = state.fgColor || '#ff00ff'; // Default neon pink
        break;
    }
  }

  /**
   * Step effect forward
   */
  step(effectName, state) {
    switch (effectName) {
      case 'color_cycle':
        state.hue = (state.hue + 0.01) % 1;
        break;

      case 'rainbow_text':
        state.offset = (state.offset + 0.02) % 1;
        break;

      case 'neon':
        state.glowIntensity += state.direction * 0.05;
        if (state.glowIntensity >= 1) {
          state.glowIntensity = 1;
          state.direction = -1;
        } else if (state.glowIntensity <= 0.3) {
          state.glowIntensity = 0.3;
          state.direction = 1;
        }
        break;
    }
  }

  /**
   * Render effect to buffer
   */
  render(effectName, state, pixels) {
    const { width, height } = this.renderer;
    const displayPixels = pixels || [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = displayPixels[y * width + x] || '#111';
        let [r, g, b] = this._hexToRgb(color);
        const isLit = r > 20 || g > 20 || b > 20;

        if (isLit) {
          switch (effectName) {
            case 'color_cycle': {
              // Cycle all lit pixels through the same color
              const [nr, ng, nb] = hsvToRgb(state.hue, 1, 0.8);
              // Preserve brightness ratio
              const brightness = (r + g + b) / (3 * 255);
              r = nr * brightness;
              g = ng * brightness;
              b = nb * brightness;
              break;
            }

            case 'rainbow_text': {
              // Rainbow gradient across the text
              const hue = (state.offset + x / width) % 1;
              const [nr, ng, nb] = hsvToRgb(hue, 1, 0.8);
              // Preserve brightness ratio
              const brightness = (r + g + b) / (3 * 255);
              r = nr * brightness;
              g = ng * brightness;
              b = nb * brightness;
              break;
            }

            case 'neon': {
              // Pulsing neon glow effect
              const baseColor = this._hexToRgb(state.baseColor || '#ff00ff');
              const intensity = state.glowIntensity || 0.5;

              // Core color with pulsing intensity
              r = baseColor[0] * intensity;
              g = baseColor[1] * intensity;
              b = baseColor[2] * intensity;

              // Add white highlight at peak glow
              if (intensity > 0.8) {
                const whiteMix = (intensity - 0.8) * 5; // 0-1 range
                r = r + (255 - r) * whiteMix * 0.3;
                g = g + (255 - g) * whiteMix * 0.3;
                b = b + (255 - b) * whiteMix * 0.3;
              }
              break;
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
