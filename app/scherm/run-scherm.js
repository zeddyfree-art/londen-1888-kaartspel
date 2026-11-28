// De kaart van Londen met de paden, de knooppunten, beloningen, de stapel en het einde van een run.
import { el, bg, art, ICOON, melding, modaal, banner, reduceMotion, wacht } from "./gemeen.js";
import { kaartEl, artefactEl, uitlegEl } from "./kaart-dom.js";
import { B, kaartDef, talismanPast } from "../motor/bibliotheek.js";
import { KNOOPSOORTEN, huidigGedeelte, maxBondgenoten, aantalBondgenoten } from "../motor/run.js";
import { speel } from "./geluid.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attr = {}, ...k) => { const e = document.createElementNS(NS, tag); for (const [a, v] of Object.entries(attr)) if (v != null) e.setAttribute(a, v); for (const c of k.flat()) if (c) e.append(c instanceof Node ? c : document.createTextNode(c)); return e; };

// kleine tekeningen voor de knooppunten (24 × 24, rond het midden)
const GLYPH = {
  gevecht: "M-7 7 L7 -7 M3 -7 h4 v4 M7 7 L-7 -7 M-3 -7 h-4 v4",
  baas: "M-8 4 L-8 -5 L-4 -1 L0 -7 L4 -1 L8 -5 L8 4 Z M-8 7 h16",
  scheur: "M-9 0 C-4 -7 4 -7 9 0 C4 7 -4 7 -9 0 Z M0 -3 L1 0 L0 3 L-1 0 Z",
  markt: "M0 -8 v15 M-8 -4 h16 M-8 -4 l-3 7 h6 z M8 -4 l-3 7 h6 z M-4 8 h8",
  logement: "M-8 -1 L0 -8 L8 -1 M-6 -2 v9 h12 v-9 M-2 7 v-5 h4 v5",
  ziekenhuis: "M-2.5 -8 h5 v5.5 h5.5 v5 h-5.5 v5.5 h-5 v-5.5 h-5.5 v-5 h5.5 z",
  gaarkeuken: "M-9 -1 h18 c0 6 -4 9 -9 9 c-5 0 -9 -3 -9 -9 z M-3 -4 c0 -2 2 -2 2 -4 M3 -4 c0 -2 2 -2 2 -4",
  kerk: "M0 -9 v5 M-2 -7 h4 M-5 8 v-9 l5 -4 l5 4 v9 z M-1.5 8 v-4 h3 v4",
  universiteit: "M-9 -3 L0 -8 L9 -3 L0 2 Z M-5 -1 v5 c3 3 7 3 10 0 v-5 M9 -3 v6",
  seance: "M-2 8 v-9 h4 v9 z M0 -2 c-2 -2 -1 -5 0 -7 c1 2 2 5 0 7 M-7 8 h14",
  ontmoeting: "M-3 -3 c0 -6 8 -6 8 -1 c0 3 -4 3 -4 6 M1 6 v1",
  club: "M-6 -8 h12 l-6 8 z M0 0 v7 M-4 8 h8",
  kist: "M-8 -2 h16 v9 h-16 z M-8 -2 c0 -6 16 -6 16 0 M-1 1 h2 v3 h-2 z",
  boekwinkel: "M-9 -6 c4 -2 7 -2 9 0 c2 -2 5 -2 9 0 v13 c-4 -2 -7 -2 -9 0 c-2 -2 -5 -2 -9 0 z M0 -6 v13 M3 -9 l2 -2 l2 2",
};

const KNOOPART = {
  markt: "plekken/covent-garden.jpg", ziekenhuis: "plekken/city.jpg", gaarkeuken: "plekken/spitalfields.jpg", kerk: "plekken/westminster.jpg",
  universiteit: "plekken/bloomsbury.jpg", logement: "plekken/whitechapel.jpg", seance: "plekken/marylebone.jpg", club: "plekken/pall-mall.jpg",
  kist: "plekken/st-katharine-docks.jpg", ontmoeting: "plekken/limehouse.jpg", boekwinkel: "plekken/occulte-boekwinkel.jpg",
};
const AKTE = ["De kades en de East End", "De West End en de salons", "Onder Londen, door de Scheur"];
const AKTE3 = { start: [110, 330], riolen: [300, 470], ondergrondse: [460, 230], pestputten: [660, 470], hart: [860, 330] };

export function plekPunt(id, akte) {
  if (akte === 2) return AKTE3[id] || [500, 350];
  const p = B().data.bord?.plekken?.find(x => x.id === id);
  return p ? [p.x, p.y] : [500, 350];
}
export function plekArt(id) {
  if (id !== "start" && Object.hasOwn(AKTE3, id)) return `akte3/${id}.jpg`;
  return `plekken/${id}.jpg`;
}

function vijandenVan(def) {
  return def.golven.flat().map(x => (typeof x === "string" ? x : x.id));
}

/* ───────── de kaart ───────── */

export function kaartScherm(app, opties, overzicht = false) {
  const { run, actie, menu, stapel } = opties;
  const a = run.pos.akte;
  const akte = run.kaart[a];
  const start = a === 0 ? "bloomsbury" : a === 1 ? run.kaart[0].gedeelten[2].gevecht.plek : "start";
  const bordArt = a === 2 ? plekArt(overzicht ? "hart" : huidigGedeelte(run).gevecht.plek) : "bord/londen.jpg";
  const punten = [plekPunt(start, a), ...akte.gedeelten.map(gd => plekPunt(gd.gevecht.plek, a))];
  // inzoomen op de wijken van deze akte
  const xs = punten.map(p => p[0]), ys = punten.map(p => p[1]);
  let bx = Math.min(...xs) - 130, by = Math.min(...ys) - 110, bw = Math.max(...xs) - Math.min(...xs) + 260, bh = Math.max(...ys) - Math.min(...ys) + 220;
  if (bw / bh < 1.25) { const n = bh * 1.25; bx -= (n - bw) / 2; bw = n; } else { const n = bw / 1.25; by -= (n - bh) / 2; bh = n; }
  const s = svg("svg", { class: `paden ${overzicht ? "overzicht" : "wijkroute"}`, role: "group", "aria-label": overzicht ? "Alle routes van deze akte" : "De routes door deze wijk", viewBox: overzicht ? `${bx} ${by} ${bw} ${bh}` : "0 0 800 420", preserveAspectRatio: "xMidYMid meet" });
  const schaal = overzicht ? Math.max(0.6, Math.min(1, bw / 1000)) : 1;
  if (overzicht) s.append(svg("image", { href: art(bordArt), x: 0, y: 0, width: 1000, height: 700, preserveAspectRatio: "xMidYMid slice", class: "bordbeeld", style: a === 2 ? "filter:brightness(.5)" : "filter:brightness(.62) saturate(.8) sepia(.2)" }));
  const vertrek = [80, 210], bestemming = [720, 210];
  let hier = overzicht ? punten[run.pos.gedeelte] : vertrek;
  let volgendPunt;
  let onderweg = false;
  const locatie = id => B().data.bord.plekken.find(p => p.id === id)?.naam || ({
    start: "De afdaling", riolen: "De riolen", ondergrondse: "Ondergrondse", pestputten: "Pestputten", hart: "Hart van de Scheur",
  })[id] || id;
  function bedien(g, label, klik) {
    g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.setAttribute("aria-label", label);
    g.addEventListener("click", klik);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); klik(); }
    });
  }
  async function reis(handeling) {
    if (onderweg) return;
    onderweg = true;
    scherm.inert = true;
    try {
      if (handeling.soort === "kiesPad") {
        speel("klik");
        s.querySelector(`.padkeuze[data-pad="${handeling.pad}"]`)?.classList.add("lichtspoor");
      } else if (volgendPunt) {
        const [x, y] = volgendPunt;
        if (!reduceMotion() && stip.animate) {
          stip.animate([{ transform: `translate(${hier[0]}px,${hier[1]}px)` },
            { transform: `translate(${x}px,${y}px)` }], { duration: 360, easing: "ease-in-out", fill: "forwards" });
        }
      }
      if (!reduceMotion()) await wacht(handeling.soort === "kiesPad" ? 220 : 360);
      if (scherm.isConnected) await actie(handeling);
    } finally { onderweg = false; scherm.inert = false; }
  }
  function medaillon(soort, x, y, r, toestand, label, onderschrift) {
    const g = svg("g", { class: `knoop ${soort} ${toestand}`, transform: `translate(${x},${y}) scale(${schaal})` },
      svg("title", {}, label), svg("circle", { class: "krans", r: r + 5 }),
      svg("circle", { class: "bol", r }), svg("path", { class: "glyph", d: GLYPH[soort], transform: `scale(${r / 14})` }));
    if (onderschrift) g.append(svg("text", { y: r + 26, "text-anchor": "middle" }, onderschrift));
    if (toestand.includes("bezocht")) g.append(svg("path", { class: "afgevinkt", d: `M${r-8} ${r-2}l4 4 8-9` }));
    return g;
  }
  let volgendeKnoop = null;
  akte.gedeelten.forEach((gd, gi) => {
    if (!overzicht && gi !== run.pos.gedeelte) return;
    const [x1, y1] = overzicht ? punten[gi] : vertrek, [x2, y2] = overzicht ? punten[gi + 1] : bestemming;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, d = overzicht ? Math.max(60, len * 0.3) : 226;
    const voorbij = gi < run.pos.gedeelte, huidig = gi === run.pos.gedeelte;
    gd.paden.forEach((pad, pi) => {
      if (!pad) return;
      const cx = (x1 + x2) / 2 + nx * d * (pi ? 1 : -1), cy = (y1 + y2) / 2 + ny * d * (pi ? 1 : -1);
      const gekozen = (huidig && run.pos.pad === pi) || (voorbij && gd.gekozenPad === pi);
      const groep = svg("g", { class: `routegroep ${huidig && run.pos.pad == null ? "padkeuze" : ""} ${(huidig && run.pos.pad != null || voorbij && gd.gekozenPad != null) && !gekozen ? "verlaten" : ""}`, "data-pad": pi });
      const lijn = svg("path", { d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, class: `pad ${gekozen ? "gekozen" : ""} ${voorbij ? "voorbij" : ""} ${huidig && run.pos.pad != null && !gekozen ? "dicht" : ""}` });
      groep.append(svg("path", { d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, stroke: "transparent", "stroke-width": 40, fill: "none" }), lijn);
      if (!overzicht) groep.append(svg("text", { class: "padnummer", x: 400, y: pi ? 385 : 42 }, `PAD ${pi + 1}`));
      pad.forEach((k, si) => {
        const t = (si + 1) / (pad.length + 1);
        const px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, py = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2;
        const bezocht = gekozen && (voorbij || si < run.pos.stap);
        if (huidig && gekozen && si + 1 === run.pos.stap) hier = [px, py];
        const isVolgende = huidig && gekozen && si === run.pos.stap && run.fase === "kaart";
        if (isVolgende) volgendeKnoop = { soort: k.soort, knoop: k };
        const soort = KNOOPSOORTEN[k.soort];
        const g = medaillon(k.soort, px, py, overzicht ? 16 : 24,
          bezocht ? "bezocht" : isVolgende ? "volgende" : "", soort.naam + " · " + soort.tekst, overzicht ? "" : soort.naam);
        if (isVolgende) { volgendPunt = [px, py]; bedien(g, "Bezoek " + soort.naam, () => reis({ soort: "verder" })); }
        groep.append(g);
      });
      if (huidig && run.pos.pad == null) bedien(groep, `Kies pad ${pi + 1}: ${pad.map(k => KNOOPSOORTEN[k.soort].naam).join(", ")}`, () => reis({ soort: "kiesPad", pad: pi }));
      s.append(groep);
    });
  });
  // gevechten op de plekken
  akte.gedeelten.forEach((gd, gi) => {
    if (!overzicht && gi !== run.pos.gedeelte) return;
    const [x, y] = overzicht ? punten[gi + 1] : bestemming;
    const baas = gi === 2;
    const isVolgende = gi === run.pos.gedeelte && run.pos.pad != null && run.pos.stap >= akte.gedeelten[gi].paden[run.pos.pad].length && run.fase === "kaart";
    if (isVolgende) volgendeKnoop = { soort: baas ? "baas" : "gevecht", gevecht: gd.gevecht };
    const g = medaillon(baas ? "baas" : "gevecht", x, y, baas ? 28 : 25, gi < run.pos.gedeelte ? "bezocht" : isVolgende ? "volgende" : "",
      gd.gevecht.naam, overzicht ? locatie(gd.gevecht.plek) : baas ? "Baas" : "Gevecht");
    if (isVolgende) { volgendPunt = [x, y]; bedien(g, gd.gevecht.naam, () => reis({ soort: "verder" })); }
    s.append(g);
  });
  if (!overzicht) s.append(medaillon("logement", ...vertrek, 22, "", "Vertrekpunt", "Vertrek"));
  const stip = svg("g", { class: "reispion", transform: `translate(${hier[0]},${hier[1]})`, "aria-label": "Je bevindt je hier" },
    svg("title", {}, "Je bevindt je hier"), svg("path", { d: "M0 -24 -8 -36 0 -48 8 -36Z" }), svg("circle", { cy: -36, r: 2.6 }));
  s.append(stip);
  const held = B().helden[run.held];
  const gd = huidigGedeelte(run);
  const info = el("div", { class: "volgendinfo" });
  let knop;
  if (run.pos.pad == null) {
    info.append(el("h3", {}, "Kies een pad"), el("p", { class: "muted" }, "Kies je route via de symbolen op de kaart of de lijst hieronder."));
    gd.paden.forEach((pad, pi) => {
      if (!pad) return;
      info.append(el("button", { class: "keuze padknop", style: { width: "100%" }, onclick: () => reis({ soort: "kiesPad", pad: pi }), onpointerenter: () => s.querySelector(`.padkeuze[data-pad="${pi}"]`)?.classList.add("aangewezen"), onpointerleave: () => s.querySelector(`.padkeuze[data-pad="${pi}"]`)?.classList.remove("aangewezen") },
        el("b", { style: { fontSize: "17px" } }, `Pad ${pi + 1}`), el("span", {}, pad.map(k => KNOOPSOORTEN[k.soort].naam).join(" · "))));
    });
    info.append(el("p", { style: { margin: "6px 0 0" } }, "Daarna: ", el("b", {}, gd.gevecht.naam)));
    info.append(vijandRij(gd.gevecht));
  } else if (volgendeKnoop?.gevecht || volgendeKnoop?.soort === "gevecht" || volgendeKnoop?.soort === "baas") {
    const def = volgendeKnoop.gevecht;
    info.append(el("h3", {}, def.naam), el("p", { class: "muted" }, volgendeKnoop.soort === "baas" ? "Het laatste gevecht van deze akte." : `${def.golven.length} golven.`), vijandRij(def));
    knop = el("button", { class: "knop", onclick: () => reis({ soort: "verder" }) }, volgendeKnoop.soort === "baas" ? "Naar de baas" : "Naar het gevecht");
  } else if (volgendeKnoop) {
    const ks = KNOOPSOORTEN[volgendeKnoop.soort];
    info.append(el("h3", {}, ks.naam), el("p", { class: "muted" }, ks.tekst));
    if (volgendeKnoop.knoop?.gevecht) info.append(el("p", {}, el("b", {}, volgendeKnoop.knoop.gevecht.naam)), vijandRij(volgendeKnoop.knoop.gevecht));
    knop = el("button", { class: "knop", onclick: () => reis({ soort: "verder" }) }, `Verder: ${ks.naam}`);
  }
  const zij = el("div", { class: "zijpaneel" },
    el("div", { class: "heldkop" }, el("div", { class: "portret", style: { backgroundImage: bg(held.art) } }),
      el("div", {}, el("h3", {}, held.naam), el("div", { class: "muted", style: { fontSize: "14px" } }, `${held.vermogen.naam}: ${held.vermogen.tekst}`))),
    el("div", { class: "meters" },
      el("div", { class: "meter lichaam" }, el("span", { html: ICOON.hart, style: { width: "18px", display: "inline-flex" } }), `Lichaam ${run.lichaam}/${run.maxLichaam}`),
      el("div", { class: "meter geest" }, el("span", { html: ICOON.geest, style: { width: "18px", display: "inline-flex" } }), `Geest ${run.geest}/${run.maxGeest}`),
      el("div", { class: "meter ponden" }, el("span", { html: ICOON.pond, style: { width: "18px", display: "inline-flex" } }), `${run.ponden} Ponden`)),
    run.artefacten.length ? el("div", { class: "artefacten" }, run.artefacten.map(id => { const e = artefactEl(id); e.onclick = () => toonArtefact(id); return e; })) : null,
    run.middeltjes.length ? el("div", { class: "muted", style: { fontSize: "14px" } }, "Middeltjes: " + run.middeltjes.map(id => kaartDef(id).naam).join(", ")) : null,
    (run.talismannen || []).length ? losseTalismannen(run, actie) : null,
    info,
    knop,
    held.vermogen?.wisselPad && run.pos.pad != null && !(run.padGewisseld || [])[run.pos.akte] && gd.paden[1 - run.pos.pad] && run.pos.stap < gd.paden[1 - run.pos.pad].length
      ? el("button", { class: "knop stil klein", title: `${held.vermogen.naam}: ${held.vermogen.tekst}`, onclick: () => reis({ soort: "wisselPad" }) }, `Bevoegdheid: naar pad ${2 - run.pos.pad}`) : null,
    el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
      el("button", { class: "knop stil klein", onclick: () => stapel() }, `Stapel (${run.stapel.length})`),
      run.reserve.length ? el("button", { class: "knop stil klein", onclick: () => reserveScherm(run, actie) }, `Reserve (${run.reserve.length})`) : null,
      el("button", { class: "knop stil klein", onclick: () => menu() }, "Menu")),
  );
  const kop = el("header", { class: "atlaskop" },
    el("div", {}, el("small", {}, `Akte ${["I", "II", "III"][a]} · Londen 1888`), el("h2", {}, AKTE[a])),
    el("button", { class: "knop stil klein", onclick: () => kaartScherm(app, opties, !overzicht) }, overzicht ? "Huidige route" : "Hele akte"));
  const reisboek = el("div", { class: "reisboek" }, akte.gedeelten.map((deel, i) =>
    el("div", { class: `halte ${i === run.pos.gedeelte ? "nu" : i < run.pos.gedeelte ? "klaar" : ""}`,
      "aria-current": i === run.pos.gedeelte ? "step" : null },
      el("small", {}, i < run.pos.gedeelte ? "Voltooid" : i === run.pos.gedeelte ? "Onderweg naar" : i === 2 ? "Eindbestemming" : "Daarna"),
      el("b", {}, locatie(deel.gevecht.plek)))));
  const scherm = el("div", { class: "scherm kaartscherm" },
    el("section", { class: "atlas" }, kop, el("div", { class: "bordvlak", style: { backgroundImage: bg(bordArt) } }, s), reisboek), zij);
  app.replaceChildren(scherm);
}

function vijandRij(def) {
  const ids = [...new Set(vijandenVan(def))];
  return el("div", { class: "vijandrij" }, ids.map(id => { const v = B().vijanden[id]; return el("div", { class: `mini ${v.baas ? "baas" : ""}`, title: v.naam, style: { backgroundImage: bg(v.art) } }); }));
}

function toonArtefact(id) {
  const a = B().artefacten[id];
  modaal(a.naam, el("div", { style: { display: "flex", gap: "16px", alignItems: "center" } }, el("div", { class: "artefact-ik", style: { width: "96px", height: "96px", backgroundImage: bg(a.art), flex: "none" } }), el("div", {}, el("p", {}, a.tekst), a.sfeer ? el("p", { class: "muted" }, el("i", {}, a.sfeer)) : null)), [{ tekst: "Sluiten" }]);
}

/** Losse talismannen: tik er een aan en kies een kaart om hem aan te hangen. */
export function losseTalismannen(run, actie) {
  const bib = B();
  return el("div", { class: "losse-talismannen" },
    el("b", {}, "Talismannen om op te hangen"),
    el("div", { class: "talismanrij" }, (run.talismannen || []).map((id, index) => {
      const t = bib.talismannen[id];
      return el("button", { class: "talisman-ik", title: `${t.naam}: ${t.tekst}`, style: { backgroundImage: bg(t.art) }, onclick: async () => {
        const uid = await kiesUitStapel(run, `${t.naam}: aan welke kaart?`, i => talismanPast(id, i), `${t.tekst} Eén talisman per kaart; hij blijft de rest van de run hangen.`);
        if (uid) actie({ soort: "hangTalisman", index, inst: uid });
      } });
    })));
}

function talismanWaar(w, i, run, actie) {
  const t = B().talismannen[w.id];
  const kan = !w.verkocht && run.ponden >= w.prijs;
  return el("div", { class: `waar talismanwaar ${w.verkocht ? "verkocht" : ""}` },
    el("button", { class: "keuze", disabled: w.verkocht, onclick: () => kan ? actie({ soort: "koopTalisman", index: i }) : melding("Daar heb je niet genoeg Ponden voor.") },
      el("div", { style: { display: "flex", gap: "12px", alignItems: "center" } }, el("div", { class: "talisman-ik groot", style: { backgroundImage: bg(t.art) } }), el("b", {}, t.naam)),
      el("span", {}, t.tekst), t.sfeer ? el("span", { style: { fontStyle: "italic" } }, t.sfeer) : null),
    el("span", { class: `prijs ${kan || w.verkocht ? "" : "te-duur"}` }, w.verkocht ? "verkocht" : `£ ${w.prijs}`));
}

async function reserveScherm(run, actie) {
  const inhoud = el("div", { style: { display: "grid", gap: "12px" } }, el("p", { class: "muted" }, `Je hebt maximaal ${maxBondgenoten(run)} bondgenoten in je stapel. Tik op een bondgenoot in de reserve om hem te wisselen.`));
  const rij = el("div", { class: "kaartrij" });
  for (const i of run.reserve) {
    const k = kaartEl(i.id, { inst: i });
    k.style.setProperty("--w", "140px");
    k.onclick = async () => {
      document.querySelector(".modaal")?.remove();
      if (aantalBondgenoten(run) < maxBondgenoten(run)) { actie({ soort: "wissel", in: i.uid }); return; }
      const keuze = await kiesUitStapel(run, "Wie gaat naar de reserve?", x => kaartDef(x.id).soort === "bondgenoot");
      if (keuze) actie({ soort: "wissel", uit: keuze, in: i.uid });
    };
    rij.append(k);
  }
  inhoud.append(rij);
  modaal("Reserve", inhoud, [{ tekst: "Sluiten" }]);
}

/** Laat de speler een kaart uit de stapel kiezen. Geeft de uid terug, of null. */
export function kiesUitStapel(run, titel, mag = () => true, uitleg) {
  return new Promise(klaar => {
    const grid = el("div", { class: "stapelgrid" });
    for (const i of sorteer(run.stapel)) {
      const k = kaartEl(i.id, { inst: i });
      if (!mag(i)) k.classList.add("niet");
      else k.onclick = () => { m.remove(); klaar(i.uid); };
      grid.append(k);
    }
    const m = el("div", { class: "modaal" }, el("div", { class: "paneel", style: { width: "min(1000px, 96vw)" } },
      el("h2", {}, titel), uitleg ? el("p", { class: "muted" }, uitleg) : null, grid,
      el("div", { class: "knoppen" }, el("button", { class: "knop stil", onclick: () => { m.remove(); klaar(null); } }, "Annuleren"))));
    document.body.append(m);
  });
}

const SORT = { bondgenoot: 0, barricade: 1, spul: 2, spreuk: 3, middeltje: 4, waanzin: 5 };
function sorteer(lijst) {
  return [...lijst].sort((a, b) => (SORT[kaartDef(a.id).soort] - SORT[kaartDef(b.id).soort]) || kaartDef(a.id).naam.localeCompare(kaartDef(b.id).naam));
}

export function stapelScherm(app, run, terug) {
  const grid = el("div", { class: "stapelgrid" });
  for (const i of sorteer(run.stapel)) {
    const k = kaartEl(i.id, { inst: i });
    k.onclick = () => toonKaart(i);
    grid.append(k);
  }
  const reserve = run.reserve.length ? [el("h3", { style: { margin: "26px 0 10px", color: "var(--goud-licht)" } }, "Reserve"), el("div", { class: "stapelgrid" }, run.reserve.map(i => kaartEl(i.id, { inst: i })))] : [];
  app.replaceChildren(el("div", { class: "scherm" },
    el("div", { class: "kop" }, el("button", { class: "icoonknop", html: ICOON.terug, "aria-label": "Terug", onclick: terug }), el("h2", {}, `Je stapel (${run.stapel.length})`), el("div", { class: "ruimte" }),
      el("span", { class: "muted" }, "Tik op een kaart voor de verbeterde en verlichte tekst.")),
    el("div", { class: "midden" }, grid, reserve)));
}

function toonKaart(i) {
  const d = kaartDef(i.id, i.verbeterd);
  const inhoud = el("div", { style: { display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center" } });
  const a = kaartEl(i.id, { inst: i }); a.style.setProperty("--w", "200px"); inhoud.append(a);
  if (!i.verbeterd && kaartDef(i.id).verbeterd) { const b = kaartEl(i.id, { inst: { ...i, verbeterd: true } }); b.style.setProperty("--w", "200px"); inhoud.append(el("div", { style: { display: "grid", gap: "6px", justifyItems: "center" } }, el("span", { class: "muted" }, "Verbeterd"), b)); }
  inhoud.append(el("div", { style: { maxWidth: "300px" } }, uitlegEl(d)));
  modaal(d.naam, inhoud, [{ tekst: "Sluiten" }]);
}

/* ───────── knooppunten ───────── */

export function knoopScherm(app, { run, actie }) {
  const st = run.knoop;
  const ks = KNOOPSOORTEN[st.soort];
  const bib = B();
  let titel = ks.naam, artPad = KNOOPART[st.soort], inhoud = [];
  const verder = (tekst = "Verder") => el("button", { class: "knop", onclick: () => actie({ soort: "klaar" }) }, tekst);
  let voet = [verder(st.klaar ? "Verder" : "Verder zonder te kiezen")];

  if (st.vervolg) {
    const v = st.vervolg;
    inhoud.push(el("p", { class: "uitleg" }, v.soort === "verwijder" ? `Kies ${v.aantal === 1 ? "een kaart" : v.aantal + " kaarten"} om kwijt te raken.` : `Kies ${v.aantal === 1 ? "een kaart" : v.aantal + " kaarten"} om te verbeteren.`));
    inhoud.push(el("div", { style: { textAlign: "center" } }, el("button", { class: "knop", onclick: async () => {
      const uid = await kiesUitStapel(run, v.soort === "verwijder" ? "Welke kaart raak je kwijt?" : "Welke kaart verbeter je?", i => v.soort === "verwijder" || (!i.verbeterd && kaartDef(i.id).verbeterd));
      if (uid) actie({ soort: v.soort, inst: uid });
    } }, "Kies een kaart")));
    voet = [el("button", { class: "knop stil", onclick: () => actie({ soort: "slaVervolgOver" }) }, "Overslaan")];
  } else switch (st.soort) {
    case "boekwinkel":
    case "markt": {
      const boek = st.soort === "boekwinkel";
      inhoud.push(el("p", { class: "uitleg" }, boek
        ? `Een winkel in Soho die alleen 's avonds opengaat. Achter de toonbank staan boeken die niet in de catalogus staan, en een la vol dingen die je aan een kaart kunt hangen. Je hebt ${run.ponden} Ponden.`
        : `Je hebt ${run.ponden} Ponden.`));
      const waren = el("div", { class: "waren" });
      st.waren.forEach((w, i) => {
        const k = kaartEl(w.id);
        const kan = !w.verkocht && run.ponden >= w.prijs;
        if (!w.verkocht) k.onclick = () => kan ? actie({ soort: "koop", index: i }) : melding("Daar heb je niet genoeg Ponden voor.");
        waren.append(el("div", { class: `waar ${w.verkocht ? "verkocht" : ""}` }, k, el("span", { class: `prijs ${kan || w.verkocht ? "" : "te-duur"}` }, w.verkocht ? "verkocht" : `£ ${w.prijs}`)));
      });
      const mid = el("div", { class: "waren" });
      st.middeltjes.forEach((w, i) => {
        const k = kaartEl(w.id);
        const kan = !w.verkocht && run.ponden >= w.prijs && run.middeltjes.length < 3;
        if (!w.verkocht) k.onclick = () => kan ? actie({ soort: "koopMiddeltje", index: i }) : melding(run.middeltjes.length >= 3 ? "Je zak met middeltjes is vol." : "Daar heb je niet genoeg Ponden voor.");
        mid.append(el("div", { class: `waar ${w.verkocht ? "verkocht" : ""}` }, k, el("span", { class: `prijs ${kan || w.verkocht ? "" : "te-duur"}` }, w.verkocht ? "verkocht" : `£ ${w.prijs}`)));
      });
      const talis = (st.talismannen || []).length ? [el("h3", { style: { textAlign: "center", color: "var(--goud-licht)" } }, "Talismannen"),
        el("p", { class: "uitleg" }, "Een talisman hang je aan één kaart. Hij verandert die kaart voor de rest van de run."),
        el("div", { class: "waren" }, st.talismannen.map((w, i) => talismanWaar(w, i, run, actie)))] : [];
      if ((run.talismannen || []).length) talis.push(el("div", { style: { maxWidth: "520px", margin: "0 auto" } }, losseTalismannen(run, actie)));
      if (boek) { inhoud.push(el("div", { class: "waren" }, ...waren.childNodes), ...talis); voet = [verder("Verlaat de boekwinkel")]; break; }
      const zegelKan = !st.zegel.verkocht && run.ponden >= st.zegel.prijs;
      const zegel = el("div", { class: `keuze`, style: { width: "min(420px, 90vw)", margin: "0 auto" } },
        el("b", {}, "Een Zegel"), el("span", {}, "Een kaart met een Zegel zit gegarandeerd in je beginhand en kost geen beurt om te spelen."),
        el("button", { class: "knop klein", disabled: !zegelKan, onclick: async () => {
          const uid = await kiesUitStapel(run, "Welke kaart krijgt de Zegel?", i => !i.zegel);
          if (uid) actie({ soort: "koopZegel", inst: uid });
        } }, st.zegel.verkocht ? "Verkocht" : `Koop voor £ ${st.zegel.prijs}`));
      inhoud.push(waren, el("h3", { style: { textAlign: "center", color: "var(--goud-licht)" } }, "Middeltjes"), mid, zegel, ...talis);
      voet = [verder("Verlaat de markt")];
      break;
    }
    case "ziekenhuis":
    case "gaarkeuken": {
      const opties = st.soort === "ziekenhuis"
        ? [["Laat je verzorgen", `Herstel ${Math.round(run.maxLichaam * 0.4)} Lichaam.`], ["Verzorg je bondgenoten", `Alle gewonde bondgenoten genezen (${[...run.stapel, ...run.reserve].filter(i => i.gewond).length} gewond), en je herstelt ${Math.round(run.maxLichaam * 0.15)} Lichaam.`]]
        : [["Een stille hoek en een kom soep", "Je Geest herstelt helemaal."], ["Een warme maaltijd", "+3 maximaal Lichaam en herstel 5 Lichaam."]];
      inhoud.push(el("p", { class: "uitleg" }, st.soort === "ziekenhuis" ? "Een vermoeide chirurg veegt zijn handen af. 'Eén ding tegelijk. Wat wordt het?'" : "Zuster Agatha schept op zonder te vragen wie je bent."));
      if (st.klaar) inhoud.push(el("p", { class: "gevolg", style: { textAlign: "center" } }, "Je voelt je beter."));
      else inhoud.push(el("div", { class: "keuzes" }, opties.map(([t, s], i) => el("button", { class: "keuze", onclick: () => actie({ soort: "kies", index: i }) }, el("b", {}, t), el("span", {}, s)))));
      break;
    }
    case "kerk": {
      const over = 2 - (st.verwijderd || 0);
      inhoud.push(el("p", { class: "uitleg" }, `Een pastoor luistert in de biechtstoel. Raak tot 2 kaarten kwijt, ook Waanzin. Nog ${over}.`));
      if (over > 0) inhoud.push(el("div", { style: { textAlign: "center" } }, el("button", { class: "knop", onclick: async () => {
        const uid = await kiesUitStapel(run, "Welke kaart laat je achter?");
        if (uid) actie({ soort: "verwijder", inst: uid });
      } }, "Kies een kaart")));
      break;
    }
    case "universiteit": {
      inhoud.push(el("p", { class: "uitleg" }, "In een laboratorium in Bloomsbury kijkt een professor naar je spullen. 'Dat kan beter.'"));
      if (!st.klaar) inhoud.push(el("div", { style: { textAlign: "center" } }, el("button", { class: "knop", onclick: async () => {
        const uid = await kiesUitStapel(run, "Welke kaart verbeter je?", i => !i.verbeterd && !!kaartDef(i.id).verbeterd, "Tik op een kaart. Je ziet daarna de verbeterde versie.");
        if (!uid) return;
        const i = run.stapel.find(x => x.uid === uid);
        const voor = kaartEl(i.id, { inst: i }), na = kaartEl(i.id, { inst: { ...i, verbeterd: true } });
        voor.style.setProperty("--w", "180px"); na.style.setProperty("--w", "180px");
        const ok = await modaal("Verbeteren?", el("div", { style: { display: "flex", gap: "16px", alignItems: "center", justifyContent: "center" } }, voor, el("span", { style: { fontSize: "30px" } }, "→"), na), [{ tekst: "Andere kaart", waarde: false, soort: "stil" }, { tekst: "Verbeter", waarde: true }]);
        if (ok) actie({ soort: "verbeter", inst: uid });
      } }, "Kies een kaart")));
      else inhoud.push(el("p", { class: "gevolg", style: { textAlign: "center" } }, "Het is beter dan het was."));
      break;
    }
    case "logement":
    case "kist": {
      inhoud.push(el("p", { class: "uitleg" }, st.soort === "logement"
        ? `In het logement zitten mensen die niets te verliezen hebben. Kies er één.${st.genezen ? ` Je ${st.genezen} gewonde bondgenoten knappen hier op.` : ""}${aantalBondgenoten(run) >= maxBondgenoten(run) ? ` Je hebt al ${maxBondgenoten(run)} bondgenoten: een nieuwe gaat naar de reserve.` : ""}`
        : "Een ijzeren kist, het slot is al geforceerd. Kies er één."));
      const rij = el("div", { class: "kaartrij" });
      st.opties.forEach((id, i) => {
        const k = kaartEl(id, run.achtergelaten && id === run.achtergelaten.id && st.soort === "logement" ? { inst: { gewond: true } } : {});
        if (st.gekozen === id) k.classList.add("gekozen");
        if (!st.klaar) k.onclick = () => actie({ soort: "kies", index: i });
        rij.append(k);
      });
      if (st.soort === "logement" && run.achtergelaten && st.opties.includes(run.achtergelaten.id)) inhoud.push(el("p", { class: "uitleg", style: { color: "#f0b3a8" } }, "Een van hen ken je. Je liet hem achter, de vorige keer."));
      inhoud.push(rij);
      break;
    }
    case "seance": {
      artPad = "plekken/marylebone.jpg";
      inhoud.push(el("p", { class: "sfeertekst" }, "Zware gordijnen, een tafeltje op drie poten en een vrouw met gesloten ogen. 'De doden hebben iets voor je,' zegt ze. 'Maar ze nemen ook iets mee.'"));
      if (!st.klaar) inhoud.push(el("div", { class: "keuzes" },
        el("button", { class: "keuze", onclick: () => actie({ soort: "kies", index: 0 }) }, el("b", {}, "Neem plaats aan de tafel"), el("span", {}, "Verlies 3 Geest. Krijg een artefact. Soms komt er iets mee terug.")),
        el("button", { class: "keuze", onclick: () => actie({ soort: "kies", index: 1 }) }, el("b", {}, "Sta op en ga"), el("span", {}, "Niets gewonnen, niets verloren."))));
      else inhoud.push(gekregenEl(st));
      break;
    }
    case "club": {
      const baas = st.baas && bib.vijanden[st.baas];
      inhoud.push(el("p", { class: "sfeertekst" }, "In de rooksalon van een club in Pall Mall praten heren over wat ze gehoord hebben. Als je luistert, hoor je meer dan ze bedoelen."));
      if (baas && !run.klokken.includes("zwijgende-getuigen")) inhoud.push(el("div", { class: "paneel", style: { padding: "16px", maxWidth: "640px", margin: "0 auto", display: "flex", gap: "16px" } },
        el("div", { class: "obeeld", style: { width: "110px", aspectRatio: "3/4", backgroundImage: bg(baas.art), backgroundSize: "cover", flex: "none", border: "2px solid var(--baas)" } }),
        el("div", {}, el("h3", { style: { color: "var(--goud-licht)" } }, baas.naam), el("p", {}, baas.vermogen || ""), el("p", { class: "muted" }, `Leven ${baas.leven}, aanval ${baas.aanval}, teller ${baas.teller}.`))));
      if (!st.klaar) inhoud.push(el("div", { class: "keuzes" },
        el("button", { class: "keuze", disabled: run.ponden < 8, onclick: () => actie({ soort: "kies", index: 0 }) }, el("b", {}, "Een rondje (8 Ponden)"), el("span", {}, "Herstel 3 Geest.")),
        el("button", { class: "keuze", onclick: () => actie({ soort: "kies", index: 1 }) }, el("b", {}, "Alleen luisteren"), el("span", {}, "Je onthoudt wat je hoorde."))));
      break;
    }
    case "ontmoeting": {
      const o = bib.ontmoetingen.find(x => x.id === st.ontmoeting);
      titel = o.titel; artPad = o.art;
      const kant = el("div", {});
      kant.append(el("p", { class: "sfeertekst" }, o.tekst));
      if (!st.klaar) kant.append(el("div", { class: "keuzes" }, o.keuzes.map((k, i) => el("button", { class: "keuze", disabled: !!(k.vereist?.ponden && run.ponden < k.vereist.ponden), onclick: () => actie({ soort: "kies", index: i }) }, el("b", {}, k.tekst), el("span", {}, uitkomstTekst(k.uitkomst))))));
      else {
        kant.append(el("p", { class: "gevolg" }, o.keuzes[st.keuze].gevolg));
        kant.append(gekregenEl(st));
        if (st.vervolgGevecht) kant.append(el("p", { style: { color: "#ff8f7c" } }, `Gevecht: ${st.vervolgGevecht.naam}`));
      }
      inhoud.push(el("div", { class: "ontmoeting" }, el("div", { class: "obeeld", style: { backgroundImage: bg(o.art) } }), kant));
      voet = st.klaar ? [verder(st.vervolgGevecht ? "Vecht" : "Verder")] : [];
      break;
    }
  }
  app.replaceChildren(el("div", { class: "scherm knoopscherm" },
    el("div", { class: "achtergrond", style: { backgroundImage: bg(artPad) } }),
    el("div", { class: "kop" }, el("h2", {}, titel), el("div", { class: "ruimte" }), ...meters(run)),
    el("div", { class: "midden" }, inhoud),
    el("div", { class: "voet" }, voet)));
}

function meters(run) {
  const ik = i => el("span", { html: i, style: { width: "18px", height: "18px", display: "inline-flex" } });
  return [el("span", { class: "meter lichaam", title: "Lichaam" }, ik(ICOON.hart), `${run.lichaam}/${run.maxLichaam}`),
    el("span", { class: "meter geest", title: "Geest" }, ik(ICOON.geest), `${run.geest}/${run.maxGeest}`),
    el("span", { class: "meter ponden", title: "Ponden" }, ik(ICOON.pond), String(run.ponden))];
}

function uitkomstTekst(u) {
  const d = [];
  if (u.ponden) d.push(`${u.ponden > 0 ? "+" : ""}${u.ponden} Ponden`);
  if (u.lichaam) d.push(`${u.lichaam > 0 ? "+" : ""}${u.lichaam} Lichaam`);
  if (u.geest) d.push(`${u.geest > 0 ? "+" : ""}${u.geest} Geest`);
  if (u.kaart) d.push(/^(klasse|londen)/.test(u.kaart) ? "een kaart" : kaartDef(u.kaart).naam);
  if (u.bondgenoot) d.push(`bondgenoot: ${kaartDef(u.bondgenoot).naam}`);
  if (u.middeltje) d.push("een middeltje");
  if (u.artefact) d.push("een artefact");
  if (u.verwijder) d.push("raak een kaart kwijt");
  if (u.verbeter) d.push(`verbeter ${u.verbeter} ${u.verbeter > 1 ? "kaarten" : "kaart"}`);
  if (u.waanzin) d.push("Waanzin");
  if (u.gevecht) d.push("een zwaar gevecht");
  return d.join(", ") || "Niets.";
}

function gekregenEl(st) {
  const g = el("div", { class: "gekregen" });
  for (const id of st.gekregen || []) g.append(kaartEl(id));
  for (const id of [st.waanzin, st.waanzin2].filter(Boolean)) g.append(kaartEl(id));
  if (st.talisman) { const t = B().talismannen[st.talisman]; g.append(el("div", { class: "keuze", style: { width: "260px" } }, el("b", {}, t.naam), el("span", {}, t.tekst + " Hang hem op vanaf de kaart van Londen."))); }
  if (st.artefact) { const a = B().artefacten[st.artefact]; g.append(el("div", { class: "keuze", style: { width: "260px" } }, el("b", {}, a.naam), el("span", {}, a.tekst))); }
  return g;
}

/* ───────── beloning ───────── */

export function beloningScherm(app, { run, actie }) {
  const b = run.beloning;
  const bib = B();
  const inhoud = [el("p", { class: "uitleg", style: { fontSize: "20px", color: "var(--goud-licht)" } }, `+${b.ponden} Ponden`)];
  if (b.artefacten.length) {
    inhoud.push(el("h3", { style: { textAlign: "center", color: "var(--goud-licht)" } }, b.artefactGekozen ? "Je nam een artefact" : "Kies een artefact"));
    inhoud.push(el("div", { class: "keuzes" }, b.artefacten.map((id, i) => {
      const a = bib.artefacten[id];
      return el("button", { class: `keuze ${b.artefactGekozen === id ? "gekozen" : ""}`, disabled: !!b.artefactGekozen && b.artefactGekozen !== id, onclick: () => !b.artefactGekozen && actie({ soort: "neemArtefact", index: i }) },
        el("div", { style: { display: "flex", gap: "12px", alignItems: "center" } }, el("div", { class: "artefact-ik", style: { width: "64px", height: "64px", backgroundImage: bg(a.art), flex: "none" } }), el("b", {}, a.naam)),
        el("span", {}, a.tekst));
    })));
  }
  inhoud.push(el("h3", { style: { textAlign: "center", color: "var(--goud-licht)", marginTop: "8px" } }, b.kaartGekozen ? (b.kaartGekozen === "overgeslagen" ? "Je liet de kaarten liggen" : "Nieuw in je stapel") : "Kies een kaart voor je stapel"));
  const rij = el("div", { class: "kaartrij" });
  b.kaarten.forEach((id, i) => {
    const k = kaartEl(id);
    if (b.kaartGekozen === id) k.classList.add("gekozen");
    else if (b.kaartGekozen) k.style.opacity = ".35";
    else k.onclick = () => { speel("kaart"); actie({ soort: "neemKaart", index: i }); };
    rij.append(k);
  });
  inhoud.push(rij);
  const voet = [];
  if (!b.kaartGekozen) voet.push(el("button", { class: "knop stil", onclick: () => actie({ soort: "slaOver" }) }, "Sla over (+10 Ponden)"));
  voet.push(el("button", { class: "knop", disabled: !b.artefactGekozen, onclick: () => actie({ soort: "klaar" }) }, "Verder"));
  const titel = b.soort === "baas" ? "De baas is verslagen" : b.soort === "elite" ? "De Scheur is dicht" : "Gewonnen";
  app.replaceChildren(el("div", { class: "scherm" },
    el("div", { class: "achtergrond", style: { backgroundImage: bg(plekArt(run.gevechtDef?.plek || "wapping")) } }),
    el("div", { class: "kop" }, el("h2", {}, titel), el("div", { class: "ruimte" }), ...meters(run)),
    el("div", { class: "midden" }, inhoud),
    el("div", { class: "voet" }, voet)));
}

/* ───────── einde ───────── */

export function eindScherm(app, { run, ontgrendeld, opnieuw, naarStart }) {
  const gewonnen = run.uitslag === "gewonnen";
  const held = B().helden[run.held], god = B().goden[run.god];
  app.replaceChildren(el("div", { class: `scherm einde ${gewonnen ? "" : "verloren"}` },
    el("div", { class: "achtergrond", style: { backgroundImage: bg(gewonnen ? "scherm/dageraad.jpg" : "scherm/verzwolgen.jpg") } }),
    el("div", { class: "inhoud paneel", style: { padding: "28px" } },
      el("h1", {}, gewonnen ? "De nacht is voorbij" : "Je held valt"),
      el("p", { class: "sfeertekst" }, gewonnen
        ? `${held.naam} staat aan de oever als de zon opkomt. ${god.naam} slaapt weer, voor nu. Niemand in Londen zal ooit weten wat er vannacht bijna gebeurde.`
        : `${held.naam} viel in ${run.stats.verlorenIn || "de nacht"}. ${god.naam} ademt verder onder de stad.`),
      el("div", { class: "cijfers" },
        el("div", {}, el("b", {}, String(run.stats.gevechten)), "gevechten"),
        el("div", {}, el("b", {}, String(run.stats.doden)), "vijanden verslagen"),
        el("div", {}, el("b", {}, String(run.stats.gespeeld)), "kaarten gespeeld"),
        el("div", {}, el("b", {}, String(run.stapel.length)), "kaarten in je stapel"),
        el("div", {}, el("b", {}, `Akte ${Math.min(3, run.pos.akte + 1)}`), "bereikt")),
      ontgrendeld?.length ? el("p", { style: { color: "var(--goud-licht)" } }, "Ontgrendeld: " + ontgrendeld.join(", ")) : null,
      !gewonnen && run.achtergelaten ? el("p", { class: "muted" }, `${kaartDef(run.achtergelaten.id).naam} bleef achter. Misschien vind je hem terug, de volgende nacht.`) : null,
      el("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" } },
        el("button", { class: "knop", onclick: opnieuw }, "Nieuwe run"), el("button", { class: "knop stil", onclick: naarStart }, "Naar het begin")))));
}

export { banner };
