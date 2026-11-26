// De spelregels van een gevecht. Pure functies, geen DOM.
// doe(g, actie) geeft een NIEUWE toestand terug plus een lijst gebeurtenissen die het scherm kan afspelen.
import { schud, kies, geheel } from "./toeval.js";
import { B, kaartDef } from "./bibliotheek.js";
import { voerUit } from "./effecten.js";

export const RIJEN = ["straat", "riool"];
export const HANDGROOTTE = 6;
export const MAXHAND = 10;
export const FLUITJE_OPLADEN = 4;

export const STATUSSEN = {
  mist: { naam: "Mist", tekst: "Teller en reacties staan stil. −1 per beurt.", slecht: true },
  pest: { naam: "Pest", tekst: "Aan het eind van de beurt evenveel schade (geen treffer). −1 per keer.", slecht: true },
  doorns: { naam: "Doorns", tekst: "Wie deze kaart treft, krijgt evenveel schade (geen treffer)." },
  gezegend: { naam: "Gezegend", tekst: "Blokkeert de volgende treffer volledig. −1 per geblokkeerde treffer." },
  bescherming: { naam: "Bescherming", tekst: "Vangt schade op voordat het Leven daalt." },
  vervloekt: { naam: "Vervloekt", tekst: "De volgende treffer doet dubbele schade.", slecht: true },
  inkt: { naam: "Inkt", tekst: "Vermogens en reacties doen niets. −1 per beurt.", slecht: true },
  bekoring: { naam: "Bekoring", tekst: "De volgende aanval treft de eigen kant.", slecht: true },
  angst: { naam: "Angst", tekst: "−1 aanval per punt. −1 na elke eigen aanval.", slecht: true },
  woede: { naam: "Woede", tekst: "+1 schade per punt bij de volgende aanval." },
};

export const andereKant = k => (k === "speler" ? "vijand" : "speler");
export const levend = u => u && !u.dood;
export const ev = (g, e) => { g.ev.push(e); };
export const snap = u => JSON.parse(JSON.stringify(u));
const leegVeld = () => ({ straat: [null, null, null], riool: [null, null, null] });

/* ───────── het veld ───────── */

export function eenheidOp(g, kant, rij, plek) {
  if (plek < 0 || plek > 2) return null;
  const uid = g.veld[kant][rij][plek];
  return uid ? g.eenheden[uid] : null;
}

export function rijVan(g, u) {
  return u.vak ? u.vak.rij : "straat";
}

/** Alle levende eenheden van een kant, in de volgorde van toeslaan. */
export function eenhedenVan(g, kant) {
  const uit = [], gezien = new Set();
  for (let p = 0; p < 3; p++) for (const r of RIJEN) {
    const u = eenheidOp(g, kant, r, p);
    if (u && !u.dood && !gezien.has(u.uid)) { gezien.add(u.uid); uit.push(u); }
  }
  return uit;
}

/** De volgorde van toeslaan: eerst alle vijanden, dan jouw kant. */
export function volgorde(g) {
  return [...eenhedenVan(g, "vijand"), ...eenhedenVan(g, "speler")];
}

function legNeer(g, u, kant, rij, plek) {
  u.kant = kant;
  u.vak = { rij, plek };
  g.veld[kant][rij][plek] = u.uid;
  if (u.groot) g.veld[kant][rij === "straat" ? "riool" : "straat"][plek] = u.uid;
}

function haalWeg(g, u) {
  for (const r of RIJEN) for (let p = 0; p < 3; p++) if (g.veld[u.kant][r][p] === u.uid) g.veld[u.kant][r][p] = null;
}

function legeVakken(g, kant, voorkeurRij) {
  const rijen = voorkeurRij === "riool" ? ["riool", "straat"] : ["straat", "riool"];
  const uit = [];
  for (const r of rijen) for (let p = 0; p < 3; p++) if (!g.veld[kant][r][p]) uit.push({ rij: r, plek: p });
  return uit;
}

/* ───────── eenheden maken ───────── */

function nieuweUid(g, voor = "e") { g.teller = (g.teller || 0) + 1; return `${voor}${g.teller}`; }

function maakEenheid(g, def, kant, extra = {}) {
  const st = g.ctx.standDef || {};
  const isVijand = kant === "vijand" && !extra.overgelopen;
  let leven = def.leven ?? null, aanval = def.aanval ?? null;
  if (isVijand) {
    const schaal = (g.ctx.aktes?.[g.ctx.akte - 1] ?? 1) * (st.vijandLeven ?? 1);
    if (leven != null) leven = Math.max(1, Math.round(leven * schaal));
    if (aanval != null) {
      const plus = (st.vijandAanval ?? 0) + (g.ctx.akte >= 3 ? 1 : 0);
      aanval = aanval > 0 ? Math.max(1, aanval + plus) : 0;
    }
  }
  const u = {
    uid: nieuweUid(g, kant === "speler" ? "s" : "v"),
    id: def.id, naam: def.naam, soort: def.soort || (kant === "vijand" ? "vijand" : "bondgenoot"),
    art: def.art, kant, vak: null,
    leven, maxLeven: leven, aanval, gruwel: def.gruwel || 0,
    teller: def.teller ?? null, maxTeller: def.teller ?? null,
    schroot: def.schroot ?? null, maxSchroot: def.schroot ?? null,
    statussen: Object.fromEntries(Object.keys(STATUSSEN).map(s => [s, 0])),
    kenmerken: [...(def.kenmerken || [])],
    mens: !!def.mens, baas: !!def.baas, groot: !!def.groot, klasse: def.klasse || null,
    trofeeen: 0, ...extra,
  };
  for (const [s, n] of Object.entries(def.statussen || {})) u.statussen[s] = n;
  if (def.fasen) { u.fase = 0; u.fasen = def.fasen.length; }
  return u;
}

/** De gegevens van een eenheid die bij haar kaart horen (vermogens), eventueel van de huidige fase. */
export function defVan(g, u) {
  if (u.soort === "held") return B().helden[u.id];
  const d = kaartDef(u.id, u.verbeterd);
  if (d.fasen && u.fase != null) return { ...d, ...d.fasen[u.fase] };
  return d;
}

/* ───────── gevecht beginnen ───────── */

/**
 * Maak een gevecht vanuit de run.
 * run: { rng, held, klasse, lichaam, maxLichaam, geest, maxGeest, stapel, middeltjes, artefacten, stand, god, akte }
 * def: een gevecht uit data/gevechten.json: { id, naam, golven: [[{ id, rij }]], bigben }
 */
export function maakGevecht(run, def) {
  const bib = B();
  const held = bib.helden[run.held];
  const god = bib.goden[run.god] || {};
  const g = {
    rng: run.rng, beurt: 1, teller: 0, ev: [],
    naam: def.naam, gevechtId: def.id, soortGevecht: def.soort || "gewoon",
    veld: { speler: leegVeld(), vijand: leegVeld() }, eenheden: {},
    hand: [], trek: [], afleg: [], verbannen: [], gevallen: [], zak: [...(run.middeltjes || [])],
    geest: run.geest, maxGeest: run.maxGeest, verlicht: false,
    golven: def.golven.map(golf => golf.map(x => (typeof x === "string" ? { id: x } : x))), golfNr: 0,
    bigben: def.bigben || 4, bigbenMax: def.bigben || 4, wachtrij: [],
    fluitjeRust: 0, eenmaligGebruikt: {}, buit: 0, aanwijzingen: 0, nieuweWaanzin: [],
    uitslag: null,
    stats: { gespeeld: 0, spreuken: 0, doden: 0, schadeGedaan: 0, schadeOntvangen: 0 },
    ctx: {
      held: run.held, klasse: run.klasse, god: run.god, akte: run.akte || 1, artefacten: [...(run.artefacten || [])],
      stand: run.stand || "normaal", standDef: bib.standen[run.stand || "normaal"] || {}, klokken: run.klokken || [],
      aktes: god.akteSchaal || [1, 1.35, 1.75], scarabee: (run.artefacten || []).includes("scarabee") && !run.scarabeeGebruikt,
    },
  };
  if (g.ctx.klokken.includes("dikke-mist")) { g.bigben = Math.max(2, g.bigben - 1); g.bigbenMax = g.bigben; }
  if (g.ctx.artefacten.includes("teruglopend-horloge")) { g.bigben += 1; g.bigbenMax += 1; }

  // de held
  const k = bib.klassen[run.klasse];
  const hu = maakEenheid(g, {
    id: held.id, naam: held.naam, soort: "held", art: held.art, klasse: run.klasse,
    leven: run.maxLichaam, aanval: k.held.aanval + (g.ctx.artefacten.includes("tempeliersszwaard") ? 1 : 0),
    teller: k.held.teller + (g.ctx.klokken.includes("zware-benen") ? 1 : 0),
    kenmerken: k.kenmerken || [], statussen: held.statussen || {},
  }, "speler");
  hu.leven = run.lichaam;
  legNeer(g, hu, "speler", "straat", 1);
  g.eenheden[hu.uid] = hu;
  g.held = hu.uid;

  // stapel
  const stapel = run.stapel.filter(i => kaartDef(i.id).soort !== "middeltje").map(i => ({ ...i }));
  g.trek = schud(g, stapel);
  if (held.vermogen?.extraKaart) g.hand.push({ uid: `tijdelijk-${held.vermogen.extraKaart}`, id: held.vermogen.extraKaart, zegel: true, tijdelijk: true });
  // Zegels gegarandeerd in de beginhand
  for (const i of g.trek.filter(i => i.zegel)) { g.trek.splice(g.trek.indexOf(i), 1); g.hand.push(i); }
  const extra = g.ctx.artefacten.includes("ring-gyges") ? 1 : 0;
  trekStil(g, Math.max(0, HANDGROOTTE + extra - g.hand.length));
  // toeval mag spannend zijn, nooit uitzichtloos: minstens één kaart voor het veld in de beginhand
  const isVeld = i => ["bondgenoot", "barricade"].includes(kaartDef(i.id).soort);
  if (!g.hand.some(isVeld)) {
    const j = g.trek.findIndex(isVeld);
    const weg = g.hand.findIndex(i => !i.zegel && !i.tijdelijk);
    if (j >= 0 && weg >= 0) { const [nieuw] = g.trek.splice(j, 1); g.trek.push(g.hand[weg]); g.hand[weg] = nieuw; }
  }

  // eerste golf
  komGolf(g, true);
  geldVerlichting(g, true);

  // vermogens en artefacten bij het begin
  const vm = held.vermogen || {};
  if (vm.beginStatus) for (const [s, n] of Object.entries(vm.beginStatus)) geefStatus(g, hu, s, n);
  for (const a of g.ctx.artefacten) {
    const ad = bib.artefacten[a];
    if (ad?.haak === "begin-gevecht") voerUit(g, ad.effect, { kant: "speler", bron: hu, doel: hu });
  }
  g.ev = [];
  return g;
}

/* ───────── kaarten trekken ───────── */

function trekStil(g, n) {
  for (let k = 0; k < n && g.hand.length < MAXHAND; k++) {
    if (!g.trek.length) {
      if (!g.afleg.length) return;
      g.trek = schud(g, g.afleg); g.afleg = [];
      ev(g, { t: "schud" });
    }
    const i = g.trek.shift();
    g.hand.push(i);
    const d = kaartDef(i.id, i.verbeterd);
    if (d.bijTrekken && !g.bezigMetTrekken) {
      g.bezigMetTrekken = true;
      ev(g, { t: "waanzinTrek", kaart: i.id });
      voerUit(g, d.bijTrekken, { kant: "speler", bron: g.eenheden[g.held], doel: g.eenheden[g.held], kaart: i.id });
      g.bezigMetTrekken = false;
    }
  }
}

export function trek(g, n) {
  const voor = g.hand.length;
  trekStil(g, n);
  ev(g, { t: "trek", aantal: g.hand.length - voor });
}

/* ───────── Geest, Verlichting, Waanzin ───────── */

export function verlichtDrempel(g) {
  const h = B().helden[g.ctx.held];
  let d = h?.vermogen?.verlichtDrempel ?? 0.5;
  if (g.ctx.artefacten.includes("kristallen-schedel")) d = Math.max(d, 0.67);
  return d;
}

function geldVerlichting(g, stil) {
  const nu = g.geest <= Math.floor(g.maxGeest * verlichtDrempel(g) + 1e-9);
  if (nu !== g.verlicht) { g.verlicht = nu; if (!stil) ev(g, { t: "verlicht", aan: nu }); }
}

export function veranderGeest(g, n) {
  if (!n) return;
  g.geest = Math.min(g.maxGeest, g.geest + n);
  ev(g, { t: "geest", verschil: n, waarde: Math.max(0, g.geest) });
  if (g.geest <= 0) {
    const pool = B().data.waanzin.map(w => w.id);
    const id = kies(g, pool);
    const inst = { uid: `w${g.beurt}-${g.nieuweWaanzin.length}-${id}`, id };
    g.nieuweWaanzin.push(inst);
    g.afleg.push(inst);
    g.geest = Math.ceil(g.maxGeest / 2);
    ev(g, { t: "waanzin", kaart: id, waarde: g.geest });
  }
  geldVerlichting(g);
}

export function veranderLichaam(g, n) {
  const h = g.eenheden[g.held];
  if (n > 0) genees(g, h, n);
  else if (n < 0) directeSchade(g, h, -n);
}

/* ───────── statussen, tellers, genezen ───────── */

export function geefStatus(g, u, status, n) {
  if (!levend(u) || !n) return;
  if (!(status in STATUSSEN)) throw new Error(`Onbekende status: ${status}`);
  u.statussen[status] = Math.max(0, (u.statussen[status] || 0) + n);
  ev(g, { t: "status", uid: u.uid, status, aantal: n, e: snap(u) });
}

export function veranderTeller(g, u, n) {
  if (!levend(u) || u.teller == null || !n) return;
  u.teller = Math.max(0, u.teller + n);
  ev(g, { t: "teller", uid: u.uid, aantal: n, e: snap(u) });
  if (u.teller === 0 && !u.statussen.mist) { toeslaan(g, u); if (levend(u)) u.teller = u.maxTeller; }
}

export function genees(g, u, n) {
  if (!levend(u) || u.leven == null || n <= 0) return;
  const voor = u.leven;
  u.leven = Math.min(u.maxLeven, u.leven + n);
  if (u.leven > voor) ev(g, { t: "genees", uid: u.uid, aantal: u.leven - voor, e: snap(u) });
}

/* ───────── aanvallen en treffers ───────── */

/** Het doel van een aanval van `u`: de voorste tegenstander in de eigen rij, anders in de andere rij. */
export function aanvalsDoelen(g, u, tegenKant) {
  const ander = tegenKant || andereKant(u.kant);
  const rij = rijVan(g, u);
  const rijen = [rij, rij === "straat" ? "riool" : "straat"];
  const k = u.kenmerken || [];
  if (k.includes("scherpschutter")) {
    const l = eenhedenVan(g, ander);
    if (!l.length) return [];
    return [l.reduce((a, b) => ((b.leven ?? b.schroot) < (a.leven ?? a.schroot) ? b : a))];
  }
  for (const r of rijen) {
    const plekken = k.includes("achterhoede") ? [2, 1, 0] : [0, 1, 2];
    for (const p of plekken) {
      const doel = eenheidOp(g, ander, r, p);
      if (levend(doel) && doel.uid !== u.uid) {
        if (k.includes("salvo")) return eenhedenVan(g, ander).filter(x => rijVan(g, x) === r || x.groot);
        return [omleiden(g, doel)];
      }
    }
  }
  return [];
}

function omleiden(g, doel) {
  return doel;
}

export function toeslaan(g, u) {
  if (!levend(u) || g.uitslag) return;
  ev(g, { t: "toeslaan", uid: u.uid });
  const d = defVan(g, u);
  let doelen = [];
  if (u.aanval != null) {
    if (u.statussen.bekoring > 0) {
      // Bekoring: de aanval treft de eigen kant
      doelen = aanvalsDoelen(g, u, u.kant).filter(x => x.uid !== u.uid).slice(0, 1);
      u.statussen.bekoring = 0;
    } else doelen = aanvalsDoelen(g, u);
    if (u.uid === g.held && B().helden[g.ctx.held]?.vermogen?.handoplegging) { /* komt met Charisma */ }
    const basis = Math.max(0, u.aanval + (u.statussen.woede || 0) - (u.statussen.angst || 0));
    const hvm = B().helden[g.ctx.held]?.vermogen || {};
    for (const doel of doelen) {
      let s = basis;
      if (u.kant === "speler" && doel.mens && hvm.extraMens && (u.uid === g.held || hvm.extraMensIedereen)) s += hvm.extraMens;
      treffer(g, u, doel, s, u.gruwel || 0, { aanval: true });
      if (g.uitslag) return;
    }
    if (doelen.length) {
      u.statussen.woede = 0;
      if (u.statussen.angst > 0) u.statussen.angst -= 1;
    }
  }
  if (u.statussen.inkt > 0 || g.uitslag) return;
  const vermogen = (g.verlicht && u.kant === "speler" && d.bijToeslaanVerlicht) || d.bijToeslaan;
  if (vermogen && levend(u)) voerUit(g, vermogen, { kant: u.kant, bron: u, doel: doelen[0] || null });
}

/** Schade die geen treffer is (Pest, Doorns, een prijs in Lichaam). */
export function directeSchade(g, u, n, bron) {
  if (!levend(u) || n <= 0) return;
  if (u.schroot != null) { u.schroot -= 1; }
  else {
    const b = Math.min(u.statussen.bescherming || 0, n);
    u.statussen.bescherming -= b; n -= b;
    u.leven -= n;
    if (u.kant === "speler") g.stats.schadeOntvangen += n; else g.stats.schadeGedaan += n;
  }
  ev(g, { t: "schade", uid: u.uid, aantal: n, e: snap(u) });
  controleerDood(g, u, bron);
}

export function treffer(g, bron, doel, schade, gruwel = 0, opt = {}) {
  if (!levend(doel) || g.uitslag) return;
  if (doel.statussen.gezegend > 0) {
    doel.statussen.gezegend -= 1;
    ev(g, { t: "blok", uid: doel.uid, e: snap(doel) });
    return;
  }
  if (doel.statussen.vervloekt > 0) { schade *= 2; doel.statussen.vervloekt = 0; }
  if (doel.kant === "speler" && schade > 0 && B().helden[g.ctx.held]?.vermogen?.bredeSchouders) {
    const h = g.eenheden[g.held];
    if (levend(h) && rijVan(g, h) === rijVan(g, doel)) schade = Math.max(0, schade - 1);
  }
  let echt = 0;
  if (doel.schroot != null) { doel.schroot -= 1; echt = 1; }
  else {
    const b = Math.min(doel.statussen.bescherming || 0, schade);
    doel.statussen.bescherming -= b;
    echt = schade - b;
    doel.leven -= echt;
  }
  if (doel.kant === "speler") g.stats.schadeOntvangen += echt; else g.stats.schadeGedaan += echt;
  // Gruwel: op de held van de Geest af, op een bondgenoot als Angst. Vijanden hebben geen Geest.
  let gr = gruwel;
  if (gr > 0 && doel.kant === "speler" && B().helden[g.ctx.held]?.vermogen?.stalenZenuwen) gr -= 1;
  ev(g, { t: "treffer", uid: doel.uid, bron: bron?.uid, schade: echt, gruwel: doel.kant === "speler" ? Math.max(0, gr) : 0, e: snap(doel) });
  if (gr > 0 && doel.kant === "speler") {
    if (doel.uid === g.held) veranderGeest(g, -gr);
    else if (doel.soort === "bondgenoot") geefStatus(g, doel, "angst", gr);
  }
  // Doorns
  if (doel.statussen.doorns > 0 && levend(bron) && bron.kant !== doel.kant) directeSchade(g, bron, doel.statussen.doorns, doel);
  // reacties
  if (levend(doel)) reageer(g, doel, "geraakt", bron);
  for (const ander of eenhedenVan(g, doel.kant)) if (ander.uid !== doel.uid) reageer(g, ander, "bondgenoot-geraakt", bron, doel);
  controleerDood(g, doel, bron);
}

function reageer(g, u, bij, bron, wie) {
  if (!levend(u) || u.statussen.mist > 0 || u.statussen.inkt > 0 || g.uitslag) return;
  const d = defVan(g, u);
  const r = (g.verlicht && u.kant === "speler" && d.reactieVerlicht) || d.reactie;
  if (!r || r.bij !== bij) return;
  if (r.alleenRij && wie && rijVan(g, wie) !== rijVan(g, u)) return;
  g.reactieDiepte = (g.reactieDiepte || 0) + 1;
  if (g.reactieDiepte < 6) {
    ev(g, { t: "reactie", uid: u.uid });
    voerUit(g, r.effect, { kant: u.kant, bron: u, doel: r.doelIsBron ? (levend(bron) ? bron : null) : (wie || u) });
  }
  g.reactieDiepte -= 1;
}

function controleerDood(g, u, bron) {
  if (!u || u.dood) return;
  const op = u.schroot != null ? u.schroot <= 0 : u.leven <= 0;
  if (!op) return;
  // held
  if (u.uid === g.held) {
    if (g.ctx.scarabee) {
      g.ctx.scarabee = false; g.scarabeeGebruikt = true;
      u.leven = Math.min(u.maxLeven, 10);
      ev(g, { t: "redding", uid: u.uid, e: snap(u) });
      return;
    }
    u.dood = true; u.leven = 0;
    ev(g, { t: "dood", uid: u.uid });
    g.uitslag = "verloren";
    ev(g, { t: "verloren" });
    return;
  }
  // een baas met meer fasen
  if (u.fasen && u.fase < u.fasen - 1) { volgendeFase(g, u); return; }
  const d = defVan(g, u);
  // komt terug (Verdronkene)
  if (d.komtTerug && !u.teruggekomen) {
    u.teruggekomen = true;
    u.leven = Math.ceil(u.maxLeven / 2);
    for (const s in u.statussen) u.statussen[s] = 0;
    ev(g, { t: "komtTerug", uid: u.uid, e: snap(u) });
    return;
  }
  u.dood = true;
  haalWeg(g, u);
  ev(g, { t: "dood", uid: u.uid });
  if (d.bijVallen && !g.uitslag) voerUit(g, d.bijVallen, { kant: u.kant, bron: u, doel: u });
  if (u.kant === "vijand") {
    g.stats.doden += 1;
    if (d.buit) g.buit += d.buit;
    // Trofee: de doder krijgt +1 aanval voor de rest van het gevecht
    if (levend(bron) && bron.kant === "speler" && (bron.kenmerken || []).includes("trofee") && bron.aanval != null) {
      bron.aanval += 1; bron.trofeeen += 1;
      ev(g, { t: "trofee", uid: bron.uid, e: snap(bron) });
    }
    if (bron && bron.uid === g.held && B().helden[g.ctx.held]?.vermogen?.doorvechter && g.doorvechterBeurt !== g.beurt && levend(bron)) {
      g.doorvechterBeurt = g.beurt;
      ev(g, { t: "vermogen", naam: "Doorvechter" });
      toeslaan(g, bron);
    }
    if (u.baas) { g.uitslag = "gewonnen"; ev(g, { t: "gewonnen", baas: true }); return; }
  } else {
    // bondgenoot of barricade valt
    const inst = g.opVeld?.[u.uid];
    if (inst) g.gevallen.push({ ...inst, soort: u.soort });
    if (g.ctx.artefacten.includes("banshee-kam") && u.soort === "bondgenoot") geefStatus(g, g.eenheden[g.held], "woede", 3);
  }
}

function volgendeFase(g, u) {
  u.fase += 1;
  const d = defVan(g, u);
  u.leven = u.maxLeven = Math.round(d.leven * ((g.ctx.aktes?.[g.ctx.akte - 1] ?? 1) * (g.ctx.standDef.vijandLeven ?? 1)));
  if (d.aanval != null) u.aanval = d.aanval + (g.ctx.standDef.vijandAanval ?? 0) + (g.ctx.akte >= 3 ? 1 : 0);
  u.gruwel = d.gruwel ?? u.gruwel;
  u.teller = u.maxTeller = d.teller ?? u.maxTeller;
  u.kenmerken = [...(d.kenmerken || [])];
  for (const s in u.statussen) u.statussen[s] = 0;
  ev(g, { t: "fase", uid: u.uid, naam: d.faseNaam, tekst: d.faseTekst, e: snap(u) });
  if (d.bijFase) voerUit(g, d.bijFase, { kant: u.kant, bron: u, doel: u });
}

/* ───────── golven ───────── */

export function roepOp(g, id, kant, voorkeurRij, opties = {}) {
  const def = kaartDef(id);
  const vakken = legeVakken(g, kant, def.rij || voorkeurRij);
  if (def.groot) {
    // een grote kaart neemt het voorste vak in beide rijen; wie daar staat, schuift naar achteren
    for (const r of RIJEN) {
      const u = eenheidOp(g, kant, r, 0);
      if (u) {
        haalWeg(g, u);
        const vrij = [1, 2].find(p => !g.veld[kant][r][p]);
        if (vrij != null) legNeer(g, u, kant, r, vrij); else { u.dood = true; ev(g, { t: "dood", uid: u.uid, gevlucht: true }); }
      }
    }
    const u = maakEenheid(g, def, kant, opties);
    g.eenheden[u.uid] = u;
    legNeer(g, u, kant, "straat", 0);
    ev(g, { t: "oproep", uid: u.uid, e: snap(u) });
    return u;
  }
  if (!vakken.length) { if (kant === "vijand") g.wachtrij.push({ id }); return null; }
  const vak = vakken[0];
  const u = maakEenheid(g, def, kant, opties);
  if (kant === "vijand") godsregelBinnenkomst(g, u, vak);
  g.eenheden[u.uid] = u;
  legNeer(g, u, kant, vak.rij, vak.plek);
  ev(g, { t: "oproep", uid: u.uid, e: snap(u) });
  if (def.bijBinnenkomst) voerUit(g, def.bijBinnenkomst, { kant, bron: u, doel: u });
  return u;
}

function godsregelBinnenkomst(g, u, vak) {
  const regel = B().goden[g.ctx.god]?.spelregel || {};
  if (regel.rioolLeven && vak.rij === "riool" && u.leven != null) { u.leven += regel.rioolLeven; u.maxLeven += regel.rioolLeven; }
}

function komGolf(g, eerste) {
  if (g.golfNr >= g.golven.length) return;
  const golf = g.golven[g.golfNr];
  g.golfNr += 1;
  ev(g, { t: "golf", nr: g.golfNr, van: g.golven.length, eerste: !!eerste, baas: golf.some(x => B().vijanden[x.id]?.baas) });
  for (const x of golf) roepOp(g, x.id, "vijand", x.rij || "straat");
  g.bigben = g.bigbenMax;
  if (!eerste) {
    const regel = B().goden[g.ctx.god]?.spelregel || {};
    if (regel.golfMist) for (const u of eenhedenVan(g, "speler")) if (rijVan(g, u) === regel.golfMist) geefStatus(g, u, "mist", 1);
  }
}

function vulWachtrij(g) {
  while (g.wachtrij.length && legeVakken(g, "vijand").length) {
    const x = g.wachtrij.shift();
    roepOp(g, x.id, "vijand", "straat");
  }
}

/* ───────── wat mag er ───────── */

export function geestKosten(g, def) {
  if (def.soort !== "spreuk") return 0;
  let k = def.geest || 0;
  if (eenhedenVan(g, "vijand").some(u => defVan(g, u).spreukDuurder)) k += 1;
  if (g.ctx.held === "septimus-crane" && !g.stats.spreuken) k = 0;
  return k;
}

/** Welke doelen een kaart uit de hand kan hebben: vakken (voor kaarten op het veld) of eenheden. */
export function geldigeDoelen(g, inst) {
  const d = kaartDef(inst.id, inst.verbeterd);
  if (d.onspeelbaar) return { soort: "geen-spel", lijst: [] };
  if (d.soort === "bondgenoot" || d.soort === "barricade") {
    return { soort: "vak", lijst: legeVakken(g, "speler", "straat") };
  }
  const doel = d.doel || "geen";
  if (doel === "vijand") return { soort: "eenheid", lijst: eenhedenVan(g, "vijand").map(u => u.uid) };
  if (doel === "eigen") return { soort: "eenheid", lijst: eenhedenVan(g, "speler").map(u => u.uid) };
  if (doel === "bondgenoot") return { soort: "eenheid", lijst: eenhedenVan(g, "speler").filter(u => u.uid !== g.held).map(u => u.uid) };
  if (doel === "iedereen") return { soort: "eenheid", lijst: volgorde(g).map(u => u.uid) };
  return { soort: "veld", lijst: [] };
}

export function kanSpelen(g, inst) {
  const d = kaartDef(inst.id, inst.verbeterd);
  if (d.onspeelbaar) return false;
  const gd = geldigeDoelen(g, inst);
  if (gd.soort === "veld") return true;
  return gd.lijst.length > 0;
}

/** Alle mogelijke beurtacties (voor de testbot). Verplaatsen telt niet mee. */
export function alleActies(g) {
  const uit = [];
  if (g.uitslag) return uit;
  for (const inst of g.hand) {
    if (!kanSpelen(g, inst)) continue;
    const gd = geldigeDoelen(g, inst);
    if (gd.soort === "vak") for (const v of gd.lijst) uit.push({ soort: "speel", kaart: inst.uid, vak: v });
    else if (gd.soort === "eenheid") for (const u of gd.lijst) uit.push({ soort: "speel", kaart: inst.uid, doel: u });
    else uit.push({ soort: "speel", kaart: inst.uid });
  }
  uit.push({ soort: "fluitje" });
  for (const u of eenhedenVan(g, "speler")) if (u.soort === "bondgenoot") uit.push({ soort: "terugroepen", eenheid: u.uid });
  return uit;
}

export function fluitjeOpgeladen(g) {
  const nodig = g.ctx.klokken.includes("geen-tweede-worp") ? Infinity : (g.ctx.artefacten.includes("klokkenbel") ? 2 : FLUITJE_OPLADEN);
  return g.fluitjeRust >= nodig;
}

/* ───────── de beurtactie ───────── */

export function doe(oud, actie) {
  const g = JSON.parse(JSON.stringify(oud));
  g.ev = [];
  if (g.uitslag) return { g, ev: [] };
  let kostBeurt = true;
  switch (actie.soort) {
    case "speel": {
      const idx = g.hand.findIndex(i => i.uid === actie.kaart);
      if (idx < 0) throw new Error("Die kaart zit niet in je hand.");
      const inst = g.hand[idx];
      const d = kaartDef(inst.id, inst.verbeterd);
      if (d.onspeelbaar) throw new Error("Deze kaart kun je niet spelen.");
      g.hand.splice(idx, 1);
      g.stats.gespeeld += 1;
      ev(g, { t: "speel", kaart: inst.id, inst: inst.uid });
      const held = g.eenheden[g.held];
      if (d.soort === "bondgenoot" || d.soort === "barricade") {
        const { rij, plek } = actie.vak || {};
        if (!RIJEN.includes(rij) || plek < 0 || plek > 2 || g.veld.speler[rij][plek]) throw new Error("Dat vak is niet vrij.");
        const u = maakEenheid(g, { ...d, soort: d.soort, klasse: d.klasse }, "speler", { verbeterd: !!inst.verbeterd, gewond: !!inst.gewond });
        if (inst.gewond && u.leven != null) {
          u.maxLeven = Math.ceil(u.maxLeven / 2); u.leven = u.maxLeven;
          if (u.aanval) u.aanval = Math.floor(u.aanval / 2);
        }
        if (g.ctx.klasse === "kracht" && d.klasse === "kracht" && u.aanval != null && !u.kenmerken.includes("trofee")) u.kenmerken.push("trofee");
        g.eenheden[u.uid] = u;
        legNeer(g, u, "speler", rij, plek);
        (g.opVeld ??= {})[u.uid] = inst;
        ev(g, { t: "plaats", uid: u.uid, e: snap(u) });
        if (d.bijBinnenkomst) voerUit(g, d.bijBinnenkomst, { kant: "speler", bron: u, doel: u, kaart: inst.id });
      } else {
        let doel = null;
        if (actie.doel) {
          doel = g.eenheden[actie.doel];
          const gd = geldigeDoelen({ ...g, hand: [inst] }, inst);
          if (!levend(doel) || (gd.soort === "eenheid" && !gd.lijst.includes(doel.uid))) throw new Error("Dat is geen geldig doel.");
        }
        const kost = geestKosten(g, d);
        if (d.soort === "spreuk") g.stats.spreuken += 1;
        const effect = g.verlicht && d.effectVerlicht ? d.effectVerlicht : d.effect;
        if (kost) veranderGeest(g, -kost);
        voerUit(g, effect, { kant: "speler", bron: held, doel, kaart: inst.id });
        if (!inst.tijdelijk) {
          if (d.eenmalig) g.verbannen.push(inst); else g.afleg.push(inst);
        }
      }
      if (inst.zegel || d.gratis) kostBeurt = false;
      break;
    }
    case "verplaats": {
      const u = g.eenheden[actie.eenheid];
      if (!levend(u) || u.kant !== "speler" || u.groot) throw new Error("Die kaart kun je niet verplaatsen.");
      const { rij, plek } = actie.vak;
      const ander = eenheidOp(g, "speler", rij, plek);
      const oud = { ...u.vak };
      haalWeg(g, u);
      if (ander && ander.uid !== u.uid) { haalWeg(g, ander); legNeer(g, ander, "speler", oud.rij, oud.plek); }
      legNeer(g, u, "speler", rij, plek);
      ev(g, { t: "verplaats", uid: u.uid });
      return { g, ev: g.ev };
    }
    case "middeltje": {
      const id = g.zak[actie.index];
      if (!id) throw new Error("Geen middeltje op die plek.");
      const d = kaartDef(id);
      const doel = actie.doel ? g.eenheden[actie.doel] : g.eenheden[g.held];
      g.zak.splice(actie.index, 1);
      ev(g, { t: "middeltje", kaart: id });
      voerUit(g, d.effect, { kant: "speler", bron: g.eenheden[g.held], doel, kaart: id });
      return { g, ev: g.ev };
    }
    case "fluitje": {
      const opgeladen = fluitjeOpgeladen(g);
      ev(g, { t: "fluitje", opgeladen });
      const houd = g.hand.filter(i => i.tijdelijk);
      for (const i of g.hand) if (!i.tijdelijk) g.afleg.push(i);
      g.hand = houd;
      trek(g, HANDGROOTTE);
      g.fluitjeRust = 0;
      g.fluitjeGebruikt = true;
      if (opgeladen) kostBeurt = false;
      break;
    }
    case "terugroepen": {
      const u = g.eenheden[actie.eenheid];
      if (!levend(u) || u.kant !== "speler" || u.soort !== "bondgenoot") throw new Error("Alleen bondgenoten kun je terugroepen.");
      haalWeg(g, u);
      u.dood = true; u.teruggeroepen = true;
      const inst = g.opVeld?.[u.uid];
      if (inst) g.hand.push(inst);
      ev(g, { t: "terugroepen", uid: u.uid });
      break;
    }
    default: throw new Error(`Onbekende actie: ${actie.soort}`);
  }
  if (!g.uitslag && kostBeurt) eindeBeurt(g);
  else controleerEinde(g);
  return { g, ev: g.ev };
}

function controleerEinde(g) {
  if (g.uitslag) return;
  if (!eenhedenVan(g, "vijand").length && g.golfNr >= g.golven.length && !g.wachtrij.length) {
    g.uitslag = "gewonnen";
    ev(g, { t: "gewonnen" });
  }
}

/** Het eind van de beurt: tellers omlaag en toeslaan, Pest, statussen afbouwen, Big Ben, trekken. */
export function eindeBeurt(g) {
  if (!g.fluitjeGebruikt) g.fluitjeRust += 1;
  g.fluitjeGebruikt = false;
  ev(g, { t: "slagen" });
  for (const u of volgorde(g)) {
    if (g.uitslag) return;
    if (!levend(u) || u.teller == null) continue;
    if (u.statussen.mist > 0) { ev(g, { t: "stil", uid: u.uid }); continue; }
    u.teller -= 1;
    ev(g, { t: "tik", uid: u.uid, waarde: Math.max(0, u.teller) });
    if (u.teller <= 0) { toeslaan(g, u); if (levend(u)) u.teller = u.maxTeller; }
  }
  if (g.uitslag) return;
  // Pest en afbouw
  for (const u of volgorde(g)) {
    if (u.statussen.pest > 0) { const n = u.statussen.pest; u.statussen.pest -= 1; directeSchade(g, u, n); if (g.uitslag) return; }
  }
  for (const u of volgorde(g)) {
    let veranderd = false;
    for (const s of ["mist", "inkt"]) if (u.statussen[s] > 0) { u.statussen[s] -= 1; veranderd = true; }
    if (veranderd) ev(g, { t: "status", uid: u.uid, e: snap(u) });
  }
  // vermogen van Ashby: elke 3 beurten
  // Big Ben
  vulWachtrij(g);
  if (g.golfNr < g.golven.length) {
    if (!eenhedenVan(g, "vijand").length) komGolf(g);
    else {
      g.bigben -= 1;
      ev(g, { t: "bigben", waarde: g.bigben });
      if (g.bigben <= 0) komGolf(g);
    }
  }
  controleerEinde(g);
  if (g.uitslag) return;
  g.beurt += 1;
  ev(g, { t: "beurt", nr: g.beurt });
  trek(g, Math.max(0, HANDGROOTTE - g.hand.length));
}

/** Nummertjes van de volgorde van toeslaan, per uid. */
export function volgordeNummers(g) {
  const uit = {};
  volgorde(g).forEach((u, i) => { if (u.teller != null) uit[u.uid] = i + 1; });
  return uit;
}
