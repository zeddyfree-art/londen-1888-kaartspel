// Gedeelde hulpjes voor het scherm: elementen maken, iconen, opslag, meldingen.

export function el(tag, attr = {}, ...kinderen) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attr || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "html") e.innerHTML = v;
    else if (k === "data") for (const [dk, dv] of Object.entries(v)) e.dataset[dk] = dv;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kinderen.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return e;
}

export const art = pad => (pad ? `art/${pad}` : "");
export const bg = pad => (pad ? `url("${art(pad)}")` : "none");

export const ICOON = {
  aanval: `<svg viewBox="0 0 40 40"><path d="M20 2 L36 9 L33 28 L20 38 L7 28 L4 9Z" fill="#6e1a14" stroke="#e8cf86" stroke-width="2.2"/></svg>`,
  leven: `<svg viewBox="0 0 40 40"><path d="M20 37 C6 27 2 19 4 12 C6 5 15 3 20 10 C25 3 34 5 36 12 C38 19 34 27 20 37Z" fill="#a8342a" stroke="#f5c9bd" stroke-width="2.2"/></svg>`,
  schroot: `<svg viewBox="0 0 40 40"><path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11Z" fill="#545b61" stroke="#d6dde2" stroke-width="2.2"/></svg>`,
  teller: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#e8d8a8" stroke="#5a4520" stroke-width="3"/><path d="M20 5v3M20 32v3M5 20h3M32 20h3" stroke="#5a4520" stroke-width="2"/></svg>`,
  tellerNul: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#b0382c" stroke="#ffd2c8" stroke-width="3"/><path d="M20 5v3M20 32v3M5 20h3M32 20h3" stroke="#ffd2c8" stroke-width="2"/></svg>`,
  hart: `<svg viewBox="0 0 24 24"><path d="M12 21 C4 15 2 11 3 7.5 C4 4 9 3 12 7 C15 3 20 4 21 7.5 C22 11 20 15 12 21Z" fill="currentColor"/></svg>`,
  geest: `<svg viewBox="0 0 24 24"><path d="M2 12 C6 5 18 5 22 12 C18 19 6 19 2 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>`,
  pond: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 8.5c-.5-1.5-3.5-2-4.5 0-.7 1.4 0 3 0 4.5s-1 2.5-2 3h7M8 12.5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  menu: `<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  stapel: `<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 7v12a2 2 0 0 0 2 2h10" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  muziek: `<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/></svg>`,
  terug: `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  mik: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#ff6a4d" stroke-width="3"/><path d="M20 1v10M20 29v10M1 20h10M29 20h10" stroke="#ff6a4d" stroke-width="3"/></svg>`,
};

// kleine glyphs voor statussen; Gezegend, Vervloekt en Mist hebben een fiche uit Londen 1888
const G = p => `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="${p}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const STATUSICOON = {
  mist: { fiche: "fiches/mist.jpg" },
  gezegend: { fiche: "fiches/gezegend.jpg" },
  vervloekt: { fiche: "fiches/vervloekt.jpg" },
  trofee: { fiche: "fiches/trofee.jpg" },
  pest: { svg: G("M8 3v4M5 9a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 5l2 2M13 5l-2 2") },
  doorns: { svg: G("M2 12l3-7 2 5 2-7 2 6 3-5 0 8z") },
  bescherming: { svg: G("M8 2l5 2v4c0 3-2 5-5 6-3-1-5-3-5-6V4z") },
  inkt: { svg: G("M8 2c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z") },
  bekoring: { svg: G("M8 13C3 10 2 7 3 5c1-2 4-2 5 0 1-2 4-2 5 0 1 2 0 5-5 8z") },
  angst: { svg: G("M2 8c2-3 10-3 12 0M5 11c1 1 5 1 6 0M6 6v1M10 6v1") },
  woede: { svg: G("M8 2c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 2 2-1-2 0-4 0-6z") },
};

/* ───────── opslag ───────── */
const SLEUTEL = { run: "kaartspel-run", meta: "kaartspel-meta", instellingen: "kaartspel-instellingen" };
export const opslag = {
  lees(naam, standaard) {
    try { const t = localStorage.getItem(SLEUTEL[naam]); return t ? JSON.parse(t) : standaard; } catch { return standaard; }
  },
  schrijf(naam, waarde) {
    try { if (waarde == null) localStorage.removeItem(SLEUTEL[naam]); else localStorage.setItem(SLEUTEL[naam], JSON.stringify(waarde)); } catch { /* privé-venster: dan maar niet */ }
  },
};

/* ───────── meldingen ───────── */
export function melding(tekst) {
  document.querySelectorAll(".melding").forEach(m => m.remove());
  const m = el("div", { class: "melding", role: "status" }, tekst);
  document.body.append(m);
  setTimeout(() => m.remove(), 2700);
}

export function banner(titel, tekst, soort = "") {
  const b = el("div", { class: `banner ${soort}`, role: "status" }, el("h2", {}, titel), tekst ? el("p", {}, tekst) : null);
  document.body.append(b);
  setTimeout(() => b.remove(), 1700 * Number(getComputedStyle(document.documentElement).getPropertyValue("--snel") || 1) + 100);
}

export function modaal(titel, inhoud, knoppen = []) {
  return new Promise(klaar => {
    const sluit = w => { m.remove(); klaar(w); };
    const m = el("div", { class: "modaal", onclick: e => { if (e.target === m) sluit(null); } },
      el("div", { class: "paneel", role: "dialog", "aria-modal": "true", "aria-label": titel },
        el("h2", {}, titel),
        typeof inhoud === "string" ? el("p", {}, inhoud) : inhoud,
        el("div", { class: "knoppen" }, knoppen.map(k => el("button", { class: `knop ${k.soort || ""}`, onclick: () => sluit(k.waarde) }, k.tekst)))));
    document.body.append(m);
    m.querySelector(".knoppen button:last-child")?.focus();
  });
}

export const wacht = ms => new Promise(r => setTimeout(r, ms));
export const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
