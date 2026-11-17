'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const sstore = {
  get() { try { return JSON.parse(sessionStorage.getItem('ts-sess')); } catch { return null; } },
  set(v) { try { v ? sessionStorage.setItem('ts-sess', JSON.stringify(v)) : sessionStorage.removeItem('ts-sess'); } catch {} },
};

let ws = null, S = null, myId = null, amSpec = false, sess = sstore.get();
let avatar = Object.assign(avRandom(), store.get('ts-avatar2', null) || {});
let deadline = 0, total = 0, panelKey = '', lastSoundKey = '', muted = store.get('ts-muted', false);
const activeEmotes = {}; // id gracza -> { e, timer }

// ---------- dźwięki ----------
let actx = null;
function beep(freqs, dur = 0.12, type = 'sine') {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), at = actx.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.12, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(actx.destination); o.start(at); o.stop(at + dur + 0.02);
    });
  } catch {}
}

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3500);
}
function show(id) {
  for (const s of ['home', 'lobby', 'game']) $('#' + s).classList.toggle('hidden', s !== id);
  $('#lang').classList.toggle('hidden', id === 'game');
}

// ---------- ikony (własne, rysowane w SVG) ----------
const ICON = {
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" transform="rotate(-8 12 12)"/><g fill="currentColor" stroke="none"><circle cx="8.3" cy="8.9" r="1.5"/><circle cx="15.2" cy="7.9" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="8.8" cy="16.1" r="1.5"/><circle cx="15.7" cy="15.1" r="1.5"/></g>',
  cards: '<rect x="8" y="3" width="13" height="16" rx="3" transform="rotate(8 14.5 11)"/><rect x="3" y="5" width="13" height="16" rx="3" fill="var(--icbg, #241a55)"/><circle cx="9.5" cy="11" r="2.4"/><path d="M5.6 18.2c.6-2.2 2-3.3 3.9-3.3s3.3 1.1 3.9 3.3"/>',
  stats: '<path d="M3.5 20.5h17"/><rect x="5" y="12" width="3.6" height="6" rx="1.2"/><rect x="10.2" y="7.5" width="3.6" height="10.5" rx="1.2"/><rect x="15.4" y="3.5" width="3.6" height="14.5" rx="1.2"/>',
  swap: '<circle cx="12" cy="9.2" r="2.7"/><path d="M7.6 16.6c.7-2.1 2.2-3.2 4.4-3.2s3.7 1.1 4.4 3.2"/><path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9"/><path d="M3.5 12A8.5 8.5 0 0 1 18.1 6.1"/><path d="M18.4 2.8v3.5h-3.5"/><path d="M5.6 21.2v-3.5h3.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  sound: '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.3a8 8 0 0 1 0 11.4"/>',
  mute: '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/>',
  trophy: '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5H4.2c0 3 1.4 4.6 3.6 4.9"/><path d="M16.5 5.5h3.3c0 3-1.4 4.6-3.6 4.9"/><path d="M12 13.5v3.5"/><path d="M8 20.5h8"/><path d="M9.5 17h5v3.5h-5z"/>',
  flag: '<path d="M5.5 21V3.5"/><path d="M5.5 4.5c4-2 6 2 10.5 0 .9-.4 1.7-.6 2.5-.6v8.6c-.8 0-1.6.2-2.5.6-4.5 2-6.5-2-10.5 0"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.3v7.4l6-3.7z" fill="currentColor"/>',
  star: '<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  percent: '<circle cx="7.5" cy="7.5" r="3"/><circle cx="16.5" cy="16.5" r="3"/><path d="M18.5 5.5l-13 13"/>',
  bolt: '<path d="M13.5 2.8L5 13.5h5.6l-1.1 7.7L18.5 10h-5.8z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M7.8 12.4l2.9 2.9 5.6-6"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- język ----------
function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { if (el.dataset.ic) el.innerHTML = `<i>${ic(el.dataset.ic)}</i><span>${esc(t(el.dataset.i18n))}</span>`; else el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', el.title); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  $('#lang').innerHTML = `<b class="${LANG === 'pl' ? 'on' : ''}">PL</b><b class="${LANG === 'en' ? 'on' : ''}">EN</b>`;
  renderEditor();
}
function toggleLang() {
  LANG = LANG === 'pl' ? 'en' : 'pl';
  try { localStorage.setItem('ts-lang', LANG); } catch {}
  applyStatic(); panelKey = ''; if (S) render();
}
$('#lang').onclick = toggleLang;

// ---------- emotki ----------
const myAvatar = () => (S && (S.players.find(p => p.id === myId) || {}).avatar) || avatar;
// przycisk otwierający koło emotek — pokazuje własnego ludka, który macha
const emoBtnInner = () => `<span class="emo-0">${avatarSVG(myAvatar())}</span><b>${t('emotes')}</b>`;
function openWheel() {
  const w = $('#wheel'), av = myAvatar();
  w.innerHTML = `<div class="wheel" role="menu" aria-label="${t('emotes')}">
    ${Array.from({ length: EMOTE_N }, (_, i) => `<button class="seg emo-${i}" style="--a:${i * 45}deg" data-emote="${i}" role="menuitem" aria-label="${t('em' + i)}">${avatarSVG(av)}<span>${t('em' + i)}</span></button>`).join('')}
    <div class="wheel-c"><b id="wheel-name">${t('emotes')}</b><small>${t('wheelHint')}</small></div></div>`;
  w.classList.remove('hidden');
}
const closeWheel = () => $('#wheel').classList.add('hidden');
const wheelOpen = () => !$('#wheel').classList.contains('hidden');
$('#wheel').addEventListener('pointerover', e => {
  const s = e.target.closest('.seg'); if (s) $('#wheel-name').textContent = t('em' + s.dataset.emote);
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-wheel]')) return wheelOpen() ? closeWheel() : openWheel();
  const b = e.target.closest('[data-emote]');
  if (b) { if (S) tx({ t: 'emote', e: +b.dataset.emote }); else playEmote('preview', +b.dataset.emote); }
  if (wheelOpen()) closeWheel();
});
addEventListener('keydown', e => {
  if (e.key === 'Escape' && wheelOpen()) return closeWheel();
  if (e.key === 'Escape') { closeGallery(); closePicker(); $('#profile').classList.add('hidden'); }
  if ((e.key === 'b' || e.key === 'B') && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) wheelOpen() ? closeWheel() : openWheel();
});
function emoteTarget(id) {
  if (id === 'preview') return $('#av-preview');
  return document.querySelector(`#lobby:not(.hidden) .pl[data-pid="${id}"], #game:not(.hidden) .pod[data-id="${id}"]`);
}
function paintEmote(id) {
  const a = activeEmotes[id], el = emoteTarget(id);
  if (!a || !el || el.classList.contains('emo-' + a.e)) return;
  el.classList.add('emoting', 'emo-' + a.e);
}
function clearEmote(id) {
  const el = emoteTarget(id);
  if (el) el.className = el.className.replace(/\s*\bemo(ting|-\d)\b/g, '');
  delete activeEmotes[id];
}
function playEmote(id, e) {
  if (activeEmotes[id]) { clearTimeout(activeEmotes[id].timer); clearEmote(id); }
  activeEmotes[id] = { e, timer: setTimeout(() => clearEmote(id), 2600) };
  paintEmote(id);
}
const repaintEmotes = () => Object.keys(activeEmotes).forEach(paintEmote);

// ---------- ekran startowy ----------
function renderEditor() {
  $('#av-preview').innerHTML = `<div class="spot"></div>${avatarSVG(avatar)}<div class="pedestal"></div>`;
  $('#home-emo').innerHTML = emoBtnInner();
  $('#av-parts').innerHTML = AV_PARTS.map(k => {
    const label = t('p_' + k);
    return `<div class="part"><button class="arrow" data-k="${k}" data-d="-1" aria-label="${label}: ${t('prev')}">‹</button><span>${label} <em>${(avatar[k] || 0) + 1}/${avCount(k)}</em></span><button class="arrow" data-k="${k}" data-d="1" aria-label="${label}: ${t('next')}">›</button></div>`;
  }).join('');
}
// zwykły ludek z edytora (bez kolorów i dodatków postaci z galerii)
const plainAv = a => { const o = {}; for (const k of AV_PARTS) o[k] = a[k] || 0; return o; };
function stepPart(k, d) {
  const n = avCount(k);
  if (avatar.gid) avatar = plainAv(avatar);
  avatar[k] = ((avatar[k] || 0) + d + n) % n;
  avatarChanged();
}
// po każdej zmianie: zapisz w przeglądarce, odśwież widoki, a w pokoju wyślij nowy wygląd
function avatarChanged() {
  store.set('ts-avatar2', avatar); renderEditor();
  if (S && S.phase === 'lobby') tx({ t: 'profile', name: myName(), avatar });
  if (!$('#picker').classList.contains('hidden')) renderPicker();
}
$('#av-parts').addEventListener('click', e => {
  const b = e.target.closest('.arrow'); if (!b) return;
  stepPart(b.dataset.k, +b.dataset.d);
});
$('#btn-random').onclick = () => { avatar = avRandom(); avatarChanged(); };
$('#btn-gal-me').onclick = () => openPicker(false);

// ---------- zmiana postaci: edytor i galeria gotowych postaci ----------
let pickerFull = false;
function openPicker(full) { pickerFull = full; $('#picker').classList.remove('hidden'); renderPicker(); }
function closePicker() { $('#picker').classList.add('hidden'); }
function renderPicker() {
  const el = $('#picker'), sc = (el.querySelector('.gal-body') || {}).scrollTop || 0;
  el.innerHTML = `<div class="gal card pick" role="dialog" aria-label="${t('changeChar')}">
    <div class="gal-head"><h2>${t(pickerFull ? 'changeChar' : 'galleryMe')}</h2><button class="btn primary" id="pick-close">${t('done')}</button></div>
    <div class="pick-grid ${pickerFull ? '' : 'only'}">
      ${pickerFull ? `<div class="pick-ed"><div class="preview small">${avatarSVG(avatar)}</div>
        <div class="parts">${AV_PARTS.map(k => `<div class="part"><button class="arrow" data-pk="${k}" data-d="-1" aria-label="${t('p_' + k)}: ${t('prev')}">‹</button><span>${t('p_' + k)}</span><button class="arrow" data-pk="${k}" data-d="1" aria-label="${t('p_' + k)}: ${t('next')}">›</button></div>`).join('')}</div>
        <button class="btn ghost icb" id="pick-rand">${ic('dice')}${t('randomize')}</button></div>` : ''}
      <div class="gal-body">${['friends', 'sport', 'music', 'world'].map(gr => `<h3>${t('g_' + gr)}</h3><div class="gal-grid">
        ${BOT_GALLERY.filter(b => b.group === gr).map(b => `<button class="gal-item ${avatar.gid === b.id ? 'used' : ''}" data-mygid="${b.id}">${avatarSVG(b.avatar)}<b>${esc(b.name)}</b>${avatar.gid === b.id ? `<em>${t('chosen')}</em>` : ''}</button>`).join('')}</div>`).join('')}</div>
    </div></div>`;
  el.querySelector('.gal-body').scrollTop = sc;
  $('#pick-close').onclick = closePicker;
  if ($('#pick-rand')) $('#pick-rand').onclick = () => { avatar = avRandom(); avatarChanged(); };
  el.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => stepPart(b.dataset.pk, +b.dataset.d));
  el.querySelectorAll('[data-mygid]').forEach(b => b.onclick = () => {
    const g = BOT_GALLERY.find(x => x.id === b.dataset.mygid);
    avatar = Object.assign({}, g.avatar, { gid: g.id });
    avatarChanged();
  });
}
$('#picker').addEventListener('click', e => { if (e.target.id === 'picker') closePicker(); });
$('#name').value = store.get('ts-name', '');
$('#name').oninput = e => store.set('ts-name', e.target.value);
$('#code').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); };
const myName = () => $('#name').value.trim() || t('defaultName');
$('#btn-create').onclick = () => connect({ t: 'create', name: myName(), avatar });
$('#btn-join').onclick = () => {
  const code = $('#code').value.trim();
  if (code.length !== 5) return toast(t('codeLen'));
  connect({ t: 'join', code, name: myName(), avatar });
};
$('#code').onkeydown = e => { if (e.key === 'Enter') $('#btn-join').click(); };

// ---------- połączenie ----------
function connect(first) {
  if (ws && ws.readyState <= 1) { ws.onclose = null; ws.close(); }
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.onopen = () => ws.send(JSON.stringify(first));
  ws.onerror = () => { if (!sess) { conn(false); toast(t('noServer')); } };
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    conn(false);
    if (m.t === 'joined') {
      sess = { code: m.code, id: m.id, secret: m.secret }; sstore.set(sess); myId = m.id;
      history.replaceState(null, '', '?pokoj=' + m.code);
    } else if (m.t === 'state') {
      S = m.s; myId = m.you; amSpec = !!m.spec;
      const g = S.game;
      if (g) { deadline = performance.now() + g.timeLeft; total = g.total; }
      render();
    } else if (m.t === 'emote') {
      playEmote(m.id, m.e);
    } else if (m.t === 'error') {
      toast(t('e_' + m.code));
      if (m.fatal) goHome();
    }
  };
  ws.onclose = () => {
    if (!sess) return;
    conn(true);
    setTimeout(() => { if (sess) connect({ t: 'rejoin', ...sess }); }, 1500);
  };
}
const tx = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
// zasłona „Łączę ze studiem…” przy zerwanym połączeniu (np. restart serwera po aktualizacji)
function conn(on) {
  let el = $('#conn');
  if (!el) { el = document.createElement('div'); el.id = 'conn'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = `<div class="conn-box"><div class="conn-spin"></div><b>${t('connecting')}</b><small>${t('connectingSub')}</small><button class="btn ghost" id="conn-home">${t('leave')}</button></div>`;
  el.classList.toggle('show', on);
  $('#conn-home').onclick = () => { conn(false); goHome(); };
}
function goHome() {
  conn(false);
  sess = null; sstore.set(null); S = null; closeGallery();
  if (ws) { ws.onclose = null; ws.close(); }
  history.replaceState(null, '', location.pathname); show('home');
}

function render() {
  if (!S) return show('home');
  if (S.phase === 'lobby') { show('lobby'); renderLobby(); panelKey = ''; introDone = false; reportedQ = -1; }
  else { show('game'); renderGame(); }
  renderGallery();
  repaintEmotes();
}

// ---------- pełny ekran ----------
let quitArmed = false, quitTimer = 0, reportedQ = -1;
const fsEl = document.documentElement;
const fsOK = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
const FS_ICON = { on: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', off: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' };
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function fsBtn(cls) {
  if (!fsOK) return '';
  return `<button class="${cls} fsbtn" data-fs aria-label="${fsOn() ? t('fsExit') : t('fs')}" title="${fsOn() ? t('fsExit') : t('fs')}">${fsOn() ? FS_ICON.on : FS_ICON.off}</button>`;
}
function toggleFs() {
  try {
    if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const p = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); if (p && p.catch) p.catch(() => {}); }
  } catch {}
}
document.addEventListener('click', e => { if (e.target.closest('[data-fs]')) toggleFs(); });
const fsSync = () => { document.querySelectorAll('[data-fs]').forEach(b => { b.innerHTML = fsOn() ? FS_ICON.on : FS_ICON.off; b.title = b.ariaLabel = fsOn() ? t('fsExit') : t('fs'); }); setTimeout(camera, 120); };
document.addEventListener('fullscreenchange', fsSync);
document.addEventListener('webkitfullscreenchange', fsSync);

// ---------- poczekalnia ----------
function renderLobby() {
  const host = S.hostId === myId, el = $('#lobby');
  const link = location.origin + '/?pokoj=' + S.code;
  const sc = (el.querySelector('.cats') || {}).scrollTop || 0;
  // czat: zachowaj wpisany tekst, kursor i przewinięcie przy każdym odświeżeniu poczekalni
  const ci = el.querySelector('#chat-in'), clog = el.querySelector('.chat-log');
  const chatKeep = ci ? { v: ci.value, f: document.activeElement === ci, s: ci.selectionStart } : null;
  const chatBottom = !clog || clog.scrollHeight - clog.scrollTop - clog.clientHeight < 30;
  const rsc = (el.querySelector('.reps') || {}).scrollTop || 0;
  const sel = new Set(S.settings.categories);
  const totalQ = S.cats.filter(c => sel.has(c.id)).reduce((s, c) => s + c.n, 0);
  el.innerHTML = `
  <div class="lobby-wrap">
    <div class="lobby-head">
      <h1 class="logo small"><span>Trzy</span> <span class="logo-b">Szanse</span></h1>
      <span class="lobby-btns">${fsBtn('btn ghost')}<button class="btn ghost" id="lb-leave">${t('leave')}</button></span>
    </div>
    <div class="lobby-grid">
      ${amSpec ? `<div class="specbar">${ic('eye')}<span>${t('specWait')}</span></div>` : ''}
      <section class="card stagecard">
        <h2>${t('players')} <small>${S.players.length}/10</small></h2>
        <div class="plist">
          ${Array.from({ length: 10 }, (_, i) => { const p = S.players[i]; return p ? `
            <div class="pl ${p.id === myId ? 'me' : ''}" data-pid="${p.id}">
              <div class="pl-fig">${avatarSVG(p.avatar)}</div>
              <div class="pl-desk"><span class="pl-seat">${i + 1}</span>
                <div class="pl-name">${esc(p.name)}</div>
                ${p.isBot && host ? `<select class="pl-lv" data-botlv="${p.id}" aria-label="${esc(t('botLevelOf', { name: p.name }))}">${levelOpts(p.level)}</select>`
      : `<div class="pl-sub">${p.isBot ? t('bot') + ' · ' + t('lv_' + p.level) : p.id === S.hostId ? t('host') : t('seat', { n: i + 1 })}</div>`}</div>
              ${host && p.id !== myId ? `<button class="x" data-kick="${p.id}" aria-label="${esc(t('remove', { name: p.name }))}">×</button>` : ''}
            </div>` : `<div class="pl empty"><div class="pl-fig"></div><div class="pl-desk"><span class="pl-seat">${i + 1}</span><div class="pl-sub">${t('free')}</div></div></div>`; }).join('')}
        </div>
        ${S.specs.length ? `<div class="specs">${ic('eye')} ${t('specs')}: ${S.specs.map(x => `<b>${esc(x.name)}</b>`).join(', ')}</div>` : ''}
        <div class="emo-row">${amSpec ? '' : `<button class="emo-btn" data-wheel>${emoBtnInner()}</button><button class="btn icb" id="change-char">${ic('swap')}${t('changeChar')}</button>`}
        ${host ? `<span class="botrow">
          <select id="bot-level" class="inp">${levelOpts(botLevel, true)}</select>
          <button class="btn" id="add-bot" ${S.players.length >= 10 ? 'disabled' : ''}>${t('addBot')}</button>
          <button class="btn primary" id="open-gallery">${t('gallery')}</button>
        </span>` : ''}</div>
      </section>
      <div class="duo">
      <section class="card chatcard">
        <h2>${t('chat')}</h2>
        <div class="chat-log">${S.chat.length ? S.chat.map(c => `<div class="cm ${c.id === myId ? 'me' : ''}"><b>${esc(c.name)}</b> ${esc(c.text)}</div>`).join('') : `<p class="hint">${t('chatEmpty')}</p>`}</div>
        <div class="quick">${QUICK.map(q => `<button class="pillbtn" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <form id="chat-form" class="ans"><input id="chat-in" class="inp" maxlength="140" placeholder="${t('chatPh')}" autocomplete="off"><button class="btn primary">${t('send')}</button></form>
      </section>
      <section class="card histcard">
        <h2>${t('history')} ${S.history.length ? `<small>${S.history.length}</small>` : ''}</h2>
        ${S.history.length ? `<ol class="hist">${S.history.slice().sort((a, b) => b.score - a.score || a.game - b.game).map((h, i) => `<li class="${i === 0 ? 'top' : ''}"><span class="rk">${i + 1}</span>${avatarSVG(h.avatar)}<span class="rn">${esc(h.name)}</span><span class="hg">${t('hGame')} ${h.game}</span><span class="rs">${h.score} ${t('pts')}</span></li>`).join('')}</ol>`
      : `<p class="hint">${t('histEmpty')}</p>`}
      </section>
      </div>
      <section class="card setcard">
        <div class="set-l">
          <h2>${t('invite')}</h2>
          <div class="invite">
            <div class="bigcode" aria-label="${t('roomCode')}"><small>${t('roomCode')}</small>${S.code}</div>
            <button class="btn" id="copy-link">${t('copyLink')}</button>
          </div>
          <div class="linktxt">${esc(link)}</div>
          <h2>${t('settings')} ${host ? '' : `<small>${t('hostSets')}</small>`}</h2>
          <div class="setrow">
            <div class="setgrp"><span class="lbl">${t('answerTime')}</span>${segCtl('answerTime', [15, 25, 40, 60], ' s', host)}</div>
            <div class="setgrp"><span class="lbl">${t('finalQs')}</span>${segCtl('finalQuestions', [10, 15, 20, 30, 40, 50], '', host)}</div>
          </div>
          ${host ? `<button class="btn primary big" id="start" ${S.players.length < 2 ? 'disabled' : ''}>${t('start')}</button>
            ${S.players.length < 2 ? `<p class="hint">${t('need2hint')}</p>` : ''}`
        : `<p class="hint">${t('waitHost')}</p>`}
        </div>
        <div class="set-r">
          <div class="cats-head"><span>${t('catsSummary', { a: sel.size, b: S.cats.length, q: totalQ })}</span>
            ${host ? `<span class="cat-btns"><button class="pillbtn on" id="cat-all">✓ ${t('all')}</button><button class="pillbtn" id="cat-none">✕ ${t('none')}</button></span>` : ''}</div>
          <div class="cats">
            ${S.cats.map(c => `<label class="cat"><input type="checkbox" data-cat="${c.id}" ${sel.has(c.id) ? 'checked' : ''} ${host ? '' : 'disabled'}><span>${esc(c.name)}</span><em>${c.n}</em></label>`).join('')}
          </div>
          ${t('qLang') ? `<p class="hint">${t('qLang')}</p>` : ''}
        </div>
      </section>
      ${host && S.reports ? `<section class="card repcard">
        <h2>${t('reports')} ${S.reports.length ? `<small>${S.reports.length}</small>` : ''}</h2>
        <p class="hint">${t('repHint')}</p>
        ${S.reports.length ? `<div class="reps">${S.reports.map(x => `<div class="rep ${x.banned ? 'off' : ''}">
          <div class="rep-h"><span class="chip dim">${esc(x.cat)}</span>${x.src ? `<code>${esc(x.src)}</code>` : ''}<small>${esc(x.ts)}</small></div>
          <div class="rep-q">${esc(x.q)}</div>
          <div class="rep-d">${t('repAns')} <b>${esc(x.a || '—')}</b>${x.given ? ` · ${t('repGiven')} <b class="bad">${esc(x.given)}</b>` : ''}${x.by ? ` · ${t('repBy')} ${esc(x.by)}` : ''}${x.banned ? ` · <em>${t('repOff')}</em>` : ''}</div>
          <div class="rep-b"><button class="pillbtn" data-repban="${x.id}">${x.banned ? t('repUnban') : t('repBan')}</button><button class="pillbtn" data-repdel="${x.id}">✕ ${t('repDel')}</button></div>
        </div>`).join('')}</div>` : `<p class="hint">${t('repEmpty')}</p>`}
      </section>` : ''}
    </div>
  </div>`;
  const cats = el.querySelector('.cats'); cats.scrollTop = sc;
  if (el.querySelector('.reps')) el.querySelector('.reps').scrollTop = rsc;
  const log = el.querySelector('.chat-log');
  if (chatBottom) log.scrollTop = log.scrollHeight;
  const inp = $('#chat-in');
  if (chatKeep) { inp.value = chatKeep.v; if (chatKeep.f) { inp.focus(); try { inp.setSelectionRange(chatKeep.s, chatKeep.s); } catch {} } }
  $('#chat-form').onsubmit = e => { e.preventDefault(); if (inp.value.trim()) { tx({ t: 'chat', text: inp.value }); inp.value = ''; } };
  el.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => tx({ t: 'chat', text: b.dataset.quick }));
  if ($('#change-char')) $('#change-char').onclick = () => openPicker(true);
  $('#lb-leave').onclick = () => { tx({ t: 'leave' }); goHome(); };
  $('#copy-link').onclick = () => { navigator.clipboard?.writeText(link).then(() => toast(t('linkCopied')), () => toast(link)); };
  if (!host) return;
  el.querySelectorAll('[data-repban]').forEach(b => b.onclick = () => tx({ t: 'repBan', id: b.dataset.repban }));
  el.querySelectorAll('[data-repdel]').forEach(b => b.onclick = () => tx({ t: 'repDel', id: b.dataset.repdel }));
  $('#add-bot').onclick = () => tx({ t: 'addBot', level: botLevel });
  $('#bot-level').onchange = e => { botLevel = e.target.value; };
  $('#open-gallery').onclick = openGallery;
  el.querySelectorAll('[data-botlv]').forEach(x => x.onchange = () => tx({ t: 'botLevel', id: x.dataset.botlv, level: x.value }));
  el.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => tx({ t: 'kick', id: b.dataset.kick }));
  const setS = s => tx({ t: 'settings', settings: s });
  el.querySelectorAll('.segc button').forEach(b => b.onclick = () => setS({ [b.parentNode.dataset.set]: +b.dataset.v }));
  $('#cat-all').onclick = () => setS({ categories: S.cats.map(c => c.id) });
  $('#cat-none').onclick = () => setS({ categories: [] });
  cats.onchange = () => setS({ categories: [...cats.querySelectorAll('input:checked')].map(i => i.dataset.cat) });
  $('#start').onclick = () => tx({ t: 'start' });
}

// szybkie reakcje w czacie poczekalni
const QUICK = ['👋 Siema!', '🔥 Gramy!', '😎 Gotowy', '⏳ Chwila', '😂', '🍀 Powodzenia', 'GG'];

// przełącznik segmentowy zamiast systemowej listy rozwijanej
function segCtl(key, vals, unit, on) {
  return `<div class="segc" role="radiogroup" data-set="${key}">${vals.map(v => `<button role="radio" aria-checked="${S.settings[key] === v}" class="${S.settings[key] === v ? 'on' : ''}" data-v="${v}" ${on ? '' : 'disabled'}>${v}${unit}</button>`).join('')}</div>`;
}

// ---------- galeria botów ----------
const BOT_LEVELS = ['slaby', 'latwy', 'sredni', 'trudny', 'mistrz'];
let botLevel = 'sredni';
function levelOpts(cur, long) {
  return BOT_LEVELS.map(l => `<option value="${l}" ${l === cur ? 'selected' : ''}>${long ? t('botLv', { lv: t('lv_' + l) }) : t('lv_' + l)}</option>`).join('');
}
function openGallery() { $('#gallery').classList.remove('hidden'); renderGallery(); }
function closeGallery() { $('#gallery').classList.add('hidden'); }
function renderGallery() {
  const el = $('#gallery');
  if (el.classList.contains('hidden')) return;
  if (!S || S.phase !== 'lobby' || S.hostId !== myId) return closeGallery();
  const used = new Set(S.players.map(p => p.gid).filter(Boolean)), full = S.players.length >= 10;
  const sc = (el.querySelector('.gal-body') || {}).scrollTop || 0;
  el.innerHTML = `<div class="gal card" role="dialog" aria-label="${t('gallery')}">
    <div class="gal-head"><h2>${t('gallery')} <small>${S.players.length}/10</small></h2>
      <label class="gal-lv">${t('level')} <select id="gal-level" class="inp">${levelOpts(botLevel)}</select></label>
      <button class="btn ghost" id="gal-close">${t('close')}</button></div>
    <p class="hint">${t('galHint')}</p>
    <div class="gal-body">${['friends', 'sport', 'music', 'world'].map(gr => `<h3>${t('g_' + gr)}</h3><div class="gal-grid">
      ${BOT_GALLERY.filter(b => b.group === gr).map(b => `<button class="gal-item ${used.has(b.id) ? 'used' : ''}" data-gid="${b.id}" ${used.has(b.id) || full ? 'disabled' : ''}>
        ${avatarSVG(b.avatar)}<b>${esc(b.name)}</b>${used.has(b.id) ? `<em>${t('inRoom')}</em>` : ''}</button>`).join('')}</div>`).join('')}</div></div>`;
  el.querySelector('.gal-body').scrollTop = sc;
  $('#gal-close').onclick = closeGallery;
  $('#gal-level').onchange = e => { botLevel = e.target.value; };
  el.querySelectorAll('[data-gid]').forEach(b => b.onclick = () => tx({ t: 'addBot', gid: b.dataset.gid, level: botLevel }));
}
$('#gallery').addEventListener('click', e => { if (e.target.id === 'gallery') closeGallery(); });

// ---------- wejście do studia: najazd kamery, odliczanie i muzyka ----------
let entering = false, introDone = false;
function fanfare() {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + 0.05;
    const note = (f, at, dur, type, vol) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g).connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
    };
    // bas i werbel pod odliczanie, potem fanfara na „START!”
    for (let i = 0; i < 12; i++) note(i % 4 === 0 ? 98 : 65, i * 0.175, 0.15, 'sawtooth', 0.07);
    [392, 440, 494].forEach((f, i) => { note(f, i * 0.7, 0.3, 'square', 0.06); note(f * 2, i * 0.7 + 0.35, 0.12, 'triangle', 0.05); });
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { note(f, 2.1 + i * 0.11, 0.28, 'triangle', 0.1); note(f / 2, 2.1 + i * 0.11, 0.28, 'square', 0.04); });
    note(1047, 2.9, 0.8, 'triangle', 0.1); note(1319, 2.9, 0.8, 'triangle', 0.08); note(1568, 2.9, 0.8, 'triangle', 0.07);
  } catch {}
}
function startIntro() {
  const world = $('#world'), st = $('#stage'), cd = $('#countdown'), num = cd.firstElementChild;
  const W = parseFloat(world.style.width) || 1800, vw = st.clientWidth, vh = st.clientHeight;
  // start z daleka, spod sufitu — potem kamera wjeżdża do sali
  entering = true;
  world.style.transition = 'none';
  world.style.transform = `translate(${vw / 2 - (W / 2) * 0.12}px, ${vh * 0.42 - 300 * 0.12}px) scale(0.12)`;
  cd.classList.remove('hidden', 'open');
  fanfare();
  const steps = ['3', '2', '1', t('go')];
  steps.forEach((txt, i) => setTimeout(() => {
    num.textContent = txt; num.className = i === 3 ? 'go' : '';
    void num.offsetWidth; num.classList.add('pop');
  }, i * 700));
  // po „3” wielkie drzwi studia się rozsuwają i kamera wjeżdża do środka
  setTimeout(() => {
    world.style.transition = 'transform 3.1s cubic-bezier(.3,.1,.2,1)';
    entering = false; camera();
  }, 60);
  setTimeout(() => cd.classList.add('open'), 400);
  setTimeout(() => { world.style.transition = ''; }, 3300);
  setTimeout(() => cd.classList.add('hidden'), 3000);
}

// ---------- scena ----------
const GAP = 225, WORLD_H = 760, FLOOR_Y = 640;
let pos = {};
function renderWorld() {
  const ps = S.players, n = ps.length, g = S.game;
  const W = Math.max(1800, n * GAP + 800);
  const world = $('#world');
  world.style.width = W + 'px'; world.style.height = WORLD_H + 'px';
  pos = {};
  const focus = focusId();
  const canPick = g.mode === 'nominate' && g.turn === myId;
  const pods = ps.map((p, i) => {
    // stanowiska stoją na łuku: środkowe są dalej od kamery (wyżej i mniejsze)
    const off = i - (n - 1) / 2, half = Math.max((n - 1) / 2, 1), depth = 1 - Math.pow(off / half, 2);
    const sc = n > 1 ? 1 - 0.13 * depth : 1;
    const x = W / 2 + off * GAP * (1 - 0.04 * depth), y = FLOOR_Y - 58 * (n > 1 ? depth : 0);
    pos[p.id] = { x, y: y - 250 * sc };
    const rv = g.reveal && g.reveal.pid === p.id ? g.reveal : null;
    const cls = ['pod', p.out ? 'out' : '', p.id === focus ? 'active' : '', p.id === myId ? 'me' : '', g.chooser === p.id ? 'chooser' : '',
      rv ? (rv.ok ? 'good' : 'bad') : '', canPick && !p.out && (p.id !== myId || g.allowSelf) ? 'pick' : '', !p.connected && !p.isBot ? 'off' : ''].join(' ');
    const lives = [0, 1, 2].map(k => `<i class="${k < p.lives ? 'on' : ''}"></i>`).join('');
    return `<div class="${cls}" style="left:${x}px;top:${y}px;--s:${sc.toFixed(3)};z-index:${20 - Math.round(depth * 10)}" data-id="${p.id}">
      ${rv ? `<div class="bubble">${rv.given ? esc(rv.given) : '…'}<b>${rv.ok ? '✓' : '✗'}</b></div>` : ''}
      ${g.mode === 'question' && g.turn === p.id ? '<div class="bubble think"><span></span><span></span><span></span></div>' : ''}
      <div class="fig">${avatarSVG(p.avatar)}</div>
      <div class="desk">
        <div class="mic"></div>
        <div class="top"></div>
        <div class="front">
          <div class="seat">${p.seat}</div>
          <div class="plate">
            <div class="nm">${esc(p.name)}${!p.connected && !p.isBot ? ` <small>(${t('offline')})</small>` : ''}</div>
            <div class="lives" aria-label="${t('chances', { n: p.lives })}">${lives}</div>
            ${g.stage === 3 && (!p.out || p.points > 0) ? `<div class="pts">${p.points} ${t('pts')}</div>` : ''}
          </div>
        </div>
        <div class="foot"></div>
      </div>
      <div class="glow"></div>
    </div>`;
  }).join('');
  const lamps = Array.from({ length: 11 }, (_, i) => `<div class="lamp" style="left:${(i + 0.5) / 11 * 100}%;--r:${(i - 5) * 4.5}deg"><i></i></div>`).join('');
  world.innerHTML = `
    <div class="bk">
      <div class="wall"></div>
      <div class="led side l"><i></i></div><div class="led side r"><i></i></div>
      <div class="led main"><span>Trzy</span><span class="logo-b">Szanse</span></div>
      <div class="arch a1"></div><div class="arch a2"></div>
      <div class="truss"></div>
      <div class="rig" style="width:${W}px;margin-left:${-W / 2}px">${lamps}</div>
      <div class="floor"><div class="grid"></div></div>
    </div>
    <div class="dais" style="left:${W / 2}px;top:${FLOOR_Y - 30}px;width:${n * GAP + 420}px"></div>${pods}`;
  camera();
}
function focusId() {
  const g = S.game;
  if (g.mode === 'question') return g.turn;
  if (g.mode === 'reveal') return g.reveal && g.reveal.pid;
  if (g.mode === 'end' && g.ranking && g.ranking[0]) return g.ranking[0].id;
  return null;
}
function camera() {
  if (!S || !S.game || entering) return;
  const st = $('#stage'), vw = st.clientWidth, vh = st.clientHeight;
  const panelH = $('#panel').offsetHeight || 220, freeH = Math.max(200, vh - panelH - 60);
  const n = S.players.length, W = parseFloat($('#world').style.width);
  const f = focusId();
  let s, cx, cy;
  if (f && pos[f]) {
    s = Math.max(0.5, Math.min(vw / (GAP * 2.5), freeH / 430, 2.1));
    cx = pos[f].x; cy = pos[f].y + 70;
  } else {
    s = Math.max(0.22, Math.min(vw / (n * GAP + 220), freeH / 560, 1.4));
    cx = W / 2; cy = FLOOR_Y - 270;
  }
  $('#world').style.transform = `translate(${vw / 2 - cx * s}px, ${60 + freeH / 2 - cy * s}px) scale(${s})`;
}
addEventListener('resize', camera);

$('#world').addEventListener('click', e => {
  const p = e.target.closest('.pod.pick'); if (p) tx({ t: 'nominate', id: p.dataset.id });
});

// ---------- panel pytań ----------
function renderGame() {
  const g = S.game, me = S.players.find(p => p.id === myId), byId = id => S.players.find(p => p.id === id);
  const stName = t('s' + g.stage), stDesc = t('s' + g.stage + 'd');
  $('#hud').innerHTML = `
    <div class="hud-l"><span class="logo tiny"><span>Trzy</span> <span class="logo-b">Szanse</span></span><span class="chip">${stName}</span>
      ${g.stage === 3 && g.mode !== 'end' ? `<span class="chip dim">${t('left', { n: g.finalLeft })}</span>` : ''}</div>
    <div class="hud-r">${amSpec ? `<span class="chip specchip">${ic('eye')} ${t('spectating')}</span>` : ''}${S.specs.length ? `<span class="chip dim" title="${esc(S.specs.map(x => x.name).join(', '))}">${ic('eye')} ${S.specs.length}</span>` : ''}<span class="chip dim roomchip">${t('room', { c: S.code })}</span>
      <button class="chip btnchip" id="hud-lang" aria-label="Język / Language">${LANG === 'pl' ? 'PL' : 'EN'}</button>
      <button class="chip btnchip" id="mute" aria-label="${t('sound')}">${ic(muted ? 'mute' : 'sound')}</button>
      ${fsBtn('chip btnchip')}
      <button class="chip btnchip quit ${quitArmed ? 'armed' : ''}" id="hud-quit" aria-label="${t('leaveGame')}">${quitArmed ? t('sure') : '⏏<span class="ql"> ' + t('leaveGame') + '</span>'}</button></div>`;
  $('#mute').onclick = () => { muted = !muted; store.set('ts-muted', muted); renderGame(); };
  $('#hud-quit').onclick = () => {
    // wyjście wymaga drugiego kliknięcia, żeby nie wypaść z gry przypadkiem
    if (!quitArmed) { quitArmed = true; renderGame(); clearTimeout(quitTimer); quitTimer = setTimeout(() => { quitArmed = false; if (S && S.game) renderGame(); }, 3000); return; }
    quitArmed = false; tx({ t: 'leave' }); goHome();
  };
  $('#hud-lang').onclick = toggleLang;
  const emoKey = LANG + (amSpec ? 's' : '');
  if (!$('#emotes').firstChild || $('#emotes').dataset.lang !== emoKey) { $('#emotes').innerHTML = amSpec ? '<span></span>' : `<button class="emo-btn" data-wheel>${emoBtnInner()}</button>`; $('#emotes').dataset.lang = emoKey; }

  const key = [g.stage, g.mode, g.turn, g.qnum, g.reveal && g.reveal.pid, S.phase, LANG].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const panel = $('#panel');
    const timer = '<div class="timer"><i id="tbar"></i></div>';
    const qbox = g.q ? `<div class="qcat">${esc(g.q.cat)}</div><div class="qtext">${esc(g.q.text)}</div>` : '';
    let h = '';
    if (g.mode === 'intro') {
      h = `<div class="intro"><h2>${stName}</h2><p>${stDesc}</p></div>${timer}`;
    } else if (g.mode === 'question') {
      const p = byId(g.turn), mine = g.turn === myId;
      h = `${qbox}<div class="who">${mine ? t('yourTurn') : t('answering') + ' <b>' + esc(p.name) + '</b>'}${g.kind === 'self' ? t('for20') : ''}</div>
        ${mine ? `<form id="ans-form" class="ans"><input id="ans" class="inp" maxlength="80" placeholder="${t('ansPh')}" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn primary">${t('submit')}</button></form>
          <div class="hint">${t('typoHint')}</div>` : ''}${timer}`;
    } else if (g.mode === 'buzz') {
      h = `${qbox}${me && !me.out ? `<button class="btn primary big buzz" id="buzz">${t('buzz')} <kbd>${t('space')}</kbd></button>` : `<div class="who">${t('whoFirst')}</div>`}${timer}`;
    } else if (g.mode === 'reveal') {
      const r = g.reveal, p = r.pid && byId(r.pid);
      h = `${qbox}<div class="verdict ${r.ok ? 'good' : 'bad'}">
        ${p ? `<span class="vmark">${r.ok ? t('good') : t('bad')}</span> <span>${esc(p.name)}: <b>${r.given ? esc(r.given) : t('noAnswer')}</b></span>` : `<span class="vmark">${t('nobody')}</span>`}
        ${!r.ok ? `<span class="correct">${t('correct')} <b>${esc(r.answer)}</b></span>` : ''}
        ${r.gained ? `<span class="correct">+${r.gained} ${t('pts')}</span>` : ''}
        ${r.eliminated ? `<span class="elim">${esc(t('out', { name: p.name }))}</span>` : ''}</div>`;
    } else if (g.mode === 'nominate') {
      const p = byId(g.turn), mine = g.turn === myId;
      const targets = S.players.filter(x => !x.out && x.id !== g.turn);
      h = mine ? `<div class="who big">${t('pick')}</div><div class="targets">
          ${g.allowSelf ? `<button class="btn primary" data-t="${myId}">${t('self20')}</button>` : ''}
          ${targets.map(x => `<button class="btn" data-t="${x.id}">${x.seat}. ${esc(x.name)} <small>${'◆'.repeat(x.lives)}</small></button>`).join('')}</div>${timer}`
        : `<div class="who big"><b>${esc(p.name)}</b> ${t('picking')}</div>${timer}`;
    } else if (g.mode === 'end') {
      const host = S.hostId === myId, w = g.ranking[0] && byId(g.ranking[0].id);
      const stats = g.stats || { awards: [], table: [] }, row = id => stats.table.find(x => x.id === id);
      const awVal = a => a.k === 'most' ? `${a.v} ✓ · ${a.bad} ✗` : a.k === 'fast' ? `${(a.v / 1000).toFixed(1)} s` : a.k === 'streak' ? `${a.v} ${t('inRow')}` : `${a.v}%`;
      const awards = stats.awards.filter(a => byId(a.id)).map(a => { const p = byId(a.id); return `<div class="aw" ${a.q ? `title="${esc(a.q)}"` : ''}>
        ${avatarSVG(p.avatar)}<div><small>${t('aw_' + a.k)}</small><b>${esc(p.name)}</b><span>${awVal(a)}</span></div></div>`; }).join('');
      h = `<div class="end"><h2>${ic('trophy')}${esc(t('wins', { name: w ? w.name : '—' }))}</h2><div class="end-cols"><ol class="rank">
        ${g.ranking.map((r, i) => { const p = byId(r.id), st = row(r.id); return `<li class="${r.id === myId ? 'me' : ''}"><span class="rk">${i + 1}</span>${avatarSVG(p.avatar)}<span class="rn">${esc(p.name)}</span><span class="okbad">${st ? `<i class="g">${st.ok}✓</i> <i class="b">${st.bad}✗</i>` : ''}</span><span class="rs">${r.score != null ? r.score + ' ' + t('pts') : r.out ? t('eliminated') : ''}</span></li>`; }).join('')}
        </ol>${awards ? `<div class="awards"><h3>${t('stats')}</h3>${awards}</div>` : ''}</div>
        <div class="end-btns">${host ? `<button class="btn primary" id="again">${t('backLobby')}</button>` : `<span class="hint">${amSpec ? t('specNext') : t('hostAgain')}</span>`}<button class="btn ghost" id="quit">${t('leave')}</button></div></div>`;
    }
    if (g.q && g.mode !== 'intro') h += `<button class="report" id="report" ${reportedQ === g.qnum ? 'disabled' : ''}>${reportedQ === g.qnum ? t('reported') : ic('flag') + t('report')}</button>`;
    panel.innerHTML = h;
    if ($('#report')) $('#report').onclick = e => { reportedQ = g.qnum; tx({ t: 'report' }); e.currentTarget.disabled = true; e.currentTarget.textContent = t('reported'); };
    const f = $('#ans-form');
    if (f) { f.onsubmit = e => { e.preventDefault(); tx({ t: 'answer', text: $('#ans').value }); }; setTimeout(() => $('#ans') && $('#ans').focus(), 50); }
    // na telefonie zgłoszenie leci już przy dotknięciu ekranu, bez czekania na puszczenie palca
    if ($('#buzz')) { $('#buzz').onpointerdown = e => { e.preventDefault(); tx({ t: 'buzz' }); }; $('#buzz').onclick = () => tx({ t: 'buzz' }); }
    panel.querySelectorAll('[data-t]').forEach(b => b.onclick = () => tx({ t: 'nominate', id: b.dataset.t }));
    if ($('#again')) $('#again').onclick = () => tx({ t: 'again' });
    if ($('#quit')) $('#quit').onclick = () => { tx({ t: 'leave' }); goHome(); };

    const skey = key.replace(/\|(pl|en)$/, '');
    if (skey !== lastSoundKey) {
      lastSoundKey = skey;
      if (g.mode === 'reveal') g.reveal.ok ? beep([660, 880, 1175], 0.11) : beep([220, 165], 0.22, 'sawtooth');
      else if (g.mode === 'question' && g.turn === myId) { beep([880], 0.1); try { navigator.vibrate && navigator.vibrate(80); } catch {} }
      else if (g.mode === 'intro') beep([392, 523, 659, 784], 0.14, 'triangle');
      else if (g.mode === 'end') beep([523, 659, 784, 1047, 1319], 0.16, 'triangle');
    }
  }
  renderWorld();
  if (!introDone && g.stage === 1 && g.mode === 'intro') { introDone = true; gameSeq++; if (g.timeLeft > 2800) startIntro(); }
  recordStats(g);
}
addEventListener('keydown', e => {
  if (e.code === 'Space' && S && S.game && S.game.mode === 'buzz' && $('#buzz')) { e.preventDefault(); tx({ t: 'buzz' }); }
});
(function tick() {
  const b = $('#tbar');
  if (b && total) {
    const left = Math.max(0, deadline - performance.now());
    b.style.width = (left / total * 100) + '%';
    b.classList.toggle('low', left < 5000);
  }
  requestAnimationFrame(tick);
})();

// ---------- profil gracza: statystyki zapisywane w tej przeglądarce ----------
let gameSeq = 0, statKeys = new Set();
const PROF0 = () => ({ games: 0, wins: 0, finals: 0, ok: 0, bad: 0, best: 0, cats: {}, recent: [] });
function recordStats(g) {
  if (amSpec || !gameSeq) return;
  const P = Object.assign(PROF0(), store.get('ts-profile', {}));
  let changed = false;
  if (g.mode === 'reveal' && g.reveal && g.reveal.pid === myId && g.q) {
    const k = gameSeq + ':' + g.qnum;
    if (!statKeys.has(k)) {
      statKeys.add(k); changed = true;
      g.reveal.ok ? P.ok++ : P.bad++;
      const c = P.cats[g.q.cat] || (P.cats[g.q.cat] = [0, 0]);
      c[1]++; if (g.reveal.ok) c[0]++;
    }
  }
  if (g.mode === 'end' && g.ranking && !statKeys.has('end' + gameSeq)) {
    statKeys.add('end' + gameSeq); changed = true;
    const i = g.ranking.findIndex(r => r.id === myId), me = g.ranking[i];
    if (me) {
      P.games++;
      if (i === 0) P.wins++;
      if (me.score != null) { P.finals++; P.best = Math.max(P.best, me.score); }
      P.recent.unshift({ d: new Date().toISOString().slice(0, 10), place: i + 1, of: g.ranking.length, score: me.score });
      P.recent = P.recent.slice(0, 10);
    }
  }
  if (changed) store.set('ts-profile', P);
}
function openProfile() {
  const P = Object.assign(PROF0(), store.get('ts-profile', {})), el = $('#profile');
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const cats = Object.entries(P.cats).filter(([, v]) => v[1] >= 3).map(([n, v]) => ({ n, p: pct(v[0], v[1]), t: v[1] })).sort((a, b) => b.p - a.p || b.t - a.t);
  const tile = (i, v, l, c) => `<div class="pf-t ${c}"><i>${ic(i)}</i><b>${v}</b><small>${l}</small></div>`;
  const catRow = (c, cl) => `<div class="pf-c ${cl}"><span>${esc(c.n)}</span><b>${c.p}%</b><u><s style="width:${Math.max(c.p, 3)}%"></s></u></div>`;
  const acc = pct(P.ok, P.ok + P.bad);
  el.innerHTML = `<div class="gal card pf" role="dialog" aria-label="${t('myProfile')}">
    <div class="gal-head"><h2>${t('myProfile')}</h2><button class="btn primary" id="pf-close">${t('close')}</button></div>
    <div class="gal-body">
    <div class="pf-top"><div class="pf-av">${avatarSVG(avatar)}</div>
      <div class="pf-id"><div class="pf-name">${esc(myName())}</div><div class="hint">${t('pfLocal')}</div></div>
      ${P.ok + P.bad ? `<div class="pf-ring" style="--p:${acc}"><b>${acc}%</b><small>${t('pfAcc')}</small></div>` : ''}</div>
    ${P.games || P.ok + P.bad ? `<div class="pf-tiles">
      ${tile('play', P.games, t('pfGames'), 't-teal')}${tile('trophy', P.wins, t('pfWins'), 't-gold')}${tile('percent', pct(P.wins, P.games) + '%', t('pfWinRate'), 't-gold')}
      ${tile('star', P.finals, t('pfFinals'), 't-pink')}${tile('check', P.ok, t('pfAcc'), 't-teal')}${tile('bolt', P.best, t('pfBest'), 't-pink')}</div>
    ${cats.length ? `<div class="pf-cats"><div><h3>${t('pfBestCat')}</h3>${cats.slice(0, 3).map(c => catRow(c, 'up')).join('')}</div>
      ${cats.length > 3 ? `<div><h3>${t('pfWorstCat')}</h3>${cats.slice(-3).reverse().map(c => catRow(c, 'dn')).join('')}</div>` : ''}</div>` : ''}
    ${P.recent.length ? `<h3>${t('pfRecent')}</h3><ol class="pf-rec">${P.recent.map(r => `<li class="${r.place === 1 ? 'won' : ''}"><i>${r.place}</i><span>${t('pfPlace', { p: r.place, n: r.of })}<small>${r.d}</small></span><b>${r.score != null ? r.score + ' ' + t('pts') : '—'}</b></li>`).join('')}</ol>` : ''}
    <button class="btn ghost" id="pf-reset">${t('pfReset')}</button>` : `<div class="pf-empty"><i>${ic('stats')}</i><p>${t('pfEmpty')}</p></div>`}
    </div>
  </div>`;
  el.classList.remove('hidden');
  $('#pf-close').onclick = () => el.classList.add('hidden');
  if ($('#pf-reset')) $('#pf-reset').onclick = e => {
    if (e.target.dataset.sure) { store.set('ts-profile', PROF0()); openProfile(); }
    else { e.target.dataset.sure = 1; e.target.textContent = t('sure'); }
  };
}
$('#btn-profile').onclick = openProfile;
$('#profile').addEventListener('click', e => { if (e.target.id === 'profile') $('#profile').classList.add('hidden'); });

// ---------- start ----------
applyStatic();
show('home');
const urlCode = (new URLSearchParams(location.search).get('pokoj') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
if (sess && (!urlCode || urlCode === sess.code)) connect({ t: 'rejoin', ...sess });
else if (urlCode) { sess = null; sstore.set(null); $('#code').value = urlCode; $('#home').classList.add('invited'); }
