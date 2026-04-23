/**
 * iPIXEL Gallery Card
 * Tabbed: Browse (bundled + user filters) / Upload (drop zone + slot options)
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';
import { createStorage } from '../state.js';
import {
  renderGridSelector, attachGridSelector,
  renderToggle, attachToggle,
  renderTabs, attachTabs, renderPanel,
} from '../components/index.js';
// Ensure playFrames is not tree-shaken - it's needed for GIF preview playback
import { LEDMatrixRenderer } from 'react-pixel-display/core';
const _keepPlayFrames = LEDMatrixRenderer.prototype.playFrames;

const isHA = typeof window !== 'undefined' && (
  typeof window.hassConnection !== 'undefined' ||
  document.querySelector('home-assistant') !== null
);
const GALLERY_BASE = isHA
  ? '/ipixel_color/gallery'
  : `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}gallery`;

const userGifsStore = createStorage('iPIXEL_UserGIFs', () => []);

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'upload', label: 'Upload' },
];

export class iPIXELGalleryCard extends iPIXELCardBase {
  constructor() {
    super();
    this._activeTab = 'browse';
    this._manifest = null;
    this._loading = false;
    this._selectedSize = null;
    this._filter = 'all';
    this._sending = null;
    this._slotMode = false;
    this._targetSlot = 1;
    this._dragOver = false;
  }

  connectedCallback() {
    this._loadManifest();
  }

  async _loadManifest() {
    if (this._manifest) return;
    this._loading = true;
    this.render();
    try {
      const resp = await fetch(`${GALLERY_BASE}/manifest.json`);
      this._manifest = await resp.json();
      this._autoSelectSize();
    } catch (err) {
      console.error('iPIXEL Gallery: Failed to load manifest', err);
      this._manifest = {};
    }
    this._loading = false;
    this.render();
  }

  _autoSelectSize() {
    if (!this._manifest) return;
    const [w, h] = this.getResolution();
    const sizeKey = `${w}x${h}`;
    if (this._manifest[sizeKey]) {
      this._selectedSize = sizeKey;
    } else {
      const sizes = Object.keys(this._manifest);
      this._selectedSize = sizes.length > 0 ? sizes[0] : null;
    }
  }

  _getSortedSizes() {
    if (!this._manifest) return [];
    return Object.keys(this._manifest).sort((a, b) => {
      const [aw, ah] = a.split('x').map(Number);
      const [bw, bh] = b.split('x').map(Number);
      return (ah - bh) || (aw - bw);
    });
  }

  _getItems() {
    const userGifs = userGifsStore.load();

    if (!this._manifest || !this._selectedSize) {
      return (this._filter === 'user' || this._filter === 'all')
        ? userGifs.map(g => ({ ...g, type: 'user' }))
        : [];
    }
    const data = this._manifest[this._selectedSize];
    const bundled = [];
    if (this._filter !== 'user') {
      if (this._filter === 'all' || this._filter === 'animations') {
        (data?.animations || []).forEach(a => bundled.push({ ...a, type: 'bundled' }));
      }
      if (this._filter === 'all' || this._filter === 'eyes') {
        (data?.eyes || []).forEach(e => bundled.push({ ...e, type: 'bundled' }));
      }
    }
    const users = (this._filter === 'all' || this._filter === 'user')
      ? userGifs.map(g => ({ ...g, type: 'user' }))
      : [];
    return [...users, ...bundled];
  }

  async _playGifOnPreview(url) {
    const displayCard = document.querySelector('ipixel-display-card');
    const renderer = displayCard?._renderer;
    if (!renderer) {
      console.warn('iPIXEL Gallery: No display renderer found for preview');
      return;
    }

    const MAX_FRAMES = 120;
    const w = renderer.width, h = renderer.height;

    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const { frames, avgDelay } = await this._decodeGifFrames(blob, w, h, MAX_FRAMES);

      renderer.stopFrames?.();
      renderer.stop();
      if (frames.length > 1 && renderer.playFrames) {
        renderer.playFrames(frames, Math.max(20, avgDelay));
      } else if (frames.length > 0) {
        renderer.setData(frames[0]);
        renderer.setEffect('fixed', 50);
        renderer.renderStatic();
      }
    } catch (err) {
      console.error('iPIXEL Gallery: GIF preview failed', err);
    }
  }

  async _decodeGifFrames(blob, w, h, maxFrames) {
    const frames = [];
    let avgDelay = 100;
    const toHex = (r, g, b, a) =>
      a < 128 ? '#000000' : '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');

    if (typeof ImageDecoder !== 'undefined') {
      const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type: 'image/gif' });
      await decoder.tracks.ready;
      const total = Math.min(decoder.tracks.selectedTrack.frameCount, maxFrames);
      const offCanvas = new OffscreenCanvas(w, h);
      const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

      for (let i = 0; i < total; i++) {
        const result = await decoder.decode({ frameIndex: i });
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(result.image, 0, 0, w, h);
        if (i === 0 && result.image.duration) avgDelay = result.image.duration / 1000;
        const d = ctx.getImageData(0, 0, w, h).data;
        const pixels = [];
        for (let p = 0; p < w * h; p++) pixels.push(toHex(d[p*4], d[p*4+1], d[p*4+2], d[p*4+3]));
        frames.push(pixels);
        result.image.close();
      }
      decoder.close();
    } else {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const pixels = [];
      for (let p = 0; p < w * h; p++) pixels.push(toHex(d[p*4], d[p*4+1], d[p*4+2], d[p*4+3]));
      frames.push(pixels);
      URL.revokeObjectURL(img.src);
    }
    return { frames, avgDelay };
  }

  async _sendToDevice(item) {
    this._sending = item.name || item.file;
    this.render();

    const previewUrl = item.type === 'user'
      ? item.dataUrl
      : `${GALLERY_BASE}/${this._selectedSize}/${item.file}`;

    if (item.type === 'user' || isHA) {
      this._playGifOnPreview(previewUrl);
    }

    try {
      if (item.type === 'user') {
        await this._sendUserGif(item);
      } else {
        const serviceData = { size: this._selectedSize, filename: item.file };
        if (this._slotMode) serviceData.buffer_slot = this._targetSlot;
        await this.callService('ipixel_color', 'display_local_gallery', serviceData);
      }
    } catch (err) {
      console.error('iPIXEL Gallery: Send failed', err);
    }

    this._sending = null;
    this.render();
  }

  async _sendUserGif(item) {
    const resp = await fetch(item.dataUrl);
    const blob = await resp.blob();

    if (window.iPIXEL_BLE && window.iPIXEL_BLE.isConnected()) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const slot = this._slotMode ? this._targetSlot : 1;
      await window.iPIXEL_BLE.saveGifToSlot(slot, bytes);
    } else {
      console.warn('iPIXEL Gallery: User GIF send requires BLE connection or HA backend support');
      const serviceData = { gif_url: item.dataUrl };
      if (this._slotMode) serviceData.buffer_slot = this._targetSlot;
      await this.callService('ipixel_color', 'upload_gif', serviceData);
    }
  }

  _handleFiles(files) {
    const gifs = userGifsStore.load();
    let pending = 0;
    let done = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      pending++;
      const reader = new FileReader();
      reader.onload = () => {
        const existing = gifs.findIndex(g => g.name === file.name);
        const entry = { name: file.name, dataUrl: reader.result, addedAt: Date.now() };
        if (existing >= 0) gifs[existing] = entry;
        else gifs.push(entry);
        if (++done === pending) {
          userGifsStore.save(gifs);
          this.render();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const active = this._activeTab;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .gallery-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px; margin-top: 12px;
        }
        .gallery-item {
          position: relative; background: #000;
          border: 2px solid rgba(255,255,255,0.1); border-radius: 8px;
          overflow: hidden; cursor: pointer; transition: all 0.2s;
          aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
        }
        .gallery-item:hover { border-color: var(--ipixel-primary); transform: scale(1.05); }
        .gallery-item.sending { border-color: var(--ipixel-accent); opacity: 0.7; }
        .gallery-item.user-gif { border-color: rgba(255,152,0,0.3); }
        .gallery-item img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        .item-label {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.7);
          font-size: 0.6em; padding: 2px 4px; text-align: center;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sending-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75em; color: var(--ipixel-accent);
        }
        .delete-btn {
          position: absolute; top: 2px; right: 2px;
          width: 18px; height: 18px;
          background: rgba(244,67,54,0.8); border: none; border-radius: 50%;
          color: #fff; font-size: 11px; line-height: 18px; text-align: center;
          cursor: pointer; display: none; padding: 0;
        }
        .gallery-item:hover .delete-btn { display: block; }
        .filter-row, .size-select { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .filter-btn, .size-btn {
          padding: 5px 12px;
          border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
          background: rgba(255,255,255,0.05); color: inherit;
          cursor: pointer; font-size: 0.75em; transition: all 0.2s;
        }
        .size-btn { padding: 4px 10px; border-radius: 12px; font-size: 0.7em; }
        .filter-btn:hover, .size-btn:hover { background: rgba(255,255,255,0.1); }
        .filter-btn.active, .size-btn.active { background: rgba(3,169,244,0.25); border-color: var(--ipixel-primary); }
        .size-btn.match { border-color: rgba(76,175,80,0.5); }
        .slot-row {
          display: flex; gap: 8px; align-items: center;
          margin-top: 8px; padding: 8px 12px;
          background: rgba(255,255,255,0.03); border-radius: 8px;
        }
        .slot-row label { font-size: 0.8em; opacity: 0.7; white-space: nowrap; }
        .slot-row select {
          padding: 4px 8px; background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border); border-radius: 4px;
          color: inherit; font-size: 0.8em;
        }
        .slot-row .toggle-switch { width: 36px; height: 20px; }
        .slot-row .toggle-switch::after { width: 16px; height: 16px; }
        .slot-row .toggle-switch.active::after { transform: translateX(16px); }
        .drop-zone {
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 10px; padding: 16px; text-align: center;
          margin-top: 12px; transition: all 0.2s; cursor: pointer;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: var(--ipixel-primary); background: rgba(3,169,244,0.05);
        }
        .drop-zone-text { font-size: 0.8em; opacity: 0.6; }
        .drop-zone-text svg { display: block; margin: 0 auto 6px; opacity: 0.4; }
        .drop-zone input[type="file"] { display: none; }
        .gallery-count { font-size: 0.75em; opacity: 0.5; margin-left: auto; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="20" height="20" style="fill: currentColor; opacity: 0.7;">
                <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6" />
              </svg>
              Gallery
              <span class="gallery-count">${this._getItems().length} items</span>
            </div>
          </div>

          ${renderTabs(TABS, active)}
          ${renderPanel('browse', active === 'browse', this._renderBrowseTab())}
          ${renderPanel('upload', active === 'upload', this._renderUploadTab())}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _renderBrowseTab() {
    if (this._loading) return `<div class="empty-state">Loading gallery...</div>`;

    const sizes = this._getSortedSizes();
    const data = this._manifest?.[this._selectedSize];
    const hasAnimations = (data?.animations?.length || 0) > 0;
    const hasEyes = (data?.eyes?.length || 0) > 0;
    const userGifs = userGifsStore.load();

    const [w, h] = this.getResolution();
    const sizeItems = sizes.map(s => ({ value: s, name: s, isMatch: s === `${w}x${h}` }));

    const filters = [
      { value: 'all', name: 'All', show: true },
      { value: 'animations', name: 'Animations', show: hasAnimations },
      { value: 'eyes', name: 'Eyes', show: hasEyes },
      { value: 'user', name: `My GIFs${userGifs.length ? ` (${userGifs.length})` : ''}`, show: true },
    ].filter(f => f.show);

    return `
      ${sizes.length > 0 ? `
        <div class="section-title">Display Size</div>
        ${renderGridSelector(sizeItems, {
          selected: this._selectedSize,
          itemClass: 'size-btn',
          gridClass: 'size-select',
          dataAttr: 'size',
          extraClass: (i) => i.isMatch ? 'match' : '',
        })}
      ` : ''}

      ${renderGridSelector(filters, {
        selected: this._filter,
        itemClass: 'filter-btn',
        gridClass: 'filter-row',
        dataAttr: 'filter',
      })}

      ${this._renderGalleryItems()}`;
  }

  _renderUploadTab() {
    return `
      <div class="section-title">Upload GIFs</div>
      <div class="drop-zone${this._dragOver ? ' drag-over' : ''}" id="drop-zone">
        <div class="drop-zone-text">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
          Drop GIF/image files here or tap to upload
        </div>
        <input type="file" id="file-input" accept="image/*,.gif" multiple>
      </div>

      <div class="section-title" style="margin-top: 16px;">Destination</div>
      <div class="slot-row">
        ${renderToggle({ id: 'slot-toggle', active: this._slotMode })}
        <label>Save to slot</label>
        <select id="target-slot" ${!this._slotMode ? 'disabled' : ''}>
          ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}"${n === this._targetSlot ? ' selected' : ''}>Slot ${n}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderGalleryItems() {
    const items = this._getItems();
    if (items.length === 0) {
      return `<div class="empty-state">
        ${this._filter === 'user' ? 'No uploaded GIFs yet. Use the Upload tab to add some!' : 'No items for this filter.'}
      </div>`;
    }

    return `<div class="gallery-grid">${items.map(item => {
      const id = item.name || item.file;
      const isSending = this._sending === id;
      const isUser = item.type === 'user';
      const label = isUser
        ? item.name.replace(/\.[^.]+$/, '')
        : (item.side ? `Eye ${item.side.toUpperCase()} #${item.num}` : `#${item.num}`);
      const src = isUser ? item.dataUrl : `${GALLERY_BASE}/${this._selectedSize}/${item.file}`;
      return `
        <div class="gallery-item${isSending ? ' sending' : ''}${isUser ? ' user-gif' : ''}"
             data-id="${id}" data-type="${item.type}" title="${this.escapeHtml(id)}">
          <img src="${src}" loading="lazy" alt="${this.escapeHtml(label)}">
          <div class="item-label">${this.escapeHtml(label)}</div>
          ${isUser ? `<button class="delete-btn" data-delete="${this.escapeHtml(item.name)}">x</button>` : ''}
          ${isSending ? '<div class="sending-overlay">Sending...</div>' : ''}
        </div>`;
    }).join('')}</div>`;
  }

  _attachListeners() {
    attachTabs(this.shadowRoot, (id) => { this._activeTab = id; this.render(); });

    attachGridSelector(this.shadowRoot, '.size-btn', {
      onSelect: (v) => { this._selectedSize = v; this._filter = 'all'; this.render(); },
      attr: 'size',
    });
    attachGridSelector(this.shadowRoot, '.filter-btn', {
      onSelect: (v) => { this._filter = v; this.render(); },
      attr: 'filter',
    });

    attachToggle(this.shadowRoot, 'slot-toggle', (v) => { this._slotMode = v; this.render(); });
    this.shadowRoot.getElementById('target-slot')?.addEventListener('change', (e) => {
      this._targetSlot = parseInt(e.target.value);
    });

    const dropZone = this.shadowRoot.getElementById('drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!this._dragOver) { this._dragOver = true; dropZone.classList.add('drag-over'); }
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault(); e.stopPropagation();
        this._dragOver = false;
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        this._dragOver = false;
        if (e.dataTransfer?.files?.length) this._handleFiles(e.dataTransfer.files);
      });
      dropZone.addEventListener('click', () => {
        this.shadowRoot.getElementById('file-input')?.click();
      });
    }
    this.shadowRoot.getElementById('file-input')?.addEventListener('change', (e) => {
      if (e.target.files?.length) this._handleFiles(e.target.files);
    });

    this.shadowRoot.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        const id = el.dataset.id;
        const item = this._getItems().find(i => (i.name || i.file) === id);
        if (item && !this._sending) this._sendToDevice(item);
      });
    });

    this.shadowRoot.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = e.currentTarget.dataset.delete;
        const remaining = userGifsStore.load().filter(g => g.name !== name);
        userGifsStore.save(remaining);
        this.render();
      });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
