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
  function btn(cls, text, onclick, ariaLabel) {
    var b = h('button', cls, text);
    b.type = 'button';
    if (ariaLabel) b.setAttribute('aria-label', ariaLabel);
    b.addEventListener('click', onclick);
    return b;
  }
  function num(n) { return cur.cfg.persianDigits ? J.toPersianDigits(n) : String(n); }
  function label(name) { return (cur.cfg.labels && cur.cfg.labels[name]) || ''; }

  function close() {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
    popup = null;
    cur = null;
    document.removeEventListener('mousedown', onDocDown, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', close);
  }
  function onDocDown(e) {
    if (!popup) return;
    if (popup.contains(e.target) || e.target === cur.input) return;
    close();
  }
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
    sel.setAttribute('aria-label', label('month'));
    cfg.months.forEach(function (name, idx) {
      var o = h('option', null, name);
      o.value = idx + 1;
      if (idx + 1 === jm) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { cur.jm = +sel.value; render(); });
    var yr = h('input', 'jdp-year');
    yr.type = 'number'; yr.min = 1; yr.max = 3170; yr.value = jy;
    yr.setAttribute('aria-label', label('year'));
    yr.addEventListener('change', function () {
      var v = parseInt(yr.value, 10);
      if (v >= 1 && v <= 3170) cur.jy = v;
      render();
    });
    head.appendChild(btn('jdp-nav', '\u2039', function () { step(-1); }, label('previousMonth')));
    head.appendChild(sel);
    head.appendChild(yr);
    head.appendChild(btn('jdp-nav', '\u203A', function () { step(1); }, label('nextMonth')));
    popup.appendChild(head);

    var grid = h('div', 'jdp-grid');
    for (i = 0; i < 7; i++) {
      var dow = h('span', 'jdp-dow', cfg.days[(cfg.weekStart + i) % 7].charAt(0));
      dow.title = cfg.days[(cfg.weekStart + i) % 7];
      dow.setAttribute('aria-hidden', 'true'); // each day button carries its full date
      grid.appendChild(dow);
    }
    var g = J.toGregorian(jy, jm, 1);
    var offset = (J.weekday(g.gy, g.gm, g.gd) - cfg.weekStart + 7) % 7;
    for (i = 0; i < offset; i++) grid.appendChild(h('span', 'jdp-empty'));
    var len = J.monthLength(jy, jm), t = J.today(), sv = cfg.value;
    for (d = 1; d <= len; d++) {
      (function (day) {
        var cls = 'jdp-day', selected = sv && sv.jy === jy && sv.jm === jm && sv.jd === day,
            isToday = t.jy === jy && t.jm === jm && t.jd === day;
        if (selected) cls += ' jdp-selected';
        if (isToday) cls += ' jdp-today';
        var b = btn(cls, num(day), function () {
          var gg = J.toGregorian(jy, jm, day), cb = cfg.onPick;
          close();
          cb(gg);
        }, num(day) + ' ' + cfg.months[jm - 1] + ' ' + num(jy));
        if (selected) b.setAttribute('aria-pressed', 'true');
        if (isToday) b.setAttribute('aria-current', 'date');
        grid.appendChild(b);
      })(d);
    }
    popup.appendChild(grid);

    var foot = h('div', 'jdp-foot');
    foot.appendChild(btn('jdp-today-btn', cfg.labels.today, function () {
      var n = new Date(), cb = cfg.onPick;
      close();
      cb({ gy: n.getFullYear(), gm: n.getMonth() + 1, gd: n.getDate() });
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

  /* cfg: { value:{jy,jm,jd}|null, weekStart, months[12], days[7], labels:{today,clear,month,year,previousMonth,nextMonth},
          fieldLabel, rtl, persianDigits, onPick(g), onClear() } */
  function open(input, cfg) {
    close();
    var base = cfg.value || J.today();
    cur = { input: input, cfg: cfg, jy: base.jy, jm: base.jm };
    popup = h('div', 'jdp');
    popup.setAttribute('dir', cfg.rtl ? 'rtl' : 'ltr');
    popup.setAttribute('role', 'dialog');
    if (cfg.fieldLabel) popup.setAttribute('aria-label', cfg.fieldLabel);
    document.body.appendChild(popup);
    render();
    place();
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
  }

  root.JalaliDatePicker = { open: open, close: close };
})(typeof window !== 'undefined' ? window : globalThis);
