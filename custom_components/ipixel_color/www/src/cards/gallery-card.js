/**
 * iPIXEL Gallery Card
 * Browse bundled animations + user-uploaded GIFs, send to device
 */

import { iPIXELCardBase } from '../base.js';
import { iPIXELCardStyles } from '../styles.js';

// Detect environment: HA uses /ipixel_color/gallery, preview uses symlinked ./gallery
const isHA = typeof window !== 'undefined' && (
  typeof window.hassConnection !== 'undefined' ||
  document.querySelector('home-assistant') !== null
);
const GALLERY_BASE = isHA
  ? '/ipixel_color/gallery'
  : `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1)}gallery`;

// localStorage key for user-uploaded GIFs
const USER_GIFS_KEY = 'iPIXEL_UserGIFs';

export class iPIXELGalleryCard extends iPIXELCardBase {
  constructor() {
    super();
    this._manifest = null;
    this._loading = false;
    this._selectedSize = null;
    this._filter = 'all'; // 'all', 'animations', 'eyes', 'user'
    this._sending = null;
    this._slotMode = false;
    this._targetSlot = 1;
    this._dragOver = false;
  }

  connectedCallback() {
    this._loadManifest();
  }

  // ── Manifest loading ──

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

  // ── User GIFs (localStorage) ──

  _getUserGifs() {
    try {
      return JSON.parse(localStorage.getItem(USER_GIFS_KEY) || '[]');
    } catch { return []; }
  }

  _saveUserGifs(gifs) {
    localStorage.setItem(USER_GIFS_KEY, JSON.stringify(gifs));
  }

  _addUserGif(name, dataUrl) {
    const gifs = this._getUserGifs();
    // Dedupe by name
    const existing = gifs.findIndex(g => g.name === name);
    if (existing >= 0) gifs[existing] = { name, dataUrl, addedAt: Date.now() };
    else gifs.push({ name, dataUrl, addedAt: Date.now() });
    this._saveUserGifs(gifs);
  }

  _removeUserGif(name) {
    const gifs = this._getUserGifs().filter(g => g.name !== name);
    this._saveUserGifs(gifs);
  }

  // ── Items ──

  _getItems() {
    if (!this._manifest || !this._selectedSize) {
      // Even without manifest, show user GIFs
      if (this._filter === 'user' || this._filter === 'all') {
        return this._getUserGifs().map(g => ({ ...g, type: 'user' }));
      }
      return [];
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
    const userGifs = (this._filter === 'all' || this._filter === 'user')
      ? this._getUserGifs().map(g => ({ ...g, type: 'user' }))
      : [];
    return [...userGifs, ...bundled];
  }

  // ── Send ──

  async _sendToDevice(item) {
    this._sending = item.name || item.file;
    this.render();

    try {
      if (item.type === 'user') {
        // Convert data URL to blob, upload via upload_gif service
        const resp = await fetch(item.dataUrl);
        const blob = await resp.blob();
        // Create a temporary object URL the backend can't access,
        // so use the BLE direct send path via ble-device.js if available
        // For HA, we use display_image_raw_rgb or upload via a temp URL
        // Simplest: call upload_gif with a data: URI - but HA services need a real URL
        // Instead, send the raw bytes via the ipixel_color.display_image_raw_rgb service
        // Actually - the most compatible way is to send via the JS BLE device if connected
        if (window.iPIXEL_BLE && window.iPIXEL_BLE.isConnected()) {
          const arrayBuf = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);
          const slot = this._slotMode ? this._targetSlot : 1;
          await window.iPIXEL_BLE.saveGifToSlot(slot, bytes);
        } else {
          // HA fallback: convert to base64 and use a data URL with display_image_url
          // The display_image_url service downloads from a URL, so data: URIs won't work
          // We need to POST the bytes. Use the upload_gif approach with a publicly reachable URL.
          // For now, show an informative error since we need either BLE or a reachable URL
          console.warn('iPIXEL Gallery: User GIF send requires BLE connection or HA backend support');
          // Try calling upload_gif with the data URL - some HA setups may support it
          const serviceData = { gif_url: item.dataUrl };
          if (this._slotMode) serviceData.buffer_slot = this._targetSlot;
          await this.callService('ipixel_color', 'upload_gif', serviceData);
        }
      } else {
        // Bundled animation - use display_local_gallery service
        const serviceData = {
          size: this._selectedSize,
          filename: item.file,
        };
        if (this._slotMode) serviceData.buffer_slot = this._targetSlot;
        await this.callService('ipixel_color', 'display_local_gallery', serviceData);
      }
    } catch (err) {
      console.error('iPIXEL Gallery: Send failed', err);
    }

    this._sending = null;
    this.render();
  }

  // ── File handling ──

  _handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        this._addUserGif(file.name, reader.result);
        this.render();
      };
      reader.readAsDataURL(file);
    }
  }

  // ── Render ──

  render() {
    const testMode = this.isInTestMode();
    if (!this._hass && !testMode) return;

    const sizes = this._getSortedSizes();
    const items = this._getItems();
    const data = this._manifest?.[this._selectedSize];
    const hasAnimations = (data?.animations?.length || 0) > 0;
    const hasEyes = (data?.eyes?.length || 0) > 0;
    const userGifs = this._getUserGifs();
    const hasUserGifs = userGifs.length > 0;

    this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }
        .gallery-item {
          position: relative;
          background: #000;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gallery-item:hover {
          border-color: var(--ipixel-primary);
          transform: scale(1.05);
        }
        .gallery-item.sending {
          border-color: var(--ipixel-accent);
          opacity: 0.7;
        }
        .gallery-item.user-gif {
          border-color: rgba(255,152,0,0.3);
        }
        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .gallery-item .item-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.7);
          font-size: 0.6em;
          padding: 2px 4px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gallery-item .sending-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75em;
          color: var(--ipixel-accent);
        }
        .gallery-item .delete-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          background: rgba(244,67,54,0.8);
          border: none;
          border-radius: 50%;
          color: #fff;
          font-size: 11px;
          line-height: 18px;
          text-align: center;
          cursor: pointer;
          display: none;
          padding: 0;
        }
        .gallery-item:hover .delete-btn { display: block; }
        .filter-row {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 5px 12px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          color: inherit;
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .filter-btn:hover { background: rgba(255,255,255,0.1); }
        .filter-btn.active {
          background: rgba(3,169,244,0.25);
          border-color: var(--ipixel-primary);
        }
        .slot-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
        }
        .slot-row label {
          font-size: 0.8em;
          opacity: 0.7;
          white-space: nowrap;
        }
        .slot-row select {
          padding: 4px 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border);
          border-radius: 4px;
          color: inherit;
          font-size: 0.8em;
        }
        .size-select {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .size-btn {
          padding: 4px 10px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          color: inherit;
          cursor: pointer;
          font-size: 0.7em;
          transition: all 0.2s;
        }
        .size-btn:hover { background: rgba(255,255,255,0.1); }
        .size-btn.active {
          background: rgba(3,169,244,0.25);
          border-color: var(--ipixel-primary);
        }
        .size-btn.match {
          border-color: rgba(76,175,80,0.5);
        }
        .gallery-count {
          font-size: 0.75em;
          opacity: 0.5;
          margin-left: auto;
        }
        .drop-zone {
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          margin-top: 12px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: var(--ipixel-primary);
          background: rgba(3,169,244,0.05);
        }
        .drop-zone-text {
          font-size: 0.8em;
          opacity: 0.6;
        }
        .drop-zone-text svg {
          display: block;
          margin: 0 auto 6px;
          opacity: 0.4;
        }
        .drop-zone input[type="file"] { display: none; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="20" height="20" style="fill: currentColor; opacity: 0.7;">
                <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6" />
              </svg>
              Gallery
              <span class="gallery-count">${items.length} items</span>
            </div>
          </div>

          ${this._loading ? '<div class="empty-state">Loading gallery...</div>' : ''}

          ${!this._loading ? `
            ${sizes.length > 0 ? `
              <div class="section-title">Display Size</div>
              <div class="size-select">
                ${sizes.map(s => {
                  const [w, h] = this.getResolution();
                  const isMatch = s === `${w}x${h}`;
                  return `<button class="size-btn${s === this._selectedSize ? ' active' : ''}${isMatch ? ' match' : ''}" data-size="${s}">${s}</button>`;
                }).join('')}
              </div>
            ` : ''}

            <div class="filter-row">
              <button class="filter-btn${this._filter === 'all' ? ' active' : ''}" data-filter="all">All</button>
              ${hasAnimations ? `<button class="filter-btn${this._filter === 'animations' ? ' active' : ''}" data-filter="animations">Animations</button>` : ''}
              ${hasEyes ? `<button class="filter-btn${this._filter === 'eyes' ? ' active' : ''}" data-filter="eyes">Eyes</button>` : ''}
              <button class="filter-btn${this._filter === 'user' ? ' active' : ''}" data-filter="user">My GIFs${hasUserGifs ? ` (${userGifs.length})` : ''}</button>
            </div>

            <div class="slot-row">
              <div id="slot-toggle" style="
                width: 36px; height: 20px; background: ${this._slotMode ? 'var(--ipixel-primary)' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px; position: relative; cursor: pointer; flex-shrink: 0; transition: background 0.2s;
              "><span style="
                position: absolute; top: 2px; left: ${this._slotMode ? '18px' : '2px'}; width: 16px; height: 16px;
                background: #fff; border-radius: 50%; transition: left 0.2s;
              "></span></div>
              <label>Save to slot</label>
              <select id="target-slot" ${!this._slotMode ? 'disabled' : ''}>
                ${[1,2,3,4,5,6,7,8,9].map(n => `<option value="${n}"${n === this._targetSlot ? ' selected' : ''}>Slot ${n}</option>`).join('')}
              </select>
            </div>

            <div class="drop-zone${this._dragOver ? ' drag-over' : ''}" id="drop-zone">
              <div class="drop-zone-text">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
                Drop GIF/image files here or tap to upload
              </div>
              <input type="file" id="file-input" accept="image/*,.gif" multiple>
            </div>

            ${items.length > 0 ? `
              <div class="gallery-grid">
                ${items.map(item => {
                  const id = item.name || item.file;
                  const isSending = this._sending === id;
                  const isUser = item.type === 'user';
                  const label = isUser
                    ? item.name.replace(/\.[^.]+$/, '')
                    : (item.side ? `Eye ${item.side.toUpperCase()} #${item.num}` : `#${item.num}`);
                  const src = isUser
                    ? item.dataUrl
                    : `${GALLERY_BASE}/${this._selectedSize}/${item.file}`;
                  return `
                    <div class="gallery-item${isSending ? ' sending' : ''}${isUser ? ' user-gif' : ''}"
                         data-id="${id}" data-type="${item.type}" title="${id}">
                      <img src="${src}" loading="lazy" alt="${label}">
                      <div class="item-label">${label}</div>
                      ${isUser ? `<button class="delete-btn" data-delete="${item.name}">x</button>` : ''}
                      ${isSending ? '<div class="sending-overlay">Sending...</div>' : ''}
                    </div>`;
                }).join('')}
              </div>
            ` : `
              <div class="empty-state">
                ${this._filter === 'user' ? 'No uploaded GIFs yet. Drop files above to add some!' : 'No items for this filter.'}
              </div>
            `}
          ` : ''}
        </div>
      </ha-card>`;

    this._attachListeners();
  }

  _attachListeners() {
    // Size selection
    this.shadowRoot.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._selectedSize = e.currentTarget.dataset.size;
        this._filter = 'all';
        this.render();
      });
    });

    // Filter buttons
    this.shadowRoot.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._filter = e.currentTarget.dataset.filter;
        this.render();
      });
    });

    // Slot toggle
    this.shadowRoot.getElementById('slot-toggle')?.addEventListener('click', () => {
      this._slotMode = !this._slotMode;
      this.render();
    });

    // Target slot
    this.shadowRoot.getElementById('target-slot')?.addEventListener('change', (e) => {
      this._targetSlot = parseInt(e.target.value);
    });

    // Drop zone - drag & drop
    const dropZone = this.shadowRoot.getElementById('drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this._dragOver) { this._dragOver = true; dropZone.classList.add('drag-over'); }
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._dragOver = false;
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._dragOver = false;
        if (e.dataTransfer?.files?.length) {
          this._handleFiles(e.dataTransfer.files);
        }
      });
      // Click to open file picker
      dropZone.addEventListener('click', () => {
        this.shadowRoot.getElementById('file-input')?.click();
      });
    }

    // File input change
    this.shadowRoot.getElementById('file-input')?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        this._handleFiles(e.target.files);
      }
    });

    // Gallery items - send on click
    this.shadowRoot.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', (e) => {
        // Ignore if clicking the delete button
        if (e.target.classList.contains('delete-btn')) return;
        const id = el.dataset.id;
        const items = this._getItems();
        const item = items.find(i => (i.name || i.file) === id);
        if (item && !this._sending) {
          this._sendToDevice(item);
        }
      });
    });

    // Delete user GIF buttons
    this.shadowRoot.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = e.currentTarget.dataset.delete;
        this._removeUserGif(name);
        this.render();
      });
    });
  }

  static getConfigElement() { return document.createElement('ipixel-simple-editor'); }
  static getStubConfig() { return { entity: '' }; }
}
