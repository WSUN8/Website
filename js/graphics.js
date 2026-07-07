/* graphics.js — self-contained SVG artwork generators (no dependencies).
   Each function returns an SVG-markup string. Colours use the site's Jazz palette. */

let _uid = 0;
const uid = () => `g${(_uid++).toString(36)}`;

/* ---------- player portrait ----------
   Stylised geometric portrait of a player wearing a Jazz jersey (or a coach in a
   suit for the 'HC' variant). Driven by { number, accent, skin, hair }. */
export function portraitSVG(player) {
  const id = uid();
  const number = player.number ?? '';
  const accent = player.accent || '#582c83';       // jersey / suit colour
  const skin = player.skin || '#c98c5e';
  const hair = player.hair || '#160c22';
  const isCoach = number === 'HC';

  const body = isCoach
    ? `
      <!-- suit jacket -->
      <path d="M34,200 C34,150 56,124 100,124 C144,124 166,150 166,200 Z" fill="${accent}"/>
      <path d="M100,124 L82,200 L96,200 L100,150 L104,200 L118,200 Z" fill="#0e0819"/>
      <!-- shirt + tie -->
      <path d="M92,126 L100,150 L108,126 Z" fill="#f6f3fb"/>
      <path d="M98,130 L102,130 L104,164 L100,172 L96,164 Z" fill="#f9a01b"/>
      <!-- lapels -->
      <path d="M88,128 L100,150 L84,158 Z" fill="#1b0f30"/>
      <path d="M112,128 L100,150 L116,158 Z" fill="#1b0f30"/>
      <!-- clipboard -->
      <g transform="rotate(-14 150 176)">
        <rect x="132" y="150" width="34" height="46" rx="3" fill="#e9e2f6"/>
        <rect x="145" y="146" width="8" height="7" rx="2" fill="#8b5cf6"/>
        <line x1="138" y1="160" x2="160" y2="160" stroke="#8b5cf6" stroke-width="2"/>
        <line x1="138" y1="168" x2="160" y2="168" stroke="#b9aed1" stroke-width="2"/>
        <line x1="138" y1="176" x2="156" y2="176" stroke="#b9aed1" stroke-width="2"/>
      </g>`
    : `
      <!-- jersey -->
      <path d="M34,200 C34,150 56,124 100,124 C144,124 166,150 166,200 Z" fill="${accent}"/>
      <!-- shoulder straps + neckline trim -->
      <path d="M66,132 Q100,150 134,132 L128,120 Q100,138 72,120 Z" fill="#f9a01b" opacity="0.9"/>`;

  return `
<svg viewBox="0 0 200 210" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
     role="img" aria-label="Stylised portrait">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a1466"/>
      <stop offset="1" stop-color="#130a24"/>
    </linearGradient>
    <radialGradient id="halo-${id}" cx="0.5" cy="0.85" r="0.75">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="210" fill="url(#bg-${id})"/>
  <circle cx="100" cy="150" r="95" fill="url(#halo-${id})"/>
  ${body}
  <!-- neck -->
  <rect x="88" y="96" width="24" height="34" rx="8" fill="${skin}"/>
  <path d="M88,112 Q100,124 112,112 L112,130 L88,130 Z" fill="rgba(0,0,0,0.18)"/>
  <!-- head -->
  <circle cx="100" cy="76" r="31" fill="${skin}"/>
  <!-- ears -->
  <circle cx="70" cy="78" r="6" fill="${skin}"/>
  <circle cx="130" cy="78" r="6" fill="${skin}"/>
  <!-- hair -->
  <path d="M69,74 Q70,42 100,42 Q130,42 131,74 Q120,58 100,58 Q80,58 69,74 Z" fill="${hair}"/>
</svg>`;
}

/* ---------- jersey ----------
   Front-facing tank jersey rendered from a colourway config:
   { base, trim, accent, wordmark, number, hasMountain }. */
export function jerseySVG(jersey) {
  const id = uid();
  const base = jersey.base || '#582c83';
  const trim = jersey.trim || '#f9a01b';
  const number = jersey.number ?? '';
  const wordmark = jersey.wordmark || 'JAZZ';
  const numberColor = jersey.numberColor || '#ffffff';
  const textColor = jersey.textColor || trim;

  const mountainChest = jersey.hasMountain ? `
    <clipPath id="chest-${id}">
      <rect x="66" y="96" width="108" height="60" rx="6"/>
    </clipPath>
    <g clip-path="url(#chest-${id})">
      <rect x="66" y="96" width="108" height="60" fill="url(#mtn-${id})"/>
      <path d="M66,152 L92,116 L108,138 L128,108 L150,144 L174,120 L174,156 Z"
            fill="#2b0a4d" opacity="0.85"/>
      <path d="M92,116 L100,126 L84,126 Z M128,108 L138,124 L118,124 Z"
            fill="#f5f0ff" opacity="0.9"/>
    </g>` : '';

  return `
<svg viewBox="0 0 240 280" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
     role="img" aria-label="${wordmark} jersey">
  <defs>
    <linearGradient id="mtn-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#2b0a4d"/>
    </linearGradient>
    <linearGradient id="sheen-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- jersey body -->
  <path d="M62,58 Q62,46 74,46 L98,46 Q120,72 142,46 L166,46 Q178,46 178,58
           L200,100 Q182,112 168,104 L172,250 Q172,262 160,262 L80,262
           Q68,262 68,250 L72,104 Q58,112 40,100 Z"
        fill="${base}" stroke="${trim}" stroke-width="3" stroke-linejoin="round"/>
  <!-- neck trim -->
  <path d="M98,46 Q120,72 142,46" fill="none" stroke="${trim}" stroke-width="5" stroke-linecap="round"/>
  <!-- shoulder trim -->
  <path d="M74,50 L96,50" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
  <path d="M144,50 L166,50" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
  <!-- side stripes -->
  <path d="M72,110 L70,250" stroke="${trim}" stroke-width="4" opacity="0.7"/>
  <path d="M168,110 L170,250" stroke="${trim}" stroke-width="4" opacity="0.7"/>
  ${mountainChest}
  <!-- wordmark -->
  <text x="120" y="120" text-anchor="middle" font-family="Georgia, serif"
        font-size="26" font-weight="bold" letter-spacing="2" fill="${textColor}">${wordmark}</text>
  <!-- number -->
  <text x="120" y="212" text-anchor="middle" font-family="Georgia, serif"
        font-size="90" font-weight="bold" fill="${numberColor}">${number}</text>
  <!-- subtle sheen -->
  <path d="M62,58 Q62,46 74,46 L98,46 Q120,72 142,46 L166,46 Q178,46 178,58
           L200,100 Q182,112 168,104 L172,250 Q172,262 160,262 L80,262
           Q68,262 68,250 L72,104 Q58,112 40,100 Z"
        fill="url(#sheen-${id})"/>
</svg>`;
}

/* ---------- basketball court ----------
   Top-down full court, Jazz-tinted, with labelled hotspot groups for click moments.
   `moments` = [{ hotspot, label }]; hotspot id must match a group below. */
export function courtSVG(moments = []) {
  const id = uid();
  const line = '#f9a01b';
  const lineSoft = 'rgba(249,160,27,0.55)';

  // hotspot coordinates on the 480x260 court
  const spots = {
    shot:     { x: 372, y: 74,  r: 15 },   // right wing three
    pickroll: { x: 300, y: 130, r: 15 },   // top of the key
    paint:    { x: 74,  y: 130, r: 15 },   // left paint / rim
  };

  const hotspotMarkup = moments.map(m => {
    const s = spots[m.hotspot];
    if (!s) return '';
    return `
    <g class="court-hotspot" data-hotspot="${m.hotspot}" tabindex="0"
       role="button" aria-label="${m.label}">
      <circle class="court-hotspot-halo" cx="${s.x}" cy="${s.y}" r="${s.r + 9}"/>
      <circle class="court-hotspot-dot" cx="${s.x}" cy="${s.y}" r="${s.r}"/>
      <text class="court-hotspot-mark" x="${s.x}" y="${s.y + 5}" text-anchor="middle">+</text>
    </g>`;
  }).join('');

  return `
<svg viewBox="0 0 480 260" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
     class="court-svg" role="img" aria-label="Basketball court diagram">
  <defs>
    <linearGradient id="floor-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#241238"/>
      <stop offset="1" stop-color="#130a24"/>
    </linearGradient>
    <radialGradient id="center-${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#3a1466"/>
      <stop offset="1" stop-color="#241238"/>
    </radialGradient>
  </defs>

  <!-- floor -->
  <rect x="10" y="10" width="460" height="240" rx="4" fill="url(#floor-${id})"/>
  <rect x="16" y="16" width="448" height="228" fill="none" stroke="${line}" stroke-width="2.5"/>

  <!-- center line + circle -->
  <line x1="240" y1="16" x2="240" y2="244" stroke="${lineSoft}" stroke-width="2"/>
  <circle cx="240" cy="130" r="34" fill="url(#center-${id})" stroke="${line}" stroke-width="2"/>
  <!-- stylised music-note nod at centre -->
  <g fill="${line}">
    <rect x="248" y="112" width="3.4" height="34" rx="1.5"/>
    <path d="M251.4,112 L262,116 L262,123 L251.4,119 Z"/>
    <ellipse cx="244" cy="147" rx="7" ry="5" transform="rotate(-20 244 147)"/>
  </g>

  <!-- LEFT end -->
  <rect x="16" y="98" width="76" height="64" fill="none" stroke="${line}" stroke-width="2"/>
  <circle cx="92" cy="130" r="24" fill="none" stroke="${line}" stroke-width="2"/>
  <path d="M16,54 A96 96 0 0 1 16 206" fill="none" stroke="${line}" stroke-width="2"/>
  <circle cx="34" cy="130" r="7" fill="none" stroke="${line}" stroke-width="2"/>
  <line x1="24" y1="118" x2="24" y2="142" stroke="${line}" stroke-width="3"/>

  <!-- RIGHT end -->
  <rect x="388" y="98" width="76" height="64" fill="none" stroke="${line}" stroke-width="2"/>
  <circle cx="388" cy="130" r="24" fill="none" stroke="${line}" stroke-width="2"/>
  <path d="M464,54 A96 96 0 0 0 464 206" fill="none" stroke="${line}" stroke-width="2"/>
  <circle cx="446" cy="130" r="7" fill="none" stroke="${line}" stroke-width="2"/>
  <line x1="456" y1="118" x2="456" y2="142" stroke="${line}" stroke-width="3"/>

  ${hotspotMarkup}
</svg>`;
}
