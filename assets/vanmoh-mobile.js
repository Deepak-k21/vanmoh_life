/* ==========================================================================
   Vanmoh Life — mobile experience (≤720px)
   Adds screen-state classes and purely decorative layers:
   ember fiber field, glass 3D cube, HUD labels, first-load counter.
   No app logic, routes or content are changed.
   ========================================================================== */
(() => {
  const mq = window.matchMedia('(max-width: 720px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const fibers = [];   // every animated canvas (fibers + orbs), paused when hidden
  const AUTH = ['', 'home', 'sign-in', 'sign-up', 'forgot-password'];

  /* ---------- screen state -> <html> classes ---------- */
  function stateFromHash() {
    const h = location.hash.slice(1);
    if (h === 'dashboard') return 'dash';
    if (h === 'loans') return 'other';
    return AUTH.includes(h) ? 'auth' : 'auth';
  }
  function stateFromPanel() {
    const panel = document.querySelector('.panel');
    if (!panel) return stateFromHash();
    if (panel.classList.contains('is-loans')) return 'other';
    if (panel.classList.contains('is-dashboard')) return 'dash';
    return 'auth';
  }
  function apply(state) {
    root.classList.toggle('vm-m', mq.matches);
    root.classList.toggle('vm-auth', state === 'auth');
    root.classList.toggle('vm-dash', state === 'dash');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && mq.matches) {
      const dark = root.getAttribute('data-theme') === 'dark';
      meta.setAttribute('content', state === 'auth' || state === 'dash' ? '#0b0a09' : (dark ? '#0b1120' : '#ffffff'));
    }
    fibers.forEach((f) => f.sync());
  }
  apply(stateFromHash());           // before first paint (script is in <head>)
  mq.addEventListener('change', () => apply(stateFromPanel()));

  /* ---------- ember fiber field (canvas) ---------- */
  function Fibers(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, raf = 0, last = 0, t = Math.random() * 100;
    const lines = opts.lines || 46;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return;          // ~25fps is plenty for slow fibers
      last = now;
      if (!w || !h) { resize(); if (!w) return; }
      t += reduce.matches ? 0 : 0.012;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 0.7;
      for (let i = 0; i < lines; i++) {
        const k = i / lines;
        const base = h * (opts.base || 0.62) + (k - 0.5) * h * (opts.spread || 0.5);
        const amp = h * (0.08 + 0.12 * Math.sin(k * 3.1 + t * 0.7));
        const hue = 14 + k * 16;
        const alpha = 0.06 + 0.22 * Math.pow(Math.sin(k * Math.PI), 2);
        ctx.strokeStyle = `hsla(${hue}, 100%, ${48 + k * 14}%, ${alpha})`;
        ctx.beginPath();
        for (let x = -10; x <= w + 10; x += 12) {
          const p = x / w;
          const y = base
            + Math.sin(p * 3.2 + t + k * 2.4) * amp
            + Math.sin(p * 7.0 - t * 1.3 + k * 5.0) * amp * 0.25
            - Math.pow(p, 1.6) * h * 0.18;
          x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    this.sync = () => {
      const visible = mq.matches && canvas.offsetParent !== null && !document.hidden;
      if (visible && !raf) { resize(); raf = requestAnimationFrame(draw); }
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    window.addEventListener('resize', resize);
  }

  /* ---------- savings orb: a sphere of raised tiles (canvas 3D) ---------- */
  const orbs = [];
  const view = { rx: -0.32, ry: 0, spin: 0.0035, drag: null, gx: 0, gy: 0 };
  function Orb(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const tiles = [];
    const ROWS = opts.rows || 30;
    for (let r = 0; r < ROWS; r++) {
      const lat = -Math.PI / 2 + (r + 0.5) * Math.PI / ROWS;
      const n = Math.max(1, Math.round(Math.cos(lat) * ROWS * 2));
      for (let i = 0; i < n; i++) {
        const lon = (i + (r % 2 ? 0.5 : 0)) * 2 * Math.PI / n;
        tiles.push({ lat, lon, dl: Math.PI / ROWS * 0.42, dn: Math.PI / n * 0.84, seed: Math.random() });
      }
    }
    let w = 0, h = 0, raf = 0, last = 0, t = 0;
    const norm = (v) => { const m = Math.hypot(v[0], v[1], v[2]); return [v[0] / m, v[1] / m, v[2] / m]; };
    const L = norm([-0.55, -0.65, 0.75]);     // key light, upper-left front
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - last < 33) return;
      last = now;
      if (!w || !h) { resize(); if (!w) return; }
      if (!reduce.matches) { t += 0.033; if (!view.drag) view.ry += view.spin; }
      const R = Math.min(w, h) * (opts.size || 0.36);
      const cx = w * (opts.cx || 0.5), cy = h * (opts.cy || 0.5);
      const ax = view.rx + view.gy, ay = view.ry + view.gx;
      const cX = Math.cos(ax), sX = Math.sin(ax), cY = Math.cos(ay), sY = Math.sin(ay);
      const F = R * 4.2;
      const rot = (x, y, z) => {
        const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
        return [x1, y * cX - z1 * sX, y * sX + z1 * cX];
      };
      const proj = (q) => { const k = F / (F - q[2]); return [cx + q[0] * k, cy + q[1] * k]; };
      const pt = (lat, lon, rad) => rot(Math.cos(lat) * Math.sin(lon) * rad, -Math.sin(lat) * rad, Math.cos(lat) * Math.cos(lon) * rad);

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      g.addColorStop(0, 'rgba(255,110,50,0.28)'); g.addColorStop(1, 'rgba(255,90,31,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      const list = [];
      for (const tl of tiles) {
        const n = pt(tl.lat, tl.lon, 1);
        if (n[2] < -0.12) continue;
        const wave = Math.sin(tl.lat * 4 + tl.lon * 3 - t * 1.6) * 0.5 + 0.5;
        const pulse = Math.pow(wave, 6);
        list.push({ tl, n, ext: 0.035 + pulse * 0.13 + tl.seed * 0.02, pulse });
      }
      list.sort((a, b) => a.n[2] - b.n[2]);
      for (const { tl, n, ext, pulse } of list) {
        const a = tl.lat, o = tl.lon, dl = tl.dl, dn = tl.dn;
        const corners = [[a - dl, o - dn], [a - dl, o + dn], [a + dl, o + dn], [a + dl, o - dn]];
        const base = corners.map(([la, lo]) => proj(pt(la, lo, R)));
        const top = corners.map(([la, lo]) => proj(pt(la, lo, R * (1 + ext))));
        const lambert = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
        const rim = Math.pow(1 - Math.max(0, n[2]), 3);
        ctx.fillStyle = 'rgba(' + ((40 + lambert * 70) | 0) + ',' + ((12 + lambert * 22) | 0) + ',6,0.96)';
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          ctx.beginPath();
          ctx.moveTo(base[i][0], base[i][1]); ctx.lineTo(base[j][0], base[j][1]);
          ctx.lineTo(top[j][0], top[j][1]); ctx.lineTo(top[i][0], top[i][1]);
          ctx.closePath(); ctx.fill();
        }
        const gold = pulse > 0.5 && tl.seed > 0.6;
        const shade = Math.min(1, 0.12 + lambert * 0.88 + rim * 0.25);
        const mix = (c1, c2, k) => [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k];
        let col;
        if (gold) col = mix([110, 52, 6], [255, 200, 96], shade);
        else col = shade < 0.62 ? mix([58, 16, 6], [236, 92, 38], shade / 0.62) : mix([236, 92, 38], [252, 226, 208], (shade - 0.62) / 0.38);
        ctx.fillStyle = 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')';
        ctx.beginPath();
        ctx.moveTo(top[0][0], top[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1]);
        ctx.closePath(); ctx.fill();
      }
    }
    this.sync = () => {
      const visible = mq.matches && canvas.offsetParent !== null && !document.hidden;
      if (visible && !raf) { resize(); raf = requestAnimationFrame(draw); }
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    window.addEventListener('resize', resize);
  }

  function buildOrb(label, opts) {
    const wrap = document.createElement('div');
    wrap.className = 'vm-cube-wrap vm-orb-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    const rays = [18, 52, 118, 152, 205, 236, 298, 332]
      .map((a, i) => '<span class="vm-ray" style="--a:' + a + 'deg;--l:' + (60 + (i % 3) * 30) + 'px;--d:' + (i * 70) + 'ms"></span>').join('');
    wrap.innerHTML = '<span class="vm-axis vm-axis-x"></span><span class="vm-axis vm-axis-y"></span>' + rays +
      '<canvas class="vm-orb"></canvas>' +
      '<span class="vm-tag vm-tag-a">' + label[0] + '</span><span class="vm-tag vm-tag-b">' + label[1] + '</span>';
    const orb = new Orb(wrap.querySelector('canvas'), opts || {});
    orbs.push(orb); fibers.push(orb);
    return wrap;
  }

  /* ---------- first-load counter ---------- */
  function loader() {
    let seen = false;
    try { seen = sessionStorage.getItem('vm-loader') === '1'; sessionStorage.setItem('vm-loader', '1'); } catch (e) {}
    if (seen || !mq.matches || reduce.matches) return;
    const el = document.createElement('div');
    el.className = 'vm-loader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<span class="vm-loader-brand">Vanmoh<sup>®</sup></span>
      <span class="vm-loader-meta">Chit Funds · Savings · Credit</span>
      <span class="vm-loader-num">000%</span>`;
    document.body.appendChild(el);
    el.appendChild(buildOrb(['Secure', 'Vault'], { size: 0.3, cy: 0.46 }));
    orbs[orbs.length - 1].sync();
    const num = el.querySelector('.vm-loader-num');
    const start = performance.now(), dur = 1300;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(eased * 100)).padStart(3, '0') + '%';
      if (p < 1) requestAnimationFrame(tick);
      else { el.classList.add('is-done'); setTimeout(() => el.remove(), 900); }
    })(start);
  }

  /* ---------- mount ---------- */
  function mount() {
    // fixed backdrop for auth screens
    const stage = document.createElement('div');
    stage.className = 'vm-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<canvas class="vm-fibers"></canvas><span class="vm-grain"></span>' +
      '<span class="vm-hud vm-hud-tl"><i class="vm-mark"></i>Vanmoh<sup>®</sup></span>' +
      '<span class="vm-hud vm-hud-tr">Chit Funds Pvt. Ltd.</span>';
    document.body.prepend(stage);
    fibers.push(new Fibers(stage.querySelector('canvas'), { base: 0.78, spread: 0.55 }));

    // cube above the auth forms (inside the existing visual column)
    const visual = document.querySelector('.member-visual');
    if (visual) {
      visual.appendChild(buildOrb(['Govt. registered', 'Savings orb'], { size: 0.29, cy: 0.62 }));
      stage.querySelectorAll('.vm-hud').forEach((n) => visual.appendChild(n));   // labels scroll with the page, above the orb
    }

    // savings orb inside the dashboard hero (cropped at the right edge)
    const hero = document.querySelector('.dash-hero-banner');
    if (hero) {
      const c = document.createElement('canvas');
      c.className = 'vm-hero-orb';
      c.setAttribute('aria-hidden', 'true');
      hero.prepend(c);
      const g = document.createElement('span');
      g.className = 'vm-grain';
      g.setAttribute('aria-hidden', 'true');
      hero.prepend(g);
      const o = new Orb(c, { size: 0.36, cx: 0.9, cy: 0.3, rows: 26 });
      orbs.push(o); fibers.push(o);
    }

    // orb follows a finger drag / phone tilt
    window.addEventListener('deviceorientation', (e) => {
      if (reduce.matches || e.gamma == null) return;
      view.gx = Math.max(-30, Math.min(30, e.gamma)) * 0.012;
      view.gy = -Math.max(-30, Math.min(30, e.beta - 50)) * 0.008;
    });
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.member-visual')) view.drag = { x: e.clientX, y: e.clientY, rx: view.rx, ry: view.ry };
    });
    document.addEventListener('pointermove', (e) => {
      if (!view.drag) return;
      view.ry = view.drag.ry + (e.clientX - view.drag.x) * 0.01;
      view.rx = Math.max(-1.2, Math.min(1.2, view.drag.rx + (e.clientY - view.drag.y) * 0.01));
    });
    document.addEventListener('pointerup', () => { view.drag = null; });
    document.addEventListener('pointercancel', () => { view.drag = null; });

    // keep state in step with the app's own router
    const panel = document.querySelector('.panel');
    if (panel) new MutationObserver(() => apply(stateFromPanel())).observe(panel, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(() => apply(stateFromPanel())).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', () => fibers.forEach((f) => f.sync()));
    window.addEventListener('hashchange', () => setTimeout(() => apply(stateFromPanel()), 60));

    apply(stateFromPanel());
    loader();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
