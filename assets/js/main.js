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

/* ============================================================
   Hero carousel — auto-rotating product shots
   ============================================================ */
(function () {
  'use strict';
  var car = document.getElementById('heroCarousel');
  var dotWrap = document.getElementById('heroDots');
  if (!car || !dotWrap) return;
  var slides = [].slice.call(car.querySelectorAll('.hero__slide'));
  var dots = [].slice.call(dotWrap.querySelectorAll('.hero__dot'));
  if (slides.length < 2) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0, timer = null, DWELL = 3600;

  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
  }
  function next() { show(i + 1); }
  function start() { if (reduce) return; stop(); timer = setInterval(next, DWELL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  dots.forEach(function (d, k) {
    d.addEventListener('click', function () { show(k); start(); });
  });
  // pause while the tab is hidden so it doesn't desync
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
  start();
})();

/* ============================================================
   Training loop — self-playing product walkthrough
   (a cursor clicks the real controls in each screen; each
    click drives the next step). Starts when scrolled into view.
   ============================================================ */
(function () {
  'use strict';
  var steps   = [].slice.call(document.querySelectorAll('.loop__step'));
  var scenes  = [].slice.call(document.querySelectorAll('.scene'));
  var fill    = document.getElementById('loopFill');
  var stage   = document.getElementById('loopStage');
  var cursor  = document.getElementById('loopCursor');
  if (!stage || !scenes.length) return;
  var N = scenes.length, idx = 0, token = 0, paused = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PACE = 1.4; // global dwell multiplier — higher = longer on each screen
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  // cancellable wait: rejects if the run token changed (scene jumped / paused).
  function wait(my, ms) { return sleep(ms * PACE).then(function () { if (my !== token) throw 'x'; }); }

  function railState(i) {
    steps.forEach(function (s, k) {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-done', k < i);
      s.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    fill.style.width = ((i + 1) / N * 100) + '%';
  }
  function activePanel() { return scenes[idx]; }
  // The scene is position:absolute/inset:0, so its own offsetHeight is bounded to
  // the stage (circular) and can't drive growth. Measure the natural height of its
  // content columns instead, so the stage grows to fit taller screens (e.g. Assign)
  // and the mockup never overflows upward into the step rail.
  function setHeight() {
    var p = activePanel();
    var mock = p.querySelector('.mockup');
    var cap = p.querySelector('.loop__caption');
    var h = Math.max(mock ? mock.offsetHeight : 0, cap ? cap.offsetHeight : 0);
    stage.style.height = h + 'px';
  }

  // place cursor over the center of a selector (or element) inside the active scene
  function cursorTo(sel, instant) {
    var tgt = (typeof sel === 'string') ? activePanel().querySelector(sel) : sel;
    if (!tgt) return;
    var sr = stage.getBoundingClientRect(), tr = tgt.getBoundingClientRect();
    var x = tr.left - sr.left + tr.width / 2 - 4;
    var y = tr.top - sr.top + tr.height / 2 - 2;
    cursor.style.setProperty('--cx', x + 'px');
    cursor.style.setProperty('--cy', y + 'px');
    if (instant) {
      cursor.classList.add('no-anim');
      cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      void cursor.offsetWidth; // force reflow so the next move animates
      cursor.classList.remove('no-anim');
    } else {
      cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
  }
  function press(sel) {
    var tgt = (typeof sel === 'string') ? activePanel().querySelector(sel) : sel;
    if (!tgt) return;
    cursor.classList.add('is-click');
    tgt.classList.add('is-press');
    setTimeout(function () { cursor.classList.remove('is-click'); tgt.classList.remove('is-press'); }, 200);
  }

  // reset each scene to its "before" state so the choreography can play forward
  // order matches the DOM: create, editor, assign, sign, dashboard, audit
  var resets = [
    function (s) { // create / source
      s.querySelectorAll('[data-src]').forEach(function (c) { c.classList.remove('on'); });
      s.querySelector('[data-syncmsg]').classList.remove('in');
      s.querySelector('.src__next').classList.remove('ready');
    },
    function (s) { // editor
      s.querySelector('#edSave').classList.remove('saved');
      var st = s.querySelectorAll('.ed-step');
      st[0].className = 'ed-step cur'; st[1].className = 'ed-step'; st[2].className = 'ed-step'; st[3].className = 'ed-step';
      s.querySelector('[data-cmt]').classList.remove('resolved');
      s.querySelector('[data-mark]').classList.remove('edited');
      s.querySelector('[data-temp]').textContent = '−80 °C';
      s.querySelector('[data-disc]').textContent = '2';
    },
    function (s) { // assign
      s.querySelector('#asgDD').classList.remove('open');
      s.querySelector('#asgDD .asg__dd-cur').innerHTML = '<span class="asg__dd-ph">Select a study…</span>';
      s.querySelectorAll('.asg__dd-opt').forEach(function (o) { o.classList.remove('sel'); });
      s.querySelectorAll('[data-site]').forEach(function (c) { c.classList.add('is-off'); c.classList.remove('on'); });
      s.querySelector('.site-card:not([data-site])').classList.add('is-off');
      s.querySelectorAll('[data-role]').forEach(function (c) { c.classList.remove('on'); });
      s.querySelectorAll('[data-due]').forEach(function (d) { d.classList.remove('on'); });
      s.querySelector('[data-due-date]').classList.remove('in');
      s.querySelectorAll('.asg__row').forEach(function (r) { r.classList.remove('in'); });
      s.querySelector('[data-more]').classList.remove('in');
      s.querySelector('[data-empty]').style.display = '';
      var c = s.querySelector('#asgCount'); c.dataset.v = '0'; c.firstChild.textContent = '0';
    },
    function (s) { // sign
      s.querySelectorAll('[data-pin]').forEach(function (p) { p.classList.remove('filled'); p.textContent = '·'; });
      s.querySelector('#signCard').classList.remove('is-signed');
      s.querySelector('.sg-act').classList.remove('done');
      s.querySelector('.sg-act').textContent = 'Sign & complete';
    },
    function (s) { // readiness dashboard
      s.querySelector('#dashDonut').style.setProperty('--p', '0%');
      s.querySelector('[data-donut]').textContent = '0%';
      s.querySelectorAll('[data-stat]').forEach(function (b) { b.textContent = '0'; });
      s.querySelectorAll('[data-fill]').forEach(function (f) { f.style.width = '0'; });
      s.querySelectorAll('[data-pct]').forEach(function (p) { p.textContent = '0%'; });
      s.querySelectorAll('[data-dbar]').forEach(function (d) { d.classList.remove('is-risk'); d.classList.remove('is-sel'); });
      s.querySelector('[data-drill-panel]').classList.remove('in');
      s.querySelectorAll('[data-remind]').forEach(function (r) { r.classList.remove('done'); r.textContent = 'Remind'; });
    },
    function (s) { // audit
      s.querySelectorAll('[data-row]').forEach(function (r) { r.classList.remove('in'); });
      s.querySelector('#lgToast').classList.remove('in');
    }
  ];

  // per-scene choreography — each ends by clicking an in-UI control
  var plays = [
    async function (my) { // create — choose a source
      var P = activePanel();
      var pick = P.querySelector('[data-src][data-pick]'); // Sync from SharePoint
      await wait(my, 550); cursorTo(pick);
      await wait(my, 650); press(pick); pick.classList.add('on');
      await wait(my, 450); P.querySelector('[data-syncmsg]').classList.add('in');
      await wait(my, 700); P.querySelector('.src__next').classList.add('ready');
      await wait(my, 480); cursorTo('[data-target]');
      await wait(my, 760); press('[data-target]');
      await wait(my, 650);
    },
    async function (my) { // editor
      var P = activePanel();
      // 1. address the reviewer's comment — accept the −70 °C correction
      await wait(my, 600); cursorTo('[data-resolve]');
      await wait(my, 700); press('[data-resolve]');
      P.querySelector('[data-cmt]').classList.add('resolved');
      P.querySelector('[data-temp]').textContent = '−70 °C';
      P.querySelector('[data-mark]').classList.add('edited');
      P.querySelector('[data-disc]').textContent = '1';
      // 2. the edit autosaves
      await wait(my, 700); document.getElementById('edSave').classList.add('saved');
      // 3. submit for approval — status advances
      await wait(my, 650); cursorTo('[data-target]');
      await wait(my, 820); press('[data-target]');
      var st = P.querySelectorAll('.ed-step');
      await wait(my, 240); st[0].className = 'ed-step done'; st[1].className = 'ed-step cur';
      await wait(my, 700);
    },
    async function (my) { // assign
      var P = activePanel();
      var count = P.querySelector('#asgCount');
      var setCount = function (n) { count.firstChild.textContent = String(n); };
      var tween = async function (from, to) {
        for (var i = 1; i <= 12; i++) { setCount(Math.round(from + (to - from) * i / 12)); await wait(my, 20); }
      };
      var total = 0;

      // 1. open the study dropdown
      await wait(my, 450); cursorTo('#asgDD .asg__dd-cur');
      await wait(my, 600); press('#asgDD .asg__dd-cur'); P.querySelector('#asgDD').classList.add('open');
      // 2. pick a study
      var opt = P.querySelector('.asg__dd-opt[data-study="PROTEUS-2"]');
      await wait(my, 620); cursorTo(opt);
      await wait(my, 520); press(opt); opt.classList.add('sel');
      await wait(my, 240);
      P.querySelector('#asgDD .asg__dd-cur').innerHTML = '<b>PROTEUS-2</b> <small>Phase III · 6 sites</small>';
      P.querySelector('#asgDD').classList.remove('open');
      P.querySelectorAll('.site-card').forEach(function (c) { c.classList.remove('is-off'); });

      // 3. select specific sites
      var sites = P.querySelectorAll('[data-site]');
      for (var s = 0; s < sites.length; s++) {
        await wait(my, 340); cursorTo(sites[s].querySelector('.chk'));
        await wait(my, 340); press(sites[s]);
        sites[s].classList.add('on'); sites[s].querySelector('.chk').classList.add('on');
      }

      // 4. pick roles — people resolve live into the right panel
      P.querySelector('[data-empty]').style.display = 'none';
      var roles = P.querySelectorAll('[data-role]');
      for (var r = 0; r < roles.length; r++) {
        await wait(my, 360); cursorTo(roles[r]);
        await wait(my, 360); press(roles[r]); roles[r].classList.add('on');
        var rws = P.querySelectorAll('.asg__row[data-when="' + r + '"]');
        for (var w = 0; w < rws.length; w++) { rws[w].classList.add('in'); await wait(my, 150); }
        var add = parseInt(roles[r].getAttribute('data-add'), 10);
        await tween(total, total + add); total += add;
      }
      await wait(my, 220); P.querySelector('[data-more]').classList.add('in');

      // 4b. set a due date
      var duePick = P.querySelector('[data-due-pick]');
      await wait(my, 420); cursorTo(duePick);
      await wait(my, 460); press(duePick); duePick.classList.add('on');
      await wait(my, 260); P.querySelector('[data-due-date]').classList.add('in');

      // 5. add an individual one-off
      await wait(my, 500); cursorTo('[data-addbtn]');
      await wait(my, 540); press('[data-addbtn]');
      await wait(my, 300); P.querySelector('[data-oneoff]').classList.add('in');
      await tween(total, total + 1); total += 1;

      // 6. save
      await wait(my, 540); cursorTo('[data-target]');
      await wait(my, 760); press('[data-target]');
      await wait(my, 650);
    },
    async function (my) { // sign
      var pins = activePanel().querySelectorAll('[data-pin]');
      await wait(my, 450);
      for (var i = 0; i < pins.length; i++) { pins[i].classList.add('filled'); pins[i].textContent = '•'; await wait(my, 200); }
      await wait(my, 350); cursorTo('[data-target]');
      await wait(my, 850); press('[data-target]');
      var card = activePanel().querySelector('#signCard'), btn = activePanel().querySelector('.sg-act');
      await wait(my, 160); btn.classList.add('done'); btn.textContent = '✓ Signed'; card.classList.add('is-signed');
      await wait(my, 850);
    },
    async function (my) { // readiness dashboard
      var P = activePanel();
      var fills = P.querySelectorAll('[data-fill]'), pcts = P.querySelectorAll('[data-pct]');
      // grow each site's completion bar in turn
      await wait(my, 380);
      for (var i = 0; i < fills.length; i++) {
        var v = parseInt(fills[i].getAttribute('data-fill'), 10);
        fills[i].style.width = v + '%'; pcts[i].textContent = v + '%';
        await wait(my, 200);
      }
      // donut + headline stats count up
      P.querySelector('#dashDonut').style.setProperty('--p', '87%');
      var donutN = P.querySelector('[data-donut]');
      for (var k = 1; k <= 14; k++) { donutN.textContent = Math.round(87 * k / 14) + '%'; await wait(my, 22); }
      P.querySelector('[data-stat="trained"]').textContent = '38';
      P.querySelector('[data-stat="sites"]').textContent = '2';
      P.querySelector('[data-stat="risk"]').textContent = '1';
      // flag the at-risk site
      await wait(my, 200); P.querySelector('[data-dbar].warn').classList.add('is-risk');
      // drill into the at-risk site → reveal the overdue-staff table
      var boston = P.querySelector('[data-drill]');
      await wait(my, 850); cursorTo(boston.querySelector('.dbar__lab'));
      await wait(my, 620); press(boston); boston.classList.add('is-sel');
      await wait(my, 240); P.querySelector('[data-drill-panel]').classList.add('in'); setHeight();
      // send a reminder to the most-overdue person
      var firstRemind = P.querySelector('[data-remind]');
      await wait(my, 800); cursorTo(firstRemind);
      await wait(my, 600); press(firstRemind); firstRemind.classList.add('done'); firstRemind.textContent = '✓ Reminded';
      // generate the site visit report
      await wait(my, 700); cursorTo('[data-target]');
      await wait(my, 820); press('[data-target]');
      await wait(my, 800);
    },
    async function (my) { // audit
      var rows = activePanel().querySelectorAll('[data-row]');
      await wait(my, 300);
      for (var i = 0; i < rows.length; i++) { rows[i].classList.add('in'); await wait(my, 150); }
      await wait(my, 450); cursorTo('[data-target]');
      await wait(my, 850); press('[data-target]');
      await wait(my, 160); activePanel().querySelector('#lgToast').classList.add('in');
      await wait(my, 1100);
    }
  ];

  async function run() {
    var my = ++token;
    railState(idx);
    // cross-fade scenes
    scenes.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
    resets[idx](activePanel());
    cursor.style.opacity = 0;
    await sleep(60); if (my !== token) return;
    setHeight();
    if (reduce) return; // static: no cursor, no auto-advance
    // settle the cross-fade, then bring the cursor in near the mockup
    await sleep(520); if (my !== token) return;
    cursorTo('.mockup__bar span', true);
    cursor.style.opacity = 1;
    try {
      await wait(my, 200);
      await plays[idx](my);
      cursor.style.opacity = 0;
      await wait(my, 350);
    } catch (e) { return; } // jumped/paused
    if (my !== token || paused) return;
    idx = (idx + 1) % N;
    run();
  }

  function goTo(i) { idx = i; paused = false; run(); }
  steps.forEach(function (s, k) { s.addEventListener('click', function () { goTo(k); }); });
  window.addEventListener('resize', setHeight);

  // start the walkthrough only when it scrolls into view (and re-measure on reveal)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); run(); } });
    }, { threshold: 0.25 });
    io.observe(stage);
  } else {
    run();
  }
})();
