// Ludki — rysowane w SVG z kilku wymiennych części.
const AV = {
  skin: ['#ffd9b3', '#f5c193', '#d99a6c', '#a86b42', '#6e4326', '#9be37a', '#8fd3ff', '#d6a5ff'],
  hairColor: ['#2b1b12', '#6b3e1e', '#c98a2b', '#f1d24a', '#e2572b', '#8e8e99', '#ff5fa2', '#3ec7c2', '#ffffff'],
  shirt: ['#e63946', '#f4a236', '#f2d43d', '#3fb56b', '#2ba6c9', '#3b5bdb', '#8a4fd6', '#e2579d', '#2b2d42', '#f5f5f5'],
  hair: 8, eyes: 6, mouth: 6, acc: 8,
};
const AV_PARTS = [
  ['skin', 'Skóra'], ['hair', 'Fryzura'], ['hairColor', 'Kolor włosów'], ['eyes', 'Oczy'],
  ['mouth', 'Usta'], ['shirt', 'Ubranie'], ['acc', 'Dodatek'],
];
function avCount(k) { return Array.isArray(AV[k]) ? AV[k].length : AV[k]; }
function avRandom() { const a = {}; for (const [k] of AV_PARTS) a[k] = Math.floor(Math.random() * avCount(k)); return a; }

function avatarSVG(a, cls) {
  a = a || {};
  const g = k => (a[k] || 0) % avCount(k);
  const skin = AV.skin[g('skin')], hc = AV.hairColor[g('hairColor')], shirt = AV.shirt[g('shirt')];
  const ink = '#1d1730';
  const hairBack = {
    3: `<path d="M22 64 Q18 18 60 18 Q102 18 98 64 L102 112 Q92 118 84 110 L86 62 L34 62 L36 110 Q28 118 18 112Z" fill="${hc}"/>`,
    7: `<circle cx="60" cy="50" r="45" fill="${hc}"/>`,
  }[g('hair')] || '';
  const hairFront = {
    0: '',
    1: `<path d="M26 60 Q22 22 60 22 Q98 22 94 60 Q88 42 60 40 Q32 42 26 60Z" fill="${hc}"/>`,
    2: `<path d="M26 58 L24 34 L36 42 L38 20 L50 36 L60 12 L70 36 L82 20 L84 42 L96 34 L94 58 Q86 42 60 42 Q34 42 26 58Z" fill="${hc}"/>`,
    3: `<path d="M26 60 Q24 24 60 24 Q96 24 94 60 Q84 38 60 44 Q40 40 26 60Z" fill="${hc}"/>`,
    4: `<circle cx="60" cy="16" r="13" fill="${hc}"/><path d="M26 60 Q22 24 60 24 Q98 24 94 60 Q88 42 60 40 Q32 42 26 60Z" fill="${hc}"/>`,
    5: `<path d="M50 44 Q46 -6 60 -4 Q74 -6 70 44Z" fill="${hc}"/>`,
    6: `<g fill="${hc}"><circle cx="32" cy="42" r="12"/><circle cx="46" cy="30" r="13"/><circle cx="62" cy="26" r="13"/><circle cx="78" cy="32" r="13"/><circle cx="90" cy="44" r="11"/></g>`,
    7: `<path d="M28 56 Q30 30 60 30 Q90 30 92 56 Q80 42 60 42 Q40 42 28 56Z" fill="${hc}"/>`,
  }[g('hair')];
  const eyes = [
    `<circle cx="47" cy="62" r="4.5" fill="${ink}"/><circle cx="73" cy="62" r="4.5" fill="${ink}"/>`,
    `<circle cx="47" cy="62" r="9" fill="#fff"/><circle cx="73" cy="62" r="9" fill="#fff"/><circle cx="49" cy="63" r="4" fill="${ink}"/><circle cx="75" cy="63" r="4" fill="${ink}"/>`,
    `<path d="M39 63 Q47 69 55 63 M65 63 Q73 69 81 63" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<circle cx="47" cy="62" r="4.5" fill="${ink}"/><path d="M65 62 Q73 56 81 62" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<circle cx="47" cy="64" r="4.5" fill="${ink}"/><circle cx="73" cy="64" r="4.5" fill="${ink}"/><path d="M38 52 L55 58 M82 52 L65 58" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    `<circle cx="46" cy="60" r="11" fill="#fff"/><circle cx="74" cy="63" r="7" fill="#fff"/><circle cx="43" cy="62" r="4.5" fill="${ink}"/><circle cx="76" cy="62" r="3" fill="${ink}"/>`,
  ][g('eyes')];
  const mouth = [
    `<path d="M46 80 Q60 92 74 80" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M44 78 Q60 100 76 78Z" fill="${ink}"/><path d="M50 88 Q60 94 70 88 Q60 84 50 88Z" fill="#ff6b81"/>`,
    `<path d="M48 84 L72 84" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    `<ellipse cx="60" cy="84" rx="6" ry="8" fill="${ink}"/>`,
    `<path d="M46 80 Q60 90 74 80" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M58 85 Q58 98 66 96 Q72 94 68 84Z" fill="#ff6b81"/>`,
    `<rect x="45" y="78" width="30" height="12" rx="5" fill="#fff" stroke="${ink}" stroke-width="3"/><path d="M53 78 V90 M60 78 V90 M67 78 V90" stroke="${ink}" stroke-width="2"/>`,
  ][g('mouth')];
  const acc = [
    '',
    `<g fill="none" stroke="${ink}" stroke-width="3"><circle cx="46" cy="62" r="11"/><circle cx="74" cy="62" r="11"/><path d="M57 62 H63"/></g>`,
    `<g fill="${ink}"><rect x="32" y="54" width="26" height="15" rx="6"/><rect x="62" y="54" width="26" height="15" rx="6"/><rect x="56" y="58" width="8" height="4"/></g>`,
    `<path d="M26 44 Q28 14 60 14 Q92 14 94 44Z" fill="#e63946"/><path d="M60 40 Q96 38 112 48 Q96 52 60 48Z" fill="#b82733"/>`,
    `<path d="M60 112 L42 102 V122Z M60 112 L78 102 V122Z" fill="#f2d43d"/><circle cx="60" cy="112" r="5" fill="#d9a900"/>`,
    `<path d="M32 30 L28 6 L44 20 L60 2 L76 20 L92 6 L88 30Z" fill="#ffd23f" stroke="#c98a00" stroke-width="2"/>`,
    `<path d="M60 74 Q50 68 40 76 Q50 84 60 77 Q70 84 80 76 Q70 68 60 74Z" fill="${ink}"/>`,
    `<path d="M24 62 Q24 16 60 16 Q96 16 96 62" stroke="#444" stroke-width="5" fill="none"/><rect x="16" y="52" width="13" height="24" rx="6" fill="#ff5fa2"/><rect x="91" y="52" width="13" height="24" rx="6" fill="#ff5fa2"/>`,
  ][g('acc')];
  return `<svg class="av ${cls || ''}" viewBox="0 -8 120 160" xmlns="http://www.w3.org/2000/svg">
    ${hairBack}
    <path d="M18 152 Q18 106 60 106 Q102 106 102 152Z" fill="${shirt}"/>
    <path d="M18 152 Q18 106 60 106 Q102 106 102 152Z" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/>
    <rect x="50" y="92" width="20" height="20" rx="6" fill="${skin}"/>
    <circle cx="25" cy="64" r="7" fill="${skin}"/><circle cx="95" cy="64" r="7" fill="${skin}"/>
    <ellipse cx="60" cy="62" rx="35" ry="37" fill="${skin}"/>
    ${hairFront}${eyes}${mouth}${acc}
  </svg>`;
}
