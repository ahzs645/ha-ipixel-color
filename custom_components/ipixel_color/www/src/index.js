/**
 * iPIXEL Cards for Home Assistant
 * Entry point - imports all modules and registers custom elements
 */

import { CARD_VERSION } from './version.js';
import { iPIXELDisplayCard } from './cards/display-card.js';
import { iPIXELControlsCard } from './cards/controls-card.js';
import { iPIXELTextCard } from './cards/text-card.js';
import { iPIXELPlaylistCard } from './cards/playlist-card.js';
import { iPIXELScheduleCard } from './cards/schedule-card.js';
import { iPIXELEditorCard } from './cards/editor-card.js';
import { iPIXELGalleryCard } from './cards/gallery-card.js';
import { iPIXELSimpleEditor } from './editor.js';

// Initialize shared state
import './state.js';

// Register custom elements. The bundle can be loaded twice (for example as
// both a Lovelace resource and an extra module URL), and a second
// customElements.define() for the same name throws and aborts the module.
const registerCard = (name, clazz) => {
  if (!customElements.get(name)) customElements.define(name, clazz);
};
registerCard('ipixel-display-card', iPIXELDisplayCard);
registerCard('ipixel-controls-card', iPIXELControlsCard);
registerCard('ipixel-text-card', iPIXELTextCard);
registerCard('ipixel-playlist-card', iPIXELPlaylistCard);
registerCard('ipixel-schedule-card', iPIXELScheduleCard);
registerCard('ipixel-editor-card', iPIXELEditorCard);
registerCard('ipixel-gallery-card', iPIXELGalleryCard);
registerCard('ipixel-simple-editor', iPIXELSimpleEditor);

// Register with Home Assistant's custom card registry
window.customCards = window.customCards || [];
[
  { type: 'ipixel-display-card', name: 'iPIXEL Display', description: 'LED matrix preview with power control' },
  { type: 'ipixel-controls-card', name: 'iPIXEL Controls', description: 'Brightness, mode, and orientation controls' },
  { type: 'ipixel-text-card', name: 'iPIXEL Text', description: 'Text input with effects and colors' },
  { type: 'ipixel-playlist-card', name: 'iPIXEL Playlist', description: 'Playlist management' },
  { type: 'ipixel-schedule-card', name: 'iPIXEL Schedule', description: 'Power schedule and time slots' },
  { type: 'ipixel-editor-card', name: 'iPIXEL Pixel Editor', description: 'Draw custom pixel art and send to your LED matrix' },
  { type: 'ipixel-gallery-card', name: 'iPIXEL Gallery', description: 'Browse and send bundled animations to your LED matrix' },
].forEach(card => {
  if (window.customCards.some(c => c.type === card.type)) return;
  window.customCards.push({
    ...card,
    preview: true,
    documentationURL: 'https://github.com/cagcoach/ha-ipixel-color'
  });
});

// Log version
console.info(
  `%c iPIXEL Cards %c ${CARD_VERSION} `,
  'background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;',
  'background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;'
);
