/* Upscale Creations — site behaviour.
   Intro film, nav, reveals, the starfield, the content/testimonial feed (content/feed.json) and the enquiry form. */

const SITE = {
  email: 'upscalecreationsco@gmail.com',
  // FormSubmit forwards each enquiry to the inbox above. The first submission sends a one-time activation email.
  formEndpoint: 'https://formsubmit.co/ajax/upscalecreationsco@gmail.com',
  social: {
    Instagram: '__INSTAGRAM_URL__',
    TikTok: 'https://www.tiktok.com/@upscalecreations',
    YouTube: 'https://www.youtube.com/@upscalecreations',
  },
};

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isSet = (v) => typeof v === 'string' && v && !v.includes('__');

/* ---------- logo parts ----------
   Marks that animate part by part need real nodes, not a <use> shadow tree, so clone the shared #mark into them. */
const markTpl = document.getElementById('mark');
document.querySelectorAll('svg.mark-anim').forEach((svg) => {
  const g = markTpl.cloneNode(true);
  g.removeAttribute('id');
  svg.replaceChildren(g);
});

/* ---------- intro ---------- */
const announceReady = () => document.dispatchEvent(new Event('site:ready'));
function finishIntro() {
  root.classList.add('ready', 'landed');
  announceReady();
  document.getElementById('intro')?.remove();
}

function runIntro() {
  const intro = document.getElementById('intro');
  const mark = document.getElementById('introMark');
  const sphere = document.getElementById('heroSphere');
  if (!intro || !mark || !sphere) return finishIntro();

  window.scrollTo(0, 0);
  const failsafe = setTimeout(finishIntro, 8000);

  // Wait for the Bodoni wordmark font (at most 900ms) so UPSCALE never swaps typeface mid-animation.
  const font = document.fonts ? document.fonts.load('400 42px "Bodoni Moda"', 'UPSCALE').catch(() => {}) : null;
  Promise.race([font, new Promise((r) => setTimeout(r, 900))]).then(() => {
    requestAnimationFrame(() => root.classList.add('intro-play'));

    setTimeout(() => {
      // fly the assembled mark into the hero sphere, then hand over
      const a = mark.getBoundingClientRect();
      const b = sphere.getBoundingClientRect();
      const s = b.width / a.width;
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      intro.classList.add('leaving');
      root.classList.add('ready');
      announceReady();
      mark.style.transition = 'transform 1s cubic-bezier(.7,0,.2,1)';
      mark.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
      setTimeout(() => { clearTimeout(failsafe); finishIntro(); }, 1020);
    }, 2450);
  });
}

// Skipped intro: hand over once the hidden state has painted, so the orbit and scroll-cue fades still run.
if (root.classList.contains('skip-intro')) requestAnimationFrame(() => requestAnimationFrame(finishIntro));
else runIntro();

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const toggle = document.getElementById('navToggle');
const sheet = document.getElementById('menuSheet');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  sheet.inert = !open;
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });
matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// highlight the section in view
const navLinks = [...document.querySelectorAll('.nav-links a')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
// sections without a nav link (hero, process) are watched too, so the highlight clears over them
['hero', 'work', 'services', 'testimonials', 'process', 'contact'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

/* ---------- pause what is off screen ----------
   Looping CSS animations keep costing style and paint work even when scrolled out of view; .is-off pauses them. */
const offscreen = new IntersectionObserver((entries) => {
  entries.forEach((en) => en.target.classList.toggle('is-off', !en.isIntersecting));
}, { rootMargin: '120px 0px' });
document.querySelectorAll('.hero, .ticker, main > .section, .footer').forEach((s) => offscreen.observe(s));

/* ---------- reveal on scroll ----------
   Reveals replay every time something comes back into view. One observer adds .in once an element is a little
   way on screen; the other clears it only when the element is fully off screen, so the reset is never seen. */
const revealIn = new IntersectionObserver((entries) => {
  let n = 0;
  entries.forEach(({ target: t, intersectionRatio }) => {
    if (intersectionRatio < 0.08 || t.classList.contains('in')) return;
    // whatever comes into view together cascades in
    if (t.classList.contains('reveal')) t.style.setProperty('--d', `${Math.min(n++, 6) * 0.08}s`);
    t.classList.add('in');
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

const revealOut = new IntersectionObserver((entries) => {
  entries.forEach(({ target: t, isIntersecting, boundingClientRect: b, rootBounds: r }) => {
    if (isIntersecting || (!b.width && !b.height)) return; // ignore hidden (display: none) sections
    t.classList.remove('in');
    // left through the top: drop back in from above when scrolling up
    t.classList.toggle('above', b.bottom <= (r ? r.top : 0));
  });
});

const watchReveal = (el) => { revealIn.observe(el); revealOut.observe(el); };
function watchReveals(scope = document) {
  scope.querySelectorAll('.reveal').forEach(watchReveal);
}
watchReveals();
const heroCopy = document.querySelector('.hero-copy');
if (heroCopy) watchReveal(heroCopy);

/* ---------- hero starfield ----------
   One canvas: drifting stars, the links between near neighbours, shooting stars, and (on hover devices) the cursor
   tilt of the mark. Motion is timed in 60ths of a second, so it runs at the same speed on a 120 Hz screen.
   Lines and stars are drawn in a few batches by brightness rather than one draw call each. */
(function stars() {
  const c = document.getElementById('stars');
  const hero = document.getElementById('hero');
  if (!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  let w = 0, h = 0, pts = [], raf = 0, visible = true, last = 0;
  const mouse = { x: -1e4, y: -1e4 };
  const LINK = 118, REACH = 170, TAU = Math.PI * 2;
  const batch = (n, style) => Array.from({ length: n }, (_, i) => ({ style: style((i + 0.5) / n), v: [] }));
  const linkBatches = batch(4, (k) => `rgba(226,200,150,${(k * 0.16).toFixed(3)})`);
  const reachBatches = batch(3, (k) => `rgba(240,214,160,${(k * 0.35).toFixed(3)})`);
  const starBatches = batch(8, (k) => `rgba(255,244,222,${(0.405 + k * 0.495).toFixed(3)})`);
  const into = (batches, k) => batches[Math.min(batches.length - 1, (k * batches.length) | 0)].v;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(130, (w * h) / 10000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
      r: Math.random() * 1.2 + 0.35, t: Math.random() * TAU,
    }));
  }

  function strokeAll(batches) {
    for (const b of batches) {
      const v = b.v;
      if (!v.length) continue;
      ctx.strokeStyle = b.style;
      ctx.beginPath();
      for (let i = 0; i < v.length; i += 4) { ctx.moveTo(v[i], v[i + 1]); ctx.lineTo(v[i + 2], v[i + 3]); }
      ctx.stroke();
      v.length = 0;
    }
  }

  // dt is the time since the last frame in 60ths of a second; 0 draws without moving anything
  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    if (dt) {
      for (const p of pts) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.t += 0.018 * dt;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) into(linkBatches, 1 - Math.sqrt(d2) / LINK).push(a.x, a.y, b.x, b.y);
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y;
      const md = Math.sqrt(mx * mx + my * my);
      if (md < REACH) into(reachBatches, 1 - md / REACH).push(a.x, a.y, mouse.x, mouse.y);
    }
    ctx.lineWidth = 0.6;
    strokeAll(linkBatches);
    strokeAll(reachBatches);
    for (const p of pts) into(starBatches, 0.5 + Math.sin(p.t) * 0.5).push(p.x, p.y, p.r);
    for (const b of starBatches) {
      const v = b.v;
      if (!v.length) continue;
      ctx.fillStyle = b.style;
      ctx.beginPath();
      for (let i = 0; i < v.length; i += 3) { ctx.moveTo(v[i] + v[i + 2], v[i + 1]); ctx.arc(v[i], v[i + 1], v[i + 2], 0, TAU); }
      ctx.fill();
      v.length = 0;
    }
    if (dt) drawMeteors(dt);
  }

  // Shooting stars: one every few seconds, high in the sky, quick, with a soft glowing head.
  const meteors = [];
  let nextMeteor = 80 + Math.random() * 100; // in 60ths of a second
  function drawMeteors(dt) {
    if ((nextMeteor -= dt) <= 0) {
      const ang = (145 + Math.random() * 22) * Math.PI / 180; // heading down and to the left
      const v = 8 + Math.random() * 5;
      meteors.push({
        x: w * (0.3 + Math.random() * 0.75), y: h * Math.random() * 0.45,
        vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, ux: Math.cos(ang), uy: Math.sin(ang),
        len: 130 + Math.random() * 140, life: 0, max: 48 + Math.random() * 30,
      });
      nextMeteor = 150 + Math.random() * 220;
    }
    ctx.lineCap = 'round';
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt;
      const k = (m.life += dt) / m.max;
      if (k >= 1) { meteors.splice(i, 1); continue; }
      const a = Math.min(1, Math.sin(k * Math.PI) * 1.25); // fades in, holds, fades out
      const len = m.len * Math.min(1, m.life / 12);
      const tx = m.x - m.ux * len, ty = m.y - m.uy * len;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,248,232,${a})`);
      g.addColorStop(0.25, `rgba(244,220,170,${a * 0.6})`);
      g.addColorStop(1, 'rgba(240,214,160,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.shadowColor = 'rgba(255,226,170,.9)'; ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(255,250,238,${a})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.8, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Cursor tilt: the mark eases towards the pointer and drifts after it; the orbits drift the other way for depth.
  // It is written straight to three elements from the frame loop, with no style recalculation for the rest of the hero.
  const tiltEl = document.getElementById('heroTilt');
  const orbits = [...document.querySelectorAll('#heroVisual .orbit')];
  const aim = { x: 0, y: 0 }, at = { x: 0, y: 0 };
  let tilting = false;
  function tilt(dt) {
    if (!tilting || !tiltEl) return;
    const k = 1 - Math.pow(0.88, dt);
    at.x += (aim.x - at.x) * k; at.y += (aim.y - at.y) * k;
    if (Math.abs(aim.x - at.x) + Math.abs(aim.y - at.y) < 0.0004) { at.x = aim.x; at.y = aim.y; tilting = false; }
    tiltEl.style.transform = `translate3d(${(at.x * 44).toFixed(2)}px,${(at.y * 32).toFixed(2)}px,0) perspective(900px) rotateX(${(at.y * -30).toFixed(2)}deg) rotateY(${(at.x * 40).toFixed(2)}deg)`;
    const drift = `${(at.x * -13.2).toFixed(2)}px ${(at.y * -9.6).toFixed(2)}px`;
    for (const o of orbits) o.style.translate = drift;
  }

  function loop(ts) {
    const dt = last ? Math.min(3, (ts - last) / 16.667) : 1;
    last = ts;
    draw(dt); tilt(dt);
    raf = requestAnimationFrame(loop);
  }
  // runs only while the hero is on screen, the tab is visible and the intro has lifted
  function start() {
    if (raf || !visible || document.hidden || reduceMotion || !root.classList.contains('ready')) return;
    last = 0; raf = requestAnimationFrame(loop);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  resize(); draw(0); start();
  document.addEventListener('site:ready', start);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(0); }, 150); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);

  if (canHover) {
    hero.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      aim.x = e.clientX / window.innerWidth - 0.5; aim.y = e.clientY / window.innerHeight - 0.5;
      tilting = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      mouse.x = mouse.y = -1e4;
      aim.x = aim.y = 0; tilting = true;
    });
  }
})();

/* ---------- card spotlight ---------- */
if (canHover) {
  // at most one update per frame, however fast the pointer reports
  let spot = null, spotFrame = 0;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.work-card, .svc, .reach-card');
    if (!card) return;
    spot = { card, x: e.clientX, y: e.clientY };
    if (spotFrame) return;
    spotFrame = requestAnimationFrame(() => {
      spotFrame = 0;
      const r = spot.card.getBoundingClientRect();
      spot.card.style.setProperty('--mx', `${spot.x - r.left}px`);
      spot.card.style.setProperty('--my', `${spot.y - r.top}px`);
    });
  }, { passive: true });
}

/* ---------- work card films: hover on desktop, in view on touch ---------- */
function bindPreview(video, trigger) {
  video.addEventListener('playing', () => video.classList.add('playing'));
  const play = () => { video.play().catch(() => {}); };
  const pause = () => { video.pause(); video.classList.remove('playing'); };
  if (canHover) {
    trigger.addEventListener('pointerenter', play);
    trigger.addEventListener('pointerleave', pause);
  } else if (!reduceMotion && !navigator.connection?.saveData) {
    new IntersectionObserver(([en]) => (en.intersectionRatio > 0.6 ? play() : pause()), { threshold: [0, 0.6] }).observe(trigger);
  }
}
document.querySelectorAll('video[data-hover-play]').forEach((v) => bindPreview(v, v.closest('.work-card')));

/* ---------- content + testimonials feed ----------
   content/feed.json is the single source of truth. The social poster appends to it; each item looks like:
   { id, type: "content" | "testimonial", title, caption, client, role, date: "YYYY-MM-DD",
     video, poster, aspect: "9:16" | "16:9", tag, links: { instagram, tiktok, youtube } } */
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const fmtDate = (d) => {
  const t = new Date(`${d}T12:00:00`);
  return isNaN(t) ? '' : t.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};
const PLAY_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2A.8.8 0 0 0 3 1.8z"/></svg>';

function linkRow(links) {
  const row = el('div', 'clip-links');
  const names = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', website: 'Website' };
  Object.entries(links || {}).forEach(([k, url]) => {
    if (!isSet(url) || !/^https?:\/\//.test(url)) return;
    const a = el('a', '', `${names[k] || k} ↗`);
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    row.append(a);
  });
  return row.childElementCount ? row : null;
}

function clipCard(item, tag = 'h3') {
  const wide = item.aspect === '16:9';
  const card = el('article', `clip reveal${wide ? ' clip-wide' : ''}`);

  const media = el('button', `clip-media${wide ? ' wide' : ''}`);
  media.type = 'button';
  media.setAttribute('aria-label', `Play: ${item.title || item.client || 'video'}`);
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  if (item.poster) v.poster = item.poster;
  v.src = item.video;
  media.append(v);
  if (item.tag) media.append(el('span', 'clip-tag', item.tag));
  const play = el('span', 'clip-play'); play.innerHTML = PLAY_ICON; media.append(play);
  media.addEventListener('click', () => openPlayer(item));
  card.append(media);

  const body = el('div', 'clip-body');
  const meta = [item.client, fmtDate(item.date)].filter(Boolean).join(' · ');
  if (meta) body.append(el('div', 'clip-meta', meta));
  if (item.type === 'testimonial') {
    if (item.caption) body.append(el('p', 'clip-quote', item.caption));
    const who = [item.client, item.role].filter(Boolean).join(', ');
    if (item.title) body.append(el(tag, '', item.title));
    else if (who) body.append(el(tag, '', who));
  } else {
    if (item.title) body.append(el(tag, '', item.title));
    if (item.caption) body.append(el('p', '', item.caption));
  }
  const links = linkRow(item.links);
  if (links) body.append(links);
  card.append(body);

  // previews play muted while on screen
  if (!reduceMotion) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.55 }).observe(media);
  }
  return card;
}

// Closes the content grid: a nudge to call or text, plus socials once they are set.
function ctaCard(tag = 'h3') {
  const tel = document.querySelector('a[href^="tel:"]')?.getAttribute('href');
  const sms = document.querySelector('a[href^="sms:"]')?.getAttribute('href');
  const card = el('article', 'clip clip-follow reveal');
  const box = el('div', 'clip-media');
  const mark = el('img', 'clip-mark');
  mark.src = 'brand/upscale-mark.svg'; mark.alt = '';
  const h = el(tag); h.append('Want one for '); h.append(el('em', '', 'your brand?'));
  const call = el('a', 'btn btn-glow', 'Call now'); call.href = tel || './#contact';
  const text = el('a', 'btn btn-ghost', 'Send a text'); text.href = sms || './#contact';
  box.append(mark, h, el('p', '', 'Films like these are part of every website build.'), call, text);
  const socials = Object.fromEntries(Object.entries(SITE.social).filter(([, u]) => isSet(u)).map(([k, u]) => [k.toLowerCase(), u]));
  const row = linkRow(socials);
  if (row) box.append(row);
  card.append(box);
  return card;
}

// [data-social] boxes are filled from SITE.social. Footer: drop social links that have not been filled in yet.
document.querySelectorAll('[data-social]').forEach((box) => {
  Object.entries(SITE.social).forEach(([name, url]) => {
    if (!isSet(url)) return;
    const a = el('a', '', name);
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    box.append(a);
  });
  if (!box.querySelector('a')) box.remove();
});
document.querySelectorAll('.foot-social a').forEach((a) => { if (!isSet(a.getAttribute('href'))) a.remove(); });
document.querySelectorAll('.foot-social').forEach((col) => { if (!col.querySelector('a')) col.remove(); });

function setupRail(section) {
  const track = section.querySelector('[data-rail-track]');
  const prev = section.querySelector('[data-rail="prev"]');
  const next = section.querySelector('[data-rail="next"]');
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
    section.querySelector('.rail-ctrl')?.toggleAttribute('hidden', max <= 0);
  };
  prev?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

async function loadFeed() {
  let data;
  try {
    const res = await fetch('content/feed.json', { cache: 'no-cache' });
    if (!res.ok) return;
    data = await res.json();
  } catch (e) { return; }
  const items = (data.items || [])
    .filter((i) => i && i.video && i.published !== false)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  // Home: testimonials rail (stays hidden until the first one). Content page: grid, with an empty state until the first post.
  document.querySelectorAll('[data-feed]').forEach((section) => {
    const list = items.filter((i) => i.type === section.dataset.feed);
    if (!list.length) return;
    const rail = section.querySelector('[data-rail-track]');
    const track = rail || section.querySelector('[data-feed-track]');
    const tag = section.querySelector('h1') ? 'h2' : 'h3';
    list.forEach((i) => track.append(clipCard(i, tag)));
    if (section.dataset.feed === 'content') track.append(ctaCard(tag));
    section.querySelector('[data-feed-empty]')?.remove();
    section.hidden = false; track.hidden = false;
    if (rail) setupRail(section);
    watchReveals(section);
  });
}
loadFeed();

/* ---------- player ---------- */
const player = document.getElementById('player');
const pVideo = player.querySelector('video');
const pCap = player.querySelector('.player-cap');
function openPlayer(item) {
  player.classList.toggle('wide', item.aspect === '16:9');
  pVideo.poster = item.poster || '';
  pVideo.src = item.video;
  pVideo.muted = false;
  pCap.textContent = [item.title, item.client].filter(Boolean).join(' · ');
  player.showModal();
  pVideo.play().catch(() => {});
}
function closePlayer() {
  pVideo.pause();
  pVideo.removeAttribute('src'); pVideo.load();
  if (player.open) player.close();
}
player.querySelector('.player-close').addEventListener('click', closePlayer);
player.addEventListener('click', (e) => { if (e.target === player) closePlayer(); });
player.addEventListener('cancel', (e) => { e.preventDefault(); closePlayer(); });

/* ---------- enquiry form ---------- */
const form = document.getElementById('brief');
const note = document.getElementById('briefNote');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  const contact = String(fd.get('contact') || '').trim();
  const message = String(fd.get('message') || '').trim();
  const needs = fd.getAll('needs').join(', ');

  let bad = false;
  [['name', name], ['contact', contact]].forEach(([k, v]) => {
    const field = form.querySelector(`[name="${k}"]`).closest('.field');
    field.classList.toggle('invalid', !v);
    if (!v) bad = true;
  });
  if (bad) { note.className = 'brief-note err'; note.textContent = 'Add your name and a phone number or email so we can reply.'; return; }
  if (fd.get('_honey')) return showSent(name);

  // not wired to an inbox yet: fall back to the visitor's mail app
  if (!isSet(SITE.formEndpoint)) {
    const body = `Name: ${name}\nContact: ${contact}\nNeeds: ${needs || '-'}\n\n${message}`;
    location.href = `mailto:${isSet(SITE.email) ? SITE.email : ''}?subject=${encodeURIComponent('New project enquiry')}&body=${encodeURIComponent(body)}`;
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; form.classList.add('sending');
  note.className = 'brief-note'; note.textContent = 'Sending…';
  const payload = {
    name, contact, needs: needs || '-', message: message || '-',
    _subject: `New project enquiry: ${name}`,
    _template: 'table',
    _captcha: 'false',
  };
  if (contact.includes('@')) payload.email = contact; // lets you hit Reply
  try {
    const res = await fetch(SITE.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
    showSent(name);
  } catch (err) {
    btn.disabled = false; form.classList.remove('sending');
    note.className = 'brief-note err';
    note.textContent = "That didn't go through. Call, text or ";
    const a = el('a', '', 'email us directly'); a.href = `mailto:${SITE.email}`;
    note.append(a, '.');
  }
});
function showSent(name) {
  form.classList.remove('sending');
  form.classList.add('sent');
  form.replaceChildren(
    Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {}),
    el('h3', '', `Got it${name ? `, ${name.split(' ')[0]}` : ''}.`),
    el('p', '', "Your note is in our inbox. We'll be in touch shortly. For anything urgent, call or text."),
  );
  const mark = form.querySelector('svg');
  mark.setAttribute('viewBox', '-120 -120 240 240');
  mark.setAttribute('width', '64'); mark.setAttribute('height', '64');
  mark.innerHTML = '<use href="#mark"/>';
}

/* ---------- mobile call dock ---------- */
// Hidden while the hero or contact section is on screen; pages without them show it straight away.
const dock = document.getElementById('dock');
const dockState = { hero: !!document.getElementById('hero'), contact: false };
const syncDock = () => dock?.classList.toggle('show', !dockState.hero && !dockState.contact);
const dockObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => { dockState[en.target.id] = en.isIntersecting; });
  syncDock();
}, { threshold: 0.15 });
['hero', 'contact'].forEach((id) => { const s = document.getElementById(id); if (s) dockObs.observe(s); });
syncDock();

document.getElementById('year').textContent = new Date().getFullYear();
