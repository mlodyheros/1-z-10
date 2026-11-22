// własna muzyka i efekty do rolki — zapis do music.wav i sfx.wav (mono, 44.1 kHz)
const fs = require('fs');
const SR = 44100, LEN = 29.4, N = Math.ceil(LEN * SR);
const music = new Float32Array(N), sfx = new Float32Array(N);
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const osc = (type, ph) => { const p = ph % 1; return type === 'sin' ? Math.sin(2 * Math.PI * p) : type === 'sq' ? (p < .5 ? 1 : -1) : type === 'saw' ? 2 * p - 1 : 1 - 4 * Math.abs(p - .5); };
function tone(buf, t0, dur, f0, f1, type, vol, att = .005, rel = .08) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let ph = 0;
  for (let i = 0; i < n && s0 + i < N; i++) {
    const t = i / SR, f = f0 * Math.pow(f1 / f0, t / dur); ph += f / SR;
    const env = Math.min(1, t / att) * Math.min(1, (dur - t) / rel);
    if (s0 + i >= 0) buf[s0 + i] += osc(type, ph) * vol * Math.max(0, env);
  }
}
function noise(buf, t0, dur, vol, hp = 0, decay = 30, rise = false) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(dur * SR); let lp = 0, prev = 0;
  for (let i = 0; i < n && s0 + i < N; i++) {
    const t = i / SR, x = rnd(); lp += (x - lp) * (hp ? 1 : .3); let y = hp ? x - prev : lp; prev = x;
    const env = rise ? Math.pow(t / dur, 2) * Math.min(1, (dur - t) / .03) : Math.exp(-t * decay);
    buf[s0 + i] += y * vol * env;
  }
}
const kick = t => { tone(music, t, .22, 150, 42, 'sin', .9, .002, .12); noise(music, t, .02, .25, 1, 200); };
const snare = t => { noise(music, t, .18, .32, 1, 22); tone(music, t, .1, 220, 180, 'tri', .18); };
const hat = (t, v = .1) => noise(music, t, .05, v, 1, 90);
const note = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------- muzyka: 128 BPM, Am–F–C–G ----------
const BPM = 128, B = 60 / BPM;
const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const silence = [[15.3, 17.15]]; // cisza po „Sydney” — dla efektu komicznego
const muted = t => silence.some(([a, b]) => t >= a && t < b) || t > 28.9;
for (let bar = 0; bar * 4 * B < LEN; bar++) {
  const ch = chords[bar % 4];
  for (let b = 0; b < 4; b++) {
    const t = (bar * 4 + b) * B;
    if (muted(t)) continue;
    const intro = t < 3.5;
    if (!intro || b % 2 === 0) kick(t);
    if (!intro && (b === 1 || b === 3)) snare(t);
    hat(t + B / 2, .12); if (!intro) hat(t, .05);
    // bas na ósemkach
    for (let e = 0; e < 2; e++) tone(music, t + e * B / 2, B / 2 - .02, note(ch[0] - 12), note(ch[0] - 12), 'sq', intro ? .05 : .09, .004, .05);
    // arpeggio na szesnastkach
    if (!intro) for (let s = 0; s < 4; s++) { const m = ch[(b * 4 + s) % 3] + 12 + (s === 3 ? 12 : 0); tone(music, t + s * B / 4, B / 4 - .01, note(m), note(m), 'tri', .05, .003, .04); }
  }
}
// werbel-przejście przed finałem i przed zaproszeniem
for (let i = 0; i < 8; i++) { noise(music, 19.2 + i * B / 4, .1, .12 + i * .03, 1, 25); noise(music, 25.0 + i * B / 4, .1, .12 + i * .03, 1, 25); }

// ---------- efekty ----------
const pop = (t, f = 600, v = .35) => tone(sfx, t, .09, f, f * 2.2, 'sin', v, .002, .05);
const blip = t => { tone(sfx, t, .06, 1200, 1500, 'sq', .08); tone(sfx, t + .06, .08, 1600, 1600, 'sq', .07); };
const whoosh = t => noise(sfx, t - .25, .32, .5, 1, 0, true);
const ding = (t, fs = [660, 880, 1175], d = .11) => fs.forEach((f, i) => { tone(sfx, t + i * d, .35, f, f, 'sin', .28, .003, .3); tone(sfx, t + i * d, .2, f * 2, f * 2, 'tri', .07); });
const buzzer = t => { tone(sfx, t, .3, 220, 210, 'saw', .28, .005, .05); tone(sfx, t + .3, .5, 165, 150, 'saw', .3, .005, .2); tone(sfx, t, .8, 110, 100, 'sq', .12, .005, .2); };
const hit = t => { tone(sfx, t, .7, 90, 35, 'sin', .9, .002, .5); noise(sfx, t, 1.2, .45, 1, 3.5); };
const sadTrombone = t => [[466, .32], [440, .32], [415, .32], [392, 1.0]].reduce((a, [f, d]) => {
  const s0 = Math.floor(a * SR), n = Math.floor(d * SR); let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR, vib = a > t + .9 ? 1 + .025 * Math.sin(2 * Math.PI * 6 * tt) : 1; ph += f * vib / SR;
    const env = Math.min(1, tt / .03) * Math.min(1, (d - tt) / .08); sfx[s0 + i] += (osc('saw', ph) * .6 + osc('sq', ph) * .2) * .22 * env; }
  return a + d; }, t);

[0.25, 0.43, 0.61].forEach((t, i) => pop(t, 500 + i * 150));
[2.05, 2.4, 2.75].forEach(t => { noise(sfx, t, .25, .55, 0, 18); tone(sfx, t, .2, 120, 60, 'sin', .6); });
[3.6, 7.2, 17.2, 22.6].forEach(whoosh);
for (let i = 0; i < 13; i++) tone(sfx, 3.6 + .12 * (i + 1), .03, 2400, 2000, 'sq', .07, .001, .02);
ding(6.35, [784, 1047, 1568], .07);
[7.55, 7.83, 8.11, 8.39].forEach((t, i) => pop(t, 520 + i * 90, .28));
[7.8, 8.35, 8.8, 9.3].forEach(blip);
[10.2, 10.9, 11.6].forEach((t, i) => { tone(sfx, t, .3, [392, 440, 494][i], [392, 440, 494][i], 'sq', .12, .005, .2); });
ding(12.3, [523, 659, 784, 1047], .06); hit(12.3);
buzzer(15.35);
tone(sfx, 16.15, .05, 300, 300, 'sin', .0); // (miejsce na lektora)
ding(18.05);
pop(18.55, 700, .25); pop(19.25, 400, .4);
hit(20.0);
tone(sfx, 21.25, .15, 880, 880, 'sq', .15, .002, .05);
ding(21.4);
ding(22.6, [523, 659, 784, 1047, 1319], .09); hit(22.6);
for (let i = 0; i < 10; i++) pop(22.7 + i * .09, 900 + (i % 4) * 200, .12);
sadTrombone(23.65);
hit(25.8); ding(27.0, [784, 988, 1175], .06);

function wav(name, buf, gain) {
  const out = Buffer.alloc(44 + N * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 2, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) out.writeInt16LE(Math.round(Math.tanh(buf[i] * gain) * 32000), 44 + i * 2);
  fs.writeFileSync(name, out);
}
wav(__dirname + '/music.wav', music, .9); wav(__dirname + '/sfx.wav', sfx, 1.1);
console.log('ok');
