// Het gevechtsscherm: tekent de toestand en vertaalt aanrakingen naar acties.
// De motor geeft gebeurtenissen terug; die spelen we hier af als animaties en geluiden.
import { el, bg, ICOON, banner, melding, wacht, reduceMotion, modaal } from "./gemeen.js";
import { kaartEl, eenheidEl, werkBij, uitlegEl } from "./kaart-dom.js";
import { B, kaartDef } from "../motor/bibliotheek.js";
import {
  geldigeDoelen, kanSpelen, geestKosten, eenhedenVan, volgordeNummers, aanvalsDoelen, fluitjeOpgeladen, verlichtDrempel, FLUITJE_OPLADEN,
} from "../motor/gevecht.js";
import { speel } from "./geluid.js";

const RIJEN = ["straat", "riool"];

/**
 * opties: {
 *   g: () => de huidige gevechtstoestand,
 *   stuur: async actie => ({ g, ev }),        voert een actie uit (via de run)
 *   ponden: () => getal, plekArt, instellingen, menu: () => void, hulp: (g) => tekst | null
 * }
 */
export function gevechtScherm(app, opties) {
  const S = { keuze: null, bezig: false, sleep: null, hoverTimer: null, langTimer: null };
  const root = el("div", { class: "scherm gevecht" });
  app.replaceChildren(root);
  const inst = opties.instellingen;
  const snel = () => (inst.snel ? 0.5 : 1) * (reduceMotion() ? 0.2 : 1);
  document.documentElement.style.setProperty("--snel", String(snel()));

  /* ───────── tekenen ───────── */

  function render() {
    verbergHover();
    const g = opties.g();
    document.body.classList.toggle("verlicht", !!g.verlicht);
    root.replaceChildren(
      el("div", { class: "plekbeeld", style: { backgroundImage: bg(opties.plekArt) } }),
      balk(g), slagveld(g), aanwijzing(g), onder(g),
    );
    markeerDoelen();
  }

  function balk(g) {
    const h = g.eenheden[g.held];
    const golvenOver = g.golven.length - g.golfNr;
    const grens = Math.floor(g.maxGeest * verlichtDrempel(g));
    return el("div", { class: "balk" },
      el("button", { class: "icoonknop", "aria-label": "Menu", html: ICOON.menu, onclick: () => { if (!S.bezig && !S.sleep) opties.menu(); } }),
      el("div", {}, el("div", { class: "gnaam" }, g.naam), el("div", { class: "golfinfo" }, `Golf ${g.golfNr} van ${g.golven.length} · beurt ${g.beurt}`)),
      el("button", { class: `bigben ${golvenOver && g.bigben <= 1 ? "dreig" : ""}`, title: "Big Ben: de volgende golf", onclick: () => toonVolgendeGolf(g) },
        el("div", { class: "bb", style: { backgroundImage: bg("scherm/big-ben.jpg") } }),
        golvenOver ? [el("b", {}, String(g.bigben)), el("span", {}, g.bigben === 1 ? "slag tot" : "slagen tot", el("br"), "de volgende golf")] : el("span", {}, "laatste", el("br"), "golf")),
      el("div", { class: "ruimte" }),
      el("div", { class: "meter lichaam", title: "Lichaam van je held" }, el("span", { html: ICOON.hart, style: { width: "18px", height: "18px", display: "inline-flex" } }), `${Math.max(0, h?.leven ?? 0)}/${h?.maxLeven ?? 0}`),
      el("div", { class: `meter geest ${g.verlicht ? "verlicht" : ""}`, title: `Geest. Verlicht bij ${grens} of minder.` },
        el("span", { html: ICOON.geest, style: { width: "18px", height: "18px", display: "inline-flex" } }), `${g.geest}/${g.maxGeest}`,
        el("span", { class: "verlichtwoord" }, "Verlicht"),
        el("span", { class: "balkje" }, el("b", { style: { width: `${(100 * g.geest) / g.maxGeest}%` } }), el("i", { class: "grens", style: { left: `${(100 * grens) / g.maxGeest}%` } }))),
      el("div", { class: "meter ponden", title: "Ponden" }, el("span", { html: ICOON.pond, style: { width: "18px", height: "18px", display: "inline-flex" } }), String(opties.ponden() + g.buit)),
    );
  }

  function kolom(kant, plek) { return kant === "speler" ? 3 - plek : plek + 1; }

  function slagveld(g) {
    const nrs = inst.volgorde !== false ? volgordeNummers(g) : {};
    const mik = new Set();
    for (const v of eenhedenVan(g, "vijand")) if (v.teller === 1 && !v.statussen.mist && v.aanval != null) for (const d of aanvalsDoelen(g, v)) mik.add(d.uid);
    const veld = el("div", { class: "slagveld", data: { doel: "veld" } });
    for (const kant of ["speler", "vijand"]) {
      const k = el("div", { class: `kant ${kant}` });
      k.append(el("h2", { class: "kantnaam" }, kant === "speler" ? "Jouw zijde" : "Vijanden"));
      for (const rij of RIJEN) for (let p = 0; p < 3; p++) {
        const vak = el("div", { class: `vak ${rij}`, style: { gridRow: rij === "straat" ? 1 : 2, gridColumn: kolom(kant, p) }, data: { kant, rij, plek: p, ...(kant === "speler" ? { doel: `vak:${rij}:${p}` } : {}) } });
        const uid = g.veld[kant][rij][p];
        const u = uid && g.eenheden[uid];
        if (u && !u.groot) { vak.append(eenheidMetHandlers(u, nrs[u.uid], mik.has(u.uid))); if (nrs[u.uid]) vak.append(el("div", { class: "volgnr", title: "Volgorde van toeslaan" }, String(nrs[u.uid]))); }
        if (!u && kant === "speler") {
          vak.setAttribute("aria-label", `${rij}, ${["voor", "midden", "achter"][p]}`);
          vak.setAttribute("role", "button");
        }
        k.append(vak);
      }
      // grote kaart over twee vakken
      const groot = eenhedenVan(g, kant).find(u => u.groot);
      if (groot) {
        const gv = el("div", { class: "vak groot-vak", style: { gridRow: "1 / span 2", gridColumn: kolom(kant, groot.vak.plek) } });
        gv.append(eenheidMetHandlers(groot, nrs[groot.uid], false));
        if (nrs[groot.uid]) gv.append(el("div", { class: "volgnr" }, String(nrs[groot.uid])));
        k.append(gv);
      }
      veld.append(k);
      if (kant === "speler") veld.append(el("div", { class: "middenlijn" },
        el("span", {}, "Straat"), el("span", {}, "Riool")));
    }
    return veld;
  }

  function kaartContext(def) {
    const g = opties.g();
    return { g, grens: Math.floor(g.maxGeest * verlichtDrempel(g) + 1e-9), geestKost: geestKosten(g, def) };
  }

  function eenheidMetHandlers(u, nr, mik) {
    const k = eenheidEl(u, { g: opties.g(), volgnr: nr, mikpunt: mik });
    k.dataset.doel = `u:${u.uid}`;
    bindDetail(k, () => (u.soort === "held" ? { ...B().helden[u.id], soort: "held" } : kaartDef(u.id, u.verbeterd)), () => opties.g().eenheden[u.uid]);
    if (u.kant === "speler" && !u.groot) bindSleep(k, { soort: "eenheid", uid: u.uid });
    else {
      toetsActie(k, u.naam, () => tikDoel(`u:${u.uid}`));
      bindLang(k, () => tikDoel(`u:${u.uid}`));
    }
    return k;
  }

  function onder(g) {
    const hand = el("div", { class: "hand", "aria-label": "Je hand" });
    hand.style.setProperty("--aantal", Math.max(g.hand.length, 6));
    const n = g.hand.length;
    g.hand.forEach((i, idx) => {
      const d = kaartDef(i.id, i.verbeterd);
      const k = kaartEl(i.id, { inst: i, geestKost: geestKosten(g, d) });
      k.dataset.inst = i.uid;
      const hoek = (idx - (n - 1) / 2) * Math.min(3, 17 / Math.max(1, n));
      const zak = Math.abs(idx - (n - 1) / 2) ** 2 * .65;
      k.style.transform = `rotate(${hoek}deg) translateY(${zak}px)`;
      if (!kanSpelen(g, i)) k.classList.add("kan-niet");
      if (S.keuze?.soort === "hand" && S.keuze.inst === i.uid) k.classList.add("gekozen");
      bindDetail(k, () => d);
      bindSleep(k, { soort: "hand", inst: i.uid });
      hand.append(k);
    });
    const opgeladen = fluitjeOpgeladen(g);
    const nodig = g.ctx.artefacten.includes("klokkenbel") ? 2 : FLUITJE_OPLADEN;
    const zak = el("div", { class: "zak", "aria-label": "Middeltjes" });
    for (let i = 0; i < 3; i++) {
      const id = g.zak[i];
      if (!id) { zak.append(el("div", { class: "middel leeg", title: "Lege plek voor een middeltje" })); continue; }
      const d = kaartDef(id);
      const m = el("div", { class: `middel ${S.keuze?.soort === "middel" && S.keuze.index === i ? "gekozen" : ""}`, style: { backgroundImage: bg(d.art) }, title: d.naam, role: "button" });
      bindDetail(m, () => d);
      bindSleep(m, { soort: "middel", index: i });
      zak.append(m);
    }
    return el("div", { class: "onder" },
      el("button", { class: "stapelvak", style: { backgroundImage: bg("achterkanten/stad.jpg") }, title: "Trekstapel", onclick: () => toonStapel("Trekstapel", g.trek) }, el("small", {}, "trekstapel"), el("b", {}, String(g.trek.length))),
      hand,
      el("button", { class: "stapelvak", style: { backgroundImage: bg("achterkanten/toestanden.jpg") }, title: "Aflegstapel", onclick: () => toonStapel("Aflegstapel", g.afleg) }, el("small", {}, "aflegstapel"), el("b", {}, String(g.afleg.length))),
      el("div", { class: "acties" },
        el("button", { class: `fluitje ${opgeladen ? "opgeladen" : ""}`, onclick: () => fluit(), title: "Leg je hand af en trek 6 nieuwe kaarten" },
          el("div", { class: "fi", style: { backgroundImage: bg("persoonlijk/politiefluitje.jpg") } }),
          el("div", {}, el("b", {}, "Politiefluitje"), el("span", {}, opgeladen ? "Opgeladen: kost geen beurt" : `Kost je beurt · ${Math.min(g.fluitjeRust, nodig)}/${nodig}`))),
        el("div", { class: "terugroep", role: "button", data: { doel: "terug" }, "aria-label": "Bondgenoot terugroepen" }, "Bondgenoot terugroepen"),
        zak),
    );
  }

  /* ───────── doelen ───────── */

  function doelenVan(keuze) {
    const g = opties.g();
    if (!keuze) return new Set();
    const uit = new Set();
    if (keuze.soort === "hand") {
      const i = g.hand.find(x => x.uid === keuze.inst);
      if (!i || !kanSpelen(g, i)) return uit;
      const gd = geldigeDoelen(g, i);
      if (gd.soort === "vak") for (const v of gd.lijst) uit.add(`vak:${v.rij}:${v.plek}`);
      else if (gd.soort === "eenheid") for (const u of gd.lijst) uit.add(`u:${u}`);
      else if (gd.soort === "veld") uit.add("veld");
    } else if (keuze.soort === "eenheid") {
      const u = g.eenheden[keuze.uid];
      for (const r of RIJEN) for (let p = 0; p < 3; p++) if (!(u.vak.rij === r && u.vak.plek === p)) {
        const ander = g.veld.speler[r][p];
        uit.add(ander ? `u:${ander}` : `vak:${r}:${p}`);
      }
      if (u.soort === "bondgenoot") uit.add("terug");
    } else if (keuze.soort === "middel") {
      const d = kaartDef(g.zak[keuze.index]);
      if (d.doel === "eigen") for (const u of eenhedenVan(g, "speler")) uit.add(`u:${u.uid}`);
      else uit.add("veld");
    }
    return uit;
  }

  function markeerDoelen() {
    const doelen = doelenVan(S.keuze);
    root.querySelectorAll("[data-doel]").forEach(e => {
      const ja = doelen.has(e.dataset.doel);
      e.classList.toggle("doelwit", ja && e.dataset.doel !== "veld");
      if (e.matches(".vak,.terugroep,.slagveld")) e.tabIndex = ja ? 0 : -1;
    });
    root.querySelector(".slagveld").classList.toggle("veld-doel", doelen.has("veld"));
    const raad = root.querySelector(".speeltip");
    if (S.keuze && raad) {
      const eerste = [...doelen][0] || "";
      raad.textContent = S.keuze.soort === "eenheid" ? "Kies een vak om te verplaatsen of een bondgenoot om te wisselen." :
        eerste.startsWith("vak:") ? "Kies een verlicht vak aan jouw zijde." :
        eerste.startsWith("u:") ? "Kies een verlichte kaart als doel." :
        eerste === "veld" ? "Kies het slagveld of tik nogmaals op de kaart." : "Deze kaart heeft nu geen geldig doel.";
    }
  }

  function actieVoor(keuze, doel) {
    const g = opties.g();
    if (!keuze || !doel) return null;
    const geldig = doelenVan(keuze);
    if (geldig.has("veld") && doel !== "terug") doel = "veld";
    if (!geldig.has(doel)) return null;
    if (keuze.soort === "hand") {
      if (doel.startsWith("vak:")) { const [, rij, plek] = doel.split(":"); return { soort: "speel", kaart: keuze.inst, vak: { rij, plek: +plek } }; }
      if (doel.startsWith("u:") && doelenVan(keuze).has(doel)) return { soort: "speel", kaart: keuze.inst, doel: doel.slice(2) };
      if (doelenVan(keuze).has("veld")) return { soort: "speel", kaart: keuze.inst };
    }
    if (keuze.soort === "eenheid") {
      if (doel === "terug") return { soort: "terugroepen", eenheid: keuze.uid };
      if (doel.startsWith("vak:")) { const [, rij, plek] = doel.split(":"); return { soort: "verplaats", eenheid: keuze.uid, vak: { rij, plek: +plek } }; }
      if (doel.startsWith("u:")) { const ander = g.eenheden[doel.slice(2)]; return { soort: "verplaats", eenheid: keuze.uid, vak: { ...ander.vak } }; }
    }
    if (keuze.soort === "middel") {
      if (doel.startsWith("u:")) return { soort: "middeltje", index: keuze.index, doel: doel.slice(2) };
      if (doelenVan(keuze).has("veld")) return { soort: "middeltje", index: keuze.index };
    }
    return null;
  }

  async function voerUit(actie) {
    if (!actie || S.bezig) return;
    S.keuze = null;
    S.bezig = true;
    const voor = opties.g();
    const posities = meetKaarten();
    try {
      const { ev } = await opties.stuur(actie);
      await speelAf(voor, ev);
    } catch (e) {
      melding(e.message || String(e));
    }
    S.bezig = false;
    if (!opties.g()?.uitslag) { render(); animeerVerschil(posities); }
    else opties.klaar?.();
  }

  function tikDoel(doel) {
    if (S.bezig) return;
    if (!S.keuze) return;
    const a = actieVoor(S.keuze, doel);
    if (a) voerUit(a); else { S.keuze = null; render(); }
  }

  root.addEventListener("click", e => {
    if (S.bezig || S.sleep) return;
    if (e.target.closest(".kaart, button, .middel, .stapelvak")) return;
    const v = e.target.closest("[data-doel]");
    if (v && S.keuze) tikDoel(v.dataset.doel);
    else if (S.keuze) { S.keuze = null; render(); }
  });

  async function fluit() {
    if (S.bezig) return;
    const g = opties.g();
    if (!fluitjeOpgeladen(g)) {
      const ok = inst.vraagFluitje === false ? true : await modaal("Politiefluitje", "Je legt je hele hand af en trekt 6 nieuwe kaarten. Dit kost je beurt.", [{ tekst: "Niet nu", waarde: false, soort: "stil" }, { tekst: "Blaas", waarde: true }]);
      if (!ok) return;
    }
    voerUit({ soort: "fluitje" });
  }

  /* ───────── slepen, tikken, lang drukken ───────── */

  function toetsActie(k, naam, tik) {
    k.tabIndex = 0;
    k.setAttribute("role", "button");
    k.setAttribute("aria-label", naam);
    k.addEventListener("keydown", e => {
      if (S.bezig || S.sleep) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); tik(); }
      if (e.key === "?" || e.key.toLowerCase() === "i") toonDetail(k);
    });
  }

  root.addEventListener("keydown", e => {
    if (S.bezig || S.sleep) return;
    if (e.key === "Escape") { S.keuze = null; render(); return; }
    if (S.keuze && (e.key === "Enter" || e.key === " ") && e.target.dataset.doel) {
      e.preventDefault(); tikDoel(e.target.dataset.doel);
    }
  });

  function kies(wat, k) {
    if (wat.soort === "eenheid" && S.keuze && (S.keuze.soort !== "eenheid" || S.keuze.uid !== wat.uid)) {
      tikDoel(`u:${wat.uid}`); return;
    }
    if (JSON.stringify(S.keuze) === JSON.stringify(wat)) {
      const a = actieVoor(wat, "veld");
      if (a) { voerUit(a); return; }
      S.keuze = null;
    } else S.keuze = wat;
    speel("klik");
    const toetsen = document.activeElement === k;
    render();
    if (toetsen) {
      const id = k.dataset.inst || k.dataset.uid;
      const bron = id ? root.querySelector(`[data-${k.dataset.inst ? "inst" : "uid"}="${id}"]`) : root.querySelectorAll(".middel")[wat.index];
      (root.querySelector(".doelwit, .veld-doel") || bron)?.focus();
    }
  }

  function vindSleepdoel(x, y, doelen) {
    let onder = document.elementFromPoint(x, y)?.closest("[data-doel]");
    while (onder && root.contains(onder)) {
      if (doelen.has(onder.dataset.doel)) return onder;
      onder = onder.parentElement?.closest("[data-doel]");
    }
    // De smalle naden tussen twee vakken horen bij het dichtstbijzijnde geldige doel.
    let beste = null, afstand = 12;
    for (const vak of root.querySelectorAll(".doelwit")) {
      const r = vak.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (d < afstand) { beste = vak; afstand = d; }
    }
    return beste;
  }

  function bindSleep(k, wat) {
    toetsActie(k, k._def().naam, () => kies(wat, k));
    k.addEventListener("contextmenu", e => e.preventDefault());
    k.addEventListener("pointerdown", e => {
      if (S.bezig || S.sleep || !e.isPrimary || e.button !== 0) return;
      e.preventDefault();
      verbergHover();
      const rect = k.getBoundingClientRect();
      const doelen = doelenVan(wat);
      const dx = (e.clientX - rect.left) / rect.width * k.offsetWidth;
      const dy = (e.clientY - rect.top) / rect.height * k.offsetHeight;
      const aanraking = e.pointerType !== "mouse";
      let ghost, boven, laatsteX = e.clientX, hoek = 0;
      const opruimen = () => {
        clearTimeout(S.langTimer);
        k.removeEventListener("pointermove", beweeg);
        k.removeEventListener("pointerup", los);
        k.removeEventListener("pointercancel", afbreken);
        k.removeEventListener("lostpointercapture", afbreken);
        if (k.hasPointerCapture(e.pointerId)) k.releasePointerCapture(e.pointerId);
        k.classList.remove("weg");
        boven?.classList.remove("erboven");
        ghost?.remove();
        S.sleep = null;
      };
      const afbreken = ev => {
        if (ev.pointerId !== e.pointerId) return;
        opruimen(); S.keuze = null; render();
      };
      const beweeg = ev => {
        if (ev.pointerId !== e.pointerId) return;
        if (!ghost) {
          if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < (aanraking ? 8 : 5)) return;
          clearTimeout(S.langTimer);
          S.sleep = wat; S.keuze = wat;
          markeerDoelen();
          ghost = el("div", { class: "sleep", "aria-hidden": "true" });
          const kloon = k.cloneNode(true);
          kloon.removeAttribute("tabindex");
          kloon.style.transform = "none";
          kloon.style.width = k.offsetWidth + "px";
          kloon.style.height = k.offsetHeight + "px";
          kloon.style.setProperty("--w", k.offsetWidth + "px");
          ghost.append(kloon); document.body.append(ghost);
          k.classList.add("weg"); speel("klik");
        }
        hoek = reduceMotion() ? 0 : hoek * .6 + Math.max(-9, Math.min(9, (ev.clientX - laatsteX) * .3)) * .4;
        laatsteX = ev.clientX;
        const y = ev.clientY - (aanraking ? 30 : 8);
        ghost.style.transform = `translate3d(${ev.clientX - dx}px,${y - dy}px,0) rotate(${hoek}deg) scale(1.04)`;
        const vak = vindSleepdoel(ev.clientX, ev.clientY, doelen);
        if (boven !== vak) { boven?.classList.remove("erboven"); vak?.classList.add("erboven"); boven = vak; }
      };
      const los = ev => {
        if (ev.pointerId !== e.pointerId) return;
        const doel = ghost && vindSleepdoel(ev.clientX, ev.clientY, doelen);
        opruimen();
        if (!ghost) { kies(wat, k); return; }
        const a = doel && actieVoor(wat, doel.dataset.doel);
        if (a) voerUit(a);
        else { S.keuze = null; render(); }
      };
      k.setPointerCapture(e.pointerId);
      S.langTimer = setTimeout(() => { opruimen(); toonDetail(k); }, 480);
      k.addEventListener("pointermove", beweeg);
      k.addEventListener("pointerup", los);
      k.addEventListener("pointercancel", afbreken);
      k.addEventListener("lostpointercapture", afbreken);
    });
  }

  /** Kaarten die je niet sleept (vijanden): tikken is kiezen, lang drukken toont de hele tekst. */
  function bindLang(k, tik) {
    let timer = null, lang = false, start = null;
    k.addEventListener("pointerdown", e => {
      lang = false; start = { x: e.clientX, y: e.clientY };
      clearTimeout(timer);
      timer = setTimeout(() => { lang = true; toonDetail(k); }, 480);
    });
    k.addEventListener("pointermove", e => { if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) clearTimeout(timer); });
    const stop = () => { clearTimeout(timer); start = null; };
    k.addEventListener("pointerup", () => { stop(); if (!lang && !S.bezig) tik(); });
    k.addEventListener("pointercancel", stop);
    k.addEventListener("contextmenu", e => e.preventDefault());
  }

  let hoverEl = null;
  function verbergHover() { clearTimeout(S.hoverTimer); hoverEl?.remove(); hoverEl = null; }
  function bindDetail(k, def, eenheid) {
    k._def = def; k._eenheid = eenheid;
    k.addEventListener("pointerenter", e => {
      if (e.pointerType !== "mouse" || S.sleep || S.bezig) return;
      clearTimeout(S.hoverTimer);
      S.hoverTimer = setTimeout(() => {
        verbergHover();
        const r = k.getBoundingClientRect();
        hoverEl = el("div", { class: "hover-detail paneel" }, uitlegEl(def(), eenheid?.(), kaartContext(def())));
        document.body.append(hoverEl);
        const w = 300, links = r.right + 12 + w < innerWidth ? r.right + 12 : r.left - w - 12;
        hoverEl.style.left = Math.max(8, links) + "px";
        hoverEl.style.top = Math.max(8, Math.min(innerHeight - hoverEl.offsetHeight - 8, r.top)) + "px";
      }, 380);
    });
    k.addEventListener("pointerleave", verbergHover);
  }

  function toonDetail(k) {
    verbergHover();
    const def = k._def?.(); if (!def) return;
    const u = k._eenheid?.();
    const ctx = kaartContext(def);
    const groot = u ? eenheidEl(u, ctx) : kaartEl(def.id, { def, ...ctx });
    groot.classList.remove("veld");
    if (u) { groot.classList.add("groot"); }
    const sluit = () => { d.remove(); if (k.isConnected) k.focus({ preventScroll: true }); };
    const knop = el("button", { class: "knop klein", onclick: sluit }, "Sluiten");
    const d = el("div", { class: "detail", role: "dialog", "aria-modal": "true", "aria-label": def.naam,
      onclick: e => { if (e.target === d) sluit(); },
      onkeydown: e => { if (e.key === "Escape") sluit(); if (e.key === "Tab") e.preventDefault(); },
    }, el("div", { class: "dk paneel" }, groot, el("div", { class: "duitleg" }, uitlegEl(def, u, ctx), knop)));
    document.body.append(d);
    knop.focus();
  }

  async function toonStapel(titel, lijst) {
    const inhoud = el("div", { class: "stapelgrid" });
    const gesorteerd = [...lijst].sort((a, b) => kaartDef(a.id).naam.localeCompare(kaartDef(b.id).naam));
    for (const i of gesorteerd) inhoud.append(kaartEl(i.id, { inst: i, geestKost: geestKosten(opties.g(), kaartDef(i.id, i.verbeterd)) }));
    if (!lijst.length) inhoud.append(el("p", { class: "muted" }, "Leeg."));
    await modaal(`${titel} (${lijst.length})`, inhoud, [{ tekst: "Sluiten" }]);
  }

  function toonVolgendeGolf(g) {
    const ziet = g.ctx.held === "ambrose-pell" || g.ctx.artefacten.includes("zwarte-spiegel");
    const golf = g.golven[g.golfNr];
    if (!golf) { melding("Dit is de laatste golf."); return; }
    if (!ziet) { melding(`Over ${g.bigben} ${g.bigben === 1 ? "slag" : "slagen"} komt golf ${g.golfNr + 1}. Wie erin zit, zie je pas als ze er zijn.`); return; }
    melding("Volgende golf: " + golf.map(x => B().vijanden[x.id].naam).join(", "));
  }

  /* ───────── hulp bij het oefengevecht ───────── */
  function aanwijzing(g) {
    const oefen = opties.hulp?.(g);
    return el("div", { class: "handregel" },
      el("h2", {}, "Je hand", el("small", {}, String(g.hand.length))),
      el("div", { class: "speeltip", role: "status", html: oefen || "Sleep een kaart naar het veld of tik op een kaart en daarna op het doel." }));
  }

  function meetKaarten() {
    return new Map([...root.querySelectorAll(".kaart[data-uid], .hand .kaart")].map(k =>
      [k.dataset.uid || k.dataset.inst, k.getBoundingClientRect()]));
  }

  function animeerVerschil(oud) {
    if (reduceMotion()) return;
    const trek = root.querySelector(".stapelvak").getBoundingClientRect();
    let getrokken = 0;
    for (const k of root.querySelectorAll(".kaart[data-uid], .hand .kaart")) {
      const van = oud.get(k.dataset.uid || k.dataset.inst);
      if (!van && !k.dataset.inst) continue;
      const naar = k.getBoundingClientRect(), bron = van || trek;
      const dx = bron.left - naar.left, dy = bron.top - naar.top;
      if (Math.abs(dx) + Math.abs(dy) < 3) continue;
      k.animate([{translate: `${dx}px ${dy}px`, scale: van ? 1 : .52, opacity: van ? 1 : .2},
        {translate: "0 0", scale: 1, opacity: 1}], {
        duration: (van ? 250 : 370) * snel(), delay: van ? 0 : getrokken++ * 40 * snel(),
        fill: "backwards", easing: "cubic-bezier(.2,.8,.25,1)" });
    }
  }

  /* ───────── gebeurtenissen afspelen ───────── */

  function vind(uid) { return root.querySelector(`.kaart[data-uid="${uid}"]`); }
  function zweef(k, tekst, soort) {
    if (!k) return;
    const f = el("div", { class: `float ${soort}` }, tekst);
    (k.closest(".vak") || k).append(f);
    setTimeout(() => f.remove(), 1000);
  }
  function animeer(k, klasse) {
    if (!k) return;
    k.classList.remove(klasse); void k.offsetWidth; k.classList.add(klasse);
    setTimeout(() => k.classList.remove(klasse), 600);
  }
  function plaats(u) {
    if (!u?.vak) return;
    if (u.groot) { render(); return; }
    const vak = root.querySelector(`.kant.${u.kant} .vak[data-rij="${u.vak.rij}"][data-plek="${u.vak.plek}"]`);
    if (!vak) return;
    vak.querySelector(".kaart")?.remove();
    const k = eenheidEl(u);
    k.classList.add("binnen");
    vak.append(k);
  }

  async function speelAf(voor, ev) {
    const t = ms => wacht(ms * snel());
    let tikGespeeld = false;
    for (const e of ev) {
      switch (e.t) {
        case "speel": {
          speel("kaart-spelen");
          const hk = root.querySelector(`.hand .kaart[data-inst="${e.inst}"]`);
          if (hk) { hk.style.transition = "transform .25s, opacity .25s"; hk.style.transform += " translateY(-60%) scale(.8)"; hk.style.opacity = "0"; }
          await t(160);
          break;
        }
        case "plaats": case "oproep": plaats(e.e); speel("kaart-spelen"); await t(220); break;
        case "verplaats": break;
        case "toeslaan": {
          const k = vind(e.uid);
          animeer(k, k?.closest(".kant.vijand") ? "slaat-l" : "slaat-r");
          speel("slag");
          await t(260);
          break;
        }
        case "treffer": {
          const k = vind(e.uid);
          werkBij(k, e.e); animeer(k, "schok");
          zweef(k, e.schade ? `−${e.schade}` : "0", "schade");
          if (e.gruwel) setTimeout(() => zweef(k, `−${e.gruwel} Gruwel`, "gruwel"), 250);
          speel("treffer");
          await t(220);
          break;
        }
        case "schade": { const k = vind(e.uid); werkBij(k, e.e); zweef(k, `−${e.aantal}`, "schade"); await t(180); break; }
        case "blok": { const k = vind(e.uid); werkBij(k, e.e); animeer(k, "flits"); zweef(k, "Gezegend", "blok"); speel("blok"); await t(320); break; }
        case "genees": { const k = vind(e.uid); werkBij(k, e.e); zweef(k, `+${e.aantal}`, "genees"); await t(150); break; }
        case "status": case "teller": case "aanval": { const k = vind(e.uid); werkBij(k, e.e); if (e.t === "status" && e.aantal > 0) await t(90); break; }
        case "trofee": { const k = vind(e.uid); werkBij(k, e.e); zweef(k, "Trofee +1", "goud"); await t(260); break; }
        case "tik": { const k = vind(e.uid); const s = k?.querySelector(".stat.teller"); if (s) s.lastChild.textContent = String(e.waarde); if (!tikGespeeld) { speel("tik"); tikGespeeld = true; } await t(35); break; }
        case "stil": { const k = vind(e.uid); zweef(k, "Mist", "info"); await t(120); break; }
        case "reactie": { const k = vind(e.uid); animeer(k, "flits"); zweef(k, "!", "goud"); await t(160); break; }
        case "dood": {
          const k = vind(e.uid);
          if (k) { k.classList.add("valt"); speel("dood"); await t(420); k.closest(".vak")?.querySelector(".volgnr")?.remove(); k.remove(); }
          break;
        }
        case "komtTerug": { const k = vind(e.uid); werkBij(k, e.e); zweef(k, "Staat weer op", "info"); await t(500); break; }
        case "redding": { const k = vind(e.uid); werkBij(k, e.e); banner("De scarabee", "Je held staat weer op."); await t(1200); break; }
        case "terugroepen": { const k = vind(e.uid); if (k) { k.classList.add("valt"); await t(300); k.remove(); } break; }
        case "golf": {
          if (e.eerste) break;
          speel(e.baas ? "baas" : "golf");
          banner(e.baas ? "De baas verschijnt" : `Golf ${e.nr}`, e.baas ? "" : "Big Ben slaat. Er komen er meer.", e.baas ? "rood" : "");
          await t(e.baas ? 1300 : 900);
          break;
        }
        case "bigben": { const b = root.querySelector(".bigben b"); if (b) b.textContent = String(e.waarde); break; }
        case "fase": { const k = vind(e.uid); werkBij(k, e.e); speel("baas"); banner(e.naam, e.tekst, "rood"); await t(1700); break; }
        case "geest": { zetMeterGeest(e.waarde); if (e.verschil < 0) zweef(vind(opties.g().held), `−${-e.verschil} Geest`, "gruwel"); break; }
        case "verlicht": {
          document.body.classList.toggle("verlicht", e.aan);
          root.querySelector(".meter.geest")?.classList.toggle("verlicht", e.aan);
          const sein = el("div", { class: "verlichtsein", role: "status" }, e.aan
            ? "Verlichting · Je occulte kaarten gebruiken hun verlichte tekst."
            : "Je Geest herstelt. Je kaarten gebruiken hun gewone tekst.");
          root.append(sein);
          if (e.aan) {
            root.classList.add("ontlading");
            speel("donder");
          }
          await t(e.aan ? 1300 : 700);
          root.classList.remove("ontlading");
          sein.remove();
          break;
        }
        case "waanzin": zetMeterGeest(e.waarde); speel("waanzin"); banner("Waanzin", `${kaartDef(e.kaart).naam} gaat in je stapel. Je Geest herstelt tot ${e.waarde}.`, "violet"); await t(1700); break;
        case "waanzinTrek": banner(kaartDef(e.kaart).naam, "Je trekt een Waanzin-kaart.", "violet"); await t(900); break;
        case "fluitje": speel("fluitje"); await t(400); break;
        case "vermogen": banner(e.naam, "", ""); await t(600); break;
        case "gewonnen": speel("winst"); banner(e.baas ? "De baas is verslagen" : "Gewonnen", e.baas ? "De rest slaat op de vlucht." : ""); await t(1400); break;
        case "verloren": speel("verlies"); banner("Je held valt", "", "rood"); await t(1600); break;
        case "slagen": await t(120); break;
      }
    }
  }
  function zetMeterGeest(w) {
    const m = root.querySelector(".meter.geest");
    if (!m) return;
    const g = opties.g();
    const tekst = `${w}/${g.maxGeest}`;
    m.childNodes[1].textContent = tekst;
    const fiche = vind(g.held)?.querySelector(".heldgeest");
    if (fiche) {
      fiche.querySelector("b").textContent = tekst;
      fiche.title = `Geest ${w} van ${g.maxGeest}`;
      fiche.setAttribute("aria-label", fiche.title);
    }
    const b = m.querySelector(".balkje b"); if (b) b.style.width = `${(100 * w) / g.maxGeest}%`;
  }

  render();
  return { render };
}
