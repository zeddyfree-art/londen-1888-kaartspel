// Een run: één nacht in drie akten. De kaart met paden, knooppunten, beloningen en het verloop.
// runActie(run, actie) geeft een nieuwe run terug plus gebeurtenissen. Alles is gewoon JSON.
import { willekeurig, geheel, kies, kiesMeerdere, schud, maakSeed } from "./toeval.js";
import { B, kaartDef } from "./bibliotheek.js";
import { maakGevecht, doe as gevechtDoe } from "./gevecht.js";

export const VERSIE = 1;
export const MAX_BONDGENOTEN = 4;
export const MAX_MIDDELTJES = 3;

export const KNOOPSOORTEN = {
  gevecht: { naam: "Gevecht", tekst: "Ponden en een nieuwe kaart." },
  scheur: { naam: "Scheur", tekst: "Een zwaar gevecht. Beloning: een artefact." },
  markt: { naam: "Markt", tekst: "Spullen, middeltjes en een Zegel te koop." },
  logement: { naam: "Logementen", tekst: "Kies een bondgenoot. Gewonde bondgenoten knappen op." },
  ziekenhuis: { naam: "Ziekenhuis", tekst: "Herstel Lichaam, of laat je gewonden verzorgen." },
  gaarkeuken: { naam: "Gaarkeuken", tekst: "Herstel Geest, of eet je sterker." },
  kerk: { naam: "Kerk", tekst: "Raak tot 2 kaarten kwijt, ook Waanzin." },
  universiteit: { naam: "Universiteit", tekst: "Verbeter een kaart." },
  seance: { naam: "Seance", tekst: "Verlies Geest, krijg een artefact. Misschien meer." },
  ontmoeting: { naam: "Ontmoeting", tekst: "Iemand in de nacht. Een keuze." },
  club: { naam: "Club", tekst: "Hoor wat de baas van deze akte doet." },
  kist: { naam: "Kist", tekst: "Kies een spul of barricade." },
};
const GEWICHT = { ontmoeting: 3, markt: 1.6, kist: 1.6, ziekenhuis: 1.3, gaarkeuken: 1, kerk: 1, universiteit: 1.2, logement: 1, seance: 0.7, club: 0.5, scheur: 1.1 };
const PRIJS = { gewoon: 30, ongewoon: 45, zeldzaam: 70, start: 25 };

const kloon = x => JSON.parse(JSON.stringify(x));
const ev = (run, e) => run._ev.push(e);

/* ───────── een nieuwe run ───────── */

export function nieuweRun({ klasse, held, god, stand = "normaal", klokken = [], seed = maakSeed() }) {
  const bib = B();
  const h = bib.helden[held];
  const st = bib.standen[stand];
  const run = {
    versie: VERSIE, seed, rng: seed >>> 0, klasse, held, god, stand, klokken,
    maxLichaam: Math.round(h.lichaam * (1 + st.heldPlus)), maxGeest: Math.round(h.geest * (1 + st.heldPlus)),
    ponden: 20, stapel: [], reserve: [], middeltjes: ["brandewijn"], artefacten: [],
    akte: 1, pos: { akte: 0, gedeelte: 0, pad: null, stap: 0 },
    fase: "kaart", knoop: null, beloning: null, gevecht: null, uitslag: null,
    uid: 0, stats: { gevechten: 0, beurten: 0, doden: 0, gespeeld: 0, spreuken: 0, verlorenIn: null },
    log: [],
  };
  run.lichaam = run.maxLichaam; run.geest = run.maxGeest;
  // startstapel: 2 persoonlijke voorwerpen, de startkaarten van de klasse (met 2 bondgenoten), 1 neutrale kaart
  for (const id of h.persoonlijk) if (bib.kaarten[id]) voegToe(run, id);
  const start = alleKaarten().filter(k => k.klasse === klasse && k.zeldzaamheid === "start");
  for (const k of start) for (let n = 0; n < (k.soort === "spul" && k.id === "boksbeugel" ? 2 : 1); n++) voegToe(run, k.id);
  const neutraal = alleKaarten().filter(k => k.klasse === "londen" && k.soort === "spul" && k.zeldzaamheid === "gewoon");
  voegToe(run, kies(run, neutraal).id);
  run.kaart = maakKaart(run);
  return run;
}

function alleKaarten() {
  return Object.values(B().kaarten);
}

function nieuweInst(run, id, extra = {}) {
  run.uid += 1;
  return { uid: `k${run.uid}`, id, ...extra };
}

/** Voeg een kaart toe aan de stapel. Een vijfde bondgenoot gaat naar de reserve. */
export function voegToe(run, id, extra = {}) {
  const d = kaartDef(id);
  if (d.soort === "middeltje") {
    if (run.middeltjes.length < MAX_MIDDELTJES) run.middeltjes.push(id);
    return null;
  }
  const inst = nieuweInst(run, id, extra);
  if (d.soort === "bondgenoot" && aantalBondgenoten(run) >= MAX_BONDGENOTEN) { run.reserve.push(inst); inst.inReserve = true; }
  else run.stapel.push(inst);
  return inst;
}

export function aantalBondgenoten(run) {
  return run.stapel.filter(i => kaartDef(i.id).soort === "bondgenoot").length;
}

/* ───────── de kaart van Londen ───────── */

function maakKaart(run) {
  const def = B().gevechten[run.god];
  if (!def) throw new Error(`Geen gevechten voor ${run.god}`);
  return def.akten.map((akte, a) => {
    const gewoon = schud(run, akte.gewoon);
    const gedeelten = [];
    for (let g = 0; g < 3; g++) {
      const doel = g === 2 ? akte.baas : gewoon[g % gewoon.length];
      const paden = [0, 1].map(p => {
        const lengte = 1 + geheel(run, 3) + (willekeurig(run) < 0.35 ? 1 : 0);
        const pad = [];
        const gebruikt = new Set();
        for (let s = 0; s < Math.min(3, lengte); s++) {
          const mag = Object.keys(GEWICHT).filter(k => !gebruikt.has(k)
            && !(k === "scheur" && ((a === 0 && g === 0) || [...gebruikt].includes("scheur")))
            && !(k === "markt" && s === 0 && a === 0 && g === 0));
          let extraScheur = run.klokken.includes("scheurende-stad") ? 1.5 : 1;
          const [soort] = kiesMeerdere(run, mag, 1, k => GEWICHT[k] * (k === "scheur" ? extraScheur : 1));
          gebruikt.add(soort);
          const knoop = { soort, id: `${a}-${g}-${p}-${s}` };
          if (soort === "scheur") knoop.gevecht = kies(run, akte.elite);
          pad.push(knoop);
        }
        return pad;
      });
      // elk gedeelte heeft op minstens één pad iets om te herstellen of te kopen
      const heeft = soorten => paden.some(pd => pd.some(k => soorten.includes(k.soort)));
      if (!heeft(["ziekenhuis", "gaarkeuken", "logement", "markt"])) paden[1][paden[1].length - 1] = { soort: g % 2 ? "markt" : "ziekenhuis", id: `${a}-${g}-1-x` };
      if (run.klokken.includes("gesloten-lijnen") && willekeurig(run) < 0.5) paden[1] = null;
      gedeelten.push({ gevecht: doel, paden });
    }
    return { gedeelten, plekken: akte.plekken };
  });
}

export function huidigGedeelte(run) {
  return run.kaart[run.pos.akte].gedeelten[run.pos.gedeelte];
}

export function huidigPad(run) {
  const gd = huidigGedeelte(run);
  return run.pos.pad == null ? null : gd.paden[run.pos.pad];
}

/* ───────── acties ───────── */

export function runActie(oud, actie) {
  const run = kloon(oud);
  run._ev = [];
  switch (run.fase) {
    case "kaart": kaartActie(run, actie); break;
    case "knoop": knoopActie(run, actie); break;
    case "gevecht": gevechtActie(run, actie); break;
    case "beloning": beloningActie(run, actie); break;
    case "einde": break;
  }
  // altijd mogelijk tussen knooppunten: bondgenoten wisselen met de reserve
  const e = run._ev; delete run._ev;
  return { run, ev: e };
}

function kaartActie(run, actie) {
  if (actie.soort === "wissel") { wisselReserve(run, actie.uit, actie.in); return; }
  if (actie.soort === "kiesPad") {
    if (run.pos.pad != null) throw new Error("Je hebt al een pad gekozen.");
    const gd = huidigGedeelte(run);
    if (!gd.paden[actie.pad]) throw new Error("Dat pad is er niet.");
    gd.gekozenPad = actie.pad;
    run.pos.pad = actie.pad; run.pos.stap = 0;
    ev(run, { t: "pad", pad: actie.pad });
    return;
  }
  if (actie.soort === "verder") {
    if (run.pos.pad == null) throw new Error("Kies eerst een pad.");
    const pad = huidigPad(run);
    if (run.pos.stap < pad.length) openKnoop(run, pad[run.pos.stap]);
    else startGevecht(run, huidigGedeelte(run).gevecht);
    return;
  }
  throw new Error(`Onbekende actie op de kaart: ${actie.soort}`);
}

function wisselReserve(run, uitUid, inUid) {
  const i = run.reserve.findIndex(x => x.uid === inUid);
  if (i < 0) throw new Error("Die bondgenoot zit niet in de reserve.");
  const binnen = run.reserve[i];
  if (uitUid) {
    const j = run.stapel.findIndex(x => x.uid === uitUid);
    if (j < 0) throw new Error("Die bondgenoot zit niet in je stapel.");
    const uit = run.stapel[j];
    run.stapel.splice(j, 1, binnen); run.reserve.splice(i, 1, uit);
  } else {
    if (aantalBondgenoten(run) >= MAX_BONDGENOTEN) throw new Error("Je hebt al vier bondgenoten.");
    run.reserve.splice(i, 1); run.stapel.push(binnen);
  }
}

/* ───────── gevechten ───────── */

function startGevecht(run, def) {
  run.gevecht = maakGevecht(run, def);
  run.gevechtDef = def;
  run.rng = run.gevecht.rng;
  run.fase = "gevecht";
  ev(run, { t: "gevecht", naam: def.naam });
}

function gevechtActie(run, actie) {
  const { g, ev: gev } = gevechtDoe(run.gevecht, actie);
  run.gevecht = g;
  run._ev.push(...gev);
  if (g.uitslag) verwerkGevecht(run);
}

/** Na het gevecht: Lichaam, Geest, gewonden, Waanzin en de beloning. */
export function verwerkGevecht(run) {
  const g = run.gevecht, bib = B();
  const h = g.eenheden[g.held];
  run.rng = g.rng;
  run.stats.gevechten += 1;
  run.stats.beurten += g.beurt;
  run.stats.doden += g.stats.doden;
  run.stats.gespeeld += g.stats.gespeeld;
  run.stats.spreuken += g.stats.spreuken;
  run.geest = Math.max(1, Math.min(run.maxGeest, g.geest));
  run.middeltjes = [...g.zak];
  if (g.scarabeeGebruikt) run.scarabeeGebruikt = true;
  for (const w of g.nieuweWaanzin) voegToe(run, w.id);
  if (g.uitslag === "verloren") {
    run.lichaam = 0;
    run.fase = "einde"; run.uitslag = "verloren";
    run.stats.verlorenIn = g.naam;
    const gevallen = g.gevallen.find(x => x.soort === "bondgenoot") || run.stapel.find(i => kaartDef(i.id).soort === "bondgenoot");
    run.achtergelaten = gevallen ? { id: gevallen.id, verbeterd: !!gevallen.verbeterd } : null;
    ev(run, { t: "runVerloren" });
    return;
  }
  run.lichaam = Math.max(1, Math.min(run.maxLichaam, h.leven));
  const geenGenade = run.klokken.includes("geen-genade");
  for (const v of g.gevallen) {
    const i = run.stapel.findIndex(x => x.uid === v.uid);
    if (i < 0 || v.soort !== "bondgenoot") continue;
    if (geenGenade) run.stapel.splice(i, 1); else run.stapel[i].gewond = true;
  }
  // artefacten en vermogens na het gevecht
  const hv = bib.helden[run.held].vermogen || {};
  let extraPonden = 0;
  for (const a of run.artefacten) {
    const ad = bib.artefacten[a];
    if (ad?.haak !== "na-gevecht") continue;
    if (ad.lichaam) run.lichaam = Math.min(run.maxLichaam, run.lichaam + ad.lichaam);
    if (ad.ponden) extraPonden += ad.ponden;
    if (ad.geest) run.geest = Math.max(1, run.geest + ad.geest);
  }
  if (hv.naGevechtLichaam) run.lichaam = Math.min(run.maxLichaam, run.lichaam + hv.naGevechtLichaam);
  const st = bib.standen[run.stand];
  const soort = g.soortGevecht;
  const basis = soort === "baas" ? 30 : soort === "elite" ? 22 : 12 + 3 * run.pos.akte + geheel(run, 6);
  const ponden = Math.round((basis + g.buit) * (st.ponden ?? 1)) + extraPonden;
  run.ponden += ponden;
  const kaarten = kaartKeuze(run, soort === "baas" ? "baas" : "gewoon");
  const nArt = (soort === "baas" ? 3 : soort === "elite" ? 2 : 0) + (nArtExtra(run, soort));
  const artefacten = nArt ? artefactKeuze(run, nArt) : [];
  run.beloning = { ponden, kaarten, artefacten, kaartGekozen: false, artefactGekozen: !artefacten.length, soort };
  run.fase = "beloning";
  ev(run, { t: "beloning", ponden });
}

function nArtExtra(run, soort) {
  if (soort === "gewoon") return 0;
  return B().helden[run.held].vermogen?.artefactExtra || 0;
}

export function kaartPool(run, { soorten, klassen } = {}) {
  const h = B().helden[run.held];
  const k = klassen || (h.id === "pema-lhamo" ? ["kennis", "waarneming", "kracht", "charisma"] : [run.klasse]);
  return alleKaarten().filter(c =>
    ["gewoon", "ongewoon", "zeldzaam"].includes(c.zeldzaamheid) && c.soort !== "middeltje" && c.soort !== "waanzin"
    && (!c.god || c.god === run.god) && (!soorten || soorten.includes(c.soort)) && (k.includes(c.klasse) || c.klasse === "londen"));
}

function kaartKeuze(run, soort, n) {
  const h = B().helden[run.held];
  n = n ?? 3 + (h.vermogen?.extraKeuze || 0);
  const pool = kaartPool(run);
  const zw = soort === "baas" ? { gewoon: 1, ongewoon: 4, zeldzaam: 4 } : { gewoon: 6, ongewoon: 3, zeldzaam: 1 };
  const uit = [];
  const gekozen = new Set();
  // bondgenoten alleen als er nog plek is, of als reserve
  for (let i = 0; i < n; i++) {
    const eigen = willekeurig(run) < 0.7;
    let kandidaten = pool.filter(c => !gekozen.has(c.id) && (eigen ? c.klasse !== "londen" : c.klasse === "londen"));
    if (!kandidaten.length) kandidaten = pool.filter(c => !gekozen.has(c.id));
    const [c] = kiesMeerdere(run, kandidaten, 1, c => zw[c.zeldzaamheid] || 1);
    if (!c) break;
    gekozen.add(c.id); uit.push(c.id);
  }
  return uit;
}

function artefactKeuze(run, n) {
  const pool = Object.keys(B().artefacten).filter(a => !run.artefacten.includes(a));
  return kiesMeerdere(run, pool, n);
}

function beloningActie(run, actie) {
  const b = run.beloning;
  if (actie.soort === "neemKaart") {
    if (b.kaartGekozen) throw new Error("Je hebt al een kaart gekozen.");
    const id = b.kaarten[actie.index];
    if (!id) throw new Error("Die kaart is er niet.");
    voegToe(run, id);
    b.kaartGekozen = id;
    ev(run, { t: "nieuweKaart", kaart: id });
    return;
  }
  if (actie.soort === "slaOver") {
    if (b.kaartGekozen) return;
    const extra = 10;
    run.ponden += extra; b.kaartGekozen = "overgeslagen";
    ev(run, { t: "ponden", aantal: extra });
    return;
  }
  if (actie.soort === "neemArtefact") {
    if (b.artefactGekozen) throw new Error("Je hebt al een artefact gekozen.");
    const id = b.artefacten[actie.index];
    neemArtefact(run, id);
    b.artefactGekozen = id;
    return;
  }
  if (actie.soort === "klaar") {
    if (!b.kaartGekozen) b.kaartGekozen = "overgeslagen";
    run.beloning = null;
    run.gevecht = null;
    if (run.terugNaarKnoop) { run.terugNaarKnoop = false; run.fase = "kaart"; run.pos.stap += 1; return; }
    volgendGedeelte(run);
    return;
  }
  throw new Error(`Onbekende actie bij de beloning: ${actie.soort}`);
}

export function neemArtefact(run, id) {
  const ad = B().artefacten[id];
  if (!ad) throw new Error(`Onbekend artefact: ${id}`);
  run.artefacten.push(id);
  if (ad.maxGeest) { run.maxGeest += ad.maxGeest; run.geest += ad.maxGeest; }
  ev(run, { t: "artefact", id });
}

function volgendGedeelte(run) {
  if (run.pos.pad != null) huidigGedeelte(run).gekozenPad = run.pos.pad;
  const wasBaas = run.pos.gedeelte === 2;
  run.pos.gedeelte += 1; run.pos.pad = null; run.pos.stap = 0;
  if (run.pos.gedeelte > 2) {
    run.pos.akte += 1; run.pos.gedeelte = 0;
    if (run.pos.akte > 2) { run.fase = "einde"; run.uitslag = "gewonnen"; ev(run, { t: "runGewonnen" }); return; }
    run.akte = run.pos.akte + 1;
    if (wasBaas) {
      // tussen de akten: even op adem komen
      const herstel = Math.ceil((run.maxLichaam - run.lichaam) / 2);
      run.lichaam += herstel;
      if (!run.klokken.includes("slapeloze-nachten")) run.geest = Math.min(run.maxGeest, run.geest + Math.ceil((run.maxGeest - run.geest) / 2));
      ev(run, { t: "nieuweAkte", akte: run.akte, herstel });
    }
  }
  run.fase = "kaart";
}

/* ───────── knooppunten ───────── */

function prijs(run, basis) {
  let p = basis;
  if (B().helden[run.held].vermogen?.korting) p *= 1 - B().helden[run.held].vermogen.korting;
  if (run.klokken.includes("lege-zakken")) p *= 1.25;
  return Math.round(p);
}

function openKnoop(run, knoop) {
  const bib = B();
  const st = { soort: knoop.soort, id: knoop.id, klaar: false };
  switch (knoop.soort) {
    case "scheur": startGevecht(run, knoop.gevecht); run.terugNaarKnoop = true; return;
    case "markt": {
      const spullen = kaartPool(run, { soorten: ["spul", "barricade", "spreuk"] });
      const eigen = kiesMeerdere(run, spullen.filter(c => c.klasse !== "londen"), 3);
      const londen = kiesMeerdere(run, spullen.filter(c => c.klasse === "londen"), 2);
      st.waren = [...eigen, ...londen].map(c => ({ id: c.id, prijs: prijs(run, PRIJS[c.zeldzaamheid] + geheel(run, 8)), verkocht: false }));
      const mid = kiesMeerdere(run, bib.data.middeltjes, 2);
      st.middeltjes = mid.map(m => ({ id: m.id, prijs: prijs(run, m.prijs), verkocht: false }));
      st.zegel = { prijs: prijs(run, 40), verkocht: false };
      break;
    }
    case "logement": {
      const pool = kaartPool(run, { soorten: ["bondgenoot"] });
      st.opties = kiesMeerdere(run, pool, 3).map(c => c.id);
      if (run.achtergelaten && willekeurig(run) < 0.5) st.opties[2] = run.achtergelaten.id; // wie je achterliet, vind je terug
      const gewonden = run.stapel.filter(i => i.gewond);
      for (const i of gewonden) i.gewond = false;
      st.genezen = gewonden.length;
      break;
    }
    case "kist": {
      const pool = kaartPool(run, { soorten: ["spul", "barricade"] });
      st.opties = kiesMeerdere(run, pool, 3 + (bib.helden[run.held].vermogen?.kistExtra || 0)).map(c => c.id);
      break;
    }
    case "ontmoeting": {
      const gezien = new Set(run.gezien || []);
      let pool = bib.ontmoetingen.filter(o => (o.god === run.god) && !gezien.has(o.id));
      if (!pool.length || willekeurig(run) < 0.35) pool = bib.ontmoetingen.filter(o => !o.god && !gezien.has(o.id)).concat(pool);
      if (!pool.length) pool = bib.ontmoetingen.filter(o => !o.god || o.god === run.god);
      const o = kies(run, pool);
      (run.gezien ??= []).push(o.id);
      st.ontmoeting = o.id;
      break;
    }
    case "club": {
      const baas = run.kaart[run.pos.akte].gedeelten[2].gevecht;
      st.baas = baas.golven.flat().map(x => (typeof x === "string" ? x : x.id)).find(id => bib.vijanden[id]?.baas);
      break;
    }
  }
  run.knoop = st;
  run.fase = "knoop";
  ev(run, { t: "knoop", soort: knoop.soort });
}

function vind(run, uid) {
  const i = run.stapel.find(x => x.uid === uid);
  if (!i) throw new Error("Die kaart zit niet in je stapel.");
  return i;
}

function knoopActie(run, actie) {
  const st = run.knoop, bib = B();
  if (actie.soort === "klaar") { verlaatKnoop(run); return; }
  if (actie.soort === "wissel") { wisselReserve(run, actie.uit, actie.in); return; }
  // vervolgstappen van een ontmoeting (kaart kwijt, verbeteren)
  if (st.vervolg) { vervolgActie(run, actie); return; }
  switch (st.soort) {
    case "markt": {
      if (actie.soort === "koop") {
        const w = st.waren[actie.index];
        if (!w || w.verkocht) throw new Error("Dat is er niet meer.");
        if (run.ponden < w.prijs) throw new Error("Daar heb je niet genoeg Ponden voor.");
        run.ponden -= w.prijs; w.verkocht = true; voegToe(run, w.id);
        ev(run, { t: "gekocht", kaart: w.id });
      } else if (actie.soort === "koopMiddeltje") {
        const w = st.middeltjes[actie.index];
        if (!w || w.verkocht) throw new Error("Dat is er niet meer.");
        if (run.middeltjes.length >= MAX_MIDDELTJES) throw new Error("Je zak met middeltjes is vol.");
        if (run.ponden < w.prijs) throw new Error("Daar heb je niet genoeg Ponden voor.");
        run.ponden -= w.prijs; w.verkocht = true; run.middeltjes.push(w.id);
        ev(run, { t: "gekocht", kaart: w.id });
      } else if (actie.soort === "koopZegel") {
        if (st.zegel.verkocht) throw new Error("De Zegel is al verkocht.");
        if (run.ponden < st.zegel.prijs) throw new Error("Daar heb je niet genoeg Ponden voor.");
        const i = vind(run, actie.inst);
        if (i.zegel) throw new Error("Die kaart heeft al een Zegel.");
        run.ponden -= st.zegel.prijs; st.zegel.verkocht = true; i.zegel = true;
        ev(run, { t: "zegel", kaart: i.id });
      } else throw new Error("Dat kan hier niet.");
      return;
    }
    case "ziekenhuis": {
      if (st.klaar) return;
      if (actie.soort === "kies" && actie.index === 0) run.lichaam = Math.min(run.maxLichaam, run.lichaam + Math.round(run.maxLichaam * herstelFactor(run, 0.4)));
      else if (actie.soort === "kies" && actie.index === 1) {
        for (const i of run.stapel) i.gewond = false;
        for (const i of run.reserve) i.gewond = false;
        run.lichaam = Math.min(run.maxLichaam, run.lichaam + Math.round(run.maxLichaam * herstelFactor(run, 0.15)));
      } else throw new Error("Kies een behandeling.");
      st.klaar = true; ev(run, { t: "herstel" });
      return;
    }
    case "gaarkeuken": {
      if (st.klaar) return;
      if (actie.soort === "kies" && actie.index === 0) run.geest = run.klokken.includes("slapeloze-nachten") ? Math.min(run.maxGeest, run.geest + Math.ceil(run.maxGeest / 2)) : run.maxGeest;
      else if (actie.soort === "kies" && actie.index === 1) { run.maxLichaam += 3; run.lichaam = Math.min(run.maxLichaam, run.lichaam + 5); }
      else throw new Error("Kies een maaltijd.");
      st.klaar = true; ev(run, { t: "herstel" });
      return;
    }
    case "kerk": {
      if (actie.soort !== "verwijder") throw new Error("Hier kun je alleen kaarten kwijtraken.");
      if ((st.verwijderd || 0) >= 2) throw new Error("De pastoor heeft genoeg gehoord.");
      const i = vind(run, actie.inst);
      run.stapel = run.stapel.filter(x => x.uid !== i.uid);
      st.verwijderd = (st.verwijderd || 0) + 1;
      ev(run, { t: "verwijderd", kaart: i.id });
      return;
    }
    case "universiteit": {
      if (actie.soort !== "verbeter") throw new Error("Hier kun je alleen een kaart verbeteren.");
      if (st.klaar) throw new Error("Je hebt hier al een kaart verbeterd.");
      verbeter(run, actie.inst);
      st.klaar = true;
      return;
    }
    case "logement":
    case "kist": {
      if (actie.soort !== "kies" || st.klaar) throw new Error("Kies er één.");
      const id = st.opties[actie.index];
      const inst = voegToe(run, id);
      if (st.soort === "logement" && run.achtergelaten && id === run.achtergelaten.id && inst) { inst.gewond = true; inst.verbeterd = run.achtergelaten.verbeterd; run.achtergelaten = null; }
      st.klaar = true; st.gekozen = id;
      ev(run, { t: "nieuweKaart", kaart: id });
      return;
    }
    case "seance": {
      if (st.klaar) return;
      if (actie.soort === "kies" && actie.index === 0) {
        run.geest -= 3;
        const [a] = artefactKeuze(run, 1);
        if (a) neemArtefact(run, a);
        st.artefact = a;
        if (willekeurig(run) < 0.4) { const w = kies(run, bib.data.waanzin); voegToe(run, w.id); st.waanzin = w.id; }
        if (run.geest <= 0) { const w = kies(run, bib.data.waanzin); voegToe(run, w.id); st.waanzin2 = w.id; run.geest = Math.ceil(run.maxGeest / 2); }
      }
      st.klaar = true;
      return;
    }
    case "club": {
      if (st.klaar) return;
      if (actie.soort === "kies" && actie.index === 0) {
        if (run.ponden < 8) throw new Error("Je hebt geen 8 Ponden.");
        run.ponden -= 8; run.geest = Math.min(run.maxGeest, run.geest + 3);
      }
      st.klaar = true;
      return;
    }
    case "ontmoeting": {
      if (actie.soort !== "kies" || st.klaar) throw new Error("Maak een keuze.");
      const o = bib.ontmoetingen.find(x => x.id === st.ontmoeting);
      const k = o.keuzes[actie.index];
      if (!k) throw new Error("Die keuze is er niet.");
      if (k.vereist?.ponden && run.ponden < k.vereist.ponden) throw new Error("Daar heb je niet genoeg Ponden voor.");
      st.klaar = true; st.keuze = actie.index;
      pasUitkomstToe(run, k.uitkomst);
      return;
    }
  }
  throw new Error("Dat kan hier niet.");
}

function herstelFactor(run, f) {
  let x = f;
  if (B().helden[run.held].vermogen?.naGevechtLichaam) x += 0.1; // Whitlock: rusten herstelt extra
  if (run.klokken.includes("slapeloze-nachten")) x *= 0.6;
  return x;
}

export function verbeter(run, uid) {
  const i = vind(run, uid);
  if (i.verbeterd) throw new Error("Die kaart is al verbeterd.");
  if (!kaartDef(i.id).verbeterd) throw new Error("Die kaart kun je niet verbeteren.");
  i.verbeterd = true;
  ev(run, { t: "verbeterd", kaart: i.id });
}

function pasUitkomstToe(run, u) {
  const bib = B();
  const st = run.knoop;
  st.gekregen = [];
  if (u.ponden) run.ponden = Math.max(0, run.ponden + u.ponden);
  if (u.lichaam) run.lichaam = Math.max(1, Math.min(run.maxLichaam, run.lichaam + u.lichaam));
  if (u.maxLichaam) { run.maxLichaam += u.maxLichaam; run.lichaam += u.maxLichaam; }
  if (u.geest) {
    run.geest = Math.min(run.maxGeest, run.geest + u.geest);
    if (run.geest <= 0) { const w = kies(run, bib.data.waanzin); voegToe(run, w.id); st.gekregen.push(w.id); run.geest = Math.ceil(run.maxGeest / 2); }
  }
  if (u.kaart) {
    let id = u.kaart;
    const m = /^(klasse|londen)(?:-(\w+))?$/.exec(u.kaart);
    if (m) {
      const pool = kaartPool(run).filter(c => (m[1] === "klasse" ? c.klasse === run.klasse : c.klasse === "londen") && (!m[2] || c.zeldzaamheid === m[2]));
      id = kies(run, pool)?.id;
    }
    if (id) { voegToe(run, id); st.gekregen.push(id); }
  }
  if (u.bondgenoot) { voegToe(run, u.bondgenoot); st.gekregen.push(u.bondgenoot); }
  if (u.middeltje) {
    const id = u.middeltje === "willekeurig" ? kies(run, bib.data.middeltjes).id : u.middeltje;
    if (run.middeltjes.length < MAX_MIDDELTJES) { run.middeltjes.push(id); st.gekregen.push(id); }
  }
  if (u.waanzin) for (let n = 0; n < u.waanzin; n++) { const w = kies(run, bib.data.waanzin); voegToe(run, w.id); st.gekregen.push(w.id); }
  if (u.artefact) { const [a] = artefactKeuze(run, 1); if (a) { neemArtefact(run, a); st.artefact = a; } }
  if (u.verwijder) st.vervolg = { soort: "verwijder", aantal: u.verwijder };
  if (u.verbeter) st.vervolg = { soort: "verbeter", aantal: u.verbeter };
  if (u.gevecht === "elite") {
    const akte = B().gevechten[run.god].akten[run.pos.akte];
    st.vervolgGevecht = kies(run, akte.elite);
  }
}

function vervolgActie(run, actie) {
  const v = run.knoop.vervolg;
  if (actie.soort === "slaVervolgOver") { run.knoop.vervolg = null; return; }
  if (v.soort === "verwijder" && actie.soort === "verwijder") {
    const i = vind(run, actie.inst);
    run.stapel = run.stapel.filter(x => x.uid !== i.uid);
  } else if (v.soort === "verbeter" && actie.soort === "verbeter") verbeter(run, actie.inst);
  else throw new Error("Kies eerst een kaart.");
  v.aantal -= 1;
  if (v.aantal <= 0) run.knoop.vervolg = null;
}

function verlaatKnoop(run) {
  const st = run.knoop;
  run.knoop = null;
  if (st?.vervolgGevecht) { startGevecht(run, st.vervolgGevecht); run.terugNaarKnoop = true; return; }
  run.fase = "kaart";
  run.pos.stap += 1;
}
