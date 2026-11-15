// Ludki — rysowane w SVG z wymiennych warstw.
// Kolejność warstw: włosy z tyłu → ręce → tułów → głowa → zarost → twarz → włosy z przodu → okulary → nakrycie głowy.
// Nakrycie głowy przycina włosy (clipPath), więc fryzura nigdy nie wystaje przez czapkę.
const AV = {
  skin: ['#ffe0c2', '#ffd0a6', '#f1b98a', '#d99a6c', '#b87a4b', '#8d5a34', '#5e3a20', '#9be37a', '#8fd3ff', '#d6a5ff'],
  hairColor: ['#1f1410', '#4a2c17', '#7a4a22', '#c98a2b', '#f1d24a', '#e2572b', '#8e8e99', '#f4f4f4', '#ff5fa2', '#3ec7c2'],
  shirt: ['#e63946', '#f4a236', '#f2d43d', '#3fb56b', '#1f9e8f', '#2ba6c9', '#3b5bdb', '#8a4fd6', '#e2579d', '#2b2d42', '#f5f5f5', '#8a5a3c'],
  hair: 12, eyes: 8, mouth: 8, outfit: 6, hat: 9, glasses: 5, beard: 5,
};
const AV_PARTS = ['skin', 'hair', 'hairColor', 'eyes', 'mouth', 'beard', 'glasses', 'hat', 'shirt', 'outfit'];
const AV_OPTIONAL = { hat: 0.5, glasses: 0.6, beard: 0.65 };
function avCount(k) { return Array.isArray(AV[k]) ? AV[k].length : AV[k]; }
function avRandom() {
  const a = {};
  for (const k of AV_PARTS) a[k] = AV_OPTIONAL[k] && Math.random() < AV_OPTIONAL[k] ? 0 : Math.floor(Math.random() * avCount(k));
  return a;
}
let avUid = 0;
function avShade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function avatarSVG(a, cls) {
  a = a || {};
  const g = k => ((parseInt(a[k], 10) || 0) % avCount(k) + avCount(k)) % avCount(k);
  const skin = AV.skin[g('skin')], hc = AV.hairColor[g('hairColor')], shirt = AV.shirt[g('shirt')];
  const dark = avShade(shirt, 0.72), ink = '#1d1730', uid = 'av' + (++avUid);
  const hair = g('hair'), hat = g('hat');
  const cap = `<path d="M26 60 Q22 22 60 22 Q98 22 94 60 Q88 42 60 40 Q32 42 26 60Z" fill="${hc}"/>`;

  const hairBack = {
    3: `<path d="M22 64 Q18 18 60 18 Q102 18 98 64 L102 112 Q92 118 84 110 L86 62 L34 62 L36 110 Q28 118 18 112Z" fill="${hc}"/>`,
    7: `<circle cx="60" cy="50" r="45" fill="${hc}"/>`,
    8: `<path d="M22 60 Q20 18 60 18 Q100 18 98 60 L98 90 Q90 98 84 90 L84 60 L36 60 L36 90 Q30 98 22 90Z" fill="${hc}"/>`,
    9: `<path d="M88 38 Q120 42 112 86 Q108 98 99 92 Q106 66 88 58Z" fill="${hc}"/>`,
    11: `<circle cx="17" cy="74" r="13" fill="${hc}"/><circle cx="103" cy="74" r="13" fill="${hc}"/>`,
  }[hair] || '';
  const hairFront = {
    0: '',
    1: cap,
    2: `<path d="M26 58 L24 34 L36 42 L38 20 L50 36 L60 12 L70 36 L82 20 L84 42 L96 34 L94 58 Q86 42 60 42 Q34 42 26 58Z" fill="${hc}"/>`,
    3: `<path d="M26 60 Q24 24 60 24 Q96 24 94 60 Q84 38 60 44 Q40 40 26 60Z" fill="${hc}"/>`,
    4: `<circle cx="60" cy="14" r="13" fill="${hc}"/>${cap}`,
    5: `<path d="M50 44 Q46 -8 60 -6 Q74 -8 70 44Z" fill="${hc}"/>`,
    6: `<g fill="${hc}"><circle cx="32" cy="42" r="12"/><circle cx="46" cy="30" r="13"/><circle cx="62" cy="26" r="13"/><circle cx="78" cy="32" r="13"/><circle cx="90" cy="44" r="11"/></g>`,
    7: `<path d="M28 56 Q30 30 60 30 Q90 30 92 56 Q80 42 60 42 Q40 42 28 56Z" fill="${hc}"/>`,
    8: `<path d="M27 58 Q28 24 60 24 Q92 24 93 58 Q78 44 60 46 Q42 44 27 58Z" fill="${hc}"/>`,
    9: cap,
    10: `<path d="M26 60 Q18 20 62 20 Q100 20 94 58 Q90 38 54 36 Q38 44 26 60Z" fill="${hc}"/>`,
    11: `<path d="M26 60 Q22 22 60 22 Q98 22 94 60 Q86 44 62 40 L60 26 L58 40 Q34 44 26 60Z" fill="${hc}"/>`,
  }[hair];
  // od jakiej wysokości włosy mogą być widoczne pod nakryciem głowy
  const clipY = [null, 39, 26, 39, 30, 31, 12, 24, null][hat];
  const clip = clipY == null ? '' : ` clip-path="url(#${uid}h)"`;

  const eyes = [
    `<circle cx="47" cy="62" r="4.5" fill="${ink}"/><circle cx="73" cy="62" r="4.5" fill="${ink}"/>`,
    `<circle cx="47" cy="62" r="9" fill="#fff"/><circle cx="73" cy="62" r="9" fill="#fff"/><circle cx="49" cy="63" r="4" fill="${ink}"/><circle cx="75" cy="63" r="4" fill="${ink}"/>`,
    `<path d="M39 63 Q47 69 55 63 M65 63 Q73 69 81 63" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<circle cx="47" cy="62" r="4.5" fill="${ink}"/><path d="M65 62 Q73 56 81 62" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<circle cx="47" cy="64" r="4.5" fill="${ink}"/><circle cx="73" cy="64" r="4.5" fill="${ink}"/><path d="M38 53 L55 58 M82 53 L65 58" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    `<circle cx="46" cy="61" r="10" fill="#fff"/><circle cx="74" cy="63" r="7" fill="#fff"/><circle cx="43" cy="63" r="4.5" fill="${ink}"/><circle cx="76" cy="62" r="3" fill="${ink}"/>`,
    `<path d="M39 65 Q47 56 55 65 M65 65 Q73 56 81 65" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<ellipse cx="47" cy="63" rx="7" ry="8.5" fill="#fff"/><ellipse cx="73" cy="63" rx="7" ry="8.5" fill="#fff"/><circle cx="48" cy="64" r="4" fill="${ink}"/><circle cx="74" cy="64" r="4" fill="${ink}"/><circle cx="49.5" cy="62" r="1.4" fill="#fff"/><circle cx="75.5" cy="62" r="1.4" fill="#fff"/><path d="M39 56 L36 52 M43 54 L41 49 M81 56 L84 52 M77 54 L79 49" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`,
  ][g('eyes')];
  const mouth = [
    `<path d="M46 82 Q60 94 74 82" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M44 80 Q60 102 76 80Z" fill="${ink}"/><path d="M50 90 Q60 96 70 90 Q60 86 50 90Z" fill="#ff6b81"/>`,
    `<path d="M48 86 L72 86" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`,
    `<ellipse cx="60" cy="86" rx="6" ry="8" fill="${ink}"/>`,
    `<path d="M46 82 Q60 92 74 82" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M58 87 Q58 100 66 98 Q72 96 68 86Z" fill="#ff6b81"/>`,
    `<rect x="45" y="80" width="30" height="12" rx="5" fill="#fff" stroke="${ink}" stroke-width="3"/><path d="M53 80 V92 M60 80 V92 M67 80 V92" stroke="${ink}" stroke-width="2"/>`,
    `<path d="M46 90 Q60 80 74 90" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M48 86 Q62 92 74 80" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  ][g('mouth')];
  const beardShape = 'M26 68 Q26 104 60 104 Q94 104 94 68 Q90 82 76 80 Q60 74 44 80 Q30 82 26 68Z';
  const beard = [
    '',
    `<path d="M60 75 Q50 69 40 77 Q50 85 60 78 Q70 85 80 77 Q70 69 60 75Z" fill="${hc}"/>`,
    `<path d="M49 94 Q60 112 71 94 Q60 99 49 94Z" fill="${hc}"/>`,
    `<path d="${beardShape}" fill="${hc}"/>`,
    `<path d="${beardShape}" fill="${hc}" opacity=".28"/>`,
  ][g('beard')];
  const glasses = [
    '',
    `<g fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="3"><circle cx="46" cy="62" r="12"/><circle cx="74" cy="62" r="12"/></g><path d="M58 62 H62 M34 60 L26 58 M86 60 L94 58" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    `<g fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="3"><rect x="33" y="52" width="24" height="19" rx="4"/><rect x="63" y="52" width="24" height="19" rx="4"/></g><path d="M57 60 H63 M33 58 L26 57 M87 58 L94 57" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    `<g fill="${ink}"><path d="M31 54 H58 V62 Q58 72 45 72 Q32 72 31 62Z"/><path d="M62 54 H89 V62 Q88 72 75 72 Q62 72 62 62Z"/><rect x="56" y="55" width="8" height="4"/></g><path d="M31 56 L25 57 M89 56 L95 57" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M36 58 L44 58 M67 58 L75 58" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/>`,
    `<circle cx="74" cy="62" r="12" fill="rgba(255,255,255,.2)" stroke="#d9a900" stroke-width="3"/><path d="M82 72 Q92 96 84 112" stroke="#d9a900" stroke-width="1.6" fill="none"/>`,
  ][g('glasses')];
  const hats = [
    '',
    `<path d="M26 44 Q26 8 60 8 Q94 8 94 44Z" fill="#e63946"/><path d="M58 37 Q98 33 116 45 Q98 52 58 46Z" fill="#b82733"/><circle cx="60" cy="9" r="3.5" fill="#b82733"/>`,
    `<path d="M31 31 L27 4 L44 18 L60 -2 L76 18 L93 4 L89 31Z" fill="#ffd23f" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="20" r="4" fill="#e63946"/><circle cx="42" cy="24" r="3" fill="#2ba6c9"/><circle cx="78" cy="24" r="3" fill="#2ba6c9"/>`,
    `<circle cx="60" cy="3" r="9" fill="#f5f5f5"/><path d="M26 42 Q24 8 60 8 Q96 8 94 42Z" fill="#3b5bdb"/><rect x="24" y="34" width="72" height="13" rx="6.5" fill="#6f8cff"/>`,
    `<rect x="35" y="-16" width="50" height="50" rx="4" fill="#23202e"/><rect x="35" y="20" width="50" height="9" fill="#e63946"/><ellipse cx="60" cy="33" rx="44" ry="7" fill="#17141f"/>`,
    `<path d="M36 34 Q32 -2 50 4 Q60 10 70 4 Q88 -2 84 34Z" fill="#9a6a3c"/><path d="M36 28 H84 V34 H36Z" fill="#5e3a20"/><path d="M4 32 Q30 22 60 32 Q90 22 116 32 Q90 46 60 40 Q30 46 4 32Z" fill="#7d5230"/>`,
    `<path d="M24 62 Q24 14 60 14 Q96 14 96 62" stroke="#3a3a48" stroke-width="6" fill="none"/><rect x="14" y="50" width="15" height="27" rx="7" fill="#ff5fa2"/><rect x="91" y="50" width="15" height="27" rx="7" fill="#ff5fa2"/>`,
    `<path d="M41 28 L60 -22 L79 28Z" fill="#8a4fd6"/><path d="M47 12 L73 12 M44 21 L76 21 M52 0 L68 0" stroke="#f2d43d" stroke-width="3.5"/><circle cx="60" cy="-22" r="6" fill="#f2d43d"/>`,
    `<path d="M84 22 L66 10 V34Z M84 22 L102 10 V34Z" fill="#ff5fa2"/><circle cx="84" cy="22" r="5.5" fill="#d93b82"/>`,
  ][hat];
  const bodyPath = 'M18 160 Q18 106 60 106 Q102 106 102 160Z';
  const outfit = [
    '',
    `<g clip-path="url(#${uid}b)" stroke="${dark}" stroke-width="7"><path d="M0 122 H120 M0 138 H120 M0 154 H120"/></g>`,
    `<path d="M40 110 Q60 132 80 110" stroke="${dark}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M52 124 V144 M68 124 V144" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M46 107 L60 132 L74 107Z" fill="#fff"/><path d="M56.5 110 H63.5 L66 132 L60 140 L54 132Z" fill="#e63946"/><path d="M46 107 L60 132 L48 150 M74 107 L60 132 L72 150" stroke="${dark}" stroke-width="3" fill="none"/>`,
    `<path d="M60 116 L42 106 V126Z M60 116 L78 106 V126Z" fill="#f2d43d"/><circle cx="60" cy="116" r="5" fill="#d9a900"/>`,
    `<path d="M60 124 L64.5 134.5 L76 135.5 L67.5 143 L70 154 L60 148 L50 154 L52.500 143 L44 135.500 L55.500 134.500Z" fill="#fff" opacity=".9"/>`,
  ][g('outfit')];

  return `<svg class="av ${cls || ''}" viewBox="0 -30 120 198" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><clipPath id="${uid}b"><path d="${bodyPath}"/></clipPath>${clipY == null ? '' : `<clipPath id="${uid}h"><rect x="-20" y="${clipY}" width="160" height="220"/></clipPath>`}</defs>
    <g${clip}>${hairBack}</g>
    <path d="${bodyPath}" fill="${shirt}"/>${outfit}
    <path d="${bodyPath}" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
    <g class="arm arm-l"><rect x="6" y="112" width="19" height="46" rx="9.500" fill="${shirt}" stroke="rgba(0,0,0,.2)" stroke-width="2"/><circle cx="15.500" cy="158" r="9.500" fill="${skin}"/></g>
    <g class="arm arm-r"><rect x="95" y="112" width="19" height="46" rx="9.500" fill="${shirt}" stroke="rgba(0,0,0,.2)" stroke-width="2"/><circle cx="104.500" cy="158" r="9.500" fill="${skin}"/></g>
    <g class="head">
      <rect x="50" y="92" width="20" height="20" rx="6" fill="${skin}"/>
      <circle cx="25" cy="64" r="7" fill="${skin}"/><circle cx="95" cy="64" r="7" fill="${skin}"/>
      <ellipse cx="60" cy="62" rx="35" ry="37" fill="${skin}"/>
      ${beard}<g class="face">${eyes}${mouth}</g>
      <g class="fx fx-laugh"><path d="M39 56 L54 63 L39 70 M81 56 L66 63 L81 70" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 78 Q60 108 78 78Z" fill="${ink}"/><path d="M50 92 Q60 100 70 92 Q60 87 50 92Z" fill="#ff6b81"/><path d="M45 79 H75 L73 84 H47Z" fill="#fff"/></g>
      <g class="fx fx-cry"><path d="M39 61 Q47 68 55 61 M65 61 Q73 68 81 61 M38 55 L54 50 M82 55 L66 50" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M47 94 Q60 76 73 94 Q60 89 47 94Z" fill="${ink}"/><path class="tear" d="M44 68 Q41 84 44 102 M76 68 Q79 84 76 102" stroke="#5cc8ff" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="9 9"/></g>
      <g class="fx fx-fear"><path d="M27 46 Q60 22 93 46 Q60 38 27 46Z" fill="#5c7cff" opacity=".4"/><circle cx="46" cy="62" r="11" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="74" cy="62" r="11" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="46" cy="63" r="2.8" fill="${ink}"/><circle cx="74" cy="63" r="2.8" fill="${ink}"/><path d="M36 46 L52 44 M84 46 L68 44" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M45 88 Q49 82 53 88 Q57 94 61 88 Q65 82 69 88 Q73 94 76 88" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path class="sweat" d="M96 40 Q102 50 96 53 Q90 50 96 40Z" fill="#5cc8ff"/></g>
      <g class="fx fx-dab"><path d="M39 63 H55 M65 63 H81" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/><path d="M50 86 Q60 92 70 86" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
      <g${clip}>${hairFront}</g>
      ${glasses}${hats}
    </g>
    <g class="fx fx-dabarm"><path d="M17 122 L46 96 L90 60" stroke="${shirt}" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 122 L46 96 L90 60" stroke="rgba(0,0,0,.12)" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="93" cy="57" r="9.5" fill="${skin}"/></g>
  </svg>`;
}
