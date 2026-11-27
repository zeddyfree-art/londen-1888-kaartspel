// Gedeelde hulpjes voor het scherm: elementen maken, iconen, opslag, meldingen.

export function el(tag, attr = {}, ...kinderen) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attr || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "style" && typeof v === "object") {
      for (const [naam, waarde] of Object.entries(v)) {
        if (naam.startsWith("--")) e.style.setProperty(naam, waarde);
        else e.style[naam] = waarde;
      }
    }
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

// Elk zegel heeft een eigen silhouet en blijft ook zonder kleur herkenbaar.
const zegel = pad => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${pad}"/></svg>`;
export const STATUSICOON = {
  mist: zegel("M3 8h9c5 0 5-6 1-5 M6 12h13 M2 16h11c5 0 5 6 1 5 M17 8h4"),
  pest: zegel("M8 8 6 4m10 4 2-4M7 12H3m14 0h4M7 16l-4 3m14-3 4 3M8 10q0-4 4-4t4 4v4q0 6-4 6t-4-6zM12 10v7"),
  doorns: zegel("M3 21Q6 8 21 3M6 14l-2-6 6 2m1-3 1-5 3 4m-5 7 6 1-7 3"),
  gezegend: zegel("M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5ZM19 3v4m-2-2h4"),
  bescherming: zegel("M12 2 21 6v5c0 5-4.5 8.5-9 11-4.5-2.5-9-6-9-11V6ZM8 12l3 3 5-6"),
  vervloekt: zegel("M7 16c-3-2-4-4-4-7 0-4 4-7 9-7s9 3 9 7c0 3-1 5-4 7v4H7ZM7 10l3 1m7-1-3 1m-3 5 1-2 1 2m-3 2v2m4-2v2"),
  inkt: zegel("M12 2C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-13ZM9 15q0 3 3 3"),
  bekoring: zegel("M12 20C9 18 2 13 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 5-7 10-10 12ZM8 11q4-4 8 0-4 4-8 0Z"),
  angst: zegel("M4 4q8-3 16 0v7q0 7-8 11-8-4-8-11ZM7 10l3-1m4 0 3 1m-8 7q3-6 6 0"),
  woede: zegel("M13 2c1 5 4 6 4 10 2-1 3-3 3-4 3 8-1 14-8 14S2 17 4 11l3 2c0-5 5-7 6-11ZM11 18q-2-3 1-6 0 3 3 4"),
  trofee: zegel("M7 3h10v5q0 7-5 7T7 8ZM7 5H3v3q0 4 5 4m9-7h4v3q0 4-5 4m-4 3v5m-5 1h10"),
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
