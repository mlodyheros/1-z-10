// scenariusz rolki — steruje prawdziwym interfejsem gry przez udawane wiadomości z serwera
(() => {
const RL = document.createElement('div'); RL.id = 'rl'; document.body.appendChild(RL);
let rs = 7; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
const at = (s, fn) => setTimeout(fn, Math.round(s * 1000));
const el = (cls, html, parent = RL) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
const push = s => FAKE.onmessage({ data: JSON.stringify({ t: 'state', s, you: 'me', spec: false }) });
const emote = (id, e) => FAKE.onmessage({ data: JSON.stringify({ t: 'emote', id, e }) });

const AV = {
  me: { skin: 1, hair: 1, hairColor: 1, eyes: 2, mouth: 1, beard: 1, glasses: 2, hat: 0, shirt: 5, outfit: 2 },
  kuba: { skin: 0, hair: 4, hairColor: 5, eyes: 1, mouth: 3, beard: 0, glasses: 0, hat: 3, shirt: 2, outfit: 1 },
  ola: { skin: 2, hair: 3, hairColor: 2, eyes: 4, mouth: 0, beard: 0, glasses: 0, hat: 0, shirt: 7, outfit: 4 },
  zenek: { skin: 0, hair: 7, hairColor: 6, eyes: 0, mouth: 2, beard: 4, glasses: 1, hat: 0, shirt: 3, outfit: 3 },
  bozena: { skin: 1, hair: 9, hairColor: 4, eyes: 5, mouth: 4, beard: 0, glasses: 3, hat: 0, shirt: 9, outfit: 5 },
};
const NAMES = { me: 'Ty', kuba: 'Kuba', ola: 'Ola', zenek: 'Zenek', bozena: 'Bożena' };
const pl = (id, seat, x = {}) => Object.assign({ id, name: NAMES[id], avatar: AV[id], isBot: false, level: null, connected: true, lives: 3, points: 0, out: false, seat }, x);
const base = (players, extra) => Object.assign({ code: 'PIZZA', hostId: 'me', phase: 'game', settings: { categories: ['x'], answerTime: 25, finalQuestions: 15 }, players, specs: [], chat: [], history: [] }, extra);
const game = (g) => Object.assign({ stage: 1, mode: 'question', turn: null, chooser: null, kind: 'normal', qnum: 1, allowSelf: false, finalLeft: 15, reveal: null, ranking: null, q: null, timeLeft: 25000, total: 25000, stats: null }, g);

// ---------- pomocnicze efekty ----------
function cap(text, o = {}) {
  const c = el('cap ' + (o.cls || ''), text);
  c.style.top = (o.y ?? 12) + '%';
  if (o.rot != null) c.style.setProperty('--rot', o.rot + 'deg');
  at(o.dur ?? 2, () => { c.classList.add('out'); at(0.25, () => c.remove()); });
  return c;
}
function flash() { const f = el('flash', ''); at(0.35, () => f.remove()); }
function whoosh() { document.body.classList.remove('whip'); void document.body.offsetWidth; document.body.classList.add('whip'); at(0.4, () => document.body.classList.remove('whip')); }
function punch(sel, sc, dur = 0.6) {
  const e = document.querySelector(sel); if (!e) return;
  e.style.transition = 'transform .12s cubic-bezier(.2,1.6,.4,1)'; e.style.transform = `scale(${sc})`;
  at(dur, () => { e.style.transition = 'transform .35s ease'; e.style.transform = ''; });
}
function shake(sel) { const e = document.querySelector(sel); if (!e) return; e.classList.remove('rshake'); void e.offsetWidth; e.classList.add('rshake'); }
const hand = el('hand', `<svg viewBox="0 0 64 64"><path d="M24 30V10a5 5 0 0 1 10 0v16l2-1a5 5 0 0 1 6 2l1 1a5 5 0 0 1 7 2v2a5 5 0 0 1 6 4v9c0 9-7 15-16 15h-4c-6 0-10-3-13-8l-9-14a5 5 0 0 1 8-6z" fill="#fff" stroke="#0a0620" stroke-width="3.5" stroke-linejoin="round"/></svg>`);
function handTo(sel, s, press) {
  const e = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!e) return;
  const r = e.getBoundingClientRect();
  hand.style.transition = `left ${s}s cubic-bezier(.5,0,.2,1), top ${s}s cubic-bezier(.5,0,.2,1), opacity .2s`;
  hand.style.opacity = 1; hand.style.left = (r.left + r.width * 0.55) + 'px'; hand.style.top = (r.top + r.height * 0.45) + 'px';
  if (press) at(s, () => { hand.classList.add('tap'); e.classList.add('rpress'); at(0.18, () => { hand.classList.remove('tap'); e.classList.remove('rpress'); }); });
}
function confetti(n = 90) {
  const box = el('confetti', '');
  const cols = ['#ffc233', '#2fe0c2', '#ff4f8b', '#8f7dff', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.style.cssText = `left:${rnd() * 100}%;background:${cols[i % 5]};--d:${(1.4 + rnd() * 1.6).toFixed(2)}s;--x:${((rnd() - .5) * 160).toFixed(0)}px;--r:${(rnd() * 900).toFixed(0)}deg;animation-delay:${(rnd() * .6).toFixed(2)}s;width:${8 + rnd() * 10}px;height:${10 + rnd() * 14}px`;
    box.appendChild(c);
  }
  at(4, () => box.remove());
}

// ---------- SCENA 0: hak ----------
function s0() {
  document.body.classList.add('rl-hook');
  const h = el('hook', `<div class="hk-t">MASZ</div><div class="hk-lives"><i></i><i></i><i></i></div><div class="hk-t big">SZANSE</div><div class="hk-sub">spoiler: zmarnujesz wszystkie</div>`);
  const lives = h.querySelectorAll('.hk-lives i');
  lives.forEach((l, i) => at(0.25 + i * 0.18, () => l.classList.add('on')));
  at(0.05, () => h.classList.add('in'));
  [2.05, 2.4, 2.75].forEach((s, i) => at(s, () => { lives[i].classList.remove('on'); lives[i].classList.add('broke'); shake('.hook'); }));
  at(1.95, () => h.querySelector('.hk-sub').classList.add('in'));
  at(3.6, () => { h.remove(); document.body.classList.remove('rl-hook'); });
}
// ---------- SCENA 1: ludek ----------
function s1() {
  whoosh(); flash();
  cap('ZRÓB LUDKA', { y: 4, rot: -3, dur: 1.5, cls: 'teal' });
  let k = 0;
  const spin = setInterval(() => { avatar = avRandom(); renderEditor(); if (++k > 12) clearInterval(spin); }, 120);
  at(1.75, () => { avatar = AV.me; renderEditor(); punch('#av-preview', 1.12, 0.5); });
  at(1.55, () => cap('WUJEK NA WESELU?', { y: 4, rot: 2, dur: 1.9, cls: 'pink' }));
  at(2.75, () => { const st = el('stamp', 'IDEALNIE'); at(0.9, () => st.remove()); });
}
// ---------- SCENA 2: poczekalnia ----------
function s2() {
  whoosh(); flash();
  const ids = ['me'];
  const chat = [];
  const lob = () => push(base(ids.map((id, i) => pl(id, i + 1)), { phase: 'lobby', chat: chat.slice(), cats: [{ id: 'x', name: 'Wszystko', n: 7000 }] }));
  lob();
  cap('WYŚLIJ KOD EKIPIE', { y: 3, rot: -2, dur: 1.4, cls: 'gold' });
  ['kuba', 'ola', 'zenek', 'bozena'].forEach((id, i) => at(0.35 + i * 0.28, () => { ids.push(id); lob(); }));
  [[0.6, 'kuba', 'siema'], [1.15, 'ola', 'kto przegra, stawia pizzę'], [1.6, 'zenek', 'deal'], [2.1, 'kuba', 'luz, wygram xd']].forEach(([s, id, text]) =>
    at(s, () => { chat.push({ id, name: NAMES[id], text, ts: 0 }); lob(); }));
  at(1.3, () => { const c = document.querySelector('#lobby .chat-log'); if (c) c.closest('.card').scrollIntoView({ block: 'center' }); });
  at(1.45, () => cap('KTOŚ OBIECAŁ PIZZĘ', { y: 3, rot: 2, dur: 1.6, cls: 'pink' }));
}
// ---------- SCENA 3: studio ----------
const P5 = () => [pl('me', 1), pl('kuba', 2), pl('ola', 3), pl('zenek', 4), pl('bozena', 5)];
function s3() {
  flash();
  push(base(P5(), { game: game({ mode: 'intro', timeLeft: 4500, total: 4500 }) }));
}
// ---------- SCENA 4: Kuba i Australia ----------
function s4() {
  const q = { text: 'Jak nazywa się stolica Australii?', cat: 'Stolice i państwa' };
  push(base(P5(), { game: game({ mode: 'question', turn: 'kuba', q, qnum: 3 }) }));
  at(0.15, () => cap('PYTANIE DO KUBY', { y: 3, rot: -2, dur: 1.9, cls: 'teal' }));
  at(2.75, () => {
    const p = P5(); p[1].lives = 2;
    push(base(p, { game: game({ mode: 'reveal', turn: 'kuba', q, qnum: 3, reveal: { pid: 'kuba', ok: false, given: 'Sydney', answer: 'Canberra' } }) }));
    const st = el('stamp red', 'SYDNEY?!'); at(1.0, () => st.remove());
    punch('#stage', 1.12, 0.5); shake('#panel');
  });
  at(3.7, () => cap('KUBA. NIE.', { y: 3, rot: 3, dur: 1.0, cls: 'red big' }));
}
// ---------- SCENA 5: zemsta ----------
function s5() {
  whoosh();
  const lives = () => { const p = P5(); p[1].lives = 2; return p; };
  const q = { text: 'Ile nóg ma pająk?', cat: 'Zwierzęta' };
  push(base(lives(), { game: game({ mode: 'question', turn: 'me', q, qnum: 4 }) }));
  ['8'].forEach(() => at(0.35, () => { const i = document.querySelector('#ans'); if (i) i.value = '8'; }));
  at(0.55, () => handTo('#ans-form .btn', 0.25, true));
  at(0.85, () => { push(base(lives(), { game: game({ mode: 'reveal', turn: 'me', q, qnum: 4, reveal: { pid: 'me', ok: true, given: '8', answer: '8' } }) })); hand.style.opacity = 0; });
  at(1.35, () => {
    push(base(lives(), { game: game({ mode: 'nominate', turn: 'me', qnum: 4, timeLeft: 10000, total: 10000 }) }));
    cap('WYBIERZ OFIARĘ', { y: 3, rot: -2, dur: 1.3, cls: 'gold' });
    at(0.3, () => handTo('#panel [data-t="kuba"]', 0.6, true));
  });
  at(2.35, () => { cap('ZNOWU KUBA', { y: 3, rot: 3, dur: 0.9, cls: 'pink big' }); hand.style.opacity = 0; });
}
// ---------- SCENA 6: finał ----------
function s6() {
  flash();
  const p = () => [pl('me', 1, { lives: 3, points: 30 }), pl('kuba', 2, { lives: 1, points: 10 }), pl('ola', 3, { lives: 2, points: 20 }), pl('zenek', 4, { out: true, lives: 0 }), pl('bozena', 5, { out: true, lives: 0 })];
  const q = { text: 'Która planeta jest najbliżej Słońca?', cat: 'Kosmos i astronomia' };
  push(base(p(), { game: game({ stage: 3, mode: 'buzz', q, qnum: 20, allowSelf: true, finalLeft: 3, timeLeft: 8000, total: 8000 }) }));
  const st = el('stamp gold', 'FINAŁ!'); at(0.8, () => st.remove());
  at(0.5, () => emote('ola', 1));
  at(0.7, () => emote('zenek', 4));
  at(0.9, () => handTo('#buzz', 0.35, true));
  at(1.15, () => punch('#panel', 1.08, 0.3));
  at(1.4, () => { hand.style.opacity = 0; const q2 = p(); q2[0].points = 40;
    push(base(q2, { game: game({ stage: 3, mode: 'reveal', q, qnum: 20, allowSelf: true, finalLeft: 2, reveal: { pid: 'me', ok: true, given: 'Merkury', answer: 'Merkury', gained: 10 } }) })); });
  at(1.5, () => cap('KTO PIERWSZY, TEN LEPSZY', { y: 3, rot: -2, dur: 1.1, cls: 'teal sm' }));
}
// ---------- SCENA 7: koniec ----------
function s7() {
  whoosh(); flash();
  const ps = [pl('me', 1, { points: 130 }), pl('kuba', 2, { out: true, lives: 0 }), pl('ola', 3, { points: 70 }), pl('zenek', 4, { out: true, lives: 0 }), pl('bozena', 5, { out: true, lives: 0 })];
  push(base(ps, { game: game({ stage: 3, mode: 'end', qnum: 30, ranking: [{ id: 'me', score: 130 }, { id: 'ola', score: 70 }, { id: 'kuba', score: null, out: true }, { id: 'zenek', score: null, out: true }, { id: 'bozena', score: null, out: true }],
    stats: { awards: [{ k: 'streak', id: 'me', v: 7 }, { k: 'fast', id: 'ola', v: 1400 }], table: [{ id: 'me', ok: 14, bad: 1 }, { id: 'ola', ok: 9, bad: 3 }, { id: 'kuba', ok: 3, bad: 3 }, { id: 'zenek', ok: 4, bad: 3 }, { id: 'bozena', ok: 2, bad: 3 }] } }) }));
  confetti();
  cap('WYGRYWASZ', { y: 3, rot: -3, dur: 1.2, cls: 'gold big' });
  at(1.0, () => emote('kuba', 4));
  at(1.25, () => cap('KUBA STAWIA PIZZĘ', { y: 3, rot: 2, dur: 1.7, cls: 'pink' }));
}
// ---------- SCENA 8: zaproszenie ----------
function s8() {
  flash();
  const avs = ['kuba', 'ola', 'me', 'zenek', 'bozena'].map((id, i) => `<span class="cta-av" style="--i:${i}">${avatarSVG(AV[id])}</span>`).join('');
  const c = el('cta', `<div class="cta-avs">${avs}</div><h1 class="logo"><span>Trzy</span> <span class="logo-b">Szanse</span></h1>
    <div class="cta-l">quiz ze znajomymi</div><div class="cta-pills"><b>za darmo</b><b>w przeglądarce</b><b>7000+ pytań</b></div><div class="cta-btn">Zagraj teraz</div>`);
  at(0.05, () => c.classList.add('in'));
  at(1.2, () => c.querySelector('.cta-btn').classList.add('in'));
}

const SCENES = [[0, s0], [3.6, s1], [7.2, s2], [10.2, s3], [12.6, s4], [17.2, s5], [20.0, s6], [22.6, s7], [25.8, s8]];
window.reelStart = () => { document.body.classList.add('rl'); connect({ t: 'x' }); SCENES.forEach(([s, f]) => at(s, f)); };
window.REEL_LEN = 29.2;
})();
