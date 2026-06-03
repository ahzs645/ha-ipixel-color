(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/react-pixel-display/dist/index-Ds5kwaZ_.js
  var index_Ds5kwaZ_exports = {};
  __export(index_Ds5kwaZ_exports, {
    $Bitmap: () => $Bitmap,
    $Font: () => $Font,
    $Glyph: () => $Glyph,
    Bitmap: () => Bitmap,
    Font: () => Font,
    Glyph: () => Glyph
  });
  var __awaiter, __asyncValues, setProperty, PATTERN_VVECTOR_DELIMITER, EMPTY_GLYPH, META_TITLES, DIRE_SHORTCUT_MAP, DIRE_MAP, Font, Glyph, Bitmap, $Font, $Glyph, $Bitmap;
  var init_index_Ds5kwaZ = __esm({
    "node_modules/react-pixel-display/dist/index-Ds5kwaZ_.js"() {
      __awaiter = function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      __asyncValues = function(o) {
        if (!Symbol.asyncIterator)
          throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
          return this;
        }, i);
        function verb(n) {
          i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
              v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
          };
        }
        function settle(resolve, reject, d, v) {
          Promise.resolve(v).then(function(v2) {
            resolve({ value: v2, done: d });
          }, reject);
        }
      };
      setProperty = (obj, key, value) => {
        obj[key] = value;
      };
      PATTERN_VVECTOR_DELIMITER = "[\\s]+";
      EMPTY_GLYPH = {
        glyphname: "empty",
        codepoint: 8203,
        bbw: 0,
        bbh: 0,
        bbxoff: 0,
        bbyoff: 0,
        swx0: 0,
        swy0: 0,
        dwx0: 0,
        dwy0: 0,
        swx1: 0,
        swy1: 0,
        dwx1: 0,
        dwy1: 0,
        vvectorx: 0,
        vvectory: 0,
        hexdata: []
      };
      META_TITLES = [
        "glyphname",
        "codepoint",
        "bbw",
        "bbh",
        "bbxoff",
        "bbyoff",
        "swx0",
        "swy0",
        "dwx0",
        "dwy0",
        "swx1",
        "swy1",
        "dwx1",
        "dwy1",
        "vvectorx",
        "vvectory",
        "hexdata"
      ];
      DIRE_SHORTCUT_MAP = {
        lr: "lrtb",
        rl: "rltb",
        tb: "tbrl",
        bt: "btrl",
        lrtb: void 0,
        lrbt: void 0,
        rltb: void 0,
        rlbt: void 0,
        tbrl: void 0,
        tblr: void 0,
        btrl: void 0,
        btlr: void 0
      };
      DIRE_MAP = { lr: 1, rl: 2, tb: 0, bt: -1 };
      Font = class {
        constructor() {
          this.headers = void 0;
          this.__headers = {};
          this.props = {};
          this.glyphs = /* @__PURE__ */ new Map();
          this.__glyph_count_to_check = null;
          this.__curline_startchar = null;
          this.__curline_chars = null;
        }
        /**
         * Load the BDF font file (file line async iterator).
         *
         * @param filelines - Asynchronous iterable iterator containing each line in string text from the font file
         *
         * @returns The current `Font` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#load_filelines}
         */
        load_filelines(filelines) {
          var e_1, _a;
          return __awaiter(this, void 0, void 0, function* () {
            try {
              this.__f = filelines;
              yield this.__parse_headers();
            } finally {
              if (typeof Deno !== "undefined") {
                if (this.__f !== void 0) {
                  try {
                    for (var _b = __asyncValues(this.__f), _c; _c = yield _b.next(), !_c.done; ) {
                      const _ = _c.value;
                    }
                  } catch (e_1_1) {
                    e_1 = { error: e_1_1 };
                  } finally {
                    try {
                      if (_c && !_c.done && (_a = _b.return))
                        yield _a.call(_b);
                    } finally {
                      if (e_1)
                        throw e_1.error;
                    }
                  }
                }
              }
            }
            return this;
          });
        }
        __parse_headers() {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            while (1) {
              const line = (_b = yield (_a = this.__f) === null || _a === void 0 ? void 0 : _a.next()) === null || _b === void 0 ? void 0 : _b.value;
              const kvlist = line.split(/ (.+)/, 2);
              const l = kvlist.length;
              let nlist;
              if (l === 2) {
                const key = kvlist[0];
                const value = kvlist[1].trim();
                switch (key) {
                  case "STARTFONT":
                    this.__headers["bdfversion"] = parseFloat(value);
                    break;
                  case "FONT":
                    this.__headers["fontname"] = value;
                    break;
                  case "SIZE":
                    nlist = value.split(" ");
                    this.__headers["pointsize"] = parseInt(nlist[0], 10);
                    this.__headers["xres"] = parseInt(nlist[1], 10);
                    this.__headers["yres"] = parseInt(nlist[2], 10);
                    break;
                  case "FONTBOUNDINGBOX":
                    nlist = value.split(" ");
                    this.__headers["fbbx"] = parseInt(nlist[0], 10);
                    this.__headers["fbby"] = parseInt(nlist[1], 10);
                    this.__headers["fbbxoff"] = parseInt(nlist[2], 10);
                    this.__headers["fbbyoff"] = parseInt(nlist[3], 10);
                    break;
                  case "STARTPROPERTIES":
                    this.__parse_headers_after();
                    yield this.__parse_props();
                    return;
                  case "COMMENT":
                    if (!("comment" in this.__headers) || !Array.isArray(this.__headers.comment)) {
                      this.__headers.comment = [];
                    }
                    this.__headers.comment.push(value.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, ""));
                    break;
                  case "SWIDTH":
                    nlist = value.split(" ");
                    this.__headers["swx0"] = parseInt(nlist[0], 10);
                    this.__headers["swy0"] = parseInt(nlist[1], 10);
                    break;
                  case "DWIDTH":
                    nlist = value.split(" ");
                    this.__headers["dwx0"] = parseInt(nlist[0], 10);
                    this.__headers["dwy0"] = parseInt(nlist[1], 10);
                    break;
                  case "SWIDTH1":
                    nlist = value.split(" ");
                    this.__headers["swx1"] = parseInt(nlist[0], 10);
                    this.__headers["swy1"] = parseInt(nlist[1], 10);
                    break;
                  case "DWIDTH1":
                    nlist = value.split(" ");
                    this.__headers["dwx1"] = parseInt(nlist[0], 10);
                    this.__headers["dwy1"] = parseInt(nlist[1], 10);
                    break;
                  case "VVECTOR":
                    nlist = PATTERN_VVECTOR_DELIMITER.split(value);
                    this.__headers["vvectorx"] = parseInt(nlist[0], 10);
                    this.__headers["vvectory"] = parseInt(nlist[1], 10);
                    break;
                  case "METRICSSET":
                  case "CONTENTVERSION":
                    this.__headers[key.toLowerCase()] = parseInt(value, 10);
                    break;
                  case "CHARS":
                    console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword");
                    this.__parse_headers_after();
                    this.__curline_chars = line;
                    yield this.__parse_glyph_count();
                    return;
                  case "STARTCHAR":
                    console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword");
                    console.warn("Cannot find 'CHARS' line");
                    this.__parse_headers_after();
                    this.__curline_startchar = line;
                    yield this.__prepare_glyphs();
                    return;
                }
              }
              if (l === 1 && kvlist[0].trim() === "ENDFONT") {
                console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword");
                console.warn("This font does not have any glyphs");
                return;
              }
            }
          });
        }
        __parse_headers_after() {
          if (!("metricsset" in this.__headers)) {
            this.__headers["metricsset"] = 0;
          }
          this.headers = this.__headers;
        }
        __parse_props() {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            while (1) {
              const line = (_b = yield (_a = this.__f) === null || _a === void 0 ? void 0 : _a.next()) === null || _b === void 0 ? void 0 : _b.value;
              const kvlist = line.split(/ (.+)/, 2);
              const l = kvlist.length;
              if (l === 2) {
                const key = kvlist[0];
                const value = kvlist[1].replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, "");
                if (key === "COMMENT") {
                  if (!("comment" in this.props) || !Array.isArray(this.props.comment)) {
                    this.props.comment = [];
                  }
                  this.props.comment.push(value.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g, ""));
                } else {
                  this.props[key.toLowerCase()] = value;
                }
              } else {
                if (l === 1) {
                  const key = kvlist[0].trim();
                  if (key === "ENDPROPERTIES") {
                    yield this.__parse_glyph_count();
                    return;
                  }
                  if (key === "ENDFONT") {
                    console.warn("This font does not have any glyphs");
                    return;
                  } else {
                    this.props[key] = null;
                  }
                }
              }
            }
          });
        }
        __parse_glyph_count() {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            let line;
            if (this.__curline_chars === null) {
              line = (_b = yield (_a = this.__f) === null || _a === void 0 ? void 0 : _a.next()) === null || _b === void 0 ? void 0 : _b.value;
            } else {
              line = this.__curline_chars;
              this.__curline_chars = null;
            }
            if (line.trim() === "ENDFONT") {
              console.warn("This font does not have any glyphs");
              return;
            }
            const kvlist = line.split(/ (.+)/, 2);
            if (kvlist[0] === "CHARS") {
              this.__glyph_count_to_check = parseInt(kvlist[1].trim(), 10);
            } else {
              this.__curline_startchar = line;
              console.warn("Cannot find 'CHARS' line next to 'ENDPROPERTIES' line");
            }
            yield this.__prepare_glyphs();
          });
        }
        __prepare_glyphs() {
          var _a, _b;
          return __awaiter(this, void 0, void 0, function* () {
            let glyph_codepoint = 0;
            let glyph_meta = [
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null
            ];
            let glyph_bitmap = [];
            let glyph_bitmap_is_on = false;
            let glyph_end = false;
            while (1) {
              let line;
              if (this.__curline_startchar === null) {
                line = (_b = yield (_a = this.__f) === null || _a === void 0 ? void 0 : _a.next()) === null || _b === void 0 ? void 0 : _b.value;
              } else {
                line = this.__curline_startchar;
                this.__curline_startchar = null;
              }
              if (line === void 0 || line === null) {
                console.warn("This font does not have 'ENDFONT' keyword");
                this.__prepare_glyphs_after();
                return;
              }
              const kvlist = line.split(/ (.+)/, 2);
              const l = kvlist.length;
              if (l === 2) {
                const key = kvlist[0];
                const value = kvlist[1].trim();
                let nlist;
                switch (key) {
                  case "STARTCHAR":
                    glyph_meta = [
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null
                    ];
                    glyph_meta[0] = value;
                    glyph_end = false;
                    break;
                  case "ENCODING":
                    glyph_codepoint = parseInt(value, 10);
                    glyph_meta[1] = glyph_codepoint;
                    break;
                  case "BBX":
                    nlist = value.split(" ");
                    glyph_meta[2] = parseInt(nlist[0], 10);
                    glyph_meta[3] = parseInt(nlist[1], 10);
                    glyph_meta[4] = parseInt(nlist[2], 10);
                    glyph_meta[5] = parseInt(nlist[3], 10);
                    break;
                  case "SWIDTH":
                    nlist = value.split(" ");
                    glyph_meta[6] = parseInt(nlist[0], 10);
                    glyph_meta[7] = parseInt(nlist[1], 10);
                    break;
                  case "DWIDTH":
                    nlist = value.split(" ");
                    glyph_meta[8] = parseInt(nlist[0], 10);
                    glyph_meta[9] = parseInt(nlist[1], 10);
                    break;
                  case "SWIDTH1":
                    nlist = value.split(" ");
                    glyph_meta[10] = parseInt(nlist[0], 10);
                    glyph_meta[11] = parseInt(nlist[1], 10);
                    break;
                  case "DWIDTH1":
                    nlist = value.split(" ");
                    glyph_meta[12] = parseInt(nlist[0], 10);
                    glyph_meta[13] = parseInt(nlist[1], 10);
                    break;
                  case "VVECTOR":
                    nlist = PATTERN_VVECTOR_DELIMITER.split(value);
                    glyph_meta[14] = parseInt(nlist[0], 10);
                    glyph_meta[15] = parseInt(nlist[1], 10);
                    break;
                }
              } else {
                if (l === 1) {
                  const key = kvlist[0].trim();
                  switch (key) {
                    case "BITMAP":
                      glyph_bitmap = [];
                      glyph_bitmap_is_on = true;
                      break;
                    case "ENDCHAR":
                      glyph_bitmap_is_on = false;
                      glyph_meta[16] = glyph_bitmap;
                      this.glyphs.set(glyph_codepoint, glyph_meta);
                      glyph_end = true;
                      break;
                    case "ENDFONT":
                      if (glyph_end) {
                        this.__prepare_glyphs_after();
                        return;
                      }
                    default:
                      if (glyph_bitmap_is_on) {
                        glyph_bitmap.push(key);
                      }
                      break;
                  }
                }
              }
            }
          });
        }
        __prepare_glyphs_after() {
          const l = this.glyphs.size;
          if (this.__glyph_count_to_check !== l) {
            if (this.__glyph_count_to_check === null) {
              console.warn("The glyph count next to 'CHARS' keyword does not exist");
            } else {
              console.warn(`The glyph count next to 'CHARS' keyword is ${this.__glyph_count_to_check.toString()}, which does not match the actual glyph count ${l.toString()}`);
            }
          }
        }
        /**
         * Same as `.length()`
         * Returns how many glyphs actually exist in the font.
         *
         * @returns Actual glyph count in the font
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#length}
         */
        get length() {
          return this.glyphs.size;
        }
        /**
         * Similar to `.iterglyphs()`, except it returns an `array` of glyph codepoints instead of an `iterator` of `Glyph` objects.
         *
         * @param order  - Order
         * @param r  - Codepoint range
         *
         * @returns An iterator of the codepoints of glyphs
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#itercps}
         */
        itercps(order, r) {
          const _order = order !== null && order !== void 0 ? order : 1;
          const _r = r !== null && r !== void 0 ? r : null;
          let ret;
          const ks = [...this.glyphs.keys()];
          switch (_order) {
            case 1:
              ret = ks.sort((a, b) => a - b);
              break;
            case 0:
              ret = ks;
              break;
            case 2:
              ret = ks.sort((a, b) => b - a);
              break;
            case -1:
              ret = ks.reverse();
              break;
          }
          if (_r !== null) {
            const f = (cp) => {
              if (typeof _r === "number") {
                return cp < _r;
              } else if (Array.isArray(_r) && _r.length === 2 && typeof _r[0] === "number" && typeof _r[1] === "number") {
                return cp <= _r[1] && cp >= _r[0];
              } else {
                if (Array.isArray(_r) && Array.isArray(_r[0])) {
                  for (const t of _r) {
                    const [t0, t1] = t;
                    if (cp <= t1 && cp >= t0) {
                      return true;
                    }
                  }
                }
                return false;
              }
            };
            ret = ret.filter(f);
          }
          return ret;
        }
        /**
         * Returns an iterator of all the glyphs (as `Glyph` objects) in the font (default) or in the specified codepoint range in the font, sorted by the specified order (or by the ascending codepoint order by default).
         *
         * @param order  - Order
         * @param r  - Codepoint range
         *
         * @returns An iterator of glyphs as `Glyph` objects. Missing glyphs are replaced by `null`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#iterglyphs}
         */
        *iterglyphs(order, r) {
          for (const cp of this.itercps(order, r)) {
            yield this.glyphbycp(cp);
          }
        }
        /**
         * Get a glyph (as Glyph Object) by its codepoint.
         *
         * @param codepoint - Codepoint
         *
         * @returns `Glyph` object, or `null` if the glyph does not exist in the font
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#glyphbycp}
         */
        glyphbycp(codepoint) {
          const b = this.glyphs.get(codepoint);
          if (b === void 0 || b === null) {
            console.warn(`Glyph "${String.fromCodePoint(codepoint)}" (codepoint ${codepoint.toString()}) does not exist in the font. Will return 'null'`);
            return null;
          } else {
            const d = {};
            META_TITLES.forEach((val, i) => {
              setProperty(d, val, b[i]);
            });
            return new Glyph(d, this);
          }
        }
        /**
         * Get a glyph (as `Glyph` object) by its character.
         *
         * @param character - Character
         *
         * @returns `Glyph` object, or `null` if the glyph does not exist in the font
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#glyph}
         */
        glyph(character) {
          const ret = character.codePointAt(0);
          return ret === void 0 ? null : this.glyphbycp(ret);
        }
        /**
         * Check if there is any missing glyph and gets these glyphs' character.
         *
         * @param str - string to check
         *
         * @returns List of missing glyph(s)' characters, or `null` if all the glyphs in your string exist in the font
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#lacksglyphs}
         */
        lacksglyphs(str) {
          const l = [];
          const len = str.length;
          for (let c, i = 0; i < len; i++) {
            c = str[i];
            const cp = c.codePointAt(0);
            if (cp === void 0 || !this.glyphs.has(cp)) {
              l.push(c);
            }
          }
          return l.length !== 0 ? l : null;
        }
        /**
         * Draw the glyphs of the specified codepoints, to a `Bitmap` object.
         *
         * @param cps - Array of codepoints to draw
         * @param options.linelimit - Maximum pixels per line
         * @param options.mode - Mode
         * @param options.direction - Writing direction
         * @param options.usecurrentglyphspacing - Use current glyph spacing
         * @param options.missing - Missing glyph replacement
         *
         * @returns `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#drawcps}
         */
        drawcps(cps, options = {}) {
          var _a, _b, _c, _d, _e, _f, _g;
          const _linelimit = (_a = options.linelimit) !== null && _a !== void 0 ? _a : 512;
          const _mode = (_b = options.mode) !== null && _b !== void 0 ? _b : 1;
          const _direction = (_c = options.direction) !== null && _c !== void 0 ? _c : "lrtb";
          const _usecurrentglyphspacing = (_d = options.usecurrentglyphspacing) !== null && _d !== void 0 ? _d : false;
          const _missing = (_e = options.missing) !== null && _e !== void 0 ? _e : null;
          if (this.headers === void 0) {
            throw new Error("Font is not loaded");
          }
          let align_glyph, align_line = void 0, bitmap = void 0, bitmaplist, cp = void 0, dire_glyph, dire_line, fbbsize = void 0, glyph = void 0, interglyph, interglyph_global, interglyph_str = void 0, interglyph_str2 = void 0, offset = void 0, offsetlist, size, skip, w = void 0;
          const dire = (_f = DIRE_SHORTCUT_MAP[_direction]) !== null && _f !== void 0 ? _f : _direction;
          const dire_glyph_str = dire.slice(0, 2);
          const dire_line_str = dire.slice(2, 4);
          if (dire_glyph_str in DIRE_MAP && dire_line_str in DIRE_MAP) {
            dire_glyph = DIRE_MAP[dire_glyph_str];
            dire_line = DIRE_MAP[dire_line_str];
          } else {
            dire_glyph = 1;
            dire_line = 0;
          }
          if (dire_line === 0 || dire_line === 2) {
            align_glyph = 1;
          } else {
            if (dire_line === 1 || dire_line === -1) {
              align_glyph = 0;
            }
          }
          if (dire_glyph === 1 || dire_glyph === -1) {
            align_line = 1;
          } else {
            if (dire_glyph === 2 || dire_glyph === 0) {
              align_line = 0;
            }
          }
          if (_mode === 1) {
            fbbsize = dire_glyph > 0 ? this.headers["fbbx"] : this.headers["fbby"];
            if (dire_glyph > 0) {
              interglyph_str = "dwx0";
              interglyph_str2 = "dwy0";
            } else {
              interglyph_str = "dwx1";
              interglyph_str2 = "dwy1";
            }
            if (interglyph_str in this.headers) {
              interglyph_global = this.headers[interglyph_str];
            } else {
              if (interglyph_str2 in this.headers) {
                interglyph_global = this.headers[interglyph_str2];
              } else {
                interglyph_global = null;
              }
            }
          }
          const list_of_bitmaplist = [];
          bitmaplist = [];
          const list_of_offsetlist = [];
          offsetlist = [];
          size = 0;
          const append_bitmaplist_and_offsetlist = () => {
            list_of_bitmaplist.push(bitmaplist);
            if (_usecurrentglyphspacing) {
              offsetlist.shift();
            } else {
              offsetlist.pop();
            }
            list_of_offsetlist.push(offsetlist);
          };
          const cpsiter = cps[Symbol.iterator]();
          skip = false;
          while (1) {
            if (skip) {
              skip = false;
            } else {
              cp = (_g = cpsiter.next()) === null || _g === void 0 ? void 0 : _g.value;
              if (cp === void 0) {
                break;
              }
              const glyphTemp = this.glyphbycp(cp);
              if (glyphTemp !== null) {
                glyph = glyphTemp;
              } else {
                if (_missing) {
                  if (_missing instanceof Glyph) {
                    glyph = _missing;
                  } else {
                    glyph = new Glyph(_missing, this);
                  }
                } else {
                  glyph = new Glyph(EMPTY_GLYPH, this);
                }
              }
              bitmap = glyph.draw();
              w = bitmap.width();
              offset = 0;
              if (_mode === 1 && interglyph_str !== void 0 && interglyph_str2 !== void 0) {
                interglyph = glyph.meta[interglyph_str] || glyph.meta[interglyph_str2];
                if (interglyph === void 0 || interglyph === null) {
                  interglyph = interglyph_global;
                }
                if (interglyph !== void 0 && interglyph !== null && fbbsize !== void 0) {
                  offset = interglyph - fbbsize;
                }
              }
            }
            if (w !== void 0 && offset !== void 0 && bitmap !== void 0 && glyph !== void 0 && cp !== void 0) {
              size += w + offset;
              if (size <= _linelimit) {
                bitmaplist.push(bitmap);
                offsetlist.push(offset);
              } else {
                if (bitmaplist.length === 0) {
                  throw new Error(`\`_linelimit\` (${_linelimit}) is too small the line can't even contain one glyph: "${glyph.chr()}" (codepoint ${cp}, width: ${w})`);
                }
                append_bitmaplist_and_offsetlist();
                size = 0;
                bitmaplist = [];
                offsetlist = [];
                skip = true;
              }
            }
          }
          if (bitmaplist.length !== 0) {
            append_bitmaplist_and_offsetlist();
          }
          const list_of_bitmap_line_lists = list_of_bitmaplist.map((bitmaplist2, i) => Bitmap.concatall(bitmaplist2, {
            direction: dire_glyph,
            align: align_glyph,
            offsetlist: list_of_offsetlist[i]
          }));
          return Bitmap.concatall(list_of_bitmap_line_lists, {
            direction: dire_line,
            align: align_line
          });
        }
        /**
         * Draw (render) the glyphs of the specified words / setences / paragraphs (as a `string`), to a `Bitmap` object.
         *
         * @param str - String to draw
         * @param options.linelimit - Maximum pixels per line
         * @param options.mode - Mode
         * @param options.direction - Writing direction
         * @param options.usecurrentglyphspacing - Use current glyph spacing
         * @param options.missing - Missing glyph replacement
         *
         * @returns `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#draw}
         */
        draw(str, options = {}) {
          const { linelimit, mode, direction, usecurrentglyphspacing, missing } = options;
          return this.drawcps(str.split("").map((c) => {
            const cp = c.codePointAt(0);
            if (cp === void 0) {
              return 8203;
            } else {
              return cp;
            }
          }), {
            linelimit,
            mode,
            direction,
            usecurrentglyphspacing,
            missing
          });
        }
        /**
         * Draw all the glyphs in the font (default) or in the specified codepoint range in the font, sorted by the specified order (or by the ascending codepoint order by default), to a `Bitmap` object.
         *
         * @param options.order - Order
         * @param options.r - Codepoint range
         * @param options.linelimit - Maximum pixels per line
         * @param options.mode - Mode
         * @param options.direction - Writing direction
         * @param options.usecurrentglyphspacing - Use current glyph spacing
         *
         * @returns `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/font#drawall}
         */
        drawall(options = {}) {
          const { order, r, linelimit, mode, direction, usecurrentglyphspacing } = options;
          const _mode = mode !== null && mode !== void 0 ? mode : 0;
          return this.drawcps(this.itercps(order, r), {
            linelimit,
            mode: _mode,
            direction,
            usecurrentglyphspacing
          });
        }
      };
      Glyph = class {
        /**
         * `Glyph` object constructor
         *
         * @param meta_obj - Meta information
         * @param font - The font the glyph belongs to
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph}
         */
        constructor(meta_obj, font) {
          this.meta = meta_obj;
          this.font = font;
        }
        /**
         * Gets a human-readable (multi-line) `string` representation of the `Glyph` object.
         *
         * @returns String representation
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#tostring}
         */
        toString() {
          return this.draw().toString();
        }
        /**
         * Gets a programmer-readable `string` representation of the `Glyph` object.
         *
         * @returns String representation
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#repr}
         */
        repr() {
          var _a;
          return "Glyph(" + JSON.stringify(this.meta, null, 2) + ", Font(<" + ((_a = this.font.headers) === null || _a === void 0 ? void 0 : _a.fontname) + ">)";
        }
        /**
         * Get the codepoint of the glyph.
         *
         * @returns Codepoint of the glyph
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#cp}
         */
        cp() {
          return this.meta["codepoint"];
        }
        /**
         * Get the character of the glyph.
         *
         * @returns Character (one character string) of the glyph
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#chr}
         */
        chr() {
          return String.fromCodePoint(this.cp());
        }
        /**
         * Draw the glyph to a `Bitmap` object.
         *
         * @param mode - Mode
         * @param bb - Bounding box
         *
         * @returns `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#draw}
         */
        draw(mode, bb) {
          const _mode = mode !== null && mode !== void 0 ? mode : 0;
          const _bb = bb !== null && bb !== void 0 ? bb : null;
          let retbitmap;
          switch (_mode) {
            case 0:
              retbitmap = this.__draw_fbb();
              break;
            case 1:
              retbitmap = this.__draw_bb();
              break;
            case 2:
              retbitmap = this.__draw_original();
              break;
            case -1:
              if (_bb !== null) {
                retbitmap = this.__draw_user_specified(_bb);
              } else {
                throw new Error("Parameter bb in draw() method must be set when mode=-1");
              }
              break;
          }
          return retbitmap;
        }
        __draw_user_specified(fbb) {
          const bbxoff = this.meta["bbxoff"];
          const bbyoff = this.meta["bbyoff"];
          const [fbbx, fbby, fbbxoff, fbbyoff] = fbb;
          const bitmap = this.__draw_bb();
          return bitmap.crop(fbbx, fbby, -bbxoff + fbbxoff, -bbyoff + fbbyoff);
        }
        __draw_original() {
          return new Bitmap(this.meta["hexdata"].map((val) => val ? parseInt(val, 16).toString(2).padStart(val.length * 4, "0") : ""));
        }
        __draw_bb() {
          const bbw = this.meta["bbw"];
          const bbh = this.meta["bbh"];
          const bitmap = this.__draw_original();
          const bindata = bitmap.bindata;
          const l = bindata.length;
          if (l !== bbh) {
            console.warn(`Glyph "${this.meta["glyphname"].toString()}" (codepoint ${this.meta["codepoint"].toString()})'s bbh, ${bbh.toString()}, does not match its hexdata line count, ${l.toString()}`);
          }
          bitmap.bindata = bindata.map((val) => val.slice(0, bbw));
          return bitmap;
        }
        __draw_fbb() {
          const fh = this.font.headers;
          if (fh === void 0) {
            throw new Error("Font is not loaded");
          }
          return this.__draw_user_specified([
            fh["fbbx"],
            fh["fbby"],
            fh["fbbxoff"],
            fh["fbbyoff"]
          ]);
        }
        /**
         * Get the relative position (displacement) of the origin from the left bottom corner of the bitmap drawn by the method `.draw()`, or vice versa.
         *
         * @param options.mode - Mode
         * @param options.fromorigin - From or to the origin
         * @param options.xoff - X offset
         * @param options.yoff - Y offset
         *
         * @returns The relative position (displacement) represented by `[x, y]` array / tuple (where right and top directions are positive)
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/glyph#origin}
         */
        origin(options = {}) {
          var _a, _b, _c, _d;
          const _mode = (_a = options.mode) !== null && _a !== void 0 ? _a : 0;
          const _fromorigin = (_b = options.fromorigin) !== null && _b !== void 0 ? _b : false;
          const _xoff = (_c = options.xoff) !== null && _c !== void 0 ? _c : null;
          const _yoff = (_d = options.yoff) !== null && _d !== void 0 ? _d : null;
          let ret;
          const bbxoff = this.meta["bbxoff"];
          const bbyoff = this.meta["bbyoff"];
          switch (_mode) {
            case 0:
              const fh = this.font.headers;
              if (fh === void 0) {
                throw new Error("Font is not loaded");
              }
              ret = [fh["fbbxoff"], fh["fbbyoff"]];
              break;
            case 1:
              ret = [bbxoff, bbyoff];
              break;
            case 2:
              ret = [bbxoff, bbyoff];
              break;
            case -1:
              if (_xoff !== null && _yoff !== null) {
                ret = [_xoff, _yoff];
              } else {
                throw new Error("Parameter xoff and yoff in origin() method must be all set when mode=-1");
              }
              break;
          }
          return _fromorigin ? ret : [0 - ret[0], 0 - ret[1]];
        }
      };
      Bitmap = class _Bitmap {
        /**
         * Initialize a `Bitmap` object. Load binary bitmap data (`array` of `string`s).
         *
         * @param bin_bitmap_list - Binary bitmap data
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap}
         */
        constructor(bin_bitmap_list) {
          this.bindata = bin_bitmap_list;
        }
        /**
         * Gets a human-readable (multi-line) `string` representation of the `Bitmap` object.
         *
         * @returns String representation
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#tostring}
         */
        toString() {
          return this.bindata.join("\n").replace(/0/g, ".").replace(/1/g, "#").replace(/2/g, "&");
        }
        /**
         * Gets a programmer-readable (multi-line) `string` representation of the `Bitmap` object.
         *
         * @returns String representation
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#repr}
         */
        repr() {
          return `Bitmap(${JSON.stringify(this.bindata, null, 2)})`;
        }
        /**
         * Get the width of the bitmap.
         *
         * @returns Width of the bitmap
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#width}
         */
        width() {
          return this.bindata[0].length;
        }
        /**
         * Get the height of the bitmap.
         *
         * @returns Height of the bitmap
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#height}
         */
        height() {
          return this.bindata.length;
        }
        /**
         * Get a deep copy / clone of the `Bitmap` object.
         *
         * @returns A deep copy of the original `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#clone}
         */
        clone() {
          return new _Bitmap([...this.bindata]);
        }
        static __crop_string(s, start, length) {
          let stemp = s;
          const l = s.length;
          let left = 0;
          if (start < 0) {
            left = 0 - start;
            stemp = stemp.padStart(left + l, "0");
          }
          if (start + length > l) {
            stemp = stemp.padEnd(start + length - l + stemp.length, "0");
          }
          const newstart = start + left;
          return stemp.slice(newstart, newstart + length);
        }
        static __string_offset_concat(s1, s2, offset) {
          const _offset = offset !== null && offset !== void 0 ? offset : 0;
          if (_offset === 0) {
            return s1 + s2;
          }
          const len1 = s1.length;
          const len2 = s2.length;
          const s2start = len1 + _offset;
          const s2end = s2start + len2;
          const finalstart = Math.min(0, s2start);
          const finalend = Math.max(len1, s2end);
          const news1 = _Bitmap.__crop_string(s1, finalstart, finalend - finalstart);
          const news2 = _Bitmap.__crop_string(s2, finalstart - s2start, finalend - finalstart);
          return news1.split("").map((val, i) => (parseInt(news2[i], 10) || parseInt(val, 10)).toString()).join("");
        }
        static __listofstr_offset_concat(list1, list2, offset) {
          const _offset = offset !== null && offset !== void 0 ? offset : 0;
          let s1, s2;
          if (_offset === 0) {
            return list1.concat(list2);
          }
          const width = list1[0].length;
          const len1 = list1.length;
          const len2 = list2.length;
          const s2start = len1 + _offset;
          const s2end = s2start + len2;
          const finalstart = Math.min(0, s2start);
          const finalend = Math.max(len1, s2end);
          const retlist = [];
          for (let i = finalstart; i < finalend; i++) {
            if (i < 0 || i >= len1) {
              s1 = "0".repeat(width);
            } else {
              s1 = list1[i];
            }
            if (i < s2start || i >= s2end) {
              s2 = "0".repeat(width);
            } else {
              s2 = list2[i - s2start];
            }
            retlist.push(s1.split("").map((val, i2) => (parseInt(s2[i2], 10) || parseInt(val, 10)).toString()).join(""));
          }
          return retlist;
        }
        static __crop_bitmap(bitmap, w, h, xoff, yoff) {
          let bn;
          const retlist = [];
          const l = bitmap.length;
          for (let n = 0; n < h; n++) {
            bn = l - yoff - h + n;
            if (bn < 0 || bn >= l) {
              retlist.push("0".repeat(w));
            } else {
              retlist.push(_Bitmap.__crop_string(bitmap[bn], xoff, w));
            }
          }
          return retlist;
        }
        /**
         * Crop and/or extend the bitmap.
         *
         * @param w - Width
         * @param h - Height
         * @param xoff - X offset
         * @param yoff - Y offset
         *
         * @returns The `Bitmap` object itself, which now has only the specified area as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#crop}
         */
        crop(w, h, xoff, yoff) {
          const _xoff = xoff !== null && xoff !== void 0 ? xoff : 0;
          const _yoff = yoff !== null && yoff !== void 0 ? yoff : 0;
          this.bindata = _Bitmap.__crop_bitmap(this.bindata, w, h, _xoff, _yoff);
          return this;
        }
        /**
         * Overlay another bitmap over the current one.
         *
         * @param bitmap - The incoming bitmap to overlay over the current one
         *
         * @returns The `Bitmap` object itself, which now has the combined bitmap as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#overlay}
         */
        overlay(bitmap) {
          const bindata_a = this.bindata;
          const bindata_b = bitmap.bindata;
          if (bindata_a.length !== bindata_b.length) {
            console.warn("the bitmaps to overlay have different height");
          }
          if (bindata_a[0].length !== bindata_b[0].length) {
            console.warn("the bitmaps to overlay have different width");
          }
          this.bindata = bindata_a.map((val, li) => {
            const la = val;
            const lb = bindata_b[li];
            return la.split("").map((val2, i) => (parseInt(lb[i], 10) || parseInt(val2, 10)).toString()).join("");
          });
          return this;
        }
        /**
         * Concatenate all `Bitmap` objects in an `array`.
         *
         * @param bitmaplist - List of bitmaps to concatenate
         * @param options.direction - Direction
         * @param options.align - Align
         * @param options.offsetlist - List of spacing offsets between every two glyphs
         *
         * @returns `Bitmap` object
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#bitmapconcatall}
         */
        static concatall(bitmaplist, options = {}) {
          var _a, _b, _c;
          const _direction = (_a = options.direction) !== null && _a !== void 0 ? _a : 1;
          const _align = (_b = options.align) !== null && _b !== void 0 ? _b : 1;
          const _offsetlist = (_c = options.offsetlist) !== null && _c !== void 0 ? _c : null;
          let bd, ireal, maxsize, offset, ret, w, xoff;
          if (_direction > 0) {
            maxsize = Math.max(...bitmaplist.map((val) => val.height()));
            ret = Array(maxsize).fill("");
            const stroffconcat = (s1, s2, offset2) => {
              if (_direction === 1) {
                return _Bitmap.__string_offset_concat(s1, s2, offset2);
              } else {
                return _Bitmap.__string_offset_concat(s2, s1, offset2);
              }
            };
            for (let i = 0; i < maxsize; i++) {
              if (_align) {
                ireal = -i - 1;
              } else {
                ireal = i;
              }
              offset = 0;
              const bl = bitmaplist.length;
              for (let bi = 0; bi < bl; bi++) {
                const bitmap = bitmaplist[bi];
                if (_offsetlist && bi !== 0) {
                  offset = _offsetlist[bi - 1];
                }
                if (i < bitmap.height()) {
                  if (ireal >= 0) {
                    ret[ireal] = stroffconcat(ret[ireal], bitmap.bindata[ireal], offset);
                  } else {
                    ret[maxsize + ireal] = stroffconcat(ret[maxsize + ireal], bitmap.bindata[bitmap.height() + ireal], offset);
                  }
                } else {
                  if (ireal >= 0) {
                    ret[ireal] = stroffconcat(ret[ireal], "0".repeat(bitmap.width()), offset);
                  } else {
                    ret[maxsize + ireal] = stroffconcat(ret[maxsize + ireal], "0".repeat(bitmap.width()), offset);
                  }
                }
              }
            }
          } else {
            maxsize = Math.max(...bitmaplist.map((val) => val.width()));
            ret = [];
            offset = 0;
            const bl = bitmaplist.length;
            for (let bi = 0; bi < bl; bi++) {
              const bitmap = bitmaplist[bi];
              if (_offsetlist && bi !== 0) {
                offset = _offsetlist[bi - 1];
              }
              bd = bitmap.bindata;
              w = bitmap.width();
              if (w !== maxsize) {
                if (_align) {
                  xoff = 0;
                } else {
                  xoff = w - maxsize;
                }
                bd = this.__crop_bitmap(bd, maxsize, bitmap.height(), xoff, 0);
              }
              if (_direction === 0) {
                ret = _Bitmap.__listofstr_offset_concat(ret, bd, offset);
              } else {
                ret = _Bitmap.__listofstr_offset_concat(bd, ret, offset);
              }
            }
          }
          return new this(ret);
        }
        /**
         * Concatenate another `Bitmap` objects to the current one.
         *
         * @param bitmap - Bitmap to concatenate
         * @param options.direction - Direction
         * @param options.align - Align
         * @param options.offset - Spacing offset between the glyphs
         *
         * @returns The `Bitmap` object itself, which now has the combined bitmap as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#concat}
         */
        concat(bitmap, options = {}) {
          const { direction, align, offset } = options;
          const _offset = offset !== null && offset !== void 0 ? offset : 0;
          this.bindata = _Bitmap.concatall([this, bitmap], {
            direction,
            align,
            offsetlist: [_offset]
          }).bindata;
          return this;
        }
        static __enlarge_bindata(bindata, x, y) {
          const _x = x !== null && x !== void 0 ? x : 1;
          const _y = y !== null && y !== void 0 ? y : 1;
          let ret = [...bindata];
          if (_x > 1) {
            ret = ret.map((v) => v.split("").reduce((acc, cur) => {
              return acc.concat(Array(_x).fill(cur));
            }, []).join(""));
          }
          if (_y > 1) {
            ret = ret.reduce((acc, cur) => {
              return acc.concat(Array(_y).fill(cur));
            }, []);
          }
          return ret;
        }
        /**
         * Enlarge a `Bitmap` object, by multiplying every pixel in x (right) direction and in y (top) direction.
         *
         * @param x - Multiplier in x (right) direction
         * @param y - Multiplier in y (top) direction
         *
         * @returns The `Bitmap` object itself, which now has the enlarged bitmap as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#enlarge}
         */
        enlarge(x, y) {
          this.bindata = _Bitmap.__enlarge_bindata(this.bindata, x, y);
          return this;
        }
        /**
         * Replace a string by another in the bitmap.
         *
         * @param substr - Substring to be replaced
         * @param newsubstr - New substring as the replacement
         *
         * @returns The `Bitmap` object itself, which now has the altered bitmap as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#replace}
         */
        replace(substr, newsubstr) {
          const _substr = typeof substr === "number" ? substr.toString() : substr;
          const _newsubstr = typeof newsubstr === "number" ? newsubstr.toString() : newsubstr;
          const replaceAll = (str, substr2, newsubstr2) => {
            if ("replaceAll" in String.prototype) {
              return str.replaceAll(substr2, newsubstr2);
            } else {
              const escapeRegExp2 = (s) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
              return str.replace(new RegExp(escapeRegExp2(substr2), "g"), newsubstr2);
            }
          };
          this.bindata = this.bindata.map((val) => replaceAll(val, _substr, _newsubstr));
          return this;
        }
        /**
         * Add shadow to the shape in the bitmap.
         *
         * The shadow will be filled by `'2'`s.
         *
         * @param xoff - Shadow's offset in x (right) direction
         * @param yoff - Shadow's offset in y (top) direction
         *
         * @returns The `Bitmap` object itself, which now has a bitmap of the original shape with its shadow as the `Bitmap` object's `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#shadow}
         */
        shadow(xoff, yoff) {
          const _xoff = xoff !== null && xoff !== void 0 ? xoff : 1;
          const _yoff = yoff !== null && yoff !== void 0 ? yoff : -1;
          let h, resized_xoff, resized_yoff, shadow_xoff, shadow_yoff, w;
          const bitmap_shadow = this.clone();
          w = this.width();
          h = this.height();
          w += Math.abs(_xoff);
          h += Math.abs(_yoff);
          bitmap_shadow.bindata = bitmap_shadow.bindata.map((val) => val.replace(/1/g, "2"));
          if (_xoff > 0) {
            resized_xoff = 0;
            shadow_xoff = -_xoff;
          } else {
            resized_xoff = _xoff;
            shadow_xoff = 0;
          }
          if (_yoff > 0) {
            resized_yoff = 0;
            shadow_yoff = -_yoff;
          } else {
            resized_yoff = _yoff;
            shadow_yoff = 0;
          }
          this.crop(w, h, resized_xoff, resized_yoff);
          bitmap_shadow.crop(w, h, shadow_xoff, shadow_yoff);
          bitmap_shadow.overlay(this);
          this.bindata = bitmap_shadow.bindata;
          return this;
        }
        /**
         * Add glow effect to the shape in the bitmap.
         *
         * The glowing area is one pixel up, right, bottom and left to the original pixels (corners will not be filled in default mode 0 but will in mode 1), and will be filled by `'2'`s.
         *
         * @param mode - Mode
         *
         * @returns The `Bitmap` object itself, which now has a bitmap of the original shape with glow effect as the `Bitmap` object's `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#glow}
         */
        glow(mode) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
          const _mode = mode !== null && mode !== void 0 ? mode : 0;
          let line, pixel, w, h;
          w = this.width();
          h = this.height();
          w += 2;
          h += 2;
          this.crop(w, h, -1, -1);
          const b = this.todata(2);
          const bl = b.length;
          for (let i_line = 0; i_line < bl; i_line++) {
            line = b[i_line];
            const ll = line.length;
            for (let i_pixel = 0; i_pixel < ll; i_pixel++) {
              pixel = line[i_pixel];
              if (pixel === 1) {
                (_a = b[i_line])[_b = i_pixel - 1] || (_a[_b] = 2);
                (_c = b[i_line])[_d = i_pixel + 1] || (_c[_d] = 2);
                (_e = b[i_line - 1])[i_pixel] || (_e[i_pixel] = 2);
                (_f = b[i_line + 1])[i_pixel] || (_f[i_pixel] = 2);
                if (_mode === 1) {
                  (_g = b[i_line - 1])[_h = i_pixel - 1] || (_g[_h] = 2);
                  (_j = b[i_line - 1])[_k = i_pixel + 1] || (_j[_k] = 2);
                  (_l = b[i_line + 1])[_m = i_pixel - 1] || (_l[_m] = 2);
                  (_o = b[i_line + 1])[_p = i_pixel + 1] || (_o[_p] = 2);
                }
              }
            }
          }
          this.bindata = b.map((l) => l.map((val) => val.toString()).join(""));
          return this;
        }
        /**
         * Pad each line (row) to multiple of 8 (or other numbers) bits/pixels, with `'0'`s.
         *
         * Do this before using the bitmap for a glyph in a BDF font.
         *
         * @param bits - Each line should be padded to multiple of how many bits/pixels
         *
         * @returns The `Bitmap` object itself, which now has the altered bitmap as its `.bindata`
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#bytepad}
         */
        bytepad(bits) {
          const _bits = bits !== null && bits !== void 0 ? bits : 8;
          const w = this.width();
          const h = this.height();
          const mod = w % _bits;
          if (mod === 0) {
            return this;
          }
          return this.crop(w + _bits - mod, h);
        }
        /**
         * Get the bitmap's data in the specified type and format.
         *
         * @param datatype - Output data type
         *
         * @returns Bitmap data in the specified type (list or string) and format
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#todata}
         */
        todata(datatype) {
          const _datatype = datatype !== null && datatype !== void 0 ? datatype : 1;
          let ret;
          switch (_datatype) {
            case 0:
              ret = this.bindata.join("\n");
              break;
            case 1:
              ret = this.bindata;
              break;
            case 2:
              ret = this.bindata.map((l) => l.split("").map((s) => parseInt(s, 10)));
              break;
            case 3:
              ret = [].concat(...this.todata(2));
              break;
            case 4:
              ret = this.bindata.map((s) => {
                if (!/^[01]+$/.test(s)) {
                  throw new Error(`Invalid binary string: ${s}`);
                }
                return parseInt(s, 2).toString(16).padStart(Math.floor(-1 * this.width() / 4) * -1, "0");
              });
              break;
            case 5:
              ret = this.bindata.map((s) => {
                if (!/^[01]+$/.test(s)) {
                  throw new Error(`Invalid binary string: ${s}`);
                }
                return parseInt(s, 2);
              });
              break;
          }
          return ret;
        }
        /**
         * Draw the bitmap to HTML canvas
         *
         * @param context - Canvas 2D context (`canvas.getContext("2d")`)
         * @param pixelcolors - Object mapping `'0'`/`'1'`/`'2'` in the bitmap data to color
         *
         * @returns The `Bitmap` object itself
         *
         * @see online docs: {@link https://font.tomchen.org/bdfparser_js/bitmap#draw2canvas}
         */
        draw2canvas(context, pixelcolors) {
          const _pixelcolors = pixelcolors !== null && pixelcolors !== void 0 ? pixelcolors : {
            "0": null,
            "1": "black",
            "2": "red"
          };
          this.todata(2).forEach((line, y) => {
            line.forEach((pixel, x) => {
              const s = pixel.toString();
              if (s === "0" || s === "1" || s === "2") {
                const color = _pixelcolors[s];
                if (color !== null && color !== void 0) {
                  context.fillStyle = color;
                  context.fillRect(x, y, 1, 1);
                }
              }
            });
          });
          return this;
        }
      };
      $Font = (filelines) => __awaiter(void 0, void 0, void 0, function* () {
        return yield new Font().load_filelines(filelines);
      });
      $Glyph = (meta_obj, font) => {
        return new Glyph(meta_obj, font);
      };
      $Bitmap = (bin_bitmap_list) => {
        return new Bitmap(bin_bitmap_list);
      };
    }
  });

  // node_modules/react-pixel-display/dist/index-Cl4FejWM.js
  var index_Cl4FejWM_exports = {};
  __export(index_Cl4FejWM_exports, {
    default: () => fetchline
  });
  function fetchline(filepath, { includeLastEmptyLine = true, encoding = "utf-8", delimiter = /\r?\n/g } = {}) {
    return __asyncGenerator(this, arguments, function* fetchline_1() {
      const reader = yield __await(getChunkIteratorFetch(filepath));
      let { value: chunk, done: readerDone } = yield __await(reader.read());
      const decoder = new TextDecoder(encoding);
      let chunkStr = chunk ? decoder.decode(chunk) : "";
      let re;
      if (typeof delimiter === "string") {
        if (delimiter === "") {
          throw new Error("delimiter cannot be empty string!");
        }
        re = new RegExp(escapeRegExp(delimiter), "g");
      } else if (/g/.test(delimiter.flags) === false) {
        re = new RegExp(delimiter.source, delimiter.flags + "g");
      } else {
        re = delimiter;
      }
      let startIndex = 0;
      while (1) {
        const result = re.exec(chunkStr);
        if (result === null) {
          if (readerDone === true) {
            break;
          }
          const remainder = chunkStr.substring(startIndex);
          ({ value: chunk, done: readerDone } = yield __await(reader.read()));
          chunkStr = remainder + (chunkStr ? decoder.decode(chunk) : "");
          startIndex = 0;
          continue;
        }
        yield yield __await(chunkStr.substring(startIndex, result.index));
        startIndex = re.lastIndex;
      }
      if (includeLastEmptyLine || startIndex < chunkStr.length) {
        yield yield __await(chunkStr.substring(startIndex));
      }
    });
  }
  var __awaiter2, __await, __asyncGenerator, escapeRegExp, getChunkIteratorFetch;
  var init_index_Cl4FejWM = __esm({
    "node_modules/react-pixel-display/dist/index-Cl4FejWM.js"() {
      __awaiter2 = function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      __await = function(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
      };
      __asyncGenerator = function(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
          throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
          return this;
        }, i;
        function verb(n) {
          if (g[n])
            i[n] = function(v) {
              return new Promise(function(a, b) {
                q.push([n, v, a, b]) > 1 || resume(n, v);
              });
            };
        }
        function resume(n, v) {
          try {
            step(g[n](v));
          } catch (e) {
            settle(q[0][3], e);
          }
        }
        function step(r) {
          r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
        }
        function fulfill(value) {
          resume("next", value);
        }
        function reject(value) {
          resume("throw", value);
        }
        function settle(f, v) {
          if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]);
        }
      };
      escapeRegExp = (s) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
      getChunkIteratorFetch = (filepath) => __awaiter2(void 0, void 0, void 0, function* () {
        const res = yield fetch(filepath);
        if (res.body === null) {
          throw new Error("Cannot read file");
        }
        return res.body.getReader();
      });
    }
  });

  // src/version.js
  var CARD_VERSION = "2.11.1";

  // src/state.js
  var IPIXEL_STORAGE_KEY = "iPIXEL_DisplayState";
  var IPIXEL_TEST_MODE_KEY = "iPIXEL_TestMode";
  var DEFAULT_STATE = {
    text: "",
    mode: "text",
    effect: "fixed",
    speed: 50,
    fgColor: "#ff6600",
    bgColor: "#000000",
    font: "VCR_OSD_MONO",
    lastUpdate: 0
  };
  function loadDisplayState() {
    try {
      const saved = localStorage.getItem(IPIXEL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("iPIXEL: Could not load saved state", e);
    }
    return { ...DEFAULT_STATE };
  }
  function saveDisplayState(state) {
    try {
      localStorage.setItem(IPIXEL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("iPIXEL: Could not save state", e);
    }
  }
  if (!window.iPIXELDisplayState) {
    window.iPIXELDisplayState = loadDisplayState();
  }
  function getDisplayState() {
    return window.iPIXELDisplayState;
  }
  function updateDisplayState(updates) {
    window.iPIXELDisplayState = {
      ...window.iPIXELDisplayState,
      ...updates,
      lastUpdate: Date.now()
    };
    saveDisplayState(window.iPIXELDisplayState);
    window.dispatchEvent(new CustomEvent("ipixel-display-update", {
      detail: window.iPIXELDisplayState
    }));
    return window.iPIXELDisplayState;
  }
  function isTestMode() {
    if (window.iPIXELTestMode !== void 0)
      return window.iPIXELTestMode;
    try {
      return localStorage.getItem(IPIXEL_TEST_MODE_KEY) === "true";
    } catch (e) {
      return false;
    }
  }
  function setTestMode(enabled) {
    window.iPIXELTestMode = enabled;
    try {
      localStorage.setItem(IPIXEL_TEST_MODE_KEY, String(enabled));
    } catch (e) {
    }
    window.dispatchEvent(new CustomEvent("ipixel-test-mode-change", { detail: { enabled } }));
  }
  function detectMissingFeatures() {
    const missing = [];
    if (typeof navigator !== "undefined" && !navigator.bluetooth) {
      missing.push("WebBluetooth");
    }
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("2d"))
        missing.push("Canvas");
    } catch (e) {
      missing.push("Canvas");
    }
    return missing;
  }

  // src/base.js
  var iPIXELCardBase = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = {};
      this._hass = null;
      this._handleTestModeChange = () => this.render();
      window.addEventListener("ipixel-test-mode-change", this._handleTestModeChange);
    }
    disconnectedCallback() {
      window.removeEventListener("ipixel-test-mode-change", this._handleTestModeChange);
    }
    set hass(hass) {
      this._hass = hass;
      this.render();
    }
    setConfig(config) {
      if (!config.entity && !isTestMode()) {
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
      if (!this._hass || !this._config.entity)
        return null;
      return this._hass.states[this._config.entity];
    }
    getRelatedEntity(domain, suffix = "") {
      if (!this._hass || !this._config.entity)
        return null;
      const baseName = this._config.entity.replace(/^[^.]+\./, "").replace(/_?(text|display|gif_url)$/i, "");
      const exactId = `${domain}.${baseName}${suffix}`;
      if (this._hass.states[exactId])
        return this._hass.states[exactId];
      const matches = Object.keys(this._hass.states).filter((id) => {
        if (!id.startsWith(`${domain}.`))
          return false;
        const entityName = id.replace(/^[^.]+\./, "");
        return entityName.includes(baseName) || baseName.includes(entityName.replace(suffix, ""));
      });
      if (suffix) {
        const withSuffix = matches.find((id) => id.endsWith(suffix));
        if (withSuffix)
          return this._hass.states[withSuffix];
      } else {
        const sorted = matches.sort((a, b) => a.length - b.length);
        if (sorted.length > 0)
          return this._hass.states[sorted[0]];
      }
      return matches.length > 0 ? this._hass.states[matches[0]] : null;
    }
    async callService(domain, service, data = {}) {
      if (!this._hass)
        return;
      if (this.isInTestMode()) {
        console.info(`iPIXEL [Test Mode]: ${domain}.${service}`, data);
      }
      try {
        await this._hass.callService(domain, service, data);
      } catch (err) {
        console.error(`iPIXEL service call failed: ${domain}.${service}`, err);
      }
    }
    getResolution() {
      const widthEntity = this.getRelatedEntity("sensor", "_width") || this._hass?.states["sensor.display_width"];
      const heightEntity = this.getRelatedEntity("sensor", "_height") || this._hass?.states["sensor.display_height"];
      if (widthEntity && heightEntity) {
        const w = parseInt(widthEntity.state), h = parseInt(heightEntity.state);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0)
          return [w, h];
      }
      return [64, 16];
    }
    isOn() {
      if (this.isInTestMode())
        return true;
      return this.getRelatedEntity("switch")?.state === "on";
    }
    hexToRgb(hex) {
      const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 255, 255];
    }
    render() {
    }
    getCardSize() {
      return 2;
    }
  };

  // src/styles.js
  var iPIXELCardStyles = `
  :host {
    --ipixel-primary: var(--primary-color, #03a9f4);
    --ipixel-accent: var(--accent-color, #ff9800);
    --ipixel-text: var(--primary-text-color, #fff);
    --ipixel-bg: var(--ha-card-background, #1c1c1c);
    --ipixel-border: var(--divider-color, #333);
  }

  .card-content { padding: 16px; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 1.1em;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4caf50;
  }
  .status-dot.off { background: #f44336; }
  .status-dot.unavailable { background: #9e9e9e; }

  .section-title {
    font-size: 0.85em;
    font-weight: 500;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .control-row { margin-bottom: 12px; }

  /* Buttons */
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 500;
    transition: all 0.2s;
  }
  .btn-primary { background: var(--ipixel-primary); color: #fff; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-secondary {
    background: rgba(255,255,255,0.1);
    color: var(--ipixel-text);
    border: 1px solid var(--ipixel-border);
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.15); }
  .btn-danger { background: #f44336; color: #fff; }
  .btn-success { background: #4caf50; color: #fff; }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.1);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    color: inherit;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.15); }
  .icon-btn.active {
    background: rgba(3, 169, 244, 0.3);
    border-color: var(--ipixel-primary);
  }
  .icon-btn svg { width: 20px; height: 20px; fill: currentColor; }

  /* Slider */
  .slider-row { display: flex; align-items: center; gap: 12px; }
  .slider-label { min-width: 70px; font-size: 0.85em; }
  .slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right,
      var(--ipixel-primary) 0%,
      var(--ipixel-primary) var(--value, 50%),
      rgba(255,255,255,0.25) var(--value, 50%),
      rgba(255,255,255,0.25) 100%);
    outline: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
  }
  .slider-value { min-width: 40px; text-align: right; font-size: 0.85em; font-weight: 500; }

  /* Dropdown */
  .dropdown {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    cursor: pointer;
  }

  /* Input */
  .text-input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    box-sizing: border-box;
  }
  .text-input:focus { outline: none; border-color: var(--ipixel-primary); }

  /* Button Grid */
  .button-grid { display: grid; gap: 8px; }
  .button-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .button-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .button-grid-2 { grid-template-columns: repeat(2, 1fr); }

  /* Mode buttons */
  .mode-btn {
    padding: 10px 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    font-size: 0.8em;
    color: inherit;
    transition: all 0.2s;
  }
  .mode-btn:hover { background: rgba(255,255,255,0.12); }
  .mode-btn.active { background: rgba(3, 169, 244, 0.25); border-color: var(--ipixel-primary); }

  /* Color picker */
  .color-row { display: flex; align-items: center; gap: 12px; }
  .color-picker {
    width: 40px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--ipixel-border);
    border-radius: 4px;
    cursor: pointer;
    background: none;
  }

  /* List items */
  .list-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    margin-bottom: 8px;
    gap: 12px;
  }
  .list-item:last-child { margin-bottom: 0; }
  .list-item-info { flex: 1; }
  .list-item-name { font-weight: 500; font-size: 0.9em; }
  .list-item-meta { font-size: 0.75em; opacity: 0.6; margin-top: 2px; }
  .list-item-actions { display: flex; gap: 4px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 24px; opacity: 0.6; font-size: 0.9em; }

  @media (max-width: 400px) {
    .button-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .button-grid-3 { grid-template-columns: repeat(2, 1fr); }
  }

  /* Mobile-friendly touch targets */
  @media (max-width: 600px) {
    .btn { padding: 10px 16px; min-height: 40px; }
    .icon-btn { width: 40px; height: 40px; }
    .slider::-webkit-slider-thumb { width: 24px; height: 24px; }
    .slider::-moz-range-thumb { width: 24px; height: 24px; }
    .dropdown { padding: 10px 12px; }
    .text-input { padding: 12px; }
  }
`;

  // node_modules/react-pixel-display/dist/index-DWEf46Kx.js
  function hexToRgb(hex) {
    if (!hex || hex === "#111" || hex === "#000")
      return [17, 17, 17];
    if (hex === "#050505")
      return [5, 5, 5];
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [17, 17, 17];
  }
  function hsvToRgb(h, s, v) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return [r * 255, g * 255, b * 255];
  }
  var TextEffects = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    init(effectName, state) {
      const { width, height } = this.renderer;
      switch (effectName) {
        case "scroll_ltr":
        case "scroll_rtl":
          state.offset = 0;
          break;
        case "blink":
          state.visible = true;
          break;
        case "snow":
        case "breeze":
          state.phases = [];
          for (let i = 0; i < width * height; i++) {
            state.phases.push(Math.random() * Math.PI * 2);
          }
          break;
        case "laser":
          state.position = 0;
          break;
        case "fade":
          state.opacity = 0;
          state.direction = 1;
          break;
        case "typewriter":
          state.charIndex = 0;
          state.cursorVisible = true;
          break;
        case "bounce":
          state.offset = 0;
          state.direction = 1;
          break;
        case "sparkle":
          state.sparkles = [];
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
    step(effectName, state) {
      const { width, extendedWidth } = this.renderer;
      switch (effectName) {
        case "scroll_ltr":
          state.offset -= 1;
          if (state.offset <= -(extendedWidth || width)) {
            state.offset = width;
          }
          break;
        case "scroll_rtl":
          state.offset += 1;
          if (state.offset >= (extendedWidth || width)) {
            state.offset = -width;
          }
          break;
        case "blink":
          state.visible = !state.visible;
          break;
        case "laser":
          state.position = (state.position + 1) % width;
          break;
        case "fade":
          state.opacity += state.direction * 0.05;
          if (state.opacity >= 1) {
            state.opacity = 1;
            state.direction = -1;
          } else if (state.opacity <= 0) {
            state.opacity = 0;
            state.direction = 1;
          }
          break;
        case "typewriter":
          if (state.tick % 3 === 0) {
            state.charIndex++;
          }
          state.cursorVisible = state.tick % 10 < 5;
          break;
        case "bounce": {
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
        }
        case "sparkle": {
          const sparkles = state.sparkles;
          for (const sparkle of sparkles) {
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
    }
    render(effectName, state, pixels, extendedPixels, extendedWidth) {
      const { width, height } = this.renderer;
      const srcPixels = extendedPixels || pixels || [];
      const displayPixels = pixels || [];
      const srcWidth = extendedWidth || width;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let color;
          let sourceX = x;
          if (effectName === "scroll_ltr" || effectName === "scroll_rtl" || effectName === "bounce") {
            sourceX = x - (state.offset || 0);
            while (sourceX < 0)
              sourceX += srcWidth;
            while (sourceX >= srcWidth)
              sourceX -= srcWidth;
            color = srcPixels[y * srcWidth + sourceX] || "#111";
          } else if (effectName === "typewriter") {
            const charWidth = 6;
            const maxX = (state.charIndex || 0) * charWidth;
            if (x < maxX) {
              color = displayPixels[y * width + x] || "#111";
            } else if (x === maxX && state.cursorVisible) {
              color = "#ffffff";
            } else {
              color = "#111";
            }
          } else {
            color = displayPixels[y * width + x] || "#111";
          }
          let [r, g, b] = hexToRgb(color);
          const isLit = r > 20 || g > 20 || b > 20;
          if (isLit) {
            switch (effectName) {
              case "blink":
                if (!state.visible) {
                  r = g = b = 17;
                }
                break;
              case "snow": {
                const phases = state.phases;
                const phase = (phases == null ? void 0 : phases[y * width + x]) || 0;
                const tick = state.tick || 0;
                const factor = 0.3 + 0.7 * Math.abs(Math.sin(phase + tick * 0.3));
                r *= factor;
                g *= factor;
                b *= factor;
                break;
              }
              case "breeze": {
                const phases = state.phases;
                const phase = (phases == null ? void 0 : phases[y * width + x]) || 0;
                const tick = state.tick || 0;
                const factor = 0.4 + 0.6 * Math.abs(Math.sin(phase + tick * 0.15 + x * 0.2));
                r *= factor;
                g *= factor;
                b *= factor;
                break;
              }
              case "laser": {
                const pos = state.position || 0;
                const dist = Math.abs(x - pos);
                const factor = dist < 3 ? 1 : 0.3;
                r *= factor;
                g *= factor;
                b *= factor;
                break;
              }
              case "fade": {
                const opacity = state.opacity || 1;
                r *= opacity;
                g *= opacity;
                b *= opacity;
                break;
              }
            }
          }
          if (effectName === "sparkle" && state.sparkles) {
            const sparkles = state.sparkles;
            for (const sparkle of sparkles) {
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
  };
  var AmbientEffects = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    init(effectName, state) {
      const { width, height } = this.renderer;
      switch (effectName) {
        case "rainbow":
          state.position = 0;
          break;
        case "matrix": {
          const colorModes = [
            [0, 255, 0],
            [0, 255, 255],
            [255, 0, 255]
          ];
          state.colorMode = colorModes[Math.floor(Math.random() * colorModes.length)];
          state.buffer = [];
          for (let y = 0; y < height; y++) {
            state.buffer.push(
              Array(width).fill(null).map(() => [0, 0, 0])
            );
          }
          break;
        }
        case "plasma":
        case "gradient":
          state.time = 0;
          break;
        case "fire":
          state.heat = [];
          for (let i = 0; i < width * height; i++) {
            state.heat.push(0);
          }
          state.palette = this._createFirePalette();
          break;
        case "water":
          state.current = [];
          state.previous = [];
          for (let i = 0; i < width * height; i++) {
            state.current.push(0);
            state.previous.push(0);
          }
          state.damping = 0.95;
          break;
        case "stars": {
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
        }
        case "confetti":
          state.particles = [];
          for (let i = 0; i < 20; i++) {
            state.particles.push(this._createConfettiParticle(width, height, true));
          }
          break;
        case "plasma_wave":
        case "radial_pulse":
        case "hypnotic":
        case "aurora":
          state.time = 0;
          break;
        case "lava":
          state.time = 0;
          state.noise = [];
          for (let i = 0; i < width * height; i++) {
            state.noise.push(Math.random() * Math.PI * 2);
          }
          break;
      }
    }
    step(effectName, state) {
      const { width, height } = this.renderer;
      switch (effectName) {
        case "rainbow":
          state.position = (state.position + 0.01) % 1;
          break;
        case "matrix":
          this._stepMatrix(state, width, height);
          break;
        case "plasma":
        case "gradient":
          state.time = (state.time || 0) + 0.05;
          break;
        case "fire":
          this._stepFire(state, width, height);
          break;
        case "water":
          this._stepWater(state, width, height);
          break;
        case "stars": {
          const stars = state.stars;
          for (const star of stars) {
            star.phase += star.speed;
          }
          break;
        }
        case "confetti": {
          const particles = state.particles;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y += p.speed;
            p.x += p.drift;
            p.rotation += p.rotationSpeed;
            if (p.y > height) {
              particles[i] = this._createConfettiParticle(width, height, false);
            }
          }
          break;
        }
        case "plasma_wave":
        case "radial_pulse":
        case "hypnotic":
        case "lava":
        case "aurora":
          state.time = (state.time || 0) + 0.03;
          break;
      }
    }
    render(effectName, state) {
      switch (effectName) {
        case "rainbow":
          this._renderRainbow(state);
          break;
        case "matrix":
          this._renderMatrix(state);
          break;
        case "plasma":
          this._renderPlasma(state);
          break;
        case "gradient":
          this._renderGradient(state);
          break;
        case "fire":
          this._renderFire(state);
          break;
        case "water":
          this._renderWater(state);
          break;
        case "stars":
          this._renderStars(state);
          break;
        case "confetti":
          this._renderConfetti(state);
          break;
        case "plasma_wave":
          this._renderPlasmaWave(state);
          break;
        case "radial_pulse":
          this._renderRadialPulse(state);
          break;
        case "hypnotic":
          this._renderHypnotic(state);
          break;
        case "lava":
          this._renderLava(state);
          break;
        case "aurora":
          this._renderAurora(state);
          break;
      }
    }
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
      buffer.pop();
      const newRow = buffer[0].map(([r, g, b]) => [
        r * (1 - fadeAmount),
        g * (1 - fadeAmount),
        b * (1 - fadeAmount)
      ]);
      buffer.unshift(JSON.parse(JSON.stringify(newRow)));
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
      var _a;
      const { width, height } = this.renderer;
      const buffer = state.buffer;
      if (!buffer)
        return;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const [r, g, b] = ((_a = buffer[y]) == null ? void 0 : _a[x]) || [0, 0, 0];
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
      for (let i = 0; i < width * height; i++) {
        heat[i] = Math.max(0, heat[i] - Math.random() * 10);
      }
      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const below = (y + 1) * width + x;
          const left = y * width + Math.max(0, x - 1);
          const right = y * width + Math.min(width - 1, x + 1);
          heat[idx] = (heat[below] + heat[left] + heat[right]) / 3.05;
        }
      }
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
      const current = state.current;
      const previous = state.previous;
      const damping = state.damping;
      const temp = [...previous];
      for (let i = 0; i < current.length; i++) {
        previous[i] = current[i];
      }
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          current[idx] = (temp[(y - 1) * width + x] + temp[(y + 1) * width + x] + temp[y * width + (x - 1)] + temp[y * width + (x + 1)]) / 2 - current[idx];
          current[idx] *= damping;
        }
      }
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
          const r = intensity > 200 ? intensity : 0;
          const g = intensity > 150 ? intensity * 0.8 : intensity * 0.3;
          const b = Math.min(255, 50 + intensity);
          this.renderer.setPixel(x, y, [r, g, b]);
        }
      }
    }
    _renderStars(state) {
      const { width, height } = this.renderer;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          this.renderer.setPixel(x, y, [5, 5, 15]);
        }
      }
      const stars = state.stars;
      for (const star of stars) {
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
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [255, 0, 255],
        [0, 255, 255],
        [255, 128, 0],
        [255, 192, 203]
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
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          this.renderer.setPixel(x, y, [10, 10, 10]);
        }
      }
      const particles = state.particles;
      for (const p of particles) {
        const x = Math.floor(p.x);
        const y = Math.floor(p.y);
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const shimmer = Math.abs(Math.sin(p.rotation)) * 0.5 + 0.5;
          const [r, g, b] = p.color;
          this.renderer.setPixel(x, y, [r * shimmer, g * shimmer, b * shimmer]);
        }
      }
    }
    _renderPlasmaWave(state) {
      const { width, height } = this.renderer;
      const time = state.time || 0;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const uvX = x / width;
          const uvY = y / height;
          const v = Math.sin(uvX * 10 + time) + Math.sin(uvY * 10 + time) + Math.sin((uvX + uvY) * 10 + time) + Math.sin(Math.sqrt((uvX - 0.5) ** 2 + (uvY - 0.5) ** 2) * 20 - time * 2);
          const r = Math.sin(v * Math.PI) * 0.5 + 0.5;
          const g = Math.sin(v * Math.PI + 2.094) * 0.5 + 0.5;
          const b = Math.sin(v * Math.PI + 4.188) * 0.5 + 0.5;
          this.renderer.setPixel(x, y, [r * 255, g * 255, b * 255]);
        }
      }
    }
    _renderRadialPulse(state) {
      const { width, height } = this.renderer;
      const time = state.time || 0;
      const centerX = width / 2;
      const centerY = height / 2;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wave = Math.sin(dist * 0.8 - time * 3) * 0.5 + 0.5;
          const pulse = Math.sin(time * 2) * 0.3 + 0.7;
          const hue = (dist / 20 + time * 0.5) % 1;
          const [r, g, b] = hsvToRgb(hue, 0.8, wave * pulse);
          this.renderer.setPixel(x, y, [r, g, b]);
        }
      }
    }
    _renderHypnotic(state) {
      const { width, height } = this.renderer;
      const time = state.time || 0;
      const centerX = width / 2;
      const centerY = height / 2;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const spiral = Math.sin(angle * 4 + dist * 0.5 - time * 2);
          const intensity = spiral * 0.5 + 0.5;
          const r = intensity * (Math.sin(time) * 0.5 + 0.5);
          const g = intensity * (Math.sin(time + 2.094) * 0.5 + 0.5);
          const b = intensity * (Math.sin(time + 4.188) * 0.5 + 0.5);
          this.renderer.setPixel(x, y, [r * 255, g * 255, b * 255]);
        }
      }
    }
    _renderLava(state) {
      const { width, height } = this.renderer;
      const time = state.time || 0;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const uvX = x / width;
          const uvY = y / height;
          const n1 = Math.sin(uvX * 8 + time * 0.7) * Math.cos(uvY * 6 + time * 0.5);
          const n2 = Math.sin(uvX * 12 - time * 0.3) * Math.sin(uvY * 10 + time * 0.8);
          const n3 = Math.cos((uvX + uvY) * 5 + time);
          const value = (n1 + n2 + n3 + 3) / 6;
          let r, g, b;
          if (value < 0.3) {
            r = value * 3 * 100;
            g = 0;
            b = 0;
          } else if (value < 0.6) {
            r = 100 + (value - 0.3) * 3 * 155;
            g = (value - 0.3) * 3 * 100;
            b = 0;
          } else {
            r = 255;
            g = 100 + (value - 0.6) * 2.5 * 155;
            b = (value - 0.6) * 2.5 * 100;
          }
          this.renderer.setPixel(x, y, [r, g, b]);
        }
      }
    }
    _renderAurora(state) {
      const { width, height } = this.renderer;
      const time = state.time || 0;
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const uvX = x / width;
          const uvY = y / height;
          const wave1 = Math.sin(uvX * 6 + time) * 0.3;
          const wave2 = Math.sin(uvX * 4 - time * 0.7) * 0.2;
          const wave3 = Math.sin(uvX * 8 + time * 1.3) * 0.15;
          const waveLine = 0.5 + wave1 + wave2 + wave3;
          const distFromWave = Math.abs(uvY - waveLine);
          const intensity = Math.max(0, 1 - distFromWave * 4);
          const glow = Math.pow(intensity, 1.5);
          const colorShift = Math.sin(uvX * 3 + time * 0.5);
          let r = glow * (0.2 + colorShift * 0.3) * 255;
          let g = glow * (0.8 + Math.sin(time + uvX) * 0.2) * 255;
          let b = glow * (0.6 + colorShift * 0.4) * 255;
          const starChance = Math.sin(x * 127.1 + y * 311.7) * 0.5 + 0.5;
          const starTwinkle = Math.sin(time * 3 + x + y) * 0.5 + 0.5;
          if (starChance > 0.98 && intensity < 0.3) {
            const starBright = starTwinkle * 180;
            r = Math.max(r, starBright);
            g = Math.max(g, starBright);
            b = Math.max(b, starBright * 0.9);
          }
          this.renderer.setPixel(x, y, [r, g, b]);
        }
      }
    }
  };
  var ColorEffects = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    init(effectName, state) {
      switch (effectName) {
        case "color_cycle":
          state.hue = 0;
          break;
        case "rainbow_text":
          state.offset = 0;
          break;
        case "neon":
          state.glowIntensity = 0;
          state.direction = 1;
          state.baseColor = state.fgColor || "#ff00ff";
          break;
      }
    }
    step(effectName, state) {
      switch (effectName) {
        case "color_cycle":
          state.hue = (state.hue + 0.01) % 1;
          break;
        case "rainbow_text":
          state.offset = (state.offset + 0.02) % 1;
          break;
        case "neon":
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
    render(effectName, state, pixels) {
      const { width, height } = this.renderer;
      const displayPixels = pixels || [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = displayPixels[y * width + x] || "#111";
          let [r, g, b] = hexToRgb(color);
          const isLit = r > 20 || g > 20 || b > 20;
          if (isLit) {
            switch (effectName) {
              case "color_cycle": {
                const [nr, ng, nb] = hsvToRgb(state.hue, 1, 0.8);
                const brightness = (r + g + b) / (3 * 255);
                r = nr * brightness;
                g = ng * brightness;
                b = nb * brightness;
                break;
              }
              case "rainbow_text": {
                const hue = (state.offset + x / width) % 1;
                const [nr, ng, nb] = hsvToRgb(hue, 1, 0.8);
                const brightness = (r + g + b) / (3 * 255);
                r = nr * brightness;
                g = ng * brightness;
                b = nb * brightness;
                break;
              }
              case "neon": {
                const baseColor = hexToRgb(state.baseColor || "#ff00ff");
                const intensity = state.glowIntensity || 0.5;
                r = baseColor[0] * intensity;
                g = baseColor[1] * intensity;
                b = baseColor[2] * intensity;
                if (intensity > 0.8) {
                  const whiteMix = (intensity - 0.8) * 5;
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
  };
  var EFFECT_CATEGORIES = {
    TEXT: "text",
    AMBIENT: "ambient",
    COLOR: "color"
  };
  var EFFECTS = {
    // Text effects
    fixed: { category: "text", name: "Fixed", description: "Static display" },
    scroll_ltr: { category: "text", name: "Scroll Left", description: "Text scrolls left to right" },
    scroll_rtl: { category: "text", name: "Scroll Right", description: "Text scrolls right to left" },
    blink: { category: "text", name: "Blink", description: "Text blinks on/off" },
    breeze: { category: "text", name: "Breeze", description: "Gentle wave brightness" },
    snow: { category: "text", name: "Snow", description: "Sparkle effect" },
    laser: { category: "text", name: "Laser", description: "Scanning beam" },
    fade: { category: "text", name: "Fade", description: "Fade in/out" },
    typewriter: { category: "text", name: "Typewriter", description: "Characters appear one by one" },
    bounce: { category: "text", name: "Bounce", description: "Text bounces back and forth" },
    sparkle: { category: "text", name: "Sparkle", description: "Random sparkle overlay" },
    // Ambient effects
    rainbow: { category: "ambient", name: "Rainbow", description: "HSV rainbow gradient" },
    matrix: { category: "ambient", name: "Matrix", description: "Digital rain effect" },
    plasma: { category: "ambient", name: "Plasma", description: "Classic plasma waves" },
    gradient: { category: "ambient", name: "Gradient", description: "Moving color gradients" },
    fire: { category: "ambient", name: "Fire", description: "Fire/flame simulation" },
    water: { category: "ambient", name: "Water", description: "Ripple/wave effect" },
    stars: { category: "ambient", name: "Stars", description: "Twinkling starfield" },
    confetti: { category: "ambient", name: "Confetti", description: "Falling colored particles" },
    plasma_wave: { category: "ambient", name: "Plasma Wave", description: "Multi-frequency sine waves" },
    radial_pulse: { category: "ambient", name: "Radial Pulse", description: "Expanding ring patterns" },
    hypnotic: { category: "ambient", name: "Hypnotic", description: "Spiral pattern" },
    lava: { category: "ambient", name: "Lava", description: "Flowing lava/magma" },
    aurora: { category: "ambient", name: "Aurora", description: "Northern lights" },
    // Color effects
    color_cycle: { category: "color", name: "Color Cycle", description: "Cycle through colors" },
    rainbow_text: { category: "color", name: "Rainbow Text", description: "Rainbow gradient on text" },
    neon: { category: "color", name: "Neon", description: "Pulsing neon glow" }
  };
  var EffectManager = class {
    constructor(renderer) {
      this.renderer = renderer;
      this.textEffects = new TextEffects(renderer);
      this.ambientEffects = new AmbientEffects(renderer);
      this.colorEffects = new ColorEffects(renderer);
      this.currentEffect = "fixed";
      this.effectState = { tick: 0 };
    }
    getEffectInfo(effectName) {
      return EFFECTS[effectName] || EFFECTS.fixed;
    }
    getEffectsByCategory(category) {
      return Object.entries(EFFECTS).filter(([, info]) => info.category === category).map(([key, info]) => ({ key, ...info }));
    }
    initEffect(effectName, options = {}) {
      const info = this.getEffectInfo(effectName);
      this.currentEffect = effectName;
      this.effectState = { tick: 0, ...options };
      switch (info.category) {
        case "text":
          this.textEffects.init(effectName, this.effectState);
          break;
        case "ambient":
          this.ambientEffects.init(effectName, this.effectState);
          break;
        case "color":
          this.colorEffects.init(effectName, this.effectState);
          break;
      }
      return this.effectState;
    }
    step() {
      const info = this.getEffectInfo(this.currentEffect);
      this.effectState.tick = (this.effectState.tick || 0) + 1;
      switch (info.category) {
        case "text":
          this.textEffects.step(this.currentEffect, this.effectState);
          break;
        case "ambient":
          this.ambientEffects.step(this.currentEffect, this.effectState);
          break;
        case "color":
          this.colorEffects.step(this.currentEffect, this.effectState);
          break;
      }
    }
    render(pixels, extendedPixels, extendedWidth) {
      const info = this.getEffectInfo(this.currentEffect);
      switch (info.category) {
        case "ambient":
          this.ambientEffects.render(this.currentEffect, this.effectState);
          break;
        case "text":
          this.textEffects.render(this.currentEffect, this.effectState, pixels, extendedPixels, extendedWidth);
          break;
        case "color":
          this.colorEffects.render(this.currentEffect, this.effectState, pixels);
          break;
      }
    }
    isAmbient(effectName) {
      return this.getEffectInfo(effectName).category === "ambient";
    }
    needsAnimation(effectName) {
      return effectName !== "fixed";
    }
  };
  var TEXT_EFFECTS = Object.entries(EFFECTS).filter(([, info]) => info.category === "text").map(([name]) => name);
  var AMBIENT_EFFECTS = Object.entries(EFFECTS).filter(([, info]) => info.category === "ambient").map(([name]) => name);
  var COLOR_EFFECTS = Object.entries(EFFECTS).filter(([, info]) => info.category === "color").map(([name]) => name);
  var ALL_EFFECTS = Object.keys(EFFECTS);
  var ImageDataLEDRenderer = class {
    constructor(container, options = {}) {
      this.container = container;
      this.width = options.width || 64;
      this.height = options.height || 16;
      this.pixelGap = options.pixelGap || 0.15;
      this.glowEnabled = options.glow !== false;
      this.scale = options.scale || 8;
      this.buffer = [];
      this._initBuffer();
      this._colorPixels = [];
      this._extendedColorPixels = [];
      this.extendedWidth = this.width;
      this.effect = "fixed";
      this.speed = 50;
      this.animationId = null;
      this.lastFrameTime = 0;
      this._isRunning = false;
      this._canvas = null;
      this._ctx = null;
      this._imageData = null;
      this._glowCanvas = null;
      this._glowCtx = null;
      this._wrapper = null;
      this._canvasCreated = false;
      this._pixelTemplate = null;
      this.effectManager = new EffectManager(this);
    }
    _initBuffer() {
      this.buffer = [];
      for (let i = 0; i < this.width * this.height; i++) {
        this.buffer.push([0, 0, 0]);
      }
    }
    _createCanvas() {
      if (typeof document === "undefined")
        return;
      const canvasWidth = this.width * this.scale;
      const canvasHeight = this.height * this.scale;
      this._wrapper = document.createElement("div");
      this._wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: ${this.width} / ${this.height};
      background: #0a0a0a;
      border-radius: 4px;
      overflow: hidden;
    `;
      if (this.glowEnabled) {
        this._glowCanvas = document.createElement("canvas");
        this._glowCanvas.width = canvasWidth;
        this._glowCanvas.height = canvasHeight;
        this._glowCanvas.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        filter: blur(${this.scale * 0.6}px); opacity: 0.5;
      `;
        this._glowCtx = this._glowCanvas.getContext("2d", { alpha: false });
        this._wrapper.appendChild(this._glowCanvas);
      }
      this._canvas = document.createElement("canvas");
      this._canvas.width = canvasWidth;
      this._canvas.height = canvasHeight;
      this._canvas.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      image-rendering: pixelated; image-rendering: crisp-edges;
    `;
      this._ctx = this._canvas.getContext("2d", { alpha: false });
      this._wrapper.appendChild(this._canvas);
      this._imageData = this._ctx.createImageData(canvasWidth, canvasHeight);
      this._createPixelTemplate();
      this._fillBackground();
      if (this.container && this.container.isConnected !== false) {
        this.container.innerHTML = "";
        this.container.appendChild(this._wrapper);
      }
      this._canvasCreated = true;
    }
    _createPixelTemplate() {
      const scale = this.scale;
      const gap = Math.max(1, Math.floor(scale * this.pixelGap));
      const pixelSize = scale - gap;
      const radius = Math.max(1, Math.floor(scale * 0.15));
      this._pixelTemplate = [];
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          let inside = false;
          if (px < pixelSize && py < pixelSize) {
            if (px < radius && py < radius) {
              const dx = radius - px;
              const dy = radius - py;
              inside = dx * dx + dy * dy <= radius * radius;
            } else if (px >= pixelSize - radius && py < radius) {
              const dx = px - (pixelSize - radius - 1);
              const dy = radius - py;
              inside = dx * dx + dy * dy <= radius * radius;
            } else if (px < radius && py >= pixelSize - radius) {
              const dx = radius - px;
              const dy = py - (pixelSize - radius - 1);
              inside = dx * dx + dy * dy <= radius * radius;
            } else if (px >= pixelSize - radius && py >= pixelSize - radius) {
              const dx = px - (pixelSize - radius - 1);
              const dy = py - (pixelSize - radius - 1);
              inside = dx * dx + dy * dy <= radius * radius;
            } else {
              inside = true;
            }
          }
          this._pixelTemplate.push(inside);
        }
      }
    }
    _fillBackground() {
      if (!this._imageData)
        return;
      const data = this._imageData.data;
      const bgR = 10, bgG = 10, bgB = 10;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = bgR;
        data[i + 1] = bgG;
        data[i + 2] = bgB;
        data[i + 3] = 255;
      }
    }
    _ensureCanvasInContainer() {
      if (!this.container)
        return false;
      if (this._wrapper && this._wrapper.parentNode === this.container)
        return true;
      if (this._wrapper && this.container.isConnected !== false) {
        this.container.innerHTML = "";
        this.container.appendChild(this._wrapper);
        return true;
      }
      return false;
    }
    setPixel(x, y, color) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const idx = y * this.width + x;
        if (idx < this.buffer.length) {
          this.buffer[idx] = color;
        }
      }
    }
    clear() {
      for (let i = 0; i < this.buffer.length; i++) {
        this.buffer[i] = [0, 0, 0];
      }
    }
    flush() {
      if (!this._canvasCreated) {
        this._createCanvas();
      } else if (!this._ensureCanvasInContainer()) {
        this._createCanvas();
      }
      if (!this._imageData || !this._ctx || !this._pixelTemplate)
        return;
      const data = this._imageData.data;
      const scale = this.scale;
      const canvasWidth = this.width * scale;
      const template = this._pixelTemplate;
      const bgR = 10, bgG = 10, bgB = 10;
      for (let ledY = 0; ledY < this.height; ledY++) {
        for (let ledX = 0; ledX < this.width; ledX++) {
          const bufferIdx = ledY * this.width + ledX;
          const color = this.buffer[bufferIdx];
          if (!color || !Array.isArray(color))
            continue;
          const r = Math.round(color[0]);
          const g = Math.round(color[1]);
          const b = Math.round(color[2]);
          const baseX = ledX * scale;
          const baseY = ledY * scale;
          for (let py = 0; py < scale; py++) {
            for (let px = 0; px < scale; px++) {
              const templateIdx = py * scale + px;
              const canvasIdx = ((baseY + py) * canvasWidth + (baseX + px)) * 4;
              if (template[templateIdx]) {
                data[canvasIdx] = r;
                data[canvasIdx + 1] = g;
                data[canvasIdx + 2] = b;
                data[canvasIdx + 3] = 255;
              } else {
                data[canvasIdx] = bgR;
                data[canvasIdx + 1] = bgG;
                data[canvasIdx + 2] = bgB;
                data[canvasIdx + 3] = 255;
              }
            }
          }
        }
      }
      this._ctx.putImageData(this._imageData, 0, 0);
      if (this.glowEnabled && this._glowCtx) {
        this._glowCtx.drawImage(this._canvas, 0, 0);
      }
    }
    setData(pixels, extendedPixels = null, extendedWidth = null) {
      this._colorPixels = pixels || [];
      if (extendedPixels) {
        this._extendedColorPixels = extendedPixels;
        this.extendedWidth = extendedWidth || this.width;
      } else {
        this._extendedColorPixels = pixels || [];
        this.extendedWidth = this.width;
      }
    }
    setEffect(effect, speed = 50) {
      const wasRunning = this._isRunning;
      if (this.effect !== effect) {
        this.effect = effect;
        this.effectManager.initEffect(effect, { speed });
      }
      this.speed = speed;
      if (wasRunning && effect !== "fixed") {
        this.start();
      }
    }
    start() {
      if (this._isRunning)
        return;
      this._isRunning = true;
      this.lastFrameTime = performance.now();
      this._animate();
    }
    stop() {
      this._isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
    get isRunning() {
      return this._isRunning;
    }
    _animate() {
      if (!this._isRunning)
        return;
      const now = performance.now();
      const frameInterval = 500 - (this.speed - 1) * 4.7;
      if (now - this.lastFrameTime >= frameInterval) {
        this.lastFrameTime = now;
        this.effectManager.step();
      }
      this._renderFrame();
      this.animationId = requestAnimationFrame(() => this._animate());
    }
    _renderFrame() {
      this.effectManager.render(this._colorPixels, this._extendedColorPixels, this.extendedWidth);
      this.flush();
    }
    renderStatic() {
      if (!this._canvasCreated)
        this._createCanvas();
      this._renderFrame();
    }
    setDimensions(width, height) {
      if (width !== this.width || height !== this.height) {
        this.width = width;
        this.height = height;
        this.extendedWidth = width;
        this._initBuffer();
        this._canvasCreated = false;
        this.effectManager = new EffectManager(this);
        if (this.effect !== "fixed") {
          this.effectManager.initEffect(this.effect, { speed: this.speed });
        }
      }
    }
    setContainer(container) {
      if (container !== this.container) {
        this.container = container;
        if (this._wrapper && container) {
          container.innerHTML = "";
          container.appendChild(this._wrapper);
        }
      }
    }
    destroy() {
      this.stop();
      this._canvas = null;
      this._ctx = null;
      this._imageData = null;
      this._glowCanvas = null;
      this._glowCtx = null;
      this._wrapper = null;
      this._canvasCreated = false;
      this._pixelTemplate = null;
    }
  };
  var pixelFont = {
    "A": [124, 18, 17, 18, 124],
    "B": [127, 73, 73, 73, 54],
    "C": [62, 65, 65, 65, 34],
    "D": [127, 65, 65, 34, 28],
    "E": [127, 73, 73, 73, 65],
    "F": [127, 9, 9, 9, 1],
    "G": [62, 65, 73, 73, 122],
    "H": [127, 8, 8, 8, 127],
    "I": [0, 65, 127, 65, 0],
    "J": [32, 64, 65, 63, 1],
    "K": [127, 8, 20, 34, 65],
    "L": [127, 64, 64, 64, 64],
    "M": [127, 2, 12, 2, 127],
    "N": [127, 4, 8, 16, 127],
    "O": [62, 65, 65, 65, 62],
    "P": [127, 9, 9, 9, 6],
    "Q": [62, 65, 81, 33, 94],
    "R": [127, 9, 25, 41, 70],
    "S": [70, 73, 73, 73, 49],
    "T": [1, 1, 127, 1, 1],
    "U": [63, 64, 64, 64, 63],
    "V": [31, 32, 64, 32, 31],
    "W": [63, 64, 56, 64, 63],
    "X": [99, 20, 8, 20, 99],
    "Y": [7, 8, 112, 8, 7],
    "Z": [97, 81, 73, 69, 67],
    "a": [32, 84, 84, 84, 120],
    "b": [127, 72, 68, 68, 56],
    "c": [56, 68, 68, 68, 32],
    "d": [56, 68, 68, 72, 127],
    "e": [56, 84, 84, 84, 24],
    "f": [8, 126, 9, 1, 2],
    "g": [12, 82, 82, 82, 62],
    "h": [127, 8, 4, 4, 120],
    "i": [0, 68, 125, 64, 0],
    "j": [32, 64, 68, 61, 0],
    "k": [127, 16, 40, 68, 0],
    "l": [0, 65, 127, 64, 0],
    "m": [124, 4, 24, 4, 120],
    "n": [124, 8, 4, 4, 120],
    "o": [56, 68, 68, 68, 56],
    "p": [124, 20, 20, 20, 8],
    "q": [8, 20, 20, 24, 124],
    "r": [124, 8, 4, 4, 8],
    "s": [72, 84, 84, 84, 32],
    "t": [4, 63, 68, 64, 32],
    "u": [60, 64, 64, 32, 124],
    "v": [28, 32, 64, 32, 28],
    "w": [60, 64, 48, 64, 60],
    "x": [68, 40, 16, 40, 68],
    "y": [12, 80, 80, 80, 60],
    "z": [68, 100, 84, 76, 68],
    "0": [62, 81, 73, 69, 62],
    "1": [0, 66, 127, 64, 0],
    "2": [66, 97, 81, 73, 70],
    "3": [33, 65, 69, 75, 49],
    "4": [24, 20, 18, 127, 16],
    "5": [39, 69, 69, 69, 57],
    "6": [60, 74, 73, 73, 48],
    "7": [1, 113, 9, 5, 3],
    "8": [54, 73, 73, 73, 54],
    "9": [6, 73, 73, 41, 30],
    " ": [0, 0, 0, 0, 0],
    ".": [0, 96, 96, 0, 0],
    ",": [0, 128, 96, 0, 0],
    ":": [0, 54, 54, 0, 0],
    ";": [0, 128, 54, 0, 0],
    "!": [0, 0, 95, 0, 0],
    "?": [2, 1, 81, 9, 6],
    "-": [8, 8, 8, 8, 8],
    "+": [8, 8, 62, 8, 8],
    "=": [20, 20, 20, 20, 20],
    "_": [64, 64, 64, 64, 64],
    "/": [32, 16, 8, 4, 2],
    "\\": [2, 4, 8, 16, 32],
    "(": [0, 28, 34, 65, 0],
    ")": [0, 65, 34, 28, 0],
    "[": [0, 127, 65, 65, 0],
    "]": [0, 65, 65, 127, 0],
    "<": [8, 20, 34, 65, 0],
    ">": [0, 65, 34, 20, 8],
    "*": [20, 8, 62, 8, 20],
    "#": [20, 127, 20, 127, 20],
    "@": [62, 65, 93, 85, 30],
    "&": [54, 73, 85, 34, 80],
    "%": [35, 19, 8, 100, 98],
    "$": [18, 42, 127, 42, 36],
    "'": [0, 0, 7, 0, 0],
    '"': [0, 7, 0, 7, 0],
    "`": [0, 1, 2, 0, 0],
    "^": [4, 2, 1, 2, 4],
    "~": [8, 4, 8, 16, 8]
  };
  function textToPixels(text, width, height, fgColor = "#ff6600", bgColor = "#111") {
    const pixels = [];
    const charWidth = 6;
    const charHeight = 7;
    const startY = Math.floor((height - charHeight) / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixels.push(bgColor);
      }
    }
    const textWidth = text.length * charWidth - 1;
    const startX = Math.max(1, Math.floor((width - textWidth) / 2));
    let xOffset = startX;
    for (const char of text) {
      const charData = pixelFont[char] || pixelFont[" "];
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 7; row++) {
          const pixelOn = charData[col] >> row & 1;
          const px = xOffset + col;
          const py = startY + row;
          if (px >= 0 && px < width && py < height && py >= 0) {
            pixels[py * width + px] = pixelOn ? fgColor : bgColor;
          }
        }
      }
      xOffset += charWidth;
    }
    return pixels;
  }
  function textToScrollPixels(text, displayWidth, height, fgColor = "#ff6600", bgColor = "#111") {
    const charWidth = 6;
    const charHeight = 7;
    const startY = Math.floor((height - charHeight) / 2);
    const textPixelWidth = text.length * charWidth;
    const extendedWidth = displayWidth + textPixelWidth + displayWidth;
    const pixels = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < extendedWidth; x++) {
        pixels.push(bgColor);
      }
    }
    let xOffset = displayWidth;
    for (const char of text) {
      const charData = pixelFont[char] || pixelFont[" "];
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 7; row++) {
          const pixelOn = charData[col] >> row & 1;
          const px = xOffset + col;
          const py = startY + row;
          if (px >= 0 && px < extendedWidth && py < height && py >= 0) {
            pixels[py * extendedWidth + px] = pixelOn ? fgColor : bgColor;
          }
        }
      }
      xOffset += charWidth;
    }
    return { pixels, width: extendedWidth };
  }
  var FONT_METRICS = {
    "VCR_OSD_MONO": {
      16: { font_size: 16, offset: [0, 0], pixel_threshold: 70, var_width: true },
      24: { font_size: 24, offset: [0, 0], pixel_threshold: 70, var_width: true },
      32: { font_size: 28, offset: [-1, 2], pixel_threshold: 30, var_width: false }
    },
    "CUSONG": {
      16: { font_size: 16, offset: [0, -1], pixel_threshold: 70, var_width: false },
      24: { font_size: 24, offset: [0, 0], pixel_threshold: 70, var_width: false },
      32: { font_size: 32, offset: [0, 0], pixel_threshold: 70, var_width: false }
    }
  };
  var fontLoadState = {};
  var fontLoadPromises$1 = {};
  var defaultResolver$1 = (fontName) => {
    if (typeof window === "undefined")
      return `/fonts/${fontName}.ttf`;
    const basePath = window.location.pathname.substring(
      0,
      window.location.pathname.lastIndexOf("/") + 1
    );
    return `${basePath}fonts/${fontName}.ttf`;
  };
  var _fontResolver$1 = defaultResolver$1;
  function setFontResolver$1(resolver) {
    _fontResolver$1 = resolver;
  }
  function getHeightKey$1(height) {
    if (height <= 18)
      return 16;
    if (height <= 28)
      return 24;
    return 32;
  }
  async function loadFont(fontName, resolver) {
    if (fontLoadState[fontName] === true)
      return true;
    if (fontLoadState[fontName] === false)
      return false;
    if (fontName in fontLoadPromises$1)
      return fontLoadPromises$1[fontName];
    fontLoadPromises$1[fontName] = (async () => {
      if (typeof document === "undefined")
        return false;
      const resolveUrl = resolver || _fontResolver$1;
      const fontUrl = resolveUrl(fontName);
      try {
        const font = new FontFace(fontName, `url(${fontUrl})`);
        const loadedFont = await font.load();
        document.fonts.add(loadedFont);
        fontLoadState[fontName] = true;
        return true;
      } catch (e) {
        console.warn(`PixelDisplay: Failed to load font ${fontName}:`, e);
        fontLoadState[fontName] = false;
        return false;
      }
    })();
    return fontLoadPromises$1[fontName];
  }
  function isFontLoaded(fontName) {
    return fontLoadState[fontName] === true;
  }
  function textToPixelsCanvas(text, width, height, fgColor = "#ff6600", bgColor = "#111", fontName = "VCR_OSD_MONO") {
    if (typeof document === "undefined")
      return null;
    const fontMetrics = FONT_METRICS[fontName];
    if (!fontMetrics)
      return null;
    if (!isFontLoaded(fontName)) {
      loadFont(fontName);
      return null;
    }
    const heightKey = getHeightKey$1(height);
    const metrics = fontMetrics[heightKey];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return null;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    if (!text || text.trim() === "") {
      const pixels2 = [];
      for (let i = 0; i < width * height; i++)
        pixels2.push(bgColor);
      return pixels2;
    }
    ctx.font = `${metrics.font_size}px "${fontName}"`;
    ctx.fillStyle = fgColor;
    ctx.textBaseline = "top";
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const x = Math.floor((width - textWidth) / 2) + metrics.offset[0];
    const y = Math.floor((height - metrics.font_size) / 2) + metrics.offset[1];
    ctx.fillText(text, x, y);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const gray = (r + g + b) / 3;
      pixels.push(gray >= metrics.pixel_threshold ? fgColor : bgColor);
    }
    return pixels;
  }
  function textToScrollPixelsCanvas(text, displayWidth, height, fgColor = "#ff6600", bgColor = "#111", fontName = "VCR_OSD_MONO") {
    if (typeof document === "undefined")
      return null;
    const fontMetrics = FONT_METRICS[fontName];
    if (!fontMetrics)
      return null;
    if (!isFontLoaded(fontName)) {
      loadFont(fontName);
      return null;
    }
    const heightKey = getHeightKey$1(height);
    const metrics = fontMetrics[heightKey];
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx)
      return null;
    tempCtx.font = `${metrics.font_size}px "${fontName}"`;
    const textWidth = Math.ceil(tempCtx.measureText(text).width);
    const extendedWidth = displayWidth + textWidth + displayWidth;
    const canvas = document.createElement("canvas");
    canvas.width = extendedWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return null;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, extendedWidth, height);
    if (!text || text.trim() === "") {
      const pixels2 = [];
      for (let i = 0; i < extendedWidth * height; i++)
        pixels2.push(bgColor);
      return { pixels: pixels2, width: extendedWidth };
    }
    ctx.font = `${metrics.font_size}px "${fontName}"`;
    ctx.fillStyle = fgColor;
    ctx.textBaseline = "top";
    const x = displayWidth + metrics.offset[0];
    const y = Math.floor((height - metrics.font_size) / 2) + metrics.offset[1];
    ctx.fillText(text, x, y);
    const imageData = ctx.getImageData(0, 0, extendedWidth, height);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const gray = (r + g + b) / 3;
      pixels.push(gray >= metrics.pixel_threshold ? fgColor : bgColor);
    }
    return { pixels, width: extendedWidth };
  }
  var $Font2 = null;
  var $fetchline = null;
  async function ensureBdfParser() {
    if ($Font2 && $fetchline)
      return true;
    try {
      const bdfparser = await Promise.resolve().then(() => (init_index_Ds5kwaZ(), index_Ds5kwaZ_exports));
      const fetchline2 = await Promise.resolve().then(() => (init_index_Cl4FejWM(), index_Cl4FejWM_exports));
      $Font2 = bdfparser.$Font;
      const fl = fetchline2;
      $fetchline = fl.default || fl.$fetchline || fetchline2;
      return true;
    } catch {
      console.warn("PixelDisplay: bdfparser/fetchline packages not available. BDF font rendering disabled.");
      return false;
    }
  }
  var BDF_FONT_CONFIG = {
    "VCR_OSD_MONO": {
      16: { file: "VCR_OSD_MONO_16.bdf", yOffset: 0 },
      24: { file: "VCR_OSD_MONO_24.bdf", yOffset: 0 },
      32: { file: "VCR_OSD_MONO_32.bdf", yOffset: 2 }
    },
    "CUSONG": {
      16: { file: "CUSONG_16.bdf", yOffset: -1 },
      24: { file: "CUSONG_24.bdf", yOffset: 0 },
      32: { file: "CUSONG_32.bdf", yOffset: 0 }
    }
  };
  var fontCache = /* @__PURE__ */ new Map();
  var fontLoadPromises = /* @__PURE__ */ new Map();
  var defaultResolver = (_fontName, fileName) => {
    if (typeof window === "undefined")
      return `/fonts/${fileName || _fontName}`;
    const basePath = window.location.pathname.substring(
      0,
      window.location.pathname.lastIndexOf("/") + 1
    );
    return `${basePath}fonts/${fileName || _fontName}`;
  };
  var _fontResolver = defaultResolver;
  function setFontResolver(resolver) {
    _fontResolver = resolver;
  }
  function getHeightKey(height) {
    if (height <= 18)
      return 16;
    if (height <= 28)
      return 24;
    return 32;
  }
  async function loadBdfFont(fontName, heightKey = 16, resolver) {
    const cacheKey = `${fontName}_${heightKey}`;
    if (fontCache.has(cacheKey)) {
      return fontCache.get(cacheKey);
    }
    if (fontLoadPromises.has(cacheKey)) {
      return fontLoadPromises.get(cacheKey);
    }
    const fontConfig = BDF_FONT_CONFIG[fontName];
    if (!fontConfig || !fontConfig[heightKey]) {
      console.warn(`PixelDisplay BDF: No config for font ${fontName} at height ${heightKey}`);
      return null;
    }
    const config = fontConfig[heightKey];
    const loadPromise = (async () => {
      try {
        const parserAvailable = await ensureBdfParser();
        if (!parserAvailable || !$Font2 || !$fetchline)
          return null;
        const resolveUrl = resolver || _fontResolver;
        const fontUrl = resolveUrl(fontName, config.file);
        const font = await $Font2($fetchline(fontUrl));
        const result = { font, config };
        fontCache.set(cacheKey, result);
        return result;
      } catch (e) {
        console.warn(`PixelDisplay BDF: Failed to load font ${fontName} (${heightKey}px):`, e);
        fontLoadPromises.delete(cacheKey);
        return null;
      }
    })();
    fontLoadPromises.set(cacheKey, loadPromise);
    return loadPromise;
  }
  function isBdfFontLoaded(fontName, heightKey = 16) {
    const cacheKey = `${fontName}_${heightKey}`;
    return fontCache.has(cacheKey);
  }
  function textToPixelsBdf(text, width, height, fgColor = "#ff6600", bgColor = "#111", fontName = "VCR_OSD_MONO") {
    const heightKey = getHeightKey(height);
    const cacheKey = `${fontName}_${heightKey}`;
    const cached = fontCache.get(cacheKey);
    if (!cached) {
      loadBdfFont(fontName, heightKey);
      return null;
    }
    const { font, config } = cached;
    const pixels = new Array(width * height).fill(bgColor);
    if (!text || text.trim() === "")
      return pixels;
    try {
      const bitmap = font.draw(text, { direction: "lrtb", mode: 1 });
      const bindata = bitmap.bindata;
      const textWidth = bitmap.width();
      const textHeight = bitmap.height();
      const xOffset = Math.floor((width - textWidth) / 2);
      const yOffset = Math.floor((height - textHeight) / 2) + (config.yOffset || 0);
      for (let row = 0; row < textHeight; row++) {
        const rowData = bindata[row] || "";
        for (let col = 0; col < rowData.length; col++) {
          const px = xOffset + col;
          const py = yOffset + row;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = py * width + px;
            pixels[idx] = rowData[col] === "1" ? fgColor : bgColor;
          }
        }
      }
    } catch (e) {
      console.warn("PixelDisplay BDF: Error rendering text:", e);
      return null;
    }
    return pixels;
  }
  function textToScrollPixelsBdf(text, displayWidth, height, fgColor = "#ff6600", bgColor = "#111", fontName = "VCR_OSD_MONO") {
    const heightKey = getHeightKey(height);
    const cacheKey = `${fontName}_${heightKey}`;
    const cached = fontCache.get(cacheKey);
    if (!cached) {
      loadBdfFont(fontName, heightKey);
      return null;
    }
    const { font, config } = cached;
    if (!text || text.trim() === "") {
      const extendedWidth = displayWidth * 3;
      const pixels = new Array(extendedWidth * height).fill(bgColor);
      return { pixels, width: extendedWidth };
    }
    try {
      const bitmap = font.draw(text, { direction: "lrtb", mode: 1 });
      const bindata = bitmap.bindata;
      const textWidth = bitmap.width();
      const textHeight = bitmap.height();
      const extendedWidth = displayWidth + textWidth + displayWidth;
      const pixels = new Array(extendedWidth * height).fill(bgColor);
      const xStart = displayWidth;
      const yOffset = Math.floor((height - textHeight) / 2) + (config.yOffset || 0);
      for (let row = 0; row < textHeight; row++) {
        const rowData = bindata[row] || "";
        for (let col = 0; col < rowData.length; col++) {
          const px = xStart + col;
          const py = yOffset + row;
          if (px >= 0 && px < extendedWidth && py >= 0 && py < height) {
            const idx = py * extendedWidth + px;
            pixels[idx] = rowData[col] === "1" ? fgColor : bgColor;
          }
        }
      }
      return { pixels, width: extendedWidth };
    } catch (e) {
      console.warn("PixelDisplay BDF: Error rendering scroll text:", e);
      return null;
    }
  }
  function configureFonts(options) {
    if (options.baseUrl) {
      const base = options.baseUrl.replace(/\/+$/, "");
      setFontResolver$1((name) => `${base}/${name}.ttf`);
      setFontResolver((_name, file) => `${base}/${file || _name}`);
    }
    if (options.ttfResolver)
      setFontResolver$1(options.ttfResolver);
    if (options.bdfResolver)
      setFontResolver(options.bdfResolver);
  }

  // src/cards/display-card.js
  var isHA = typeof window !== "undefined" && (typeof window.hassConnection !== "undefined" || document.querySelector("home-assistant") !== null);
  if (isHA) {
    configureFonts({
      ttfResolver: (name) => `/hacsfiles/ipixel_color/fonts/${name}.ttf`,
      bdfResolver: (_name, file) => `/hacsfiles/ipixel_color/fonts/${file || _name}`
    });
  } else if (typeof window !== "undefined") {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    configureFonts({ baseUrl: `${basePath}fonts` });
  }
  var rendererCache = /* @__PURE__ */ new Map();
  var iPIXELDisplayCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._renderer = null;
      this._displayContainer = null;
      this._lastState = null;
      this._cachedResolution = null;
      this._rendererId = null;
      this._handleDisplayUpdate = (e) => {
        this._updateDisplay(e.detail);
      };
      window.addEventListener("ipixel-display-update", this._handleDisplayUpdate);
    }
    connectedCallback() {
      if (!this._rendererId) {
        this._rendererId = `renderer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      if (rendererCache.has(this._rendererId)) {
        this._renderer = rendererCache.get(this._rendererId);
      }
      loadBdfFont("VCR_OSD_MONO", 16).then(() => {
        if (this._lastState)
          this._updateDisplay(this._lastState);
      });
      loadBdfFont("VCR_OSD_MONO", 24);
      loadBdfFont("VCR_OSD_MONO", 32);
      loadBdfFont("CUSONG", 16);
      loadBdfFont("CUSONG", 24);
      loadBdfFont("CUSONG", 32);
      loadFont("VCR_OSD_MONO");
      loadFont("CUSONG");
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("ipixel-display-update", this._handleDisplayUpdate);
      if (this._renderer && this._rendererId) {
        this._renderer.stop();
        rendererCache.set(this._rendererId, this._renderer);
      }
    }
    /**
     * Get resolution with caching and fallback
     */
    _getResolutionCached() {
      const [sensorWidth, sensorHeight] = this.getResolution();
      if (sensorWidth > 0 && sensorHeight > 0) {
        this._cachedResolution = [sensorWidth, sensorHeight];
        try {
          localStorage.setItem("iPIXEL_Resolution", JSON.stringify([sensorWidth, sensorHeight]));
        } catch (e) {
        }
        return this._cachedResolution;
      }
      try {
        const saved = localStorage.getItem("iPIXEL_Resolution");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 2 && parsed[0] > 0 && parsed[1] > 0) {
            this._cachedResolution = parsed;
            return parsed;
          }
        }
      } catch (e) {
      }
      if (this._cachedResolution) {
        return this._cachedResolution;
      }
      if (this._config?.width && this._config?.height) {
        return [this._config.width, this._config.height];
      }
      return [sensorWidth || 64, sensorHeight || 16];
    }
    /**
     * Update the display with new state
     */
    _updateDisplay(state) {
      if (!this._displayContainer)
        return;
      const [width, height] = this._getResolutionCached();
      const isOn = this.isOn();
      if (!this._renderer) {
        this._renderer = new ImageDataLEDRenderer(this._displayContainer, { width, height });
        if (this._rendererId) {
          rendererCache.set(this._rendererId, this._renderer);
        }
      } else {
        this._renderer.setContainer(this._displayContainer);
        if (this._renderer.width !== width || this._renderer.height !== height) {
          this._renderer.setDimensions(width, height);
        }
      }
      if (!isOn) {
        this._renderer.setData([]);
        this._renderer.setEffect("fixed", 50);
        this._renderer.stop();
        this._renderer.renderStatic();
        return;
      }
      const text = state?.text || "";
      const effect = state?.effect || "fixed";
      const speed = state?.speed || 50;
      const fgColor = state?.fgColor || "#ff6600";
      const bgColor = state?.bgColor || "#111";
      const mode = state?.mode || "text";
      const font = state?.font || "VCR_OSD_MONO";
      this._lastState = state;
      let displayText = text;
      let displayFg = fgColor;
      if (mode === "clock") {
        const now = /* @__PURE__ */ new Date();
        displayText = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        displayFg = "#00ff88";
      } else if (mode === "gif") {
        displayText = "GIF";
        displayFg = "#ff44ff";
      } else if (mode === "rhythm") {
        displayText = "***";
        displayFg = "#44aaff";
      }
      const effectInfo = EFFECTS[effect];
      const isAmbient = effectInfo?.category === "ambient";
      if (isAmbient) {
        this._renderer.setData([], [], width);
      } else {
        const heightKey = getHeightKey$1(height);
        const useBdfFont = font !== "LEGACY" && isBdfFontLoaded(font, heightKey);
        const useCanvasFont = font !== "LEGACY" && isFontLoaded(font);
        const getPixels = (text2, w, h, fg, bg) => {
          if (useBdfFont) {
            const bdfPixels = textToPixelsBdf(text2, w, h, fg, bg, font);
            if (bdfPixels)
              return bdfPixels;
          }
          if (useCanvasFont) {
            const canvasPixels = textToPixelsCanvas(text2, w, h, fg, bg, font);
            if (canvasPixels)
              return canvasPixels;
          }
          return textToPixels(text2, w, h, fg, bg);
        };
        const getScrollPixels = (text2, displayW, h, fg, bg) => {
          if (useBdfFont) {
            const bdfResult = textToScrollPixelsBdf(text2, displayW, h, fg, bg, font);
            if (bdfResult)
              return bdfResult;
          }
          if (useCanvasFont) {
            const canvasResult = textToScrollPixelsCanvas(text2, displayW, h, fg, bg, font);
            if (canvasResult)
              return canvasResult;
          }
          return textToScrollPixels(text2, displayW, h, fg, bg);
        };
        const textPixelWidth = useCanvasFont ? displayText.length * 10 : displayText.length * 6;
        const needsScroll = (effect === "scroll_ltr" || effect === "scroll_rtl" || effect === "bounce") && textPixelWidth > width;
        if (needsScroll) {
          const scrollResult = getScrollPixels(displayText, width, height, displayFg, bgColor);
          const displayPixels = getPixels(displayText, width, height, displayFg, bgColor);
          this._renderer.setData(displayPixels, scrollResult.pixels, scrollResult.width);
        } else {
          const pixels = getPixels(displayText, width, height, displayFg, bgColor);
          this._renderer.setData(pixels);
        }
      }
      this._renderer.setEffect(effect, speed);
      if (effect === "fixed") {
        this._renderer.stop();
        this._renderer.renderStatic();
      } else {
        this._renderer.start();
      }
    }
    /**
     * Get sample state for test mode demo display
     */
    _getTestModeState() {
      const demos = [
        { text: "iPIXEL", effect: "scroll_ltr", speed: 40, fgColor: "#ff6600", bgColor: "#000000", mode: "text", font: "VCR_OSD_MONO" },
        { text: "Hello!", effect: "rainbow_cycle", speed: 50, fgColor: "#00ff88", bgColor: "#000000", mode: "text", font: "VCR_OSD_MONO" },
        { text: "TEST", effect: "fixed", speed: 50, fgColor: "#03a9f4", bgColor: "#111111", mode: "text", font: "VCR_OSD_MONO" },
        { text: "", effect: "rainbow", speed: 60, fgColor: "#ffffff", bgColor: "#000000", mode: "ambient", font: "VCR_OSD_MONO" }
      ];
      const idx = Math.floor(Date.now() / 1e4) % demos.length;
      return demos[idx];
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      const [width, height] = this._getResolutionCached();
      const isOn = this.isOn();
      const name = this._config.name || this.getEntity()?.attributes?.friendly_name || "iPIXEL Display";
      const sharedState = getDisplayState();
      const textEntity = this.getEntity();
      const entityText = textEntity?.state || "";
      const modeEntity = this.getRelatedEntity("select", "_mode");
      const currentMode = modeEntity?.state || sharedState.mode || "text";
      const currentText = sharedState.text || entityText || (testMode ? "iPIXEL" : "");
      const currentEffect = sharedState.effect || "fixed";
      const currentSpeed = sharedState.speed || 50;
      const fgColor = sharedState.fgColor || "#ff6600";
      const bgColor = sharedState.bgColor || "#111";
      const currentFont = sharedState.font || "VCR_OSD_MONO";
      const effectInfo = EFFECTS[currentEffect];
      const isAmbient = effectInfo?.category === "ambient";
      const missingFeatures = detectMissingFeatures();
      const testModeEnabled = isTestMode();
      let testModeBanner = "";
      if (testMode) {
        const featureWarnings = missingFeatures.length > 0 ? `<div class="test-mode-features">Missing: ${missingFeatures.join(", ")}</div>` : "";
        testModeBanner = `
        <div class="test-mode-banner">
          <div class="test-mode-header">
            <span class="test-mode-label">Test Mode</span>
            <button class="test-mode-toggle ${testModeEnabled ? "active" : ""}" id="test-mode-toggle">
              ${testModeEnabled ? "ON" : "OFF"}
            </button>
          </div>
          <div class="test-mode-desc">Preview display without a device</div>
          ${featureWarnings}
        </div>`;
      } else {
        testModeBanner = `
        <div class="test-mode-hint">
          <button class="test-mode-hint-btn" id="test-mode-toggle" title="Enable test mode for preview without a device">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15Z"/></svg>
            Test
          </button>
        </div>`;
      }
      const textEffects = Object.entries(EFFECTS).filter(([_, info]) => info.category === "text").map(([name2, info]) => `<option value="${name2}">${info.name}</option>`).join("");
      const ambientEffects = Object.entries(EFFECTS).filter(([_, info]) => info.category === "ambient").map(([name2, info]) => `<option value="${name2}">${info.name}</option>`).join("");
      const colorEffects = Object.entries(EFFECTS).filter(([_, info]) => info.category === "color").map(([name2, info]) => `<option value="${name2}">${info.name}</option>`).join("");
      this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .display-container { background: #000; border-radius: 8px; padding: 8px; border: 2px solid #222; }
        .display-screen {
          background: #000;
          border-radius: 4px;
          overflow: hidden;
          min-height: 60px;
        }
        .display-footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75em; opacity: 0.6; }
        .mode-badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; text-transform: capitalize; }
        .effect-badge { background: rgba(100,149,237,0.2); padding: 2px 6px; border-radius: 3px; margin-left: 4px; }
        .test-mode-banner {
          background: linear-gradient(135deg, rgba(255,152,0,0.15), rgba(255,87,34,0.1));
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        .test-mode-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .test-mode-label {
          font-size: 0.85em;
          font-weight: 600;
          color: #ff9800;
        }
        .test-mode-toggle {
          padding: 3px 10px;
          border: 1px solid rgba(255,152,0,0.4);
          border-radius: 12px;
          background: rgba(255,152,0,0.1);
          color: #ff9800;
          cursor: pointer;
          font-size: 0.75em;
          font-weight: 600;
          transition: all 0.2s;
        }
        .test-mode-toggle.active {
          background: #ff9800;
          color: #000;
        }
        .test-mode-desc {
          font-size: 0.75em;
          opacity: 0.7;
        }
        .test-mode-features {
          font-size: 0.7em;
          opacity: 0.6;
          margin-top: 4px;
          font-style: italic;
        }
        .test-mode-hint {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .test-mode-hint-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 10px;
          background: rgba(255,152,0,0.08);
          color: #ff9800;
          cursor: pointer;
          font-size: 0.75em;
          opacity: 0.85;
          transition: opacity 0.2s, background 0.2s;
          -webkit-tap-highlight-color: rgba(255,152,0,0.2);
        }
        .test-mode-hint-btn:hover,
        .test-mode-hint-btn:active { opacity: 1; background: rgba(255,152,0,0.15); }
        .test-mode-badge {
          background: rgba(255,152,0,0.2);
          color: #ff9800;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: 4px;
          font-size: 0.75em;
        }
        .demo-controls {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .demo-btn {
          padding: 5px 10px;
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 6px;
          background: rgba(255,152,0,0.08);
          color: inherit;
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .demo-btn:hover { background: rgba(255,152,0,0.2); }
        .demo-btn.active { background: rgba(255,152,0,0.25); border-color: #ff9800; }
      </style>
      <ha-card>
        <div class="card-content">
          ${testModeBanner}
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${isOn ? "" : "off"}"></span>
              ${name}
              ${testMode ? '<span class="test-mode-badge">Demo</span>' : ""}
            </div>
            <button class="icon-btn ${isOn ? "active" : ""}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${width} x ${height}</span>
              <span>
                <span class="mode-badge">${isOn ? currentMode : "Off"}</span>
                ${isOn && currentEffect !== "fixed" ? `<span class="effect-badge">${EFFECTS[currentEffect]?.name || currentEffect}</span>` : ""}
              </span>
            </div>
          </div>
          ${testMode ? `
          <div class="demo-controls">
            <button class="demo-btn" data-demo="text">Text</button>
            <button class="demo-btn" data-demo="scroll">Scroll</button>
            <button class="demo-btn" data-demo="rainbow">Rainbow</button>
            <button class="demo-btn" data-demo="clock">Clock</button>
            <button class="demo-btn" data-demo="fire">Fire</button>
            <button class="demo-btn" data-demo="stars">Stars</button>
          </div>` : ""}
        </div>
      </ha-card>`;
      this._displayContainer = this.shadowRoot.getElementById("display-screen");
      const displayState = testMode && !sharedState.text && sharedState.effect === "fixed" ? this._getTestModeState() : {
        text: currentText,
        effect: currentEffect,
        speed: currentSpeed,
        fgColor,
        bgColor,
        mode: currentMode,
        font: currentFont
      };
      this._updateDisplay(displayState);
      this._attachPowerButton();
      this._attachTestModeListeners();
    }
    _attachPowerButton() {
      this.shadowRoot.getElementById("power-btn")?.addEventListener("click", () => {
        if (this.isInTestMode()) {
          this._testPowerState = !this._testPowerState;
          this.render();
          return;
        }
        let switchId = this._switchEntityId;
        if (!switchId) {
          const sw = this.getRelatedEntity("switch");
          if (sw) {
            this._switchEntityId = sw.entity_id;
            switchId = sw.entity_id;
          }
        }
        if (switchId && this._hass?.states[switchId]) {
          this._hass.callService("switch", "toggle", { entity_id: switchId });
        } else {
          const allSwitches = Object.keys(this._hass?.states || {}).filter((e) => e.startsWith("switch."));
          const baseName = this._config.entity?.replace(/^[^.]+\./, "").replace(/_?(text|display|gif_url)$/i, "") || "";
          const match = allSwitches.find((s) => s.includes(baseName.substring(0, 10)));
          if (match) {
            this._switchEntityId = match;
            this._hass.callService("switch", "toggle", { entity_id: match });
          } else {
            console.warn("iPIXEL: No switch found. Entity:", this._config.entity, "Available:", allSwitches);
          }
        }
      });
    }
    _attachTestModeListeners() {
      this.shadowRoot.getElementById("test-mode-toggle")?.addEventListener("click", () => {
        setTestMode(!isTestMode());
      });
      this.shadowRoot.querySelectorAll("[data-demo]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const demo = e.currentTarget.dataset.demo;
          const demoStates = {
            text: { text: "iPIXEL", effect: "fixed", speed: 50, fgColor: "#ff6600", bgColor: "#000000", mode: "text", font: "VCR_OSD_MONO" },
            scroll: { text: "Hello World!", effect: "scroll_ltr", speed: 40, fgColor: "#00ff88", bgColor: "#000000", mode: "text", font: "VCR_OSD_MONO" },
            rainbow: { text: "", effect: "rainbow", speed: 60, fgColor: "#ffffff", bgColor: "#000000", mode: "ambient", font: "VCR_OSD_MONO" },
            clock: { text: "", effect: "fixed", speed: 50, fgColor: "#00ff88", bgColor: "#000000", mode: "clock", font: "VCR_OSD_MONO" },
            fire: { text: "", effect: "fire", speed: 50, fgColor: "#ffffff", bgColor: "#000000", mode: "ambient", font: "VCR_OSD_MONO" },
            stars: { text: "", effect: "stars", speed: 40, fgColor: "#ffffff", bgColor: "#000000", mode: "ambient", font: "VCR_OSD_MONO" }
          };
          const state = demoStates[demo];
          if (state) {
            updateDisplayState(state);
            this.shadowRoot.querySelectorAll("[data-demo]").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
          }
        });
      });
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/cards/controls-card.js
  var CLOCK_STYLES = [
    { value: 1, name: "Style 1 (Digital)" },
    { value: 2, name: "Style 2 (Minimal)" },
    { value: 3, name: "Style 3 (Bold)" },
    { value: 4, name: "Style 4 (Retro)" },
    { value: 5, name: "Style 5 (Neon)" },
    { value: 6, name: "Style 6 (Matrix)" },
    { value: 7, name: "Style 7 (Classic)" },
    { value: 8, name: "Style 8 (Modern)" }
  ];
  var ANIMATION_MODES = [
    { value: 0, name: "Static" },
    { value: 1, name: "Scroll Left" },
    { value: 2, name: "Scroll Right" },
    { value: 3, name: "Scroll Up" },
    { value: 4, name: "Scroll Down" },
    { value: 5, name: "Flash" },
    { value: 6, name: "Fade In/Out" },
    { value: 7, name: "Bounce" }
  ];
  var iPIXELControlsCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._clockStyle = 1;
      this._is24Hour = true;
      this._showDate = false;
      this._upsideDown = false;
      this._animationMode = 0;
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      const isOn = this.isOn();
      const upsideDownEntity = this.getRelatedEntity("switch", "_upside_down");
      if (upsideDownEntity) {
        this._upsideDown = upsideDownEntity.state === "on";
      }
      this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }
        .toggle-label {
          font-size: 0.85em;
          color: var(--primary-text-color, #fff);
        }
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .toggle-switch.active {
          background: var(--primary-color, #03a9f4);
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .toggle-switch.active::after {
          transform: translateX(20px);
        }
        .subsection {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .subsection-title {
          font-size: 0.75em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.6;
          margin-bottom: 8px;
        }
        .screen-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .screen-btn {
          padding: 8px 4px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8em;
          text-align: center;
          transition: all 0.2s;
        }
        .screen-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .screen-btn.active {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .screen-btn.saved {
          background: rgba(76,175,80,0.2);
          border-color: rgba(76,175,80,0.4);
        }
        .screen-btn.delete {
          background: rgba(244,67,54,0.2);
          border-color: rgba(244,67,54,0.3);
          color: #f44336;
        }
        .screen-btn.delete:hover {
          background: rgba(244,67,54,0.4);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .compact-row { display: flex; gap: 8px; align-items: center; }
        .compact-row select { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Quick Actions</div>
          <div class="control-row">
            <div class="button-grid button-grid-4">
              <button class="icon-btn ${isOn ? "active" : ""}" data-action="power" title="Power">
                <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clear" title="Clear">
                <svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clock" title="Clock">
                <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>
              </button>
              <button class="icon-btn" data-action="sync" title="Sync Time">
                <svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.5 16.5,3.5 14.5,3.13V5.17C15.86,5.5 17.08,6.23 18.2,7.27M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12M5.8,16.73L4.38,18.15C5.73,19.5 7.5,20.5 9.5,20.87V18.83C8.14,18.5 6.92,17.77 5.8,16.73M4,12H2A10,10 0 0,0 12,22V20A8,8 0 0,1 4,12Z"/></svg>
              </button>
            </div>
          </div>

          <div class="section-title">Brightness</div>
          <div class="control-row">
            <div class="slider-row">
              <input type="range" class="slider" id="brightness" min="1" max="100" value="50">
              <span class="slider-value" id="brightness-val">50%</span>
            </div>
          </div>

          <div class="section-title">Display Mode</div>
          <div class="control-row">
            <div class="button-grid button-grid-3">
              <button class="mode-btn" data-mode="textimage">Text+Image</button>
              <button class="mode-btn" data-mode="text">Text</button>
              <button class="mode-btn" data-mode="clock">Clock</button>
              <button class="mode-btn" data-mode="gif">GIF</button>
              <button class="mode-btn" data-mode="rhythm">Rhythm</button>
            </div>
          </div>

          <div class="section-title">Clock Settings</div>
          <div class="subsection">
            <div class="compact-row" style="margin-bottom: 12px;">
              <select class="dropdown" id="clock-style">
                ${CLOCK_STYLES.map((s) => `<option value="${s.value}"${s.value === this._clockStyle ? " selected" : ""}>${s.name}</option>`).join("")}
              </select>
              <button class="btn btn-primary" id="apply-clock-btn">Apply</button>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">24-Hour Format</span>
              <div class="toggle-switch ${this._is24Hour ? "active" : ""}" id="toggle-24h"></div>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">Show Date</span>
              <div class="toggle-switch ${this._showDate ? "active" : ""}" id="toggle-date"></div>
            </div>
          </div>

          <div class="section-title">Text Animation</div>
          <div class="control-row">
            <select class="dropdown" id="animation-mode">
              ${ANIMATION_MODES.map((m) => `<option value="${m.value}"${m.value === this._animationMode ? " selected" : ""}>${m.name}</option>`).join("")}
            </select>
          </div>

          <div class="section-title">Orientation & Display</div>
          <div class="two-col">
            <div>
              <div class="subsection-title">Rotation</div>
              <select class="dropdown" id="orientation">
                <option value="0">0\xB0 (Normal)</option>
                <option value="1">180\xB0</option>
              </select>
            </div>
            <div>
              <div class="subsection-title">Flip</div>
              <div class="toggle-row" style="padding: 4px 0;">
                <span class="toggle-label">Upside Down</span>
                <div class="toggle-switch ${this._upsideDown ? "active" : ""}" id="toggle-upside-down"></div>
              </div>
            </div>
          </div>

          <div class="section-title">Screen Slots</div>
          <div class="subsection">
            <div class="subsection-title">Show Saved Slot</div>
            <div class="screen-grid" style="margin-bottom: 12px;">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const saved = this._getSavedSlot(n);
        return `<button class="screen-btn${saved ? " saved" : ""}" data-show-slot="${n}" title="${saved ? saved.name : "Empty"}">${n}${saved ? "*" : ""}</button>`;
      }).join("")}
            </div>
            <div class="subsection-title">Auto-Cycle Slots</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
              <input type="text" class="text-input" id="program-slots" placeholder="e.g. 1,2,3" style="flex: 1;" value="${this._programSlots || ""}">
              <button class="btn btn-secondary" id="program-mode-btn">Cycle</button>
            </div>
            <div class="subsection-title">Select Screen Buffer (1-9)</div>
            <div class="screen-grid" style="margin-bottom: 12px;">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="screen-btn" data-screen="${n}">${n}</button>`).join("")}
            </div>
            <div class="subsection-title">Save Effect to Slot</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
              <select class="dropdown" id="save-slot" style="width: 70px;">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}">Slot ${n}</option>`).join("")}
              </select>
              <select class="dropdown" id="save-type" style="flex: 1;">
                <option value="gif">Animation (GIF)</option>
                <option value="image">Static Image</option>
              </select>
              <button class="btn btn-primary" id="save-to-slot-btn">Save</button>
            </div>
            <div id="save-gif-options" style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
              <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Frames</label>
              <input type="number" class="text-input" id="save-frames" value="30" min="5" max="120" style="width: 60px;">
              <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Delay ms</label>
              <input type="number" class="text-input" id="save-delay" value="100" min="20" max="500" step="10" style="width: 60px;">
            </div>
            <div id="save-progress" style="display: none; font-size: 0.8em; color: var(--primary-color, #03a9f4); margin-bottom: 12px;"></div>
            <div class="subsection-title">Delete Screen</div>
            <div class="screen-grid">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button class="screen-btn delete" data-delete="${n}">\xD7${n}</button>`).join("")}
            </div>
          </div>

          <div class="section-title">Font Settings</div>
          <div class="subsection">
            <div class="two-col" style="margin-bottom: 12px;">
              <div>
                <div class="subsection-title">Size (1-128)</div>
                <input type="number" class="text-input" id="font-size" value="16" min="1" max="128" style="width: 100%;">
              </div>
              <div>
                <div class="subsection-title">Offset X, Y</div>
                <div style="display: flex; gap: 4px;">
                  <input type="number" class="text-input" id="font-offset-x" value="0" min="-64" max="64" style="width: 50%;">
                  <input type="number" class="text-input" id="font-offset-y" value="0" min="-32" max="32" style="width: 50%;">
                </div>
              </div>
            </div>
          </div>

          <div class="section-title">DIY Mode</div>
          <div class="control-row">
            <select class="dropdown" id="diy-mode">
              <option value="">-- Select Action --</option>
              <option value="1">Enter (Clear Display)</option>
              <option value="3">Enter (Preserve Content)</option>
              <option value="0">Exit (Keep Previous)</option>
              <option value="2">Exit (Keep Current)</option>
            </select>
          </div>

          <div class="section-title">Raw Command</div>
          <div class="control-row" style="margin-top: 8px;">
            <div style="display: flex; gap: 8px;">
              <input type="text" class="text-input" id="raw-command" placeholder="Raw hex (e.g., 05 00 07 01 01)" style="flex: 1;">
              <button class="btn btn-secondary" id="send-raw-btn">Send</button>
            </div>
          </div>
        </div>
      </ha-card>`;
      this._attachControlListeners();
    }
    _attachControlListeners() {
      this.shadowRoot.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const action = e.currentTarget.dataset.action;
          if (action === "power") {
            const sw = this.getRelatedEntity("switch");
            if (sw) {
              this._hass.callService("switch", "toggle", { entity_id: sw.entity_id });
            }
          } else if (action === "clear") {
            updateDisplayState({ text: "", mode: "text", effect: "fixed", speed: 50, fgColor: "#ff6600", bgColor: "#000000" });
            this.callService("ipixel_color", "clear_pixels");
          } else if (action === "clock") {
            this._applyClockSettings();
          } else if (action === "sync") {
            this.callService("ipixel_color", "sync_time");
          }
        });
      });
      const slider = this.shadowRoot.getElementById("brightness");
      if (slider) {
        slider.style.setProperty("--value", `${slider.value}%`);
        slider.addEventListener("input", (e) => {
          e.target.style.setProperty("--value", `${e.target.value}%`);
          this.shadowRoot.getElementById("brightness-val").textContent = `${e.target.value}%`;
        });
        slider.addEventListener("change", (e) => {
          this.callService("ipixel_color", "set_brightness", { level: parseInt(e.target.value) });
        });
      }
      this.shadowRoot.querySelectorAll("[data-mode]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const mode = e.currentTarget.dataset.mode;
          const modeEntity = this.getRelatedEntity("select", "_mode");
          if (modeEntity) {
            this._hass.callService("select", "select_option", { entity_id: modeEntity.entity_id, option: mode });
          }
          const modeColors = {
            "text": "#ff6600",
            "textimage": "#ff6600",
            "clock": "#00ff88",
            "gif": "#ff44ff",
            "rhythm": "#44aaff"
          };
          updateDisplayState({
            mode,
            fgColor: modeColors[mode] || "#ff6600",
            text: mode === "clock" ? "" : window.iPIXELDisplayState?.text || ""
          });
          this.shadowRoot.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
        });
      });
      this.shadowRoot.getElementById("clock-style")?.addEventListener("change", (e) => {
        this._clockStyle = parseInt(e.target.value);
      });
      this.shadowRoot.getElementById("apply-clock-btn")?.addEventListener("click", () => {
        this._applyClockSettings();
      });
      this.shadowRoot.getElementById("toggle-24h")?.addEventListener("click", (e) => {
        this._is24Hour = !this._is24Hour;
        e.currentTarget.classList.toggle("active", this._is24Hour);
      });
      this.shadowRoot.getElementById("toggle-date")?.addEventListener("click", (e) => {
        this._showDate = !this._showDate;
        e.currentTarget.classList.toggle("active", this._showDate);
      });
      this.shadowRoot.getElementById("animation-mode")?.addEventListener("change", (e) => {
        this._animationMode = parseInt(e.target.value);
        updateDisplayState({ animationMode: this._animationMode });
        this.callService("ipixel_color", "set_animation_mode", { mode: this._animationMode });
      });
      this.shadowRoot.getElementById("orientation")?.addEventListener("change", (e) => {
        const orientation = parseInt(e.target.value);
        this.callService("ipixel_color", "set_orientation", { orientation });
      });
      this.shadowRoot.getElementById("toggle-upside-down")?.addEventListener("click", (e) => {
        this._upsideDown = !this._upsideDown;
        e.currentTarget.classList.toggle("active", this._upsideDown);
        const upsideDownEntity = this.getRelatedEntity("switch", "_upside_down");
        if (upsideDownEntity) {
          this._hass.callService("switch", this._upsideDown ? "turn_on" : "turn_off", {
            entity_id: upsideDownEntity.entity_id
          });
        } else {
          this.callService("ipixel_color", "set_upside_down", { enabled: this._upsideDown });
        }
      });
      this.shadowRoot.querySelectorAll("[data-show-slot]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const slot = parseInt(e.currentTarget.dataset.showSlot);
          this.callService("ipixel_color", "show_slot", { slot });
          this.shadowRoot.querySelectorAll("[data-show-slot]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
        });
      });
      this.shadowRoot.getElementById("program-mode-btn")?.addEventListener("click", () => {
        const input = this.shadowRoot.getElementById("program-slots")?.value || "";
        const slots = input.split(/[,\s]+/).map(Number).filter((n) => n >= 1 && n <= 255);
        if (slots.length) {
          this._programSlots = input;
          this.callService("ipixel_color", "program_mode", { slots });
        }
      });
      this.shadowRoot.querySelectorAll("[data-screen]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const screen = parseInt(e.currentTarget.dataset.screen);
          this.callService("ipixel_color", "set_screen", { screen });
          this.shadowRoot.querySelectorAll("[data-screen]").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
        });
      });
      this.shadowRoot.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const slot = parseInt(e.currentTarget.dataset.delete);
          if (confirm(`Delete screen slot ${slot}?`)) {
            this.callService("ipixel_color", "delete_screen", { slot });
            this._removeSavedSlot(slot);
            this.render();
          }
        });
      });
      this.shadowRoot.getElementById("save-type")?.addEventListener("change", (e) => {
        const gifOpts = this.shadowRoot.getElementById("save-gif-options");
        if (gifOpts)
          gifOpts.style.display = e.target.value === "gif" ? "flex" : "none";
      });
      this.shadowRoot.getElementById("save-to-slot-btn")?.addEventListener("click", async () => {
        const slot = parseInt(this.shadowRoot.getElementById("save-slot")?.value || "1");
        const type = this.shadowRoot.getElementById("save-type")?.value || "gif";
        const frames = parseInt(this.shadowRoot.getElementById("save-frames")?.value || "30");
        const delay = parseInt(this.shadowRoot.getElementById("save-delay")?.value || "100");
        const progress = this.shadowRoot.getElementById("save-progress");
        const btn = this.shadowRoot.getElementById("save-to-slot-btn");
        if (progress) {
          progress.style.display = "block";
          progress.textContent = "Starting...";
        }
        if (btn)
          btn.disabled = true;
        try {
          await this.callService("ipixel_color", "save_to_slot", {
            slot,
            type,
            frames,
            delay
          });
          const state = window.iPIXELDisplayState || {};
          this._setSavedSlot(slot, {
            name: state.text || state.effect || type,
            type,
            frames: type === "gif" ? frames : 1,
            savedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          if (progress)
            progress.textContent = "Saved!";
          setTimeout(() => this.render(), 1500);
        } catch (err) {
          if (progress)
            progress.textContent = "Error: " + err.message;
        } finally {
          if (btn)
            btn.disabled = false;
        }
      });
      this.shadowRoot.getElementById("font-size")?.addEventListener("change", (e) => {
        const size = parseInt(e.target.value);
        updateDisplayState({ fontSize: size });
        this.callService("ipixel_color", "set_font_size", { size });
      });
      this.shadowRoot.getElementById("font-offset-x")?.addEventListener("change", () => {
        this._updateFontOffset();
      });
      this.shadowRoot.getElementById("font-offset-y")?.addEventListener("change", () => {
        this._updateFontOffset();
      });
      this.shadowRoot.getElementById("diy-mode")?.addEventListener("change", (e) => {
        const mode = e.target.value;
        if (mode !== "") {
          this.callService("ipixel_color", "set_diy_mode", { mode });
          setTimeout(() => {
            e.target.value = "";
          }, 500);
        }
      });
      this.shadowRoot.getElementById("send-raw-btn")?.addEventListener("click", () => {
        const hexData = this.shadowRoot.getElementById("raw-command")?.value;
        if (hexData && hexData.trim()) {
          this.callService("ipixel_color", "send_raw_command", { hex_data: hexData.trim() });
        }
      });
      this.shadowRoot.getElementById("raw-command")?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const hexData = e.target.value;
          if (hexData && hexData.trim()) {
            this.callService("ipixel_color", "send_raw_command", { hex_data: hexData.trim() });
          }
        }
      });
    }
    _applyClockSettings() {
      updateDisplayState({
        text: "",
        mode: "clock",
        effect: "fixed",
        speed: 50,
        fgColor: "#00ff88",
        bgColor: "#000000",
        clockStyle: this._clockStyle,
        is24Hour: this._is24Hour,
        showDate: this._showDate
      });
      this.callService("ipixel_color", "set_clock_mode", {
        style: this._clockStyle,
        format_24h: this._is24Hour,
        show_date: this._showDate
      });
    }
    _updateFontOffset() {
      const x = parseInt(this.shadowRoot.getElementById("font-offset-x")?.value || "0");
      const y = parseInt(this.shadowRoot.getElementById("font-offset-y")?.value || "0");
      updateDisplayState({ fontOffsetX: x, fontOffsetY: y });
      this.callService("ipixel_color", "set_font_offset", { x, y });
    }
    // Slot tracking via localStorage
    _getSavedSlots() {
      try {
        return JSON.parse(localStorage.getItem("iPIXEL_SavedSlots") || "{}");
      } catch {
        return {};
      }
    }
    _getSavedSlot(n) {
      return this._getSavedSlots()[String(n)] || null;
    }
    _setSavedSlot(n, info) {
      const slots = this._getSavedSlots();
      slots[String(n)] = info;
      localStorage.setItem("iPIXEL_SavedSlots", JSON.stringify(slots));
    }
    _removeSavedSlot(n) {
      const slots = this._getSavedSlots();
      delete slots[String(n)];
      localStorage.setItem("iPIXEL_SavedSlots", JSON.stringify(slots));
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/cards/text-card.js
  var RAINBOW_MODES = [
    { value: 0, name: "None" },
    { value: 1, name: "Rainbow Wave" },
    { value: 2, name: "Rainbow Cycle" },
    { value: 3, name: "Rainbow Pulse" },
    { value: 4, name: "Rainbow Fade" },
    { value: 5, name: "Rainbow Chase" },
    { value: 6, name: "Rainbow Sparkle" },
    { value: 7, name: "Rainbow Gradient" },
    { value: 8, name: "Rainbow Theater" },
    { value: 9, name: "Rainbow Fire" }
  ];
  var RHYTHM_STYLES = [
    { value: 0, name: "Classic Bars" },
    { value: 1, name: "Mirrored Bars" },
    { value: 2, name: "Center Out" },
    { value: 3, name: "Wave Style" },
    { value: 4, name: "Particle Style" }
  ];
  var iPIXELTextCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._activeTab = "text";
      this._rhythmLevels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this._selectedRhythmStyle = 0;
      this._selectedAmbient = "rainbow";
    }
    /**
     * Generate text effect options (text + color effects)
     */
    _buildTextEffectOptions() {
      const textEffects = Object.entries(EFFECTS).filter(([_, info]) => info.category === EFFECT_CATEGORIES.TEXT).map(([name, info]) => `<option value="${name}">${info.name}</option>`).join("");
      const colorEffects = Object.entries(EFFECTS).filter(([_, info]) => info.category === EFFECT_CATEGORIES.COLOR).map(([name, info]) => `<option value="${name}">${info.name}</option>`).join("");
      return `
      <optgroup label="Text Effects">
        ${textEffects}
      </optgroup>
      <optgroup label="Color Effects">
        ${colorEffects}
      </optgroup>
    `;
    }
    /**
     * Generate ambient effect options
     */
    _buildAmbientEffectOptions() {
      return Object.entries(EFFECTS).filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT).map(([name, info]) => `<option value="${name}">${info.name}</option>`).join("");
    }
    /**
     * Build ambient effects as a button grid
     */
    _buildAmbientGrid() {
      const selected = this._selectedAmbient || "rainbow";
      return Object.entries(EFFECTS).filter(([_, info]) => info.category === EFFECT_CATEGORIES.AMBIENT).map(([name, info]) => `
        <button class="effect-btn ${name === selected ? "active" : ""}" data-effect="${name}">
          ${info.name}
        </button>
      `).join("");
    }
    /**
     * Build rainbow mode options for dropdown
     */
    _buildRainbowOptions() {
      return RAINBOW_MODES.map(
        (mode) => `<option value="${mode.value}">${mode.name}</option>`
      ).join("");
    }
    /**
     * Build rhythm style grid
     */
    _buildRhythmStyleGrid() {
      const selected = this._selectedRhythmStyle || 0;
      return RHYTHM_STYLES.map((style) => `
      <button class="style-btn ${style.value === selected ? "active" : ""}" data-style="${style.value}">
        ${style.name}
      </button>
    `).join("");
    }
    /**
     * Build rhythm level sliders (11 frequency bands)
     */
    _buildRhythmLevelSliders() {
      const labels = ["32Hz", "64Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "12kHz", "16kHz"];
      return this._rhythmLevels.map((level, i) => `
      <div class="rhythm-band">
        <label>${labels[i]}</label>
        <input type="range" class="rhythm-slider" data-band="${i}" min="0" max="15" value="${level}">
        <span class="rhythm-val">${level}</span>
      </div>
    `).join("");
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      const isTextTab = this._activeTab === "text";
      const isAmbientTab = this._activeTab === "ambient";
      const isRhythmTab = this._activeTab === "rhythm";
      const isAdvancedTab = this._activeTab === "advanced";
      this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
        .tab {
          flex: 1;
          padding: 10px 8px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          cursor: pointer;
          border-radius: 8px;
          font-size: 0.8em;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .tab:hover { background: rgba(255,255,255,0.1); }
        .tab.active {
          background: var(--primary-color, #03a9f4);
          color: #fff;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--primary-text-color, #fff); }
        select option { font-weight: normal; }
        .effect-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .effect-btn, .style-btn {
          padding: 12px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75em;
          text-align: center;
          transition: all 0.2s ease;
        }
        .effect-btn:hover, .style-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .effect-btn.active, .style-btn.active {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .rhythm-band {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rhythm-band label {
          width: 50px;
          font-size: 0.75em;
          opacity: 0.8;
        }
        .rhythm-slider {
          flex: 1;
          height: 4px;
        }
        .rhythm-val {
          width: 20px;
          font-size: 0.75em;
          text-align: right;
        }
        .rhythm-container {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .gfx-textarea {
          width: 100%;
          min-height: 150px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--primary-text-color, #fff);
          font-family: monospace;
          font-size: 0.8em;
          padding: 12px;
          resize: vertical;
        }
        .gfx-textarea:focus {
          outline: none;
          border-color: var(--primary-color, #03a9f4);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="tabs">
            <button class="tab ${isTextTab ? "active" : ""}" id="tab-text">Text</button>
            <button class="tab ${isAmbientTab ? "active" : ""}" id="tab-ambient">Ambient</button>
            <button class="tab ${isRhythmTab ? "active" : ""}" id="tab-rhythm">Rhythm</button>
            <button class="tab ${isAdvancedTab ? "active" : ""}" id="tab-advanced">GFX</button>
          </div>

          <!-- Text Tab -->
          <div class="tab-content ${isTextTab ? "active" : ""}" id="content-text">
            <div class="section-title">Display Text</div>
            <div class="input-row">
              <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
              <button class="btn btn-primary" id="send-btn">Send</button>
            </div>
            <div class="two-col">
              <div>
                <div class="section-title">Effect</div>
                <div class="control-row">
                  <select class="dropdown" id="text-effect">
                    ${this._buildTextEffectOptions()}
                  </select>
                </div>
              </div>
              <div>
                <div class="section-title">Rainbow Mode</div>
                <div class="control-row">
                  <select class="dropdown" id="rainbow-mode">
                    ${this._buildRainbowOptions()}
                  </select>
                </div>
              </div>
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="text-speed" min="1" max="100" value="50">
                <span class="slider-value" id="text-speed-val">50</span>
              </div>
            </div>
            <div class="section-title">Font</div>
            <div class="control-row">
              <select class="dropdown" id="font-select">
                <option value="VCR_OSD_MONO">VCR OSD Mono</option>
                <option value="CUSONG">CUSONG</option>
                <option value="LEGACY">Legacy (Bitmap)</option>
              </select>
            </div>
            <div class="section-title">Colors</div>
            <div class="control-row">
              <div class="color-row">
                <span style="font-size: 0.85em;">Text:</span>
                <input type="color" class="color-picker" id="text-color" value="#ff6600">
                <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
                <input type="color" class="color-picker" id="bg-color" value="#000000">
              </div>
            </div>
          </div>

          <!-- Ambient Tab -->
          <div class="tab-content ${isAmbientTab ? "active" : ""}" id="content-ambient">
            <div class="section-title">Ambient Effect</div>
            <div class="effect-grid" id="ambient-grid">
              ${this._buildAmbientGrid()}
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="ambient-speed" min="1" max="100" value="50">
                <span class="slider-value" id="ambient-speed-val">50</span>
              </div>
            </div>
            <button class="btn btn-primary" id="apply-ambient-btn" style="width: 100%; margin-top: 8px;">Apply Effect</button>
          </div>

          <!-- Rhythm Tab -->
          <div class="tab-content ${isRhythmTab ? "active" : ""}" id="content-rhythm">
            <div class="section-title">Visualization Style</div>
            <div class="style-grid" id="rhythm-style-grid">
              ${this._buildRhythmStyleGrid()}
            </div>
            <div class="section-title">Frequency Levels (0-15)</div>
            <div class="rhythm-container">
              ${this._buildRhythmLevelSliders()}
            </div>
            <button class="btn btn-primary" id="apply-rhythm-btn" style="width: 100%; margin-top: 12px;">Apply Rhythm</button>
          </div>

          <!-- Advanced/GFX Tab -->
          <div class="tab-content ${isAdvancedTab ? "active" : ""}" id="content-advanced">
            <div class="section-title">GFX JSON Data</div>
            <textarea class="gfx-textarea" id="gfx-json" placeholder='Enter GFX JSON data...
Example:
{
  "width": 64,
  "height": 16,
  "pixels": [
    {"x": 0, "y": 0, "color": "#ff0000"},
    {"x": 1, "y": 0, "color": "#00ff00"}
  ]
}'></textarea>
            <button class="btn btn-primary" id="apply-gfx-btn" style="width: 100%; margin-top: 12px;">Render GFX</button>
            <div class="section-title" style="margin-top: 16px;">Per-Character Colors</div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-text" placeholder="Text (e.g., HELLO)">
            </div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-colors" placeholder="Colors (e.g., #ff0000,#00ff00,#0000ff)">
            </div>
            <button class="btn btn-primary" id="apply-multicolor-btn" style="width: 100%; margin-top: 8px;">Send Multicolor Text</button>
          </div>
        </div>
      </ha-card>`;
      this._attachListeners();
    }
    /**
     * Get text tab form values
     */
    _getTextFormValues() {
      return {
        text: this.shadowRoot.getElementById("text-input")?.value || "",
        effect: this.shadowRoot.getElementById("text-effect")?.value || "fixed",
        rainbowMode: parseInt(this.shadowRoot.getElementById("rainbow-mode")?.value || "0"),
        speed: parseInt(this.shadowRoot.getElementById("text-speed")?.value || "50"),
        fgColor: this.shadowRoot.getElementById("text-color")?.value || "#ff6600",
        bgColor: this.shadowRoot.getElementById("bg-color")?.value || "#000000",
        font: this.shadowRoot.getElementById("font-select")?.value || "VCR_OSD_MONO"
      };
    }
    /**
     * Get rhythm tab form values
     */
    _getRhythmFormValues() {
      return {
        style: this._selectedRhythmStyle || 0,
        levels: [...this._rhythmLevels]
      };
    }
    /**
     * Get GFX/advanced tab form values
     */
    _getGfxFormValues() {
      const jsonText = this.shadowRoot.getElementById("gfx-json")?.value || "";
      try {
        return JSON.parse(jsonText);
      } catch (e) {
        return null;
      }
    }
    /**
     * Get multicolor text form values
     */
    _getMulticolorFormValues() {
      const text = this.shadowRoot.getElementById("multicolor-text")?.value || "";
      const colorsStr = this.shadowRoot.getElementById("multicolor-colors")?.value || "";
      const colors = colorsStr.split(",").map((c) => c.trim()).filter((c) => c);
      return { text, colors };
    }
    /**
     * Get ambient tab form values
     */
    _getAmbientFormValues() {
      return {
        effect: this._selectedAmbient || "rainbow",
        speed: parseInt(this.shadowRoot.getElementById("ambient-speed")?.value || "50")
      };
    }
    /**
     * Update text preview (without sending to device)
     */
    _updateTextPreview() {
      const { text, effect, speed, fgColor, bgColor, font } = this._getTextFormValues();
      updateDisplayState({
        text: text || "Preview",
        mode: "text",
        effect,
        speed,
        fgColor,
        bgColor,
        font
      });
    }
    /**
     * Update ambient preview
     */
    _updateAmbientPreview() {
      const { effect, speed } = this._getAmbientFormValues();
      updateDisplayState({
        text: "",
        mode: "ambient",
        effect,
        speed,
        fgColor: "#ffffff",
        bgColor: "#000000"
      });
    }
    _attachListeners() {
      this.shadowRoot.getElementById("tab-text")?.addEventListener("click", () => {
        this._activeTab = "text";
        this.render();
      });
      this.shadowRoot.getElementById("tab-ambient")?.addEventListener("click", () => {
        this._activeTab = "ambient";
        this.render();
      });
      this.shadowRoot.getElementById("tab-rhythm")?.addEventListener("click", () => {
        this._activeTab = "rhythm";
        this.render();
      });
      this.shadowRoot.getElementById("tab-advanced")?.addEventListener("click", () => {
        this._activeTab = "advanced";
        this.render();
      });
      const textSpeed = this.shadowRoot.getElementById("text-speed");
      if (textSpeed) {
        textSpeed.style.setProperty("--value", `${textSpeed.value}%`);
        textSpeed.addEventListener("input", (e) => {
          e.target.style.setProperty("--value", `${e.target.value}%`);
          this.shadowRoot.getElementById("text-speed-val").textContent = e.target.value;
          this._updateTextPreview();
        });
      }
      this.shadowRoot.getElementById("text-effect")?.addEventListener("change", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("rainbow-mode")?.addEventListener("change", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("font-select")?.addEventListener("change", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("text-color")?.addEventListener("input", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("bg-color")?.addEventListener("input", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("text-input")?.addEventListener("input", () => {
        this._updateTextPreview();
      });
      this.shadowRoot.getElementById("send-btn")?.addEventListener("click", () => {
        const { text, effect, rainbowMode, speed, fgColor, bgColor, font } = this._getTextFormValues();
        if (text) {
          updateDisplayState({
            text,
            mode: "text",
            effect,
            speed,
            fgColor,
            bgColor,
            font,
            rainbowMode
          });
          if (this.isInTestMode())
            return;
          if (this._config.entity && this._hass) {
            this._hass.callService("text", "set_value", {
              entity_id: this._config.entity,
              value: text
            });
          }
          const backendFont = font === "LEGACY" ? "CUSONG" : font;
          this.callService("ipixel_color", "display_text", {
            text,
            effect,
            speed,
            color_fg: this.hexToRgb(fgColor),
            color_bg: this.hexToRgb(bgColor),
            font: backendFont,
            rainbow_mode: rainbowMode
          });
        }
      });
      this.shadowRoot.querySelectorAll(".effect-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const effect = e.target.dataset.effect;
          this._selectedAmbient = effect;
          this.shadowRoot.querySelectorAll(".effect-btn").forEach((b) => b.classList.remove("active"));
          e.target.classList.add("active");
          this._updateAmbientPreview();
        });
      });
      const ambientSpeed = this.shadowRoot.getElementById("ambient-speed");
      if (ambientSpeed) {
        ambientSpeed.style.setProperty("--value", `${ambientSpeed.value}%`);
        ambientSpeed.addEventListener("input", (e) => {
          e.target.style.setProperty("--value", `${e.target.value}%`);
          this.shadowRoot.getElementById("ambient-speed-val").textContent = e.target.value;
          this._updateAmbientPreview();
        });
      }
      this.shadowRoot.getElementById("apply-ambient-btn")?.addEventListener("click", () => {
        const { effect, speed } = this._getAmbientFormValues();
        updateDisplayState({
          text: "",
          mode: "ambient",
          effect,
          speed,
          fgColor: "#ffffff",
          bgColor: "#000000"
        });
      });
      this.shadowRoot.querySelectorAll(".style-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const style = parseInt(e.target.dataset.style);
          this._selectedRhythmStyle = style;
          this.shadowRoot.querySelectorAll(".style-btn").forEach((b) => b.classList.remove("active"));
          e.target.classList.add("active");
        });
      });
      this.shadowRoot.querySelectorAll(".rhythm-slider").forEach((slider) => {
        slider.addEventListener("input", (e) => {
          const band = parseInt(e.target.dataset.band);
          const value = parseInt(e.target.value);
          this._rhythmLevels[band] = value;
          e.target.nextElementSibling.textContent = value;
        });
      });
      this.shadowRoot.getElementById("apply-rhythm-btn")?.addEventListener("click", () => {
        const { style, levels } = this._getRhythmFormValues();
        updateDisplayState({
          text: "",
          mode: "rhythm",
          rhythmStyle: style,
          rhythmLevels: levels
        });
        this.callService("ipixel_color", "set_rhythm_level", {
          style,
          levels
        });
      });
      this.shadowRoot.getElementById("apply-gfx-btn")?.addEventListener("click", () => {
        const gfxData = this._getGfxFormValues();
        if (!gfxData) {
          console.warn("iPIXEL: Invalid GFX JSON");
          return;
        }
        updateDisplayState({
          text: "",
          mode: "gfx",
          gfxData
        });
        this.callService("ipixel_color", "render_gfx", {
          data: gfxData
        });
      });
      this.shadowRoot.getElementById("apply-multicolor-btn")?.addEventListener("click", () => {
        const { text, colors } = this._getMulticolorFormValues();
        if (text && colors.length > 0) {
          updateDisplayState({
            text,
            mode: "multicolor",
            colors
          });
          this.callService("ipixel_color", "display_multicolor_text", {
            text,
            colors: colors.map((c) => this.hexToRgb(c))
          });
        }
      });
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/cards/playlist-card.js
  var PRESETS_STORAGE_KEY = "iPIXEL_Presets";
  var iPIXELPlaylistCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._presets = this._loadPresets();
      this._editingPreset = null;
      this._selectedIcon = "\u{1F4FA}";
    }
    _loadPresets() {
      try {
        const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    _savePresets() {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(this._presets));
      } catch (e) {
        console.warn("iPIXEL: Failed to save presets", e);
      }
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .preset-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          max-height: 300px;
          overflow-y: auto;
        }
        .preset-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-item:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }
        .preset-item.active {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.1);
        }
        .preset-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2em;
        }
        .preset-info {
          flex: 1;
          min-width: 0;
        }
        .preset-name {
          font-weight: 500;
          font-size: 0.9em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preset-desc {
          font-size: 0.75em;
          opacity: 0.6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .preset-actions {
          display: flex;
          gap: 4px;
        }
        .preset-actions button {
          padding: 6px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .preset-actions button:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .preset-actions button.delete:hover {
          background: rgba(244,67,54,0.2);
          color: #f44;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          opacity: 0.5;
        }
        .empty-state svg {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }
        .add-preset-form {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 16px;
        }
        .form-row {
          margin-bottom: 12px;
        }
        .form-row label {
          display: block;
          font-size: 0.8em;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .icon-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          margin-top: 8px;
        }
        .icon-option {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1em;
          transition: all 0.2s;
          background: transparent;
        }
        .icon-option:hover {
          background: rgba(255,255,255,0.1);
        }
        .icon-option.selected {
          border-color: var(--primary-color, #03a9f4);
          background: rgba(3, 169, 244, 0.2);
        }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">Presets</div>
            <button class="icon-btn" id="add-preset-btn" title="Save Current as Preset">
              <svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
            </button>
          </div>

          <div class="preset-list" id="preset-list">
            ${this._presets.length === 0 ? `
              <div class="empty-state">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"/></svg>
                <div>No presets saved</div>
                <div style="font-size: 0.85em; margin-top: 4px;">Click + to save current display</div>
              </div>
            ` : this._presets.map((preset, i) => `
              <div class="preset-item" data-index="${i}">
                <div class="preset-icon" style="background: ${preset.fgColor || "#ff6600"}20; color: ${preset.fgColor || "#ff6600"}">
                  ${preset.icon || "\u{1F4FA}"}
                </div>
                <div class="preset-info">
                  <div class="preset-name">${this._escapeHtml(preset.name)}</div>
                  <div class="preset-desc">${preset.mode} \xB7 ${preset.effect || "fixed"}${preset.text ? ' \xB7 "' + preset.text.substring(0, 15) + (preset.text.length > 15 ? "..." : "") + '"' : ""}</div>
                </div>
                <div class="preset-actions">
                  <button class="edit" data-action="edit" data-index="${i}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                  </button>
                  <button class="delete" data-action="delete" data-index="${i}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="add-preset-form" id="preset-form" style="display: none;">
            <div class="form-row">
              <label>Preset Name</label>
              <input type="text" class="text-input" id="preset-name" placeholder="My Preset">
            </div>
            <div class="form-row">
              <label>Icon</label>
              <div class="icon-grid" id="icon-grid">
                ${["\u{1F4FA}", "\u{1F4AC}", "\u23F0", "\u{1F3B5}", "\u{1F3A8}", "\u2B50", "\u2764\uFE0F", "\u{1F525}", "\u{1F4A1}", "\u{1F308}", "\u{1F3AE}", "\u{1F4E2}", "\u{1F3E0}", "\u{1F514}", "\u2728", "\u{1F389}"].map((icon) => `
                  <button type="button" class="icon-option${icon === this._selectedIcon ? " selected" : ""}" data-icon="${icon}">${icon}</button>
                `).join("")}
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" id="cancel-preset-btn">Cancel</button>
              <button class="btn btn-primary" id="save-preset-btn">Save Preset</button>
            </div>
          </div>
        </div>
      </ha-card>`;
      this._attachListeners();
    }
    _escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
    _attachListeners() {
      this.shadowRoot.getElementById("add-preset-btn")?.addEventListener("click", () => {
        this._editingPreset = null;
        this._selectedIcon = "\u{1F4FA}";
        this.shadowRoot.getElementById("preset-form").style.display = "block";
        this.shadowRoot.getElementById("preset-name").value = "";
        this.shadowRoot.querySelectorAll(".icon-option").forEach((o) => o.classList.remove("selected"));
        this.shadowRoot.querySelector(".icon-option")?.classList.add("selected");
      });
      this.shadowRoot.getElementById("cancel-preset-btn")?.addEventListener("click", () => {
        this.shadowRoot.getElementById("preset-form").style.display = "none";
        this._editingPreset = null;
      });
      this.shadowRoot.getElementById("save-preset-btn")?.addEventListener("click", () => {
        const name = this.shadowRoot.getElementById("preset-name").value.trim() || "Preset";
        const selectedIcon = this.shadowRoot.querySelector(".icon-option.selected");
        const icon = selectedIcon?.dataset.icon || "\u{1F4FA}";
        const currentState = getDisplayState();
        const preset = {
          name,
          icon,
          text: currentState.text || "",
          mode: currentState.mode || "text",
          effect: currentState.effect || "fixed",
          speed: currentState.speed || 50,
          fgColor: currentState.fgColor || "#ff6600",
          bgColor: currentState.bgColor || "#000000",
          font: currentState.font || "VCR_OSD_MONO",
          rainbowMode: currentState.rainbowMode || 0,
          createdAt: Date.now()
        };
        if (this._editingPreset !== null) {
          this._presets[this._editingPreset] = preset;
        } else {
          this._presets.push(preset);
        }
        this._savePresets();
        this.shadowRoot.getElementById("preset-form").style.display = "none";
        this._editingPreset = null;
        this.render();
      });
      this.shadowRoot.querySelectorAll(".icon-option").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          this.shadowRoot.querySelectorAll(".icon-option").forEach((o) => o.classList.remove("selected"));
          e.currentTarget.classList.add("selected");
          this._selectedIcon = e.currentTarget.dataset.icon;
        });
      });
      this.shadowRoot.querySelectorAll(".preset-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          if (e.target.closest(".preset-actions"))
            return;
          const index = parseInt(item.dataset.index);
          const preset = this._presets[index];
          if (preset) {
            updateDisplayState({
              text: preset.text,
              mode: preset.mode,
              effect: preset.effect,
              speed: preset.speed,
              fgColor: preset.fgColor,
              bgColor: preset.bgColor,
              font: preset.font,
              rainbowMode: preset.rainbowMode
            });
            if (preset.mode === "text" && preset.text) {
              this.callService("ipixel_color", "display_text", {
                text: preset.text,
                effect: preset.effect,
                speed: preset.speed,
                color_fg: this.hexToRgb(preset.fgColor),
                color_bg: this.hexToRgb(preset.bgColor),
                font: preset.font,
                rainbow_mode: preset.rainbowMode
              });
            }
            this.shadowRoot.querySelectorAll(".preset-item").forEach((p) => p.classList.remove("active"));
            item.classList.add("active");
          }
        });
      });
      this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const index = parseInt(e.currentTarget.dataset.index);
          const preset = this._presets[index];
          if (preset) {
            this._editingPreset = index;
            this._selectedIcon = preset.icon || "\u{1F4FA}";
            this.shadowRoot.getElementById("preset-form").style.display = "block";
            this.shadowRoot.getElementById("preset-name").value = preset.name;
            this.shadowRoot.querySelectorAll(".icon-option").forEach((o) => {
              o.classList.toggle("selected", o.dataset.icon === preset.icon);
            });
          }
        });
      });
      this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const index = parseInt(e.currentTarget.dataset.index);
          if (confirm("Delete this preset?")) {
            this._presets.splice(index, 1);
            this._savePresets();
            this.render();
          }
        });
      });
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/cards/schedule-card.js
  var SCHEDULES_STORAGE_KEY = "iPIXEL_Schedules";
  var iPIXELScheduleCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._schedules = this._loadSchedules();
      this._powerSchedule = this._loadPowerSchedule();
      this._editingSlot = null;
      this._checkInterval = null;
    }
    connectedCallback() {
      this._checkInterval = setInterval(() => this._checkSchedules(), 6e4);
      this._checkSchedules();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._checkInterval) {
        clearInterval(this._checkInterval);
      }
    }
    _loadSchedules() {
      try {
        const saved = localStorage.getItem(SCHEDULES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    _saveSchedules() {
      try {
        localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(this._schedules));
      } catch (e) {
        console.warn("iPIXEL: Failed to save schedules", e);
      }
    }
    _loadPowerSchedule() {
      try {
        const saved = localStorage.getItem("iPIXEL_PowerSchedule");
        return saved ? JSON.parse(saved) : { enabled: false, onTime: "07:00", offTime: "22:00" };
      } catch (e) {
        return { enabled: false, onTime: "07:00", offTime: "22:00" };
      }
    }
    _savePowerSchedule() {
      try {
        localStorage.setItem("iPIXEL_PowerSchedule", JSON.stringify(this._powerSchedule));
      } catch (e) {
        console.warn("iPIXEL: Failed to save power schedule", e);
      }
    }
    _checkSchedules() {
      const now = /* @__PURE__ */ new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const currentDay = now.getDay();
      for (const schedule of this._schedules) {
        if (!schedule.enabled)
          continue;
        if (schedule.days && !schedule.days.includes(currentDay))
          continue;
        if (schedule.startTime === currentTime) {
          updateDisplayState({
            text: schedule.text || "",
            mode: schedule.mode || "text",
            effect: schedule.effect || "fixed",
            fgColor: schedule.fgColor || "#ff6600",
            bgColor: schedule.bgColor || "#000000"
          });
          if (schedule.mode === "text" && schedule.text) {
            this.callService("ipixel_color", "display_text", {
              text: schedule.text,
              effect: schedule.effect,
              color_fg: this.hexToRgb(schedule.fgColor),
              color_bg: this.hexToRgb(schedule.bgColor)
            });
          } else if (schedule.mode === "clock") {
            this.callService("ipixel_color", "set_clock_mode", { style: 1 });
          }
        }
      }
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      const now = /* @__PURE__ */ new Date();
      const nowPos = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100;
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const scheduleBlocks = this._schedules.filter((s) => s.enabled).map((s) => {
        const startMins = this._timeToMinutes(s.startTime);
        const endMins = s.endTime ? this._timeToMinutes(s.endTime) : startMins + 60;
        const startPos = startMins / 1440 * 100;
        const width = (endMins - startMins) / 1440 * 100;
        return `<div class="timeline-block" style="left: ${startPos}%; width: ${width}%; background: ${s.fgColor || "#03a9f4"}40;" title="${s.name || "Schedule"}"></div>`;
      }).join("");
      const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      this.shadowRoot.innerHTML = `
      <style>${iPIXELCardStyles}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 32px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; left: ${nowPos}%; z-index: 2; }
        .timeline-block { position: absolute; height: 100%; border-radius: 2px; z-index: 1; }
        .power-section { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] {
          padding: 6px 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          color: inherit;
        }
        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          max-height: 250px;
          overflow-y: auto;
        }
        .schedule-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .schedule-toggle {
          width: 36px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }
        .schedule-toggle.active {
          background: var(--primary-color, #03a9f4);
        }
        .schedule-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .schedule-toggle.active::after {
          transform: translateX(16px);
        }
        .schedule-info { flex: 1; min-width: 0; }
        .schedule-name { font-weight: 500; font-size: 0.9em; }
        .schedule-time { font-size: 0.75em; opacity: 0.6; }
        .schedule-actions button {
          padding: 4px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          border-radius: 4px;
        }
        .schedule-actions button:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .add-slot-form {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 16px;
          margin-top: 12px;
        }
        .form-row { margin-bottom: 12px; }
        .form-row label { display: block; font-size: 0.8em; opacity: 0.7; margin-bottom: 4px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .day-selector {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .day-btn {
          width: 32px;
          height: 32px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          background: transparent;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .day-btn.selected {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
          color: #fff;
        }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .current-time { font-size: 0.85em; opacity: 0.7; text-align: right; margin-bottom: 4px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="current-time">Current: ${currentTime}</div>

          <div class="section-title">Timeline</div>
          <div class="timeline">
            <div class="timeline-header">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
            <div class="timeline-bar">
              ${scheduleBlocks}
              <div class="timeline-now"></div>
            </div>
          </div>

          <div class="section-title">Power Schedule</div>
          <div class="power-section">
            <div class="power-row">
              <div class="schedule-toggle ${this._powerSchedule.enabled ? "active" : ""}" id="power-toggle"></div>
              <label>On:</label>
              <input type="time" id="power-on" value="${this._powerSchedule.onTime}">
              <label>Off:</label>
              <input type="time" id="power-off" value="${this._powerSchedule.offTime}">
              <button class="btn btn-primary" id="save-power">Save</button>
            </div>
          </div>

          <div class="section-title">Content Schedules</div>
          <div class="schedule-list" id="schedule-list">
            ${this._schedules.length === 0 ? `
              <div class="empty-state" style="padding: 20px; text-align: center; opacity: 0.5;">
                No schedules configured
              </div>
            ` : this._schedules.map((slot, i) => `
              <div class="schedule-item" data-index="${i}">
                <div class="schedule-toggle ${slot.enabled ? "active" : ""}" data-action="toggle" data-index="${i}"></div>
                <div class="schedule-info">
                  <div class="schedule-name">${this._escapeHtml(slot.name || "Schedule " + (i + 1))}</div>
                  <div class="schedule-time">
                    ${slot.startTime}${slot.endTime ? " - " + slot.endTime : ""} \xB7
                    ${slot.days ? slot.days.map((d) => dayNames[d]).join(", ") : "Daily"} \xB7
                    ${slot.mode || "text"}
                  </div>
                </div>
                <div class="schedule-actions">
                  <button data-action="edit" data-index="${i}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                  </button>
                  <button data-action="delete" data-index="${i}" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>

          <button class="btn btn-secondary" id="add-slot" style="width: 100%;">+ Add Schedule</button>

          <div class="add-slot-form" id="slot-form" style="display: none;">
            <div class="form-row">
              <label>Name</label>
              <input type="text" class="text-input" id="slot-name" placeholder="Morning Message">
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Start Time</label>
                <input type="time" class="text-input" id="slot-start" value="08:00" style="width: 100%;">
              </div>
              <div class="form-row">
                <label>End Time (optional)</label>
                <input type="time" class="text-input" id="slot-end" style="width: 100%;">
              </div>
            </div>
            <div class="form-row">
              <label>Days</label>
              <div class="day-selector" id="day-selector">
                ${dayNames.map((name, i) => `
                  <button type="button" class="day-btn selected" data-day="${i}">${name}</button>
                `).join("")}
              </div>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Mode</label>
                <select class="dropdown" id="slot-mode">
                  <option value="text">Text</option>
                  <option value="clock">Clock</option>
                  <option value="off">Power Off</option>
                </select>
              </div>
              <div class="form-row">
                <label>Effect</label>
                <select class="dropdown" id="slot-effect">
                  <option value="fixed">Fixed</option>
                  <option value="scroll_ltr">Scroll Left</option>
                  <option value="scroll_rtl">Scroll Right</option>
                  <option value="blink">Blink</option>
                </select>
              </div>
            </div>
            <div class="form-row" id="text-row">
              <label>Text</label>
              <input type="text" class="text-input" id="slot-text" placeholder="Good Morning!">
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Text Color</label>
                <input type="color" id="slot-fg-color" value="#ff6600" style="width: 100%; height: 32px;">
              </div>
              <div class="form-row">
                <label>Background</label>
                <input type="color" id="slot-bg-color" value="#000000" style="width: 100%; height: 32px;">
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" id="cancel-slot">Cancel</button>
              <button class="btn btn-primary" id="save-slot">Save Schedule</button>
            </div>
          </div>
        </div>
      </ha-card>`;
      this._attachListeners();
    }
    _timeToMinutes(time) {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    }
    _escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
    _attachListeners() {
      this.shadowRoot.getElementById("power-toggle")?.addEventListener("click", (e) => {
        this._powerSchedule.enabled = !this._powerSchedule.enabled;
        e.currentTarget.classList.toggle("active", this._powerSchedule.enabled);
      });
      this.shadowRoot.getElementById("save-power")?.addEventListener("click", () => {
        this._powerSchedule.onTime = this.shadowRoot.getElementById("power-on")?.value || "07:00";
        this._powerSchedule.offTime = this.shadowRoot.getElementById("power-off")?.value || "22:00";
        this._savePowerSchedule();
        this.callService("ipixel_color", "set_power_schedule", {
          enabled: this._powerSchedule.enabled,
          on_time: this._powerSchedule.onTime,
          off_time: this._powerSchedule.offTime
        });
      });
      this.shadowRoot.getElementById("add-slot")?.addEventListener("click", () => {
        this._editingSlot = null;
        this._resetSlotForm();
        this.shadowRoot.getElementById("slot-form").style.display = "block";
      });
      this.shadowRoot.getElementById("cancel-slot")?.addEventListener("click", () => {
        this.shadowRoot.getElementById("slot-form").style.display = "none";
        this._editingSlot = null;
      });
      this.shadowRoot.querySelectorAll(".day-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.currentTarget.classList.toggle("selected");
        });
      });
      this.shadowRoot.getElementById("slot-mode")?.addEventListener("change", (e) => {
        const textRow = this.shadowRoot.getElementById("text-row");
        if (textRow) {
          textRow.style.display = e.target.value === "text" ? "block" : "none";
        }
      });
      this.shadowRoot.getElementById("save-slot")?.addEventListener("click", () => {
        const selectedDays = Array.from(this.shadowRoot.querySelectorAll(".day-btn.selected")).map((btn) => parseInt(btn.dataset.day));
        const slot = {
          name: this.shadowRoot.getElementById("slot-name")?.value || "Schedule",
          startTime: this.shadowRoot.getElementById("slot-start")?.value || "08:00",
          endTime: this.shadowRoot.getElementById("slot-end")?.value || "",
          days: selectedDays.length === 7 ? null : selectedDays,
          mode: this.shadowRoot.getElementById("slot-mode")?.value || "text",
          effect: this.shadowRoot.getElementById("slot-effect")?.value || "fixed",
          text: this.shadowRoot.getElementById("slot-text")?.value || "",
          fgColor: this.shadowRoot.getElementById("slot-fg-color")?.value || "#ff6600",
          bgColor: this.shadowRoot.getElementById("slot-bg-color")?.value || "#000000",
          enabled: true
        };
        if (this._editingSlot !== null) {
          this._schedules[this._editingSlot] = slot;
        } else {
          this._schedules.push(slot);
        }
        this._saveSchedules();
        this.shadowRoot.getElementById("slot-form").style.display = "none";
        this._editingSlot = null;
        this.render();
      });
      this.shadowRoot.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this._schedules[index].enabled = !this._schedules[index].enabled;
          this._saveSchedules();
          e.currentTarget.classList.toggle("active", this._schedules[index].enabled);
        });
      });
      this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          const slot = this._schedules[index];
          if (slot) {
            this._editingSlot = index;
            this._fillSlotForm(slot);
            this.shadowRoot.getElementById("slot-form").style.display = "block";
          }
        });
      });
      this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          if (confirm("Delete this schedule?")) {
            this._schedules.splice(index, 1);
            this._saveSchedules();
            this.render();
          }
        });
      });
    }
    _resetSlotForm() {
      this.shadowRoot.getElementById("slot-name").value = "";
      this.shadowRoot.getElementById("slot-start").value = "08:00";
      this.shadowRoot.getElementById("slot-end").value = "";
      this.shadowRoot.getElementById("slot-mode").value = "text";
      this.shadowRoot.getElementById("slot-effect").value = "fixed";
      this.shadowRoot.getElementById("slot-text").value = "";
      this.shadowRoot.getElementById("slot-fg-color").value = "#ff6600";
      this.shadowRoot.getElementById("slot-bg-color").value = "#000000";
      this.shadowRoot.querySelectorAll(".day-btn").forEach((btn) => btn.classList.add("selected"));
      this.shadowRoot.getElementById("text-row").style.display = "block";
    }
    _fillSlotForm(slot) {
      this.shadowRoot.getElementById("slot-name").value = slot.name || "";
      this.shadowRoot.getElementById("slot-start").value = slot.startTime || "08:00";
      this.shadowRoot.getElementById("slot-end").value = slot.endTime || "";
      this.shadowRoot.getElementById("slot-mode").value = slot.mode || "text";
      this.shadowRoot.getElementById("slot-effect").value = slot.effect || "fixed";
      this.shadowRoot.getElementById("slot-text").value = slot.text || "";
      this.shadowRoot.getElementById("slot-fg-color").value = slot.fgColor || "#ff6600";
      this.shadowRoot.getElementById("slot-bg-color").value = slot.bgColor || "#000000";
      const selectedDays = slot.days || [0, 1, 2, 3, 4, 5, 6];
      this.shadowRoot.querySelectorAll(".day-btn").forEach((btn) => {
        btn.classList.toggle("selected", selectedDays.includes(parseInt(btn.dataset.day)));
      });
      this.shadowRoot.getElementById("text-row").style.display = slot.mode === "text" ? "block" : "none";
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/cards/editor-card.js
  var PALETTE_COLORS = [
    "#FFFFFF",
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0080FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FF8000",
    "#8000FF",
    "#2EC4FF",
    "#0010A0",
    "#A0FF00",
    "#FF80C0",
    "#808080",
    "#C0C0C0"
  ];
  var RESOLUTION_PRESETS = [
    { value: "16x16", label: "16\xD716" },
    { value: "32x8", label: "32\xD78" },
    { value: "32x16", label: "32\xD716" },
    { value: "32x32", label: "32\xD732" },
    { value: "64x16", label: "64\xD716" },
    { value: "64x20", label: "64\xD720" },
    { value: "64x64", label: "64\xD764" },
    { value: "96x16", label: "96\xD716" },
    { value: "128x16", label: "128\xD716" },
    { value: "192x16", label: "192\xD716" }
  ];
  var BG_COLOR = { r: 25, g: 25, b: 25 };
  var iPIXELEditorCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._width = 64;
      this._height = 16;
      this._tool = "pen";
      this._drawing = false;
      this._gridOn = true;
      this._currentColor = "#ff6600";
      this._scale = 8;
      this._sending = false;
      this._logicalCanvas = document.createElement("canvas");
      this._ctx = this._logicalCanvas.getContext("2d");
      this._displayCanvas = null;
      this._dctx = null;
      this._initialized = false;
    }
    setConfig(config) {
      if (!config.entity && !this.isInTestMode()) {
        this._config = config;
        return;
      }
      this._config = config;
    }
    set hass(hass) {
      const hadHass = !!this._hass;
      this._hass = hass;
      const [w, h] = this.getResolution();
      if (!hadHass) {
        this._width = w;
        this._height = h;
        this._logicalCanvas.width = w;
        this._logicalCanvas.height = h;
        this.render();
      } else if (w !== this._width || h !== this._height) {
        this._width = w;
        this._height = h;
        this._logicalCanvas.width = w;
        this._logicalCanvas.height = h;
        this.render();
      }
    }
    render() {
      const testMode = this.isInTestMode();
      if (!this._hass && !testMode)
        return;
      const entity = this.getEntity();
      const isOn = this.isOn();
      const [deviceWidth, deviceHeight] = this.getResolution();
      const currentRes = `${this._width}x${this._height}`;
      const presetButtons = RESOLUTION_PRESETS.map((opt) => {
        const active = opt.value === currentRes ? "active" : "";
        return `<button class="preset-btn ${active}" data-res="${opt.value}">${opt.label}</button>`;
      }).join("");
      const paletteSwatches = PALETTE_COLORS.map((color) => {
        const active = color.toLowerCase() === this._currentColor.toLowerCase() ? "active" : "";
        return `<div class="color-swatch ${active}" data-color="${color}" style="background:${color}"></div>`;
      }).join("");
      this.shadowRoot.innerHTML = `
      <style>
        ${iPIXELCardStyles}

        .editor-toolbar {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .tool-group {
          display: flex;
          gap: 4px;
        }

        .color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 12px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          box-sizing: border-box;
        }

        .color-swatch:hover {
          border-color: rgba(255,255,255,0.5);
        }

        .color-swatch.active {
          border-color: var(--ipixel-primary);
          box-shadow: 0 0 0 1px var(--ipixel-primary);
        }

        .canvas-container {
          background: #050608;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 12px;
          overflow: auto;
          text-align: center;
        }

        #editor-canvas {
          display: inline-block;
          cursor: crosshair;
          image-rendering: pixelated;
          touch-action: none;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75em;
          opacity: 0.6;
          margin-bottom: 8px;
        }

        .tool-icon {
          font-size: 16px;
        }

        .resolution-inputs {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .resolution-inputs input {
          width: 48px;
          padding: 5px 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border);
          border-radius: 6px;
          color: inherit;
          font-size: 0.85em;
          text-align: center;
        }

        .resolution-inputs span {
          opacity: 0.5;
          font-size: 0.85em;
        }

        .resolution-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }

        .preset-btn {
          padding: 3px 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--ipixel-border);
          border-radius: 4px;
          color: inherit;
          font-size: 0.7em;
          cursor: pointer;
          opacity: 0.7;
        }

        .preset-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,0.12);
        }

        .preset-btn.active {
          border-color: var(--ipixel-primary);
          opacity: 1;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>

      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${isOn ? "" : "off"}"></span>
              ${this._config.name || "Pixel Editor"}
            </div>
          </div>

          <!-- Toolbar -->
          <div class="editor-toolbar">
            <div class="tool-group">
              <button class="icon-btn ${this._tool === "pen" ? "active" : ""}" id="pen-tool" title="Pen Tool">
                <span class="tool-icon">&#9998;</span>
              </button>
              <button class="icon-btn ${this._tool === "eraser" ? "active" : ""}" id="eraser-tool" title="Eraser Tool">
                <span class="tool-icon">&#9746;</span>
              </button>
            </div>
            <input type="color" class="color-picker" id="color-picker" value="${this._currentColor}" title="Pick Color">
            <button class="icon-btn ${this._gridOn ? "active" : ""}" id="grid-toggle" title="Toggle LED Grid">
              <span class="tool-icon">&#9638;</span>
            </button>
            <div class="resolution-inputs">
              <input type="number" id="res-width" value="${this._width}" min="1" max="512" title="Width">
              <span>\xD7</span>
              <input type="number" id="res-height" value="${this._height}" min="1" max="512" title="Height">
            </div>
          </div>

          <!-- Resolution Presets -->
          <div class="resolution-presets" id="res-presets">
            ${presetButtons}
          </div>

          <!-- Color Palette -->
          <div class="color-palette" id="palette">
            ${paletteSwatches}
          </div>

          <!-- Canvas -->
          <div class="canvas-container">
            <canvas id="editor-canvas"></canvas>
          </div>

          <!-- Info -->
          <div class="info-row">
            <span>Tool: ${this._tool} | Grid: ${this._gridOn ? "LED" : "Flat"}</span>
            <span>Device: ${deviceWidth}\xD7${deviceHeight}</span>
          </div>

          <!-- Actions -->
          <div class="button-grid button-grid-3">
            <button class="btn btn-secondary" id="clear-btn">Clear</button>
            <button class="btn btn-secondary" id="import-btn">Import</button>
            <button class="btn btn-primary send-btn" id="send-btn" ${this._sending ? "disabled" : ""}>
              ${this._sending ? "Sending..." : testMode ? "Preview Only" : "Send to Device"}
            </button>
          </div>

          <!-- Hidden file input for import -->
          <input type="file" id="file-input" accept="image/png,image/gif,image/jpeg" style="display:none">
        </div>
      </ha-card>
    `;
      this._initCanvas();
      this._attachListeners();
    }
    _initCanvas() {
      this._displayCanvas = this.shadowRoot.getElementById("editor-canvas");
      if (!this._displayCanvas)
        return;
      this._dctx = this._displayCanvas.getContext("2d");
      if (this._logicalCanvas.width !== this._width || this._logicalCanvas.height !== this._height) {
        this._logicalCanvas.width = this._width;
        this._logicalCanvas.height = this._height;
      }
      this._updateDisplaySize();
      this._renderDisplay();
      this._initialized = true;
    }
    _updateDisplaySize() {
      if (!this._displayCanvas)
        return;
      this._displayCanvas.width = this._width * this._scale;
      this._displayCanvas.height = this._height * this._scale;
    }
    _renderDisplay() {
      if (!this._dctx || !this._ctx)
        return;
      this._updateDisplaySize();
      this._dctx.fillStyle = "#050608";
      this._dctx.fillRect(0, 0, this._displayCanvas.width, this._displayCanvas.height);
      const imgData = this._ctx.getImageData(0, 0, this._width, this._height).data;
      const cellSize = this._scale;
      const ledRadius = cellSize * 0.38;
      for (let y = 0; y < this._height; y++) {
        for (let x = 0; x < this._width; x++) {
          const idx = (y * this._width + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];
          const isOffPixel = a === 0;
          const sx = x * cellSize;
          const sy = y * cellSize;
          const cx = sx + cellSize / 2;
          const cy = sy + cellSize / 2;
          this._dctx.fillStyle = `rgb(${BG_COLOR.r},${BG_COLOR.g},${BG_COLOR.b})`;
          this._dctx.fillRect(sx, sy, cellSize, cellSize);
          if (this._gridOn) {
            if (!isOffPixel) {
              const grad = this._dctx.createRadialGradient(
                cx,
                cy,
                ledRadius * 0.3,
                cx,
                cy,
                ledRadius * 1.8
              );
              grad.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
              grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
              this._dctx.fillStyle = grad;
              this._dctx.beginPath();
              this._dctx.arc(cx, cy, ledRadius * 1.8, 0, Math.PI * 2);
              this._dctx.fill();
              this._dctx.fillStyle = `rgb(${r},${g},${b})`;
              this._dctx.beginPath();
              this._dctx.arc(cx, cy, ledRadius, 0, Math.PI * 2);
              this._dctx.fill();
            } else {
              this._dctx.fillStyle = "rgb(5,5,5)";
              this._dctx.beginPath();
              this._dctx.arc(cx, cy, ledRadius, 0, Math.PI * 2);
              this._dctx.fill();
            }
          } else {
            if (!isOffPixel) {
              this._dctx.fillStyle = `rgb(${r},${g},${b})`;
            } else {
              this._dctx.fillStyle = `rgb(${BG_COLOR.r},${BG_COLOR.g},${BG_COLOR.b})`;
            }
            this._dctx.fillRect(sx, sy, cellSize, cellSize);
          }
        }
      }
    }
    _getPixelPos(evt) {
      if (!this._displayCanvas)
        return null;
      const rect = this._displayCanvas.getBoundingClientRect();
      const cellW = rect.width / this._width;
      const cellH = rect.height / this._height;
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      const x = Math.floor((clientX - rect.left) / cellW);
      const y = Math.floor((clientY - rect.top) / cellH);
      if (x < 0 || y < 0 || x >= this._width || y >= this._height)
        return null;
      return { x, y };
    }
    _drawAt(evt) {
      const p = this._getPixelPos(evt);
      if (!p)
        return;
      if (this._tool === "pen") {
        this._ctx.fillStyle = this._currentColor;
        this._ctx.fillRect(p.x, p.y, 1, 1);
      } else {
        this._ctx.clearRect(p.x, p.y, 1, 1);
      }
      this._renderDisplay();
    }
    _attachListeners() {
      const canvas = this.shadowRoot.getElementById("editor-canvas");
      if (!canvas)
        return;
      canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this._drawing = true;
        this._drawAt(e);
      });
      canvas.addEventListener("mousemove", (e) => {
        if (this._drawing)
          this._drawAt(e);
      });
      window.addEventListener("mouseup", () => {
        this._drawing = false;
      });
      canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this._drawing = true;
        this._drawAt(e);
      }, { passive: false });
      canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (this._drawing)
          this._drawAt(e);
      }, { passive: false });
      canvas.addEventListener("touchend", () => {
        this._drawing = false;
      });
      this.shadowRoot.getElementById("pen-tool")?.addEventListener("click", () => {
        this._tool = "pen";
        this.render();
      });
      this.shadowRoot.getElementById("eraser-tool")?.addEventListener("click", () => {
        this._tool = "eraser";
        this.render();
      });
      this.shadowRoot.getElementById("color-picker")?.addEventListener("input", (e) => {
        this._currentColor = e.target.value;
        this._updatePaletteSelection();
      });
      this.shadowRoot.querySelectorAll(".color-swatch").forEach((swatch) => {
        swatch.addEventListener("click", () => {
          this._currentColor = swatch.dataset.color;
          this.shadowRoot.getElementById("color-picker").value = this._currentColor;
          this._updatePaletteSelection();
        });
      });
      this.shadowRoot.getElementById("grid-toggle")?.addEventListener("click", () => {
        this._gridOn = !this._gridOn;
        this.render();
      });
      const applyResInputs = () => {
        const w = parseInt(this.shadowRoot.getElementById("res-width")?.value, 10);
        const h = parseInt(this.shadowRoot.getElementById("res-height")?.value, 10);
        if (w > 0 && h > 0 && (w !== this._width || h !== this._height)) {
          this._resizeCanvas(w, h);
        }
      };
      this.shadowRoot.getElementById("res-width")?.addEventListener("change", applyResInputs);
      this.shadowRoot.getElementById("res-height")?.addEventListener("change", applyResInputs);
      this.shadowRoot.querySelectorAll(".preset-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const [w, h] = btn.dataset.res.split("x").map((v) => parseInt(v, 10));
          this._resizeCanvas(w, h);
          const widthInput = this.shadowRoot.getElementById("res-width");
          const heightInput = this.shadowRoot.getElementById("res-height");
          if (widthInput)
            widthInput.value = w;
          if (heightInput)
            heightInput.value = h;
        });
      });
      this.shadowRoot.getElementById("clear-btn")?.addEventListener("click", () => {
        this._clearCanvas();
      });
      this.shadowRoot.getElementById("import-btn")?.addEventListener("click", () => {
        this.shadowRoot.getElementById("file-input")?.click();
      });
      this.shadowRoot.getElementById("file-input")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file)
          this._handleImport(file);
      });
      this.shadowRoot.getElementById("send-btn")?.addEventListener("click", () => {
        this._sendToDevice();
      });
    }
    _updatePaletteSelection() {
      this.shadowRoot.querySelectorAll(".color-swatch").forEach((swatch) => {
        if (swatch.dataset.color.toLowerCase() === this._currentColor.toLowerCase()) {
          swatch.classList.add("active");
        } else {
          swatch.classList.remove("active");
        }
      });
    }
    _resizeCanvas(w, h) {
      const oldData = this._ctx.getImageData(0, 0, this._width, this._height);
      this._width = w;
      this._height = h;
      this._logicalCanvas.width = w;
      this._logicalCanvas.height = h;
      this._ctx.putImageData(oldData, 0, 0);
      this._updateDisplaySize();
      this._renderDisplay();
      const infoRow = this.shadowRoot.querySelector(".info-row span:first-child");
      if (infoRow) {
        infoRow.textContent = `Tool: ${this._tool} | Grid: ${this._gridOn ? "LED" : "Flat"}`;
      }
    }
    _clearCanvas() {
      this._ctx.clearRect(0, 0, this._width, this._height);
      this._renderDisplay();
    }
    _handleImport(file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          this._ctx.clearRect(0, 0, this._width, this._height);
          this._ctx.imageSmoothingEnabled = false;
          this._ctx.drawImage(img, 0, 0, this._width, this._height);
          this._renderDisplay();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
    async _sendToDevice() {
      if (this._sending)
        return;
      this._sending = true;
      this.render();
      try {
        const imgData = this._ctx.getImageData(0, 0, this._width, this._height).data;
        const pixels = [];
        for (let y = 0; y < this._height; y++) {
          for (let x = 0; x < this._width; x++) {
            const idx = (y * this._width + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];
            if (a > 0) {
              pixels.push({
                x,
                y,
                color: this._rgbToHex(r, g, b)
              });
            }
          }
        }
        if (pixels.length > 0) {
          await this.callService("ipixel_color", "set_pixels", {
            pixels
          });
        }
      } catch (err) {
        console.error("Failed to send pixels to device:", err);
      } finally {
        this._sending = false;
        this.render();
      }
    }
    _rgbToHex(r, g, b) {
      return (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
    getCardSize() {
      return 4;
    }
  };

  // src/cards/gallery-card.js
  var _keepPlayFrames = ImageDataLEDRenderer.prototype.playFrames;
  var isHA2 = typeof window !== "undefined" && (typeof window.hassConnection !== "undefined" || document.querySelector("home-assistant") !== null);
  var GALLERY_BASE = isHA2 ? "/ipixel_color/gallery" : `${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)}gallery`;
  var USER_GIFS_KEY = "iPIXEL_UserGIFs";
  var iPIXELGalleryCard = class extends iPIXELCardBase {
    constructor() {
      super();
      this._manifest = null;
      this._loading = false;
      this._selectedSize = null;
      this._filter = "all";
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
      if (this._manifest)
        return;
      this._loading = true;
      this.render();
      try {
        const resp = await fetch(`${GALLERY_BASE}/manifest.json`);
        this._manifest = await resp.json();
        this._autoSelectSize();
      } catch (err) {
        console.error("iPIXEL Gallery: Failed to load manifest", err);
        this._manifest = {};
      }
      this._loading = false;
      this.render();
    }
    _autoSelectSize() {
      if (!this._manifest)
        return;
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
      if (!this._manifest)
        return [];
      return Object.keys(this._manifest).sort((a, b) => {
        const [aw, ah] = a.split("x").map(Number);
        const [bw, bh] = b.split("x").map(Number);
        return ah - bh || aw - bw;
      });
    }
    // ── User GIFs (localStorage) ──
    _getUserGifs() {
      try {
        return JSON.parse(localStorage.getItem(USER_GIFS_KEY) || "[]");
      } catch {
        return [];
      }
    }
    _saveUserGifs(gifs) {
      localStorage.setItem(USER_GIFS_KEY, JSON.stringify(gifs));
    }
    _addUserGif(name, dataUrl) {
      const gifs = this._getUserGifs();
      const existing = gifs.findIndex((g) => g.name === name);
      if (existing >= 0)
        gifs[existing] = { name, dataUrl, addedAt: Date.now() };
      else
        gifs.push({ name, dataUrl, addedAt: Date.now() });
      this._saveUserGifs(gifs);
    }
    _removeUserGif(name) {
      const gifs = this._getUserGifs().filter((g) => g.name !== name);
      this._saveUserGifs(gifs);
    }
    // ── Items ──
    _getItems() {
      if (!this._manifest || !this._selectedSize) {
        if (this._filter === "user" || this._filter === "all") {
          return this._getUserGifs().map((g) => ({ ...g, type: "user" }));
        }
        return [];
      }
      const data = this._manifest[this._selectedSize];
      const bundled = [];
      if (this._filter !== "user") {
        if (this._filter === "all" || this._filter === "animations") {
          (data?.animations || []).forEach((a) => bundled.push({ ...a, type: "bundled" }));
        }
        if (this._filter === "all" || this._filter === "eyes") {
          (data?.eyes || []).forEach((e) => bundled.push({ ...e, type: "bundled" }));
        }
      }
      const userGifs = this._filter === "all" || this._filter === "user" ? this._getUserGifs().map((g) => ({ ...g, type: "user" })) : [];
      return [...userGifs, ...bundled];
    }
    // ── GIF preview on display renderer ──
    async _playGifOnPreview(url) {
      const displayCard = document.querySelector("ipixel-display-card");
      const renderer = displayCard?._renderer;
      if (!renderer) {
        console.warn("iPIXEL Gallery: No display renderer found for preview");
        return;
      }
      const MAX_FRAMES = 120;
      const w = renderer.width, h = renderer.height;
      console.info("iPIXEL Gallery: Decoding GIF for preview", { url: url.slice(-40), w, h });
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const frames = [];
        let avgDelay = 100;
        if (typeof ImageDecoder !== "undefined") {
          const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type: "image/gif" });
          await decoder.tracks.ready;
          const total = Math.min(decoder.tracks.selectedTrack.frameCount, MAX_FRAMES);
          const offCanvas = new OffscreenCanvas(w, h);
          const ctx = offCanvas.getContext("2d", { willReadFrequently: true });
          for (let i = 0; i < total; i++) {
            const result = await decoder.decode({ frameIndex: i });
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(result.image, 0, 0, w, h);
            if (i === 0 && result.image.duration)
              avgDelay = result.image.duration / 1e3;
            const d = ctx.getImageData(0, 0, w, h).data;
            const pixels = [];
            for (let p = 0; p < w * h; p++) {
              const ri = d[p * 4], gi = d[p * 4 + 1], bi = d[p * 4 + 2], ai = d[p * 4 + 3];
              pixels.push(ai < 128 ? "#000000" : "#" + ri.toString(16).padStart(2, "0") + gi.toString(16).padStart(2, "0") + bi.toString(16).padStart(2, "0"));
            }
            frames.push(pixels);
            result.image.close();
          }
          decoder.close();
        } else {
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, w, h);
          const d = ctx.getImageData(0, 0, w, h).data;
          const pixels = [];
          for (let p = 0; p < w * h; p++) {
            const ri = d[p * 4], gi = d[p * 4 + 1], bi = d[p * 4 + 2], ai = d[p * 4 + 3];
            pixels.push(ai < 128 ? "#000000" : "#" + ri.toString(16).padStart(2, "0") + gi.toString(16).padStart(2, "0") + bi.toString(16).padStart(2, "0"));
          }
          frames.push(pixels);
          URL.revokeObjectURL(img.src);
        }
        console.info("iPIXEL Gallery: Decoded", frames.length, "frames, delay:", avgDelay);
        renderer.stopFrames?.();
        renderer.stop();
        if (frames.length > 1 && renderer.playFrames) {
          renderer.playFrames(frames, Math.max(20, avgDelay));
        } else if (frames.length > 0) {
          renderer.setData(frames[0]);
          renderer.setEffect("fixed", 50);
          renderer.renderStatic();
        }
      } catch (err) {
        console.error("iPIXEL Gallery: GIF preview failed", err);
      }
    }
    // ── Send ──
    async _sendToDevice(item) {
      this._sending = item.name || item.file;
      this.render();
      const previewUrl = item.type === "user" ? item.dataUrl : `${GALLERY_BASE}/${this._selectedSize}/${item.file}`;
      if (item.type === "user" || isHA2) {
        this._playGifOnPreview(previewUrl);
      }
      try {
        if (item.type === "user") {
          const resp = await fetch(item.dataUrl);
          const blob = await resp.blob();
          if (window.iPIXEL_BLE && window.iPIXEL_BLE.isConnected()) {
            const arrayBuf = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuf);
            const slot = this._slotMode ? this._targetSlot : 1;
            await window.iPIXEL_BLE.saveGifToSlot(slot, bytes);
          } else {
            console.warn("iPIXEL Gallery: User GIF send requires BLE connection or HA backend support");
            const serviceData = { gif_url: item.dataUrl };
            if (this._slotMode)
              serviceData.buffer_slot = this._targetSlot;
            await this.callService("ipixel_color", "upload_gif", serviceData);
          }
        } else {
          const serviceData = {
            size: this._selectedSize,
            filename: item.file
          };
          if (this._slotMode)
            serviceData.buffer_slot = this._targetSlot;
          await this.callService("ipixel_color", "display_local_gallery", serviceData);
        }
      } catch (err) {
        console.error("iPIXEL Gallery: Send failed", err);
      }
      this._sending = null;
      this.render();
    }
    // ── File handling ──
    _handleFiles(files) {
      for (const file of files) {
        if (!file.type.startsWith("image/"))
          continue;
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
      if (!this._hass && !testMode)
        return;
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

          ${this._loading ? '<div class="empty-state">Loading gallery...</div>' : ""}

          ${!this._loading ? `
            ${sizes.length > 0 ? `
              <div class="section-title">Display Size</div>
              <div class="size-select">
                ${sizes.map((s) => {
        const [w, h] = this.getResolution();
        const isMatch = s === `${w}x${h}`;
        return `<button class="size-btn${s === this._selectedSize ? " active" : ""}${isMatch ? " match" : ""}" data-size="${s}">${s}</button>`;
      }).join("")}
              </div>
            ` : ""}

            <div class="filter-row">
              <button class="filter-btn${this._filter === "all" ? " active" : ""}" data-filter="all">All</button>
              ${hasAnimations ? `<button class="filter-btn${this._filter === "animations" ? " active" : ""}" data-filter="animations">Animations</button>` : ""}
              ${hasEyes ? `<button class="filter-btn${this._filter === "eyes" ? " active" : ""}" data-filter="eyes">Eyes</button>` : ""}
              <button class="filter-btn${this._filter === "user" ? " active" : ""}" data-filter="user">My GIFs${hasUserGifs ? ` (${userGifs.length})` : ""}</button>
            </div>

            <div class="slot-row">
              <div id="slot-toggle" style="
                width: 36px; height: 20px; background: ${this._slotMode ? "var(--ipixel-primary)" : "rgba(255,255,255,0.1)"};
                border-radius: 10px; position: relative; cursor: pointer; flex-shrink: 0; transition: background 0.2s;
              "><span style="
                position: absolute; top: 2px; left: ${this._slotMode ? "18px" : "2px"}; width: 16px; height: 16px;
                background: #fff; border-radius: 50%; transition: left 0.2s;
              "></span></div>
              <label>Save to slot</label>
              <select id="target-slot" ${!this._slotMode ? "disabled" : ""}>
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}"${n === this._targetSlot ? " selected" : ""}>Slot ${n}</option>`).join("")}
              </select>
            </div>

            <div class="drop-zone${this._dragOver ? " drag-over" : ""}" id="drop-zone">
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
                ${items.map((item) => {
        const id = item.name || item.file;
        const isSending = this._sending === id;
        const isUser = item.type === "user";
        const label = isUser ? item.name.replace(/\.[^.]+$/, "") : item.side ? `Eye ${item.side.toUpperCase()} #${item.num}` : `#${item.num}`;
        const src = isUser ? item.dataUrl : `${GALLERY_BASE}/${this._selectedSize}/${item.file}`;
        return `
                    <div class="gallery-item${isSending ? " sending" : ""}${isUser ? " user-gif" : ""}"
                         data-id="${id}" data-type="${item.type}" title="${id}">
                      <img src="${src}" loading="lazy" alt="${label}">
                      <div class="item-label">${label}</div>
                      ${isUser ? `<button class="delete-btn" data-delete="${item.name}">x</button>` : ""}
                      ${isSending ? '<div class="sending-overlay">Sending...</div>' : ""}
                    </div>`;
      }).join("")}
              </div>
            ` : `
              <div class="empty-state">
                ${this._filter === "user" ? "No uploaded GIFs yet. Drop files above to add some!" : "No items for this filter."}
              </div>
            `}
          ` : ""}
        </div>
      </ha-card>`;
      this._attachListeners();
    }
    _attachListeners() {
      this.shadowRoot.querySelectorAll("[data-size]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this._selectedSize = e.currentTarget.dataset.size;
          this._filter = "all";
          this.render();
        });
      });
      this.shadowRoot.querySelectorAll("[data-filter]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this._filter = e.currentTarget.dataset.filter;
          this.render();
        });
      });
      this.shadowRoot.getElementById("slot-toggle")?.addEventListener("click", () => {
        this._slotMode = !this._slotMode;
        this.render();
      });
      this.shadowRoot.getElementById("target-slot")?.addEventListener("change", (e) => {
        this._targetSlot = parseInt(e.target.value);
      });
      const dropZone = this.shadowRoot.getElementById("drop-zone");
      if (dropZone) {
        dropZone.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!this._dragOver) {
            this._dragOver = true;
            dropZone.classList.add("drag-over");
          }
        });
        dropZone.addEventListener("dragleave", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._dragOver = false;
          dropZone.classList.remove("drag-over");
        });
        dropZone.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._dragOver = false;
          if (e.dataTransfer?.files?.length) {
            this._handleFiles(e.dataTransfer.files);
          }
        });
        dropZone.addEventListener("click", () => {
          this.shadowRoot.getElementById("file-input")?.click();
        });
      }
      this.shadowRoot.getElementById("file-input")?.addEventListener("change", (e) => {
        if (e.target.files?.length) {
          this._handleFiles(e.target.files);
        }
      });
      this.shadowRoot.querySelectorAll(".gallery-item").forEach((el) => {
        el.addEventListener("click", (e) => {
          if (e.target.classList.contains("delete-btn"))
            return;
          const id = el.dataset.id;
          const items = this._getItems();
          const item = items.find((i) => (i.name || i.file) === id);
          if (item && !this._sending) {
            this._sendToDevice(item);
          }
        });
      });
      this.shadowRoot.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = e.currentTarget.dataset.delete;
          this._removeUserGif(name);
          this.render();
        });
      });
    }
    static getConfigElement() {
      return document.createElement("ipixel-simple-editor");
    }
    static getStubConfig() {
      return { entity: "" };
    }
  };

  // src/editor.js
  var iPIXELSimpleEditor = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    setConfig(config) {
      this._config = config;
      this.render();
    }
    set hass(hass) {
      this._hass = hass;
      this.render();
    }
    render() {
      if (!this._hass)
        return;
      const entities = Object.keys(this._hass.states).filter((e) => e.startsWith("text.") || e.startsWith("switch.")).sort();
      this.shadowRoot.innerHTML = `
      <style>
        .row { margin-bottom: 12px; }
        label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; }
        select, input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color);
          color: inherit;
          box-sizing: border-box;
        }
      </style>
      <div class="row">
        <label>Entity</label>
        <select id="entity">
          <option value="">Select entity</option>
          ${entities.map((e) => `
            <option value="${e}" ${this._config?.entity === e ? "selected" : ""}>
              ${this._hass.states[e]?.attributes?.friendly_name || e}
            </option>
          `).join("")}
        </select>
      </div>
      <div class="row">
        <label>Name (optional)</label>
        <input type="text" id="name" value="${this._config?.name || ""}" placeholder="Display name">
      </div>`;
      this.shadowRoot.querySelectorAll("select, input").forEach((el) => {
        el.addEventListener("change", () => this.fireConfig());
      });
    }
    fireConfig() {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: {
          config: {
            type: this._config?.type || "custom:ipixel-display-card",
            entity: this.shadowRoot.getElementById("entity")?.value,
            name: this.shadowRoot.getElementById("name")?.value || void 0
          }
        },
        bubbles: true,
        composed: true
      }));
    }
  };

  // src/index.js
  customElements.define("ipixel-display-card", iPIXELDisplayCard);
  customElements.define("ipixel-controls-card", iPIXELControlsCard);
  customElements.define("ipixel-text-card", iPIXELTextCard);
  customElements.define("ipixel-playlist-card", iPIXELPlaylistCard);
  customElements.define("ipixel-schedule-card", iPIXELScheduleCard);
  customElements.define("ipixel-editor-card", iPIXELEditorCard);
  customElements.define("ipixel-gallery-card", iPIXELGalleryCard);
  customElements.define("ipixel-simple-editor", iPIXELSimpleEditor);
  window.customCards = window.customCards || [];
  [
    { type: "ipixel-display-card", name: "iPIXEL Display", description: "LED matrix preview with power control" },
    { type: "ipixel-controls-card", name: "iPIXEL Controls", description: "Brightness, mode, and orientation controls" },
    { type: "ipixel-text-card", name: "iPIXEL Text", description: "Text input with effects and colors" },
    { type: "ipixel-playlist-card", name: "iPIXEL Playlist", description: "Playlist management" },
    { type: "ipixel-schedule-card", name: "iPIXEL Schedule", description: "Power schedule and time slots" },
    { type: "ipixel-editor-card", name: "iPIXEL Pixel Editor", description: "Draw custom pixel art and send to your LED matrix" },
    { type: "ipixel-gallery-card", name: "iPIXEL Gallery", description: "Browse and send bundled animations to your LED matrix" }
  ].forEach((card) => window.customCards.push({
    ...card,
    preview: true,
    documentationURL: "https://github.com/cagcoach/ha-ipixel-color"
  }));
  console.info(
    `%c iPIXEL Cards %c ${CARD_VERSION} `,
    "background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;",
    "background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;"
  );
})();
//# sourceMappingURL=ipixel-display-card.js.map
