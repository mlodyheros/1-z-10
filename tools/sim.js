// Symulacja pełnej gry: człowiek-widz + boty. node tools/sim.js [liczbaBotów]
const WebSocket = require('ws');
const n = +process.argv[2] || 5;
const ws = new WebSocket('ws://localhost:' + (process.env.PORT || 3110));
let last = '', started = false, t0 = Date.now();
ws.on('open', () => ws.send(JSON.stringify({ t: 'create', name: 'Sim', avatar: {} })));
ws.on('message', d => {
  const m = JSON.parse(d);
  if (m.t === 'error') return console.log('ERR', m.msg);
  if (m.t !== 'state') return;
  const s = m.s, g = s.game;
  if (!started) { started = true; for (let i = 0; i < n; i++) ws.send(JSON.stringify({ t: 'addBot', level: ['slaby', 'latwy', 'sredni', 'trudny', 'mistrz'][i % 5] })); setTimeout(() => ws.send(JSON.stringify({ t: 'start' })), 300); return; }
  if (!g) return;
  const name = id => (s.players.find(p => p.id === id) || {}).name;
  const key = [g.stage, g.mode, g.turn, g.qnum].join('|');
  if (key === last) return; last = key;
  let line = `[${((Date.now() - t0) / 1000).toFixed(0)}s] e${g.stage} ${g.mode}`;
  if (g.mode === 'question') line += ` ${name(g.turn)} (${g.kind})`;
  if (g.mode === 'nominate') line += ` wybiera ${name(g.turn)}`;
  if (g.mode === 'reveal') line += ` ${name(g.reveal.pid)} "${g.reveal.given}" ${g.reveal.ok ? 'OK' : 'ZLE'}${g.reveal.eliminated ? ' ODPADA' : ''} | ` + s.players.map(p => p.out ? 'x' : p.lives + '/' + p.points).join(' ');
  if (g.mode === 'end') { line += ' ' + g.ranking.map(r => name(r.id) + ':' + r.score).join(', '); console.log(line); process.exit(0); }
  console.log(line);
});
