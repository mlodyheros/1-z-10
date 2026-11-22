// node capture.js outDir fps [fromSec toSec]  — klatki rolki przez Chrome DevTools z wirtualnym czasem
const { spawn } = require('child_process'), fs = require('fs'), path = require('path');
const WS = require('../../node_modules/ws');
const [out, fpsArg, fromArg, toArg] = process.argv.slice(2);
const FPS = +fpsArg || 30, FROM = +fromArg || 0;
fs.mkdirSync(out, { recursive: true });
const prof = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rolka-chr-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + prof, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-gpu-vsync', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let tgt;
  for (let i = 0; i < 50 && !tgt; i++) { await sleep(200); try { const l = await (await fetch('http://127.0.0.1:9333/json')).json(); tgt = l.find(x => x.type === 'page'); } catch {} }
  const ws = new WS(tgt.webSocketDebuggerUrl, { maxPayload: 1 << 30 });
  await new Promise(r => ws.on('open', r));
  let id = 0; const pend = {}, waiters = [];
  ws.on('message', d => { const m = JSON.parse(d); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } else if (m.method) waiters.filter(w => w.m === m.method).forEach(w => { waiters.splice(waiters.indexOf(w), 1); w.r(m.params); }); });
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = m => new Promise(r => waiters.push({ m, r }));
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: true });
  await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const loaded = ev('Page.loadEventFired');
  await cmd('Page.navigate', { url: 'http://127.0.0.1:3120/' });
  await loaded; await sleep(800);
  const len = (await cmd('Runtime.evaluate', { expression: 'REEL_LEN', returnByValue: true })).result.result.value;
  const TO = +toArg || len;
  await cmd('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await cmd('Runtime.evaluate', { expression: 'reelStart()' });
  const step = async ms => { const e = ev('Emulation.virtualTimeBudgetExpired'); await cmd('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }); await e; };
  if (FROM > 0) { for (let t = 0; t < FROM * 1000; t += 100) await step(100); }
  const n = Math.round((TO - FROM) * FPS);
  for (let f = 0; f < n; f++) {
    await step(1000 / FPS);
    const shot = await cmd('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(out, String(f).padStart(5, '0') + '.jpg'), Buffer.from(shot.result.data, 'base64'));
    if (f % 60 === 0) process.stdout.write(`${(FROM + f / FPS).toFixed(1)}s `);
  }
  console.log('\nklatki:', n);
  ws.close(); chrome.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
