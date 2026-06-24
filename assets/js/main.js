/* ============================================================
   main.js — nav, product explorer tabs, reveal + count-up, form
   ============================================================ */
(function () {
  'use strict';

  /* ---- Current year in footer ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav: mobile toggle + transparent→solid on scroll ---- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Product explorer tabs ---- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = document.querySelectorAll('.panel');
  var visuals = document.querySelectorAll('.vis');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === key); });
        visuals.forEach(function (v) { v.hidden = !v.classList.contains('vis--' + key); });
      });
    });
  }

  /* ---- Pricing calculator (graduated per-site-study) ---- */
  var calcNum = document.getElementById('ss-count');
  var calcRange = document.getElementById('ss-range');
  var calcTotal = document.getElementById('calc-total');
  var calcEff = document.getElementById('calc-eff');
  if (calcNum && calcTotal) {
    // [upTo, marginal rate per site-study]
    var BANDS = [[5, 2500], [20, 1500], [50, 1100]];
    var MAXB = 50;
    function ssCost(n) {
      var total = 0, prev = 0;
      for (var i = 0; i < BANDS.length; i++) {
        var cap = BANDS[i][0], rate = BANDS[i][1];
        if (n > prev) { total += (Math.min(n, cap) - prev) * rate; prev = cap; }
      }
      return total;
    }
    function money(x) { return '$' + x.toLocaleString('en-US'); }
    function calcUpdate(n) {
      n = Math.max(1, Math.floor(n || 1));
      if (n > MAXB) {
        calcTotal.innerHTML = 'Custom';
        if (calcEff) calcEff.textContent = '50+ site-studies — volume pricing';
        return;
      }
      var c = ssCost(n);
      calcTotal.innerHTML = money(c) + '<span>/yr</span>';
      if (calcEff) calcEff.textContent = '≈ ' + money(Math.round(c / n)) + ' / site-study';
    }
    if (calcRange) calcRange.addEventListener('input', function () { calcNum.value = calcRange.value; calcUpdate(+calcRange.value); });
    calcNum.addEventListener('input', function () { var v = +calcNum.value; if (calcRange && v >= 1 && v <= MAXB) calcRange.value = v; calcUpdate(v); });
    calcUpdate(+calcNum.value);
  }

  /* ---- Reveal on scroll + count-up stats ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce || target === 0) { el.textContent = target + suffix; return; }
    var start = null, dur = 900;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('.stat__num[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('.stat__num[data-count]').forEach(countUp);
  }

  /* ---- Contact form ---- */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = form.querySelector('.form__status');

  var validators = {
    name: function (v) { return v.trim().length >= 2 || 'Please enter your name.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email.'; },
    message: function (v) { return v.trim().length >= 10 || 'Please add a little more detail (10+ characters).'; }
  };

  function setError(name, msg) {
    var input = form.elements[name];
    var errEl = form.querySelector('.field__error[data-for="' + name + '"]');
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (errEl) errEl.textContent = msg || '';
  }

  function validateField(name) {
    var input = form.elements[name];
    if (!input || !validators[name]) return true;
    var result = validators[name](input.value);
    setError(name, result === true ? '' : result);
    return result === true;
  }

  Object.keys(validators).forEach(function (name) {
    var input = form.elements[name];
    if (input) input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.remove('is-ok', 'is-err');
    if (kind) statusEl.classList.add(kind);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setStatus('');

    var valid = true, firstBad = null;
    Object.keys(validators).forEach(function (name) {
      if (!validateField(name)) { valid = false; firstBad = firstBad || form.elements[name]; }
    });
    if (!valid) { if (firstBad) firstBad.focus(); return; }

    var key = form.elements['access_key'] ? form.elements['access_key'].value : '';
    if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      setStatus('Form not configured yet — add your Web3Forms access key in index.html.', 'is-err');
      return;
    }

    form.classList.add('is-sending');

    try {
      var res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      var data = await res.json().catch(function () { return {}; });

      if (res.ok && data.success) {
        form.reset();
        Object.keys(validators).forEach(function (n) { setError(n, ''); });
        setStatus('Thanks! Your request is in — we’ll be in touch within one business day.', 'is-ok');
      } else {
        setStatus((data && data.message) || 'Something went wrong. Please try again or email us directly.', 'is-err');
      }
    } catch (err) {
      setStatus('Network error. Please check your connection and try again.', 'is-err');
    } finally {
      form.classList.remove('is-sending');
    }
  });
})();
