/**
 * Base class for all iPIXEL cards
 * Provides common functionality for entity management, service calls, etc.
 */

import { isTestMode } from './state.js';

export class iPIXELCardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;

    // Listen for test mode changes to re-render
    this._handleTestModeChange = () => this.render();
    window.addEventListener('ipixel-test-mode-change', this._handleTestModeChange);
  }

  disconnectedCallback() {
    window.removeEventListener('ipixel-test-mode-change', this._handleTestModeChange);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    // Allow empty entity in test mode
    if (!config.entity && !isTestMode()) {
      // Store config anyway - test mode may be activated later
      this._config = config;
      return;
    }
    this._config = config;
    this.render();
  }

  /**
   * Check if card is in test mode (no entity or explicitly enabled)
   */
  isInTestMode() {
    return isTestMode() || !this._config.entity || !this.getEntity();
  }

  getEntity() {
    if (!this._hass || !this._config.entity) return null;
    return this._hass.states[this._config.entity];
  }

  getRelatedEntity(domain, suffix = '') {
    if (!this._hass || !this._config.entity) return null;

    // Extract base name from config entity
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
      const sorted = matches.sort((a, b) => a.length - b.length);
      if (sorted.length > 0) return this._hass.states[sorted[0]];
    }

    return matches.length > 0 ? this._hass.states[matches[0]] : null;
  }

  async callService(domain, service, data = {}) {
    if (!this._hass) return;
    if (this.isInTestMode()) {
      console.info(`iPIXEL [Test Mode]: ${domain}.${service}`, data);
      return;
    }
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
    // In test mode, always report as "on" so preview works
    if (this.isInTestMode()) return true;
    return this.getRelatedEntity('switch')?.state === 'on';
  }

  hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 255, 255];
  }

  render() { /* Override in subclasses */ }
  getCardSize() { return 2; }
}
