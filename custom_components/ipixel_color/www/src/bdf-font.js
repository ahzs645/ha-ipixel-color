/**
 * BDF font renderer for LED matrix displays
 * Uses bdfparser-js for pixel-perfect bitmap font rendering
 *
 * This provides an alternative to Canvas-based TTF rendering,
 * offering exact pixel output without anti-aliasing threshold ambiguity.
 */

import { $Font, $fetchline } from '../lib/bdfparser.bundle.js';

// BDF font configuration - maps font names to files for each height
const BDF_FONT_CONFIG = {
  'VCR_OSD_MONO': {
    16: { file: 'VCR_OSD_MONO_16.bdf', yOffset: 0 },
    24: { file: 'VCR_OSD_MONO_24.bdf', yOffset: 0 },
    32: { file: 'VCR_OSD_MONO_32.bdf', yOffset: 2 }  // Match pypixelcolor offset
  },
  'CUSONG': {
    16: { file: 'CUSONG_16.bdf', yOffset: -1 },  // Match pypixelcolor offset
    24: { file: 'CUSONG_24.bdf', yOffset: 0 },
    32: { file: 'CUSONG_32.bdf', yOffset: 0 }
  }
};

// Font loading cache
const fontCache = new Map();
const fontLoadPromises = new Map();

/**
 * Get the base URL for BDF font files
 * Handles HACS, manual installation, and local preview paths
 */
function getBdfFontUrl(filename) {
  // Check if we're in local preview mode (not in Home Assistant)
  if (window.location.pathname.includes('preview.html') || window.location.port === '8080') {
    return `./fonts/${filename}`;
  }
  // Try HACS path (most common in Home Assistant)
  return `/hacsfiles/ipixel_color/fonts/${filename}`;
}

/**
 * Get closest height key for font metrics (16, 24, or 32)
 * @param {number} height - Display height in pixels
 * @returns {number} - Closest metrics key
 */
function getHeightKey(height) {
  if (height <= 18) return 16;
  if (height <= 28) return 24;
  return 32;
}

/**
 * Load a BDF font for a specific size
 * @param {string} fontName - Name of the font (VCR_OSD_MONO, CUSONG)
 * @param {number} heightKey - Height key (16, 24, or 32)
 * @returns {Promise<{font: Font, config: object}|null>}
 */
export async function loadBdfFont(fontName, heightKey = 16) {
  const cacheKey = `${fontName}_${heightKey}`;

  // Return cached font if available
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey);
  }

  // Return existing promise if loading in progress
  if (fontLoadPromises.has(cacheKey)) {
    return fontLoadPromises.get(cacheKey);
  }

  // Get font config
  const fontConfig = BDF_FONT_CONFIG[fontName];
  if (!fontConfig || !fontConfig[heightKey]) {
    console.warn(`iPIXEL BDF: No config for font ${fontName} at height ${heightKey}`);
    return null;
  }

  const config = fontConfig[heightKey];

  // Start loading
  const loadPromise = (async () => {
    try {
      const fontUrl = getBdfFontUrl(config.file);
      console.log(`iPIXEL BDF: Loading ${fontUrl}...`);

      const font = await $Font($fetchline(fontUrl));

      const result = { font, config };
      fontCache.set(cacheKey, result);
      console.log(`iPIXEL BDF: Font ${fontName} (${heightKey}px) loaded successfully`);
      return result;
    } catch (e) {
      console.warn(`iPIXEL BDF: Failed to load font ${fontName} (${heightKey}px):`, e);
      fontLoadPromises.delete(cacheKey);
      return null;
    }
  })();

  fontLoadPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

/**
 * Check if a BDF font is loaded
 * @param {string} fontName - Name of the font
 * @param {number} heightKey - Height key (16, 24, or 32)
 * @returns {boolean}
 */
export function isBdfFontLoaded(fontName, heightKey = 16) {
  const cacheKey = `${fontName}_${heightKey}`;
  return fontCache.has(cacheKey);
}

/**
 * Render text to pixels using BDF font
 * @param {string} text - Text to render
 * @param {number} width - Display width in pixels
 * @param {number} height - Display height in pixels
 * @param {string} fgColor - Foreground color (hex)
 * @param {string} bgColor - Background color (hex)
 * @param {string} fontName - Font name (VCR_OSD_MONO, CUSONG)
 * @returns {string[]|null} - Array of hex color strings, or null if font not available
 */
export function textToPixelsBdf(text, width, height, fgColor = '#ff6600', bgColor = '#111', fontName = 'VCR_OSD_MONO') {
  const heightKey = getHeightKey(height);
  const cacheKey = `${fontName}_${heightKey}`;
  const cached = fontCache.get(cacheKey);

  if (!cached) {
    // Trigger async load, return null for now
    loadBdfFont(fontName, heightKey);
    return null;
  }

  const { font, config } = cached;

  // Initialize pixel array with background color
  const pixels = new Array(width * height).fill(bgColor);

  // Handle empty text
  if (!text || text.trim() === '') {
    return pixels;
  }

  try {
    // Render text to bitmap using bdfparser
    // mode: 1 = use glyph bounding box (tight), direction: 'lrtb' = left-to-right, top-to-bottom
    const bitmap = font.draw(text, { direction: 'lrtb', mode: 1 });
    const bindata = bitmap.bindata;
    const textWidth = bitmap.width();
    const textHeight = bitmap.height();

    // Calculate centering offsets
    const xOffset = Math.floor((width - textWidth) / 2);
    const yOffset = Math.floor((height - textHeight) / 2) + (config.yOffset || 0);

    // Map bitmap to pixel array
    for (let row = 0; row < textHeight; row++) {
      const rowData = bindata[row] || '';
      for (let col = 0; col < rowData.length; col++) {
        const px = xOffset + col;
        const py = yOffset + row;

        // Check bounds
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = py * width + px;
          // '1' = foreground (lit pixel), '0' = background
          pixels[idx] = rowData[col] === '1' ? fgColor : bgColor;
        }
      }
    }
  } catch (e) {
    console.warn('iPIXEL BDF: Error rendering text:', e);
    return null;
  }

  return pixels;
}

/**
 * Render text for scrolling (extended width for seamless loop)
 * @param {string} text - Text to render
 * @param {number} displayWidth - Display width in pixels
 * @param {number} height - Display height in pixels
 * @param {string} fgColor - Foreground color (hex)
 * @param {string} bgColor - Background color (hex)
 * @param {string} fontName - Font name
 * @returns {{pixels: string[], width: number}|null}
 */
export function textToScrollPixelsBdf(text, displayWidth, height, fgColor = '#ff6600', bgColor = '#111', fontName = 'VCR_OSD_MONO') {
  const heightKey = getHeightKey(height);
  const cacheKey = `${fontName}_${heightKey}`;
  const cached = fontCache.get(cacheKey);

  if (!cached) {
    loadBdfFont(fontName, heightKey);
    return null;
  }

  const { font, config } = cached;

  // Handle empty text
  if (!text || text.trim() === '') {
    const extendedWidth = displayWidth * 3;
    const pixels = new Array(extendedWidth * height).fill(bgColor);
    return { pixels, width: extendedWidth };
  }

  try {
    // Render text to bitmap
    const bitmap = font.draw(text, { direction: 'lrtb', mode: 1 });
    const bindata = bitmap.bindata;
    const textWidth = bitmap.width();
    const textHeight = bitmap.height();

    // Extended width: display + text + display (for seamless scrolling)
    const extendedWidth = displayWidth + textWidth + displayWidth;
    const pixels = new Array(extendedWidth * height).fill(bgColor);

    // Place text starting after one display width of padding
    const xStart = displayWidth;
    const yOffset = Math.floor((height - textHeight) / 2) + (config.yOffset || 0);

    // Map bitmap to pixel array
    for (let row = 0; row < textHeight; row++) {
      const rowData = bindata[row] || '';
      for (let col = 0; col < rowData.length; col++) {
        const px = xStart + col;
        const py = yOffset + row;

        if (px >= 0 && px < extendedWidth && py >= 0 && py < height) {
          const idx = py * extendedWidth + px;
          pixels[idx] = rowData[col] === '1' ? fgColor : bgColor;
        }
      }
    }

    return { pixels, width: extendedWidth };
  } catch (e) {
    console.warn('iPIXEL BDF: Error rendering scroll text:', e);
    return null;
  }
}

/**
 * Preload all BDF fonts for common heights
 * @returns {Promise<void>}
 */
export async function preloadBdfFonts() {
  const fonts = Object.keys(BDF_FONT_CONFIG);
  const heights = [16, 24, 32];

  const promises = [];
  for (const fontName of fonts) {
    for (const height of heights) {
      if (BDF_FONT_CONFIG[fontName][height]) {
        promises.push(loadBdfFont(fontName, height));
      }
    }
  }

  await Promise.all(promises);
}

/**
 * Get list of available BDF fonts
 * @returns {string[]}
 */
export function getAvailableBdfFonts() {
  return Object.keys(BDF_FONT_CONFIG);
}

// Export config for debugging
export { BDF_FONT_CONFIG, getHeightKey };
