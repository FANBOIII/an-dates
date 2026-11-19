
"use strict";
const APP_VERSION = 5;
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const parseDay = s => { const [y, m, d] = (s || "").split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const fmtLong = s => parseDay(s).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
const fmtShort = s => parseDay(s).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

const CITIES = {
  "München":[48.137,11.575],"Germering":[48.133,11.367],"Fürstenfeldbruck":[48.178,11.255],"Augsburg":[48.371,10.898],
  "Starnberg":[47.998,11.340],"Dachau":[48.260,11.434],"Freising":[48.402,11.749],"Garmisch-Partenkirchen":[47.492,11.095],
  "Nürnberg":[49.452,11.077],"Regensburg":[49.013,12.102],"Stuttgart":[48.776,9.183],"Frankfurt":[50.110,8.682],
  "Köln":[50.938,6.960],"Berlin":[52.520,13.405],"Hamburg":[53.551,9.994],"Bremen":[53.079,8.801],
  "Salzburg":[47.809,13.055],"Innsbruck":[47.269,11.404],"Alpbach":[47.398,11.944],"Wien":[48.208,16.373]
};

/* Sunset after the NOAA sunrise equation; shown in German/Austrian local time */
function sunset(ds, lat, lng) {
  const r = Math.PI / 180, [y, m, d] = ds.split("-").map(Number);
  const J = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5;
  const n = Math.round(J - 2451545 + 0.0008), Js = n - lng / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const C = 1.9148 * Math.sin(M * r) + 0.02 * Math.sin(2 * M * r) + 0.0003 * Math.sin(3 * M * r);
  const L = (M + C + 282.9372) % 360;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M * r) - 0.0069 * Math.sin(2 * L * r);
  const dec = Math.asin(Math.sin(L * r) * Math.sin(23.4397 * r));
  const cw = (Math.sin(-0.833 * r) - Math.sin(lat * r) * Math.sin(dec)) / (Math.cos(lat * r) * Math.cos(dec));
  if (cw < -1 || cw > 1) return null;
  const t = new Date((Jt + Math.acos(cw) / r / 360 - 2440587.5) * 864e5);
  return t.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
}

const I = {
  film:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4"/></svg>',
  cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/></svg>',
  food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8a2 2 0 0 1-2 2M8 3v6M17 21V3c-2 1-3 4-3 7h3"/></svg>',
  glass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v7M8 21h8"/></svg>',
  walk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  museum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  photo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
  bulb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  nav:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L3 10.5l7.5 3 3 7.5z"/></svg>',
  cloud:'<svg viewBox="0 0 24 24" fill="none" stroke="#6E7FA8" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18z"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="#D99A1E" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  rain:'<svg viewBox="0 0 24 24" fill="none" stroke="#4B6FB8" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 8 3.5 3.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
  snow:'<svg viewBox="0 0 24 24" fill="none" stroke="#5C8CC0" stroke-width="1.7" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/></svg>',
  sunset:'<svg viewBox="0 0 24 24" fill="none" stroke="#D99A1E" stroke-width="1.7" stroke-linecap="round"><path d="M3 18h18M6 14a6 6 0 0 1 12 0M12 4v4M4.2 8.2l1.4 1.4M19.8 8.2l-1.4 1.4M8 21h8"/></svg>',
  up:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  right:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  left:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>'
};
const CATS = {
  kino:{label:"Kino",icon:"film",color:"#4B4FB8"}, cafe:{label:"Café",icon:"cup",color:"#9A6A1E"},
  essen:{label:"Restaurant",icon:"food",color:"#B8325E"}, bar:{label:"Bar",icon:"glass",color:"#7B3FA0"},
  spaziergang:{label:"Spaziergang",icon:"walk",color:"#2F7A4F"}, museum:{label:"Museum",icon:"museum",color:"#4B4FB8"},
  konzert:{label:"Konzert",icon:"music",color:"#7B3FA0"}, aktivitaet:{label:"Aktivität",icon:"star",color:"#C2611F"},
  zuhause:{label:"Zuhause",icon:"home",color:"#9A6A1E"}, sonstiges:{label:"Sonstiges",icon:"heart",color:"#B8325E"}
};
const EVT = { termin:{label:"Termin",color:"#4B4FB8"}, geburtstag:{label:"Geburtstag",color:"#C2611F"}, reise:{label:"Reise",color:"#2F7A4F"}, schule:{label:"Schule/Arbeit",color:"#7B3FA0"}, sonstiges:{label:"Sonstiges",color:"#7C6F74"} };
const DATE_COLOR = "#B8325E";
const WX = { sonnig:{label:"Sonnig",icon:"sun"}, wolkig:{label:"Bewölkt",icon:"cloud"}, regen:{label:"Regen",icon:"rain"}, schnee:{label:"Schnee",icon:"snow"} };
const RSVP = { open:"Noch offen", yes:"Zugesagt", no:"Abgesagt", propose:"Neue Uhrzeit vorgeschlagen" };
const IDEA_TAGS = ["Essen","Aktivität","Ausflug","Zuhause","Reise","Sonstiges"];
const BOW = '<svg class="bow" viewBox="0 0 120 100" aria-hidden="true"><defs><pattern id="gh" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="#D9474F" opacity=".55"/><rect width="8" height="4" fill="#D9474F" opacity=".55"/></pattern></defs><g stroke="#B5323A" stroke-width="1.5"><path d="M60 42 C40 10 8 14 14 40 C18 58 44 54 60 46Z" fill="url(#gh)"/><path d="M60 42 C80 10 112 14 106 40 C102 58 76 54 60 46Z" fill="url(#gh)"/><path d="M56 48 L36 94 L48 88 L54 98 L62 50Z" fill="url(#gh)"/><path d="M64 48 L80 92 L68 87 L64 97 L58 50Z" fill="url(#gh)"/><ellipse cx="60" cy="45" rx="9" ry="8" fill="url(#gh)"/></g></svg>';

/* Seasonal decoration top right of an invitation, chosen by the date's month */
const TOGETHER_SINCE = "2025-12-30";
function starPts(cx, cy, R, r, n) { const p = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; p.push((cx + k * Math.cos(a)).toFixed(1) + "," + (cy + k * Math.sin(a)).toFixed(1)); } return p.join(" "); }
function spokes(cx, cy, n, r1, r2) { let o = ""; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; o += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}"/>`; } return o; }
const DECOR = {
  snowman: () => `<circle cx="60" cy="72" r="23" fill="#fff" stroke="#A9BCD0" stroke-width="2"/><circle cx="60" cy="38" r="15" fill="#fff" stroke="#A9BCD0" stroke-width="2"/><rect x="49" y="12" width="22" height="13" rx="2" fill="#2B2B2B"/><rect x="43" y="23" width="34" height="4" rx="2" fill="#2B2B2B"/><rect x="49" y="19" width="22" height="3" fill="#C8323B"/><circle cx="55" cy="36" r="2" fill="#2B2B2B"/><circle cx="65" cy="36" r="2" fill="#2B2B2B"/><path d="M60 40 L75 43 L60 44Z" fill="#E8792B"/><path d="M45 50 Q60 57 75 50 L75 55 Q60 62 45 55Z" fill="#C8323B"/><path d="M68 55 l3 15 l6 -2 l-3 -14z" fill="#C8323B"/><circle cx="60" cy="66" r="2.2" fill="#2B2B2B"/><circle cx="60" cy="76" r="2.2" fill="#2B2B2B"/><path d="M38 64 L22 54 M83 64 L98 52" stroke="#7A5232" stroke-width="3" stroke-linecap="round"/>`,
  candycane: () => `<path d="M72 94 L72 36 A16 16 0 0 0 40 36" fill="none" stroke="#E7C9CF" stroke-width="17" stroke-linecap="round"/><path d="M72 94 L72 36 A16 16 0 0 0 40 36" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M72 94 L72 36 A16 16 0 0 0 40 36" fill="none" stroke="#C8323B" stroke-width="14" stroke-dasharray="7 7"/><path d="M64 60 C52 52 46 62 56 64 Z M64 60 C76 52 82 62 72 64 Z" fill="#3E8E4E"/>`,
  angel: () => `<ellipse cx="60" cy="14" rx="11" ry="4" fill="none" stroke="#E2B33C" stroke-width="3"/><path d="M57 42 C40 24 20 28 18 46 C32 46 44 50 57 54Z" fill="#fff" stroke="#C9D3E0" stroke-width="2"/><path d="M63 42 C80 24 100 28 102 46 C88 46 76 50 63 54Z" fill="#fff" stroke="#C9D3E0" stroke-width="2"/><path d="M60 38 L84 94 L36 94Z" fill="#F4D77A" stroke="#E2B33C" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="29" r="10" fill="#F6D9C4" stroke="#E2B33C" stroke-width="1.5"/>`,
  star: () => `<polygon points="${starPts(60, 52, 42, 18, 5)}" fill="#F2C14E" stroke="#D49A1E" stroke-width="2.5" stroke-linejoin="round"/><circle cx="48" cy="46" r="3" fill="#fff" opacity=".7"/>`,
  snowflake: () => `<g stroke="#8DB3D9" stroke-width="4" stroke-linecap="round">${spokes(60, 50, 6, 0, 40)}${spokes(60, 50, 6, 22, 22).replace(/<line /g, "<line ")}</g><g stroke="#8DB3D9" stroke-width="3" stroke-linecap="round">${[0,1,2,3,4,5].map(i => { const a = i * Math.PI / 3, x = 60 + 24 * Math.cos(a), y = 50 + 24 * Math.sin(a); return [a + 0.9, a - 0.9].map(b => `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 10 * Math.cos(b)).toFixed(1)}" y2="${(y + 10 * Math.sin(b)).toFixed(1)}"/>`).join(""); }).join("")}</g>`,
  heart: () => `<defs><pattern id="gh2" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><rect width="4" height="8" fill="#D9474F" opacity=".55"/><rect width="8" height="4" fill="#D9474F" opacity=".55"/></pattern></defs><path d="M60 90 C20 62 16 32 38 22 C50 17 58 25 60 34 C62 25 70 17 82 22 C104 32 100 62 60 90Z" fill="url(#gh2)" stroke="#B5323A" stroke-width="2"/>`,
  tulip: () => `<path d="M60 96 L60 50" stroke="#3E8E4E" stroke-width="4"/><path d="M60 82 C44 78 38 64 40 56 C52 60 58 70 60 82Z" fill="#5BAA5F"/><path d="M60 74 C76 70 82 58 80 50 C68 54 62 62 60 74Z" fill="#5BAA5F"/><path d="M42 16 L50 28 L60 12 L70 28 L78 16 C82 36 76 54 60 54 C44 54 38 36 42 16Z" fill="#E2557A" stroke="#B83558" stroke-width="2" stroke-linejoin="round"/>`,
  daisy: () => `<path d="M60 96 L60 60" stroke="#3E8E4E" stroke-width="4"/>${[0,1,2,3,4,5,6,7,8,9].map(i => `<ellipse cx="60" cy="26" rx="7" ry="16" fill="#fff" stroke="#E3D6DA" stroke-width="1.5" transform="rotate(${i * 36} 60 42)"/>`).join("")}<circle cx="60" cy="42" r="10" fill="#F2C14E" stroke="#D49A1E" stroke-width="2"/>`,
  sun: () => `<g stroke="#F2A93B" stroke-width="5" stroke-linecap="round">${spokes(60, 50, 10, 28, 42)}</g><circle cx="60" cy="50" r="21" fill="#F7C548" stroke="#E7A42B" stroke-width="2"/>`,
  icecream: () => `<path d="M44 48 L76 48 L60 96Z" fill="#D9A35B" stroke="#B57E3A" stroke-width="2" stroke-linejoin="round"/><path d="M50 58 L70 58 M53 68 L67 68 M56 78 L64 78" stroke="#B57E3A" stroke-width="1.5"/><circle cx="50" cy="42" r="13" fill="#F3A6C0"/><circle cx="70" cy="42" r="13" fill="#F7E3B5"/><circle cx="60" cy="28" r="13" fill="#A8E0C8"/><circle cx="62" cy="13" r="5" fill="#D9364A"/>`,
  watermelon: () => `<g transform="rotate(-12 60 50)"><path d="M16 40 A44 44 0 0 0 104 40Z" fill="#E8505B"/><path d="M16 40 A44 44 0 0 0 104 40" fill="none" stroke="#3E8E4E" stroke-width="8"/><path d="M22 41 A38 38 0 0 0 98 41" fill="none" stroke="#CDE8B5" stroke-width="3"/>${[[42,52],[60,58],[78,52],[52,64],[68,64]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="3.4" fill="#2B2B2B"/>`).join("")}<path d="M16 40 L104 40" stroke="#E8505B" stroke-width="2"/></g>`,
  leaf: () => `<path d="M60 8 C90 28 96 66 60 90 C24 66 30 28 60 8Z" fill="#D9772B" stroke="#B35A1C" stroke-width="2"/><path d="M60 16 L60 98 M60 40 L76 30 M60 40 L44 30 M60 58 L80 46 M60 58 L40 46 M60 74 L76 64 M60 74 L44 64" stroke="#B35A1C" stroke-width="2" stroke-linecap="round"/>`,
  pumpkin: () => `<path d="M60 30 C58 22 62 16 66 14" stroke="#5E7A2E" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M66 22 C76 14 88 18 86 26 C78 28 72 26 66 22Z" fill="#5BAA5F"/><ellipse cx="42" cy="62" rx="20" ry="26" fill="#E8842F" stroke="#C2631F" stroke-width="2"/><ellipse cx="78" cy="62" rx="20" ry="26" fill="#E8842F" stroke="#C2631F" stroke-width="2"/><ellipse cx="60" cy="62" rx="18" ry="28" fill="#F0953C" stroke="#C2631F" stroke-width="2"/>`,
  acorn: () => `<path d="M60 22 L62 12" stroke="#6B4421" stroke-width="4" stroke-linecap="round"/><path d="M40 46 C40 76 60 92 60 92 C60 92 80 76 80 46Z" fill="#C88A4A" stroke="#9C6631" stroke-width="2"/><path d="M34 48 C34 26 86 26 86 48Z" fill="#8A5A2B" stroke="#6B4421" stroke-width="2"/><path d="M40 40 L80 40 M44 33 L76 33" stroke="#6B4421" stroke-width="1.5" opacity=".6"/>`
};
function decor(ds) {
  const [, m, d] = (ds || "").split("-").map(Number);
  let set;
  if ((m === 12 && d === 30) || (m === 2 && d >= 10 && d <= 16)) set = ["heart"];
  else if (m === 12) set = ["candycane", "angel", "star", "snowman"];
  else if (m === 1 || m === 2) set = ["snowman", "snowflake"];
  else if (m >= 3 && m <= 5) set = ["tulip", "daisy"];
  else if (m >= 6 && m <= 8) set = ["sun", "icecream", "watermelon"];
  else if (m >= 9 && m <= 11) set = ["leaf", "pumpkin", "acorn"];
  else return BOW;
  const h = [...ds].reduce((a, c) => a + c.charCodeAt(0), 0);
  return `<svg class="bow" viewBox="0 0 120 100" aria-hidden="true">${DECOR[set[h % set.length]]()}</svg>`;
}
function togetherBox() {
  const start = parseDay(TOGETHER_SINCE), now = parseDay(todayStr());
  const days = Math.round((now - start) / 864e5);
  if (days < 0) return "";
  let y = now.getFullYear() - start.getFullYear(), m = now.getMonth() - start.getMonth(), d = now.getDate() - start.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const parts = [];
  if (y) parts.push(y + (y === 1 ? " Jahr" : " Jahre"));
  if (m) parts.push(m + (m === 1 ? " Monat" : " Monate"));
  if (d || !parts.length) parts.push(d + (d === 1 ? " Tag" : " Tage"));
  const ann = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  let note;
  if (ann.getTime() === now.getTime() && y > 0) note = `Heute ist unser ${y}. Jahrestag!`;
  else {
    if (ann <= now) ann.setFullYear(ann.getFullYear() + 1);
    const left = Math.round((ann - now) / 864e5), n = ann.getFullYear() - start.getFullYear();
    note = `Noch ${left} ${left === 1 ? "Tag" : "Tage"} bis zu unserem ${n}. Jahrestag`;
  }
  const txt = parts.length > 1 ? parts.slice(0, -1).join(", ") + " und " + parts[parts.length - 1] : parts[0];
  return `<div class="together"><div class="eyebrow">Zusammen seit ${esc(start.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }))}</div>
    <div class="big">${days.toLocaleString("de-DE")} ${days === 1 ? "Tag" : "Tage"}</div><div>${esc(txt)}</div><div class="note">${esc(note)}</div></div>`;
}

/* ---------- weather (Open-Meteo, no key) ---------- */
function wmo(code) {
  if (code == null) return { label: "", icon: "cloud" };
  if (code === 0) return { label: "Klar", icon: "sun" };
  if (code <= 2) return { label: "Teils bewölkt", icon: "sun" };
  if (code === 3) return { label: "Bewölkt", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Nebel", icon: "cloud" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Schnee", icon: "snow" };
  if (code >= 95) return { label: "Gewitter", icon: "rain" };
  if (code >= 80) return { label: "Schauer", icon: "rain" };
  if (code >= 51) return { label: "Regen", icon: "rain" };
  return { label: "", icon: "cloud" };
}
async function geocode(city) {
  if (!city) return null;
  try {
    const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=de&format=json&name=" + encodeURIComponent(city));
    const j = await r.json(); const g = j.results && j.results[0];
    if (g) return { lat: g.latitude, lng: g.longitude };
  } catch (e) {}
  const c = CITIES[city]; return c ? { lat: c[0], lng: c[1] } : null;
}
const WXC = {};
function wxKey(d) { return d.date + "|" + d.lat + "|" + d.lng; }
async function loadWeather(d) {
  if (!d || d.lat == null || !d.date) return;
  const key = wxKey(d); if (WXC[key]) return;
  const days = Math.round((parseDay(d.date) - parseDay(todayStr())) / 864e5);
  if (days < 0 || days > 15) { WXC[key] = { state: "far", days }; return; }
  WXC[key] = { state: "loading" };
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&timezone=auto&start_date=${d.date}&end_date=${d.date}`;
    const j = await (await fetch(u)).json(); const x = j.daily;
    WXC[key] = { state: "ok", hi: Math.round(x.temperature_2m_max[0]), lo: Math.round(x.temperature_2m_min[0]), rain: x.precipitation_probability_max[0], code: x.weather_code[0], sunset: (x.sunset[0] || "").slice(11, 16) };
  } catch (e) { WXC[key] = { state: "err" }; }
  if (S.route.name === "date" || S.route.name === "event") render();
}

/* ---------- state ---------- */
const CFG = window.AN_CONFIG || {};
const configured = !!(CFG.SUPABASE_URL && !/^HIER/.test(CFG.SUPABASE_URL) && CFG.SUPABASE_KEY && !/^HIER/.test(CFG.SUPABASE_KEY));
const sb = configured && window.supabase ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;

const S = {
  phase: "boot", email: "", me: null, slow: false, loaded: false,
  dates: [], events: [], comments: [], photos: [], ideas: [], people: {}, urls: {},
  calMonth: todayStr().slice(0, 7), calDay: todayStr(),
  route: { name: "home" }, draft: null, setup: false, err: ""
};

function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3800);
}
async function run(p, okMsg) {
  try {
    const { error } = await p;
    if (error) { console.error(error); toast("Speichern hat nicht geklappt: " + (error.message || "unbekannter Fehler")); return false; }
    if (okMsg) toast(okMsg);
    queueReload();
    return true;
  } catch (e) { console.error(e); toast("Keine Verbindung. Prüfe dein Internet und versuch es nochmal."); return false; }
}

/* ---------- data ---------- */
let reloadT = null, loading = false, again = false;
function queueReload() { clearTimeout(reloadT); reloadT = setTimeout(loadAll, 250); }
async function loadAll() {
  if (!sb || S.phase !== "app") return;
  if (loading) { again = true; return; }
  loading = true;
  const slowT = setTimeout(() => { S.slow = true; render(); }, 10000);
  try {
    const [d, c, p, i, pe] = await Promise.all([
      sb.from("dates").select("*"), sb.from("comments").select("*"), sb.from("photos").select("*"),
      sb.from("ideas").select("*"), sb.from("people").select("*")
    ]);
    const bad = [d, c, p, i, pe].find(r => r.error);
    if (bad) throw bad.error;
    const rows = d.data.map(r => ({ ...(r.data || {}), id: r.id, createdBy: r.created_by }));
    S.dates = rows.filter(x => x.kind !== "event"); S.events = rows.filter(x => x.kind === "event");
    S.comments = c.data.map(r => ({ id: r.id, dateId: r.date_id, by: r.author, text: r.body, at: Date.parse(r.created_at) }));
    S.photos = p.data.map(r => ({ id: r.id, dateId: r.date_id, path: r.path, by: r.author, at: Date.parse(r.created_at) }));
    S.ideas = i.data.map(r => ({ id: r.id, text: r.body, tag: r.tag, done: r.done, by: r.author, at: Date.parse(r.created_at) }));
    const m = {}; pe.data.forEach(r => { m[r.id] = { name: r.name, initial: r.initial }; }); S.people = m;
    S.loaded = true; S.slow = false;
    const need = S.photos.map(x => x.path).filter(x => !S.urls[x]);
    if (need.length) {
      const { data } = await sb.storage.from("photos").createSignedUrls(need, 60 * 60 * 24 * 7);
      (data || []).forEach(x => { if (x.signedUrl && x.path) S.urls[x.path] = x.signedUrl; });
    }
    if (S.route.name === "edit" && S.draftMissing) startDraft(S.route.id), render(true);
    if (S.route.name === "eventedit" && S.draftMissing) startEventDraft(S.route.id), render(true);
  } catch (e) { console.error(e); S.slow = true; }
  clearTimeout(slowT); loading = false;
  render();
  if (again) { again = false; queueReload(); }
}
function subscribe() {
  sb.channel("an-dates").on("postgres_changes", { event: "*", schema: "public" }, queueReload).subscribe();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && S.phase === "app") loadAll(); });
  setInterval(() => { if (S.route.name === "home" && S.phase === "app") render(); }, 60000);
}

/* ---------- people ---------- */
function personName(id) { const p = S.people[id]; return (p && p.name) || "Jemand"; }
function personInitial(id) { const p = S.people[id]; return (p && (p.initial || (p.name || "").charAt(0))) || "?"; }
function otherPerson() { return Object.keys(S.people).find(i => i !== S.me) || null; }

/* ---------- routing ---------- */
function readRoute() {
  const h = location.hash.slice(1);
  if (h === "ideen") return { name: "ideas" };
  if (h === "erinnerungen") return { name: "memories" };
  if (h === "kalender") return { name: "calendar" };
  if (h === "neuer-termin") return { name: "eventedit", id: null };
  if (h.startsWith("termin-bearbeiten-")) return { name: "eventedit", id: h.slice(18) };
  if (h.startsWith("t-")) return { name: "event", id: h.slice(2) };
  if (h === "neu") return { name: "edit", id: null };
  if (h.startsWith("bearbeiten-")) return { name: "edit", id: h.slice(11) };
  if (h.startsWith("d-")) return { name: "date", id: h.slice(2) };
  return { name: "home" };
}
function onRoute() { S.route = readRoute(); if (S.route.name === "edit") startDraft(S.route.id); if (S.route.name === "eventedit") startEventDraft(S.route.id); render(true); window.scrollTo(0, 0); }
window.addEventListener("hashchange", onRoute);

/* ---------- render ---------- */
function render(force) {
  const app = $("#app");
  if (S.phase !== "app") { app.innerHTML = viewGate(); const t = $("#tabs"); if (t) t.remove(); return; }
  if (!force && (S.route.name === "edit" || S.route.name === "eventedit")) return;
  const ae = document.activeElement, aid = ae && ae.id; let sel = null; try { sel = ae && ae.selectionStart; } catch (e) {}
  const keep = {};
  if (!force) document.querySelectorAll("#app input[id], #app textarea[id]").forEach(el => { if (el.type !== "file" && el.type !== "checkbox") keep[el.id] = el.value; });
  const v = S.route.name;
  app.innerHTML = header() + (v === "date" ? viewDate() : v === "edit" ? viewEdit() : v === "ideas" ? viewIdeas() : v === "memories" ? viewMemories() : v === "calendar" ? viewCalendar() : v === "event" ? viewEvent() : v === "eventedit" ? viewEventEdit() : viewHome());
  Object.entries(keep).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  if (aid) { const el = document.getElementById(aid); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) {} } }
  renderTabs(); renderSetup();
  if (v === "date") loadWeather(S.dates.find(x => x.id === S.route.id));
  if (v === "event") loadWeather(S.events.find(x => x.id === S.route.id));
}
function viewGate() {
  const mono = '<span class="mono" aria-hidden="true">A<small>+</small>N</span>';
  if (S.phase === "boot") return `<div class="login">${mono}<p class="muted">Lädt …</p></div>`;
  if (S.phase === "noconfig") return `<div class="login">${mono}<h1>Fast fertig</h1><p class="muted">Trag in der Datei config.js die Project URL und den Key aus Supabase ein. Die Schritte stehen in der Anleitung (README).</p></div>`;
  if (S.phase === "notmember") return `<div class="login">${mono}<h1>Nicht freigeschaltet</h1><p class="muted">Die E-Mail ${esc(S.email)} steht nicht auf der Freigabeliste. Niklas muss sie in Supabase in der Tabelle „members“ eintragen.</p><button class="btn" type="button" data-act="logout">Mit anderer E-Mail anmelden</button></div>`;
  if (S.phase === "error") return `<div class="login">${mono}<h1>Verbindung fehlgeschlagen</h1><p class="muted">${esc(S.err)}</p><button class="btn" type="button" data-act="retry">Nochmal versuchen</button></div>`;
  return `<div class="login">${mono}<h1>A+N Dates</h1><p class="muted">Beim ersten Mal tippst du auf „Konto erstellen“, danach immer auf „Anmelden“.</p>
    <form id="loginform"><label class="f" for="lg-mail">E-Mail <input id="lg-mail" class="in" type="email" autocomplete="email" value="${esc(S.email)}" required></label>
    <label class="f" for="lg-pw">Passwort <span class="hint">mindestens 8 Zeichen</span><input id="lg-pw" class="in" type="password" autocomplete="current-password" minlength="8" required></label>
    <button class="btn primary" type="submit" data-mode="login">Anmelden</button>
    <button class="btn" type="submit" data-mode="signup">Konto erstellen</button></form></div>`;
}
function header() {
  const meName = S.me && S.people[S.me] ? esc(S.people[S.me].name) : "";
  const warn = S.slow ? '<div class="banner">Die Daten laden gerade nicht. Prüfe deine Internetverbindung. Was du siehst, ist eventuell nicht aktuell.</div>' : "";
  return warn + `<header class="topbar"><div class="brand"><span class="mono" aria-hidden="true">A<small>+</small>N</span><h1>${S.route.name === "ideas" ? "Ideen" : S.route.name === "memories" ? "Erinnerungen" : ["calendar", "event", "eventedit"].includes(S.route.name) ? "Kalender" : "Unsere Dates"}</h1></div>
    <div class="who">${meName ? `Hallo ${meName}<br>` : ""}<button type="button" data-act="setup">Name</button> · <button type="button" data-act="logout">Abmelden</button></div></header>`;
}
function renderTabs() {
  let el = $("#tabs");
  if (!el) { el = document.createElement("div"); el.id = "tabs"; el.className = "tabs"; document.body.appendChild(el); }
  const v = S.route.name;
  const cur = v === "date" ? S.dates.find(x => x.id === S.route.id) : null;
  const pastDate = cur && cur.date < todayStr();
  el.innerHTML = `<nav aria-label="Navigation">
    <a href="#" class="${v === "home" || (v === "date" && !pastDate) || ["calendar", "event", "eventedit"].includes(v) ? "on" : ""}">${I.heart}Dates</a>
    <a href="#erinnerungen" class="${v === "memories" || pastDate ? "on" : ""}">${I.photo}Erinnerungen</a>
    <a href="#neu" class="plus ${v === "edit" ? "on" : ""}"><span class="p">${I.plus}</span>Neues Date</a>
    <a href="#ideen" class="${v === "ideas" ? "on" : ""}">${I.bulb}Ideen</a></nav>`;
}

/* ---------- home ---------- */
function startTime(d) { const s = (d.stops || []).find(x => x.time); const [h, m] = s ? s.time.split(":").map(Number) : [0, 0]; const t = parseDay(d.date); t.setHours(h || 0, m || 0); return t; }
function countdown(d) {
  const ms = startTime(d) - new Date();
  if (ms <= 0) return d.date === todayStr() ? "Heute" : "Jetzt";
  const min = Math.floor(ms / 6e4), h = Math.floor(min / 60), days = Math.round((parseDay(d.date) - parseDay(todayStr())) / 864e5);
  if (days === 0) return h > 0 ? `in ${h} Std ${min % 60} Min` : `in ${min} Min`;
  if (days === 1) return "Morgen";
  return `in ${days} Tagen`;
}
function rsvpChip(d) { const s = (d.rsvp && d.rsvp.status) || "open"; return `<span class="chip ${s}">${RSVP[s]}</span>`; }
function itemCard(d, chip) {
  const dt = parseDay(d.date);
  return `<a class="item" href="#d-${esc(d.id)}"><div class="cal"><b>${dt.getDate()}</b><span>${dt.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}</span></div>
    <div><div class="t">${esc(d.title || "Date")}</div><div class="s">${esc(fmtShort(d.date))}${d.city ? " · " + esc(d.city) : ""}</div></div>${chip || rsvpChip(d)}</a>`;
}
function viewHome() {
  if (!S.loaded) return '<p class="muted">Lädt …</p>';
  const t = todayStr();
  const sorted = [...S.dates].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
  const up = sorted.filter(d => d.date >= t), past = sorted.filter(d => d.date < t).reverse();
  const next = up[0];
  let h = pushPanel() + togetherBox();
  if (next) {
    const first = (next.stops || [])[0];
    h += `<a class="next" href="#d-${esc(next.id)}"><div class="eyebrow">Nächstes Date</div><div class="big">${esc(countdown(next))}</div>
      <div class="title">${esc(fmtLong(next.date))}${first && first.time ? ", " + esc(first.time) + " Uhr" : ""}</div>
      <div class="muted">${esc(next.city || "")}${next.city && next.title ? " · " : ""}${esc(next.title || "")}</div>
      ${next.forName ? `<div class="script">Für ${esc(next.forName)}${next.fromName ? ", von " + esc(next.fromName) : ""}</div>` : ""}</a>`;
  } else {
    h += `<div class="empty"><p>Gerade ist kein Date geplant.</p><a class="btn primary" href="#neu">${I.plus} Date planen</a></div>`;
  }
  h += upcomingBox();
  if (up.length > 1) h += `<section class="section"><h2>Geplant</h2><div class="list">${up.slice(1).map(d => itemCard(d)).join("")}</div></section>`;
  const openIdeas = S.ideas.filter(i => !i.done).length;
  h += `<section class="section"><h2>Ideen</h2><p class="muted">${openIdeas ? `${openIdeas} offene ${openIdeas === 1 ? "Idee" : "Ideen"} auf unserer Liste.` : "Noch keine Ideen gesammelt."} <a href="#ideen">Zur Ideenliste</a></p></section>`;
  return h;
}

/* ---------- memories ---------- */
function viewMemories() {
  if (!S.loaded) return '<p class="muted">Lädt …</p>';
  const t = todayStr();
  const past = S.dates.filter(d => d.date && d.date < t).sort((a, b) => b.date.localeCompare(a.date));
  if (!past.length) return '<div class="empty"><p>Hier landen unsere vergangenen Dates mit Fotos und Notizen.</p></div>';
  return `<div class="list">${past.map(d => {
    const ph = S.photos.filter(p => p.dateId === d.id).sort((a, b) => (a.at || 0) - (b.at || 0));
    const dt = parseDay(d.date);
    const thumbs = ph.filter(p => S.urls[p.path]).slice(0, 4).map(p => `<img src="${esc(S.urls[p.path])}" alt="" loading="lazy">`).join("");
    return `<a class="mem" href="#d-${esc(d.id)}"><div class="item" style="border:0;padding:0;background:none"><div class="cal"><b>${dt.getDate()}</b><span>${dt.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}</span></div>
      <div><div class="t">${esc(d.title || "Date")}</div><div class="s">${esc(dt.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }))}${d.city ? " · " + esc(d.city) : ""}</div></div>
      <span class="chip open">${ph.length} ${ph.length === 1 ? "Foto" : "Fotos"}</span></div>
      ${thumbs ? `<div class="thumbs">${thumbs}</div>` : ""}${d.memo ? `<div class="memo">${esc(d.memo)}</div>` : ""}</a>`;
  }).join("")}</div>`;
}

/* ---------- calendar ---------- */
function calItems() {
  const firstTime = d => ((d.stops || []).find(s => s.time) || {}).time || "";
  return [
    ...S.dates.filter(d => d.date).map(d => ({ id: d.id, title: d.title || "Date", date: d.date, end: d.date, time: firstTime(d), color: DATE_COLOR, label: "Date", href: "#d-" + d.id })),
    ...S.events.filter(e => e.date).map(e => { const ty = EVT[e.type] || EVT.termin; return { id: e.id, title: e.title || ty.label, date: e.date, end: e.endDate && e.endDate > e.date ? e.endDate : e.date, time: e.time || "", color: ty.color, label: ty.label, href: "#t-" + e.id }; })
  ].sort((a, b) => (a.date + (a.time || "00:00")).localeCompare(b.date + (b.time || "00:00")));
}
function itemLine(x, tag) {
  const dt = parseDay(x.date);
  const when = dt.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }) + (x.end !== x.date ? " – " + parseDay(x.end).toLocaleDateString("de-DE", { day: "numeric", month: "short" }) : "") + (x.time ? " · " + x.time + " Uhr" : "");
  return `<${tag} class="crow"${tag === "a" ? ` href="${esc(x.href)}"` : ""}><span class="cdot" style="background:${x.color}"></span><div><div class="t">${esc(x.title)}</div><div class="s">${esc(when)}</div></div><span class="ctag" style="color:${x.color}">${esc(x.label)}</span></${tag}>`;
}
function upcomingBox() {
  const t = todayStr(), up = calItems().filter(x => x.end >= t).slice(0, 4);
  return `<a class="upc" href="#kalender"><div class="hd"><span class="eyebrow">Demnächst</span><span class="more">Kalender ${I.right}</span></div>
    ${up.length ? up.map(x => itemLine(x, "div")).join("") : '<p class="muted" style="margin:4px 0 0">Nichts eingetragen. Tippe hier, um den Kalender zu öffnen.</p>'}</a>`;
}
function viewCalendar() {
  if (!S.loaded) return '<p class="muted">Lädt …</p>';
  const [y, m] = S.calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), offset = (first.getDay() + 6) % 7, daysIn = new Date(y, m, 0).getDate();
  const items = calItems(), t = todayStr();
  let cells = "";
  for (let i = 0; i < offset; i++) cells += '<div class="cd empty"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${y}-${pad(m)}-${pad(d)}`, its = items.filter(x => x.date <= ds && ds <= x.end);
    cells += `<button type="button" class="cd${ds === t ? " today" : ""}${ds === S.calDay ? " sel" : ""}" data-act="calday" data-day="${ds}" aria-label="${esc(fmtLong(ds))}${its.length ? ", " + its.length + " Einträge" : ""}"><span>${d}</span><i>${its.slice(0, 3).map(x => `<b style="background:${x.color}"></b>`).join("")}</i></button>`;
  }
  const mStart = `${y}-${pad(m)}-01`, mEnd = `${y}-${pad(m)}-${pad(daysIn)}`;
  const dayItems = items.filter(x => x.date <= S.calDay && S.calDay <= x.end);
  const monthItems = items.filter(x => x.end >= mStart && x.date <= mEnd);
  const monthName = first.toLocaleDateString("de-DE", { month: "long" });
  return `<a class="back" href="#">${I.left} Startseite</a>
  <div class="calhead"><button class="iconbtn" type="button" data-act="calprev" aria-label="Vorheriger Monat">${I.left}</button><h2>${esc(monthName)} ${y}</h2><button class="iconbtn" type="button" data-act="calnext" aria-label="Nächster Monat">${I.right}</button></div>
  <div class="calgrid">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(w => `<div class="wd">${w}</div>`).join("")}${cells}</div>
  <div class="legend"><span><b style="background:${DATE_COLOR}"></b>Date</span>${Object.values(EVT).map(e => `<span><b style="background:${e.color}"></b>${e.label}</span>`).join("")}</div>
  <section class="section"><div class="row" style="justify-content:space-between"><h2 style="font-size:21px">${esc(fmtLong(S.calDay))}</h2><button class="btn small primary" type="button" data-act="newevent">${I.plus} Termin</button></div>
    <div class="list" style="margin-top:10px">${dayItems.length ? dayItems.map(x => itemLine(x, "a")).join("") : '<p class="muted" style="margin:0">An diesem Tag ist nichts eingetragen.</p>'}</div></section>
  <section class="section"><h2 style="font-size:21px">Im ${esc(monthName)}</h2>
    <div class="list" style="margin-top:10px">${monthItems.length ? monthItems.map(x => itemLine(x, "a")).join("") : '<p class="muted" style="margin:0">In diesem Monat steht noch nichts an.</p>'}</div></section>`;
}
function viewEvent() {
  const e = S.events.find(x => x.id === S.route.id);
  if (!e) return S.loaded ? `<a class="back" href="#kalender">${I.left} Kalender</a><p class="muted">Diesen Termin gibt es nicht mehr.</p>` : '<p class="muted">Lädt …</p>';
  const ty = EVT[e.type] || EVT.termin;
  const when = e.endDate && e.endDate > e.date ? `${fmtLong(e.date)} bis ${fmtLong(e.endDate)}` : fmtLong(e.date);
  const time = e.time ? (e.timeEnd ? `${e.time}–${e.timeEnd} Uhr` : `${e.time} Uhr`) : "Ganztägig";
  return `<a class="back" href="#kalender">${I.left} Kalender</a>
  <article class="invite">${decor(e.date)}
    <div class="eyebrow" style="color:${ty.color}">${ty.label}</div>
    <h1>${esc(e.title || ty.label)}</h1>
    <div class="sub">${esc(when)}</div>
    <div class="sub" style="margin-top:2px">${esc(time)}${e.city ? " · " + esc(e.city) : ""}</div>
    <div style="height:16px"></div>
    ${weatherBox(e)}
    ${e.place ? `<div class="place" style="margin-top:16px">${esc(e.place)}</div><details class="route"><summary>${I.nav} Route</summary><div class="opts">${mapsLinks(e.place)}</div></details>` : ""}
    ${e.note ? `<div class="evnote">${esc(e.note)}</div>` : ""}
    <div class="muted" style="font-size:13px;margin-top:18px">Eingetragen von ${esc(personName(e.createdBy))}</div>
  </article>
  <div class="row" style="margin-top:20px"><a class="btn" href="#termin-bearbeiten-${esc(e.id)}">Bearbeiten</a><button class="btn danger ghost" type="button" data-act="delevent">Termin löschen</button></div>`;
}
function startEventDraft(id) {
  const e = id ? S.events.find(x => x.id === id) : null;
  S.draftMissing = !!id && !e;
  S.edraft = e ? JSON.parse(JSON.stringify(e)) : { id: null, type: "termin", title: "", date: S.prefillDate || todayStr(), endDate: "", time: "", timeEnd: "", city: "München", place: "", note: "" };
  S.prefillDate = "";
}
function viewEventEdit() {
  if (S.draftMissing) return S.loaded ? '<p class="muted">Diesen Termin gibt es nicht mehr.</p>' : '<p class="muted">Lädt …</p>';
  const e = S.edraft, back = e.id ? "#t-" + esc(e.id) : "#kalender";
  return `<a class="back" href="${back}">${I.left} Abbrechen</a>
  <h2 style="font-size:28px;margin-bottom:16px">${e.id ? "Termin bearbeiten" : "Neuer Termin"}</h2>
  <form class="form" id="eventform" novalidate>
    <label class="f" for="ev-title">Was? <input id="ev-title" class="in" data-e="title" value="${esc(e.title)}" placeholder="z. B. Geburtstag von Oma" maxlength="120" required></label>
    <label class="f" for="ev-type">Art <select id="ev-type" class="in" data-e="type">${Object.entries(EVT).map(([k, x]) => opt(k, x.label, e.type)).join("")}</select></label>
    <div class="grid2">
      <label class="f" for="ev-date">Datum <span class="hint">Beginn</span><input id="ev-date" class="in" type="date" data-e="date" value="${esc(e.date)}" required></label>
      <label class="f" for="ev-end">Bis <span class="hint">optional</span><input id="ev-end" class="in" type="date" data-e="endDate" value="${esc(e.endDate || "")}"></label>
    </div>
    <div class="grid2">
      <label class="f" for="ev-time">Uhrzeit <span class="hint">leer = ganztägig</span><input id="ev-time" class="in" type="time" data-e="time" value="${esc(e.time || "")}"></label>
      <label class="f" for="ev-time2">Ende <span class="hint">optional</span><input id="ev-time2" class="in" type="time" data-e="timeEnd" value="${esc(e.timeEnd || "")}"></label>
    </div>
    <label class="f" for="ev-city">Stadt <span class="hint">für Wetter und Sonnenuntergang</span><input id="ev-city" class="in" data-e="city" value="${esc(e.city || "")}" list="citylist2" maxlength="60"></label>
    <datalist id="citylist2">${Object.keys(CITIES).map(c => `<option value="${esc(c)}"></option>`).join("")}</datalist>
    <label class="f" for="ev-place">Wo? <span class="hint">Adresse, Name mit Stadt, oder ein Link aus Google Maps bzw. Apple Karten</span><input id="ev-place" class="in" data-e="place" value="${esc(e.place || "")}" placeholder="z. B. Marienplatz, München"></label>
    <label class="f" for="ev-note">Notiz <textarea id="ev-note" class="in" data-e="note" maxlength="1000" placeholder="z. B. Geschenk nicht vergessen">${esc(e.note || "")}</textarea></label>
    <div class="row" style="margin-top:8px"><button class="btn primary" type="submit">Termin speichern</button><a class="btn ghost" href="${back}">Abbrechen</a></div>
  </form>`;
}

/* ---------- invitation ---------- */
function mapsLinks(place) {
  const p = place.trim(), q = encodeURIComponent(p);
  if (/^https?:\/\//i.test(p)) return `<a class="btn small" href="${esc(p)}" target="_blank" rel="noopener">Link öffnen</a>`;
  return `<a class="btn small" href="https://maps.apple.com/?daddr=${q}" target="_blank" rel="noopener">Apple Karten</a>
          <a class="btn small" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">Google Maps</a>`;
}
function weatherBox(d) {
  const w = d.lat != null ? WXC[wxKey(d)] : null;
  let rows = "";
  if (w && w.state === "ok") {
    const c = wmo(w.code);
    rows += `<div class="l">${I[c.icon]}<b>${w.hi}° / ${w.lo}°</b>${w.rain != null ? `<span>${w.rain} % Regen</span>` : ""}<span class="muted">${esc(c.label)}</span></div>`;
  } else if (w && w.state === "loading") rows += `<div class="l far">Wetter wird geladen …</div>`;
  else if (w && w.state === "far" && w.days > 15) rows += `<div class="l far">Die Wettervorhersage erscheint etwa zwei Wochen vor dem Date.</div>`;
  else if (w && w.state === "err") rows += `<div class="l far">Wetter gerade nicht abrufbar.</div>`;
  const ss = (w && w.state === "ok" && w.sunset) || (d.lat != null && d.date ? sunset(d.date, d.lat, d.lng) : null);
  if (ss) rows += `<div class="l">${I.sunset}<span>Sonnenuntergang <b>${esc(ss)}</b></span></div>`;
  return rows ? `<div class="wx">${rows}</div>` : "";
}
function viewDate() {
  const d = S.dates.find(x => x.id === S.route.id);
  if (!d) return S.loaded ? `<a class="back" href="#">${I.left} Zurück</a><p class="muted">Dieses Date gibt es nicht mehr.</p>` : '<p class="muted">Lädt …</p>';
  const stops = (d.stops || []).map((s, i) => {
    const c = CATS[s.cat] || CATS.sonstiges;
    return `<li class="stop"><div class="num">${i + 1}</div><div>
      ${i > 0 && s.walk ? `<div class="walk">${esc(s.walk)}</div>` : ""}
      <div class="when">${s.time ? `<span class="time">${esc(s.time)}</span>` : ""}<span class="cat" style="color:${c.color}">${I[c.icon]}${c.label}</span></div>
      <h3>${esc(s.name || c.label)}</h3>
      ${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}
      ${s.place ? `<div class="place">${esc(s.place)}</div><details class="route"><summary>${I.nav} Route</summary><div class="opts">${mapsLinks(s.place)}</div></details>` : ""}
    </div></li>`;
  }).join("");
  const r = d.rsvp || { status: "open" };
  const mine = d.createdBy === S.me;
  const past = d.date < todayStr();
  const photos = S.photos.filter(p => p.dateId === d.id).sort((a, b) => (a.at || 0) - (b.at || 0));
  const cmts = S.comments.filter(c => c.dateId === d.id).sort((a, b) => (a.at || 0) - (b.at || 0));
  let rsvpBody = `<div class="rsvp-state">${rsvpChip(d)}${r.by && r.status !== "open" ? ` <span class="muted">von ${esc(personName(r.by))}</span>` : ""}</div>`;
  if (r.status === "propose" && r.proposal) rsvpBody += `<p>Vorschlag: <b>${esc(r.proposal)}</b></p>`;
  if (!mine) {
    rsvpBody += `<div class="row"><button class="btn primary" data-act="rsvp" data-v="yes" type="button">Ich bin dabei</button><button class="btn" data-act="rsvp" data-v="no" type="button">Leider nicht</button></div>
      <div class="row" style="margin-top:10px"><input id="prop-${esc(d.id)}" class="in" style="flex:1;min-width:160px" placeholder="z. B. lieber 19:30" maxlength="80"><button class="btn" data-act="propose" type="button">Vorschlagen</button></div>`;
  } else rsvpBody += `<p class="muted" style="margin:0">Du hast eingeladen. Hier siehst du die Antwort.</p>`;

  return `<a class="back" href="${past ? "#erinnerungen" : "#"}">${I.left} ${past ? "Alle Erinnerungen" : "Alle Dates"}</a>
  <article class="invite">${decor(d.date)}
    <div class="eyebrow">Du bist eingeladen</div>
    <h1>${esc(fmtLong(d.date))}</h1>
    <div class="sub">${esc(d.city || "")}${d.city && d.title ? " · " : ""}${esc(d.title || "")}</div>
    ${d.forName ? `<div class="for">Für ${esc(d.forName)}${d.fromName ? ", von " + esc(d.fromName) : ""}</div>` : '<div style="height:16px"></div>'}
    ${weatherBox(d)}
    ${stops ? `<ol class="tl">${stops}</ol>` : '<p class="muted" style="margin-top:20px">Noch nichts geplant.</p>'}
  </article>

  <section class="panel"><h2>Antwort</h2>${rsvpBody}</section>

  <section class="panel"><h2>${past ? "Erinnerungen" : "Fotos"}</h2>
    ${photos.length ? `<div class="photos">${photos.map(p => `<figure>${S.urls[p.path] ? `<img src="${esc(S.urls[p.path])}" alt="Foto vom Date" loading="lazy" data-act="zoom">` : ""}<button type="button" data-act="delphoto" data-id="${esc(p.id)}" aria-label="Foto löschen">×</button></figure>`).join("")}</div>` : `<p class="muted">${past ? "Hier kommen unsere Fotos von diesem Abend hin." : "Nach dem Date sammeln wir hier unsere Fotos."}</p>`}
    <label class="btn" for="upload">${I.plus} Fotos hinzufügen</label><input id="upload" type="file" accept="image/*" multiple hidden data-date="${esc(d.id)}">
    <label class="f" for="memo-${esc(d.id)}" style="margin-top:14px">Notiz zum Abend
      <textarea id="memo-${esc(d.id)}" class="in" placeholder="Was war das Beste an dem Abend?" maxlength="2000">${esc(d.memo || "")}</textarea></label>
    <div class="row" style="margin-top:8px"><button class="btn small" type="button" data-act="savememo">Notiz speichern</button></div>
  </section>

  <section class="panel"><h2>Nachrichten</h2>
    <div class="comments">${cmts.length ? cmts.map(c => `<div class="cmt"><div class="av">${esc(personInitial(c.by))}</div><div><div class="meta">${esc(personName(c.by))} · ${new Date(c.at).toLocaleString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div><div class="txt">${esc(c.text)}</div></div></div>`).join("") : '<p class="muted" style="margin:0">Noch keine Nachrichten.</p>'}</div>
    <div class="row"><input id="cmt-${esc(d.id)}" class="in" style="flex:1;min-width:160px" placeholder="Schreib etwas zum Date" maxlength="1000"><button class="btn primary" type="button" data-act="comment">Senden</button></div>
  </section>

  <div class="row" style="margin-top:20px"><a class="btn" href="#bearbeiten-${esc(d.id)}">Bearbeiten</a><button class="btn danger ghost" type="button" data-act="deldate">Date löschen</button></div>`;
}

/* ---------- editor ---------- */
function blankStop(i) { return { id: uid("s"), time: i === 0 ? "19:00" : "", cat: i === 0 ? "kino" : "cafe", name: "", note: "", place: "", walk: "" }; }
function startDraft(id) {
  const d = id ? S.dates.find(x => x.id === id) : null;
  S.draftMissing = !!id && !d;
  if (d) { S.draft = JSON.parse(JSON.stringify(d)); return; }
  const me = S.people[S.me], other = S.people[otherPerson()];
  const prefill = S.prefillTitle || ""; S.prefillTitle = "";
  S.draft = { id: null, title: prefill, date: "", city: "München", forName: other ? other.name : "", fromName: me ? me.name : "", stops: [blankStop(0)] };
}
function opt(v, label, cur) { return `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(label)}</option>`; }
function viewEdit() {
  if (S.draftMissing) return S.loaded ? '<p class="muted">Dieses Date gibt es nicht mehr.</p>' : '<p class="muted">Lädt …</p>';
  const d = S.draft;
  const stops = d.stops.map((s, i) => `<div class="stopedit">
    <div class="hd"><b>Punkt ${i + 1}</b><div class="row">
      <button class="iconbtn" type="button" data-act="up" data-i="${i}" aria-label="Nach oben"${i === 0 ? " disabled" : ""}>${I.up}</button>
      <button class="iconbtn" type="button" data-act="down" data-i="${i}" aria-label="Nach unten"${i === d.stops.length - 1 ? " disabled" : ""}>${I.down}</button>
      <button class="iconbtn" type="button" data-act="rmstop" data-i="${i}" aria-label="Punkt entfernen">${I.x}</button></div></div>
    ${i > 0 ? `<label class="f" for="s-walk-${i}">Weg vom Punkt davor <input id="s-walk-${i}" class="in" data-s="${i}" data-k="walk" value="${esc(s.walk)}" placeholder="z. B. 9 Min zu Fuß"></label>` : ""}
    <div class="grid2"><label class="f" for="s-time-${i}">Uhrzeit <input id="s-time-${i}" class="in" type="time" data-s="${i}" data-k="time" value="${esc(s.time)}"></label>
      <label class="f" for="s-cat-${i}">Art <select id="s-cat-${i}" class="in" data-s="${i}" data-k="cat">${Object.entries(CATS).map(([k, c]) => opt(k, c.label, s.cat)).join("")}</select></label></div>
    <label class="f" for="s-name-${i}">Name <input id="s-name-${i}" class="in" data-s="${i}" data-k="name" value="${esc(s.name)}" placeholder="z. B. Mathäser Filmpalast"></label>
    <label class="f" for="s-note-${i}">Handschriftliche Notiz <input id="s-note-${i}" class="in" data-s="${i}" data-k="note" value="${esc(s.note)}" placeholder="z. B. Filmtitel oder ein Hinweis"></label>
    <label class="f" for="s-place-${i}">Ort <span class="hint">Adresse, Name mit Stadt, oder ein Link aus Google Maps bzw. Apple Karten</span>
      <input id="s-place-${i}" class="in" data-s="${i}" data-k="place" value="${esc(s.place)}" placeholder="z. B. Bayerstraße 3-5, München"></label>
  </div>`).join("");
  return `<a class="back" href="${d.id ? "#d-" + esc(d.id) : "#"}">${I.left} Abbrechen</a>
  <h2 style="font-size:28px;margin-bottom:16px">${d.id ? "Date bearbeiten" : "Neues Date planen"}</h2>
  <form class="form" id="editform" novalidate>
    <label class="f" for="e-date">Datum <input id="e-date" class="in" type="date" data-k="date" value="${esc(d.date)}" required></label>
    <label class="f" for="e-title">Motto <input id="e-title" class="in" data-k="title" value="${esc(d.title)}" placeholder="z. B. Ein Film und ein spätes Dessert" maxlength="120"></label>
    <label class="f" for="e-city">Stadt <span class="hint">für Wetter und Sonnenuntergang</span><input id="e-city" class="in" data-k="city" value="${esc(d.city)}" list="citylist" maxlength="60"></label>
    <datalist id="citylist">${Object.keys(CITIES).map(c => `<option value="${esc(c)}"></option>`).join("")}</datalist>
    <div class="grid2">
      <label class="f" for="e-for">Für <input id="e-for" class="in" data-k="forName" value="${esc(d.forName)}" maxlength="40"></label>
      <label class="f" for="e-from">Von <input id="e-from" class="in" data-k="fromName" value="${esc(d.fromName)}" maxlength="40"></label>
    </div>
    <h2 style="font-size:22px;margin-top:6px">Was, Wann und wo?</h2>
    ${stops || '<p class="muted">Noch nichts eingetragen.</p>'}
    <button class="btn" type="button" data-act="addstop">${I.plus} Weiteren Punkt hinzufügen</button>
    <div class="row" style="margin-top:8px"><button class="btn primary" type="submit" id="savebtn">Date speichern</button><a class="btn ghost" href="${d.id ? "#d-" + esc(d.id) : "#"}">Abbrechen</a></div>
  </form>`;
}
function readForm() {
  const d = S.draft; if (!d) return;
  document.querySelectorAll("#editform [data-k]").forEach(el => { if (el.dataset.s == null) d[el.dataset.k] = el.value; });
  document.querySelectorAll("#editform [data-s]").forEach(el => { const s = d.stops[+el.dataset.s]; if (s) s[el.dataset.k] = el.value; });
}

/* ---------- ideas ---------- */
function viewIdeas() {
  const open = S.ideas.filter(i => !i.done).sort((a, b) => (b.at || 0) - (a.at || 0));
  const done = S.ideas.filter(i => i.done).sort((a, b) => (b.at || 0) - (a.at || 0));
  const row = i => `<div class="idea ${i.done ? "done" : ""}"><input type="checkbox" id="ck-${esc(i.id)}" data-act="toggleidea" data-id="${esc(i.id)}" ${i.done ? "checked" : ""} aria-label="Erledigt">
     <div><div class="tx">${esc(i.text)}</div><div class="tg">${esc(i.tag || "")} · von ${esc(personName(i.by))}</div></div>
     <div class="row">${i.done ? "" : `<button class="btn small" type="button" data-act="planidea" data-id="${esc(i.id)}">Planen</button>`}<button class="iconbtn" type="button" data-act="delidea" data-id="${esc(i.id)}" aria-label="Idee löschen">${I.x}</button></div></div>`;
  return `<p class="muted" style="margin-top:0">Hier sammeln wir, was wir mal zusammen machen wollen. Mit „Planen“ wird daraus ein Date.</p>
   <form id="ideaform" class="panel" style="margin-top:0;display:grid;gap:10px">
     <label class="f" for="idea-text">Neue Idee <input id="idea-text" class="in" placeholder="z. B. Eislaufen gehen" maxlength="200"></label>
     <div class="row"><select id="idea-tag" class="in" style="flex:1;min-width:140px" aria-label="Kategorie">${IDEA_TAGS.map(t => `<option>${t}</option>`).join("")}</select><button class="btn primary" type="submit">Hinzufügen</button></div>
   </form>
   <section class="section"><h2>Offen</h2><div class="list">${open.length ? open.map(row).join("") : '<p class="muted">Keine offenen Ideen.</p>'}</div></section>
   ${done.length ? `<section class="section"><h2>Schon gemacht</h2><div class="list">${done.map(row).join("")}</div></section>` : ""}`;
}

/* ---------- setup sheet + dialogs ---------- */
function closeLayer() { const l = $("#layer"); l.innerHTML = ""; l.dataset.k = ""; }
function renderSetup() {
  const layer = $("#layer");
  const need = S.setup || (S.loaded && S.me && !S.people[S.me]);
  if (!need) { if (layer.dataset.k === "setup") closeLayer(); return; }
  if (layer.dataset.k === "setup") return;
  layer.dataset.k = "setup";
  const p = S.people[S.me] || {};
  layer.innerHTML = `<div class="ov"><form class="sheet" id="setupform"><h2>Wer bist du?</h2>
    <p class="muted" style="margin:0">So erscheint dein Name bei Nachrichten, Zusagen und Ideen.</p>
    <label class="f" for="su-name">Vorname <input id="su-name" class="in" value="${esc(p.name || "")}" maxlength="40" required></label>
    <label class="f" for="su-ini">Initiale <input id="su-ini" class="in" value="${esc(p.initial || "")}" maxlength="2" placeholder="z. B. N"></label>
    <div class="row"><button class="btn primary" type="submit">Speichern</button>${S.people[S.me] ? '<button class="btn ghost" type="button" data-act="closesetup">Abbrechen</button>' : ""}</div></form></div>`;
}
function confirmBox(text, yes) {
  return new Promise(res => {
    const ov = document.createElement("div"); ov.className = "ov";
    ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><h2 style="font-size:21px"></h2><div class="row"><button class="btn danger" type="button" data-y>${esc(yes)}</button><button class="btn ghost" type="button" data-n>Abbrechen</button></div></div>`;
    ov.querySelector("h2").textContent = text;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target.closest("[data-y]")) { ov.remove(); res(true); } else if (e.target.closest("[data-n]") || e.target === ov) { ov.remove(); res(false); } });
  });
}
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), "image/jpeg", 0.82));
  } catch (e) { return file; }
}

/* ---------- writes ---------- */
const T = name => sb.from(name);
function saveDateData(d, patch) {
  const data = { ...d, ...patch }; delete data.id; delete data.createdBy;
  return run(T("dates").update({ data }).eq("id", d.id));
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act, d = S.dates.find(x => x.id === S.route.id);
  if (act === "logout") { await sb.auth.signOut(); S.phase = "login"; S.loaded = false; location.hash = ""; render(true); }
  else if (act === "retry") boot();
  else if (act === "calday") { S.calDay = b.dataset.day; render(); }
  else if (act === "calprev" || act === "calnext") {
    const [cy, cm] = S.calMonth.split("-").map(Number), nd = new Date(cy, cm - 1 + (act === "calnext" ? 1 : -1), 1);
    S.calMonth = nd.getFullYear() + "-" + pad(nd.getMonth() + 1); render();
  }
  else if (act === "newevent") { S.prefillDate = S.calDay; location.hash = "neuer-termin"; }
  else if (act === "delevent") {
    const ev = S.events.find(x => x.id === S.route.id);
    if (ev && await confirmBox("Diesen Termin löschen?", "Löschen")) { if (await run(T("dates").delete().eq("id", ev.id))) location.hash = "kalender"; }
  }
  else if (act === "enablepush") enablePush(b);
  else if (act === "backlogin") { S.phase = "login"; render(true); }
  else if (act === "setup") { S.setup = true; renderSetup(); }
  else if (act === "closesetup") { S.setup = false; closeLayer(); }
  else if (act === "rsvp" && d) {
    b.disabled = true;
    if (await saveDateData(d, { rsvp: { status: b.dataset.v, by: S.me, at: Date.now(), proposal: "" } }))
      notify(myName() + (b.dataset.v === "yes" ? " hat zugesagt" : " hat abgesagt"), fmtLong(d.date) + (d.title ? " · " + d.title : ""), "#d-" + d.id);
  }
  else if (act === "propose" && d) {
    const inp = document.getElementById("prop-" + d.id), v = inp.value.trim(); if (!v) { inp.focus(); return; }
    if (await saveDateData(d, { rsvp: { status: "propose", by: S.me, at: Date.now(), proposal: v } })) {
      inp.value = ""; notify(myName() + " schlägt etwas anderes vor", v, "#d-" + d.id);
    }
  }
  else if (act === "comment" && d) {
    const inp = document.getElementById("cmt-" + d.id), v = inp.value.trim(); if (!v) { inp.focus(); return; }
    b.disabled = true;
    if (await run(T("comments").insert({ id: uid("c"), date_id: d.id, body: v }))) { inp.value = ""; notify(myName(), v, "#d-" + d.id); }
    b.disabled = false;
  }
  else if (act === "savememo" && d) {
    const v = document.getElementById("memo-" + d.id).value;
    if (v !== (d.memo || "")) await saveDateData(d, { memo: v }).then(ok => ok && toast("Notiz gespeichert"));
  }
  else if (act === "deldate" && d) {
    if (await confirmBox("Dieses Date mit allen Fotos und Nachrichten löschen?", "Löschen")) {
      const paths = S.photos.filter(p => p.dateId === d.id).map(p => p.path);
      if (paths.length) await sb.storage.from("photos").remove(paths);
      if (await run(T("dates").delete().eq("id", d.id))) location.hash = "";
    }
  }
  else if (act === "delphoto") {
    const p = S.photos.find(x => x.id === b.dataset.id);
    if (p && await confirmBox("Foto endgültig löschen?", "Löschen")) {
      await sb.storage.from("photos").remove([p.path]);
      await run(T("photos").delete().eq("id", p.id));
    }
  }
  else if (act === "zoom") {
    const lb = document.createElement("div"); lb.className = "lightbox"; const im = document.createElement("img"); im.src = b.src; im.alt = "Foto";
    lb.appendChild(im); lb.addEventListener("click", () => lb.remove()); document.body.appendChild(lb);
  }
  else if (act === "addstop") { readForm(); S.draft.stops.push(blankStop(S.draft.stops.length)); render(true); }
  else if (act === "rmstop") { readForm(); S.draft.stops.splice(+b.dataset.i, 1); render(true); }
  else if (act === "up" || act === "down") {
    readForm(); const i = +b.dataset.i, j = act === "up" ? i - 1 : i + 1, a = S.draft.stops;
    if (j >= 0 && j < a.length) { [a[i], a[j]] = [a[j], a[i]]; render(true); }
  }
  else if (act === "toggleidea") { const i = S.ideas.find(x => x.id === b.dataset.id); if (i) await run(T("ideas").update({ done: !i.done }).eq("id", i.id)); }
  else if (act === "delidea") { const i = S.ideas.find(x => x.id === b.dataset.id); if (i && await confirmBox("Idee löschen?", "Löschen")) await run(T("ideas").delete().eq("id", i.id)); }
  else if (act === "planidea") { const i = S.ideas.find(x => x.id === b.dataset.id); S.prefillTitle = i ? i.text : ""; location.hash = "neu"; }
});

document.addEventListener("change", async e => {
  const el = e.target;
  if (el.id === "upload" && el.files && el.files.length) {
    const files = [...el.files], dateId = el.dataset.date; el.value = "";
    toast(files.length === 1 ? "Foto wird hochgeladen …" : files.length + " Fotos werden hochgeladen …");
    let ok = 0;
    for (const f of files) {
      const path = dateId + "/" + uid("p") + ".jpg";
      const blob = await shrink(f);
      const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (error) { console.error(error); toast("Ein Foto konnte nicht hochgeladen werden: " + error.message); continue; }
      if (await run(T("photos").insert({ id: uid("p"), date_id: dateId, path }))) ok++;
    }
    if (ok) notify(myName() + (ok === 1 ? " hat ein Foto hochgeladen" : " hat " + ok + " Fotos hochgeladen"), "", "#d-" + dateId);
  }
});

document.addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("[type=submit]");
  if (f.id === "loginform") {
    const email = $("#lg-mail").value.trim().toLowerCase(), password = $("#lg-pw").value;
    if (!email || password.length < 8) { toast("Bitte E-Mail und ein Passwort mit mindestens 8 Zeichen eingeben."); return; }
    const mode = (e.submitter && e.submitter.dataset.mode) || "login";
    f.querySelectorAll("button").forEach(x => x.disabled = true);
    const res = mode === "signup" ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password });
    f.querySelectorAll("button").forEach(x => x.disabled = false);
    S.email = email;
    if (res.error) {
      const m = res.error.message || "";
      if (/already registered|already exists/i.test(m)) toast("Für diese E-Mail gibt es schon ein Konto. Tippe auf „Anmelden“.");
      else if (/invalid login/i.test(m)) toast("E-Mail oder Passwort stimmt nicht.");
      else if (/not confirmed/i.test(m)) toast("In Supabase ist „Confirm email“ noch an. Bitte ausschalten (siehe Anleitung).");
      else toast("Hat nicht geklappt: " + m);
      return;
    }
    if (!res.data.session) { toast("Konto angelegt, aber in Supabase ist „Confirm email“ noch an. Bitte ausschalten und dann anmelden."); return; }
    await afterLogin(res.data.session);
  }
  if (f.id === "setupform") {
    const name = $("#su-name").value.trim(); if (!name) { $("#su-name").focus(); return; }
    const initial = ($("#su-ini").value.trim() || name.charAt(0)).toUpperCase();
    if (await run(T("people").upsert({ id: S.me, name, initial }))) { S.setup = false; S.people[S.me] = { name, initial }; closeLayer(); render(); }
  }
  if (f.id === "editform") {
    readForm(); const d = S.draft;
    if (!d.date) { toast("Bitte ein Datum wählen."); $("#e-date").focus(); return; }
    btn.disabled = true;
    const id = d.id || uid("d");
    const orig = S.dates.find(x => x.id === id);
    const city = (d.city || "").trim();
    let lat = orig && orig.city === city ? orig.lat : null, lng = orig && orig.city === city ? orig.lng : null;
    if (city && lat == null) { const g = await geocode(city); if (g) { lat = g.lat; lng = g.lng; } }
    const data = { title: (d.title || "").trim(), date: d.date, city, lat, lng, forName: (d.forName || "").trim(), fromName: (d.fromName || "").trim(),
      stops: d.stops.map(s => ({ id: s.id || uid("s"), time: s.time, cat: s.cat, name: s.name.trim(), note: s.note.trim(), place: s.place.trim(), walk: (s.walk || "").trim() })),
      rsvp: (orig && orig.rsvp) || { status: "open", by: "", at: 0, proposal: "" }, memo: (orig && orig.memo) || "" };
    if (await run(T("dates").upsert({ id, data }))) {
      const what = (data.title ? data.title + " · " : "") + fmtLong(data.date);
      if (orig) notify(myName() + " hat ein Date geändert", what, "#d-" + id);
      else notify(myName() + " hat dich zu einem Date eingeladen", what, "#d-" + id);
      location.hash = "d-" + id;
    }
    else btn.disabled = false;
  }
  if (f.id === "eventform") {
    const e = S.edraft;
    document.querySelectorAll("#eventform [data-e]").forEach(el => { e[el.dataset.e] = el.value; });
    if (!e.title.trim()) { toast("Bitte eintragen, was ansteht."); $("#ev-title").focus(); return; }
    if (!e.date) { toast("Bitte ein Datum wählen."); $("#ev-date").focus(); return; }
    btn.disabled = true;
    const id = e.id || uid("e"), orig = S.events.find(x => x.id === id), city = (e.city || "").trim();
    let lat = orig && orig.city === city ? orig.lat : null, lng = orig && orig.city === city ? orig.lng : null;
    if (city && lat == null) { const g = await geocode(city); if (g) { lat = g.lat; lng = g.lng; } }
    const data = { kind: "event", type: e.type || "termin", title: e.title.trim(), date: e.date, endDate: e.endDate && e.endDate > e.date ? e.endDate : "",
      time: e.time || "", timeEnd: e.time ? (e.timeEnd || "") : "", city, lat, lng, place: (e.place || "").trim(), note: (e.note || "").trim() };
    if (await run(T("dates").upsert({ id, data }))) {
      notify(myName() + (orig ? " hat einen Termin geändert" : " hat einen Termin eingetragen"), data.title + " · " + fmtLong(data.date), "#t-" + id);
      S.calDay = data.date; S.calMonth = data.date.slice(0, 7);
      location.hash = "t-" + id;
    } else btn.disabled = false;
  }
  if (f.id === "ideaform") {
    const t = $("#idea-text"), v = t.value.trim(); if (!v) { t.focus(); return; }
    if (await run(T("ideas").insert({ id: uid("i"), body: v, tag: $("#idea-tag").value }))) { t.value = ""; t.focus(); notify("Neue Idee von " + myName(), v, "#ideen"); }
  }
});

/* ---------- push ---------- */
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!CFG.VAPID_PUBLIC_KEY;
let swReg = null;
function b64ToU8(b) { const p = "=".repeat((4 - b.length % 4) % 4); const r = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, c => c.charCodeAt(0)); }
async function initPush() {
  if (!pushSupported) { S.push = isIOS && !standalone ? "needhome" : "unsupported"; return; }
  try {
    swReg = await navigator.serviceWorker.register("sw.js");
    if (Notification.permission === "denied") { S.push = "denied"; return; }
    const sub = await swReg.pushManager.getSubscription();
    if (sub && Notification.permission === "granted") {
      S.push = "on";
      await sb.from("push_subscriptions").upsert({ endpoint: sub.endpoint, sub: sub.toJSON() });
    } else S.push = "off";
  } catch (e) { console.error(e); S.push = "unsupported"; }
}
async function enablePush(btn) {
  btn.disabled = true;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { S.push = perm === "denied" ? "denied" : "off"; render(); return; }
    const reg = swReg || await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(CFG.VAPID_PUBLIC_KEY) });
    const { error } = await sb.from("push_subscriptions").upsert({ endpoint: sub.endpoint, sub: sub.toJSON() });
    if (error) throw error;
    S.push = "on"; toast("Mitteilungen sind an.");
  } catch (e) { console.error(e); toast("Mitteilungen konnten nicht aktiviert werden: " + (e.message || e)); }
  btn.disabled = false; render();
}
function pushPanel() {
  if (S.push === "off") return `<div class="panel" style="margin:0 0 16px"><h2 style="font-size:19px">Mitteilungen</h2><p class="muted" style="margin:4px 0 12px">Bekomm Bescheid, wenn ein neues Date, eine Zusage oder eine Nachricht kommt.</p><button class="btn primary" type="button" data-act="enablepush">Mitteilungen aktivieren</button></div>`;
  if (S.push === "denied") return `<div class="banner">Mitteilungen sind blockiert. Erlauben kannst du sie in den iPhone-Einstellungen unter Mitteilungen → A+N.</div>`;
  if (S.push === "needhome") return `<div class="banner">Für Mitteilungen: In Safari auf Teilen → „Zum Home-Bildschirm“ tippen und die App über das A+N-Icon öffnen.</div>`;
  return "";
}
function myName() { return (S.people[S.me] && S.people[S.me].name) || "Jemand"; }
function notify(title, body, url) {
  if (!sb) return;
  sb.functions.invoke("notify", { body: { title, body, url } }).catch(e => console.error(e));
}

/* ---------- auto update ---------- */
async function checkUpdate() {
  try {
    const r = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
    const v = (await r.json()).v;
    if (v > APP_VERSION) {
      let tried = null; try { tried = sessionStorage.getItem("an-upd"); } catch (e) {}
      if (tried === String(v)) return;
      try { sessionStorage.setItem("an-upd", String(v)); } catch (e) {}
      location.replace("./?v=" + v + location.hash);
    }
  } catch (e) {}
}
checkUpdate();
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });

/* ---------- boot ---------- */
let subscribed = false;
async function afterLogin(session) {
  S.me = session.user.id; S.email = session.user.email || S.email;
  const { data, error } = await sb.rpc("is_member");
  if (error) { S.phase = "error"; S.err = "Die Datenbank antwortet nicht. Ist setup.sql ausgeführt und das Supabase-Projekt aktiv (nicht pausiert)? " + (error.message || ""); render(true); return; }
  if (!data) { S.phase = "notmember"; render(true); return; }
  S.phase = "app"; S.route = readRoute(); if (S.route.name === "edit") startDraft(S.route.id);
  render(true);
  if (!subscribed) { subscribed = true; subscribe(); }
  await loadAll();
  await initPush(); render();
}
async function boot() {
  S.phase = "boot"; render(true);
  if (!sb) { S.phase = "noconfig"; render(true); return; }
  try {
    const { data } = await sb.auth.getSession();
    if (!data.session) { S.phase = "login"; render(true); return; }
    await afterLogin(data.session);
  } catch (e) { S.phase = "error"; S.err = "Keine Verbindung. Prüfe dein Internet."; render(true); }
}
boot();
