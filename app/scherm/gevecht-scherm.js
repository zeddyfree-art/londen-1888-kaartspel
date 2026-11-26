// Het gevechtsscherm: tekent de toestand en vertaalt aanrakingen naar acties.
// De motor geeft gebeurtenissen terug; die spelen we hier af als animaties en geluiden.
import { el, bg, ICOON, banner, melding, wacht, reduceMotion, modaal } from "./gemeen.js";
import { kaartEl, eenheidEl, werkBij, uitlegEl, chips } from "./kaart-dom.js";
import { B, kaartDef } from "../motor/bibliotheek.js";
import {
  geldigeDoelen, kanSpelen, geestKosten, eenhedenVan, volgordeNummers, aanvalsDoelen, fluitjeOpgeladen, verlichtDrempel, FLUITJE_OPLADEN, levend,
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
    const g = opties.g();
    document.body.classList.toggle("verlicht", !!g.verlicht);
    root.replaceChildren(
      el("div", { class: "plekbeeld", style: { backgroundImage: bg(opties.plekArt) } }),
      balk(g), slagveld(g), onder(g), el("div", { class: "draai" }, "Draai je scherm voor het beste overzicht"),
    );
    markeerDoelen();
    toonHulp(g);
  }

  function balk(g) {
    const h = g.eenheden[g.held];
    const golvenOver = g.golven.length - g.golfNr;
    const grens = Math.floor(g.maxGeest * verlichtDrempel(g));
    return el("div", { class: "balk" },
      el("button", { class: "icoonknop", "aria-label": "Menu", html: ICOON.menu, onclick: () => opties.menu() }),
      el("div", {}, el("div", { class: "gnaam" }, g.naam), el("div", { class: "golfinfo" }, `Golf ${g.golfNr} van ${g.golven.length} · beurt ${g.beurt}`)),
      el("div", { class: `bigben ${golvenOver && g.bigben <= 1 ? "dreig" : ""}`, title: "Big Ben: de volgende golf", onclick: () => toonVolgendeGolf(g) },
        el("div", { class: "bb", style: { backgroundImage: bg("scherm/big-ben.jpg") } }),
        golvenOver ? [el("b", {}, String(g.bigben)), el("span", {}, g.bigben === 1 ? "slag tot" : "slagen tot", el("br"), "de volgende golf")] : el("span", {}, "laatste", el("br"), "golf")),
      el("div", { class: "ruimte" }),
      el("div", { class: "meter lichaam", title: "Lichaam van je held" }, el("span", { html: ICOON.hart, style: { width: "18px", height: "18px", display: "inline-flex" } }), `${Math.max(0, h?.leven ?? 0)}/${h?.maxLeven ?? 0}`),
      el("div", { class: `meter geest ${g.verlicht ? "verlicht" : ""}`, title: `Geest. Verlicht bij ${grens} of minder.` },
        el("span", { html: ICOON.geest, style: { width: "18px", height: "18px", display: "inline-flex" } }), `${g.geest}/${g.maxGeest}`,
        el("span", { class: "balkje" }, el("b", { style: { width: `${(100 * g.geest) / g.maxGeest}%` } }), el("i", { class: "grens", style: { left: `${(100 * grens) / g.maxGeest}%` } }))),
      el("div", { class: "meter ponden", title: "Ponden" }, el("span", { html: ICOON.pond, style: { width: "18px", height: "18px", display: "inline-flex" } }), String(opties.ponden() + g.buit)),
    );
  }

  function kolom(kant, plek) { return kant === "vijand" ? 3 - plek : plek + 1; }

  function slagveld(g) {
    const nrs = inst.volgorde !== false ? volgordeNummers(g) : {};
    const mik = new Set();
    for (const v of eenhedenVan(g, "vijand")) if (v.teller === 1 && !v.statussen.mist && v.aanval != null) for (const d of aanvalsDoelen(g, v)) mik.add(d.uid);
    const veld = el("div", { class: "slagveld", data: { doel: "veld" } });
    for (const kant of ["vijand", "speler"]) {
      const k = el("div", { class: `kant ${kant}` });
      for (const rij of RIJEN) for (let p = 0; p < 3; p++) {
        const vak = el("div", { class: `vak ${rij}`, style: { gridRow: rij === "straat" ? 1 : 2, gridColumn: kolom(kant, p) }, data: { kant, rij, plek: p, ...(kant === "speler" ? { doel: `vak:${rij}:${p}` } : {}) } });
        const uid = g.veld[kant][rij][p];
        const u = uid && g.eenheden[uid];
        if (u && !u.groot) { vak.append(eenheidMetHandlers(u, nrs[u.uid], mik.has(u.uid))); if (nrs[u.uid]) vak.append(el("div", { class: "volgnr", title: "Volgorde van toeslaan" }, String(nrs[u.uid]))); }
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
      if (kant === "vijand") veld.append(el("div", { class: "middenlijn" }));
    }
    return veld;
  }

  function eenheidMetHandlers(u, nr, mik) {
    const k = eenheidEl(u, { volgnr: nr, mikpunt: mik });
    k.dataset.doel = `u:${u.uid}`;
    bindDetail(k, () => (u.soort === "held" ? { ...B().helden[u.id], soort: "held" } : kaartDef(u.id, u.verbeterd)), () => opties.g().eenheden[u.uid]);
    if (u.kant === "speler" && !u.groot) bindSleep(k, { soort: "eenheid", uid: u.uid });
    else k.addEventListener("click", () => tikDoel(`u:${u.uid}`));
    return k;
  }

  function onder(g) {
    const hand = el("div", { class: "hand" });
    const n = g.hand.length;
    g.hand.forEach((i, idx) => {
      const d = kaartDef(i.id, i.verbeterd);
      const k = kaartEl(i.id, { inst: i, geestKost: geestKosten(g, d) });
      k.dataset.inst = i.uid;
      const hoek = (idx - (n - 1) / 2) * Math.min(5, 26 / Math.max(1, n));
      const zak = Math.abs(idx - (n - 1) / 2) ** 2 * 1.2;
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
      el("div", { class: "stapelvak", style: { backgroundImage: bg("achterkanten/stad.jpg") }, title: "Trekstapel", onclick: () => toonStapel("Trekstapel", g.trek) }, el("small", {}, "trekstapel"), el("b", {}, String(g.trek.length))),
      hand,
      el("div", { class: "stapelvak", style: { backgroundImage: bg("achterkanten/toestanden.jpg") }, title: "Aflegstapel", onclick: () => toonStapel("Aflegstapel", g.afleg) }, el("small", {}, "aflegstapel"), el("b", {}, String(g.afleg.length))),
      el("div", { class: "acties" },
        el("button", { class: `fluitje ${opgeladen ? "opgeladen" : ""}`, onclick: () => fluit(), title: "Leg je hand af en trek 6 nieuwe kaarten" },
          el("div", { class: "fi", style: { backgroundImage: bg("persoonlijk/politiefluitje.jpg") } }),
          el("div", {}, el("b", {}, "Politiefluitje"), el("span", {}, opgeladen ? "Opgeladen: kost geen beurt" : `Kost je beurt · ${Math.min(g.fluitjeRust, nodig)}/${nodig}`))),
        el("div", { class: "terugroep", data: { doel: "terug" } }, "Sleep een bondgenoot hierheen om hem terug te roepen"),
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
      const d = e.dataset.doel;
      const ja = doelen.has(d) && !(d === "veld");
      e.classList.toggle("doelwit", ja);
    });
    const veld = root.querySelector(".slagveld");
    veld?.classList.toggle("veld-doel", doelen.has("veld"));
  }

  function actieVoor(keuze, doel) {
    const g = opties.g();
    if (!keuze || !doel) return null;
    if (!doelenVan(keuze).has(doel) && !(doel !== "terug" && doelenVan(keuze).has("veld"))) return null;
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
    try {
      const voor = opties.g();
      const { ev } = await opties.stuur(actie);
      await speelAf(voor, ev);
    } catch (e) {
      melding(e.message || String(e));
    }
    S.bezig = false;
    if (!opties.g()?.uitslag) render();
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

  function bindSleep(k, wat) {
    k.addEventListener("pointerdown", e => {
      if (S.bezig || e.button > 0) return;
      e.preventDefault();
      verbergHover();
      const start = { x: e.clientX, y: e.clientY, t: performance.now() };
      let sleept = false, ghost = null, vx = 0, rot = 0, lx = e.clientX, lt = performance.now(), boven = null;
      const rect = k.getBoundingClientRect();
      const dx = e.clientX - rect.left, dy = e.clientY - rect.top;
      try { k.setPointerCapture(e.pointerId); } catch {}
      clearTimeout(S.langTimer);
      S.langTimer = setTimeout(() => { if (!sleept) { opruimen(); toonDetail(k); } }, 480);

      const beweeg = ev => {
        const afstand = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
        if (!sleept && afstand > 9) {
          clearTimeout(S.langTimer);
          sleept = true;
          S.sleep = wat;
          S.keuze = wat;
          markeerDoelen();
          ghost = el("div", { class: "sleep" });
          const kloon = k.cloneNode(true);
          kloon.style.transform = "";
          kloon.style.width = rect.width + "px";
          kloon.style.setProperty("--w", rect.width + "px");
          ghost.append(kloon);
          document.body.append(ghost);
          k.classList.add("weg");
          speel("klik");
        }
        if (!sleept) return;
        const nu = performance.now(), dt = Math.max(1, nu - lt);
        vx = vx * 0.75 + ((ev.clientX - lx) / dt) * 0.25 * 16;
        lx = ev.clientX; lt = nu;
        const doelRot = reduceMotion() ? 0 : Math.max(-20, Math.min(20, vx * 1.6));
        rot += (doelRot - rot) * 0.35;
        const wiebel = reduceMotion() ? 0 : Math.sin(nu / 90) * 1.2;
        ghost.style.transform = `translate(${ev.clientX - dx}px, ${ev.clientY - dy - 10}px) rotate(${rot + wiebel}deg) scale(1.06)`;
        const onder = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-doel]");
        if (boven && boven !== onder) boven.classList.remove("erboven");
        boven = onder;
        if (onder?.classList.contains("doelwit")) onder.classList.add("erboven");
      };
      const los = ev => {
        k.removeEventListener("pointermove", beweeg);
        k.removeEventListener("pointerup", los);
        k.removeEventListener("pointercancel", los);
        clearTimeout(S.langTimer);
        if (!sleept) {
          if (ev.type === "pointercancel") return;
          if (performance.now() - start.t > 470) return; // lang drukken
          // tikken
          if (wat.soort === "eenheid" && S.keuze && S.keuze.soort !== "eenheid") { tikDoel(`u:${wat.uid}`); return; }
          if (wat.soort === "eenheid" && S.keuze?.soort === "eenheid" && S.keuze.uid !== wat.uid) { tikDoel(`u:${wat.uid}`); return; }
          if (S.keuze && JSON.stringify(S.keuze) === JSON.stringify(wat)) {
            // nog eens tikken op een kaart zonder doel speelt hem
            const a = actieVoor(wat, "veld");
            if (a) { voerUit(a); return; }
            S.keuze = null;
          } else S.keuze = wat;
          speel("klik");
          render();
          return;
        }
        const onder = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-doel]");
        const a = onder ? actieVoor(wat, onder.dataset.doel) : null;
        opruimen();
        if (a) voerUit(a); else { S.keuze = null; render(); }
      };
      const opruimen = () => { ghost?.remove(); ghost = null; S.sleep = null; k.classList.remove("weg"); boven?.classList.remove("erboven"); };
      k.addEventListener("pointermove", beweeg);
      k.addEventListener("pointerup", los);
      k.addEventListener("pointercancel", los);
    });
  }

  let hoverEl = null;
  function verbergHover() { clearTimeout(S.hoverTimer); hoverEl?.remove(); hoverEl = null; }
  function bindDetail(k, def, eenheid) {
    k._def = def; k._eenheid = eenheid;
    k.addEventListener("pointerenter", e => {
      if (e.pointerType !== "mouse" || S.sleep) return;
      clearTimeout(S.hoverTimer);
      S.hoverTimer = setTimeout(() => {
        verbergHover();
        const r = k.getBoundingClientRect();
        hoverEl = el("div", { class: "hover-detail paneel" }, uitlegEl(def(), eenheid?.()));
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
    const groot = u ? eenheidEl(u) : kaartEl(def.id, { def });
    groot.classList.remove("veld");
    if (u) { groot.classList.add("groot"); }
    const d = el("div", { class: "detail", onclick: () => d.remove() }, el("div", { class: "dk paneel" }, groot, el("div", { class: "duitleg" }, uitlegEl(def, u))));
    document.body.append(d);
  }

  async function toonStapel(titel, lijst) {
    const inhoud = el("div", { class: "stapelgrid" });
    const gesorteerd = [...lijst].sort((a, b) => kaartDef(a.id).naam.localeCompare(kaartDef(b.id).naam));
    for (const i of gesorteerd) inhoud.append(kaartEl(i.id, { inst: i }));
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
  let hulpEl = null;
  function toonHulp(g) {
    hulpEl?.remove(); hulpEl = null;
    const t = opties.hulp?.(g);
    if (!t) return;
    hulpEl = el("div", { class: "hulp paneel", html: t, style: { right: "16px", top: "70px" } });
    root.append(hulpEl);
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
          animeer(k, k?.closest(".kant.vijand") ? "slaat-r" : "slaat-l");
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
        case "verlicht":
          document.body.classList.toggle("verlicht", e.aan);
          if (e.aan) { speel("verlicht"); banner("Je raakt verlicht", "Occulte kaarten gebruiken nu hun verlichte tekst.", "violet"); await t(1300); }
          else { banner("De sluier sluit zich", "", "violet"); await t(700); }
          break;
        case "waanzin": speel("waanzin"); banner("Waanzin", `${kaartDef(e.kaart).naam} gaat in je stapel. Je Geest herstelt tot ${e.waarde}.`, "violet"); await t(1700); break;
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
    m.childNodes[1].textContent = `${w}/${g.maxGeest}`;
    const b = m.querySelector(".balkje b"); if (b) b.style.width = `${(100 * w) / g.maxGeest}%`;
  }

  render();
  return { render };
}
