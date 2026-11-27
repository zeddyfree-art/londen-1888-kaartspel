// Geluid: speelt art/geluid/<naam>.mp3 als dat bestaat, anders een eenvoudige ingebouwde klank.
// Sfeerlussen per oude god en achtergrondmuziek uit Londen 1888.
import { opslag } from "./gemeen.js";

let ctx = null;
const inst = opslag.lees("instellingen", {});
let aan = inst.geluid !== false, muziekAan = inst.muziek === true;
const bestand = {};
let titels = [];

const c = () => {
  if (!aan) return null;
  try { ctx ??= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; } catch { return null; }
};
document.addEventListener("pointerdown", () => { if (ctx && ctx.state !== "running") ctx.resume().catch(() => {}); }, true);

function toon(f, t0, dur, type = "sine", vol = 0.12, f2) {
  const a = c(); if (!a) return;
  const t = a.currentTime + t0;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
function ruis(t0, dur, freq, vol = 0.18, q = 1, freq2) {
  const a = c(); if (!a) return;
  const t = a.currentTime + t0;
  const n = Math.max(1, Math.floor(a.sampleRate * dur)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q; f.frequency.setValueAtTime(freq, t); if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
  const g = a.createGain(); g.gain.value = vol; src.connect(f).connect(g).connect(a.destination); src.start(t);
}

// ingebouwde klanken, voor als het bestand ontbreekt
const SYNTH = {
  "kaart-spelen": () => ruis(0, 0.12, 1800, 0.25, 0.8, 600),
  kaart: () => ruis(0, 0.12, 1800, 0.25, 0.8, 600),
  tik: () => toon(2400, 0, 0.03, "square", 0.025),
  slag: () => { ruis(0, 0.14, 300, 0.3, 1.2, 120); toon(110, 0, 0.12, "triangle", 0.12, 60); },
  treffer: () => { ruis(0, 0.18, 500, 0.35, 0.9, 200); toon(90, 0, 0.15, "sine", 0.15, 50); },
  blok: () => { toon(1320, 0, 0.5, "sine", 0.08); toon(1980, 0.02, 0.4, "sine", 0.05); },
  fluitje: () => { toon(2200, 0, 0.5, "square", 0.04, 2350); toon(2600, 0, 0.5, "sine", 0.04); },
  golf: () => { toon(98, 0, 2.2, "sine", 0.22); toon(196, 0, 1.6, "sine", 0.08); toon(147, 0, 2, "triangle", 0.05); },
  donder: () => { ruis(0, .18, 1400, .11, .6, 240); ruis(.09, 1.35, 155, .17, .8, 48); toon(76, .12, 1.25, "sine", .11, 36); },
  verlicht: () => { ruis(0, 1.6, 900, 0.08, 4, 2600); toon(660, 0.1, 1.4, "sine", 0.03, 990); },
  waanzin: () => { toon(1500, 0, 0.6, "sawtooth", 0.04, 2400); ruis(0.4, 1.4, 700, 0.12, 2, 300); },
  overtuigd: () => toon(880, 0, 0.3, "sine", 0.08),
  dood: () => { ruis(0, 0.4, 1200, 0.15, 0.6, 300); toon(220, 0.05, 0.5, "sine", 0.05, 110); },
  baas: () => { toon(65, 0, 2.6, "sawtooth", 0.08); toon(98, 0, 2.6, "sine", 0.12); ruis(0.8, 1, 120, 0.4, 1, 60); },
  winst: () => { toon(523, 0, 0.25); toon(659, 0.12, 0.25); toon(784, 0.24, 0.5); },
  verlies: () => { toon(330, 0, 0.5, "triangle", 0.1, 220); toon(247, 0.35, 0.8, "triangle", 0.1, 150); },
  klik: () => toon(1200, 0, 0.04, "square", 0.03),
  goed: () => { toon(660, 0, 0.18); toon(880, 0.1, 0.25); },
  schat: () => { toon(784, 0, 0.2); toon(988, 0.1, 0.2); toon(1175, 0.2, 0.35); },
};
// welk bestand uit Londen 1888 we gebruiken zolang er geen eigen geluid is
const LEEN = { "kaart-spelen": "kaart", baas: "monster", dood: "slecht", waanzin: "onheil", golf: "gevaar" };
const VOLUME = { tik: 0.25, kaart: 0.6, "kaart-spelen": 0.6 };

export function laadGeluiden() {
  if (typeof Audio === "undefined") return;
  fetch("data/geluiden.json").then(r => (r.ok ? r.json() : [])).catch(() => []).then(namen => {
    for (const naam of namen) {
      const lang = naam.startsWith("muziek") || naam.startsWith("sfeer");
      const a = new Audio(); a.preload = lang ? "metadata" : "auto";
      const b = (bestand[naam] = { el: a, ok: false });
      a.addEventListener(lang ? "loadedmetadata" : "canplaythrough", () => { b.ok = true; if (naam === wilSfeer) sfeer(wilSfeer, true); if (lang && muziekAan && !muziekEl && naam.startsWith("muziek")) startMuziek(); }, { once: true });
      a.src = `art/geluid/${naam}.mp3`;
    }
  });
  fetch("data/muziek.json").then(r => (r.ok ? r.json() : [])).catch(() => []).then(t => { titels = t; });
}

export function speel(naam) {
  if (!aan) return;
  const b = bestand[naam] || bestand[LEEN[naam]];
  if (b?.ok) { const k = b.el.cloneNode(); k.volume = VOLUME[naam] ?? 0.7; k.play().catch(() => SYNTH[naam]?.()); }
  else SYNTH[naam]?.();
}

/* sfeer en muziek */
let wilSfeer = null, sfeerEl = null, muziekEl = null, muziekNr = 0;
export function sfeer(naam, opnieuw) {
  if (naam === wilSfeer && !opnieuw) return;
  wilSfeer = naam;
  if (sfeerEl) { sfeerEl.pause(); sfeerEl = null; }
  if (!aan || !naam) return;
  const b = bestand[naam] || bestand["sfeer-start"];
  if (!b?.ok) return;
  sfeerEl = b.el; sfeerEl.loop = true; sfeerEl.volume = muziekEl ? 0.12 : 0.3; sfeerEl.currentTime = 0;
  sfeerEl.play().catch(() => { sfeerEl = null; });
}

function nummers() { return Object.keys(bestand).filter(n => /^muziek(-\d+)?$/.test(n) && bestand[n].ok).sort((a, b) => a.localeCompare(b, "nl", { numeric: true })); }
function startMuziek() {
  const lijst = nummers(); if (!lijst.length) return;
  const naam = lijst[muziekNr % lijst.length];
  muziekEl?.pause();
  muziekEl = bestand[naam].el; muziekEl.volume = 0.22; muziekEl.currentTime = 0;
  muziekEl.onended = () => { muziekNr++; startMuziek(); };
  muziekEl.play().catch(() => {});
  if (sfeerEl) sfeerEl.volume = 0.12;
}
export function huidigNummer() {
  const lijst = nummers(); if (!muziekEl || !lijst.length) return null;
  const naam = lijst[muziekNr % lijst.length];
  return titels.find(t => t.bestand === naam)?.titel || naam;
}
export function volgendNummer() { muziekNr++; if (muziekAan) startMuziek(); }
export function zetMuziek(v) {
  muziekAan = v; bewaar();
  if (v) startMuziek(); else { muziekEl?.pause(); muziekEl = null; if (sfeerEl) sfeerEl.volume = 0.3; }
}
export function zetGeluid(v) {
  aan = v; bewaar();
  if (!v) { sfeerEl?.pause(); sfeerEl = null; muziekEl?.pause(); muziekEl = null; }
  else { const s = wilSfeer; wilSfeer = null; sfeer(s); if (muziekAan) startMuziek(); }
}
export const geluidAan = () => aan;
export const muziekIsAan = () => muziekAan;
function bewaar() { const i = opslag.lees("instellingen", {}); i.geluid = aan; i.muziek = muziekAan; opslag.schrijf("instellingen", i); }
