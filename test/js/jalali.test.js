'use strict';
// Run with: node --test test/js/
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const J = require(path.join(__dirname, '..', '..', 'assets', 'javascripts', 'jalali.js'));
const { dates } = require(path.join(__dirname, '..', 'fixtures', 'known_dates.json'));

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

test('known dates convert both ways', () => {
  for (const [g, jy, jm, jd] of dates) {
    const [gy, gm, gd] = g.split('-').map(Number);
    assert.deepEqual(J.toJalali(gy, gm, gd), { jy, jm, jd }, g);
    const back = J.toGregorian(jy, jm, jd);
    assert.equal(iso(back.gy, back.gm, back.gd), g, `${jy}/${jm}/${jd}`);
  }
});

test('every day from 1900 to 2200 round-trips', () => {
  for (let t = Date.UTC(1900, 0, 1); t <= Date.UTC(2200, 11, 31); t += 864e5) {
    const d = new Date(t);
    const j = J.toJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    const g = J.toGregorian(j.jy, j.jm, j.jd);
    assert.equal(iso(g.gy, g.gm, g.gd), d.toISOString().slice(0, 10));
  }
});

test('leap years and month lengths', () => {
  assert.ok(J.isLeap(1399));
  assert.ok(J.isLeap(1403));
  assert.ok(!J.isLeap(1404));
  assert.equal(J.monthLength(1404, 1), 31);
  assert.equal(J.monthLength(1404, 7), 30);
  assert.equal(J.monthLength(1403, 12), 30);
  assert.equal(J.monthLength(1404, 12), 29);
  assert.ok(J.isValid(1403, 12, 30));
  assert.ok(!J.isValid(1404, 12, 30));
  assert.ok(!J.isValid(1404, 13, 1));
});

test('parseInput reads Jalali, Gregorian and Persian digits', () => {
  const g = s => { const r = J.parseInput(s); return r && iso(r.gy, r.gm, r.gd); };
  assert.equal(g('1404/01/01'), '2025-03-21');
  assert.equal(g('1404-1-1'), '2025-03-21');
  assert.equal(g('1404.01.01'), '2025-03-21');
  assert.equal(g('۱۴۰۴/۰۱/۰۱'), '2025-03-21');
  assert.equal(g('١٤٠٤/٠١/٠١'), '2025-03-21');
  assert.equal(g(' 1403/12/30 '), '2025-03-20');
  assert.equal(g('2025-03-21'), '2025-03-21'); // years >= 1700 are Gregorian
  assert.equal(J.parseInput('1404/12/30'), null);
  assert.equal(J.parseInput('2025-02-30'), null);
  assert.equal(J.parseInput('1404/01'), null);
  assert.equal(J.parseInput(''), null);
});

test('formatIso and digit helpers', () => {
  assert.equal(J.formatIso('2025-03-21'), '1404/01/01');
  assert.equal(J.formatIso('2025-03-21', true), '۱۴۰۴/۰۱/۰۱');
  assert.equal(J.formatIso(''), '');
  assert.equal(J.toIso(2025, 3, 1), '2025-03-01');
  assert.equal(J.toLatinDigits('۱۴۰۴/٠١'), '1404/01');
});
