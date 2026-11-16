'use strict';
// Trzy Szanse — serwer gry (HTTP + WebSocket)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { norm, isCorrect } = require('./match');
const EN = require('./en')(norm);

const PORT = process.env.PORT || 3110;
const PUB = path.join(__dirname, 'public');
const MAX_PLAYERS = 10;
const AV_KEYS = ['skin', 'hair', 'hairColor', 'eyes', 'mouth', 'shirt', 'outfit', 'hat', 'glasses', 'beard'];
const EMOTES = 8;

// ---------- baza pytań ----------
const CATS = [];
const ALL_ANS = new Set();
const QDIR = path.join(__dirname, 'questions');
for (const f of fs.readdirSync(QDIR).filter(f => f.endsWith('.txt')).sort()) {
  const lines = fs.readFileSync(path.join(QDIR, f), 'utf8').split('\n').map((l, i) => [l.trim(), i + 1]).filter(x => x[0]);
  let name = f.replace('.txt', '');
  const qs = [];
  for (const [l, ln] of lines) {
    if (l.startsWith('#')) { if (!qs.length) name = l.slice(1).trim(); continue; }
    const p = l.split('|').map(s => s.trim());
    if (p.length < 2 || !p[0] || !p[1]) continue;
    // opcjonalne pole !1 / !2 / !3 to poziom trudności (łatwe / średnie / trudne), domyślnie średnie
    const dm = p.slice(1).find(x => /^![123]$/.test(x));
    const a = p.slice(1).filter(x => x && !/^![123]$/.test(x));
    // dopisz angielskie odpowiedniki (po polskich, żeby a[0] zostało polską odpowiedzią)
    for (const x of a.slice()) for (const e of EN.get(norm(x)) || []) if (!a.some(y => norm(y) === norm(e))) a.push(e);
    qs.push({ q: p[0], a, d: dm ? +dm[1] : 2, src: 'questions/' + f + ':' + ln });
    a.forEach(x => ALL_ANS.add(norm(x)));
  }
  if (qs.length) CATS.push({ id: f.replace('.txt', ''), name, qs });
}
console.log(`Wczytano ${CATS.length} kategorii, ${CATS.reduce((s, c) => s + c.qs.length, 0)} pytań`);

// ---------- zgłoszone pytania (GitHub albo plik zgloszenia.txt) ----------
const REPORTS = require('./reports');
// lista zgłoszeń się zmieniła: odśwież poczekalnie (widzą ją gospodarze)
REPORTS.init(() => { for (const x of rooms.values()) if (x.phase === 'lobby') send(x); });

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  // zły adres (np. „/%”) nie może wywrócić całego serwera
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (p === '/ping') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nie znaleziono'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---------- pokoje ----------
const rooms = new Map();
const LEVELS = { slaby: 0.12, latwy: 0.35, sredni: 0.6, trudny: 0.82, mistrz: 0.97 };
const BUZZ_MS = { slaby: 5000, latwy: 3800, sredni: 2600, trudny: 1500, mistrz: 800 };
const GALLERY = require('./public/bots');
const BOT_NAMES = ['Bogdan', 'Grażyna', 'Zenek', 'Halina', 'Mietek', 'Krysia', 'Wiesiek', 'Jadzia', 'Stefan', 'Bożenka', 'Rysiek', 'Danusia'];
const rand = a => a[Math.floor(Math.random() * a.length)];
const rint = n => Math.floor(Math.random() * n);
const uid = () => crypto.randomBytes(6).toString('hex');

function newCode() {
  const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = Array.from({ length: 5 }, () => rand(ch)).join(''); } while (rooms.has(c));
  return c;
}
function cleanName(n) { return String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'Gracz'; }
function cleanAvatar(a) {
  // postać wybrana z galerii: bierzemy jej pełny wygląd (z własnymi kolorami)
  const gal = a && typeof a.gid === 'string' && GALLERY.find(x => x.id === a.gid);
  if (gal) return Object.assign({}, gal.avatar, { gid: gal.id });
  const o = {};
  for (const k of AV_KEYS) o[k] = Math.max(0, Math.min(30, parseInt(a && a[k], 10) || 0));
  return o;
}
function randomAvatar() {
  const opt = (n, pNone) => (Math.random() < pNone ? 0 : rint(n));
  return { skin: rint(10), hair: rint(20), hairColor: rint(10), eyes: rint(9), mouth: rint(9), shirt: rint(12), outfit: rint(11), hat: opt(11, 0.5), glasses: opt(5, 0.6), beard: opt(6, 0.65) };
}
const byId = (r, id) => r.players.find(p => p.id === id);
const alive = r => r.players.filter(p => !p.out);

function makePlayer(name, avatar, ws) {
  return { id: uid(), secret: uid(), name: cleanName(name), avatar: cleanAvatar(avatar), isBot: false, level: null, ws, connected: true, lives: 3, points: 0, out: false, seat: 0, corrects: 0, s1wrong: 0 };
}

function pub(r) {
  const g = r.game;
  const s = {
    code: r.code, hostId: r.hostId, phase: r.phase, settings: r.settings,
    players: r.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, isBot: p.isBot, level: p.level, gid: p.gid, connected: p.connected, lives: p.lives, points: p.points, out: p.out, seat: p.seat })),
    specs: (r.specs || []).filter(p => p.connected).map(p => ({ id: p.id, name: p.name, avatar: p.avatar })),
    chat: r.chat || [],
  };
  s.history = r.history || [];
  if (r.phase === 'lobby') s.cats = CATS.map(c => ({ id: c.id, name: c.name, n: c.qs.length }));
  if (g) {
    s.game = {
      stage: g.stage, mode: g.mode, turn: g.turn, chooser: g.chooser, kind: g.kind, qnum: g.qnum,
      allowSelf: g.stage === 3, finalLeft: g.finalLeft, reveal: g.reveal, ranking: g.ranking,
      q: g.cur && g.mode !== 'intro' && g.mode !== 'nominate' && g.mode !== 'end' ? { text: g.cur.item.q, cat: g.cur.cat.name } : null,
      timeLeft: r.deadline ? Math.max(0, r.deadline - Date.now()) : 0, total: r.total || 0, stats: g.stats || null,
    };
  }
  return s;
}
const humansIn = r => r.players.concat(r.specs || []).filter(p => !p.isBot);
function send(r) {
  const s = pub(r);
  // gospodarz w poczekalni dostaje też listę zgłoszonych pytań
  const hs = r.phase === 'lobby' ? Object.assign({}, s, {
    reports: REPORTS.all().slice(-60).reverse().map(x => ({ id: x.id, ts: x.ts, cat: x.cat, q: x.q, a: x.a, by: x.by, given: x.given, src: x.src, banned: (r.banned || new Set()).has(x.q) })),
  }) : s;
  for (const p of humansIn(r)) if (p.connected && p.ws && p.ws.readyState === 1) p.ws.send(JSON.stringify({ t: 'state', s: p.id === r.hostId ? hs : s, you: p.id, spec: !!p.spec }));
}
// widzowie wchodzą do gry, gdy w poczekalni jest wolne miejsce
function promoteSpecs(r) {
  r.specs = (r.specs || []).filter(p => p.connected);
  while (r.specs.length && r.players.length < MAX_PLAYERS) {
    const p = r.specs.shift();
    p.spec = false; p.lives = 3; p.points = 0; p.out = false;
    r.players.push(p);
  }
}
function err(ws, code, fatal) { if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'error', code, fatal: !!fatal })); }
function emote(r, p, e) {
  const now = Date.now();
  if (now - (p.lastEmote || 0) < 700) return;
  p.lastEmote = now;
  const msg = JSON.stringify({ t: 'emote', id: p.id, e });
  for (const x of humansIn(r)) if (x.connected && x.ws && x.ws.readyState === 1) x.ws.send(msg);
}

function clearTimers(r) {
  clearTimeout(r.timer); r.timer = null; r.deadline = 0; r.onTimeout = null;
  (r.botTimers || []).forEach(clearTimeout); r.botTimers = [];
}
function setDeadline(r, ms, fn) {
  clearTimeout(r.timer);
  r.deadline = Date.now() + ms; r.total = ms; r.onTimeout = fn;
  r.timer = setTimeout(() => { const f = r.onTimeout; r.onTimeout = null; r.deadline = 0; if (f) f(); }, ms);
}
function botLater(r, ms, fn) { r.botTimers = r.botTimers || []; r.botTimers.push(setTimeout(fn, ms)); }

// ---------- przebieg gry ----------
function startGame(r) {
  r.phase = 'game';
  r.players.forEach((p, i) => { p.lives = 3; p.points = 0; p.out = false; p.seat = i + 1; p.corrects = 0; p.s1wrong = 0; p.inFinal = false; p.st = { ok: 0, bad: 0, streak: 0, best: 0, fast: null }; });
  let pool = CATS.filter(c => r.settings.categories.includes(c.id));
  if (!pool.length) pool = CATS;
  r.game = { id: uid(), stage: 0, mode: 'intro', used: new Set(), outOrder: [], qnum: 0, pool, chooser: null, turn: null };
  stageIntro(r, 1);
}

function stageIntro(r, stage) {
  const g = r.game;
  clearTimers(r);
  g.stage = stage; g.mode = 'intro'; g.turn = null; g.cur = null; g.reveal = null; g.chooser = null; g.kind = null;
  if (stage === 1) { g.queue = []; alive(r).forEach(p => g.queue.push(p.id, p.id)); }
  if (stage === 2) g.seatIdx = 0;
  if (stage === 3) {
    g.finalLeft = r.settings.finalQuestions;
    // finał: szanse zachowane z wcześniejszych etapów zamieniają się na punkty, a każdy zaczyna z kompletem szans
    alive(r).forEach(p => { p.corrects = 0; p.inFinal = true; p.points = p.lives * 10; p.lives = 3; });
  }
  setDeadline(r, stage === 1 ? 4200 : 5000, () => next(r));
  send(r);
}

function next(r) {
  const g = r.game;
  if (!g || r.phase !== 'game') return;
  clearTimers(r);
  const al = alive(r);
  g.reveal = null;
  // w finale ostatni gracz gra dalej sam — do końca pytań albo utraty wszystkich szans
  if (g.stage === 3 ? !al.length : al.length <= 1) return endGame(r);
  if (g.stage === 1) {
    while (g.queue.length && byId(r, g.queue[0]).out) g.queue.shift();
    if (!g.queue.length) return stageIntro(r, al.length > 3 ? 2 : 3);
    return ask(r, g.queue.shift(), 'normal');
  }
  if (g.stage === 2) {
    if (al.length <= 3) return stageIntro(r, 3);
    if (g.chooser && !byId(r, g.chooser).out) return nominateMode(r);
    g.chooser = null;
    return ask(r, al[g.seatIdx++ % al.length].id, 'normal');
  }
  if (g.finalLeft <= 0) return endGame(r);
  // ostatni gracz nie może przeczekać pytania — odpowiada na każde
  if (al.length === 1) return ask(r, al[0].id, g.chooser === al[0].id ? 'self' : 'buzz');
  if (g.chooser && !byId(r, g.chooser).out) return nominateMode(r);
  g.chooser = null;
  return buzzMode(r);
}

// waga kategorii przy losowaniu: więcej klasycznej wiedzy ogólnej (jak w teleturniejach), mniej sportu
const CAT_W = { 'wiedza-ogolna': 4, 'pilka-nozna': 0.4, 'premier-league-kluby': 0.4, sport: 0.5, 'nba-koszykowka': 0.4, 'formula-1': 0.5, 'silownia-fitness': 0.5 };
function randCat(pool) {
  const w = c => CAT_W[c.id] || 1;
  let x = Math.random() * pool.reduce((s, c) => s + w(c), 0);
  for (const c of pool) { x -= w(c); if (x <= 0) return c; }
  return pool[pool.length - 1];
}
function pickQ(r) {
  const g = r.game;
  const banned = r.banned || new Set();
  for (let i = 0; i < 80; i++) {
    const c = randCat(g.pool), k = rint(c.qs.length), key = c.id + ':' + k;
    if (!g.used.has(key) && !banned.has(c.qs[k].q)) { g.used.add(key); return { cat: c, item: c.qs[k] }; }
  }
  g.used.clear();
  const c = randCat(g.pool);
  return { cat: c, item: rand(c.qs) };
}

function ask(r, pid, kind, keepQ) {
  const g = r.game, p = byId(r, pid);
  clearTimers(r);
  if (!keepQ) { g.cur = pickQ(r); g.qnum++; }
  g.mode = 'question'; g.turn = pid; g.kind = kind; g.reveal = null; g.askedAt = Date.now();
  const ms = (p.isBot || p.connected) ? r.settings.answerTime * 1000 : 3000;
  setDeadline(r, ms, () => resolve(r, ''));
  send(r);
  if (p.isBot) botAnswer(r, p, keepQ ? p._knows : undefined);
}

// Błędna odpowiedź bota ma pasować do pytania: liczba za liczbę, miasto za miasto, nazwisko za nazwisko.
function botGuess(cur) {
  const right = cur.item.a[0], q = cur.item.q;
  if (/^\d+$/.test(right.trim())) {
    const n = parseInt(right, 10);
    const d = n >= 1000 && n <= 2100 ? 1 + rint(20) : Math.max(1, Math.ceil(n * (0.1 + Math.random() * 0.4)));
    const up = n - d < 0 || (Math.random() < 0.5 && !(n >= 1000 && n + d > 2026));
    return String(up ? n + d : n - d);
  }
  if (/\d/.test(right)) return '';
  const head = t => t.toLowerCase().replace(/[^a-ząćęłńóśźż0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 4);
  const h = head(q), cap = right[0] !== right[0].toLowerCase(), wc = right.split(' ').length;
  // „Jak nazywa się…” pasuje do wszystkiego, więc tam musi się zgadzać też kolejne słowo (nauka, ćwiczenie, stadion…)
  const need = h[0] === 'jak' && /^nazyw/.test(h[1] || '') ? 4 : 2;
  let best = [], bestScore = 0;
  for (const o of cur.cat.qs) {
    const a = o.a[0];
    if (o === cur.item || /\d/.test(a) || norm(a) === norm(right)) continue;
    const oh = head(o.q);
    let same = 0;
    while (same < 4 && h[same] && oh[same] === h[same]) same++;
    if (same < need) continue;
    const sc = same * 2 + ((a[0] !== a[0].toLowerCase()) === cap ? 1 : 0) + (a.split(' ').length === wc ? 1 : 0);
    if (sc > bestScore) { bestScore = sc; best = [a]; } else if (sc === bestScore) best.push(a);
  }
  // bez pytania o podobnej konstrukcji bot woli powiedzieć „nie wiem” niż strzelać od czapy
  if (!best.length) return '';
  return Math.random() < 0.8 ? rand(best) : '';
}

function botAnswer(r, p, knows) {
  const g = r.game, cur = g.cur;
  if (knows === undefined) knows = Math.random() < LEVELS[p.level];
  botLater(r, (g.stage === 1 ? 1500 : 2200) + Math.random() * (g.stage === 1 ? 2200 : 3500), () => {
    if (r.game !== g || g.cur !== cur || g.mode !== 'question' || g.turn !== p.id) return;
    let text = '';
    if (knows) text = cur.item.a[0];
    else { text = botGuess(cur); if (isCorrect(text, cur.item.a, ALL_ANS)) text = ''; }
    resolve(r, text);
  });
}

function eliminate(r, p) {
  const g = r.game;
  p.out = true; p.lives = 0;
  g.outOrder.push(p.id);
  if (g.chooser === p.id) g.chooser = null;
}

function resolve(r, text) {
  const g = r.game;
  if (!g || g.mode !== 'question') return;
  clearTimers(r);
  const p = byId(r, g.turn);
  text = String(text || '').slice(0, 80);
  const ok = isCorrect(text, g.cur.item.a, ALL_ANS);
  let gained = 0;
  // statystyki do podsumowania gry
  const st = p.st || (p.st = { ok: 0, bad: 0, streak: 0, best: 0, fast: null });
  if (ok) {
    st.ok++; st.streak++; st.best = Math.max(st.best, st.streak);
    const ms = Date.now() - (g.askedAt || Date.now());
    if (!st.fast || ms < st.fast.ms) st.fast = { ms, q: g.cur.item.q };
  } else { st.bad++; st.streak = 0; }
  if (g.stage === 1) {
    // rozgrzewka nikogo nie eliminuje — każdy błąd kosztuje jedną szansę
    if (!ok) { p.lives--; p.s1wrong++; if (p.lives <= 0) eliminate(r, p); }
  } else if (g.stage === 2) {
    if (ok) g.chooser = p.id;
    else { p.lives--; if (g.chooser === p.id) g.chooser = null; if (p.lives <= 0) eliminate(r, p); }
  } else {
    g.finalLeft--;
    if (ok) {
      gained = g.kind === 'self' ? 20 : 10;
      p.points += gained;
      if (g.kind === 'buzz') { p.corrects++; if (p.corrects >= 3) { p.corrects = 0; g.chooser = p.id; } }
      else if (g.kind === 'nominated') g.chooser = p.id;
    } else {
      p.lives--;
      if (g.kind === 'self') g.chooser = null;
      if (p.lives <= 0) eliminate(r, p);
    }
  }
  g.mode = 'reveal';
  g.reveal = { pid: p.id, given: text, ok, answer: g.cur.item.a[0], eliminated: p.out, gained };
  if (p.isBot && Math.random() < 0.45) setTimeout(() => { if (r.game === g) emote(r, p, ok ? rand([1, 3, 6, 7]) : rand([4, 5])); }, 500);
  setDeadline(r, g.stage === 1 ? 3200 : 4200, () => next(r));
  send(r);
}

function nominateMode(r) {
  const g = r.game, p = byId(r, g.chooser);
  clearTimers(r);
  g.mode = 'nominate'; g.turn = p.id; g.reveal = null;
  const auto = () => {
    if (g.stage === 3) return ask(r, p.id, 'self');
    const others = alive(r).filter(x => x.id !== p.id);
    ask(r, rand(others).id, 'normal');
  };
  setDeadline(r, (p.isBot || p.connected) ? 15000 : 2500, auto);
  send(r);
  if (p.isBot) botLater(r, 1600 + Math.random() * 1800, () => {
    if (r.game !== g || g.mode !== 'nominate' || g.turn !== p.id) return;
    const others = alive(r).filter(x => x.id !== p.id);
    if (g.stage === 3 && Math.random() < LEVELS[p.level]) return ask(r, p.id, 'self');
    let target = rand(others);
    if (p.level === 'trudny' || p.level === 'mistrz') target = others.slice().sort((a, b) => a.lives - b.lives)[0];
    ask(r, target.id, g.stage === 3 ? 'nominated' : 'normal');
  });
}

function buzzMode(r) {
  const g = r.game;
  clearTimers(r);
  g.cur = pickQ(r); g.qnum++;
  g.mode = 'buzz'; g.turn = null; g.kind = 'buzz'; g.reveal = null;
  const cur = g.cur;
  setDeadline(r, 10000, () => {
    g.finalLeft--;
    g.mode = 'reveal';
    g.reveal = { pid: null, given: '', ok: false, answer: cur.item.a[0], eliminated: false, gained: 0 };
    setDeadline(r, 3500, () => next(r));
    send(r);
  });
  send(r);
  for (const b of alive(r).filter(p => p.isBot)) {
    b._knows = Math.random() < LEVELS[b.level];
    if (!b._knows && Math.random() > 0.08) continue;
    const base = BUZZ_MS[b.level] || 2600;
    botLater(r, base + Math.random() * 3000, () => { if (r.game === g && g.cur === cur) buzz(r, b.id); });
  }
}

function buzz(r, pid) {
  const g = r.game, p = byId(r, pid);
  if (!g || g.mode !== 'buzz' || !p || p.out) return;
  ask(r, pid, 'buzz', true);
}

function nominate(r, fromId, targetId) {
  const g = r.game;
  if (!g || g.mode !== 'nominate' || g.turn !== fromId) return;
  const t = byId(r, targetId);
  if (!t || t.out) return;
  if (targetId === fromId) { if (g.stage !== 3) return; return ask(r, fromId, 'self'); }
  ask(r, targetId, g.stage === 3 ? 'nominated' : 'normal');
}

function endGame(r) {
  const g = r.game;
  clearTimers(r);
  const final = g.stage === 3;
  // finaliści według punktów (każda zachowana szansa to 10 pkt), reszta w kolejności odpadania
  const fin = r.players.filter(p => final && p.inFinal).map(p => ({ id: p.id, score: p.points + p.lives * 10, points: p.points, lives: p.lives, out: p.out }));
  fin.sort((a, b) => b.score - a.score || b.lives - a.lives);
  const al = alive(r).filter(p => !(final && p.inFinal)).map(p => ({ id: p.id, score: null, points: p.points, lives: p.lives }));
  const outs = g.outOrder.slice().reverse().filter(id => !(final && byId(r, id).inFinal)).map(id => ({ id, score: null, points: 0, lives: 0, out: true }));
  g.ranking = fin.concat(al, outs);
  g.stats = gameStats(r);
  const w = g.ranking[0] && byId(r, g.ranking[0].id);
  if (w) { r.games = (r.games || 0) + 1; r.history = r.history || []; r.history.push({ game: r.games, name: w.name, avatar: w.avatar, score: g.ranking[0].score || 0, isBot: w.isBot }); if (r.history.length > 50) r.history.shift(); }
  g.mode = 'end'; g.turn = null; g.reveal = null;
  r.phase = 'end';
  send(r);
}

// wyróżnienia po grze: najwięcej dobrych odpowiedzi, najszybsza odpowiedź, najdłuższa seria
function gameStats(r) {
  const ps = r.players.filter(p => p.st);
  const best = (score, min) => {
    let top = null;
    for (const p of ps) { const v = score(p); if (v != null && v >= min && (!top || v > top.v)) top = { id: p.id, v }; }
    return top;
  };
  const out = [];
  const most = best(p => p.st.ok, 1);
  if (most) out.push({ k: 'most', id: most.id, v: most.v, bad: byId(r, most.id).st.bad });
  const fast = best(p => (p.st.fast ? -p.st.fast.ms : null), -Infinity);
  if (fast) out.push({ k: 'fast', id: fast.id, v: -fast.v, q: byId(r, fast.id).st.fast.q });
  const streak = best(p => p.st.best, 2);
  if (streak) out.push({ k: 'streak', id: streak.id, v: streak.v });
  // przy równej skuteczności wygrywa ten, kto odpowiadał częściej
  const acc = best(p => (p.st.ok + p.st.bad >= 3 ? Math.round(p.st.ok / (p.st.ok + p.st.bad) * 100) + (p.st.ok + p.st.bad) / 1000 : null), 1);
  if (acc) out.push({ k: 'acc', id: acc.id, v: Math.floor(acc.v) });
  // wszyscy gracze w tabelce: dobre / złe / najszybsza
  const table = ps.map(p => ({ id: p.id, ok: p.st.ok, bad: p.st.bad, fast: p.st.fast ? p.st.fast.ms : null }));
  return { awards: out, table };
}

// ---------- obsługa połączeń ----------
function removePlayer(r, p) {
  r.players = r.players.filter(x => x !== p);
  if (r.phase === 'lobby') promoteSpecs(r);
  const humans = r.players.filter(x => !x.isBot);
  if (!humans.length) { clearTimers(r); rooms.delete(r.code); return; }
  if (r.hostId === p.id) r.hostId = humans[0].id;
  send(r);
}
function scheduleCleanup(r) {
  clearTimeout(r.cleanup);
  if (humansIn(r).some(p => p.connected)) return;
  r.cleanup = setTimeout(() => {
    if (!humansIn(r).some(p => p.connected)) { clearTimers(r); rooms.delete(r.code); }
  }, 120000);
}

const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });
wss.on('connection', ws => {
  let room = null, me = null;
  const attach = (r, p) => { room = r; me = p; p.ws = ws; p.connected = true; clearTimeout(r.cleanup); clearTimeout(p.gone); ws.send(JSON.stringify({ t: 'joined', code: r.code, id: p.id, secret: p.secret })); send(r); };

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;

    if (m.t === 'create') {
      if (room) return;
      const r = { code: newCode(), hostId: null, phase: 'lobby', players: [], game: null, botTimers: [], settings: { categories: CATS.map(c => c.id), answerTime: 25, finalQuestions: 15 } };
      const p = makePlayer(m.name, m.avatar, ws);
      r.hostId = p.id; r.players.push(p); rooms.set(r.code, r);
      return attach(r, p);
    }
    if (m.t === 'join') {
      if (room) return;
      const r = rooms.get(String(m.code || '').toUpperCase().trim());
      if (!r) return err(ws, 'no_room', true);
      const p = makePlayer(m.name, m.avatar, ws);
      // gra trwa albo brak miejsc: wchodzisz jako widz i dołączasz do następnej gry
      if (r.phase !== 'lobby' || r.players.length >= MAX_PLAYERS) {
        r.specs = r.specs || [];
        if (r.specs.length >= 20) return err(ws, 'full', true);
        p.spec = true; p.out = true; p.lives = 0;
        r.specs.push(p);
      } else r.players.push(p);
      return attach(r, p);
    }
    if (m.t === 'rejoin') {
      if (room) return;
      const r = rooms.get(String(m.code || ''));
      const p = r && humansIn(r).find(x => x.id === m.id && x.secret === m.secret);
      if (!p) return err(ws, 'session', true);
      if (p.ws && p.ws !== ws) { try { p.ws.close(); } catch {} }
      return attach(r, p);
    }
    if (!room || !me) return;
    const r = room, isHost = r.hostId === me.id, g = r.game;
    if (me.spec && !['chat', 'leave', 'report', 'profile'].includes(m.t)) return;

    switch (m.t) {
      case 'chat': {
        // czat i szybkie reakcje w poczekalni
        if (r.phase !== 'lobby') return;
        const text = String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
        const now = Date.now();
        if (!text || now - (me.lastChat || 0) < 700) return;
        me.lastChat = now;
        r.chat = r.chat || [];
        r.chat.push({ id: me.id, name: me.name, text, ts: now });
        if (r.chat.length > 40) r.chat.shift();
        return send(r);
      }
      case 'repBan': case 'repDel': {
        if (!isHost || r.phase !== 'lobby') return;
        const rep = REPORTS.find(m.id);
        if (!rep) return;
        if (m.t === 'repBan') {
          // wyłączenie pytania tylko w tym pokoju (do czasu poprawienia w pliku)
          r.banned = r.banned || new Set();
          r.banned.has(rep.q) ? r.banned.delete(rep.q) : r.banned.add(rep.q);
          return send(r);
        }
        return REPORTS.remove(rep.id);
      }
      case 'profile':
        if (r.phase !== 'lobby') return;
        me.name = cleanName(m.name); me.avatar = cleanAvatar(m.avatar); return send(r);
      case 'addBot': {
        if (!isHost || r.phase !== 'lobby') return;
        if (r.players.length >= MAX_PLAYERS) return err(ws, 'full');
        const level = LEVELS[m.level] ? m.level : 'sredni';
        const gal = m.gid && GALLERY.find(x => x.id === m.gid);
        if (gal && r.players.some(p => p.gid === gal.id)) return;
        const free = BOT_NAMES.filter(n => !r.players.some(p => p.name === 'Bot ' + n));
        const b = makePlayer(gal ? gal.name : 'Bot ' + rand(free.length ? free : BOT_NAMES), randomAvatar(), null);
        b.isBot = true; b.level = level;
        if (gal) { b.gid = gal.id; b.name = gal.name; b.avatar = Object.assign({}, gal.avatar); }
        r.players.push(b); return send(r);
      }
      case 'report': {
        // zgłoszenie dziwnego pytania — trafia na GitHuba (albo do pliku) do sprawdzenia
        if (!g || !g.cur || me._rep === g.id + ':' + g.qnum) return;
        me._rep = g.id + ':' + g.qnum;
        const clean = s => String(s).replace(/[\r\n]+/g, ' ').replace(/ \| /g, ' / ');
        return REPORTS.add({ cat: g.cur.cat.name, q: g.cur.item.q, a: g.cur.item.a.join(' / '), by: clean(me.name),
          given: g.reveal && g.reveal.given ? clean(g.reveal.given) : '', src: g.cur.item.src });
      }
      case 'botLevel': {
        if (!isHost || r.phase !== 'lobby') return;
        const p = byId(r, m.id);
        if (!p || !p.isBot || !LEVELS[m.level]) return;
        p.level = m.level; return send(r);
      }
      case 'kick': {
        if (!isHost || r.phase !== 'lobby') return;
        const p = byId(r, m.id);
        if (!p || p.id === me.id) return;
        if (!p.isBot && p.ws) { err(p.ws, 'kicked', true); try { p.ws.close(); } catch {} }
        return removePlayer(r, p);
      }
      case 'settings': {
        if (!isHost || r.phase !== 'lobby') return;
        const s = m.settings || {};
        if (Array.isArray(s.categories)) r.settings.categories = CATS.map(c => c.id).filter(id => s.categories.includes(id));
        if ([15, 25, 40, 60].includes(s.answerTime)) r.settings.answerTime = s.answerTime;
        if ([10, 15, 20, 30, 40, 50].includes(s.finalQuestions)) r.settings.finalQuestions = s.finalQuestions;
        return send(r);
      }
      case 'start':
        if (!isHost || r.phase !== 'lobby') return;
        if (r.players.length < 2) return err(ws, 'need2');
        if (!r.settings.categories.length) return err(ws, 'need_cat');
        return startGame(r);
      case 'answer':
        if (g && g.mode === 'question' && g.turn === me.id) resolve(r, m.text);
        return;
      case 'buzz': return buzz(r, me.id);
      case 'emote': {
        const e = parseInt(m.e, 10);
        if (e >= 0 && e < EMOTES) emote(r, me, e);
        return;
      }
      case 'nominate': return nominate(r, me.id, m.id);
      case 'again':
        if (!isHost || r.phase !== 'end') return;
        clearTimers(r); r.game = null; r.phase = 'lobby';
        r.players = r.players.filter(p => p.isBot || p.connected);
        r.players.forEach(p => { p.lives = 3; p.points = 0; p.out = false; });
        promoteSpecs(r);
        return send(r);
      case 'leave':
        if (me.spec) { const p = me; room = null; me = null; r.specs = r.specs.filter(x => x !== p); send(r); scheduleCleanup(r); return; }
        if (r.phase === 'lobby') { const p = me; room = null; me = null; removePlayer(r, p); return; }
        {
          // wyjście w trakcie gry: gracz odpada, a gra toczy się dalej bez niego
          const p = me; room = null; me = null;
          p.connected = false; p.ws = null; p.secret = null;
          const humans = r.players.filter(x => !x.isBot && x.connected);
          if (humans.length && r.hostId === p.id) r.hostId = humans[0].id;
          if (r.phase === 'game' && r.game && !p.out) {
            const g2 = r.game;
            eliminate(r, p);
            if (g2.turn === p.id && (g2.mode === 'question' || g2.mode === 'nominate')) { clearTimers(r); next(r); }
            else send(r);
          } else send(r);
          scheduleCleanup(r);
        }
        return;
    }
  });

  ws.on('close', () => {
    if (!room || !me || me.ws !== ws) return;
    const r = room, p = me;
    p.connected = false;
    if (p.spec) {
      p.gone = setTimeout(() => { if (!p.connected) { r.specs = (r.specs || []).filter(x => x !== p); send(r); } }, 20000);
      send(r); return scheduleCleanup(r);
    }
    // odświeżenie strony w poczekalni: miejsce czeka 20 s, zanim gracz zostanie usunięty
    if (r.phase === 'lobby') {
      p.gone = setTimeout(() => { if (!p.connected && r.players.includes(p) && rooms.get(r.code) === r) removePlayer(r, p); }, 20000);
      return send(r);
    }
    const g = r.game;
    if (g && g.turn === p.id && (g.mode === 'question' || g.mode === 'nominate') && r.onTimeout) setDeadline(r, 3000, r.onTimeout);
    const humans = r.players.filter(x => !x.isBot && x.connected);
    if (humans.length && r.hostId === p.id) r.hostId = humans[0].id;
    send(r);
    scheduleCleanup(r);
  });
});

// pojedynczy błąd w jednym pokoju nie może zamknąć gry wszystkim pozostałym
process.on('uncaughtException', e => console.error('Błąd:', e));

// Render (darmowy plan) usypia serwer po 15 min bez ruchu, a pierwsze wejście trwa wtedy ~50 s.
// Serwer co 10 minut odwiedza sam siebie pod publicznym adresem, więc nie zasypia (wyłączenie: KEEP_AWAKE=0).
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
if (SELF_URL && process.env.KEEP_AWAKE !== '0') {
  setInterval(() => fetch(SELF_URL.replace(/\/$/, '') + '/ping').catch(() => {}), 10 * 60 * 1000).unref();
  console.log('Czuwanie włączone: ' + SELF_URL);
}

server.listen(PORT, () => console.log(`Trzy Szanse działa: http://localhost:${PORT}`));
