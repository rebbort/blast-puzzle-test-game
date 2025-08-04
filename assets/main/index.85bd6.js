window.__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        o = b;
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  1: [ function(require, module, exports) {}, {} ],
  2: [ function(require, module, exports) {
    var alea = require("./lib/alea");
    var xor128 = require("./lib/xor128");
    var xorwow = require("./lib/xorwow");
    var xorshift7 = require("./lib/xorshift7");
    var xor4096 = require("./lib/xor4096");
    var tychei = require("./lib/tychei");
    var sr = require("./seedrandom");
    sr.alea = alea;
    sr.xor128 = xor128;
    sr.xorwow = xorwow;
    sr.xorshift7 = xorshift7;
    sr.xor4096 = xor4096;
    sr.tychei = tychei;
    module.exports = sr;
  }, {
    "./lib/alea": 3,
    "./lib/tychei": 4,
    "./lib/xor128": 5,
    "./lib/xor4096": 6,
    "./lib/xorshift7": 7,
    "./lib/xorwow": 8,
    "./seedrandom": 9
  } ],
  3: [ function(require, module, exports) {
    (function(global, module, define) {
      function Alea(seed) {
        var me = this, mash = Mash();
        me.next = function() {
          var t = 2091639 * me.s0 + 2.3283064365386963e-10 * me.c;
          me.s0 = me.s1;
          me.s1 = me.s2;
          return me.s2 = t - (me.c = 0 | t);
        };
        me.c = 1;
        me.s0 = mash(" ");
        me.s1 = mash(" ");
        me.s2 = mash(" ");
        me.s0 -= mash(seed);
        me.s0 < 0 && (me.s0 += 1);
        me.s1 -= mash(seed);
        me.s1 < 0 && (me.s1 += 1);
        me.s2 -= mash(seed);
        me.s2 < 0 && (me.s2 += 1);
        mash = null;
      }
      function copy(f, t) {
        t.c = f.c;
        t.s0 = f.s0;
        t.s1 = f.s1;
        t.s2 = f.s2;
        return t;
      }
      function impl(seed, opts) {
        var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
        prng.int32 = function() {
          return 4294967296 * xg.next() | 0;
        };
        prng.double = function() {
          return prng() + 11102230246251565e-32 * (2097152 * prng() | 0);
        };
        prng.quick = prng;
        if (state) {
          "object" == typeof state && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      function Mash() {
        var n = 4022871197;
        var mash = function(data) {
          data = String(data);
          for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = .02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += 4294967296 * h;
          }
          return 2.3283064365386963e-10 * (n >>> 0);
        };
        return mash;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.alea = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  4: [ function(require, module, exports) {
    (function(global, module, define) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var b = me.b, c = me.c, d = me.d, a = me.a;
          b = b << 25 ^ b >>> 7 ^ c;
          c = c - d | 0;
          d = d << 24 ^ d >>> 8 ^ a;
          a = a - b | 0;
          me.b = b = b << 20 ^ b >>> 12 ^ c;
          me.c = c = c - d | 0;
          me.d = d << 16 ^ c >>> 16 ^ a;
          return me.a = a - b | 0;
        };
        me.a = 0;
        me.b = 0;
        me.c = -1640531527;
        me.d = 1367130551;
        if (seed === Math.floor(seed)) {
          me.a = seed / 4294967296 | 0;
          me.b = 0 | seed;
        } else strseed += seed;
        for (var k = 0; k < strseed.length + 20; k++) {
          me.b ^= 0 | strseed.charCodeAt(k);
          me.next();
        }
      }
      function copy(f, t) {
        t.a = f.a;
        t.b = f.b;
        t.c = f.c;
        t.d = f.d;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (0 === result);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          "object" == typeof state && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.tychei = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  5: [ function(require, module, exports) {
    (function(global, module, define) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.next = function() {
          var t = me.x ^ me.x << 11;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
        };
        seed === (0 | seed) ? me.x = seed : strseed += seed;
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= 0 | strseed.charCodeAt(k);
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (0 === result);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          "object" == typeof state && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.xor128 = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  6: [ function(require, module, exports) {
    (function(global, module, define) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var w = me.w, X = me.X, i = me.i, t, v;
          me.w = w = w + 1640531527 | 0;
          v = X[i + 34 & 127];
          t = X[i = i + 1 & 127];
          v ^= v << 13;
          t ^= t << 17;
          v ^= v >>> 15;
          t ^= t >>> 12;
          v = X[i] = v ^ t;
          me.i = i;
          return v + (w ^ w >>> 16) | 0;
        };
        function init(me, seed) {
          var t, v, i, j, w, X = [], limit = 128;
          if (seed === (0 | seed)) {
            v = seed;
            seed = null;
          } else {
            seed += "\0";
            v = 0;
            limit = Math.max(limit, seed.length);
          }
          for (i = 0, j = -32; j < limit; ++j) {
            seed && (v ^= seed.charCodeAt((j + 32) % seed.length));
            0 === j && (w = v);
            v ^= v << 10;
            v ^= v >>> 15;
            v ^= v << 4;
            v ^= v >>> 13;
            if (j >= 0) {
              w = w + 1640531527 | 0;
              t = X[127 & j] ^= v + w;
              i = 0 == t ? i + 1 : 0;
            }
          }
          i >= 128 && (X[127 & (seed && seed.length || 0)] = -1);
          i = 127;
          for (j = 512; j > 0; --j) {
            v = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v ^= v << 13;
            t ^= t << 17;
            v ^= v >>> 15;
            t ^= t >>> 12;
            X[i] = v ^ t;
          }
          me.w = w;
          me.X = X;
          me.i = i;
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.i = f.i;
        t.w = f.w;
        t.X = f.X.slice();
        return t;
      }
      function impl(seed, opts) {
        null == seed && (seed = +new Date());
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (0 === result);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          state.X && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.xor4096 = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  7: [ function(require, module, exports) {
    (function(global, module, define) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var X = me.x, i = me.i, t, v, w;
          t = X[i];
          t ^= t >>> 7;
          v = t ^ t << 24;
          t = X[i + 1 & 7];
          v ^= t ^ t >>> 10;
          t = X[i + 3 & 7];
          v ^= t ^ t >>> 3;
          t = X[i + 4 & 7];
          v ^= t ^ t << 7;
          t = X[i + 7 & 7];
          t ^= t << 13;
          v ^= t ^ t << 9;
          X[i] = v;
          me.i = i + 1 & 7;
          return v;
        };
        function init(me, seed) {
          var j, w, X = [];
          if (seed === (0 | seed)) w = X[0] = seed; else {
            seed = "" + seed;
            for (j = 0; j < seed.length; ++j) X[7 & j] = X[7 & j] << 15 ^ seed.charCodeAt(j) + X[j + 1 & 7] << 13;
          }
          while (X.length < 8) X.push(0);
          for (j = 0; j < 8 && 0 === X[j]; ++j) ;
          w = 8 == j ? X[7] = -1 : X[j];
          me.x = X;
          me.i = 0;
          for (j = 256; j > 0; --j) me.next();
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.x = f.x.slice();
        t.i = f.i;
        return t;
      }
      function impl(seed, opts) {
        null == seed && (seed = +new Date());
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (0 === result);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          state.x && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.xorshift7 = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  8: [ function(require, module, exports) {
    (function(global, module, define) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var t = me.x ^ me.x >>> 2;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          me.w = me.v;
          return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ t ^ t << 1) | 0;
        };
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.v = 0;
        seed === (0 | seed) ? me.x = seed : strseed += seed;
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= 0 | strseed.charCodeAt(k);
          k == strseed.length && (me.d = me.x << 10 ^ me.x >>> 4);
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        t.v = f.v;
        t.d = f.d;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (0 === result);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          "object" == typeof state && copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      module && module.exports ? module.exports = impl : define && define.amd ? define(function() {
        return impl;
      }) : this.xorwow = impl;
    })(this, "object" == typeof module && module, "function" == typeof define && define);
  }, {} ],
  9: [ function(require, module, exports) {
    (function(global, pool, math) {
      var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = 2 * significance, mask = width - 1, nodecrypto;
      function seedrandom(seed, options, callback) {
        var key = [];
        options = true == options ? {
          entropy: true
        } : options || {};
        var shortseed = mixkey(flatten(options.entropy ? [ seed, tostring(pool) ] : null == seed ? autoseed() : seed, 3), key);
        var arc4 = new ARC4(key);
        var prng = function() {
          var n = arc4.g(chunks), d = startdenom, x = 0;
          while (n < significance) {
            n = (n + x) * width;
            d *= width;
            x = arc4.g(1);
          }
          while (n >= overflow) {
            n /= 2;
            d /= 2;
            x >>>= 1;
          }
          return (n + x) / d;
        };
        prng.int32 = function() {
          return 0 | arc4.g(4);
        };
        prng.quick = function() {
          return arc4.g(4) / 4294967296;
        };
        prng.double = prng;
        mixkey(tostring(arc4.S), pool);
        return (options.pass || callback || function(prng, seed, is_math_call, state) {
          if (state) {
            state.S && copy(state, arc4);
            prng.state = function() {
              return copy(arc4, {});
            };
          }
          if (is_math_call) {
            math[rngname] = prng;
            return seed;
          }
          return prng;
        })(prng, shortseed, "global" in options ? options.global : this == math, options.state);
      }
      function ARC4(key) {
        var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
        keylen || (key = [ keylen++ ]);
        while (i < width) s[i] = i++;
        for (i = 0; i < width; i++) {
          s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
          s[j] = t;
        }
        (me.g = function(count) {
          var t, r = 0, i = me.i, j = me.j, s = me.S;
          while (count--) {
            t = s[i = mask & i + 1];
            r = r * width + s[mask & (s[i] = s[j = mask & j + t]) + (s[j] = t)];
          }
          me.i = i;
          me.j = j;
          return r;
        })(width);
      }
      function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
      }
      function flatten(obj, depth) {
        var result = [], typ = typeof obj, prop;
        if (depth && "object" == typ) for (prop in obj) try {
          result.push(flatten(obj[prop], depth - 1));
        } catch (e) {}
        return result.length ? result : "string" == typ ? obj : obj + "\0";
      }
      function mixkey(seed, key) {
        var stringseed = seed + "", smear, j = 0;
        while (j < stringseed.length) key[mask & j] = mask & (smear ^= 19 * key[mask & j]) + stringseed.charCodeAt(j++);
        return tostring(key);
      }
      function autoseed() {
        try {
          var out;
          if (nodecrypto && (out = nodecrypto.randomBytes)) out = out(width); else {
            out = new Uint8Array(width);
            (global.crypto || global.msCrypto).getRandomValues(out);
          }
          return tostring(out);
        } catch (e) {
          var browser = global.navigator, plugins = browser && browser.plugins;
          return [ +new Date(), global, plugins, global.screen, tostring(pool) ];
        }
      }
      function tostring(a) {
        return String.fromCharCode.apply(0, a);
      }
      mixkey(math.random(), pool);
      if ("object" == typeof module && module.exports) {
        module.exports = seedrandom;
        try {
          nodecrypto = require("crypto");
        } catch (ex) {}
      } else "function" == typeof define && define.amd ? define(function() {
        return seedrandom;
      }) : math["seed" + rngname] = seedrandom;
    })("undefined" !== typeof self ? self : this, [], Math);
  }, {
    crypto: 1
  } ],
  BoardGenerator: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "28a233ERmFFqKd5DboIPOcb", "BoardGenerator");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BoardGenerator = void 0;
    const seedrandom = require("seedrandom");
    const Board_1 = require("./Board");
    const Tile_1 = require("./Tile");
    class BoardGenerator {
      generate(cfg) {
        const rng = cfg.rngSeed ? seedrandom(cfg.rngSeed) : seedrandom();
        let last = [];
        for (let attempt = 0; attempt < 10; attempt++) {
          const tiles = [];
          for (let y = 0; y < cfg.rows; y++) {
            const row = [];
            for (let x = 0; x < cfg.cols; x++) {
              const color = cfg.colors[Math.floor(rng() * cfg.colors.length)];
              row.push(Tile_1.TileFactory.createNormal(color));
            }
            tiles.push(row);
          }
          if (BoardGenerator.adjacentSameColor(tiles)) return new Board_1.Board(cfg, tiles);
          last = tiles;
        }
        return new Board_1.Board(cfg, last);
      }
      static adjacentSameColor(tiles) {
        for (let y = 0; y < tiles.length; y++) for (let x = 0; x < tiles[y].length; x++) {
          const current = tiles[y][x];
          if (!current) continue;
          if (x + 1 < tiles[y].length) {
            const right = tiles[y][x + 1];
            if (right && right.color === current.color) return true;
          }
          if (y + 1 < tiles.length) {
            const bottom = tiles[y + 1][x];
            if (bottom && bottom.color === current.color) return true;
          }
        }
        return false;
      }
    }
    exports.BoardGenerator = BoardGenerator;
    cc._RF.pop();
  }, {
    "./Board": "Board",
    "./Tile": "Tile",
    seedrandom: 2
  } ],
  BoardSolver: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "367acDu7UxGLoqRnCUfuczD", "BoardSolver");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BoardSolver = void 0;
    var EventBus_1 = require("../EventBus");
    var EventNames_1 = require("../events/EventNames");
    var Tile_1 = require("./Tile");
    var BoardSolver = function() {
      function BoardSolver(board) {
        this.board = board;
      }
      BoardSolver.prototype.expandGroupForSuper = function(tile, pos) {
        var cfg = this.board.cfg;
        switch (tile.kind) {
         case Tile_1.TileKind.SuperRow:
          console.info("Activated SuperRow at (" + pos.x + "," + pos.y + "): removing row " + pos.y);
          return Array.from({
            length: cfg.cols
          }, function(_, x) {
            return new cc.Vec2(x, pos.y);
          });

         case Tile_1.TileKind.SuperCol:
          console.info("Activated SuperCol at (" + pos.x + "," + pos.y + "): removing column " + pos.x);
          return Array.from({
            length: cfg.rows
          }, function(_, y) {
            return new cc.Vec2(pos.x, y);
          });

         case Tile_1.TileKind.SuperBomb:
          var radius = 1;
          console.info("Activated SuperBomb at (" + pos.x + "," + pos.y + "): removing radius " + radius);
          var cells = [];
          for (var dx = -radius; dx <= radius; dx++) for (var dy = -radius; dy <= radius; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            var p = new cc.Vec2(pos.x + dx, pos.y + dy);
            this.board.inBounds(p) && cells.push(p);
          }
          return cells;

         case Tile_1.TileKind.SuperClear:
          console.info("Activated SuperClear at (" + pos.x + "," + pos.y + "): removing entire board");
          var cells = [];
          for (var y = 0; y < cfg.rows; y++) for (var x = 0; x < cfg.cols; x++) cells.push(new cc.Vec2(x, y));
          return cells;

         default:
          if (tile.kind !== Tile_1.TileKind.Normal) throw new Error("Unhandled super tile kind: " + tile.kind);
          return [ pos ];
        }
      };
      BoardSolver.prototype.expandBySupers = function(group) {
        var _this = this;
        var resultSet = new Set(group.map(function(p) {
          return p.x + "," + p.y;
        }));
        var queue = group.filter(function(p) {
          var t = _this.board.tileAt(p);
          return null !== t && t.kind !== Tile_1.TileKind.Normal;
        });
        while (queue.length > 0) {
          var p = queue.pop();
          var tile = this.board.tileAt(p);
          if (!tile) continue;
          for (var _i = 0, _a = this.expandGroupForSuper(tile, p); _i < _a.length; _i++) {
            var extra = _a[_i];
            var k = extra.x + "," + extra.y;
            if (!resultSet.has(k)) {
              resultSet.add(k);
              var t = this.board.tileAt(extra);
              t && t.kind !== Tile_1.TileKind.Normal && queue.push(extra);
            }
          }
        }
        return Array.from(resultSet).map(function(k) {
          var _a = k.split(",").map(Number), x = _a[0], y = _a[1];
          return new cc.Vec2(x, y);
        });
      };
      BoardSolver.prototype.findGroup = function(start) {
        if (!this.board.inBounds(start)) return [];
        var startTile = this.board.tileAt(start);
        if (!startTile) return [];
        if (startTile.kind !== Tile_1.TileKind.Normal) {
          var result_1 = this.expandBySupers([ start ]);
          EventBus_1.EventBus.emit(EventNames_1.EventNames.GroupFound, result_1);
          return result_1;
        }
        var startColor = startTile.color;
        var colorVisited = new Set();
        var colorStack = [ start ];
        var baseGroup = [];
        while (colorStack.length > 0) {
          var p = colorStack.pop();
          var key = p.x + "," + p.y;
          if (colorVisited.has(key)) continue;
          colorVisited.add(key);
          var tile = this.board.tileAt(p);
          if (!tile || tile.color !== startColor || tile.kind !== Tile_1.TileKind.Normal) continue;
          baseGroup.push(p);
          for (var _i = 0, _a = this.board.neighbors4(p); _i < _a.length; _i++) {
            var n = _a[_i];
            var nKey = n.x + "," + n.y;
            colorVisited.has(nKey) || colorStack.push(n);
          }
        }
        var result = this.expandBySupers(baseGroup);
        EventBus_1.EventBus.emit(EventNames_1.EventNames.GroupFound, result);
        return result;
      };
      BoardSolver.prototype.hasMoves = function() {
        var _this = this;
        var found = false;
        this.board.forEach(function(p, tile) {
          if (found) return;
          for (var _i = 0, _a = _this.board.neighbors4(p); _i < _a.length; _i++) {
            var n = _a[_i];
            var other = _this.board.tileAt(n);
            if (other && other.color === tile.color) {
              found = true;
              break;
            }
          }
        });
        return found;
      };
      return BoardSolver;
    }();
    exports.BoardSolver = BoardSolver;
    cc._RF.pop();
  }, {
    "../EventBus": "EventBus",
    "../events/EventNames": "EventNames",
    "./Tile": "Tile"
  } ],
  Board: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5830er0TtdAZJX898/LA6Fo", "Board");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Board = void 0;
    var Board = function() {
      function Board(cfg, tiles) {
        var _a;
        this.cfg = cfg;
        this.grid = [];
        for (var y = 0; y < cfg.rows; y++) if (tiles && tiles[y]) {
          var row = [];
          for (var x = 0; x < cfg.cols; x++) row[x] = null !== (_a = tiles[y][x]) && void 0 !== _a ? _a : null;
          this.grid[y] = row;
        } else this.grid[y] = Array(cfg.cols).fill(null);
      }
      Object.defineProperty(Board.prototype, "config", {
        get: function() {
          return this.cfg;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Board.prototype, "rows", {
        get: function() {
          return this.cfg.rows;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Board.prototype, "cols", {
        get: function() {
          return this.cfg.cols;
        },
        enumerable: false,
        configurable: true
      });
      Board.prototype.inBounds = function(p) {
        return p.x >= 0 && p.y >= 0 && p.x < this.cfg.cols && p.y < this.cfg.rows;
      };
      Board.prototype.tileAt = function(p) {
        return this.inBounds(p) ? this.grid[p.y][p.x] : null;
      };
      Board.prototype.colorAt = function(p) {
        var tile = this.tileAt(p);
        return tile ? tile.color : null;
      };
      Board.prototype.setTile = function(p, t) {
        if (!this.inBounds(p)) throw new Error("setTile out of bounds: (" + p.x + ", " + p.y + ")");
        this.grid[p.y][p.x] = t;
      };
      Board.prototype.neighbors4 = function(p) {
        var result = [];
        var candidates = [ new cc.Vec2(p.x, p.y - 1), new cc.Vec2(p.x + 1, p.y), new cc.Vec2(p.x, p.y + 1), new cc.Vec2(p.x - 1, p.y) ];
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
          var c = candidates_1[_i];
          this.inBounds(c) && result.push(c);
        }
        return result;
      };
      Board.prototype.forEach = function(callback) {
        for (var y = 0; y < this.cfg.rows; y++) for (var x = 0; x < this.cfg.cols; x++) {
          var tile = this.grid[y][x];
          tile && callback(new cc.Vec2(x, y), tile);
        }
      };
      return Board;
    }();
    exports.Board = Board;
    cc._RF.pop();
  }, {} ],
  BombCommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "58f1b3hnuJOEq9xmQHvqnlf", "BombCommand");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BombCommand = void 0;
    var MoveExecutor_1 = require("../MoveExecutor");
    var BoardSolver_1 = require("../BoardSolver");
    var BombCommand = function() {
      function BombCommand(board, center, radius, bus) {
        this.board = board;
        this.center = center;
        this.radius = radius;
        this.bus = bus;
      }
      BombCommand.prototype.execute = function() {
        return __awaiter(this, void 0, Promise, function() {
          var group, dx, dy, p, expanded;
          return __generator(this, function(_a) {
            switch (_a.label) {
             case 0:
              group = [];
              for (dx = -this.radius; dx <= this.radius; dx++) for (dy = -this.radius; dy <= this.radius; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) <= this.radius) {
                p = new cc.Vec2(this.center.x + dx, this.center.y + dy);
                this.board.inBounds(p) && group.push(p);
              }
              expanded = new BoardSolver_1.BoardSolver(this.board).expandBySupers(group);
              return [ 4, new MoveExecutor_1.MoveExecutor(this.board, this.bus).execute(expanded) ];

             case 1:
              _a.sent();
              return [ 2 ];
            }
          });
        });
      };
      return BombCommand;
    }();
    exports.BombCommand = BombCommand;
    cc._RF.pop();
  }, {
    "../BoardSolver": "BoardSolver",
    "../MoveExecutor": "MoveExecutor"
  } ],
  BoosterPanelController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f49acYCKaFI+ojlS5USq3xb", "BoosterPanelController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var BoosterSetup_1 = require("../../core/boosters/BoosterSetup");
    var BoosterRegistry_1 = require("../../core/boosters/BoosterRegistry");
    var SpriteHighlight_1 = require("../utils/SpriteHighlight");
    var BoosterSelectionService_1 = require("../services/BoosterSelectionService");
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var BoosterPanelController = function(_super) {
      __extends(BoosterPanelController, _super);
      function BoosterPanelController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.boosterList = null;
        _this.boosterSlotPrefab = null;
        _this.boosterLabel = null;
        _this.boosterSlots = [];
        return _this;
      }
      BoosterPanelController.prototype.start = function() {
        this.setupEventListeners();
        var charges = BoosterSelectionService_1.boosterSelectionService.getConfirmedCharges();
        this.createSlots(charges);
        0 === Object.keys(charges).length ? this.boosterLabel.active = false : this.boosterLabel.active = true;
      };
      BoosterPanelController.prototype.createSlots = function(charges) {
        var _a, _b, _c;
        if (!this.boosterList || !this.boosterSlotPrefab) {
          console.warn("Missing boosterList or boosterSlotPrefab");
          return;
        }
        this.boosterList.removeAllChildren();
        this.boosterSlots = [];
        var entries = Object.entries(charges).filter(function(_a) {
          var c = _a[1];
          return c > 0;
        });
        var _loop_1 = function(i) {
          var _a = entries[i], boosterId = _a[0], count = _a[1];
          var node = cc.instantiate(this_1.boosterSlotPrefab);
          this_1.boosterList.addChild(node);
          node.setPosition(0, 0, 0);
          var button = node.getComponent(cc.Button);
          var counterLabel = (null === (_b = null === (_a = node.getChildByName("BoosterCounter")) || void 0 === _a ? void 0 : _a.getChildByName("CounterLabel")) || void 0 === _b ? void 0 : _b.getComponent(cc.Label)) || null;
          var def = BoosterRegistry_1.BoosterRegistry.find(function(b) {
            return b.id === boosterId;
          });
          if (!def) return {
            value: void 0
          };
          var icon = (null === (_c = node.getChildByName("BoosterIcon")) || void 0 === _c ? void 0 : _c.getComponent(cc.Sprite)) || null;
          icon && cc.resources.load(def.icon, cc.SpriteFrame, function(err, spriteFrame) {
            !err && spriteFrame && icon && (icon.spriteFrame = spriteFrame);
          });
          console.log("icon", icon);
          var slot = {
            node: node,
            button: button,
            icon: icon,
            counterLabel: counterLabel,
            highlight: null,
            boosterId: boosterId,
            charges: count,
            isActive: false
          };
          this_1.addHighlightToSlot(slot);
          this_1.setupSlotClickHandler(slot);
          this_1.setBoosterIcon(slot, boosterId);
          slot.counterLabel && (slot.counterLabel.string = String(count));
          slot.node.active = true;
          this_1.boosterSlots.push(slot);
        };
        var this_1 = this;
        for (var i = 0; i < entries.length; i++) {
          var state_1 = _loop_1(i);
          if ("object" === typeof state_1) return state_1.value;
        }
        var layout = this.boosterList.getComponent(cc.Layout);
        layout && layout.updateLayout();
      };
      BoosterPanelController.prototype.setupEventListeners = function() {
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoosterConsumed, this.onBoosterConsumed, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoosterCancelled, this.onBoosterCancelled, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoostersSelected, this.onBoostersSelected, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.GameRestart, this.onGameRestart, this);
      };
      BoosterPanelController.prototype.setBoosterIcon = function(slot, boosterId) {
        if (!slot.icon) return;
        var def = BoosterRegistry_1.BoosterRegistry.find(function(b) {
          return b.id === boosterId;
        });
        if (!def) return;
        cc.resources.load(def.icon, cc.SpriteFrame, function(err, spriteFrame) {
          !err && spriteFrame && slot.icon && (slot.icon.spriteFrame = spriteFrame);
        });
      };
      BoosterPanelController.prototype.addHighlightToSlot = function(slot) {
        var highlight = slot.node.addComponent(SpriteHighlight_1.default);
        highlight.highlightColor = cc.Color.YELLOW;
        highlight.highlightOpacity = 200;
        slot.highlight = highlight;
      };
      BoosterPanelController.prototype.setupSlotClickHandler = function(slot) {
        var _this = this;
        if (!slot.button) return;
        slot.button.node.off(cc.Node.EventType.TOUCH_END);
        slot.button.node.on(cc.Node.EventType.TOUCH_END, function() {
          _this.handleSlotClick(slot);
        });
      };
      BoosterPanelController.prototype.handleSlotClick = function(clickedSlot) {
        if (!clickedSlot.boosterId) return;
        if (clickedSlot.isActive) {
          this.clearActiveSlot();
          null === BoosterSetup_1.boosterService || void 0 === BoosterSetup_1.boosterService ? void 0 : BoosterSetup_1.boosterService.cancel();
          return;
        }
        this.setActiveSlot(clickedSlot);
      };
      BoosterPanelController.prototype.setActiveSlot = function(slot) {
        var _a;
        this.clearActiveSlot();
        null === BoosterSetup_1.boosterService || void 0 === BoosterSetup_1.boosterService ? void 0 : BoosterSetup_1.boosterService.activate(slot.boosterId);
        slot.isActive = true;
        null === (_a = slot.highlight) || void 0 === _a ? void 0 : _a.setHighlight();
        this.startPulse(slot.node);
      };
      BoosterPanelController.prototype.clearActiveSlot = function() {
        var _a;
        var activeSlot = this.boosterSlots.find(function(s) {
          return s.isActive;
        });
        if (activeSlot) {
          activeSlot.isActive = false;
          null === (_a = activeSlot.highlight) || void 0 === _a ? void 0 : _a.clearHighlight();
          this.stopPulse(activeSlot.node);
        }
      };
      BoosterPanelController.prototype.startPulse = function(node) {
        node.stopAllActions();
        var pulse = function() {
          cc.tween(node).to(.5, {
            scale: 1.1
          }).to(.5, {
            scale: 1
          }).call(pulse).start();
        };
        pulse();
      };
      BoosterPanelController.prototype.stopPulse = function(node) {
        node.stopAllActions();
        node.scale = 1;
      };
      BoosterPanelController.prototype.onBoosterConsumed = function(boosterId) {
        var _a;
        var slot = this.boosterSlots.find(function(s) {
          return s.boosterId === boosterId;
        });
        if (slot) {
          slot.charges = null !== (_a = null === BoosterSetup_1.boosterService || void 0 === BoosterSetup_1.boosterService ? void 0 : BoosterSetup_1.boosterService.getCharges(boosterId)) && void 0 !== _a ? _a : 0;
          slot.counterLabel && (slot.counterLabel.string = String(slot.charges));
          slot.charges <= 0 && this.hideBoosterSlot(slot);
        }
        this.clearActiveSlot();
      };
      BoosterPanelController.prototype.onBoosterCancelled = function() {
        this.clearActiveSlot();
      };
      BoosterPanelController.prototype.onBoostersSelected = function(charges) {
        this.createSlots(charges);
        0 === Object.keys(charges).length ? this.boosterLabel.active = false : this.boosterLabel.active = true;
      };
      BoosterPanelController.prototype.onGameRestart = function() {
        null === BoosterSetup_1.boosterService || void 0 === BoosterSetup_1.boosterService ? void 0 : BoosterSetup_1.boosterService.cancel();
        this.clearActiveSlot();
        this.createSlots({});
      };
      BoosterPanelController.prototype.hideBoosterSlot = function(slot) {
        var _a;
        slot.node.active = false;
        slot.isActive = false;
        null === (_a = slot.highlight) || void 0 === _a ? void 0 : _a.clearHighlight();
        this.stopPulse(slot.node);
      };
      BoosterPanelController.prototype.onDestroy = function() {
        EventBus_1.EventBus.off(EventNames_1.EventNames.BoosterConsumed, this.onBoosterConsumed, this);
        EventBus_1.EventBus.off(EventNames_1.EventNames.BoosterCancelled, this.onBoosterCancelled, this);
        EventBus_1.EventBus.off(EventNames_1.EventNames.BoostersSelected, this.onBoostersSelected, this);
        EventBus_1.EventBus.off(EventNames_1.EventNames.GameRestart, this.onGameRestart, this);
      };
      __decorate([ property(cc.Node) ], BoosterPanelController.prototype, "boosterList", void 0);
      __decorate([ property(cc.Prefab) ], BoosterPanelController.prototype, "boosterSlotPrefab", void 0);
      __decorate([ property(cc.Node) ], BoosterPanelController.prototype, "boosterLabel", void 0);
      BoosterPanelController = __decorate([ ccclass() ], BoosterPanelController);
      return BoosterPanelController;
    }(cc.Component);
    exports.default = BoosterPanelController;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/boosters/BoosterRegistry": "BoosterRegistry",
    "../../core/boosters/BoosterSetup": "BoosterSetup",
    "../../core/events/EventNames": "EventNames",
    "../services/BoosterSelectionService": "BoosterSelectionService",
    "../utils/SpriteHighlight": "SpriteHighlight"
  } ],
  BoosterRegistry: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "39d7bO21nVJRainYAP81AyC", "BoosterRegistry");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BoosterRegistry = void 0;
    var TeleportBooster_1 = require("./TeleportBooster");
    var SuperTileBooster_1 = require("./SuperTileBooster");
    var Tile_1 = require("../board/Tile");
    exports.BoosterRegistry = [ {
      id: "teleport",
      icon: "images/boosters/icon_booster_teleport",
      factory: function(_a) {
        var board = _a.board, bus = _a.bus, charges = _a.charges;
        return new TeleportBooster_1.TeleportBooster(board, bus, charges);
      }
    }, {
      id: "bomb",
      icon: "images/boosters/icon_booster_bomb",
      factory: function(_a) {
        var board = _a.board, getView = _a.getView, bus = _a.bus, boosterService = _a.boosterService, charges = _a.charges;
        return new SuperTileBooster_1.SuperTileBooster("bomb", board, getView, bus, boosterService, charges, Tile_1.TileKind.SuperBomb);
      }
    }, {
      id: "superRow",
      icon: "images/boosters/icon_booster_superRow",
      factory: function(_a) {
        var board = _a.board, getView = _a.getView, bus = _a.bus, boosterService = _a.boosterService, charges = _a.charges;
        return new SuperTileBooster_1.SuperTileBooster("superRow", board, getView, bus, boosterService, charges, Tile_1.TileKind.SuperRow);
      }
    }, {
      id: "superCol",
      icon: "images/boosters/icon_booster_superCol",
      factory: function(_a) {
        var board = _a.board, getView = _a.getView, bus = _a.bus, boosterService = _a.boosterService, charges = _a.charges;
        return new SuperTileBooster_1.SuperTileBooster("superCol", board, getView, bus, boosterService, charges, Tile_1.TileKind.SuperCol);
      }
    } ];
    cc._RF.pop();
  }, {
    "../board/Tile": "Tile",
    "./SuperTileBooster": "SuperTileBooster",
    "./TeleportBooster": "TeleportBooster"
  } ],
  BoosterSelectAnimationController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "aeca5Rf+RxHoL0C//r24Yzt", "BoosterSelectAnimationController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __spreadArrays = this && this.__spreadArrays || function() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, 
      k++) r[k] = a[j];
      return r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var BoosterSelectAnimationController = function(_super) {
      __extends(BoosterSelectAnimationController, _super);
      function BoosterSelectAnimationController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.gameNameLabel = null;
        _this.selectBoosterLabel = null;
        _this.boosterSelectBackground = null;
        _this.boosterSlots = [];
        _this.playButton = null;
        _this.labelDelay = .2;
        _this.backgroundDelay = .4;
        _this.slotsDelay = .6;
        _this.playButtonDelay = 1.2;
        _this.bounceDuration = .3;
        _this.scaleDuration = .4;
        _this.rotationDuration = .3;
        _this.originalScales = new Map();
        _this.originalRotations = new Map();
        return _this;
      }
      BoosterSelectAnimationController.prototype.onLoad = function() {
        this.storeOriginalTransforms();
        this.hideAllElements();
      };
      BoosterSelectAnimationController.prototype.start = function() {
        this.checkReferences();
        this.playEntranceAnimation();
      };
      BoosterSelectAnimationController.prototype.storeOriginalTransforms = function() {
        var _this = this;
        var elements = __spreadArrays([ this.gameNameLabel, this.selectBoosterLabel, this.boosterSelectBackground ], this.boosterSlots, [ this.playButton ]);
        elements.forEach(function(element) {
          if (element) {
            _this.originalScales.set(element, element.scale);
            _this.originalRotations.set(element, element.eulerAngles);
          } else console.warn("Element is null in storeOriginalTransforms");
        });
      };
      BoosterSelectAnimationController.prototype.hideAllElements = function() {
        var elements = __spreadArrays([ this.gameNameLabel, this.selectBoosterLabel, this.boosterSelectBackground ], this.boosterSlots, [ this.playButton ]);
        elements.forEach(function(element) {
          if (element) {
            element.setScale(0, 0, 0);
            element.opacity = 0;
          } else console.warn("Element is null in hideAllElements");
        });
      };
      BoosterSelectAnimationController.prototype.playEntranceAnimation = function() {
        var _this = this;
        this.scheduleOnce(function() {
          _this.animateLabel(_this.gameNameLabel);
        }, 0);
        this.scheduleOnce(function() {
          _this.animateLabel(_this.selectBoosterLabel);
        }, this.labelDelay);
        this.scheduleOnce(function() {
          _this.animateBackground();
        }, this.backgroundDelay);
        this.scheduleOnce(function() {
          _this.animateSlots();
        }, this.slotsDelay);
        this.scheduleOnce(function() {
          _this.animatePlayButton();
        }, this.playButtonDelay);
      };
      BoosterSelectAnimationController.prototype.animateLabel = function(label) {
        if (!label) {
          console.warn("Label is null in animateLabel");
          return;
        }
        console.log("Animating label: " + label.name);
        label.active = true;
        label.opacity = 255;
        label.setScale(0, 0, 0);
        cc.tween(label).to(this.bounceDuration, {
          scale: 1
        }, {
          easing: "backOut"
        }).to(.5 * this.bounceDuration, {
          scale: 1
        }, {
          easing: "backOut"
        }).start();
      };
      BoosterSelectAnimationController.prototype.animateBackground = function() {
        if (!this.boosterSelectBackground) {
          console.warn("BoosterSelectBackground is null");
          return;
        }
        this.boosterSelectBackground.active = true;
        this.boosterSelectBackground.opacity = 255;
        this.boosterSelectBackground.setScale(0, 0, 0);
        cc.tween(this.boosterSelectBackground).to(this.bounceDuration, {
          scale: 1
        }, {
          easing: "backOut"
        }).to(.5 * this.bounceDuration, {
          scale: 1
        }, {
          easing: "backOut"
        }).start();
      };
      BoosterSelectAnimationController.prototype.animateSlots = function() {
        var _this = this;
        this.boosterSlots.forEach(function(slot, index) {
          if (!slot) {
            console.warn("Slot " + index + " is null");
            return;
          }
          var delay = .1 * index;
          _this.scheduleOnce(function() {
            _this.animateSlot(slot);
          }, delay);
        });
      };
      BoosterSelectAnimationController.prototype.animateSlot = function(slot) {
        if (!slot) return;
        var originalScale = this.originalScales.get(slot) || 1;
        slot.active = true;
        slot.opacity = 255;
        slot.setScale(.3 * originalScale);
        cc.tween(slot).to(this.scaleDuration, {
          scale: originalScale
        }, {
          easing: "backOut"
        }).start();
      };
      BoosterSelectAnimationController.prototype.animatePlayButton = function() {
        if (!this.playButton) {
          console.warn("PlayButton is null");
          return;
        }
        this.playButton.active = true;
        this.playButton.opacity = 255;
        this.playButton.setScale(0, 0, 0);
        cc.tween(this.playButton).to(this.bounceDuration, {
          scale: 1.2
        }, {
          easing: "backOut"
        }).to(.5 * this.bounceDuration, {
          scale: 1
        }, {
          easing: "backOut"
        }).start();
      };
      BoosterSelectAnimationController.prototype.replayAnimation = function() {
        this.hideAllElements();
        this.playEntranceAnimation();
      };
      BoosterSelectAnimationController.prototype.showAllImmediately = function() {
        var _this = this;
        console.log("Showing all elements immediately");
        var elements = __spreadArrays([ this.gameNameLabel, this.selectBoosterLabel, this.boosterSelectBackground ], this.boosterSlots, [ this.playButton ]);
        elements.forEach(function(element) {
          if (element) {
            element.opacity = 255;
            var originalScale = _this.originalScales.get(element) || 1;
            var originalRotation = _this.originalRotations.get(element);
            element.setScale(originalScale);
            element.eulerAngles = originalRotation;
          } else console.warn("Element is null in showAllImmediately");
        });
      };
      BoosterSelectAnimationController.prototype.checkReferences = function() {
        this.gameNameLabel || console.error("GameNameLabel is null in BoosterSelectAnimationController");
        this.selectBoosterLabel || console.error("SelectBoosterLabel is null in BoosterSelectAnimationController");
        this.boosterSelectBackground || console.error("BoosterSelectBackground is null in BoosterSelectAnimationController");
        0 === this.boosterSlots.length && console.error("BoosterSlots array is empty in BoosterSelectAnimationController");
        this.playButton || console.error("PlayButton is null in BoosterSelectAnimationController");
      };
      __decorate([ property(cc.Node) ], BoosterSelectAnimationController.prototype, "gameNameLabel", void 0);
      __decorate([ property(cc.Node) ], BoosterSelectAnimationController.prototype, "selectBoosterLabel", void 0);
      __decorate([ property(cc.Node) ], BoosterSelectAnimationController.prototype, "boosterSelectBackground", void 0);
      __decorate([ property([ cc.Node ]) ], BoosterSelectAnimationController.prototype, "boosterSlots", void 0);
      __decorate([ property(cc.Node) ], BoosterSelectAnimationController.prototype, "playButton", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, 1, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "labelDelay", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, 1, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "backgroundDelay", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, 1, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "slotsDelay", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, 1, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "playButtonDelay", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, .5, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "bounceDuration", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, .5, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "scaleDuration", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .1, .5, .1 ]
      }) ], BoosterSelectAnimationController.prototype, "rotationDuration", void 0);
      BoosterSelectAnimationController = __decorate([ ccclass() ], BoosterSelectAnimationController);
      return BoosterSelectAnimationController;
    }(cc.Component);
    exports.default = BoosterSelectAnimationController;
    cc._RF.pop();
  }, {} ],
  BoosterSelectPopup: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "df0d9E1nMVPDJl6C2I2TAs7", "BoosterSelectPopup");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var BoosterSelectAnimationController_1 = require("./BoosterSelectAnimationController");
    var BoosterRegistry_1 = require("../../core/boosters/BoosterRegistry");
    var BoosterSelectionService_1 = require("../services/BoosterSelectionService");
    var SpriteHighlight_1 = require("../utils/SpriteHighlight");
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var BoosterSelectPopup = function(_super) {
      __extends(BoosterSelectPopup, _super);
      function BoosterSelectPopup() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.boosterSlotGrid = null;
        _this.boosterSlotPrefab = null;
        _this.slots = [];
        _this.animationController = null;
        return _this;
      }
      BoosterSelectPopup.prototype.onLoad = function() {
        this.animationController = this.getComponent(BoosterSelectAnimationController_1.default);
        BoosterSelectionService_1.boosterSelectionService.reset();
        this.createSlots();
      };
      BoosterSelectPopup.prototype.onEnable = function() {
        var _a;
        BoosterSelectionService_1.boosterSelectionService.reset();
        this.updateHighlights();
        null === (_a = this.animationController) || void 0 === _a ? void 0 : _a.replayAnimation();
      };
      BoosterSelectPopup.prototype.start = function() {
        var _this = this;
        var playButton = this.node.getChildByName("PlayButton");
        null === playButton || void 0 === playButton ? void 0 : playButton.on(cc.Node.EventType.TOUCH_END, function() {
          return _this.startGame();
        });
      };
      BoosterSelectPopup.prototype.createSlots = function() {
        var _this = this;
        var _a;
        if (!this.boosterSlotGrid || !this.boosterSlotPrefab) {
          console.warn("Missing boosterSlotGrid or boosterSlotPrefab");
          return;
        }
        this.slots = [];
        var _loop_1 = function(i) {
          var def = BoosterRegistry_1.BoosterRegistry[i];
          var node = cc.instantiate(this_1.boosterSlotPrefab);
          this_1.boosterSlotGrid.addChild(node);
          node.setPosition(0, 0, 0);
          var icon = (null === (_a = node.getChildByName("BoosterIcon")) || void 0 === _a ? void 0 : _a.getComponent(cc.Sprite)) || null;
          icon && cc.resources.load(def.icon, cc.SpriteFrame, function(err, spriteFrame) {
            !err && spriteFrame && icon && (icon.spriteFrame = spriteFrame);
          });
          var highlightedNode = node.getChildByName("BoosterSlotBg");
          var highlight = highlightedNode.addComponent(SpriteHighlight_1.default);
          highlight.highlightColor = cc.Color.YELLOW;
          highlight.highlightOpacity = 200;
          var slot = {
            node: node,
            boosterId: def.id,
            highlight: highlight,
            icon: null
          };
          node.on(cc.Node.EventType.TOUCH_END, function() {
            return _this.onSlotClick(slot);
          });
          node.active = true;
          this_1.slots.push(slot);
        };
        var this_1 = this;
        for (var i = 0; i < BoosterRegistry_1.BoosterRegistry.length; i++) _loop_1(i);
        var layout = this.boosterSlotGrid.getComponent(cc.Layout);
        layout && layout.updateLayout();
        this.animationController && (this.animationController.boosterSlots = this.slots.map(function(s) {
          return s.node;
        }));
      };
      BoosterSelectPopup.prototype.onSlotClick = function(slot) {
        BoosterSelectionService_1.boosterSelectionService.toggle(slot.boosterId);
        this.updateHighlights();
      };
      BoosterSelectPopup.prototype.updateHighlights = function() {
        var selected = new Set(BoosterSelectionService_1.boosterSelectionService.getSelected());
        this.slots.forEach(function(s) {
          selected.has(s.boosterId) ? s.highlight.setHighlight() : s.highlight.clearHighlight();
        });
      };
      BoosterSelectPopup.prototype.confirm = function() {
        console.log("BoosterSelectPopup confirm() called");
        BoosterSelectionService_1.boosterSelectionService.confirm();
        this.node.active = false;
      };
      BoosterSelectPopup.prototype.startGame = function() {
        this.confirm();
      };
      BoosterSelectPopup.prototype.replayAnimation = function() {
        this.animationController && this.animationController.replayAnimation();
      };
      BoosterSelectPopup.prototype.showImmediately = function() {
        this.animationController && this.animationController.showAllImmediately();
      };
      __decorate([ property(cc.Node) ], BoosterSelectPopup.prototype, "boosterSlotGrid", void 0);
      __decorate([ property(cc.Prefab) ], BoosterSelectPopup.prototype, "boosterSlotPrefab", void 0);
      BoosterSelectPopup = __decorate([ ccclass() ], BoosterSelectPopup);
      return BoosterSelectPopup;
    }(cc.Component);
    exports.default = BoosterSelectPopup;
    cc._RF.pop();
  }, {
    "../../core/boosters/BoosterRegistry": "BoosterRegistry",
    "../services/BoosterSelectionService": "BoosterSelectionService",
    "../utils/SpriteHighlight": "SpriteHighlight",
    "./BoosterSelectAnimationController": "BoosterSelectAnimationController"
  } ],
  BoosterSelectionService: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b7f8eClPG1KlZuGBzoRD6tq", "BoosterSelectionService");
    "use strict";
    var __assign = this && this.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __spreadArrays = this && this.__spreadArrays || function() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, 
      k++) r[k] = a[j];
      return r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.boosterSelectionService = exports.BoosterSelectionService = void 0;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var ConfigLoader_1 = require("../../config/ConfigLoader");
    var BoosterSelectionService = function() {
      function BoosterSelectionService() {
        this.selected = [];
        this.confirmedCharges = {};
        this.limits = ConfigLoader_1.loadBoosterLimits();
      }
      Object.defineProperty(BoosterSelectionService, "instance", {
        get: function() {
          this._instance || (this._instance = new BoosterSelectionService());
          return this._instance;
        },
        enumerable: false,
        configurable: true
      });
      BoosterSelectionService.prototype.toggle = function(id) {
        var idx = this.selected.indexOf(id);
        if (-1 !== idx) this.selected.splice(idx, 1); else {
          this.selected.length >= this.limits.maxTypes && this.selected.shift();
          this.selected.push(id);
        }
        return this.getSelected();
      };
      BoosterSelectionService.prototype.getSelected = function() {
        return __spreadArrays(this.selected);
      };
      BoosterSelectionService.prototype.confirm = function() {
        var _this = this;
        var charges = {};
        this.selected.forEach(function(id) {
          var _a;
          var max = null !== (_a = _this.limits.maxPerType[id]) && void 0 !== _a ? _a : 10;
          charges[id] = max;
        });
        this.confirmedCharges = charges;
        EventBus_1.EventBus.emit(EventNames_1.EventNames.BoostersSelected, charges);
      };
      BoosterSelectionService.prototype.reset = function() {
        this.selected = [];
        this.confirmedCharges = {};
      };
      BoosterSelectionService.prototype.getConfirmedCharges = function() {
        return __assign({}, this.confirmedCharges);
      };
      BoosterSelectionService._instance = null;
      return BoosterSelectionService;
    }();
    exports.BoosterSelectionService = BoosterSelectionService;
    exports.boosterSelectionService = BoosterSelectionService.instance;
    cc._RF.pop();
  }, {
    "../../config/ConfigLoader": "ConfigLoader",
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames"
  } ],
  BoosterService: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "2b5878WKVFBhJqV5P1357g2", "BoosterService");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BoosterService = void 0;
    var EventNames_1 = require("../events/EventNames");
    var BoosterService = function() {
      function BoosterService(bus, getState) {
        this.bus = bus;
        this.getState = getState;
        this.boosters = {};
        this.activeId = null;
      }
      BoosterService.prototype.register = function(boost) {
        this.boosters[boost.id] = boost;
      };
      BoosterService.prototype.activate = function(id) {
        var boost = this.boosters[id];
        if (!boost) return;
        this.activeId && this.activeId !== id && this.cancel();
        if ("WaitingInput" !== this.getState()) return;
        if (!boost.canActivate()) return;
        boost.start();
        this.activeId = id;
        this.bus.emit(EventNames_1.EventNames.BoosterActivated, id);
        console.debug("Listeners for BoosterActivated:", this.bus.getListenerCount(EventNames_1.EventNames.BoosterActivated));
      };
      BoosterService.prototype.consume = function(id) {
        var boost = this.boosters[id];
        if (!boost) return;
        if (boost.charges <= 0) return;
        boost.charges--;
        this.activeId === id && (this.activeId = null);
        this.bus.emit(EventNames_1.EventNames.BoosterConsumed, id);
      };
      BoosterService.prototype.cancel = function() {
        null !== this.activeId && (this.activeId = null);
        this.bus.emit(EventNames_1.EventNames.BoosterCancelled);
      };
      BoosterService.prototype.getCharges = function(id) {
        var boost = this.boosters[id];
        return boost ? boost.charges : 0;
      };
      return BoosterService;
    }();
    exports.BoosterService = BoosterService;
    cc._RF.pop();
  }, {
    "../events/EventNames": "EventNames"
  } ],
  BoosterSetup: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "195cajA/UlOdJ6MjFdEW/ZI", "BoosterSetup");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.initBoosterService = exports.boosterService = void 0;
    var EventBus_1 = require("../EventBus");
    var BoosterService_1 = require("./BoosterService");
    var BoosterRegistry_1 = require("./BoosterRegistry");
    function initBoosterService(board, viewProvider, getState, charges) {
      exports.boosterService = new BoosterService_1.BoosterService(EventBus_1.EventBus, getState);
      var getView = function(p) {
        var _a;
        var views = viewProvider();
        return null === (_a = views[p.y]) || void 0 === _a ? void 0 : _a[p.x];
      };
      BoosterRegistry_1.BoosterRegistry.forEach(function(def) {
        var _a;
        var boost = def.factory({
          board: board,
          getView: getView,
          bus: EventBus_1.EventBus,
          boosterService: exports.boosterService,
          charges: null !== (_a = charges[def.id]) && void 0 !== _a ? _a : 0
        });
        exports.boosterService.register(boost);
      });
    }
    exports.initBoosterService = initBoosterService;
    cc._RF.pop();
  }, {
    "../EventBus": "EventBus",
    "./BoosterRegistry": "BoosterRegistry",
    "./BoosterService": "BoosterService"
  } ],
  Booster: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "7087eev1n1LA5NjvuaONaGu", "Booster");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    cc._RF.pop();
  }, {} ],
  ConfigLoader: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "7048fzM5O9IbK4DWnqB6iEi", "ConfigLoader");
    "use strict";
    var __assign = this && this.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.loadBoosterLimits = exports.DefaultBoosterLimits = exports.loadBoardConfig = exports.DefaultBoard = exports.loadGameConfigAsync = exports.clearConfigCache = void 0;
    var BoosterRegistry_1 = require("../core/boosters/BoosterRegistry");
    var gameConfigCache = null;
    function loadGameConfig() {
      if (gameConfigCache) return gameConfigCache;
      gameConfigCache = {
        board: exports.DefaultBoard,
        boosterLimits: exports.DefaultBoosterLimits
      };
      return gameConfigCache;
    }
    function clearConfigCache() {
      gameConfigCache = null;
    }
    exports.clearConfigCache = clearConfigCache;
    function loadGameConfigAsync() {
      return new Promise(function(resolve) {
        cc.resources.load("config/gameConfig", cc.JsonAsset, function(err, asset) {
          if (!err && asset) {
            var config = asset.json;
            var result = {
              board: __assign(__assign({}, exports.DefaultBoard), config.board),
              boosterLimits: __assign(__assign({}, exports.DefaultBoosterLimits), config.boosterLimits)
            };
            gameConfigCache = result;
            resolve(result);
          } else {
            var result = {
              board: exports.DefaultBoard,
              boosterLimits: exports.DefaultBoosterLimits
            };
            gameConfigCache = result;
            resolve(result);
          }
        });
      });
    }
    exports.loadGameConfigAsync = loadGameConfigAsync;
    exports.DefaultBoard = {
      cols: 9,
      rows: 10,
      tileWidth: 100,
      tileHeight: 100,
      colors: [ "red", "blue", "green", "yellow", "purple" ],
      superThreshold: 5,
      superChances: {
        row: .5,
        col: .3,
        bomb: .15,
        clear: .05
      }
    };
    function loadBoardConfig() {
      var config = loadGameConfig();
      return config.board;
    }
    exports.loadBoardConfig = loadBoardConfig;
    exports.DefaultBoosterLimits = {
      maxTypes: 2,
      maxPerType: Object.fromEntries(BoosterRegistry_1.BoosterRegistry.map(function(b) {
        return [ b.id, 10 ];
      }))
    };
    function loadBoosterLimits() {
      var config = loadGameConfig();
      var base = __assign({}, config.boosterLimits);
      try {
        var storage = "undefined" !== typeof window && window.localStorage || globalThis.localStorage;
        if (storage && "function" === typeof storage.getItem) {
          var raw = storage.getItem("boosterLimits");
          if (raw) {
            var data = JSON.parse(raw);
            "number" === typeof data.maxTypes && (base.maxTypes = data.maxTypes);
            data.maxPerType && Object.entries(data.maxPerType).forEach(function(_a) {
              var id = _a[0], val = _a[1];
              void 0 !== base.maxPerType[id] && (base.maxPerType[id] = val);
            });
          }
        }
      } catch (error) {
        console.warn("Failed to load booster limits from localStorage:", error);
      }
      return base;
    }
    exports.loadBoosterLimits = loadBoosterLimits;
    cc._RF.pop();
  }, {
    "../core/boosters/BoosterRegistry": "BoosterRegistry"
  } ],
  EventBus: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "35c73JiA11MKJPgnaXf3iYR", "EventBus");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.EventBus = void 0;
    var InfrastructureEventBus_1 = require("../infrastructure/InfrastructureEventBus");
    exports.EventBus = new InfrastructureEventBus_1.InfrastructureEventBus();
    cc._RF.pop();
  }, {
    "../infrastructure/InfrastructureEventBus": "InfrastructureEventBus"
  } ],
  EventNames: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "61e1aBkBhFIOoBGr3I2geLT", "EventNames");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.EventNames = void 0;
    exports.EventNames = {
      GameStart: "GameStart",
      GameRestart: "GameRestart",
      GroupSelected: "GroupSelected",
      TilesRemoved: "TilesRemoved",
      MoveCompleted: "MoveCompleted",
      FillStarted: "FillStarted",
      FillDone: "FillDone",
      FallStarted: "FallStarted",
      FallDone: "FallDone",
      TurnsInit: "TurnsInit",
      TurnUsed: "TurnUsed",
      TurnEnded: "TurnEnded",
      OutOfTurns: "OutOfTurns",
      GameWon: "GameWon",
      GameLost: "GameLost",
      BoosterActivated: "BoosterActivated",
      BoosterConsumed: "BoosterConsumed",
      BoosterCancelled: "BoosterCancelled",
      BoostersSelected: "BoostersSelected",
      BoosterConfirmed: "BoosterConfirmed",
      BoosterTargetSelected: "BoosterTargetSelected",
      StateChanged: "StateChanged",
      GamePaused: "GamePaused",
      GameResumed: "GameResumed",
      AnimationStarted: "AnimationStarted",
      AnimationEnded: "AnimationEnded",
      AutoShuffle: "AutoShuffle",
      ShuffleLimitExceeded: "ShuffleLimitExceeded",
      ShuffleDone: "ShuffleDone",
      GroupFound: "GroupFound",
      SwapCancelled: "SwapCancelled",
      SwapDone: "SwapDone",
      RemoveStarted: "RemoveStarted",
      SuperTileCreated: "SuperTileCreated",
      SuperTilePlaced: "SuperTilePlaced",
      SuperTileActivated: "SuperTileActivated",
      TilePressed: "TilePressed",
      InvalidTap: "InvalidTap"
    };
    cc._RF.pop();
  }, {} ],
  ExtendedEventTarget: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b6a53Pg+zJB4KuR7mEppPEW", "ExtendedEventTarget");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ExtendedEventTarget = void 0;
    var ExtendedEventTarget = function(_super) {
      __extends(ExtendedEventTarget, _super);
      function ExtendedEventTarget() {
        return null !== _super && _super.apply(this, arguments) || this;
      }
      ExtendedEventTarget.prototype.once = function(event, listener) {
        var _this = this;
        var callback = function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
          _this.off(event, callback);
          listener.apply(void 0, args);
        };
        this.on(event, callback);
      };
      return ExtendedEventTarget;
    }(cc.EventTarget);
    exports.ExtendedEventTarget = ExtendedEventTarget;
    cc._RF.pop();
  }, {} ],
  FXController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "27dd1C4jVdIkbMhp0fojxVB", "FXController");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    var _a;
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FXController = void 0;
    var Tile_1 = require("../board/Tile");
    var VfxInstance_1 = require("./VfxInstance");
    var FXController = function() {
      function FXController() {}
      FXController.setPrefab = function(kind, prefab) {
        FXController.prefabs[kind] = prefab;
      };
      FXController.setLayer = function(node) {
        FXController.layer = node;
      };
      FXController.waitForVfx = function(kind, position) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function() {
          var prefab, duration, node, parent, instance, finished, play;
          return __generator(this, function(_d) {
            switch (_d.label) {
             case 0:
              prefab = FXController.prefabs[kind];
              duration = FXController.durations[kind];
              if (!!prefab) return [ 3, 3 ];
              if (!duration) return [ 3, 2 ];
              return [ 4, new Promise(function(r) {
                return setTimeout(r, duration);
              }) ];

             case 1:
              _d.sent();
              _d.label = 2;

             case 2:
              return [ 2 ];

             case 3:
              node = cc.instantiate(prefab);
              parent = FXController.layer || (null === (_b = (_a = cc.director).getScene) || void 0 === _b ? void 0 : _b.call(_a));
              null === parent || void 0 === parent ? void 0 : parent.addChild(node);
              position && node.setPosition(position);
              node.zIndex = 9999;
              instance = node.getComponent(VfxInstance_1.VfxInstance) || node.addComponent(VfxInstance_1.VfxInstance);
              0 === instance.particleSystems.length && (instance.particleSystems = node.getComponentsInChildren(cc.ParticleSystem));
              0 === instance.animations.length && (instance.animations = node.getComponentsInChildren(cc.Animation));
              finished = false;
              play = instance.play().then(function() {
                finished = true;
              });
              if (!duration) return [ 3, 5 ];
              return [ 4, Promise.race([ play, new Promise(function(r) {
                return setTimeout(r, duration);
              }) ]) ];

             case 4:
              _d.sent();
              !finished && (null === (_c = cc.isValid) || void 0 === _c ? void 0 : _c.call(cc, node)) && node.destroy();
              return [ 3, 7 ];

             case 5:
              return [ 4, play ];

             case 6:
              _d.sent();
              _d.label = 7;

             case 7:
              return [ 2 ];
            }
          });
        });
      };
      FXController.prefabs = {};
      FXController.layer = null;
      FXController.durations = (_a = {}, _a[Tile_1.TileKind.SuperBomb] = 400, _a[Tile_1.TileKind.SuperRow] = 450, 
      _a[Tile_1.TileKind.SuperCol] = 450, _a);
      return FXController;
    }();
    exports.FXController = FXController;
    cc._RF.pop();
  }, {
    "../board/Tile": "Tile",
    "./VfxInstance": "VfxInstance"
  } ],
  FallAnimator: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e15b3wDvLlCt4mM6LOECcwv", "FallAnimator");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.runFallAnimation = void 0;
    var TileView_1 = require("../views/TileView");
    function runFallAnimation(node, end, delay, onComplete) {
      void 0 === delay && (delay = 0);
      var dist = Math.abs(node.y - end.y);
      var dur = dist / 1400;
      var maybe = node;
      "function" === typeof maybe.stopAllActions && maybe.stopAllActions();
      var tileView = node.getComponent(TileView_1.default);
      null === tileView || void 0 === tileView ? void 0 : tileView.startFall();
      var actions = [];
      delay > 0 && actions.push(cc.delayTime(delay));
      actions.push(cc.moveTo(dur, end.x, end.y));
      dist > 0 && actions.push(cc.callFunc(function() {
        var _a;
        var tileView = node.getComponent(TileView_1.default);
        var target = null !== (_a = null === tileView || void 0 === tileView ? void 0 : tileView.visualRoot) && void 0 !== _a ? _a : node;
        var prev = target.getAnchorPoint();
        target.setAnchorPoint(cc.v2(.5, 0));
        var bump = cc.sequence(cc.scaleTo(.1, 1, .8), cc.scaleTo(.1, 1, 1), cc.callFunc(function() {
          return target.setAnchorPoint(prev);
        }));
        target.runAction(bump);
      }));
      onComplete && actions.push(cc.callFunc(function() {
        onComplete();
      }));
      actions.push(cc.callFunc(function() {
        null === tileView || void 0 === tileView ? void 0 : tileView.endFall();
      }));
      node.runAction(cc.sequence.apply(cc, actions));
    }
    exports.runFallAnimation = runFallAnimation;
    cc._RF.pop();
  }, {
    "../views/TileView": "TileView"
  } ],
  FallCommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8dc2az1IwlLPI2vaNbxvKki", "FallCommand");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FallCommand = void 0;
    var EventNames_1 = require("../../events/EventNames");
    var FallCommand = function() {
      function FallCommand(board, bus, columns) {
        this.board = board;
        this.bus = bus;
        this.columns = columns;
      }
      Object.defineProperty(FallCommand.prototype, "cfg", {
        get: function() {
          return this.board.cfg;
        },
        enumerable: false,
        configurable: true
      });
      FallCommand.prototype.execute = function() {
        return __awaiter(this, void 0, Promise, function() {
          var emptySlots, rows, _i, _a, x, kept, y_1, t, y, _b, kept_1, t, p;
          return __generator(this, function(_c) {
            if (0 === this.columns.length) throw new Error("FallCommand: no columns specified");
            this.bus.emit(EventNames_1.EventNames.FallStarted, this.columns);
            emptySlots = [];
            rows = this.cfg.rows;
            for (_i = 0, _a = this.columns; _i < _a.length; _i++) {
              x = _a[_i];
              kept = [];
              for (y_1 = rows - 1; y_1 >= 0; y_1--) {
                t = this.board.tileAt(new cc.Vec2(x, y_1));
                t && kept.push(t);
              }
              y = rows - 1;
              for (_b = 0, kept_1 = kept; _b < kept_1.length; _b++) {
                t = kept_1[_b];
                this.board.setTile(new cc.Vec2(x, y), t);
                y--;
              }
              for (;y >= 0; y--) {
                p = new cc.Vec2(x, y);
                this.board.setTile(p, null);
                emptySlots.push(p);
              }
            }
            this.bus.emit(EventNames_1.EventNames.FallDone, emptySlots);
            return [ 2 ];
          });
        });
      };
      return FallCommand;
    }();
    exports.FallCommand = FallCommand;
    cc._RF.pop();
  }, {
    "../../events/EventNames": "EventNames"
  } ],
  FillCommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "c9680tUujFMLJ5xIsQTNe7i", "FillCommand");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FillCommand = void 0;
    var Tile_1 = require("../Tile");
    var EventNames_1 = require("../../events/EventNames");
    var FillCommand = function() {
      function FillCommand(board, bus, slots) {
        this.board = board;
        this.bus = bus;
        this.slots = slots;
      }
      Object.defineProperty(FillCommand.prototype, "cfg", {
        get: function() {
          return this.board.cfg;
        },
        enumerable: false,
        configurable: true
      });
      FillCommand.prototype.execute = function() {
        return __awaiter(this, void 0, Promise, function() {
          var _i, _a, p, color;
          return __generator(this, function(_b) {
            if (0 === this.slots.length) throw new Error("FillCommand: no slots provided");
            this.bus.emit(EventNames_1.EventNames.FillStarted, this.slots);
            for (_i = 0, _a = this.slots; _i < _a.length; _i++) {
              p = _a[_i];
              if (!this.board.inBounds(p)) continue;
              color = this.randomColor();
              this.board.setTile(p, Tile_1.TileFactory.createNormal(color));
            }
            this.bus.emit(EventNames_1.EventNames.FillDone);
            return [ 2 ];
          });
        });
      };
      FillCommand.prototype.randomColor = function() {
        var colors = this.cfg.colors;
        var idx = Math.floor(Math.random() * colors.length);
        return colors[idx];
      };
      return FillCommand;
    }();
    exports.FillCommand = FillCommand;
    cc._RF.pop();
  }, {
    "../../events/EventNames": "EventNames",
    "../Tile": "Tile"
  } ],
  FillController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f1d0aplqLhKkrtdf1x38UJm", "FillController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var GameBoardController_1 = require("./GameBoardController");
    var TileView_1 = require("../views/TileView");
    var FallAnimator_1 = require("../utils/FallAnimator");
    var PositionUtils_1 = require("../utils/PositionUtils");
    var FillController = function(_super) {
      __extends(FillController, _super);
      function FillController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.tileNodePrefab = null;
        _this.tilesLayer = null;
        _this.pending = [];
        return _this;
      }
      FillController.prototype.onLoad = function() {
        var boardCtrl = this.getComponent(GameBoardController_1.default);
        this.board = boardCtrl.getBoard();
        this.tilesLayer = this.node.getChildByName("TilesLayer");
        this.tileViews = boardCtrl.tileViews;
        EventBus_1.EventBus.on(EventNames_1.EventNames.FillStarted, this.onFillStarted, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.FillDone, this.onFillDone, this);
      };
      FillController.prototype.onFillStarted = function(slots) {
        this.tileViews = this.getComponent(GameBoardController_1.default).tileViews;
        this.pending = slots;
        var byCol = {};
        for (var i = 0; i < slots.length; i++) {
          var p = slots[i];
          byCol[p.x] || (byCol[p.x] = []);
          byCol[p.x].push(p);
        }
        var delayStep = .1;
        for (var _i = 0, _a = Object.keys(byCol); _i < _a.length; _i++) {
          var colStr = _a[_i];
          var list = byCol[parseInt(colStr, 10)];
          list.sort(function(a, b) {
            return b.y - a.y;
          });
          for (var index = 0; index < list.length; index++) {
            var p = list[index];
            var view = cc.instantiate(this.tileNodePrefab).getComponent(TileView_1.default);
            view.node.parent = this.tilesLayer;
            view.node.active = true;
            view.node.opacity = 255;
            var start = PositionUtils_1.computeTilePosition(p.x, -1, this.board);
            view.node.setPosition(start);
            var end = PositionUtils_1.computeTilePosition(p.x, p.y, this.board);
            FallAnimator_1.runFallAnimation(view.node, end, index * delayStep);
            view.node.zIndex = this.board.rows - p.y - 1;
            this.tileViews[p.y][p.x] = view;
          }
        }
      };
      FillController.prototype.onFillDone = function() {
        for (var i = 0; i < this.pending.length; i++) {
          var p = this.pending[i];
          var view = this.tileViews[p.y][p.x];
          view && view.apply(this.board.tileAt(p));
        }
        this.pending = [];
      };
      FillController.prototype.reset = function(board, tileViews) {
        this.board = board;
        this.tileViews = tileViews;
        this.pending = [];
      };
      __decorate([ property(cc.Prefab) ], FillController.prototype, "tileNodePrefab", void 0);
      __decorate([ property(cc.Node) ], FillController.prototype, "tilesLayer", void 0);
      FillController = __decorate([ ccclass() ], FillController);
      return FillController;
    }(cc.Component);
    exports.default = FillController;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames",
    "../utils/FallAnimator": "FallAnimator",
    "../utils/PositionUtils": "PositionUtils",
    "../views/TileView": "TileView",
    "./GameBoardController": "GameBoardController"
  } ],
  GameBoardController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "01fa9k3VdlCfbh0rx8vvxB5", "GameBoardController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var BoardGenerator_1 = require("../../core/board/BoardGenerator");
    var ConfigLoader_1 = require("../../config/ConfigLoader");
    var TileView_1 = require("../views/TileView");
    var MoveFlowController_1 = require("./MoveFlowController");
    var FillController_1 = require("./FillController");
    var PositionUtils_1 = require("../utils/PositionUtils");
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var FXController_1 = require("../../core/fx/FXController");
    var GameBoardController = function(_super) {
      __extends(GameBoardController, _super);
      function GameBoardController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.tileNodePrefab = null;
        _this.tilesLayer = null;
        _this.tileViews = [];
        _this.teleportSelected = null;
        return _this;
      }
      GameBoardController.prototype.getBoard = function() {
        return this.board;
      };
      GameBoardController.prototype.onLoad = function() {
        var cfg = ConfigLoader_1.loadBoardConfig();
        this.board = new BoardGenerator_1.BoardGenerator().generate(cfg);
        this.spawnAllTiles();
        FXController_1.FXController.setLayer(this.tilesLayer);
        var flow = this.node.addComponent(MoveFlowController_1.default);
        flow.tilesLayer = this.tilesLayer;
        var fill = this.node.addComponent(FillController_1.default);
        fill.tileNodePrefab = this.tileNodePrefab;
        fill.tilesLayer = this.tilesLayer;
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoosterConfirmed, this.onBoosterConfirmed, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoosterTargetSelected, this.onBoosterTargetSelected, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoosterCancelled, this.clearTeleportHighlight, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.SwapDone, this.onSwapDone, this);
      };
      GameBoardController.prototype.spawnAllTiles = function() {
        for (var r = 0; r < this.board.rows; r++) {
          this.tileViews[r] = [];
          for (var c = 0; c < this.board.cols; c++) {
            var tileData = this.board.tileAt(new cc.Vec2(c, r));
            var node = cc.instantiate(this.tileNodePrefab);
            node.parent = this.tilesLayer;
            node.setAnchorPoint(cc.v2(0, 1));
            node.setPosition(PositionUtils_1.computeTilePosition(c, r, this.board));
            node.zIndex = this.board.rows - r - 1;
            var view = node.getComponent(TileView_1.default);
            view.apply(tileData);
            view.boardPos = cc.v2(c, r);
            this.tileViews[r][c] = view;
          }
        }
      };
      GameBoardController.prototype.resetBoard = function() {
        var cfg = ConfigLoader_1.loadBoardConfig();
        var newBoard = new BoardGenerator_1.BoardGenerator().generate(cfg);
        for (var y = 0; y < cfg.rows; y++) for (var x = 0; x < cfg.cols; x++) {
          var tile = newBoard.tileAt(new cc.Vec2(x, y));
          this.board.setTile(new cc.Vec2(x, y), tile);
        }
        this.tilesLayer.removeAllChildren();
        this.tileViews = [];
        this.spawnAllTiles();
        var flow = this.getComponent(MoveFlowController_1.default);
        null === flow || void 0 === flow ? void 0 : flow.reset(this.board, this.tileViews);
        var fill = this.getComponent(FillController_1.default);
        null === fill || void 0 === fill ? void 0 : fill.reset(this.board, this.tileViews);
        this.teleportSelected = null;
      };
      GameBoardController.prototype.spawn = function(pos) {
        var tileData = this.board.tileAt(pos);
        var node = cc.instantiate(this.tileNodePrefab);
        node.parent = this.tilesLayer;
        node.setAnchorPoint(cc.v2(0, 1));
        node.setPosition(PositionUtils_1.computeTilePosition(pos.x, pos.y, this.board));
        node.zIndex = this.board.rows - pos.y - 1;
        var view = node.getComponent(TileView_1.default);
        view.apply(tileData);
        view.boardPos = cc.v2(pos.x, pos.y);
        this.tileViews[pos.y][pos.x] = view;
        return view;
      };
      GameBoardController.prototype.onBoosterConfirmed = function(_a) {
        var position = _a.position;
        void position;
      };
      GameBoardController.prototype.onBoosterTargetSelected = function(_a) {
        var _b;
        var id = _a.id, stage = _a.stage, pos = _a.pos;
        if ("teleport" !== id) return;
        if ("first" === stage) {
          this.clearTeleportHighlight();
          var view = null === (_b = this.tileViews[pos.y]) || void 0 === _b ? void 0 : _b[pos.x];
          if (view) {
            view.node.setScale(1.2, 1.2);
            this.teleportSelected = view;
          }
        } else this.clearTeleportHighlight();
      };
      GameBoardController.prototype.clearTeleportHighlight = function() {
        if (this.teleportSelected) {
          this.teleportSelected.node.setScale(1, 1);
          this.teleportSelected = null;
        }
      };
      GameBoardController.prototype.onSwapDone = function(a, b) {
        var _this = this;
        var _a, _b;
        var viewA = null === (_a = this.tileViews[a.y]) || void 0 === _a ? void 0 : _a[a.x];
        var viewB = null === (_b = this.tileViews[b.y]) || void 0 === _b ? void 0 : _b[b.x];
        if (!viewA || !viewB) return;
        var nodeA = viewA.node;
        var nodeB = viewB.node;
        cc.tween(nodeA).to(.1, {
          scale: 0
        }).call(function() {
          return viewA.apply(_this.board.tileAt(a));
        }).to(.1, {
          scale: 1
        }).start();
        cc.tween(nodeB).to(.1, {
          scale: 0
        }).call(function() {
          return viewB.apply(_this.board.tileAt(b));
        }).to(.1, {
          scale: 1
        }).start();
      };
      GameBoardController.prototype.createDebugGrid = function() {
        var cfg = ConfigLoader_1.loadBoardConfig();
        var gridContainer = new cc.Node("DebugGrid");
        gridContainer.parent = this.tilesLayer;
        gridContainer.zIndex = 1e3;
        for (var c = 0; c <= this.board.cols; c++) {
          var line = new cc.Node("VLine");
          line.parent = gridContainer;
          var graphics = line.addComponent(cc.Graphics);
          graphics.lineWidth = 2;
          graphics.strokeColor = cc.Color.RED;
          var startX = (c - this.board.cols / 2) * cfg.tileWidth;
          var startY = this.board.rows / 2 * cfg.tileHeight;
          var endY = -this.board.rows / 2 * cfg.tileHeight;
          graphics.moveTo(startX, startY);
          graphics.lineTo(startX, endY);
          graphics.stroke();
        }
        for (var r = 0; r <= this.board.rows; r++) {
          var line = new cc.Node("HLine");
          line.parent = gridContainer;
          var graphics = line.addComponent(cc.Graphics);
          graphics.lineWidth = 2;
          graphics.strokeColor = cc.Color.BLUE;
          var startY = (this.board.rows / 2 - r) * cfg.tileHeight;
          var startX = -this.board.cols / 2 * cfg.tileWidth;
          var endX = this.board.cols / 2 * cfg.tileWidth;
          graphics.moveTo(startX, startY);
          graphics.lineTo(endX, startY);
          graphics.stroke();
        }
        for (var r = 0; r < this.board.rows; r++) for (var c = 0; c < this.board.cols; c++) {
          var label = new cc.Node("CellLabel");
          label.parent = gridContainer;
          var text = label.addComponent(cc.Label);
          text.string = c + "," + r;
          text.fontSize = 16;
          text.node.color = cc.Color.YELLOW;
          var pos = PositionUtils_1.computeTilePosition(c, r, this.board);
          label.setPosition(pos.x + cfg.tileWidth / 2, pos.y - cfg.tileHeight / 2);
        }
      };
      __decorate([ property(cc.Prefab) ], GameBoardController.prototype, "tileNodePrefab", void 0);
      __decorate([ property(cc.Node) ], GameBoardController.prototype, "tilesLayer", void 0);
      GameBoardController = __decorate([ ccclass() ], GameBoardController);
      return GameBoardController;
    }(cc.Component);
    exports.default = GameBoardController;
    cc._RF.pop();
  }, {
    "../../config/ConfigLoader": "ConfigLoader",
    "../../core/EventBus": "EventBus",
    "../../core/board/BoardGenerator": "BoardGenerator",
    "../../core/events/EventNames": "EventNames",
    "../../core/fx/FXController": "FXController",
    "../utils/PositionUtils": "PositionUtils",
    "../views/TileView": "TileView",
    "./FillController": "FillController",
    "./MoveFlowController": "MoveFlowController"
  } ],
  GameResultPopupController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "86c24lCZfROIoGw6gEugzar", "GameResultPopupController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PopupController = void 0;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var PopupController = function(_super) {
      __extends(PopupController, _super);
      function PopupController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.resultLine = null;
        _this.lblTitle = null;
        _this.lblFinalScore = null;
        _this.btnRestart = null;
        _this.originalResultLinePosition = cc.Vec3.ZERO;
        _this.onWin = function(score) {
          return _this.show(true, score);
        };
        _this.onLose = function(score) {
          return _this.show(false, score);
        };
        return _this;
      }
      PopupController.prototype.onLoad = function() {
        if (this.resultLine) {
          this.originalResultLinePosition = this.resultLine.position.clone();
          this.resultLine.active = false;
        }
        this.btnRestart && (this.btnRestart.node.active = false);
      };
      PopupController.prototype.onEnable = function() {
        EventBus_1.EventBus.on(EventNames_1.EventNames.GameWon, this.onWin, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.GameLost, this.onLose, this);
      };
      PopupController.prototype.onDisable = function() {
        EventBus_1.EventBus.off(EventNames_1.EventNames.GameWon, this.onWin);
        EventBus_1.EventBus.off(EventNames_1.EventNames.GameLost, this.onLose);
      };
      PopupController.prototype.show = function(win, score) {
        if (this.lblTitle) {
          this.lblTitle.string = win ? "\u041f\u043e\u0431\u0435\u0434\u0430!" : "\u041f\u043e\u0440\u0430\u0436\u0435\u043d\u0438\u0435...";
          this.lblTitle.node.color = win ? cc.Color.YELLOW : cc.Color.RED;
        }
        this.lblFinalScore && (this.lblFinalScore.string = String(score));
        this.btnRestart && (this.btnRestart.node.active = false);
        this.animateResultLineFall();
      };
      PopupController.prototype.animateResultLineFall = function() {
        var _this = this;
        if (!this.resultLine) return;
        var startPosition = this.originalResultLinePosition.clone();
        startPosition.y += 1e3;
        this.resultLine.active = true;
        this.resultLine.setPosition(startPosition);
        cc.tween(this.resultLine).to(.8, {
          position: this.originalResultLinePosition
        }, {
          easing: "backOut"
        }).call(function() {
          _this.showRestartButton();
        }).start();
      };
      PopupController.prototype.showRestartButton = function() {
        var _this = this;
        if (!this.btnRestart) return;
        this.btnRestart.node.active = true;
        this.btnRestart.node.scale = 0;
        cc.tween(this.btnRestart.node).to(.4, {
          scale: 1
        }, {
          easing: "backOut"
        }).start();
        this.btnRestart.node.once("click", function() {
          console.log("Restart");
          _this.hideElementsWithAnimation(function() {
            EventBus_1.EventBus.emit(EventNames_1.EventNames.GameRestart);
          });
        });
      };
      PopupController.prototype.hideElementsWithAnimation = function(callback) {
        var _this = this;
        this.btnRestart && cc.tween(this.btnRestart.node).to(.3, {
          scale: 0
        }, {
          easing: "backIn"
        }).call(function() {
          _this.btnRestart.node.active = false;
        }).start();
        if (this.resultLine) {
          var endPosition = this.originalResultLinePosition.clone();
          endPosition.y += 1e3;
          cc.tween(this.resultLine).to(.6, {
            position: endPosition
          }, {
            easing: "backIn"
          }).call(function() {
            _this.resultLine.active = false;
            callback();
          }).start();
        }
      };
      __decorate([ property(cc.Node) ], PopupController.prototype, "resultLine", void 0);
      __decorate([ property(cc.Label) ], PopupController.prototype, "lblTitle", void 0);
      __decorate([ property(cc.Label) ], PopupController.prototype, "lblFinalScore", void 0);
      __decorate([ property(cc.Button) ], PopupController.prototype, "btnRestart", void 0);
      PopupController = __decorate([ ccclass("") ], PopupController);
      return PopupController;
    }(cc.Component);
    exports.PopupController = PopupController;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames"
  } ],
  GameScene: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "98446nm3NlM75zj6A1JWo0f", "GameScene");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var EventBus_1 = require("./core/EventBus");
    var GameStateMachine_1 = require("./core/game/GameStateMachine");
    var BoardSolver_1 = require("./core/board/BoardSolver");
    var MoveExecutor_1 = require("./core/board/MoveExecutor");
    var ScoreStrategyQuadratic_1 = require("./core/rules/ScoreStrategyQuadratic");
    var TurnManager_1 = require("./core/rules/TurnManager");
    var GameBoardController_1 = require("./ui/controllers/GameBoardController");
    var MoveSequenceLogger_1 = require("./core/diagnostics/MoveSequenceLogger");
    var BoosterSetup_1 = require("./core/boosters/BoosterSetup");
    var EventNames_1 = require("./core/events/EventNames");
    var BoosterSelectPopup_1 = require("./ui/controllers/BoosterSelectPopup");
    var BoosterSelectionService_1 = require("./ui/services/BoosterSelectionService");
    var SoundController_1 = require("./core/fx/SoundController");
    var ccclass = cc._decorator.ccclass;
    var GameScene = function(_super) {
      __extends(GameScene, _super);
      function GameScene() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.fsm = null;
        _this.currentState = "WaitingInput";
        _this.onStateChange = function(s) {
          _this.currentState = s;
        };
        _this.onBoostersSelected = function(charges) {
          var board = _this.boardCtrl.getBoard();
          BoosterSetup_1.initBoosterService(board, function() {
            return _this.boardCtrl.tileViews;
          }, function() {
            return _this.currentState;
          }, charges);
          if (_this.fsm) _this.fsm.reset(); else {
            _this.fsm = new GameStateMachine_1.GameStateMachine(EventBus_1.EventBus, board, _this.solver, _this.executor, _this.scoreStrategy, _this.turns, 800, 3);
            _this.fsm.start();
          }
        };
        _this.onGameRestart = function() {
          var _a;
          _this.boardCtrl.resetBoard();
          null === (_a = _this.fsm) || void 0 === _a ? void 0 : _a.reset();
        };
        return _this;
      }
      GameScene.prototype.start = function() {
        this.boardCtrl = this.getComponentInChildren(GameBoardController_1.default);
        if (!this.boardCtrl) {
          console.error("GameBoardController not found");
          return;
        }
        var board = this.boardCtrl.getBoard();
        this.solver = new BoardSolver_1.BoardSolver(board);
        this.executor = new MoveExecutor_1.MoveExecutor(board, EventBus_1.EventBus);
        this.scoreStrategy = new ScoreStrategyQuadratic_1.ScoreStrategyQuadratic(1);
        this.turns = new TurnManager_1.TurnManager(20, EventBus_1.EventBus);
        this.sounds = new SoundController_1.SoundController(EventBus_1.EventBus);
        new MoveSequenceLogger_1.MoveSequenceLogger(EventBus_1.EventBus, board);
        EventBus_1.EventBus.on(EventNames_1.EventNames.StateChanged, this.onStateChange);
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoostersSelected, this.onBoostersSelected);
        EventBus_1.EventBus.on(EventNames_1.EventNames.GameRestart, this.onGameRestart);
        var selector = this.getComponentInChildren(BoosterSelectPopup_1.default);
        if (selector) selector.node.active = true; else {
          BoosterSelectionService_1.boosterSelectionService.reset();
          BoosterSelectionService_1.boosterSelectionService.confirm();
        }
      };
      GameScene.prototype.onDestroy = function() {
        EventBus_1.EventBus.off(EventNames_1.EventNames.StateChanged, this.onStateChange);
        EventBus_1.EventBus.off(EventNames_1.EventNames.BoostersSelected, this.onBoostersSelected);
        EventBus_1.EventBus.off(EventNames_1.EventNames.GameRestart, this.onGameRestart);
        this.sounds.destroy();
      };
      GameScene = __decorate([ ccclass() ], GameScene);
      return GameScene;
    }(cc.Component);
    exports.default = GameScene;
    cc._RF.pop();
  }, {
    "./core/EventBus": "EventBus",
    "./core/board/BoardSolver": "BoardSolver",
    "./core/board/MoveExecutor": "MoveExecutor",
    "./core/boosters/BoosterSetup": "BoosterSetup",
    "./core/diagnostics/MoveSequenceLogger": "MoveSequenceLogger",
    "./core/events/EventNames": "EventNames",
    "./core/fx/SoundController": "SoundController",
    "./core/game/GameStateMachine": "GameStateMachine",
    "./core/rules/ScoreStrategyQuadratic": "ScoreStrategyQuadratic",
    "./core/rules/TurnManager": "TurnManager",
    "./ui/controllers/BoosterSelectPopup": "BoosterSelectPopup",
    "./ui/controllers/GameBoardController": "GameBoardController",
    "./ui/services/BoosterSelectionService": "BoosterSelectionService"
  } ],
  GameStateController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "7ec012zJGdLZI7/DUiTuQ00", "GameStateController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var GameStateController = function(_super) {
      __extends(GameStateController, _super);
      function GameStateController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.boosterSelectPopup = null;
        _this.gameBoard = null;
        return _this;
      }
      GameStateController.prototype.start = function() {
        console.log("GameStateController start() called");
        this.setupEventListeners();
        this.setInitialState();
      };
      GameStateController.prototype.setInitialState = function() {
        this.boosterSelectPopup ? this.boosterSelectPopup.active = true : console.warn("BoosterSelectPopup not assigned in GameStateController");
        this.gameBoard ? this.gameBoard.active = false : console.warn("GameBoard not assigned in GameStateController");
      };
      GameStateController.prototype.setupEventListeners = function() {
        EventBus_1.EventBus.on(EventNames_1.EventNames.BoostersSelected, this.onGameStart, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.GameRestart, this.onGameRestart, this);
      };
      GameStateController.prototype.onGameStart = function(charges) {
        console.log("GameStateController: Starting game with charges:", charges);
        this.switchToGameBoard();
      };
      GameStateController.prototype.onGameRestart = function() {
        this.switchToBoosterSelection();
      };
      GameStateController.prototype.switchToBoosterSelection = function() {
        this.boosterSelectPopup && (this.boosterSelectPopup.active = true);
        this.gameBoard && (this.gameBoard.active = false);
      };
      GameStateController.prototype.switchToGameBoard = function() {
        this.boosterSelectPopup && (this.boosterSelectPopup.active = false);
        this.gameBoard && (this.gameBoard.active = true);
      };
      GameStateController.prototype.onDestroy = function() {
        EventBus_1.EventBus.off(EventNames_1.EventNames.BoostersSelected, this.onGameStart, this);
        EventBus_1.EventBus.off(EventNames_1.EventNames.GameRestart, this.onGameRestart, this);
      };
      __decorate([ property(cc.Node) ], GameStateController.prototype, "boosterSelectPopup", void 0);
      __decorate([ property(cc.Node) ], GameStateController.prototype, "gameBoard", void 0);
      GameStateController = __decorate([ ccclass() ], GameStateController);
      return GameStateController;
    }(cc.Component);
    exports.default = GameStateController;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames"
  } ],
  GameStateMachine: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "9963agpB15OKKOIRXjD0XKg", "GameStateMachine");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GameStateMachine = void 0;
    var EventNames_1 = require("../events/EventNames");
    var Tile_1 = require("../board/Tile");
    var GameStateMachine = function() {
      function GameStateMachine(bus, board, solver, executor, scoreStrategy, turnManager, targetScore, maxShuffles) {
        void 0 === maxShuffles && (maxShuffles = 3);
        this.bus = bus;
        this.board = board;
        this.solver = solver;
        this.executor = executor;
        this.scoreStrategy = scoreStrategy;
        this.turnManager = turnManager;
        this.targetScore = targetScore;
        this.maxShuffles = maxShuffles;
        this.state = "WaitingInput";
        this.score = 0;
        this.shuffles = 0;
      }
      GameStateMachine.prototype.start = function() {
        var _this = this;
        this.bus.on(EventNames_1.EventNames.GroupSelected, function(p) {
          return _this.onGroupSelected(p);
        });
        this.bus.on(EventNames_1.EventNames.BoosterActivated, function() {
          return _this.onBoosterActivated();
        });
        this.bus.on(EventNames_1.EventNames.BoosterConsumed, function() {
          return _this.onBoosterConsumed();
        });
        this.bus.on(EventNames_1.EventNames.BoosterCancelled, function() {
          return _this.onBoosterCancelled();
        });
        this.bus.on(EventNames_1.EventNames.MoveCompleted, function() {
          return _this.onMoveCompleted();
        });
        console.debug("Listeners for GroupSelected:", this.bus.getListenerCount(EventNames_1.EventNames.GroupSelected));
        var turns = this.turnManager.getRemaining();
        this.bus.emit(EventNames_1.EventNames.TurnsInit, {
          turns: turns,
          score: this.score,
          targetScore: this.targetScore
        });
        this.bus.emit(EventNames_1.EventNames.TurnUsed, turns);
        this.bus.emit(EventNames_1.EventNames.TurnEnded, {
          score: this.score
        });
        this.changeState("WaitingInput");
        console.info("FSM started, current state: WaitingInput");
      };
      GameStateMachine.prototype.reset = function() {
        this.score = 0;
        this.shuffles = 0;
        this.turnManager.reset();
        var turns = this.turnManager.getRemaining();
        this.bus.emit(EventNames_1.EventNames.TurnsInit, {
          turns: turns,
          score: this.score,
          targetScore: this.targetScore
        });
        this.bus.emit(EventNames_1.EventNames.TurnUsed, turns);
        this.bus.emit(EventNames_1.EventNames.TurnEnded, {
          score: this.score
        });
        this.changeState("WaitingInput");
      };
      GameStateMachine.prototype.onGroupSelected = function(start) {
        console.info("FSM received GroupSelected at", start);
        this.bus.emit(EventNames_1.EventNames.TilePressed, start);
        if ("WaitingInput" !== this.state) {
          console.info("Ignored GroupSelected because current state is " + this.state);
          return;
        }
        var tile = this.board.tileAt(start);
        if (!tile) return;
        if (tile.kind !== Tile_1.TileKind.Normal) {
          this.bus.emit(EventNames_1.EventNames.BoosterConfirmed, {
            kind: tile.kind,
            position: start
          });
          this.turnManager.useTurn();
          this.changeState("ExecutingMove");
          switch (tile.kind) {
           case Tile_1.TileKind.SuperBomb:
            var group_1 = [];
            for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) {
              var p = new cc.Vec2(start.x + dx, start.y + dy);
              this.board.inBounds(p) && group_1.push(p);
            }
            var expanded = this.solver.expandBySupers(group_1);
            this.score += this.scoreStrategy.calculate(expanded.length);
            void this.executor.execute(expanded);
            break;

           case Tile_1.TileKind.SuperRow:
            var group_2 = Array.from({
              length: this.board.cols
            }, function(_, x) {
              return new cc.Vec2(x, start.y);
            });
            var expanded = this.solver.expandBySupers(group_2);
            this.score += this.scoreStrategy.calculate(expanded.length);
            void this.executor.execute(expanded);
            break;

           case Tile_1.TileKind.SuperCol:
            var group_3 = Array.from({
              length: this.board.rows
            }, function(_, y) {
              return new cc.Vec2(start.x, y);
            });
            var expanded = this.solver.expandBySupers(group_3);
            this.score += this.scoreStrategy.calculate(expanded.length);
            void this.executor.execute(expanded);
            break;

           case Tile_1.TileKind.SuperClear:
            var group_4 = [];
            for (var x = 0; x < this.board.cols; x++) for (var y = 0; y < this.board.rows; y++) group_4.push(new cc.Vec2(x, y));
            var expanded = this.solver.expandBySupers(group_4);
            this.score += this.scoreStrategy.calculate(expanded.length);
            void this.executor.execute(expanded);
          }
          return;
        }
        var group = this.solver.findGroup(start);
        if (group.length < 2) {
          console.info("Tap ignored as move: single tile at " + start.x + "," + start.y);
          this.bus.emit(EventNames_1.EventNames.InvalidTap, start);
          return;
        }
        console.info("Tap accepted as move: group size " + group.length);
        this.turnManager.useTurn();
        this.score += this.scoreStrategy.calculate(group.length);
        this.changeState("ExecutingMove");
        void this.executor.execute(group);
      };
      GameStateMachine.prototype.onBoosterActivated = function() {
        "WaitingInput" === this.state && this.changeState("BoosterInput");
      };
      GameStateMachine.prototype.onBoosterConsumed = function() {
        "BoosterInput" === this.state && this.changeState("WaitingInput");
      };
      GameStateMachine.prototype.onBoosterCancelled = function() {
        "BoosterInput" === this.state && this.changeState("WaitingInput");
      };
      GameStateMachine.prototype.onMoveCompleted = function() {
        if ("ExecutingMove" !== this.state) return;
        this.changeState("TilesFalling");
        this.changeState("Filling");
        this.changeState("CheckEnd");
        this.evaluateEnd();
        this.bus.emit(EventNames_1.EventNames.TurnEnded, {
          score: this.score
        });
      };
      GameStateMachine.prototype.evaluateEnd = function() {
        var hasMoves = this.hasAvailableMoves();
        var turns = this.turnManager.getRemaining();
        if (this.score >= this.targetScore) {
          this.changeState("Win");
          return;
        }
        if (!hasMoves && this.shuffles < this.maxShuffles) {
          this.changeState("Shuffle");
          this.shuffleBoard();
          this.shuffles++;
          this.changeState("WaitingInput");
          return;
        }
        if (0 === turns || !hasMoves && this.shuffles >= this.maxShuffles) {
          this.changeState("Lose");
          return;
        }
        this.changeState("WaitingInput");
      };
      GameStateMachine.prototype.changeState = function(newState) {
        this.state = newState;
        this.bus.emit(EventNames_1.EventNames.StateChanged, newState);
        console.info("State changed to", newState);
        "Win" === newState && this.bus.emit(EventNames_1.EventNames.GameWon, this.score);
        "Lose" === newState && this.bus.emit(EventNames_1.EventNames.GameLost, this.score);
      };
      GameStateMachine.prototype.hasAvailableMoves = function() {
        var found = false;
        var positions = [];
        var tiles = [];
        this.board.forEach(function(p, tile) {
          positions.push(p);
          tiles.push(tile);
        });
        for (var i = 0; i < positions.length; i++) {
          if (found) break;
          var p = positions[i];
          var tile = tiles[i];
          for (var _i = 0, _a = this.board.neighbors4(p); _i < _a.length; _i++) {
            var n = _a[_i];
            var other = this.board.tileAt(n);
            if (other && other.color === tile.color) {
              found = true;
              break;
            }
          }
        }
        return found;
      };
      GameStateMachine.prototype.shuffleBoard = function() {
        var _a;
        var _b;
        var cfg = this.board.cfg;
        var tiles = [];
        for (var y = 0; y < cfg.rows; y++) for (var x = 0; x < cfg.cols; x++) tiles.push(this.board.tileAt(new cc.Vec2(x, y)));
        for (var i = tiles.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          _a = [ tiles[j], tiles[i] ], tiles[i] = _a[0], tiles[j] = _a[1];
        }
        var idx = 0;
        for (var y = 0; y < cfg.rows; y++) for (var x = 0; x < cfg.cols; x++) this.board.setTile(new cc.Vec2(x, y), null !== (_b = tiles[idx++]) && void 0 !== _b ? _b : null);
      };
      return GameStateMachine;
    }();
    exports.GameStateMachine = GameStateMachine;
    cc._RF.pop();
  }, {
    "../board/Tile": "Tile",
    "../events/EventNames": "EventNames"
  } ],
  HudController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b6264Ov0IlKkZ+JIR4nGpmF", "HudController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.HudController = void 0;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var HudController = function(_super) {
      __extends(HudController, _super);
      function HudController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.lblScore = null;
        _this.lblMoves = null;
        _this.lblState = null;
        _this.btnPause = null;
        _this.turns = 0;
        _this.score = 0;
        _this.targetScore = 0;
        return _this;
      }
      HudController.prototype.onLoad = function() {
        EventBus_1.EventBus.on(EventNames_1.EventNames.TurnUsed, this.onTurnUsed, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.TurnEnded, this.onTurnEnded, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.TurnsInit, this.onTurnsInit, this);
        console.log("HudController onLoad");
      };
      HudController.prototype.start = function() {
        var _a, _b, _c;
        var root = this.node;
        if (!this.lblState) {
          var n = root.getChildByName("lblState");
          this.lblState = null === n || void 0 === n ? void 0 : n.getComponent("Label");
        }
        if (!this.lblScore) {
          var n = root.getChildByName("lblScore");
          this.lblScore = null === n || void 0 === n ? void 0 : n.getComponent("Label");
        }
        if (!this.lblMoves) {
          var n = root.getChildByName("lblMoves");
          this.lblMoves = null === n || void 0 === n ? void 0 : n.getComponent("Label");
        }
        this.btnPause = null === (_a = root.getChildByName("btnPause")) || void 0 === _a ? void 0 : _a.getComponent("Button");
        null === (_c = null === (_b = this.btnPause) || void 0 === _b ? void 0 : _b.node) || void 0 === _c ? void 0 : _c.on("click", this.onPauseClick.bind(this));
        EventBus_1.EventBus.on(EventNames_1.EventNames.StateChanged, this.onStateChanged, this);
      };
      HudController.prototype.onTurnsInit = function(data) {
        this.turns = data.turns;
        this.score = data.score;
        this.targetScore = data.targetScore;
        this.lblScore && (this.lblScore.string = this.score + " / " + this.targetScore);
        this.lblMoves && (this.lblMoves.string = String(this.turns));
      };
      HudController.prototype.onTurnUsed = function(left) {
        var _a;
        this.lblMoves && (this.lblMoves.string = String(left));
        var moveNode = null === (_a = this.lblMoves) || void 0 === _a ? void 0 : _a.node;
        if (left <= 3 && moveNode) {
          EventBus_1.EventBus.emit(EventNames_1.EventNames.AnimationStarted, "moves-shake");
          cc.tween(moveNode).to(.05, {
            position: new cc.Vec3(-5, 0, 0)
          }).to(.05, {
            position: new cc.Vec3(5, 0, 0)
          }).to(.05, {
            position: new cc.Vec3(0, 0, 0)
          }).start();
          setTimeout(function() {
            return EventBus_1.EventBus.emit(EventNames_1.EventNames.AnimationEnded, "moves-shake");
          }, 150);
        }
      };
      HudController.prototype.onTurnEnded = function(_a) {
        var _this = this;
        var score = _a.score;
        if (!this.lblScore) return;
        var startVal = parseInt(this.lblScore.string, 10) || 0;
        var data = {
          value: startVal
        };
        EventBus_1.EventBus.emit(EventNames_1.EventNames.AnimationStarted, "score-tween");
        cc.tween(data).to(.5, {
          value: score
        }, {
          easing: "quadOut"
        }).start();
        var id = setInterval(function() {
          _this.lblScore && (_this.lblScore.string = Math.round(data.value) + " / " + _this.targetScore);
        }, 16);
        setTimeout(function() {
          clearInterval(id);
          _this.lblScore && (_this.lblScore.string = score + " / " + _this.targetScore);
          EventBus_1.EventBus.emit(EventNames_1.EventNames.AnimationEnded, "score-tween");
        }, 500);
      };
      HudController.prototype.onPauseClick = function() {
        EventBus_1.EventBus.emit(EventNames_1.EventNames.GamePaused);
      };
      HudController.prototype.onStateChanged = function(state) {
        this.lblState && (this.lblState.string = state);
      };
      __decorate([ property(cc.Label) ], HudController.prototype, "lblScore", void 0);
      __decorate([ property(cc.Label) ], HudController.prototype, "lblMoves", void 0);
      __decorate([ property(cc.Label) ], HudController.prototype, "lblState", void 0);
      HudController = __decorate([ ccclass() ], HudController);
      return HudController;
    }(cc.Component);
    exports.HudController = HudController;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames"
  } ],
  ICommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5f495wDG1dFL4Ms8sGfniyq", "ICommand");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    cc._RF.pop();
  }, {} ],
  InfrastructureEventBus: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "2c142c8pOVLuYpLp0KloVuu", "InfrastructureEventBus");
    "use strict";
    var __spreadArrays = this && this.__spreadArrays || function() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, 
      k++) r[k] = a[j];
      return r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.InfrastructureEventBus = void 0;
    var InfrastructureEventBus = function() {
      function InfrastructureEventBus() {
        this.target = new cc.EventTarget();
        this.registry = new Map();
      }
      InfrastructureEventBus.prototype.on = function(eventName, handler, target, useCapture) {
        var boundHandler = target ? handler.bind(target) : handler;
        this.target.on(eventName, boundHandler, target, useCapture);
        var set = this.registry.get(eventName);
        if (!set) {
          set = new Set();
          this.registry.set(eventName, set);
        }
        set.add(boundHandler);
      };
      InfrastructureEventBus.prototype.off = function(eventName, handler, target) {
        var boundHandler = target && handler ? handler.bind(target) : handler;
        this.target.off(eventName, boundHandler, target);
        var set = this.registry.get(eventName);
        if (set && boundHandler) {
          set.delete(boundHandler);
          0 === set.size && this.registry.delete(eventName);
        } else set && !boundHandler && this.registry.delete(eventName);
      };
      InfrastructureEventBus.prototype.once = function(event, listener, target) {
        var _this = this;
        var callback = function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
          _this.off(event, callback, target);
          var boundListener = target ? listener.bind(target) : listener;
          boundListener.apply(void 0, args);
        };
        this.on(event, callback, target);
      };
      InfrastructureEventBus.prototype.emit = function(eventName) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) args[_i - 1] = arguments[_i];
        var count = this.getListenerCount(eventName);
        0 === count && console.warn("EventBus: emitted event '" + eventName + "' has no listeners (possible typo or initialization issue)");
        console.log("emit", eventName, args);
        (_a = this.target).emit.apply(_a, __spreadArrays([ eventName ], args));
      };
      InfrastructureEventBus.prototype.getListenerCount = function(eventName) {
        var _a, _b;
        return null !== (_b = null === (_a = this.registry.get(eventName)) || void 0 === _a ? void 0 : _a.size) && void 0 !== _b ? _b : 0;
      };
      InfrastructureEventBus.prototype.clear = function(eventName) {
        var _this = this;
        if (eventName) {
          var set = this.registry.get(eventName);
          set && set.forEach(function(h) {
            _this.target.off(eventName, h);
          });
          this.registry.delete(eventName);
        } else {
          this.registry.forEach(function(handlers, evt) {
            handlers.forEach(function(h) {
              _this.target.off(evt, h);
            });
          });
          this.registry.clear();
        }
      };
      return InfrastructureEventBus;
    }();
    exports.InfrastructureEventBus = InfrastructureEventBus;
    cc._RF.pop();
  }, {} ],
  MoveExecutor: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "72af8qvoYpLY7lrWWEEqXN+", "MoveExecutor");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.MoveExecutor = void 0;
    var RemoveCommand_1 = require("./commands/RemoveCommand");
    var FallCommand_1 = require("./commands/FallCommand");
    var FillCommand_1 = require("./commands/FillCommand");
    var Tile_1 = require("./Tile");
    var SuperTileFactory_1 = require("../boosters/SuperTileFactory");
    var EventNames_1 = require("../events/EventNames");
    var FXController_1 = require("../fx/FXController");
    var MoveExecutor = function() {
      function MoveExecutor(board, bus) {
        this.board = board;
        this.bus = bus;
      }
      MoveExecutor.prototype.execute = function(group) {
        return __awaiter(this, void 0, Promise, function() {
          var cfg, start, startTile, hasSuper, vfxPromises, onSuperActivated, removeDone, dirtyCols, kind, tile, fallDone, emptySlots, fillDone;
          var _this = this;
          return __generator(this, function(_a) {
            switch (_a.label) {
             case 0:
              if (0 === group.length) throw new Error("MoveExecutor: group is empty");
              cfg = this.board.config;
              start = group[0];
              startTile = this.board.tileAt(start);
              hasSuper = group.some(function(p) {
                var t = _this.board.tileAt(p);
                return null !== t && t.kind !== Tile_1.TileKind.Normal;
              });
              vfxPromises = [];
              onSuperActivated = function(kind, pos) {
                var cfg = _this.board.config;
                var x = (pos.x - _this.board.cols / 2) * cfg.tileWidth + cfg.tileWidth / 2;
                var y = (_this.board.rows / 2 - pos.y) * cfg.tileHeight - cfg.tileHeight / 2;
                vfxPromises.push(FXController_1.FXController.waitForVfx(kind, cc.v2(x, y)));
              };
              this.bus.on(EventNames_1.EventNames.SuperTileActivated, onSuperActivated);
              removeDone = this.wait(EventNames_1.EventNames.TilesRemoved);
              new RemoveCommand_1.RemoveCommand(this.board, this.bus, group).execute();
              return [ 4, removeDone ];

             case 1:
              dirtyCols = _a.sent()[0];
              this.bus.off(EventNames_1.EventNames.SuperTileActivated, onSuperActivated);
              return [ 4, Promise.all(vfxPromises) ];

             case 2:
              _a.sent();
              if (startTile && group.length >= cfg.superThreshold && !hasSuper) {
                kind = new SuperTileFactory_1.SuperTileFactory(cfg).make();
                tile = Tile_1.TileFactory.createNormal(startTile.color);
                tile.kind = kind;
                this.board.setTile(start, tile);
                this.bus.emit(EventNames_1.EventNames.SuperTileCreated, start, tile);
              }
              fallDone = this.wait(EventNames_1.EventNames.FallDone);
              new FallCommand_1.FallCommand(this.board, this.bus, dirtyCols).execute();
              return [ 4, fallDone ];

             case 3:
              emptySlots = _a.sent()[0];
              fillDone = this.wait(EventNames_1.EventNames.FillDone);
              new FillCommand_1.FillCommand(this.board, this.bus, emptySlots).execute();
              return [ 4, fillDone ];

             case 4:
              _a.sent();
              this.bus.emit(EventNames_1.EventNames.MoveCompleted);
              return [ 2 ];
            }
          });
        });
      };
      MoveExecutor.prototype.wait = function(event) {
        var _this = this;
        return new Promise(function(resolve) {
          _this.bus.once(event, function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
            return resolve(args);
          });
        });
      };
      return MoveExecutor;
    }();
    exports.MoveExecutor = MoveExecutor;
    cc._RF.pop();
  }, {
    "../boosters/SuperTileFactory": "SuperTileFactory",
    "../events/EventNames": "EventNames",
    "../fx/FXController": "FXController",
    "./Tile": "Tile",
    "./commands/FallCommand": "FallCommand",
    "./commands/FillCommand": "FillCommand",
    "./commands/RemoveCommand": "RemoveCommand"
  } ],
  MoveFlowController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "4f8bbEeHPVKQb57Gl5Xstyz", "MoveFlowController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var GameBoardController_1 = require("./GameBoardController");
    var FallAnimator_1 = require("../utils/FallAnimator");
    var PositionUtils_1 = require("../utils/PositionUtils");
    var Tile_1 = require("../../core/board/Tile");
    var ShockwaveConfig_1 = require("../../config/ShockwaveConfig");
    var MoveFlowController = function(_super) {
      __extends(MoveFlowController, _super);
      function MoveFlowController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.tilesLayer = null;
        _this.pendingRemoval = new Set();
        return _this;
      }
      MoveFlowController.prototype.onLoad = function() {
        this.boardCtrl = this.node.getComponent(GameBoardController_1.default);
        this.board = this.boardCtrl.getBoard();
        this.tileViews = this.boardCtrl.tileViews;
        EventBus_1.EventBus.on(EventNames_1.EventNames.RemoveStarted, this.onRemove, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.FallDone, this.onFall, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.FillDone, this.onFill, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.SuperTileCreated, this.onSuperTileCreated, this);
        EventBus_1.EventBus.on(EventNames_1.EventNames.SuperTileActivated, this.onSuperTileActivated, this);
      };
      MoveFlowController.prototype.onRemove = function(positions) {
        var _a;
        this.pendingRemoval = new Set(positions.map(function(p) {
          return p.x + "," + p.y;
        }));
        this.tileViews = this.boardCtrl.tileViews;
        var _loop_1 = function(i) {
          var p = positions[i];
          var view = null === (_a = this_1.tileViews[p.y]) || void 0 === _a ? void 0 : _a[p.x];
          if (!view) return "continue";
          view.node.runAction(cc.sequence(cc.spawn(cc.scaleTo(.15, 0), cc.fadeOut(.15)), cc.callFunc(function() {
            return view.node.destroy();
          })));
          this_1.tileViews[p.y][p.x] = void 0;
          this_1.boardCtrl.tileViews[p.y][p.x] = void 0;
        };
        var this_1 = this;
        for (var i = 0; i < positions.length; i++) _loop_1(i);
      };
      MoveFlowController.prototype.onFall = function() {
        var map = new Map();
        for (var rowIndex = 0; rowIndex < this.tileViews.length; rowIndex++) {
          var row = this.tileViews[rowIndex];
          for (var colIndex = 0; colIndex < row.length; colIndex++) {
            var v = row[colIndex];
            if (!v) continue;
            map.set(v.tile, v);
          }
        }
        var updated = [];
        for (var r = 0; r < this.board.rows; r++) updated[r] = new Array(this.board.cols);
        var positions = [];
        var tiles = [];
        this.board.forEach(function(p, t) {
          positions.push(p);
          tiles.push(t);
        });
        for (var i = 0; i < positions.length; i++) {
          var p = positions[i];
          var t = tiles[i];
          var view = map.get(t);
          if (!view) continue;
          var target = PositionUtils_1.computeTilePosition(p.x, p.y, this.board);
          var dist = Math.floor(Math.abs(view.node.y - target.y));
          dist > 0 && FallAnimator_1.runFallAnimation(view.node, target);
          view.node.zIndex = this.board.rows - p.y - 1;
          view.boardPos = cc.v2(p.x, p.y);
          updated[p.y][p.x] = view;
        }
        this.tileViews = updated;
        this.boardCtrl.tileViews = this.tileViews;
      };
      MoveFlowController.prototype.onFill = function() {
        this.tileViews = this.boardCtrl.tileViews;
      };
      MoveFlowController.prototype.onSuperTileCreated = function(pos) {
        var view = this.boardCtrl.spawn(pos);
        view.apply(this.board.tileAt(pos));
        this.tileViews = this.boardCtrl.tileViews;
      };
      MoveFlowController.prototype.onSuperTileActivated = function(kind, pos) {
        switch (kind) {
         case Tile_1.TileKind.SuperBomb:
          this.applyBombShockwave(pos);
          break;

         case Tile_1.TileKind.SuperRow:
          this.applyLineShockwave(pos, true);
          break;

         case Tile_1.TileKind.SuperCol:
          this.applyLineShockwave(pos, false);
        }
      };
      MoveFlowController.prototype.applyBombShockwave = function(center) {
        var _a;
        var centerPos = PositionUtils_1.computeTilePosition(center.x, center.y, this.board);
        for (var y = center.y - 2; y <= center.y + 2; y++) {
          var _loop_2 = function(x) {
            var dist = Math.max(Math.abs(x - center.x), Math.abs(y - center.y));
            if (dist < 1 || dist > 2) return "continue";
            var key = x + "," + y;
            if (this_2.pendingRemoval.has(key)) return "continue";
            var view = null === (_a = this_2.tileViews[y]) || void 0 === _a ? void 0 : _a[x];
            if (!view || !view.isInteractive()) return "continue";
            var node = view.node;
            var dx = node.x - centerPos.x;
            var dy = node.y - centerPos.y;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            var offset = cc.v2(dx / len * ShockwaveConfig_1.shock.bombOffset, dy / len * ShockwaveConfig_1.shock.bombOffset);
            cc.tween(node).by(ShockwaveConfig_1.shock.bombDurationOut, {
              position: offset
            }).by(ShockwaveConfig_1.shock.bombDurationBack, {
              position: cc.v2(-offset.x, -offset.y)
            }, {
              easing: "quadOut"
            }).call(function() {
              return node.setPosition(Math.round(node.x), Math.round(node.y));
            }).start();
          };
          var this_2 = this;
          for (var x = center.x - 2; x <= center.x + 2; x++) _loop_2(x);
        }
      };
      MoveFlowController.prototype.applyLineShockwave = function(center, isRow) {
        var _a;
        var max = isRow ? this.board.cols : this.board.rows;
        for (var i = 0; i < max; i++) {
          var dx = isRow ? Math.abs(i - center.x) : 0;
          var dy = isRow ? 0 : Math.abs(i - center.y);
          var delay = (dx + dy) * ShockwaveConfig_1.shock.lineDuration;
          var targets = [];
          isRow ? targets.push(cc.v2(i, center.y - 1), cc.v2(i, center.y + 1)) : targets.push(cc.v2(center.x - 1, i), cc.v2(center.x + 1, i));
          var _loop_3 = function(t) {
            var key = t.x + "," + t.y;
            if (!this_3.board.inBounds(t) || this_3.pendingRemoval.has(key)) return "continue";
            var view = null === (_a = this_3.tileViews[t.y]) || void 0 === _a ? void 0 : _a[t.x];
            if (!view || !view.isInteractive()) return "continue";
            var node = view.node;
            var sign = isRow ? Math.sign(t.y - center.y) : Math.sign(t.x - center.x);
            var dir = isRow ? cc.v2(0, -sign * ShockwaveConfig_1.shock.lineOffset) : cc.v2(sign * ShockwaveConfig_1.shock.lineOffset, 0);
            cc.tween(node).delay(delay).by(ShockwaveConfig_1.shock.lineDuration, {
              position: dir
            }).by(ShockwaveConfig_1.shock.lineDuration, {
              position: cc.v2(-dir.x, -dir.y)
            }, {
              easing: "quadOut"
            }).call(function() {
              return node.setPosition(Math.round(node.x), Math.round(node.y));
            }).start();
          };
          var this_3 = this;
          for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
            var t = targets_1[_i];
            _loop_3(t);
          }
        }
      };
      MoveFlowController.prototype.reset = function(board, tileViews) {
        this.board = board;
        this.tileViews = tileViews;
        this.boardCtrl = this.node.getComponent(GameBoardController_1.default);
      };
      __decorate([ property(cc.Node) ], MoveFlowController.prototype, "tilesLayer", void 0);
      MoveFlowController = __decorate([ ccclass() ], MoveFlowController);
      return MoveFlowController;
    }(cc.Component);
    exports.default = MoveFlowController;
    cc._RF.pop();
  }, {
    "../../config/ShockwaveConfig": "ShockwaveConfig",
    "../../core/EventBus": "EventBus",
    "../../core/board/Tile": "Tile",
    "../../core/events/EventNames": "EventNames",
    "../utils/FallAnimator": "FallAnimator",
    "../utils/PositionUtils": "PositionUtils",
    "./GameBoardController": "GameBoardController"
  } ],
  MoveSequenceBadge: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "ebfdaQCrGlPA6CCyLBtohIF", "MoveSequenceBadge");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var MoveSequenceLogger_1 = require("../../core/diagnostics/MoveSequenceLogger");
    var MoveSequenceBadge = function(_super) {
      __extends(MoveSequenceBadge, _super);
      function MoveSequenceBadge() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.label = null;
        return _this;
      }
      MoveSequenceBadge.prototype.onLoad = function() {
        var _this = this;
        this.label || (this.label = this.getComponent(cc.Label) || this.node.addComponent(cc.Label));
        this.logger = MoveSequenceLogger_1.MoveSequenceLogger.current;
        if (!this.logger) return;
        this.logger.onStatusChange(function(s) {
          _this.label.string = "Last move: " + s.step;
          _this.label.node.color = s.unsynced ? cc.Color.RED : cc.Color.WHITE;
        });
        var l = this.logger.getStatus();
        this.label.string = "Last move: " + l.step;
      };
      __decorate([ property(cc.Label) ], MoveSequenceBadge.prototype, "label", void 0);
      MoveSequenceBadge = __decorate([ ccclass() ], MoveSequenceBadge);
      return MoveSequenceBadge;
    }(cc.Component);
    exports.default = MoveSequenceBadge;
    cc._RF.pop();
  }, {
    "../../core/diagnostics/MoveSequenceLogger": "MoveSequenceLogger"
  } ],
  MoveSequenceLogger: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8b108pbGHxH2b3mG3wsqukG", "MoveSequenceLogger");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.MoveSequenceLogger = void 0;
    var EventNames_1 = require("../events/EventNames");
    var MoveSequenceLogger = function() {
      function MoveSequenceLogger(bus, board) {
        var _this = this;
        this.bus = bus;
        this.board = board;
        this.removed = 0;
        this.added = 0;
        this.cycles = 0;
        this.fillTimer = null;
        this.status = {
          step: "init",
          unsynced: false
        };
        this.listeners = [];
        MoveSequenceLogger.current = this;
        bus.on(EventNames_1.EventNames.GroupSelected, this.onGroupSelected, this);
        bus.on(EventNames_1.EventNames.TilesRemoved, this.onTilesRemoved, this);
        bus.on(EventNames_1.EventNames.FallDone, function() {
          return _this.update("fall done");
        }, this);
        bus.on(EventNames_1.EventNames.FillStarted, this.onFillStarted, this);
        bus.on(EventNames_1.EventNames.FillDone, this.onFillDone, this);
        bus.on(EventNames_1.EventNames.MoveCompleted, this.onMoveCompleted, this);
      }
      MoveSequenceLogger.prototype.onStatusChange = function(cb) {
        this.listeners.push(cb);
      };
      MoveSequenceLogger.prototype.getStatus = function() {
        return this.status;
      };
      MoveSequenceLogger.prototype.onGroupSelected = function() {
        this.removed = 0;
        this.added = 0;
        this.cycles = 0;
        this.update("group selected", false);
      };
      MoveSequenceLogger.prototype.onTilesRemoved = function(positions) {
        this.removed += positions.length;
        this.update("tiles removed");
      };
      MoveSequenceLogger.prototype.onFillStarted = function() {
        var _this = this;
        this.fillTimer && clearTimeout(this.fillTimer);
        this.fillTimer = setTimeout(function() {
          console.warn("MoveSequenceLogger: FillDone not received", {
            events: _this.status.step,
            board: _this.dumpBoard()
          });
          _this.update("fill timeout", true);
          _this.fillTimer = null;
        }, 600);
        this.update("fill started");
      };
      MoveSequenceLogger.prototype.onFillDone = function(newTiles) {
        var _a;
        if (this.fillTimer) {
          clearTimeout(this.fillTimer);
          this.fillTimer = null;
        }
        this.added += null !== (_a = null === newTiles || void 0 === newTiles ? void 0 : newTiles.length) && void 0 !== _a ? _a : 0;
        this.cycles++;
        this.update("fill done");
      };
      MoveSequenceLogger.prototype.onMoveCompleted = function() {
        var chain = this.cycles > 1 ? "yes" : "no";
        console.info("MoveSequence: removed " + this.removed + ", added " + this.added + ", chain " + chain);
        this.update("move completed");
      };
      MoveSequenceLogger.prototype.update = function(step, unsynced) {
        var _this = this;
        void 0 === unsynced && (unsynced = false);
        this.status = {
          step: step,
          unsynced: unsynced
        };
        this.listeners.forEach(function(l) {
          return l(_this.status);
        });
      };
      MoveSequenceLogger.prototype.dumpBoard = function() {
        var rows = [];
        for (var y = 0; y < this.board.rows; y++) {
          var cols = [];
          for (var x = 0; x < this.board.cols; x++) {
            var t = this.board.tileAt(new cc.Vec2(x, y));
            cols.push(t ? t.color[0] : "_");
          }
          rows.push(cols.join(""));
        }
        return rows.join("|");
      };
      MoveSequenceLogger.current = null;
      return MoveSequenceLogger;
    }();
    exports.MoveSequenceLogger = MoveSequenceLogger;
    cc._RF.pop();
  }, {
    "../events/EventNames": "EventNames"
  } ],
  PositionUtils: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b9047RnM/9Mq6cP8BlI7opT", "PositionUtils");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.computeTilePosition = void 0;
    var ConfigLoader_1 = require("../../config/ConfigLoader");
    function computeTilePosition(col, row, board) {
      var cfg = ConfigLoader_1.loadBoardConfig();
      var x = (col - board.cols / 2) * cfg.tileWidth + cfg.tileWidth / 2;
      var y = (board.rows / 2 - row) * cfg.tileHeight - cfg.tileHeight / 2;
      return cc.v2(x, y);
    }
    exports.computeTilePosition = computeTilePosition;
    cc._RF.pop();
  }, {
    "../../config/ConfigLoader": "ConfigLoader"
  } ],
  RemoveCommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "27eeaWK3wlIUpZ/Wzn6Xa2s", "RemoveCommand");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.RemoveCommand = void 0;
    var EventNames_1 = require("../../events/EventNames");
    var Tile_1 = require("../Tile");
    var RemoveCommand = function() {
      function RemoveCommand(board, bus, group) {
        this.board = board;
        this.bus = bus;
        this.group = group;
      }
      RemoveCommand.prototype.execute = function() {
        return __awaiter(this, void 0, Promise, function() {
          var cols, _i, _a, p, tile;
          return __generator(this, function(_b) {
            if (0 === this.group.length) throw new Error("RemoveCommand: group is empty");
            this.bus.emit(EventNames_1.EventNames.RemoveStarted, this.group);
            cols = new Set();
            for (_i = 0, _a = this.group; _i < _a.length; _i++) {
              p = _a[_i];
              if (!this.board.inBounds(p)) continue;
              tile = this.board.tileAt(p);
              if (tile) {
                tile.kind !== Tile_1.TileKind.Normal && this.bus.emit(EventNames_1.EventNames.SuperTileActivated, tile.kind, new cc.Vec2(p.x, p.y));
                this.board.setTile(p, null);
                cols.add(p.x);
              }
            }
            this.bus.emit(EventNames_1.EventNames.TilesRemoved, Array.from(cols));
            return [ 2 ];
          });
        });
      };
      return RemoveCommand;
    }();
    exports.RemoveCommand = RemoveCommand;
    cc._RF.pop();
  }, {
    "../../events/EventNames": "EventNames",
    "../Tile": "Tile"
  } ],
  RocketVfxController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f5012vGvgxCxY10dTrfxFr9", "RocketVfxController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.RocketVfxController = void 0;
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var RocketVfxController = function(_super) {
      __extends(RocketVfxController, _super);
      function RocketVfxController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.leftTail = null;
        _this.rightTail = null;
        _this.speed = 1.5;
        _this.duration = 1;
        _this.leftAngle = 135;
        _this.rightAngle = 45;
        _this.movementAngle = 90;
        _this.isPlaying = false;
        return _this;
      }
      RocketVfxController.prototype.play = function() {
        var _this = this;
        return new Promise(function(resolve) {
          var _a, _b;
          if (_this.isPlaying) {
            resolve();
            return;
          }
          if (!_this.node || !cc.isValid(_this.node)) {
            console.warn("Node is null or invalid");
            resolve();
            return;
          }
          _this.isPlaying = true;
          if (_this.leftTail) {
            _this.setupTail(_this.leftTail, _this.leftAngle);
            _this.leftTail.resetSystem();
          }
          if (_this.rightTail) {
            _this.setupTail(_this.rightTail, _this.rightAngle);
            _this.rightTail.resetSystem();
          }
          _this.animateNodeMovement();
          var finish = function() {
            _this.isPlaying = false;
            _this.node && cc.isValid(_this.node) && _this.node.destroy();
            resolve();
          };
          (null === (_a = _this.leftTail) || void 0 === _a ? void 0 : _a.node) && cc.isValid(_this.leftTail.node) && _this.leftTail.node.once("finished", finish);
          (null === (_b = _this.rightTail) || void 0 === _b ? void 0 : _b.node) && cc.isValid(_this.rightTail.node) && _this.rightTail.node.once("finished", finish);
          setTimeout(function() {
            _this.isPlaying && finish();
          }, 1e3 * _this.duration);
        });
      };
      RocketVfxController.prototype.animateNodeMovement = function() {
        var _a, _b;
        var visibleSize = cc.view.getVisibleSize();
        var screenWidth = visibleSize.width;
        var screenHeight = visibleSize.height;
        var distance = 1.5 * Math.max(screenWidth, screenHeight);
        if ((null === (_a = this.leftTail) || void 0 === _a ? void 0 : _a.node) && cc.isValid(this.leftTail.node)) {
          var leftAngleRad = this.leftAngle * Math.PI / 180;
          var leftDirectionX = Math.cos(leftAngleRad);
          var leftDirectionY = Math.sin(leftAngleRad);
          var leftEndX = this.leftTail.node.x + leftDirectionX * distance;
          var leftEndY = this.leftTail.node.y + leftDirectionY * distance;
          var leftMoveAction = cc.moveTo(this.duration, leftEndX, leftEndY);
          this.leftTail.node.runAction(leftMoveAction);
        }
        if ((null === (_b = this.rightTail) || void 0 === _b ? void 0 : _b.node) && cc.isValid(this.rightTail.node)) {
          var rightAngleRad = this.rightAngle * Math.PI / 180;
          var rightDirectionX = Math.cos(rightAngleRad);
          var rightDirectionY = Math.sin(rightAngleRad);
          var rightEndX = this.rightTail.node.x + rightDirectionX * distance;
          var rightEndY = this.rightTail.node.y + rightDirectionY * distance;
          var rightMoveAction = cc.moveTo(this.duration, rightEndX, rightEndY);
          this.rightTail.node.runAction(rightMoveAction);
        }
      };
      RocketVfxController.prototype.setupTail = function(particleSystem, angle) {
        if (!particleSystem || !cc.isValid(particleSystem)) {
          console.warn("ParticleSystem is null or invalid");
          return;
        }
        particleSystem.autoRemoveOnFinish = false;
        particleSystem.duration = this.duration;
        particleSystem.life = .8 * this.duration;
        particleSystem.speed = 30 * this.speed;
        particleSystem.angle = angle;
        particleSystem.angleVar = 0;
        particleSystem.startSize = 250;
        particleSystem.endSize = 5;
        particleSystem.startSizeVar = 5;
        particleSystem.endSizeVar = 2;
        particleSystem.startColor = cc.color(255, 200, 100, 255);
        particleSystem.endColor = cc.color(255, 100, 50, 0);
        particleSystem.startColorVar = cc.color(50, 50, 50, 50);
        particleSystem.endColorVar = cc.color(30, 30, 30, 30);
        particleSystem.emissionRate = 200;
        particleSystem.totalParticles = 100;
        particleSystem.gravity = cc.v2(0, 0);
        particleSystem.tangentialAccel = 0;
        particleSystem.radialAccel = 0;
        particleSystem.speedVar = 20;
        particleSystem.sourcePos = cc.v2(0, 0);
        particleSystem.posVar = cc.v2(2, 2);
        particleSystem.positionType = cc.ParticleSystem.PositionType.RELATIVE;
        particleSystem.startSpin = 0;
        particleSystem.endSpin = 0;
        particleSystem.startSpinVar = 180;
        particleSystem.endSpinVar = 180;
        particleSystem.rotationIsDir = true;
      };
      RocketVfxController.prototype.stop = function() {
        this.isPlaying = false;
        this.leftTail && cc.isValid(this.leftTail) && this.leftTail.stopSystem();
        this.rightTail && cc.isValid(this.rightTail) && this.rightTail.stopSystem();
      };
      __decorate([ property(cc.ParticleSystem) ], RocketVfxController.prototype, "leftTail", void 0);
      __decorate([ property(cc.ParticleSystem) ], RocketVfxController.prototype, "rightTail", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .5, 3, .1 ]
      }) ], RocketVfxController.prototype, "speed", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ .5, 2, .1 ]
      }) ], RocketVfxController.prototype, "duration", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ 0, 360, 5 ]
      }) ], RocketVfxController.prototype, "leftAngle", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ 0, 360, 5 ]
      }) ], RocketVfxController.prototype, "rightAngle", void 0);
      __decorate([ property({
        type: cc.Float,
        range: [ 0, 360, 5 ]
      }) ], RocketVfxController.prototype, "movementAngle", void 0);
      RocketVfxController = __decorate([ ccclass() ], RocketVfxController);
      return RocketVfxController;
    }(cc.Component);
    exports.RocketVfxController = RocketVfxController;
    exports.default = RocketVfxController;
    cc._RF.pop();
  }, {} ],
  SafeAreaAdjuster: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e19a3BH5X9A8JOLtbj+sF8r", "SafeAreaAdjuster");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SafeAreaAdjuster = void 0;
    var ccclass = cc._decorator.ccclass;
    var SafeAreaAdjuster = function(_super) {
      __extends(SafeAreaAdjuster, _super);
      function SafeAreaAdjuster() {
        return null !== _super && _super.apply(this, arguments) || this;
      }
      SafeAreaAdjuster.prototype.start = function() {
        var area = screen.safeArea;
        var node = this.node;
        var uiTransform = node.getComponent("UITransform");
        if (!uiTransform || !area) return;
        uiTransform.paddingLeft = area.x;
        uiTransform.paddingRight = area.width - area.x;
        uiTransform.paddingBottom = area.y;
        uiTransform.paddingTop = area.height - area.y;
      };
      SafeAreaAdjuster = __decorate([ ccclass() ], SafeAreaAdjuster);
      return SafeAreaAdjuster;
    }(cc.Component);
    exports.SafeAreaAdjuster = SafeAreaAdjuster;
    cc._RF.pop();
  }, {} ],
  ScoreStrategyQuadratic: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f9d05jXvqhEv62mAn1PSWVy", "ScoreStrategyQuadratic");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ScoreStrategyQuadratic = void 0;
    var ScoreStrategyQuadratic = function() {
      function ScoreStrategyQuadratic(multiplier) {
        void 0 === multiplier && (multiplier = 10);
        this.multiplier = multiplier;
      }
      ScoreStrategyQuadratic.prototype.calculate = function(size) {
        return Math.pow(size - 1, 2) * this.multiplier;
      };
      return ScoreStrategyQuadratic;
    }();
    exports.ScoreStrategyQuadratic = ScoreStrategyQuadratic;
    cc._RF.pop();
  }, {} ],
  ScoreStrategy: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "2608eH531pClIl4t7pPDLK4", "ScoreStrategy");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    cc._RF.pop();
  }, {} ],
  ShockwaveConfig: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "0074ex3TBVLNafuwdT7cLCz", "ShockwaveConfig");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.shock = void 0;
    exports.shock = {
      bombOffset: 12,
      bombDurationOut: .08,
      bombDurationBack: .12,
      lineOffset: 8,
      lineDuration: .1
    };
    cc._RF.pop();
  }, {} ],
  ShuffleService: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5eb68+t5GxJ8Zs7gDta1ggJ", "ShuffleService");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ShuffleService = void 0;
    var EventNames_1 = require("../events/EventNames");
    var ShuffleService = function() {
      function ShuffleService(board, solver, bus, maxShuffles) {
        void 0 === maxShuffles && (maxShuffles = 3);
        this.board = board;
        this.solver = solver;
        this.bus = bus;
        this.maxShuffles = maxShuffles;
        this.shuffleCount = 0;
      }
      ShuffleService.prototype.ensureMoves = function() {
        if (this.solver.hasMoves()) return;
        if (this.shuffleCount < this.maxShuffles) {
          this.bus.emit(EventNames_1.EventNames.AutoShuffle);
          this.shuffleCount++;
          this.shuffle();
        } else this.bus.emit(EventNames_1.EventNames.ShuffleLimitExceeded);
      };
      ShuffleService.prototype.shuffle = function() {
        var _a;
        var _b;
        var cfg = this.board.cfg;
        var tiles = [];
        for (var y = 0; y < cfg.rows; y++) for (var x = 0; x < cfg.cols; x++) tiles.push(this.board.tileAt(new cc.Vec2(x, y)));
        for (var i = tiles.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          _a = [ tiles[j], tiles[i] ], tiles[i] = _a[0], tiles[j] = _a[1];
        }
        var idx = 0;
        for (var x = 0; x < cfg.cols; x++) for (var y = 0; y < cfg.rows; y++) this.board.setTile(new cc.Vec2(x, y), null !== (_b = tiles[idx++]) && void 0 !== _b ? _b : null);
        this.bus.emit(EventNames_1.EventNames.ShuffleDone);
      };
      ShuffleService.prototype.reset = function() {
        this.shuffleCount = 0;
      };
      return ShuffleService;
    }();
    exports.ShuffleService = ShuffleService;
    cc._RF.pop();
  }, {
    "../events/EventNames": "EventNames"
  } ],
  SoundController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8b8a2t+Bm9LSa5MznrEo9uJ", "SoundController");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SoundController = void 0;
    var EventNames_1 = require("../events/EventNames");
    var SoundController = function() {
      function SoundController(bus) {
        var _a;
        var _this = this;
        this.bus = bus;
        this.handlers = {};
        var map = (_a = {}, _a[EventNames_1.EventNames.TilePressed] = "tile_click", _a[EventNames_1.EventNames.InvalidTap] = "invalid_tap", 
        _a[EventNames_1.EventNames.FallDone] = "tile_fall", _a[EventNames_1.EventNames.SwapDone] = "tile_swap", 
        _a[EventNames_1.EventNames.SuperTileCreated] = "super_tile", _a[EventNames_1.EventNames.SuperTileActivated] = "super_tile_activated", 
        _a[EventNames_1.EventNames.BoosterActivated] = "tile_click", _a[EventNames_1.EventNames.BoosterConsumed] = "booster_use", 
        _a[EventNames_1.EventNames.BoosterTargetSelected] = "booster_target", _a[EventNames_1.EventNames.GameWon] = "game_win", 
        _a[EventNames_1.EventNames.GameLost] = "game_lost", _a[EventNames_1.EventNames.TurnUsed] = "turn_used", 
        _a[EventNames_1.EventNames.TurnEnded] = "turn_end", _a);
        Object.keys(map).forEach(function(evt) {
          var handler = function() {
            return SoundController.play(map[evt]);
          };
          _this.bus.on(evt, handler);
          _this.handlers[evt] = handler;
        });
      }
      SoundController.prototype.destroy = function() {
        var _this = this;
        Object.keys(this.handlers).forEach(function(evt) {
          _this.bus.off(evt, _this.handlers[evt]);
        });
        this.handlers = {};
      };
      SoundController.play = function(name) {
        var cached = SoundController.clips[name];
        if (cached) {
          cc.audioEngine.playEffect(cached, false);
          return;
        }
        cc.resources.load("sounds/" + name, cc.AudioClip, function(err, clip) {
          if (err || !clip) return;
          SoundController.clips[name] = clip;
          cc.audioEngine.playEffect(clip, false);
        });
      };
      SoundController.clips = {};
      return SoundController;
    }();
    exports.SoundController = SoundController;
    cc._RF.pop();
  }, {
    "../events/EventNames": "EventNames"
  } ],
  SpriteHighlight: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "6f39cySoRhEu6uSaIiY0agr", "SpriteHighlight");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var SpriteHighlight = function(_super) {
      __extends(SpriteHighlight, _super);
      function SpriteHighlight() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.highlightColor = cc.Color.YELLOW;
        _this.highlightOpacity = 255;
        _this.originalColor = cc.Color.WHITE;
        _this.originalOpacity = 255;
        _this.isHighlighted = false;
        _this.sprite = null;
        return _this;
      }
      SpriteHighlight.prototype.onLoad = function() {
        this.sprite = this.node.getComponent(cc.Sprite);
        if (this.sprite) {
          this.originalColor = this.node.color.clone();
          this.originalOpacity = this.node.opacity;
        }
      };
      SpriteHighlight.prototype.toggleHighlight = function() {
        this.isHighlighted ? this.clearHighlight() : this.setHighlight();
      };
      SpriteHighlight.prototype.setHighlight = function() {
        if (!this.sprite) return;
        this.isHighlighted = true;
        this.node.color = this.highlightColor;
        this.node.opacity = this.highlightOpacity;
      };
      SpriteHighlight.prototype.clearHighlight = function() {
        if (!this.sprite) return;
        this.isHighlighted = false;
        this.node.color = this.originalColor;
        this.node.opacity = this.originalOpacity;
      };
      SpriteHighlight.prototype.isHighlightedState = function() {
        return this.isHighlighted;
      };
      SpriteHighlight.prototype.setHighlightColor = function(color) {
        this.highlightColor = color;
        this.isHighlighted && this.sprite && (this.node.color = color);
      };
      SpriteHighlight.prototype.setHighlightOpacity = function(opacity) {
        this.highlightOpacity = opacity;
        this.isHighlighted && this.sprite && (this.node.opacity = opacity);
      };
      SpriteHighlight.prototype.updateOriginalValues = function() {
        if (this.sprite) {
          this.originalColor = this.node.color.clone();
          this.originalOpacity = this.node.opacity;
        }
      };
      SpriteHighlight.prototype.resetToOriginal = function() {
        this.clearHighlight();
        this.updateOriginalValues();
      };
      SpriteHighlight.prototype.onDestroy = function() {
        this.clearHighlight();
      };
      __decorate([ property(cc.Color) ], SpriteHighlight.prototype, "highlightColor", void 0);
      __decorate([ property({
        type: cc.Integer,
        range: [ 0, 255, 1 ]
      }) ], SpriteHighlight.prototype, "highlightOpacity", void 0);
      SpriteHighlight = __decorate([ ccclass() ], SpriteHighlight);
      return SpriteHighlight;
    }(cc.Component);
    exports.default = SpriteHighlight;
    cc._RF.pop();
  }, {} ],
  SuperTileBooster: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "11243Oz0yxN/IBqCUOPh0tr", "SuperTileBooster");
    "use strict";
    var __assign = this && this.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SuperTileBooster = void 0;
    var Tile_1 = require("../board/Tile");
    var EventNames_1 = require("../events/EventNames");
    var SuperTileBooster = function() {
      function SuperTileBooster(id, board, getView, bus, svc, charges, kind) {
        this.board = board;
        this.getView = getView;
        this.bus = bus;
        this.svc = svc;
        this.kind = kind;
        this.id = id;
        this.charges = charges;
      }
      SuperTileBooster.prototype.canActivate = function() {
        return this.charges > 0;
      };
      SuperTileBooster.prototype.start = function() {
        var _this = this;
        var onPlace = function(pos) {
          _this.bus.off(EventNames_1.EventNames.BoosterCancelled, onCancel);
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onPlace);
          if (_this.charges <= 0) return;
          var p = pos;
          var tile = _this.board.tileAt(p);
          if (!tile || tile.kind !== Tile_1.TileKind.Normal) return;
          _this.svc.consume(_this.id);
          var superTile = __assign(__assign({}, tile), {
            kind: _this.kind
          });
          _this.board.setTile(p, superTile);
          var view = _this.getView(p);
          null === view || void 0 === view ? void 0 : view.apply(superTile);
          _this.bus.emit(EventNames_1.EventNames.SuperTilePlaced, {
            kind: _this.kind,
            position: p
          });
        };
        var onCancel = function() {
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onPlace);
          _this.bus.off(EventNames_1.EventNames.BoosterCancelled, onCancel);
        };
        this.bus.on(EventNames_1.EventNames.GroupSelected, onPlace);
        this.bus.on(EventNames_1.EventNames.BoosterCancelled, onCancel);
      };
      return SuperTileBooster;
    }();
    exports.SuperTileBooster = SuperTileBooster;
    cc._RF.pop();
  }, {
    "../board/Tile": "Tile",
    "../events/EventNames": "EventNames"
  } ],
  SuperTileFactory: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "1b75eP592xHOJtItF4qBtxN", "SuperTileFactory");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SuperTileFactory = void 0;
    var seedrandom = require("seedrandom");
    var Tile_1 = require("../board/Tile");
    var SuperTileFactory = function() {
      function SuperTileFactory(cfg) {
        this.cfg = cfg;
        this.rng = cfg.rngSeed ? seedrandom(cfg.rngSeed) : Math.random;
      }
      SuperTileFactory.prototype.make = function(kindSeed) {
        void 0 === kindSeed && (kindSeed = this.rng());
        var chances = this.cfg.superChances;
        if (chances) {
          var cumulative = 0;
          cumulative += chances.row;
          if (kindSeed < cumulative) return Tile_1.TileKind.SuperRow;
          cumulative += chances.col;
          if (kindSeed < cumulative) return Tile_1.TileKind.SuperCol;
          cumulative += chances.bomb;
          if (kindSeed < cumulative) return Tile_1.TileKind.SuperBomb;
          return Tile_1.TileKind.SuperClear;
        }
        if (kindSeed < .5) return Tile_1.TileKind.SuperRow;
        if (kindSeed < .8) return Tile_1.TileKind.SuperCol;
        if (kindSeed < .95) return Tile_1.TileKind.SuperBomb;
        return Tile_1.TileKind.SuperClear;
      };
      return SuperTileFactory;
    }();
    exports.SuperTileFactory = SuperTileFactory;
    cc._RF.pop();
  }, {
    "../board/Tile": "Tile",
    seedrandom: 2
  } ],
  SwapCommand: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "bd021wi8AhDX6fotF3piqBE", "SwapCommand");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SwapCommand = void 0;
    var EventNames_1 = require("../../events/EventNames");
    var SwapCommand = function() {
      function SwapCommand(board, a, b, bus) {
        this.board = board;
        this.a = a;
        this.b = b;
        this.bus = bus;
      }
      SwapCommand.prototype.execute = function() {
        return __awaiter(this, void 0, Promise, function() {
          var tA, tB;
          return __generator(this, function(_a) {
            if (!this.board.inBounds(this.a) || !this.board.inBounds(this.b)) throw new Error("SwapCommand: coordinates out of bounds");
            tA = this.board.tileAt(this.a);
            tB = this.board.tileAt(this.b);
            this.board.setTile(this.a, tB);
            this.board.setTile(this.b, tA);
            this.bus.emit(EventNames_1.EventNames.SwapDone, this.a, this.b);
            return [ 2 ];
          });
        });
      };
      return SwapCommand;
    }();
    exports.SwapCommand = SwapCommand;
    cc._RF.pop();
  }, {
    "../../events/EventNames": "EventNames"
  } ],
  TeleportBooster: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8293aR9CWlGr5AJcaoK9uXH", "TeleportBooster");
    "use strict";
    var __awaiter = this && this.__awaiter || function(thisArg, _arguments, P, generator) {
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
    var __generator = this && this.__generator || function(thisArg, body) {
      var _ = {
        label: 0,
        sent: function() {
          if (1 & t[0]) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      }, f, y, t, g;
      return g = {
        next: verb(0),
        throw: verb(1),
        return: verb(2)
      }, "function" === typeof Symbol && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([ n, v ]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = 2 & op[0] ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 
          0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          (y = 0, t) && (op = [ 2 & op[0], t.value ]);
          switch (op[0]) {
           case 0:
           case 1:
            t = op;
            break;

           case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

           case 5:
            _.label++;
            y = op[1];
            op = [ 0 ];
            continue;

           case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;

           default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (6 === op[0] || 2 === op[0])) {
              _ = 0;
              continue;
            }
            if (3 === op[0] && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (6 === op[0] && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            t[2] && _.ops.pop();
            _.trys.pop();
            continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [ 6, e ];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (5 & op[0]) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TeleportBooster = void 0;
    var SwapCommand_1 = require("../board/commands/SwapCommand");
    var BoardSolver_1 = require("../board/BoardSolver");
    var EventNames_1 = require("../events/EventNames");
    var TeleportBooster = function() {
      function TeleportBooster(board, bus, charges, requireMove) {
        void 0 === requireMove && (requireMove = false);
        this.board = board;
        this.bus = bus;
        this.requireMove = requireMove;
        this.id = "teleport";
        this.charges = charges;
      }
      TeleportBooster.prototype.canActivate = function() {
        return this.charges > 0;
      };
      TeleportBooster.prototype.start = function() {
        var _this = this;
        if (this.charges <= 0) {
          this.bus.emit(EventNames_1.EventNames.BoosterCancelled);
          return;
        }
        var first = null;
        var externalCancel = function() {
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onFirst);
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onSecond);
          _this.bus.off(EventNames_1.EventNames.InvalidTap, cancel);
          _this.bus.off(EventNames_1.EventNames.BoosterCancelled, externalCancel);
          first = null;
        };
        var cancel = function() {
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onSecond);
          _this.bus.off(EventNames_1.EventNames.InvalidTap, cancel);
          _this.bus.off(EventNames_1.EventNames.BoosterCancelled, externalCancel);
          first = null;
          _this.bus.emit(EventNames_1.EventNames.BoosterCancelled);
          rearm();
        };
        var onSecond = function(posB) {
          return __awaiter(_this, void 0, void 0, function() {
            var b, tA, tB, solver;
            return __generator(this, function(_a) {
              switch (_a.label) {
               case 0:
                if (this.charges <= 0 || !first) return [ 2 ];
                b = posB;
                if (b.x === first.x && b.y === first.y) {
                  cancel();
                  return [ 2 ];
                }
                this.bus.off(EventNames_1.EventNames.GroupSelected, onSecond);
                this.bus.off(EventNames_1.EventNames.InvalidTap, cancel);
                this.bus.off(EventNames_1.EventNames.BoosterCancelled, externalCancel);
                this.bus.emit(EventNames_1.EventNames.BoosterTargetSelected, {
                  id: this.id,
                  stage: "second",
                  pos: b
                });
                tA = this.board.tileAt(first);
                tB = this.board.tileAt(b);
                return [ 4, new SwapCommand_1.SwapCommand(this.board, first, b, this.bus).execute() ];

               case 1:
                _a.sent();
                if (this.requireMove) {
                  solver = new BoardSolver_1.BoardSolver(this.board);
                  if (!solver.hasMoves()) {
                    if (tA && tB) {
                      this.board.setTile(first, tA);
                      this.board.setTile(b, tB);
                    }
                    this.bus.emit(EventNames_1.EventNames.SwapCancelled);
                    return [ 2 ];
                  }
                }
                this.charges--;
                this.bus.emit(EventNames_1.EventNames.BoosterConsumed, this.id);
                return [ 2 ];
              }
            });
          });
        };
        var onFirst = function(posA) {
          _this.bus.off(EventNames_1.EventNames.GroupSelected, onFirst);
          first = posA;
          _this.bus.emit(EventNames_1.EventNames.BoosterTargetSelected, {
            id: _this.id,
            stage: "first",
            pos: first
          });
          _this.bus.on(EventNames_1.EventNames.GroupSelected, onSecond);
          _this.bus.on(EventNames_1.EventNames.InvalidTap, cancel);
        };
        var rearm = function() {
          _this.bus.on(EventNames_1.EventNames.GroupSelected, onFirst);
          _this.bus.on(EventNames_1.EventNames.BoosterCancelled, externalCancel);
        };
        rearm();
      };
      return TeleportBooster;
    }();
    exports.TeleportBooster = TeleportBooster;
    cc._RF.pop();
  }, {
    "../board/BoardSolver": "BoardSolver",
    "../board/commands/SwapCommand": "SwapCommand",
    "../events/EventNames": "EventNames"
  } ],
  TileAppearanceConfig: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "3245brUnJtELKkNyPIR2nTz", "TileAppearanceConfig");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TileAppearanceConfig = void 0;
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var Tile_1 = require("./Tile");
    var FXController_1 = require("../fx/FXController");
    var TileAppearanceConfig = function(_super) {
      __extends(TileAppearanceConfig, _super);
      function TileAppearanceConfig() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.kind = Tile_1.TileKind.Normal;
        _this.spawnFx = null;
        _this.activateFx = null;
        return _this;
      }
      TileAppearanceConfig_1 = TileAppearanceConfig;
      TileAppearanceConfig.prototype.onLoad = function() {
        this.activateFx && FXController_1.FXController.setPrefab(this.kind, this.activateFx);
      };
      var TileAppearanceConfig_1;
      TileAppearanceConfig.ccEnum = cc.Enum;
      __decorate([ property({
        type: TileAppearanceConfig_1.ccEnum ? TileAppearanceConfig_1.ccEnum(Tile_1.TileKind) : Tile_1.TileKind
      }) ], TileAppearanceConfig.prototype, "kind", void 0);
      __decorate([ property(cc.Prefab) ], TileAppearanceConfig.prototype, "spawnFx", void 0);
      __decorate([ property(cc.Prefab) ], TileAppearanceConfig.prototype, "activateFx", void 0);
      TileAppearanceConfig = TileAppearanceConfig_1 = __decorate([ ccclass() ], TileAppearanceConfig);
      return TileAppearanceConfig;
    }(cc.Component);
    exports.TileAppearanceConfig = TileAppearanceConfig;
    cc._RF.pop();
  }, {
    "../fx/FXController": "FXController",
    "./Tile": "Tile"
  } ],
  TileInputController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "3ef6dR9uqhHJZQmF/atmff3", "TileInputController");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var ConfigLoader_1 = require("../../config/ConfigLoader");
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var GameBoardController_1 = require("./GameBoardController");
    var TileInputController = function(_super) {
      __extends(TileInputController, _super);
      function TileInputController() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.tilesLayer = null;
        return _this;
      }
      TileInputController.prototype.onLoad = function() {
        var _this = this;
        this.boardCtrl = this.getComponent(GameBoardController_1.default);
        console.log("TileInputController onLoad", this.boardCtrl);
        if (0 === this.tilesLayer.width || 0 === this.tilesLayer.height) {
          var cfg = ConfigLoader_1.loadBoardConfig();
          this.tilesLayer.width = cfg.cols * cfg.tileWidth;
          this.tilesLayer.height = cfg.rows * cfg.tileHeight;
        }
        this.tilesLayer.on(cc.Node.EventType.TOUCH_END, function(e) {
          var worldPos = e.getLocation();
          var local = _this.tilesLayer.convertToNodeSpaceAR(worldPos);
          var col = Math.floor((local.x + _this.tilesLayer.width / 2) / ConfigLoader_1.loadBoardConfig().tileWidth);
          var row = Math.floor((_this.tilesLayer.height / 2 - (local.y - 12)) / ConfigLoader_1.loadBoardConfig().tileHeight);
          _this.handleTap(col, row);
        }, this);
      };
      TileInputController.prototype.handleTap = function(col, row) {
        var _a;
        var view = null === (_a = this.boardCtrl.tileViews[row]) || void 0 === _a ? void 0 : _a[col];
        if (!view || !view.isInteractive()) {
          console.debug("Tile tap ignored: falling=" + (null === view || void 0 === view ? void 0 : view["isFalling"]) + " feedbackActive=" + (null === view || void 0 === view ? void 0 : view["isFeedbackActive"]) + " at {" + col + "," + row + "}");
          EventBus_1.EventBus.emit(EventNames_1.EventNames.InvalidTap, new cc.Vec2(col, row));
          return;
        }
        console.debug("Tile tap feedback started at {" + col + "," + row + "}");
        EventBus_1.EventBus.emit(EventNames_1.EventNames.GroupSelected, new cc.Vec2(col, row));
      };
      __decorate([ property(cc.Node) ], TileInputController.prototype, "tilesLayer", void 0);
      TileInputController = __decorate([ ccclass() ], TileInputController);
      return TileInputController;
    }(cc.Component);
    exports.default = TileInputController;
    cc._RF.pop();
  }, {
    "../../config/ConfigLoader": "ConfigLoader",
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames",
    "./GameBoardController": "GameBoardController"
  } ],
  TilePressFeedback: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "tilepressfeedback-ts-uuid", "TilePressFeedback");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var ccclass = cc._decorator.ccclass;
    var EventBus_1 = require("../../core/EventBus");
    var EventNames_1 = require("../../core/events/EventNames");
    var GameBoardController_1 = require("./GameBoardController");
    var TilePressFeedback = function(_super) {
      __extends(TilePressFeedback, _super);
      function TilePressFeedback() {
        return null !== _super && _super.apply(this, arguments) || this;
      }
      TilePressFeedback.prototype.onLoad = function() {
        this.boardCtrl = this.getComponent(GameBoardController_1.default);
        EventBus_1.EventBus.on(EventNames_1.EventNames.TilePressed, this.onTilePressed, this);
      };
      TilePressFeedback.prototype.onTilePressed = function(pos) {
        var _a;
        var view = null === (_a = this.boardCtrl.tileViews[pos.y]) || void 0 === _a ? void 0 : _a[pos.x];
        null === view || void 0 === view ? void 0 : view.pressFeedback();
      };
      TilePressFeedback = __decorate([ ccclass() ], TilePressFeedback);
      return TilePressFeedback;
    }(cc.Component);
    exports.default = TilePressFeedback;
    cc._RF.pop();
  }, {
    "../../core/EventBus": "EventBus",
    "../../core/events/EventNames": "EventNames",
    "./GameBoardController": "GameBoardController"
  } ],
  TileView: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f64cbOz1uhCzqL1mzn9dWh6", "TileView");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var Tile_1 = require("../../core/board/Tile");
    var TileAppearanceConfig_1 = require("../../core/board/TileAppearanceConfig");
    var VfxInstance_1 = require("../../core/fx/VfxInstance");
    var TileView = function(_super) {
      __extends(TileView, _super);
      function TileView() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.visualRoot = null;
        _this.normalVariants = [];
        _this.superVariants = new Array(Tile_1.TileKind.SuperClear + 1).fill(null);
        _this.currentVisual = null;
        _this.activateFx = null;
        _this.boardPos = cc.v2(0, 0);
        _this.isFalling = false;
        _this.isFeedbackActive = false;
        return _this;
      }
      TileView.prototype.isInteractive = function() {
        return !this.isFalling && !this.isFeedbackActive;
      };
      TileView.prototype.startFall = function() {
        this.isFalling = true;
      };
      TileView.prototype.endFall = function() {
        this.isFalling = false;
      };
      TileView.prototype.apply = function(tile) {
        this.tile = tile;
        var prefab;
        if (tile.kind === Tile_1.TileKind.Normal) {
          var idx = this.colorIndex(tile.color);
          prefab = this.normalVariants[idx];
        } else prefab = this.superVariants[tile.kind];
        if (!prefab) return;
        if (this.currentVisual) {
          var maybe = this.currentVisual;
          "function" === typeof maybe.destroy && maybe.destroy();
          this.currentVisual = null;
        }
        var node = cc.instantiate(prefab);
        node.parent = this.visualRoot;
        this.currentVisual = node;
        var cfg = node.getComponent(TileAppearanceConfig_1.TileAppearanceConfig);
        if (cfg) {
          this.activateFx = cfg.activateFx;
          if (cfg.spawnFx) {
            var fx = cc.instantiate(cfg.spawnFx);
            fx.parent = this.node;
          }
        } else this.activateFx = null;
      };
      TileView.prototype.activateSuper = function() {
        var _a, _b;
        if (this.activateFx) {
          var fx = cc.instantiate(this.activateFx);
          var parent = this.node.parent || (null === (_b = (_a = cc.director).getScene) || void 0 === _b ? void 0 : _b.call(_a));
          fx.parent = parent || this.node;
          fx.setPosition(this.node.position);
          var instance = fx.getComponent(VfxInstance_1.VfxInstance);
          null === instance || void 0 === instance ? void 0 : instance.play();
          this.activateFx = null;
        }
      };
      TileView.prototype.pressFeedback = function() {
        var _this = this;
        this.isFeedbackActive = true;
        var target = this.node;
        var defaultAnchor = cc.v2(0, 1);
        var maybe = target;
        "function" === typeof maybe.stopAllActions && maybe.stopAllActions();
        "function" === typeof maybe.setScale && maybe.setScale(1, 1);
        target.runAction(cc.sequence(cc.scaleTo(.08, .9), cc.scaleTo(.1, 1), cc.callFunc(function() {
          target.setAnchorPoint(defaultAnchor);
          _this.isFeedbackActive = false;
        })));
      };
      TileView.prototype.colorIndex = function(color) {
        var order = [ "red", "blue", "green", "yellow", "purple" ];
        var idx = order.indexOf(color);
        return idx >= 0 ? idx : 0;
      };
      __decorate([ property(cc.Node) ], TileView.prototype, "visualRoot", void 0);
      __decorate([ property([ cc.Prefab ]) ], TileView.prototype, "normalVariants", void 0);
      __decorate([ property([ cc.Prefab ]) ], TileView.prototype, "superVariants", void 0);
      TileView = __decorate([ ccclass() ], TileView);
      return TileView;
    }(cc.Component);
    exports.default = TileView;
    cc._RF.pop();
  }, {
    "../../core/board/Tile": "Tile",
    "../../core/board/TileAppearanceConfig": "TileAppearanceConfig",
    "../../core/fx/VfxInstance": "VfxInstance"
  } ],
  Tile: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b5273++SK1LM4vVsPKHf4iV", "Tile");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TileFactory = exports.TileKind = void 0;
    var TileKind;
    (function(TileKind) {
      TileKind[TileKind["Normal"] = 0] = "Normal";
      TileKind[TileKind["SuperRow"] = 1] = "SuperRow";
      TileKind[TileKind["SuperCol"] = 2] = "SuperCol";
      TileKind[TileKind["SuperBomb"] = 3] = "SuperBomb";
      TileKind[TileKind["SuperClear"] = 4] = "SuperClear";
    })(TileKind = exports.TileKind || (exports.TileKind = {}));
    var TileFactory = function() {
      function TileFactory() {}
      TileFactory.createNormal = function(color) {
        return {
          id: ++this.nextId,
          color: color,
          kind: TileKind.Normal
        };
      };
      TileFactory.nextId = 0;
      return TileFactory;
    }();
    exports.TileFactory = TileFactory;
    cc._RF.pop();
  }, {} ],
  TurnManager: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "125beq1e39JB45DTs/MtfFN", "TurnManager");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TurnManager = void 0;
    var EventNames_1 = require("../events/EventNames");
    var TurnManager = function() {
      function TurnManager(initialTurns, bus) {
        this.bus = bus;
        this.initialTurns = initialTurns;
        this.turnsLeft = initialTurns;
      }
      TurnManager.prototype.useTurn = function() {
        this.turnsLeft--;
        this.bus.emit(EventNames_1.EventNames.TurnUsed, this.turnsLeft);
        0 === this.turnsLeft && this.bus.emit(EventNames_1.EventNames.OutOfTurns);
      };
      TurnManager.prototype.getRemaining = function() {
        return this.turnsLeft;
      };
      TurnManager.prototype.reset = function() {
        this.turnsLeft = this.initialTurns;
      };
      return TurnManager;
    }();
    exports.TurnManager = TurnManager;
    cc._RF.pop();
  }, {
    "../events/EventNames": "EventNames"
  } ],
  VfxInstance: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "62f57N9ZNRJvaWMUD1Dx3rM", "VfxInstance");
    "use strict";
    var __extends = this && this.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {
          __proto__: []
        } instanceof Array && function(d, b) {
          d.__proto__ = b;
        } || function(d, b) {
          for (var p in b) Object.prototype.hasOwnProperty.call(b, p) && (d[p] = b[p]);
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    var __decorate = this && this.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : null === desc ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if ("object" === typeof Reflect && "function" === typeof Reflect.decorate) r = Reflect.decorate(decorators, target, key, desc); else for (var i = decorators.length - 1; i >= 0; i--) (d = decorators[i]) && (r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r);
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VfxInstance = void 0;
    var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
    var VfxInstance = function(_super) {
      __extends(VfxInstance, _super);
      function VfxInstance() {
        var _this = null !== _super && _super.apply(this, arguments) || this;
        _this.particleSystems = [];
        _this.animations = [];
        _this.extras = [];
        return _this;
      }
      VfxInstance.prototype.play = function() {
        var _this = this;
        var promises = [];
        var _loop_1 = function(ps) {
          if (!ps) return "continue";
          ps.autoRemoveOnFinish = false;
          promises.push(new Promise(function(resolve) {
            var target = "function" === typeof ps.once ? ps : ps.node;
            target.once("finished", resolve);
            ps.resetSystem();
          }));
        };
        for (var _i = 0, _a = this.particleSystems; _i < _a.length; _i++) {
          var ps = _a[_i];
          _loop_1(ps);
        }
        var _loop_2 = function(anim) {
          if (!anim) return "continue";
          promises.push(new Promise(function(resolve) {
            anim.once("finished", resolve);
            anim.play();
          }));
        };
        for (var _b = 0, _c = this.animations; _b < _c.length; _b++) {
          var anim = _c[_b];
          _loop_2(anim);
        }
        var _loop_3 = function(extra) {
          if (!extra) return "continue";
          var anyExtra = extra;
          if ("function" === typeof anyExtra.play) {
            var result = anyExtra.play();
            promises.push(Promise.resolve(result));
          } else "function" === typeof anyExtra.once && promises.push(new Promise(function(resolve) {
            anyExtra.once("finished", resolve);
          }));
        };
        for (var _d = 0, _e = this.extras; _d < _e.length; _d++) {
          var extra = _e[_d];
          _loop_3(extra);
        }
        if (0 === promises.length) {
          this.node.destroy();
          return Promise.resolve();
        }
        return Promise.all(promises).then(function() {
          _this.node.destroy();
        });
      };
      __decorate([ property([ cc.ParticleSystem ]) ], VfxInstance.prototype, "particleSystems", void 0);
      __decorate([ property([ cc.Animation ]) ], VfxInstance.prototype, "animations", void 0);
      __decorate([ property([ cc.Component ]) ], VfxInstance.prototype, "extras", void 0);
      VfxInstance = __decorate([ ccclass() ], VfxInstance);
      return VfxInstance;
    }(cc.Component);
    exports.VfxInstance = VfxInstance;
    exports.default = VfxInstance;
    cc._RF.pop();
  }, {} ],
  "use_v2.0.x_cc.Toggle_event": [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "9751fm6BYRDJ7wDFTEkj/mF", "use_v2.0.x_cc.Toggle_event");
    "use strict";
    cc.Toggle && (cc.Toggle._triggerEventInScript_check = true);
    cc._RF.pop();
  }, {} ]
}, {}, [ "use_v2.0.x_cc.Toggle_event", "GameScene", "ConfigLoader", "ShockwaveConfig", "EventBus", "Board", "BoardGenerator", "BoardSolver", "MoveExecutor", "ShuffleService", "Tile", "TileAppearanceConfig", "BombCommand", "FallCommand", "FillCommand", "ICommand", "RemoveCommand", "SwapCommand", "Booster", "BoosterRegistry", "BoosterService", "BoosterSetup", "SuperTileBooster", "SuperTileFactory", "TeleportBooster", "MoveSequenceLogger", "EventNames", "FXController", "RocketVfxController", "SoundController", "VfxInstance", "GameStateMachine", "ScoreStrategy", "ScoreStrategyQuadratic", "TurnManager", "ExtendedEventTarget", "InfrastructureEventBus", "SafeAreaAdjuster", "BoosterPanelController", "BoosterSelectAnimationController", "BoosterSelectPopup", "FillController", "GameBoardController", "GameResultPopupController", "GameStateController", "HudController", "MoveFlowController", "MoveSequenceBadge", "TileInputController", "TilePressFeedback", "BoosterSelectionService", "FallAnimator", "PositionUtils", "SpriteHighlight", "TileView" ]);
//# sourceMappingURL=index.js.map
