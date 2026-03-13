/**
 * Minimal GIF89a encoder for iPIXEL LED matrix displays.
 * Optimized for small displays (16–96px wide) with limited palettes.
 */

// ── ByteWriter ──────────────────────────────────────────────────────────────

class ByteWriter {
  constructor() {
    this.chunks = [];
    this.buf = new Uint8Array(8192);
    this.pos = 0;
  }
  _flush() {
    if (this.pos > 0) {
      this.chunks.push(this.buf.slice(0, this.pos));
      this.buf = new Uint8Array(8192);
      this.pos = 0;
    }
  }
  _ensure(n) {
    if (this.pos + n > this.buf.length) this._flush();
  }
  writeByte(b) {
    this._ensure(1);
    this.buf[this.pos++] = b & 0xFF;
  }
  writeU16(v) {
    this.writeByte(v & 0xFF);
    this.writeByte((v >> 8) & 0xFF);
  }
  writeString(s) {
    for (let i = 0; i < s.length; i++) this.writeByte(s.charCodeAt(i));
  }
  toUint8Array() {
    this._flush();
    let total = 0;
    for (const c of this.chunks) total += c.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of this.chunks) { out.set(c, off); off += c.length; }
    return out;
  }
}

// ── Palette builder ─────────────────────────────────────────────────────────

function buildPalette(frames, maxColors = 256) {
  const freq = new Map();
  for (const frame of frames) {
    for (let i = 0; i < frame.length; i += 3) {
      const key = (frame[i] << 16) | (frame[i + 1] << 8) | frame[i + 2];
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }

  let colors = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  if (colors.length > maxColors) {
    // Posterize to 4-bit per channel, pick top maxColors by frequency
    const qFreq = new Map();
    for (const [key, count] of colors) {
      const r = ((key >> 16) & 0xF0) | ((key >> 20) & 0x0F);
      const g = ((key >> 8) & 0xF0) | ((key >> 12) & 0x0F);
      const b = (key & 0xF0) | ((key >> 4) & 0x0F);
      const qk = (r << 16) | (g << 8) | b;
      qFreq.set(qk, (qFreq.get(qk) || 0) + count);
    }
    colors = [...qFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors);
  }

  const palette = colors.map(([k]) => [(k >> 16) & 0xFF, (k >> 8) & 0xFF, k & 0xFF]);

  // Ensure black is present
  if (!palette.some(([r, g, b]) => r === 0 && g === 0 && b === 0)) {
    if (palette.length >= maxColors) palette[palette.length - 1] = [0, 0, 0];
    else palette.push([0, 0, 0]);
  }

  let bits = 2; // GIF minimum
  while ((1 << bits) < palette.length) bits++;

  return { palette, paletteBits: bits };
}

// ── Nearest-color index mapper ──────────────────────────────────────────────

function mapToIndices(frame, palette) {
  const len = frame.length / 3;
  const indices = new Uint8Array(len);
  const cache = new Map();

  for (let i = 0; i < len; i++) {
    const r = frame[i * 3], g = frame[i * 3 + 1], b = frame[i * 3 + 2];
    const key = (r << 16) | (g << 8) | b;
    if (cache.has(key)) { indices[i] = cache.get(key); continue; }

    let best = 0, bestD = Infinity;
    for (let j = 0; j < palette.length; j++) {
      const dr = r - palette[j][0], dg = g - palette[j][1], db = b - palette[j][2];
      const d = dr * dr + dg * dg + db * db;
      if (d === 0) { best = j; break; }
      if (d < bestD) { bestD = d; best = j; }
    }
    cache.set(key, best);
    indices[i] = best;
  }
  return indices;
}

// ── LZW encoder ─────────────────────────────────────────────────────────────

function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  // Trie-based code table: table[code] = Map<pixel, newCode>
  const table = [];
  let codeSize, nextCode;

  function reset() {
    table.length = 0;
    for (let i = 0; i <= eoiCode; i++) table.push(null);
    for (let i = 0; i < clearCode; i++) table[i] = new Map();
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  }

  // LSB-first bit packer
  let bits = 0, bitCount = 0;
  const output = [];
  function emit(code, size) {
    bits |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      output.push(bits & 0xFF);
      bits >>>= 8;
      bitCount -= 8;
    }
  }

  reset();
  emit(clearCode, codeSize);

  if (indices.length === 0) {
    emit(eoiCode, codeSize);
    if (bitCount > 0) output.push(bits & 0xFF);
    return output;
  }

  let cur = indices[0]; // current node (code)

  for (let i = 1; i < indices.length; i++) {
    const px = indices[i];
    const node = table[cur];

    if (node && node.has(px)) {
      cur = node.get(px);
    } else {
      emit(cur, codeSize);

      if (nextCode < 4096) {
        if (!table[cur]) table[cur] = new Map();
        table[cur].set(px, nextCode);
        table[nextCode] = new Map();
        if (nextCode >= (1 << codeSize) && codeSize < 12) codeSize++;
        nextCode++;
      } else {
        emit(clearCode, codeSize);
        reset();
      }
      cur = px;
    }
  }

  emit(cur, codeSize);
  emit(eoiCode, codeSize);
  if (bitCount > 0) output.push(bits & 0xFF);
  return output;
}

// ── Sub-block writer (max 255 bytes per block) ──────────────────────────────

function writeSubBlocks(w, data) {
  let pos = 0;
  while (pos < data.length) {
    const n = Math.min(255, data.length - pos);
    w.writeByte(n);
    for (let i = 0; i < n; i++) w.writeByte(data[pos++]);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Encode frames into a GIF89a binary.
 * @param {Uint8Array[]} frames  Each frame: flat RGB bytes [r,g,b,r,g,b,…]
 * @param {number} width
 * @param {number} height
 * @param {number} delay   Frame delay in centiseconds (10 = 100 ms)
 * @param {number} loops   0 = infinite
 * @returns {Uint8Array}   Complete GIF file bytes
 */
export function encodeGif(frames, width, height, delay = 10, loops = 0) {
  const { palette, paletteBits } = buildPalette(frames);
  const paletteSize = 1 << paletteBits;
  const w = new ByteWriter();

  // ── Header ──
  w.writeString('GIF89a');

  // ── Logical Screen Descriptor ──
  w.writeU16(width);
  w.writeU16(height);
  w.writeByte(0x80 | ((paletteBits - 1) << 4) | (paletteBits - 1));
  w.writeByte(0); // bg color
  w.writeByte(0); // pixel aspect

  // ── Global Color Table ──
  for (let i = 0; i < paletteSize; i++) {
    if (i < palette.length) {
      w.writeByte(palette[i][0]);
      w.writeByte(palette[i][1]);
      w.writeByte(palette[i][2]);
    } else {
      w.writeByte(0); w.writeByte(0); w.writeByte(0);
    }
  }

  // ── Netscape looping extension ──
  if (frames.length > 1) {
    w.writeByte(0x21); w.writeByte(0xFF); w.writeByte(0x0B);
    w.writeString('NETSCAPE2.0');
    w.writeByte(0x03); w.writeByte(0x01);
    w.writeU16(loops);
    w.writeByte(0x00);
  }

  // ── Frames ──
  for (const frame of frames) {
    // Graphic Control Extension
    w.writeByte(0x21); w.writeByte(0xF9); w.writeByte(0x04);
    w.writeByte(0x00); // no disposal, no transparency
    w.writeU16(delay);
    w.writeByte(0x00); w.writeByte(0x00);

    // Image Descriptor
    w.writeByte(0x2C);
    w.writeU16(0); w.writeU16(0);
    w.writeU16(width); w.writeU16(height);
    w.writeByte(0x00); // no local color table

    // LZW Image Data
    const indices = mapToIndices(frame, palette);
    const minCode = Math.max(2, paletteBits);
    w.writeByte(minCode);
    writeSubBlocks(w, lzwEncode(indices, minCode));
    w.writeByte(0x00);
  }

  w.writeByte(0x3B); // trailer
  return w.toUint8Array();
}
