/* Jalali <-> Gregorian conversion (Borkowski algorithm, as in jalaali-js). No dependencies. */
(function (root) {
  'use strict';

  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635,
                2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }

  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error('Invalid Jalali year ' + jy);
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (withoutLeap) return { gy: gy, march: march };
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }

  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }

  function d2g(jdn) {
    var j = 4 * jdn + 139361631, i, gd, gm, gy;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = div(mod(j, 1461), 4) * 5 + 308;
    gd = div(mod(i, 153), 5) + 1;
    gm = mod(div(i, 153), 12) + 1;
    gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  function j2d(jy, jm, jd) {
    var r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy), k = jdn - g2d(gy, 3, r.march);
    if (k >= 0) {
      if (k <= 185) return { jy: jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    return { jy: jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
  }

  /* ---- public helpers ---------------------------------------------- */

  function toJalali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
  function isLeap(jy) { return jalCal(jy).leap === 0; }
  function monthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeap(jy) ? 30 : 29;
  }
  function isValid(jy, jm, jd) {
    return jy >= -61 && jy <= 3176 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= monthLength(jy, jm);
  }
  function validGregorian(y, m, d) {
    var dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function weekday(gy, gm, gd) { return new Date(gy, gm - 1, gd).getDay(); } // 0 = Sunday

  function toLatinDigits(s) {
    return String(s).replace(/[\u06F0-\u06F9\u0660-\u0669]/g, function (c) {
      var code = c.charCodeAt(0);
      return String(code >= 0x06F0 ? code - 0x06F0 : code - 0x0660);
    });
  }
  function toPersianDigits(s) {
    return String(s).replace(/[0-9]/g, function (c) { return String.fromCharCode(0x06F0 + Number(c)); });
  }

  function toIso(gy, gm, gd) { return gy + '-' + pad2(gm) + '-' + pad2(gd); }

  // '2025-03-21' -> '1404/01/01'
  function formatIso(iso, persian) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return '';
    try {
      var j = toJalali(+m[1], +m[2], +m[3]);
      var out = j.jy + '/' + pad2(j.jm) + '/' + pad2(j.jd);
      return persian ? toPersianDigits(out) : out;
    } catch (e) {
      return iso;
    }
  }

  // User text -> {gy, gm, gd} or null. Year >= 1700 is taken as Gregorian, otherwise Jalali.
  function parseInput(str) {
    var s = toLatinDigits(String(str || '')).replace(/^\s+|\s+$/g, '');
    var m = /^(\d{3,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(s);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (y >= 1700) return validGregorian(y, mo, d) ? { gy: y, gm: mo, gd: d } : null;
    return isValid(y, mo, d) ? toGregorian(y, mo, d) : null;
  }

  function today() {
    var n = new Date();
    return toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }

  var api = {
    toJalali: toJalali, toGregorian: toGregorian, isLeap: isLeap, monthLength: monthLength,
    isValid: isValid, weekday: weekday, toIso: toIso, formatIso: formatIso, parseInput: parseInput,
    today: today, toLatinDigits: toLatinDigits, toPersianDigits: toPersianDigits
  };
  root.Jalali = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
