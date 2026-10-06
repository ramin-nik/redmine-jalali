/*
 * Redmine glue: every <input type="date"> keeps its Gregorian ISO value (so form
 * posts, validations and Redmine's own JS are untouched). A text input showing the
 * Jalali date is placed next to it and the original is visually hidden.
 */
(function () {
  'use strict';

  var SELECTOR = 'input[type="date"]:not([data-jalali])';
  var J, cfg;

  function parseJSON(s, fallback) {
    try { var v = JSON.parse(s); return v || fallback; } catch (e) { return fallback; }
  }
  function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }
  function jalaliOf(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return null;
    try { return J.toJalali(+m[1], +m[2], +m[3]); } catch (e) { return null; }
  }

  function enhance(src) {
    if (src.getAttribute('data-jalali')) return;
    src.setAttribute('data-jalali', '1');

    // Drop a jQuery UI datepicker if Redmine already attached one.
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.datepicker && src.classList.contains('hasDatepicker')) {
      try { window.jQuery(src).datepicker('destroy'); } catch (e) { /* ignore */ }
    }

    var vis = document.createElement('input');
    vis.type = 'text';
    vis.className = 'jalali-date';
    vis.size = 11;
    vis.autocomplete = 'off';
    vis.setAttribute('dir', 'ltr');
    vis.setAttribute('data-jalali-view', '1');
    vis.placeholder = cfg.persianDigits ? J.toPersianDigits('1404/01/01') : '1404/01/01';
    if (src.title) vis.title = src.title;
    if (src.required) vis.required = true;

    src.classList.add('jalali-source');
    src.tabIndex = -1;
    src.parentNode.insertBefore(vis, src.nextSibling);

    // Mirror visibility / disabled state that Redmine's JS toggles on the original.
    function syncState() {
      vis.style.display = src.style.display === 'none' || src.hidden ? 'none' : '';
      vis.disabled = src.disabled;
    }
    syncState();
    new MutationObserver(syncState).observe(src, { attributes: true, attributeFilter: ['style', 'disabled', 'hidden', 'class'] });

    function display() {
      vis.value = J.formatIso(src.value, cfg.persianDigits);
      vis.classList.remove('jalali-invalid');
    }
    function setIso(iso) {
      var changed = src.value !== iso;
      src.value = iso;
      display();
      if (changed) fire(src, 'change');
    }
    // returns false when the typed text is not a valid date
    function commit() {
      var txt = vis.value.replace(/^\s+|\s+$/g, '');
      if (txt === '') { setIso(''); return true; }
      var g = J.parseInput(txt);
      if (!g) { vis.classList.add('jalali-invalid'); return false; }
      setIso(J.toIso(g.gy, g.gm, g.gd));
      return true;
    }
    function openPicker() {
      window.JalaliDatePicker.open(vis, {
        value: jalaliOf(src.value),
        weekStart: cfg.weekStart, months: cfg.months, days: cfg.days, labels: cfg.labels,
        rtl: cfg.rtl, persianDigits: cfg.persianDigits,
        onPick: function (g) { setIso(J.toIso(g.gy, g.gm, g.gd)); },
        onClear: function () { setIso(''); }
      });
    }

    display();
    vis.addEventListener('focus', function () { display(); openPicker(); });
    vis.addEventListener('click', openPicker);
    vis.addEventListener('change', commit);
    vis.addEventListener('blur', function () { if (commit() === false) display(); });
    vis.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { commit(); window.JalaliDatePicker.close(); }
    });
    // Programmatic updates of the original (jQuery .trigger('change') etc.)
    src.addEventListener('change', display);
    // Label clicks focus the original; forward to the visible input.
    src.addEventListener('focus', function () { vis.focus(); });
  }

  function enhanceAll(root) {
    var list = root.querySelectorAll ? root.querySelectorAll(SELECTOR) : [];
    for (var i = 0; i < list.length; i++) enhance(list[i]);
  }

  function init() {
    var meta = document.querySelector('meta[name="redmine-jalali"]');
    J = window.Jalali;
    if (!meta || !J || !window.JalaliDatePicker) return;
    var d = meta.dataset;
    cfg = {
      weekStart: parseInt(d.weekStart, 10) || 0,
      persianDigits: d.persianDigits === '1',
      rtl: d.rtl === '1',
      months: parseJSON(d.months, []),
      days: parseJSON(d.days, []),
      labels: parseJSON(d.labels, { today: 'Today', clear: 'Clear' })
    };
    if (cfg.months.length !== 12 || cfg.days.length !== 7) return;

    enhanceAll(document);

    // Redmine adds date inputs dynamically (query filters, modals, issue form refresh).
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        for (var i = 0; i < m.addedNodes.length; i++) {
          var n = m.addedNodes[i];
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches(SELECTOR)) enhance(n);
          enhanceAll(n);
        }
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
