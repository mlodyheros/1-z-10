'use strict';
// Sprawdzanie odpowiedzi z tolerancją na literówki ("autokorekta").

const NUM = { zero: 0, jeden: 1, jedna: 1, jedno: 1, dwa: 2, dwie: 2, trzy: 3, cztery: 4, piec: 5, szesc: 6, siedem: 7, osiem: 8, dziewiec: 9, dziesiec: 10, jedenascie: 11, dwanascie: 12, trzynascie: 13, czternascie: 14, pietnascie: 15, szesnascie: 16, siedemnascie: 17, osiemnascie: 18, dziewietnascie: 19, dwadziescia: 20, trzydziesci: 30, czterdziesci: 40, piecdziesiat: 50, szescdziesiat: 60, siedemdziesiat: 70, osiemdziesiat: 80, dziewiecdziesiat: 90, sto: 100, dwiescie: 200, tysiac: 1000 };

function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/ł/g, 'l').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .map(w => (w in NUM ? String(NUM[w]) : w))
    .join(' ');
}

// odległość Damerau-Levenshteina (z zamianą sąsiednich liter)
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let pp = null, prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      cur[j] = v;
    }
    pp = prev; prev = cur;
  }
  return prev[n];
}

const tol = len => (len <= 3 ? 0 : len <= 7 ? 1 : len <= 12 ? 2 : 3);

function matchOne(g, a) {
  if (!g || !a) return false;
  if (g === a) return true;
  const gs = g.replace(/ /g, ''), as = a.replace(/ /g, '');
  if (gs === as) return true;
  // odpowiedzi liczbowe: cyfry muszą się zgadzać dokładnie
  if (/^[0-9 ]+$/.test(a)) return (g.match(/\d+/g) || []).join(' ') === a;
  if (/\d/.test(a) && (g.match(/\d+/g) || []).join(' ') !== (a.match(/\d+/g) || []).join(' ')) return false;
  if (lev(gs, as) <= tol(as.length)) return true;
  // pełna odpowiedź zawarta w dłuższej wypowiedzi ("to jest paryz")
  if (as.length >= 4 && (' ' + g + ' ').includes(' ' + a + ' ')) return true;
  // samo nazwisko / ostatni człon ("mickiewicz" dla "adam mickiewicz")
  const t = a.split(' ');
  if (t.length > 1) {
    for (let k = 1; k < t.length; k++) {
      const suf = t.slice(k).join('');
      if (suf.length >= 5 && lev(gs, suf) <= tol(suf.length)) return true;
    }
    // ta sama odpowiedź w innej kolejności słów ("kopernik mikolaj")
    const so = s => s.split(' ').sort().join('');
    if (lev(so(g), so(a)) <= tol(as.length)) return true;
  }
  return false;
}

// given: tekst gracza, answers: lista akceptowanych odpowiedzi, allAnswers: Set znormalizowanych odpowiedzi z całej bazy
function isCorrect(given, answers, allAnswers) {
  const g = norm(given);
  if (!g) return false;
  const list = answers.map(norm);
  if (list.includes(g)) return true;
  // literówka nie może zamieniać odpowiedzi w inną istniejącą (Iran/Irak, Austria/Australia)
  if (allAnswers && allAnswers.has(g)) return false;
  return list.some(a => matchOne(g, a));
}

module.exports = { norm, lev, isCorrect };
