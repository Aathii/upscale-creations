/* Upscale Creations — site behaviour.
   Intro film, nav, reveals, the starfield, the content/testimonial feed (content/feed.json) and the enquiry form. */

const SITE = {
  email: 'upscalecreationsco@gmail.com',
  // FormSubmit forwards each enquiry to the inbox above. The first submission sends a one-time activation email.
  formEndpoint: 'https://formsubmit.co/ajax/upscalecreationsco@gmail.com',
  social: {
    Instagram: '__INSTAGRAM_URL__',
    TikTok: '__TIKTOK_URL__',
    YouTube: '__YOUTUBE_URL__',
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
function finishIntro() {
  root.classList.add('ready', 'landed');
  document.getElementById('intro')?.remove();
  try { sessionStorage.setItem('es-seen', '1'); } catch (e) {}
}

function runIntro() {
  const intro = document.getElementById('intro');
  const mark = document.getElementById('introMark');
  const sphere = document.getElementById('heroSphere');
  if (!intro || !mark || !sphere) return finishIntro();

  window.scrollTo(0, 0);
  const failsafe = setTimeout(finishIntro, 7000);
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
    mark.style.transition = 'transform 1s cubic-bezier(.7,0,.2,1)';
    mark.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    setTimeout(() => { clearTimeout(failsafe); finishIntro(); }, 1020);
  }, 2450);
}

if (root.classList.contains('skip-intro')) finishIntro();
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
['work', 'services', 'content', 'contact'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

/* ---------- reveal on scroll ---------- */
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

function watchReveals(scope = document) {
  scope.querySelectorAll('.reveal:not(.in)').forEach((el) => {
    // siblings in the same grid cascade in
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
    revealer.observe(el);
  });
}
watchReveals();

/* ---------- hero starfield ---------- */
(function stars() {
  const c = document.getElementById('stars');
  const hero = document.getElementById('hero');
  if (!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  let w = 0, h = 0, pts = [], raf = 0, visible = true;
  const mouse = { x: -1e4, y: -1e4 };
  const LINK = 118;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(130, (w * h) / 10000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
      r: Math.random() * 1.2 + 0.35, t: Math.random() * Math.PI * 2,
    }));
  }

  function draw(move) {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      if (move) {
        p.x += p.vx; p.y += p.vy; p.t += 0.018;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    }
    ctx.lineWidth = 0.6;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          ctx.strokeStyle = `rgba(226,200,150,${(1 - Math.sqrt(d2) / LINK) * 0.16})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y;
      const md = Math.sqrt(mx * mx + my * my);
      if (md < 170) {
        ctx.strokeStyle = `rgba(240,214,160,${(1 - md / 170) * 0.35})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      const tw = 0.55 + Math.sin(p.t) * 0.45;
      ctx.fillStyle = `rgba(255,244,222,${0.35 + tw * 0.55})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function loop() { draw(true); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  resize(); draw(false); start();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(false); }, 150); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);

  if (canHover) {
    const sphere = document.getElementById('heroSphere');
    hero.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      const px = e.clientX / window.innerWidth - 0.5, py = e.clientY / window.innerHeight - 0.5;
      sphere?.style.setProperty('--ty', `${px * 16}deg`);
      sphere?.style.setProperty('--tx', `${py * -12}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      mouse.x = mouse.y = -1e4;
      sphere?.style.setProperty('--ty', '0deg'); sphere?.style.setProperty('--tx', '0deg');
    });
  }
})();

/* ---------- card spotlight ---------- */
if (canHover) {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.work-card, .svc, .reach-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
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
  } else if (!reduceMotion) {
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

function clipCard(item) {
  const wide = item.aspect === '16:9';
  const card = el('article', `clip reveal${wide ? ' clip-wide' : ''}`);
  if (wide) card.style.width = 'clamp(300px, 84vw, 540px)';

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
    if (item.title) body.append(el('h3', '', item.title));
    else if (who) body.append(el('h3', '', who));
  } else {
    if (item.title) body.append(el('h3', '', item.title));
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

// Closes the content rail: a nudge to call or text, plus socials once they are set.
function ctaCard() {
  const tel = document.querySelector('a[href^="tel:"]')?.getAttribute('href');
  const sms = document.querySelector('a[href^="sms:"]')?.getAttribute('href');
  const card = el('article', 'clip clip-follow reveal');
  const box = el('div', 'clip-media');
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mark.setAttribute('viewBox', '-120 -120 240 240'); mark.setAttribute('class', 'clip-mark'); mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '<use href="#mark"/>';
  const h = el('h3'); h.append('Want one for '); h.append(el('em', '', 'your brand?'));
  const call = el('a', 'btn btn-glow', 'Call now'); call.href = tel || '#contact';
  const text = el('a', 'btn btn-ghost', 'Send a text'); text.href = sms || '#contact';
  box.append(mark, h, el('p', '', 'Films like these are part of every website build.'), call, text);
  const socials = Object.fromEntries(Object.entries(SITE.social).filter(([, u]) => isSet(u)).map(([k, u]) => [k.toLowerCase(), u]));
  const row = linkRow(socials);
  if (row) box.append(row);
  card.append(box);
  return card;
}

// Footer: drop social links that have not been filled in yet.
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

  document.querySelectorAll('[data-feed]').forEach((section) => {
    const list = items.filter((i) => i.type === section.dataset.feed);
    if (!list.length) return;
    const track = section.querySelector('[data-rail-track]');
    list.forEach((i) => track.append(clipCard(i)));
    if (section.dataset.feed === 'content') track.append(ctaCard());
    section.hidden = false;
    setupRail(section);
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
form.addEventListener('submit', async (e) => {
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
const dock = document.getElementById('dock');
const dockState = { hero: true, contact: false };
const dockObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => { dockState[en.target.id] = en.isIntersecting; });
  dock.classList.toggle('show', !dockState.hero && !dockState.contact);
}, { threshold: 0.15 });
['hero', 'contact'].forEach((id) => dockObs.observe(document.getElementById(id)));

document.getElementById('year').textContent = new Date().getFullYear();
