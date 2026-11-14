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

let ws = null, S = null, myId = null, sess = sstore.get();
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

// ---------- język ----------
function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
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
function emoteBarHTML() {
  return EMOTES.map((e, i) => `<button class="emo" data-emote="${i}" aria-label="${t('emotes')} ${e}">${e}</button>`).join('');
}
function setEmoteMenu(open) {
  $('#emotes').classList.toggle('open', open);
  const tg = $('#emo-toggle'); if (tg) tg.setAttribute('aria-expanded', open);
}
document.addEventListener('click', e => {
  // menu emotek w grze: rozwija się przyciskiem, zwija po wyborze albo kliknięciu obok
  if (e.target.closest('#emo-toggle')) return setEmoteMenu(!$('#emotes').classList.contains('open'));
  if (!e.target.closest('#emotes .emo-list') || e.target.closest('[data-emote]')) setEmoteMenu(false);
  const b = e.target.closest('[data-emote]'); if (!b) return;
  if (S) tx({ t: 'emote', e: +b.dataset.emote }); else playEmote('preview', +b.dataset.emote);
});
function emoteTarget(id) {
  if (id === 'preview') return $('#av-preview');
  return document.querySelector(`#lobby:not(.hidden) .pl[data-pid="${id}"], #game:not(.hidden) .pod[data-id="${id}"]`);
}
function paintEmote(id) {
  const a = activeEmotes[id], el = emoteTarget(id);
  if (!a || !el || el.classList.contains('emo-' + a.e)) return;
  el.classList.add('emoting', 'emo-' + a.e);
  const b = document.createElement('div'); b.className = 'emoji'; b.textContent = EMOTES[a.e]; el.appendChild(b);
}
function clearEmote(id) {
  const el = emoteTarget(id);
  if (el) { el.className = el.className.replace(/\s*\bemo(ting|-\d)\b/g, ''); el.querySelectorAll('.emoji').forEach(x => x.remove()); }
  delete activeEmotes[id];
}
function playEmote(id, e) {
  if (activeEmotes[id]) { clearTimeout(activeEmotes[id].timer); clearEmote(id); }
  activeEmotes[id] = { e, timer: setTimeout(() => clearEmote(id), 2400) };
  paintEmote(id);
}
const repaintEmotes = () => Object.keys(activeEmotes).forEach(paintEmote);

// ---------- ekran startowy ----------
function renderEditor() {
  $('#av-preview').innerHTML = avatarSVG(avatar) + `<div class="try emotebar">${emoteBarHTML()}</div>`;
  $('#av-parts').innerHTML = AV_PARTS.map(k => {
    const label = t('p_' + k);
    return `<div class="part"><button class="arrow" data-k="${k}" data-d="-1" aria-label="${label}: ${t('prev')}">‹</button><span>${label} <em>${(avatar[k] || 0) + 1}/${avCount(k)}</em></span><button class="arrow" data-k="${k}" data-d="1" aria-label="${label}: ${t('next')}">›</button></div>`;
  }).join('');
}
$('#av-parts').addEventListener('click', e => {
  const b = e.target.closest('.arrow'); if (!b) return;
  const k = b.dataset.k, n = avCount(k);
  avatar[k] = ((avatar[k] || 0) + (+b.dataset.d) + n) % n;
  store.set('ts-avatar2', avatar); renderEditor();
});
$('#btn-random').onclick = () => { avatar = avRandom(); store.set('ts-avatar2', avatar); renderEditor(); };
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
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.t === 'joined') {
      sess = { code: m.code, id: m.id, secret: m.secret }; sstore.set(sess); myId = m.id;
      history.replaceState(null, '', '?pokoj=' + m.code);
    } else if (m.t === 'state') {
      S = m.s; myId = m.you;
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
    toast(t('reconnecting'));
    setTimeout(() => { if (sess) connect({ t: 'rejoin', ...sess }); }, 1500);
  };
}
const tx = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
function goHome() {
  sess = null; sstore.set(null); S = null;
  if (ws) { ws.onclose = null; ws.close(); }
  history.replaceState(null, '', location.pathname); show('home');
}

function render() {
  if (!S) return show('home');
  if (S.phase === 'lobby') { show('lobby'); renderLobby(); panelKey = ''; }
  else { show('game'); renderGame(); }
  repaintEmotes();
}

// ---------- poczekalnia ----------
function renderLobby() {
  const host = S.hostId === myId, el = $('#lobby');
  const link = location.origin + '/?pokoj=' + S.code;
  const sc = (el.querySelector('.cats') || {}).scrollTop || 0;
  const sel = new Set(S.settings.categories);
  const totalQ = S.cats.filter(c => sel.has(c.id)).reduce((s, c) => s + c.n, 0);
  el.innerHTML = `
  <div class="lobby-wrap">
    <div class="lobby-head">
      <h1 class="logo small"><span>Trzy</span> <span class="logo-b">Szanse</span></h1>
      <button class="btn ghost" id="lb-leave">${t('leave')}</button>
    </div>
    <div class="lobby-grid">
      <section class="card">
        <h2>${t('players')} <small>${S.players.length}/10</small></h2>
        <div class="plist">
          ${S.players.map((p, i) => `
            <div class="pl ${p.id === myId ? 'me' : ''}" data-pid="${p.id}">
              ${avatarSVG(p.avatar)}
              <div class="pl-name">${esc(p.name)}</div>
              <div class="pl-sub">${p.isBot ? t('bot') + ' · ' + t('lv_' + p.level) : p.id === S.hostId ? t('host') : t('seat', { n: i + 1 })}</div>
              ${host && p.id !== myId ? `<button class="x" data-kick="${p.id}" aria-label="${esc(t('remove', { name: p.name }))}">×</button>` : ''}
            </div>`).join('')}
        </div>
        <div class="emo-row"><span class="lbl">${t('emotes')}</span><div class="emotebar">${emoteBarHTML()}</div></div>
        ${host ? `
        <div class="botrow">
          <select id="bot-level" class="inp">${['latwy', 'sredni', 'trudny'].map(l => `<option value="${l}" ${l === 'sredni' ? 'selected' : ''}>${t('botLv', { lv: t('lv_' + l) })}</option>`).join('')}</select>
          <button class="btn" id="add-bot" ${S.players.length >= 10 ? 'disabled' : ''}>${t('addBot')}</button>
        </div>` : ''}
      </section>
      <section class="card">
        <h2>${t('invite')}</h2>
        <div class="invite">
          <div class="bigcode" aria-label="${t('roomCode')}">${S.code}</div>
          <button class="btn" id="copy-link">${t('copyLink')}</button>
        </div>
        <div class="linktxt">${esc(link)}</div>
        <h2>${t('settings')} ${host ? '' : `<small>${t('hostSets')}</small>`}</h2>
        <div class="setrow">
          <label>${t('answerTime')}
            <select id="set-time" class="inp" ${host ? '' : 'disabled'}>${[15, 25, 40, 60].map(v => `<option value="${v}" ${S.settings.answerTime === v ? 'selected' : ''}>${v} s</option>`).join('')}</select>
          </label>
          <label>${t('finalQs')}
            <select id="set-final" class="inp" ${host ? '' : 'disabled'}>${[10, 15, 20, 30, 40, 50].map(v => `<option value="${v}" ${S.settings.finalQuestions === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </label>
        </div>
        <div class="cats-head"><span>${t('catsSummary', { a: sel.size, b: S.cats.length, q: totalQ })}</span>
          ${host ? `<span><button class="lnk" id="cat-all">${t('all')}</button> · <button class="lnk" id="cat-none">${t('none')}</button></span>` : ''}</div>
        <div class="cats">
          ${S.cats.map(c => `<label class="cat"><input type="checkbox" data-cat="${c.id}" ${sel.has(c.id) ? 'checked' : ''} ${host ? '' : 'disabled'}><span>${esc(c.name)}</span><em>${c.n}</em></label>`).join('')}
        </div>
        ${t('qLang') ? `<p class="hint">${t('qLang')}</p>` : ''}
        ${host ? `<button class="btn primary big" id="start" ${S.players.length < 2 ? 'disabled' : ''}>${t('start')}</button>
          ${S.players.length < 2 ? `<p class="hint">${t('need2hint')}</p>` : ''}`
      : `<p class="hint">${t('waitHost')}</p>`}
      </section>
    </div>
  </div>`;
  const cats = el.querySelector('.cats'); cats.scrollTop = sc;
  $('#lb-leave').onclick = () => { tx({ t: 'leave' }); goHome(); };
  $('#copy-link').onclick = () => { navigator.clipboard?.writeText(link).then(() => toast(t('linkCopied')), () => toast(link)); };
  if (!host) return;
  $('#add-bot').onclick = () => tx({ t: 'addBot', level: $('#bot-level').value });
  el.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => tx({ t: 'kick', id: b.dataset.kick }));
  const setS = s => tx({ t: 'settings', settings: s });
  $('#set-time').onchange = e => setS({ answerTime: +e.target.value });
  $('#set-final').onchange = e => setS({ finalQuestions: +e.target.value });
  $('#cat-all').onclick = () => setS({ categories: S.cats.map(c => c.id) });
  $('#cat-none').onclick = () => setS({ categories: [] });
  cats.onchange = () => setS({ categories: [...cats.querySelectorAll('input:checked')].map(i => i.dataset.cat) });
  $('#start').onclick = () => tx({ t: 'start' });
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
            ${g.stage === 3 && !p.out ? `<div class="pts">${p.points} ${t('pts')}</div>` : ''}
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
  if (!S || !S.game) return;
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
    <div class="hud-r"><span class="chip dim">${t('room', { c: S.code })}</span>
      <button class="chip btnchip" id="hud-lang" aria-label="Język / Language">${LANG === 'pl' ? 'PL' : 'EN'}</button>
      <button class="chip btnchip" id="mute" aria-label="${t('sound')}">${muted ? '🔇' : '🔊'}</button></div>`;
  $('#mute').onclick = () => { muted = !muted; store.set('ts-muted', muted); renderGame(); };
  $('#hud-lang').onclick = toggleLang;
  if (!$('#emotes').firstChild || $('#emotes').dataset.lang !== LANG) { $('#emotes').innerHTML = `<button class="emo emo-toggle" id="emo-toggle" aria-expanded="false" aria-label="${t('emotes')}">😀</button><div class="emo-list">${emoteBarHTML()}</div>`; $('#emotes').dataset.lang = LANG; $('#emotes').classList.remove('open'); }

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
      h = `<div class="end"><h2>${esc(t('wins', { name: w ? w.name : '—' }))}</h2><ol class="rank">
        ${g.ranking.map((r, i) => { const p = byId(r.id); return `<li class="${r.id === myId ? 'me' : ''}"><span class="rk">${i + 1}</span>${avatarSVG(p.avatar)}<span class="rn">${esc(p.name)}</span><span class="rs">${r.score != null ? r.score + ' ' + t('pts') : r.out ? t('eliminated') : ''}</span></li>`; }).join('')}
        </ol><div class="end-btns">${host ? `<button class="btn primary" id="again">${t('backLobby')}</button>` : `<span class="hint">${t('hostAgain')}</span>`}<button class="btn ghost" id="quit">${t('leave')}</button></div></div>`;
    }
    panel.innerHTML = h;
    const f = $('#ans-form');
    if (f) { f.onsubmit = e => { e.preventDefault(); tx({ t: 'answer', text: $('#ans').value }); }; setTimeout(() => $('#ans') && $('#ans').focus(), 50); }
    if ($('#buzz')) $('#buzz').onclick = () => tx({ t: 'buzz' });
    panel.querySelectorAll('[data-t]').forEach(b => b.onclick = () => tx({ t: 'nominate', id: b.dataset.t }));
    if ($('#again')) $('#again').onclick = () => tx({ t: 'again' });
    if ($('#quit')) $('#quit').onclick = goHome;

    const skey = key.replace(/\|(pl|en)$/, '');
    if (skey !== lastSoundKey) {
      lastSoundKey = skey;
      if (g.mode === 'reveal') g.reveal.ok ? beep([660, 880, 1175], 0.11) : beep([220, 165], 0.22, 'sawtooth');
      else if (g.mode === 'question' && g.turn === myId) beep([880], 0.1);
      else if (g.mode === 'intro') beep([392, 523, 659, 784], 0.14, 'triangle');
      else if (g.mode === 'end') beep([523, 659, 784, 1047, 1319], 0.16, 'triangle');
    }
  }
  renderWorld();
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

// ---------- start ----------
applyStatic();
show('home');
const urlCode = (new URLSearchParams(location.search).get('pokoj') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
if (sess && (!urlCode || urlCode === sess.code)) connect({ t: 'rejoin', ...sess });
else if (urlCode) { sess = null; sstore.set(null); $('#code').value = urlCode; $('#home').classList.add('invited'); }
