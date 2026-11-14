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
let avatar = store.get('ts-avatar', null) || avRandom();
let deadline = 0, total = 0, panelKey = '', lastSoundKey = '', muted = store.get('ts-muted', false);
const LEVEL_NAMES = { latwy: 'łatwy', sredni: 'średni', trudny: 'trudny' };
const STAGES = {
  1: ['Etap 1 — Rozgrzewka', 'Każdy dostaje dwa pytania. Błąd kosztuje szansę, a dwie pomyłki oznaczają koniec gry.'],
  2: ['Etap 2 — Wyznaczanie', 'Dobra odpowiedź daje prawo wskazania, kto odpowiada następny. Gramy, aż zostanie trójka.'],
  3: ['Finał', 'Pytania dla wszystkich — kto pierwszy się zgłosi, ten odpowiada. 10 pkt za odpowiedź, po trzech trafieniach wyznaczasz lub bierzesz pytanie na siebie za 20 pkt.'],
};

// ---------- dźwięki ----------
let actx = null;
function beep(freqs, dur = 0.12, type = 'sine') {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch {}
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3500);
}
function show(id) { for (const s of ['home', 'lobby', 'game']) $('#' + s).classList.toggle('hidden', s !== id); }

// ---------- ekran startowy ----------
function renderEditor() {
  $('#av-preview').innerHTML = avatarSVG(avatar);
  $('#av-parts').innerHTML = AV_PARTS.map(([k, label]) =>
    `<div class="part"><button class="arrow" data-k="${k}" data-d="-1" aria-label="${label}: poprzedni">‹</button><span>${label}</span><button class="arrow" data-k="${k}" data-d="1" aria-label="${label}: następny">›</button></div>`).join('');
}
$('#av-parts').addEventListener('click', e => {
  const b = e.target.closest('.arrow'); if (!b) return;
  const k = b.dataset.k, n = avCount(k);
  avatar[k] = ((avatar[k] || 0) + (+b.dataset.d) + n) % n;
  store.set('ts-avatar', avatar); renderEditor();
});
$('#btn-random').onclick = () => { avatar = avRandom(); store.set('ts-avatar', avatar); renderEditor(); };
$('#name').value = store.get('ts-name', '');
$('#name').oninput = e => store.set('ts-name', e.target.value);
$('#code').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); };
const myName = () => $('#name').value.trim() || 'Gracz';
$('#btn-create').onclick = () => connect({ t: 'create', name: myName(), avatar });
$('#btn-join').onclick = () => {
  const code = $('#code').value.trim();
  if (code.length !== 5) return toast('Kod pokoju ma 5 liter.');
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
    } else if (m.t === 'error') {
      toast(m.msg);
      if (m.fatal) { sess = null; sstore.set(null); S = null; show('home'); }
    }
  };
  ws.onclose = () => {
    if (!sess) return;
    toast('Utracono połączenie — łączę ponownie…');
    setTimeout(() => { if (sess) connect({ t: 'rejoin', ...sess }); }, 1500);
  };
}
const tx = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };

function render() {
  if (!S) return show('home');
  if (S.phase === 'lobby') { show('lobby'); renderLobby(); panelKey = ''; }
  else { show('game'); renderGame(); }
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
      <button class="btn ghost" id="lb-leave">Wyjdź</button>
    </div>
    <div class="lobby-grid">
      <section class="card">
        <h2>Uczestnicy <small>${S.players.length}/10</small></h2>
        <div class="plist">
          ${S.players.map((p, i) => `
            <div class="pl ${p.id === myId ? 'me' : ''}">
              ${avatarSVG(p.avatar)}
              <div class="pl-name">${esc(p.name)}</div>
              <div class="pl-sub">${p.isBot ? 'bot · ' + LEVEL_NAMES[p.level] : p.id === S.hostId ? 'gospodarz' : 'stanowisko ' + (i + 1)}</div>
              ${host && p.id !== myId ? `<button class="x" data-kick="${p.id}" aria-label="Usuń ${esc(p.name)}">×</button>` : ''}
            </div>`).join('')}
        </div>
        ${host ? `
        <div class="botrow">
          <select id="bot-level" class="inp"><option value="latwy">Bot łatwy</option><option value="sredni" selected>Bot średni</option><option value="trudny">Bot trudny</option></select>
          <button class="btn" id="add-bot" ${S.players.length >= 10 ? 'disabled' : ''}>+ Dodaj bota</button>
        </div>` : ''}
      </section>
      <section class="card">
        <h2>Zaproś znajomych</h2>
        <div class="invite">
          <div class="bigcode" aria-label="Kod pokoju">${S.code}</div>
          <button class="btn" id="copy-link">Kopiuj link</button>
        </div>
        <div class="linktxt">${esc(link)}</div>
        <h2>Ustawienia ${host ? '' : '<small>ustawia gospodarz</small>'}</h2>
        <div class="setrow">
          <label>Czas na odpowiedź
            <select id="set-time" class="inp" ${host ? '' : 'disabled'}>${[15, 25, 40, 60].map(v => `<option value="${v}" ${S.settings.answerTime === v ? 'selected' : ''}>${v} s</option>`).join('')}</select>
          </label>
          <label>Pytań w finale
            <select id="set-final" class="inp" ${host ? '' : 'disabled'}>${[10, 15, 20, 30].map(v => `<option value="${v}" ${S.settings.finalQuestions === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </label>
        </div>
        <div class="cats-head"><span>Kategorie: ${sel.size}/${S.cats.length} · ${totalQ} pytań</span>
          ${host ? '<span><button class="lnk" id="cat-all">wszystkie</button> · <button class="lnk" id="cat-none">żadna</button></span>' : ''}</div>
        <div class="cats">
          ${S.cats.map(c => `<label class="cat"><input type="checkbox" data-cat="${c.id}" ${sel.has(c.id) ? 'checked' : ''} ${host ? '' : 'disabled'}><span>${esc(c.name)}</span><em>${c.n}</em></label>`).join('')}
        </div>
        ${host ? `<button class="btn primary big" id="start" ${S.players.length < 2 ? 'disabled' : ''}>Rozpocznij grę</button>
          ${S.players.length < 2 ? '<p class="hint">Zaproś znajomego albo dodaj bota — potrzeba co najmniej 2 uczestników.</p>' : ''}`
      : '<p class="hint">Czekamy, aż gospodarz rozpocznie grę…</p>'}
      </section>
    </div>
  </div>`;
  const cats = el.querySelector('.cats'); cats.scrollTop = sc;
  $('#lb-leave').onclick = leave;
  $('#copy-link').onclick = () => { navigator.clipboard?.writeText(link).then(() => toast('Link skopiowany — wyślij go znajomym.'), () => toast(link)); };
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
function leave() {
  tx({ t: 'leave' }); sess = null; sstore.set(null); S = null;
  if (ws) { ws.onclose = null; ws.close(); }
  history.replaceState(null, '', location.pathname); show('home');
}

// ---------- scena ----------
const GAP = 215, WORLD_H = 720, FLOOR_Y = 600;
let pos = {};
function renderWorld() {
  const ps = S.players, n = ps.length, g = S.game;
  const W = Math.max(1500, n * GAP + 600);
  const world = $('#world');
  world.style.width = W + 'px'; world.style.height = WORLD_H + 'px';
  pos = {};
  const focus = focusId();
  const canPick = g.mode === 'nominate' && g.turn === myId;
  const pods = ps.map((p, i) => {
    const off = i - (n - 1) / 2, half = Math.max((n - 1) / 2, 1);
    const x = W / 2 + off * GAP, y = FLOOR_Y - 26 + Math.pow(off / half, 2) * 26;
    pos[p.id] = { x, y: y - 170 };
    const rv = g.reveal && g.reveal.pid === p.id ? g.reveal : null;
    const cls = ['pod', p.out ? 'out' : '', p.id === focus ? 'active' : '', p.id === myId ? 'me' : '', g.chooser === p.id ? 'chooser' : '',
      rv ? (rv.ok ? 'good' : 'bad') : '', canPick && !p.out && (p.id !== myId || g.allowSelf) ? 'pick' : '', !p.connected && !p.isBot ? 'off' : ''].join(' ');
    const lives = [0, 1, 2].map(k => `<i class="${k < p.lives ? 'on' : ''}"></i>`).join('');
    return `<div class="${cls}" style="left:${x}px;top:${y}px" data-id="${p.id}">
      ${rv ? `<div class="bubble">${rv.given ? esc(rv.given) : '…'}<b>${rv.ok ? '✓' : '✗'}</b></div>` : ''}
      ${g.mode === 'question' && g.turn === p.id ? '<div class="bubble think"><span></span><span></span><span></span></div>' : ''}
      <div class="fig">${avatarSVG(p.avatar)}</div>
      <div class="desk">
        <div class="seat">${p.seat}</div>
        <div class="nm">${esc(p.name)}</div>
        <div class="lives" aria-label="Szanse: ${p.lives}">${lives}</div>
        ${g.stage === 3 && !p.out ? `<div class="pts">${p.points} pkt</div>` : ''}
      </div>
    </div>`;
  }).join('');
  const beams = Array.from({ length: 9 }, (_, i) => `<div class="beam" style="left:${(i + 0.5) / 9 * 100}%;--r:${(i - 4) * 5}deg"></div>`).join('');
  world.innerHTML = `
    <div class="bk"><div class="bk-wall"></div>${beams}
      <div class="bk-screen"><span>Trzy</span><span class="logo-b">Szanse</span></div>
      <div class="bk-arch a1"></div><div class="bk-arch a2"></div>
      <div class="bk-floor"></div>
    </div>${pods}`;
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
  const panelH = $('#panel').offsetHeight || 220, freeH = Math.max(200, vh - panelH - 50);
  const n = S.players.length, W = parseFloat($('#world').style.width);
  const f = focusId();
  let s, cx, cy;
  if (f && pos[f]) {
    s = Math.max(0.55, Math.min(vw / (GAP * 2.6), freeH / 390, 2.2));
    cx = pos[f].x; cy = pos[f].y + 55;
  } else {
    s = Math.max(0.25, Math.min(vw / (n * GAP + 160), freeH / 470, 1.5));
    cx = W / 2; cy = FLOOR_Y - 215;
  }
  const txx = vw / 2 - cx * s, tyy = 50 + freeH / 2 - cy * s;
  $('#world').style.transform = `translate(${txx}px, ${tyy}px) scale(${s})`;
}
addEventListener('resize', camera);

$('#world').addEventListener('click', e => {
  const p = e.target.closest('.pod.pick'); if (p) tx({ t: 'nominate', id: p.dataset.id });
});

// ---------- panel pytań ----------
function renderGame() {
  const g = S.game, me = S.players.find(p => p.id === myId), byId = id => S.players.find(p => p.id === id);
  const st = STAGES[g.stage] || ['', ''];
  $('#hud').innerHTML = `
    <div class="hud-l"><span class="logo tiny"><span>Trzy</span> <span class="logo-b">Szanse</span></span><span class="chip">${st[0]}</span>
      ${g.stage === 3 && g.mode !== 'end' ? `<span class="chip dim">pozostało pytań: ${g.finalLeft}</span>` : ''}</div>
    <div class="hud-r"><span class="chip dim">pokój ${S.code}</span><button class="chip btnchip" id="mute" aria-label="Dźwięk">${muted ? '🔇' : '🔊'}</button></div>`;
  $('#mute').onclick = () => { muted = !muted; store.set('ts-muted', muted); renderGame(); };

  const key = [g.stage, g.mode, g.turn, g.qnum, g.reveal && g.reveal.pid, S.phase].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const panel = $('#panel');
    const timer = '<div class="timer"><i id="tbar"></i></div>';
    const qbox = g.q ? `<div class="qcat">${esc(g.q.cat)}</div><div class="qtext">${esc(g.q.text)}</div>` : '';
    let h = '';
    if (g.mode === 'intro') {
      h = `<div class="intro"><h2>${st[0]}</h2><p>${st[1]}</p></div>${timer}`;
    } else if (g.mode === 'question') {
      const p = byId(g.turn), mine = g.turn === myId;
      const tag = g.kind === 'self' ? ' · pytanie za 20 pkt' : '';
      h = `${qbox}<div class="who">${mine ? 'Twoja kolej!' : 'Odpowiada: <b>' + esc(p.name) + '</b>'}${tag}</div>
        ${mine ? `<form id="ans-form" class="ans"><input id="ans" class="inp" maxlength="80" placeholder="Wpisz odpowiedź…" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn primary">Odpowiadam</button></form>
          <div class="hint">Drobne literówki są wybaczane. Pusta odpowiedź = „nie wiem”.</div>` : ''}${timer}`;
    } else if (g.mode === 'buzz') {
      h = `${qbox}${me && !me.out ? '<button class="btn primary big buzz" id="buzz">Zgłaszam się! <kbd>spacja</kbd></button>' : '<div class="who">Kto zgłosi się pierwszy?</div>'}${timer}`;
    } else if (g.mode === 'reveal') {
      const r = g.reveal, p = r.pid && byId(r.pid);
      h = `${qbox}<div class="verdict ${r.ok ? 'good' : 'bad'}">
        ${p ? `<span class="vmark">${r.ok ? '✓ Dobrze!' : '✗ Źle'}</span> <span>${esc(p.name)}: <b>${r.given ? esc(r.given) : '(brak odpowiedzi)'}</b></span>` : '<span class="vmark">Nikt się nie zgłosił</span>'}
        ${!r.ok ? `<span class="correct">Poprawna odpowiedź: <b>${esc(r.answer)}</b></span>` : ''}
        ${r.gained ? `<span class="correct">+${r.gained} pkt</span>` : ''}
        ${r.eliminated ? `<span class="elim">${esc(p.name)} odpada z gry</span>` : ''}</div>`;
    } else if (g.mode === 'nominate') {
      const p = byId(g.turn), mine = g.turn === myId;
      const targets = S.players.filter(x => !x.out && x.id !== g.turn);
      h = mine ? `<div class="who big">Wskaż, kto odpowiada na następne pytanie</div><div class="targets">
          ${g.allowSelf ? `<button class="btn primary" data-t="${myId}">Biorę na siebie (20 pkt)</button>` : ''}
          ${targets.map(x => `<button class="btn" data-t="${x.id}">${x.seat}. ${esc(x.name)} <small>${'◆'.repeat(x.lives)}</small></button>`).join('')}</div>${timer}`
        : `<div class="who big"><b>${esc(p.name)}</b> wybiera, kto odpowie na następne pytanie…</div>${timer}`;
    } else if (g.mode === 'end') {
      const host = S.hostId === myId, w = g.ranking[0] && byId(g.ranking[0].id);
      h = `<div class="end"><h2>🏆 Wygrywa ${w ? esc(w.name) : '—'}!</h2><ol class="rank">
        ${g.ranking.map((r, i) => { const p = byId(r.id); return `<li class="${r.id === myId ? 'me' : ''}"><span class="rk">${i + 1}</span>${avatarSVG(p.avatar)}<span class="rn">${esc(p.name)}</span><span class="rs">${r.score != null ? r.score + ' pkt' : r.out ? 'odpadł(a)' : ''}</span></li>`; }).join('')}
        </ol><div class="end-btns">${host ? '<button class="btn primary" id="again">Wróć do poczekalni</button>' : '<span class="hint">Gospodarz może rozpocząć kolejną grę.</span>'}<button class="btn ghost" id="quit">Wyjdź</button></div></div>`;
    }
    panel.innerHTML = h;
    const f = $('#ans-form');
    if (f) { f.onsubmit = e => { e.preventDefault(); tx({ t: 'answer', text: $('#ans').value }); }; setTimeout(() => $('#ans') && $('#ans').focus(), 50); }
    if ($('#buzz')) $('#buzz').onclick = () => tx({ t: 'buzz' });
    panel.querySelectorAll('[data-t]').forEach(b => b.onclick = () => tx({ t: 'nominate', id: b.dataset.t }));
    if ($('#again')) $('#again').onclick = () => tx({ t: 'again' });
    if ($('#quit')) $('#quit').onclick = () => { sess = null; sstore.set(null); S = null; if (ws) { ws.onclose = null; ws.close(); } history.replaceState(null, '', location.pathname); show('home'); };

    if (key !== lastSoundKey) {
      lastSoundKey = key;
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
renderEditor();
const urlCode = (new URLSearchParams(location.search).get('pokoj') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
if (sess && (!urlCode || urlCode === sess.code)) connect({ t: 'rejoin', ...sess });
else if (urlCode) { sess = null; sstore.set(null); $('#code').value = urlCode; $('#home').classList.add('invited'); }
