/**
 * Effects System - Main entry point
 * Modular effect management for LED matrix displays
 */

import { TextEffects } from './text-effects.js';
import { AmbientEffects } from './ambient-effects.js';
import { ColorEffects } from './color-effects.js';

// Effect categories
export const EFFECT_CATEGORIES = {
  TEXT: 'text',      // Effects that modify displayed text
  AMBIENT: 'ambient', // Standalone visual effects (ignore text)
  COLOR: 'color'     // Color modifications applied to text
};

// All available effects with metadata
export const EFFECTS = {
  // Text effects - modify how text is displayed
  fixed: { category: EFFECT_CATEGORIES.TEXT, name: 'Fixed', description: 'Static display' },
  scroll_ltr: { category: EFFECT_CATEGORIES.TEXT, name: 'Scroll Left', description: 'Text scrolls left to right' },
  scroll_rtl: { category: EFFECT_CATEGORIES.TEXT, name: 'Scroll Right', description: 'Text scrolls right to left' },
  blink: { category: EFFECT_CATEGORIES.TEXT, name: 'Blink', description: 'Text blinks on/off' },
  breeze: { category: EFFECT_CATEGORIES.TEXT, name: 'Breeze', description: 'Gentle wave brightness' },
  snow: { category: EFFECT_CATEGORIES.TEXT, name: 'Snow', description: 'Sparkle effect' },
  laser: { category: EFFECT_CATEGORIES.TEXT, name: 'Laser', description: 'Scanning beam' },
  fade: { category: EFFECT_CATEGORIES.TEXT, name: 'Fade', description: 'Fade in/out' },
  typewriter: { category: EFFECT_CATEGORIES.TEXT, name: 'Typewriter', description: 'Characters appear one by one' },
  bounce: { category: EFFECT_CATEGORIES.TEXT, name: 'Bounce', description: 'Text bounces back and forth' },
  sparkle: { category: EFFECT_CATEGORIES.TEXT, name: 'Sparkle', description: 'Random sparkle overlay' },

  // Ambient effects - standalone visual displays
  rainbow: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Rainbow', description: 'HSV rainbow gradient' },
  matrix: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Matrix', description: 'Digital rain effect' },
  plasma: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Plasma', description: 'Classic plasma waves' },
  gradient: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Gradient', description: 'Moving color gradients' },
  fire: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Fire', description: 'Fire/flame simulation' },
  water: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Water', description: 'Ripple/wave effect' },
  stars: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Stars', description: 'Twinkling starfield' },
  confetti: { category: EFFECT_CATEGORIES.AMBIENT, name: 'Confetti', description: 'Falling colored particles' },

  // Color effects - applied to text colors
  color_cycle: { category: EFFECT_CATEGORIES.COLOR, name: 'Color Cycle', description: 'Cycle through colors' },
  rainbow_text: { category: EFFECT_CATEGORIES.COLOR, name: 'Rainbow Text', description: 'Rainbow gradient on text' },
  neon: { category: EFFECT_CATEGORIES.COLOR, name: 'Neon', description: 'Pulsing neon glow' }
};

/**
 * Effect Manager - handles effect initialization and execution
 */
export class EffectManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.textEffects = new TextEffects(renderer);
    this.ambientEffects = new AmbientEffects(renderer);
    this.colorEffects = new ColorEffects(renderer);
    this.currentEffect = 'fixed';
    this.effectState = {};
  }

  /**
   * Get effect metadata
   */
  getEffectInfo(effectName) {
    return EFFECTS[effectName] || EFFECTS.fixed;
  }

  /**
   * Get all effects by category
   */
  getEffectsByCategory(category) {
    return Object.entries(EFFECTS)
      .filter(([_, info]) => info.category === category)
      .map(([name, info]) => ({ name, ...info }));
  }

  /**
   * Initialize an effect
   */
  initEffect(effectName, options = {}) {
    const info = this.getEffectInfo(effectName);
    this.currentEffect = effectName;
    this.effectState = { tick: 0, ...options };

    switch (info.category) {
      case EFFECT_CATEGORIES.TEXT:
        this.textEffects.init(effectName, this.effectState);
        break;
      case EFFECT_CATEGORIES.AMBIENT:
        this.ambientEffects.init(effectName, this.effectState);
        break;
      case EFFECT_CATEGORIES.COLOR:
        this.colorEffects.init(effectName, this.effectState);
        break;
    }

    return this.effectState;
  }

  /**
   * Step the effect forward (called on frame interval)
   */
  step() {
    const info = this.getEffectInfo(this.currentEffect);
    this.effectState.tick = (this.effectState.tick || 0) + 1;

    switch (info.category) {
      case EFFECT_CATEGORIES.TEXT:
        this.textEffects.step(this.currentEffect, this.effectState);
        break;
      case EFFECT_CATEGORIES.AMBIENT:
        this.ambientEffects.step(this.currentEffect, this.effectState);
        break;
      case EFFECT_CATEGORIES.COLOR:
        this.colorEffects.step(this.currentEffect, this.effectState);
        break;
    }
  }

  /**
   * Render the current frame
   */
  render(pixels, extendedPixels, extendedWidth) {
    const info = this.getEffectInfo(this.currentEffect);

    switch (info.category) {
      case EFFECT_CATEGORIES.AMBIENT:
        // Ambient effects render directly, ignoring text
        this.ambientEffects.render(this.currentEffect, this.effectState);
        break;
      case EFFECT_CATEGORIES.TEXT:
        // Text effects modify how pixels are displayed
        this.textEffects.render(this.currentEffect, this.effectState, pixels, extendedPixels, extendedWidth);
        break;
      case EFFECT_CATEGORIES.COLOR:
        // Color effects modify pixel colors
        this.colorEffects.render(this.currentEffect, this.effectState, pixels);
        break;
    }
  }

  /**
   * Check if effect is ambient (standalone, ignores text)
   */
  isAmbient(effectName) {
    return this.getEffectInfo(effectName).category === EFFECT_CATEGORIES.AMBIENT;
  }

  /**
   * Check if effect needs animation loop
   */
  needsAnimation(effectName) {
    return effectName !== 'fixed';
  }
}

// Export effect lists for UI
export const TEXT_EFFECTS = Object.entries(EFFECTS)
  .filter(([_, info]) => info.category === EFFECT_CATEGORIES.TEXT)
  .map(([name]) => name);

export const AMBIENT_EFFECTS = Object.entries(EFFECTS)
  .filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT)
  .map(([name]) => name);

export const COLOR_EFFECTS = Object.entries(EFFECTS)
  .filter(([_, info]) => info.category === EFFECT_CATEGORIES.COLOR)
  .map(([name]) => name);

export const ALL_EFFECTS = Object.keys(EFFECTS);
