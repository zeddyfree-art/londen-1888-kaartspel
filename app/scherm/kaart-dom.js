// Een kaart tekenen: CSS en SVG, de afbeelding bovenaan. Namen en getallen komen nooit uit een afbeelding.
import { el, bg, ICOON, STATUSICOON, art } from "./gemeen.js";
import { kaartDef, B } from "../motor/bibliotheek.js";
import { kaartTekst, STATUSNAAM, kenmerkNaam } from "../motor/tekst.js";

const SOORTNAAM = { bondgenoot: "bondgenoot", barricade: "barricade", spul: "spul", spreuk: "spreuk", middeltje: "middeltje", waanzin: "waanzin", vijand: "vijand", held: "held" };

export function randKlasse(def) {
  if (def.soort === "held") return "held";
  if (def.soort === "vijand") return def.baas ? "baas" : "vijand";
  if (def.soort === "waanzin") return "waanzin";
  return def.klasse || "londen";
}

const isOccult = d => !!(d.effectVerlicht || d.bijToeslaanVerlicht || d.reactieVerlicht || d.occult);

function stat(soort, waarde, extra = "") {
  const svg = soort === "teller" ? (waarde <= 1 ? ICOON.tellerNul : ICOON.teller) : ICOON[soort];
  return el("div", { class: `stat ${soort} ${extra}`, html: svg }, String(waarde));
}

export function chips(statussen = {}, trofeeen = 0) {
  const c = el("div", { class: "statussen" });
  const lijst = Object.entries(statussen).filter(([, n]) => n > 0);
  if (trofeeen) lijst.push(["trofee", trofeeen]);
  for (const [s, n] of lijst) {
    const naam = s === "trofee" ? "Trofee" : STATUSNAAM[s];
    const label = `${naam} × ${n}`;
    c.append(el("span", { class: `chip ${s}`, title: label, "aria-label": label },
      el("i", { html: STATUSICOON[s] }), el("b", {}, String(n))));
  }
  if (lijst.length > 3) c.append(el("span", { class: "statusrest" }, `+${lijst.length - 3}`));
  return c;
}

function geestFiche(klasse, waarde, uitleg) {
  return el("span", { class: `geestfiche ${klasse}`, title: uitleg, "aria-label": uitleg },
    el("i", { html: ICOON.geest }), el("b", {}, String(waarde)));
}

// Eén fiche per aanleiding, zodat een trek- of toeslaaneffect geen speelprijs lijkt.
function geestWerking(k, def) {
  const groepen = [
    ["Bij spelen", def.effect, def.effectVerlicht], ["Bij toeslaan", def.bijToeslaan, def.bijToeslaanVerlicht],
    ["Bij trekken", def.bijTrekken],
  ];
  for (const [wanneer, normaal, verlicht] of groepen) {
    const waarde = lijst => (lijst || []).filter(e => e.doe === "geest").reduce((n, e) => n + e.aantal, 0);
    const toon = (n, klasse) => {
      if (!n) return;
      const getal = n > 0 ? `+${n}` : `−${-n}`;
      k.append(geestFiche("geestwerking " + klasse, getal, `${wanneer}: ${getal} Geest`));
    };
    toon(waarde(normaal), verlicht ? "bij-normaal" : "");
    if (verlicht) toon(waarde(verlicht), "bij-verlichting");
  }
}

function onweer() {
  return el("div", { class: "onweer", "aria-hidden": "true", html:
    '<svg viewBox="0 0 100 140" preserveAspectRatio="none"><path d="M76 -3 60 22 69 19 50 46 58 43 29 81 45 52 37 55 56 28 49 31Z"/><path d="m54 40 14-4 10-13-7 17-19 7zM45 57 30 60 20 74 27 57 49 51z"/></svg>' });
}

function sluiers(statussen) {
  const actief = Object.keys(STATUSICOON).filter(s => statussen[s] > 0 && s !== "trofee");
  return el("div", { class: "sluiers", "aria-hidden": "true" },
    actief.map((s, i) => el("i", { class: s, style: {
      "--hoek": `${(230 + i * 137.5) % 360}deg`,
      "--gloed": String(.42 / Math.sqrt(actief.length)),
    } })));
}

/**
 * Een kaart uit de hand, de stapel of de winkel.
 * opties: { inst, geestKost, klein }
 */
export function kaartEl(id, opties = {}) {
  const inst = opties.inst || {};
  const def = opties.def || kaartDef(id, inst.verbeterd);
  const k = el("div", { class: `kaart ${randKlasse(def)} ${isOccult(def) ? "occult" : ""} ${inst.gewond ? "gewond" : ""}`, data: { id } });
  k.append(el("div", { class: "beeld", style: { backgroundImage: bg(def.art) } }));
  k.append(el("div", { class: "soortlabel" }, SOORTNAAM[def.soort] || def.soort));
  if (isOccult(def)) k.append(onweer());
  geestWerking(k, def);
  if (def.soort === "spreuk") {
    const kost = opties.geestKost ?? def.geest ?? 0;
    k.append(geestFiche("spreukkost", kost, `Kost ${kost} Geest`));
  }
  if (def.statussen) k.append(chips(def.statussen));
  if (inst.zegel) k.append(el("div", { class: "zegelteken", title: "Zegel: zit in je beginhand en kost geen beurt" }, "Z"));
  if (inst.gewond) k.append(el("div", { class: "gewondlabel" }, "gewond"));
  k.append(el("div", { class: "naam" }, def.naam.replace(/\+$/, ""), def.isVerbeterd ? el("span", { class: "verbeterd-teken" }, " +") : null));
  const t = kaartTekst(def, { verbergTrofee: true });
  const vak = el("div", { class: "tekstvak" });
  vak.append(el("div", { class: "gt" }, t.tekst.join(" ") || (def.sfeer ? el("i", {}, def.sfeer) : "")));
  if (t.verlicht.length) vak.append(el("div", { class: "vt" }, t.verlicht.join(" ")));
  k.append(vak);
  let aanval = def.aanval, leven = def.leven;
  if (inst.gewond) { if (aanval) aanval = Math.floor(aanval / 2); if (leven) leven = Math.ceil(leven / 2); }
  if (aanval != null && def.soort !== "spul") k.append(stat("aanval", aanval));
  if (def.schroot != null) k.append(stat("schroot", def.schroot));
  else if (leven != null) k.append(stat("leven", leven));
  if (def.teller != null) k.append(stat("teller", def.teller));
  return k;
}

/** Een eenheid op het slagveld. */
export function eenheidEl(u, opties = {}) {
  const def = u.soort === "held" ? { ...B().helden[u.id], soort: "held" } : kaartDef(u.id, u.verbeterd);
  const k = el("div", {
    class: `kaart veld ${u.soort === "held" ? "held" : randKlasse(def)} ${isOccult(def) ? "occult" : ""} ${u.groot ? "groot" : ""} ${u.gewond ? "gewond" : ""} ${u.statussen.mist > 0 ? "mistig" : ""}`,
    data: { uid: u.uid },
  });
  k.append(el("div", { class: "beeld", style: { backgroundImage: bg(def.art || u.art) } }));
  k.append(sluiers(u.statussen));
  if (u.soort === "held" || (u.kant === "speler" && isOccult(def))) k.append(onweer());
  if (u.soort === "held" && opties.g) {
    const { geest, maxGeest } = opties.g;
    k.append(geestFiche("heldgeest", `${geest}/${maxGeest}`, `Geest ${geest} van ${maxGeest}`));
  }
  k.append(el("div", { class: "naam" }, u.naam.replace(/\+$/, "")));
  if (u.aanval != null) k.append(stat("aanval", Math.max(0, u.aanval + (u.statussen.woede || 0) - (u.statussen.angst || 0)), u.statussen.woede ? "plus" : ""));
  if (u.schroot != null) k.append(stat("schroot", Math.max(0, u.schroot)));
  else if (u.leven != null) k.append(stat("leven", Math.max(0, u.leven)));
  if (u.teller != null) {
    const s = stat("teller", u.teller, u.teller <= 1 && !u.statussen.mist ? "dreig nul" : "");
    k.append(s);
  }
  if (u.kant === "speler" && def.bijToeslaanVerlicht) geestWerking(k, def);
  k.append(chips(u.statussen, u.trofeeen));
  if (opties.mikpunt) k.append(el("div", { class: "mikpunt", html: ICOON.mik, title: "Wordt deze beurt aangevallen" }));
  return k;
}

/** Werk de getallen en statussen van een bestaand kaart-element bij (tijdens het afspelen). */
export function werkBij(k, u) {
  if (!k || !u) return;
  const nieuw = eenheidEl(u);
  for (const sel of [".stat.aanval", ".stat.leven", ".stat.schroot", ".stat.teller", ".statussen", ".sluiers"]) {
    const oud = k.querySelector(sel), n = nieuw.querySelector(sel);
    if (oud && n) oud.replaceWith(n); else if (oud) oud.remove(); else if (n) k.append(n);
  }
  k.classList.toggle("mistig", u.statussen.mist > 0);
}

/** Een uitleg voor de lange-druk- en muisweergave. */
export function uitlegEl(def, eenheid, opties = {}) {
  const t = kaartTekst(def);
  const kinderen = [el("h3", {}, def.naam)];
  if (def.soort === "held") kinderen.push(el("p", {}, el("b", {}, def.vermogen.naam + ": "), def.vermogen.tekst));
  if (def.soort === "held" && opties.g) {
    kinderen.push(el("p", { class: "geestuitleg" }, `Geest ${opties.g.geest}/${opties.g.maxGeest} · Verlicht bij ${opties.grens} of lager.`));
  }
  for (const r of t.tekst) kinderen.push(el("p", {}, r));
  if (t.verlicht.length) kinderen.push(el("p", { class: "vl" }, el("b", {}, opties.g?.verlicht ? "Verlichting actief: " : "Verlicht: "), t.verlicht.join(" ")));
  if (def.soort === "spreuk") kinderen.push(el("p", { class: "muted" }, `Kost ${opties.geestKost ?? def.geest ?? 0} Geest.`));
  const statussen = Object.entries(eenheid?.statussen || def.statussen || {}).filter(([, n]) => n > 0);
  const kenm = (eenheid?.kenmerken || def.kenmerken || []);
  if (eenheid?.trofeeen) kinderen.push(el("p", {}, `Trofee × ${eenheid.trofeeen}`));
  if (statussen.length || kenm.length) {
    const dl = el("dl");
    for (const k of kenm) dl.append(el("div", {}, el("dt", {}, kenmerkNaam(k) + ": "), el("dd", {}, (KENMERK_UITLEG[k] || ""))));
    for (const [s, n] of statussen) dl.append(el("div", {}, el("dt", {}, el("i", { class: `uitlegicoon ${s}`, html: STATUSICOON[s] }), `${STATUSNAAM[s]} ${n}: `), el("dd", {}, STATUS_UITLEG[s])));
    kinderen.push(dl);
  }
  if (eenheid?.teller != null) kinderen.push(el("p", { class: "muted" }, `Slaat toe over ${eenheid.teller} ${eenheid.teller === 1 ? "slag" : "slagen"}${eenheid.statussen.mist ? " (staat stil door Mist)" : ""}.`));
  if (eenheid?.gruwel) kinderen.push(el("p", { class: "muted" }, `Doet ${eenheid.gruwel} Gruwel per treffer.`));
  if (eenheid?.mens || def.mens) kinderen.push(el("p", { class: "muted" }, "Een mens, geen monster."));
  if (def.baas) kinderen.push(el("p", { class: "muted" }, "Baas: versla hem en de rest slaat op de vlucht."));
  if (def.sfeer) kinderen.push(el("p", { class: "sfeer" }, def.sfeer));
  return kinderen;
}

export const STATUS_UITLEG = {
  mist: "Teller en reacties staan stil. −1 per beurt.",
  pest: "Aan het eind van de beurt evenveel schade (geen treffer). −1 per keer.",
  doorns: "Wie deze kaart treft, krijgt evenveel schade.",
  gezegend: "Blokkeert de volgende treffer volledig.",
  bescherming: "Vangt schade op voordat het Leven daalt.",
  vervloekt: "De volgende treffer doet dubbele schade.",
  inkt: "Vermogens en reacties doen niets. −1 per beurt.",
  bekoring: "De volgende aanval treft de eigen kant.",
  angst: "−1 aanval per punt. −1 na elke eigen aanval.",
  woede: "+1 schade per punt bij de volgende aanval.",
};
const KENMERK_UITLEG = {
  salvo: "Raakt de hele rij.", scherpschutter: "Valt de zwakste vijand aan.", achterhoede: "Valt de achterste vijand aan.",
  trofee: "Doodt deze kaart een vijand, dan krijgt ze +1 aanval voor de rest van het gevecht.",
};

export function artefactEl(id) {
  const a = B().artefacten[id];
  return el("div", { class: "artefact-ik", style: { backgroundImage: bg(a.art) }, title: `${a.naam}: ${a.tekst}`, data: { artefact: id } });
}

export { art };
