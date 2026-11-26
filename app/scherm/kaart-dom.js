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

const isOccult = d => !!(d.effectVerlicht || d.bijToeslaanVerlicht || d.occult);

function stat(soort, waarde, extra = "") {
  const svg = soort === "teller" ? (waarde <= 1 ? ICOON.tellerNul : ICOON.teller) : ICOON[soort];
  return el("div", { class: `stat ${soort} ${extra}`, html: svg }, String(waarde));
}

export function chips(statussen = {}, trofeeen = 0) {
  const c = el("div", { class: "statussen" });
  const lijst = Object.entries(statussen).filter(([, n]) => n > 0);
  if (trofeeen) lijst.push(["trofee", trofeeen]);
  for (const [s, n] of lijst) {
    const ic = STATUSICOON[s] || {};
    const i = el("i", ic.fiche ? { style: { backgroundImage: bg(ic.fiche) } } : { html: ic.svg || "" });
    c.append(el("span", { class: `chip ${s}`, title: s === "trofee" ? "Trofee" : STATUSNAAM[s] }, i, String(n)));
  }
  return c;
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
  if (def.soort === "spreuk") k.append(el("div", { class: "kosten", title: "Kost Geest" }, String(opties.geestKost ?? def.geest ?? 0)));
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
  k.append(el("div", { class: "beeld", style: { backgroundImage: bg(u.art || def.art) } }));
  k.append(el("div", { class: "naam" }, u.naam.replace(/\+$/, "")));
  if (u.aanval != null) k.append(stat("aanval", Math.max(0, u.aanval + (u.statussen.woede || 0) - (u.statussen.angst || 0)), u.statussen.woede ? "plus" : ""));
  if (u.schroot != null) k.append(stat("schroot", Math.max(0, u.schroot)));
  else if (u.leven != null) k.append(stat("leven", Math.max(0, u.leven)));
  if (u.teller != null) {
    const s = stat("teller", u.teller, u.teller <= 1 && !u.statussen.mist ? "dreig nul" : "");
    k.append(s);
  }
  k.append(chips(u.statussen, u.trofeeen));
  if (opties.mikpunt) k.append(el("div", { class: "mikpunt", html: ICOON.mik, title: "Wordt deze beurt aangevallen" }));
  return k;
}

/** Werk de getallen en statussen van een bestaand kaart-element bij (tijdens het afspelen). */
export function werkBij(k, u) {
  if (!k || !u) return;
  const nieuw = eenheidEl(u);
  for (const sel of [".stat.aanval", ".stat.leven", ".stat.schroot", ".stat.teller", ".statussen"]) {
    const oud = k.querySelector(sel), n = nieuw.querySelector(sel);
    if (oud && n) oud.replaceWith(n); else if (oud) oud.remove(); else if (n) k.append(n);
  }
  k.classList.toggle("mistig", u.statussen.mist > 0);
}

/** Een uitleg voor de lange-druk- en muisweergave. */
export function uitlegEl(def, eenheid) {
  const t = kaartTekst(def);
  const kinderen = [el("h3", {}, def.naam)];
  if (def.soort === "held") kinderen.push(el("p", {}, el("b", {}, def.vermogen.naam + ": "), def.vermogen.tekst));
  for (const r of t.tekst) kinderen.push(el("p", {}, r));
  if (t.verlicht.length) kinderen.push(el("p", { class: "vl" }, el("b", {}, "Verlicht: "), t.verlicht.join(" ")));
  if (def.soort === "spreuk") kinderen.push(el("p", { class: "muted" }, `Kost ${def.geest || 0} Geest.`));
  const statussen = eenheid ? Object.entries(eenheid.statussen).filter(([, n]) => n > 0) : [];
  const kenm = (eenheid?.kenmerken || def.kenmerken || []);
  if (statussen.length || kenm.length) {
    const dl = el("dl");
    for (const k of kenm) dl.append(el("div", {}, el("dt", {}, kenmerkNaam(k) + ": "), el("dd", {}, (KENMERK_UITLEG[k] || ""))));
    for (const [s, n] of statussen) dl.append(el("div", {}, el("dt", {}, `${STATUSNAAM[s]} ${n}: `), el("dd", {}, STATUS_UITLEG[s])));
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
