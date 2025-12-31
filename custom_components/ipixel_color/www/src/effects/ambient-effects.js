/**
 * Ambient Effects Module
 * Standalone visual effects that don't depend on text content
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
 * Ambient Effects class - standalone visual effects
 */
export class AmbientEffects {
  constructor(renderer) {
    this.renderer = renderer;
  }

  /**
   * Initialize effect state
   */
  init(effectName, state) {
    const { width, height } = this.renderer;

    switch (effectName) {
      case 'rainbow':
        state.position = 0;
        break;

      case 'matrix':
        // Random color mode
        const colorModes = [
          [0, 255, 0],    // Matrix green
          [0, 255, 255],  // Cyan
          [255, 0, 255],  // Purple
        ];
        state.colorMode = colorModes[Math.floor(Math.random() * colorModes.length)];
        // Create 2D buffer for rain trails
        state.buffer = [];
        for (let y = 0; y < height; y++) {
          state.buffer.push(Array(width).fill(null).map(() => [0, 0, 0]));
        }
        break;

      case 'plasma':
        state.time = 0;
        break;

      case 'gradient':
        state.time = 0;
        break;

      case 'fire':
        // Fire simulation buffer (heat values 0-255)
        state.heat = [];
        for (let i = 0; i < width * height; i++) {
          state.heat[i] = 0;
        }
        // Fire palette (black -> red -> yellow -> white)
        state.palette = this._createFirePalette();
        break;

      case 'water':
        // Ripple simulation
        state.current = [];
        state.previous = [];
        for (let i = 0; i < width * height; i++) {
          state.current[i] = 0;
          state.previous[i] = 0;
        }
        state.damping = 0.95;
        break;

      case 'stars':
        // Star positions and brightnesses
        state.stars = [];
        const numStars = Math.floor(width * height * 0.15);
        for (let i = 0; i < numStars; i++) {
          state.stars.push({
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            brightness: Math.random(),
            speed: 0.02 + Math.random() * 0.05,
            phase: Math.random() * Math.PI * 2
          });
        }
        break;

      case 'confetti':
        // Falling particles
        state.particles = [];
        for (let i = 0; i < 20; i++) {
          state.particles.push(this._createConfettiParticle(width, height, true));
        }
        break;
    }
  }

  /**
   * Step effect forward
   */
  step(effectName, state) {
    const { width, height } = this.renderer;

    switch (effectName) {
      case 'rainbow':
        state.position = (state.position + 0.01) % 1;
        break;

      case 'matrix':
        this._stepMatrix(state, width, height);
        break;

      case 'plasma':
      case 'gradient':
        state.time = (state.time || 0) + 0.05;
        break;

      case 'fire':
        this._stepFire(state, width, height);
        break;

      case 'water':
        this._stepWater(state, width, height);
        break;

      case 'stars':
        // Twinkle stars
        for (const star of state.stars) {
          star.phase += star.speed;
        }
        break;

      case 'confetti':
        // Update particles
        for (let i = 0; i < state.particles.length; i++) {
          const p = state.particles[i];
          p.y += p.speed;
          p.x += p.drift;
          p.rotation += p.rotationSpeed;

          // Reset if off screen
          if (p.y > height) {
            state.particles[i] = this._createConfettiParticle(width, height, false);
          }
        }
        break;
    }
  }

  /**
   * Render effect to buffer
   */
  render(effectName, state) {
    switch (effectName) {
      case 'rainbow':
        this._renderRainbow(state);
        break;
      case 'matrix':
        this._renderMatrix(state);
        break;
      case 'plasma':
        this._renderPlasma(state);
        break;
      case 'gradient':
        this._renderGradient(state);
        break;
      case 'fire':
        this._renderFire(state);
        break;
      case 'water':
        this._renderWater(state);
        break;
      case 'stars':
        this._renderStars(state);
        break;
      case 'confetti':
        this._renderConfetti(state);
        break;
    }
  }

  // === Effect implementations ===

  _renderRainbow(state) {
    const { width, height } = this.renderer;
    const position = state.position || 0;

    for (let x = 0; x < width; x++) {
      const hue = (position + x / width) % 1;
      const [r, g, b] = hsvToRgb(hue, 1, 0.6);
      for (let y = 0; y < height; y++) {
        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  _stepMatrix(state, width, height) {
    const buffer = state.buffer;
    const colorMode = state.colorMode;
    const fadeAmount = 0.15;

    // Shift rows down
    buffer.pop();
    const newRow = buffer[0].map(([r, g, b]) => [
      r * (1 - fadeAmount),
      g * (1 - fadeAmount),
      b * (1 - fadeAmount)
    ]);
    buffer.unshift(JSON.parse(JSON.stringify(newRow)));

    // Random new drops
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.08) {
        buffer[0][x] = [
          Math.floor(Math.random() * colorMode[0]),
          Math.floor(Math.random() * colorMode[1]),
          Math.floor(Math.random() * colorMode[2])
        ];
      }
    }
  }

  _renderMatrix(state) {
    const { width, height } = this.renderer;
    const buffer = state.buffer;
    if (!buffer) return;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b] = buffer[y]?.[x] || [0, 0, 0];
        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  _renderPlasma(state) {
    const { width, height } = this.renderer;
    const time = state.time || 0;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const v1 = Math.sin(x / 8 + time);
        const v2 = Math.sin(y / 6 + time * 0.8);
        const v3 = Math.sin(dist / 6 - time * 1.2);
        const v4 = Math.sin((x + y) / 10 + time * 0.5);

        const value = (v1 + v2 + v3 + v4 + 4) / 8;

        const r = Math.sin(value * Math.PI * 2) * 0.5 + 0.5;
        const g = Math.sin(value * Math.PI * 2 + 2) * 0.5 + 0.5;
        const b = Math.sin(value * Math.PI * 2 + 4) * 0.5 + 0.5;

        this.renderer.setPixel(x, y, [r * 255, g * 255, b * 255]);
      }
    }
  }

  _renderGradient(state) {
    const { width, height } = this.renderer;
    const time = state.time || 0;
    const t = time * 10;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const r = (Math.sin((x + t) * 0.05) * 0.5 + 0.5) * 255;
        const g = (Math.cos((y + t) * 0.05) * 0.5 + 0.5) * 255;
        const b = (Math.sin((x + y + t) * 0.03) * 0.5 + 0.5) * 255;

        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  _createFirePalette() {
    const palette = [];
    for (let i = 0; i < 256; i++) {
      let r, g, b;
      if (i < 64) {
        r = i * 4;
        g = 0;
        b = 0;
      } else if (i < 128) {
        r = 255;
        g = (i - 64) * 4;
        b = 0;
      } else if (i < 192) {
        r = 255;
        g = 255;
        b = (i - 128) * 4;
      } else {
        r = 255;
        g = 255;
        b = 255;
      }
      palette.push([r, g, b]);
    }
    return palette;
  }

  _stepFire(state, width, height) {
    const heat = state.heat;

    // Cool down
    for (let i = 0; i < width * height; i++) {
      heat[i] = Math.max(0, heat[i] - Math.random() * 10);
    }

    // Heat rises (diffuse upward)
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const below = (y + 1) * width + x;
        const left = y * width + Math.max(0, x - 1);
        const right = y * width + Math.min(width - 1, x + 1);

        heat[idx] = (heat[below] + heat[left] + heat[right]) / 3.05;
      }
    }

    // Ignite bottom row
    for (let x = 0; x < width; x++) {
      if (Math.random() < 0.6) {
        heat[(height - 1) * width + x] = 180 + Math.random() * 75;
      }
    }
  }

  _renderFire(state) {
    const { width, height } = this.renderer;
    const heat = state.heat;
    const palette = state.palette;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const h = Math.floor(Math.min(255, heat[idx]));
        const [r, g, b] = palette[h];
        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  _stepWater(state, width, height) {
    const { current, previous, damping } = state;

    // Swap buffers
    const temp = [...previous];
    for (let i = 0; i < current.length; i++) {
      previous[i] = current[i];
    }

    // Ripple propagation
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        current[idx] = (
          temp[(y - 1) * width + x] +
          temp[(y + 1) * width + x] +
          temp[y * width + (x - 1)] +
          temp[y * width + (x + 1)]
        ) / 2 - current[idx];
        current[idx] *= damping;
      }
    }

    // Random drops
    if (Math.random() < 0.1) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      current[y * width + x] = 255;
    }
  }

  _renderWater(state) {
    const { width, height } = this.renderer;
    const current = state.current;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const value = Math.abs(current[idx]);
        const intensity = Math.min(255, value * 2);

        // Blue water with white highlights
        const r = intensity > 200 ? intensity : 0;
        const g = intensity > 150 ? intensity * 0.8 : intensity * 0.3;
        const b = Math.min(255, 50 + intensity);

        this.renderer.setPixel(x, y, [r, g, b]);
      }
    }
  }

  _renderStars(state) {
    const { width, height } = this.renderer;

    // Clear to dark background
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.renderer.setPixel(x, y, [5, 5, 15]);
      }
    }

    // Draw twinkling stars
    for (const star of state.stars) {
      const brightness = (Math.sin(star.phase) * 0.5 + 0.5) * 255;
      const x = Math.floor(star.x);
      const y = Math.floor(star.y);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        this.renderer.setPixel(x, y, [brightness, brightness, brightness * 0.9]);
      }
    }
  }

  _createConfettiParticle(width, height, randomY) {
    const colors = [
      [255, 0, 0],    // Red
      [0, 255, 0],    // Green
      [0, 0, 255],    // Blue
      [255, 255, 0],  // Yellow
      [255, 0, 255],  // Magenta
      [0, 255, 255],  // Cyan
      [255, 128, 0],  // Orange
      [255, 192, 203] // Pink
    ];

    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -2,
      speed: 0.2 + Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1 + Math.random(),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    };
  }

  _renderConfetti(state) {
    const { width, height } = this.renderer;

    // Clear to dark background
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.renderer.setPixel(x, y, [10, 10, 10]);
      }
    }

    // Draw particles
    for (const p of state.particles) {
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);

      // Draw particle (simple 1-2 pixel representation)
      if (x >= 0 && x < width && y >= 0 && y < height) {
        this.renderer.setPixel(x, y, p.color);
        // Add shimmer based on rotation
        const shimmer = Math.abs(Math.sin(p.rotation)) * 0.5 + 0.5;
        const [r, g, b] = p.color;
        this.renderer.setPixel(x, y, [r * shimmer, g * shimmer, b * shimmer]);
      }
    }
  }
}
