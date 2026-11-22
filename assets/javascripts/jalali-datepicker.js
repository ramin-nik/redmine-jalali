/* Small dependency-free Jalali date picker popup. */
(function (root) {
  'use strict';
  var J = root.Jalali;
  var popup = null, cur = null;

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(cls, text, onclick) {
    var b = h('button', cls, text);
    b.type = 'button';
    b.addEventListener('click', onclick);
    return b;
  }
  function num(n) { return cur.cfg.persianDigits ? J.toPersianDigits(n) : String(n); }

  // "Today" comes from the page (the Redmine user's time zone) when given, else the browser.
  function todayG() {
    var t = cur.cfg.today, n = new Date();
    return t || { gy: n.getFullYear(), gm: n.getMonth() + 1, gd: n.getDate() };
  }
  function todayJ() { var g = todayG(); return J.toJalali(g.gy, g.gm, g.gd); }

  function close() {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
    popup = null;
    cur = null;
    document.removeEventListener('mousedown', onDocDown, true);
    document.removeEventListener('focusin', onDocDown, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
  }
  // Closes on a click or keyboard focus (Tab) anywhere outside the field and the popup.
  function onDocDown(e) {
    if (!popup) return;
    if (popup.contains(e.target) || e.target === cur.input) return;
    close();
  }
  // A resize (e.g. a phone's on-screen keyboard opening) only moves the popup.
  function onResize() { if (popup) place(); }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function step(delta) {
    cur.jm += delta;
    if (cur.jm < 1) { cur.jm = 12; cur.jy -= 1; }
    if (cur.jm > 12) { cur.jm = 1; cur.jy += 1; }
    cur.jy = Math.min(3170, Math.max(1, cur.jy));
    render();
  }

  function render() {
    var cfg = cur.cfg, jy = cur.jy, jm = cur.jm, i, d;
    popup.innerHTML = '';

    var head = h('div', 'jdp-head');
    var sel = h('select', 'jdp-month');
    cfg.months.forEach(function (name, idx) {
      var o = h('option', null, name);
      o.value = idx + 1;
      if (idx + 1 === jm) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { cur.jm = +sel.value; render(); });
    var yr = h('input', 'jdp-year');
    yr.type = 'number'; yr.min = 1; yr.max = 3170; yr.value = jy;
    yr.addEventListener('change', function () {
      var v = parseInt(yr.value, 10);
      if (v >= 1 && v <= 3170) cur.jy = v;
      render();
    });
    head.appendChild(btn('jdp-nav', '\u2039', function () { step(-1); }));
    head.appendChild(sel);
    head.appendChild(yr);
    head.appendChild(btn('jdp-nav', '\u203A', function () { step(1); }));
    popup.appendChild(head);

    var grid = h('div', 'jdp-grid');
    for (i = 0; i < 7; i++) {
      grid.appendChild(h('span', 'jdp-dow', cfg.days[(cfg.weekStart + i) % 7].charAt(0)));
    }
    var g = J.toGregorian(jy, jm, 1);
    var offset = (J.weekday(g.gy, g.gm, g.gd) - cfg.weekStart + 7) % 7;
    for (i = 0; i < offset; i++) grid.appendChild(h('span', 'jdp-empty'));
    var len = J.monthLength(jy, jm), t = todayJ(), sv = cfg.value;
    for (d = 1; d <= len; d++) {
      (function (day) {
        var cls = 'jdp-day';
        if (sv && sv.jy === jy && sv.jm === jm && sv.jd === day) cls += ' jdp-selected';
        if (t.jy === jy && t.jm === jm && t.jd === day) cls += ' jdp-today';
        grid.appendChild(btn(cls, num(day), function () {
          var gg = J.toGregorian(jy, jm, day), cb = cfg.onPick;
          close();
          cb(gg);
        }));
      })(d);
    }
    popup.appendChild(grid);

    var foot = h('div', 'jdp-foot');
    foot.appendChild(btn('jdp-today-btn', cfg.labels.today, function () {
      var g = todayG(), cb = cfg.onPick;
      close();
      cb(g);
    }));
    foot.appendChild(btn('jdp-clear-btn', cfg.labels.clear, function () {
      var cb = cfg.onClear;
      close();
      cb();
    }));
    popup.appendChild(foot);
  }

  function place() {
    var r = cur.input.getBoundingClientRect();
    var sx = window.pageXOffset, sy = window.pageYOffset;
    var left = r.left + sx;
    var maxLeft = sx + document.documentElement.clientWidth - popup.offsetWidth - 8;
    if (left > maxLeft) left = Math.max(sx + 4, maxLeft);
    popup.style.left = left + 'px';
    popup.style.top = (r.bottom + sy + 2) + 'px';
  }

  /* cfg: { value:{jy,jm,jd}|null, today:{gy,gm,gd} (optional), weekStart, months[12], days[7], labels:{today,clear}, rtl, persianDigits, onPick(g), onClear() } */
  function open(input, cfg) {
    close();
    cur = { input: input, cfg: cfg };
    var base = cfg.value || todayJ();
    cur.jy = base.jy;
    cur.jm = base.jm;
    popup = h('div', 'jdp');
    popup.setAttribute('dir', cfg.rtl ? 'rtl' : 'ltr');
    document.body.appendChild(popup);
    render();
    place();
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('focusin', onDocDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
  }

  root.JalaliDatePicker = { open: open, close: close };
})(typeof window !== 'undefined' ? window : globalThis);
