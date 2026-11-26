'use strict';
// Zgłoszone pytania.
// Gdy jest ustawiona zmienna GITHUB_TOKEN, każde zgłoszenie staje się zgłoszeniem (issue) w repozytorium na GitHubie,
// więc nic nie ginie przy restarcie serwera (np. na darmowym Renderze). Bez tokenu zgłoszenia trafiają do pliku zgloszenia.txt.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'zgloszenia.txt');
const TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPO || 'mlodyheros/1-z-10';
const LABEL = 'zgłoszenie';
const API = (process.env.GITHUB_API_URL || 'https://api.github.com') + '/repos/' + REPO;

let list = []; // { id, ts, cat, q, a, by, given, src, issue?, line? }
// wywoływane po każdej zmianie listy (serwer odświeża wtedy poczekalnie)
let onChange = () => {};

// krótki, stały identyfikator zgłoszenia z pliku (z treści wiersza)
const hid = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);

// ---------- plik ----------
// wiersz pliku: „data | kategoria | pytanie | odp: … | zgłosił: … | padła odpowiedź: … | plik: …”
function parseLine(line) {
  const f = line.split(' | ');
  const o = { id: hid(line), line, ts: f[0] || '', cat: f[1] || '', q: f[2] || '' };
  for (const x of f.slice(3)) {
    if (x.startsWith('odp: ')) o.a = x.slice(5);
    else if (x.startsWith('zgłosił: ')) o.by = x.slice(9);
    else if (x.startsWith('padła odpowiedź: ')) o.given = x.slice(17);
    else if (x.startsWith('plik: ')) o.src = x.slice(6);
  }
  return o;
}
const toLine = r => [r.ts, r.cat, r.q, 'odp: ' + r.a, 'zgłosił: ' + r.by, r.given ? 'padła odpowiedź: ' + r.given : '', r.src ? 'plik: ' + r.src : '']
  .filter(Boolean).join(' | ');
const saveFile = () => fs.writeFile(FILE, list.map(x => x.line + '\n').join(''), () => {});

// ---------- GitHub ----------
// zapytanie do API GitHuba; url względny (/issues…) dotyczy repozytorium REPO
async function gh(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    method,
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'trzy-szanse', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('GitHub ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.status === 204 ? null : res.json();
}
// dane zgłoszenia zapisane jako JSON w ukrytym komentarzu HTML w treści issue — da się je odczytać po restarcie
const META = /<!-- zgloszenie (\{.*?\}) -->/s;
// issue z GitHuba → zgłoszenie; stare issue bez komentarza z danymi bierze to, co się da (tytuł, data)
function fromIssue(it) {
  let m = {};
  try { m = JSON.parse((it.body || '').match(META)[1]); } catch {}
  return { id: 'gh' + it.number, issue: it.number, ts: m.ts || (it.created_at || '').slice(0, 16).replace('T', ' '), cat: m.cat || '', q: m.q || it.title.replace(/^Zgłoszenie: /, ''), a: m.a || '', by: m.by || '', given: m.given || '', src: m.src || '', more: it.comments || 0 };
}
// pobiera otwarte zgłoszenia z GitHuba (źródło prawdy), zachowując te, które jeszcze się wysyłają
async function refresh() {
  try {
    const its = await gh('GET', `/issues?state=open&labels=${encodeURIComponent(LABEL)}&per_page=100`);
    const pending = list.filter(x => !x.issue); // jeszcze wysyłane
    // API issues zwraca też pull requesty — pomijamy je; reverse(), bo GitHub daje najnowsze pierwsze
    list = its.filter(i => !i.pull_request).map(fromIssue).reverse().concat(pending);
    onChange();
  } catch (e) { console.error('Zgłoszenia z GitHuba:', e.message); }
}

// treść issue: czytelna dla człowieka + ukryte dane dla fromIssue()
function body(r) {
  return [
    `**Kategoria:** ${r.cat}`,
    `**Pytanie:** ${r.q}`,
    `**Akceptowane odpowiedzi:** ${r.a}`,
    r.given ? `**Gracz odpowiedział:** ${r.given}` : '',
    `**Zgłosił(a):** ${r.by}`,
    r.src ? `**Gdzie poprawić:** \`${r.src}\`` : '',
    '',
    `<!-- zgloszenie ${JSON.stringify({ ts: r.ts, cat: r.cat, q: r.q, a: r.a, by: r.by, given: r.given, src: r.src })} -->`,
  ].filter(x => x !== '').join('\n\n');
}

// ---------- wspólne API ----------
// start: z tokenem co 5 min synchronizacja z GitHubem (zmiany zrobione ręcznie na GitHubie też dotrą), bez tokenu odczyt pliku
function init(cb) {
  onChange = cb || onChange;
  if (TOKEN) {
    console.log('Zgłoszenia: GitHub (' + REPO + ')');
    refresh();
    setInterval(refresh, 5 * 60 * 1000).unref();
  } else {
    try { list = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map(parseLine); } catch {}
    console.log('Zgłoszenia: plik zgloszenia.txt (brak GITHUB_TOKEN)');
  }
}

// nowe zgłoszenie: r = { cat, q, a, by, given, src }
function add(r) {
  r.ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
  if (!TOKEN) {
    r.line = toLine(r); r.id = hid(r.line);
    list.push(r); if (list.length > 500) list.shift();
    fs.appendFile(FILE, r.line + '\n', () => {});
    return onChange();
  }
  // to samo pytanie zgłoszone ponownie: komentarz w istniejącym zgłoszeniu zamiast nowego
  const same = list.find(x => x.q === r.q && x.issue);
  if (same) {
    same.more = (same.more || 0) + 1;
    gh('POST', `/issues/${same.issue}/comments`, { body: `Ponowne zgłoszenie od **${r.by}**${r.given ? ` — odpowiedź: **${r.given}**` : ''}` }).catch(e => console.error(e.message));
    return onChange();
  }
  // tymczasowe id do czasu, aż GitHub zwróci numer issue
  r.id = 'tmp' + hid(r.q + r.ts + Math.random());
  list.push(r); onChange();
  gh('POST', '/issues', { title: 'Zgłoszenie: ' + r.q.slice(0, 200), body: body(r), labels: [LABEL] })
    .then(it => { r.issue = it.number; r.id = 'gh' + it.number; onChange(); })
    .catch(e => { console.error('Nie udało się założyć zgłoszenia:', e.message); });
}

// usunięcie zgłoszenia: w pliku przepisuje całość, na GitHubie zamyka issue jako załatwione
function remove(id) {
  const r = list.find(x => x.id === id);
  if (!r) return;
  list = list.filter(x => x !== r);
  if (!TOKEN) saveFile();
  else if (r.issue) gh('PATCH', `/issues/${r.issue}`, { state: 'closed', state_reason: 'completed' }).catch(e => console.error(e.message));
  onChange();
}

module.exports = { init, add, remove, all: () => list, find: id => list.find(x => x.id === id), github: !!TOKEN };
