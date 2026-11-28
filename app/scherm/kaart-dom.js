// Een kaart tekenen: CSS en SVG, de afbeelding bovenaan. Namen en getallen komen nooit uit een afbeelding.
import { el, bg, ICOON, STATUSICOON, art } from "./gemeen.js";
import { kaartDef, B, metTalisman } from "../motor/bibliotheek.js";
import { waanzinInStapel } from "../motor/gevecht.js";
import { kaartTekst, STATUSNAAM, kenmerkNaam } from "../motor/tekst.js";

const SOORTNAAM = { bondgenoot: "bondgenoot", barricade: "barricade", ritueel: "ritueel", spul: "spul", spreuk: "spreuk", middeltje: "middeltje", waanzin: "waanzin", vijand: "vijand", held: "held" };

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

// Statuslagen: elke status een eigen laag boven het portret, in een vaste volgorde (onder → boven),
// zodat ze elkaar niet bedekken. De sterkte (--n) groeit mee met het aantal stapels, tot 5.
export const LAAGVOLGORDE = ["woede", "pest", "doorns", "inkt", "vervloekt", "angst", "bekoring", "mist", "gezegend", "bescherming"];
export function statusLagen(statussen = {}) {
  return el("div", { class: "statuslagen", "aria-hidden": "true" },
    LAAGVOLGORDE.filter(s => statussen[s] > 0).map(s => el("div", { class: `laag ${s}`, style: { "--n": String(Math.min(5, statussen[s])) } },
      s === "pest" ? [el("i"), el("i"), el("i")] : s === "woede" ? [el("i"), el("i")] : s === "mist" ? [el("i"), el("i")] : null)));
}

/**
 * Een kaart uit de hand, de stapel of de winkel.
 * opties: { inst, geestKost, klein }
 */
/* De klasse waarmee nu gespeeld wordt. Kennis betaalt geen extra Geest voor verlichte teksten
   (klasseregel verlichtZonderPrijs, zie gevecht.js); de kaarten laten die prijs dan ook weg. */
let speelklasse = null;
export function zetSpeelklasse(klasse) { speelklasse = klasse || null; }
const verlichtGratis = () => !!(speelklasse && B().klassen[speelklasse]?.verlichtZonderPrijs);
/** De kaart zoals hij voor deze klasse werkt: bij Kennis zonder "Je verliest Geest" in de verlichte speeltekst. */
export function voorSpeler(def) {
  if (!def?.effectVerlicht || !verlichtGratis() || !def.effectVerlicht.some(e => e.doe === "geest" && e.aantal < 0)) return def;
  return { ...def, effectVerlicht: def.effectVerlicht.filter(e => !(e.doe === "geest" && e.aantal < 0)), verlichtPrijsVervalt: true };
}

export function kaartEl(id, opties = {}) {
  const inst = opties.inst || {};
  const def = voorSpeler(opties.def || metTalisman(kaartDef(id, inst.verbeterd), inst.talisman));
  const k = el("div", { class: `kaart ${randKlasse(def)} ${isOccult(def) ? "occult" : ""} ${inst.gewond ? "gewond" : ""}`, data: { id } });
  k.append(el("div", { class: "beeld", style: { backgroundImage: bg(def.art) } }));
  k.append(el("div", { class: "soortlabel" }, SOORTNAAM[def.soort] || def.soort));
  if (isOccult(def)) k.append(onweer());
  geestWerking(k, def);
  if (def.soort === "spreuk" || (def.soort === "ritueel" && def.geest)) {
    const kost = opties.geestKost ?? def.geest ?? 0;
    k.append(geestFiche("spreukkost", kost, `Kost ${kost} Geest`));
  }
  if (def.deductie) {
    const kost = opties.aanwijzingKost ?? def.deductie;
    k.append(el("span", { class: "aanwijzingfiche", title: `Deductie: kost ${kost} Aanwijzingen`, "aria-label": `Deductie: kost ${kost} Aanwijzingen` },
      el("i", { style: { backgroundImage: bg("fiches/aanwijzing.jpg") } }), el("b", {}, String(kost))));
  }
  if (def.overgelopen) k.append(el("div", { class: "gewondlabel overloper" }, "overgelopen"));
  if (def.statussen) k.append(chips(def.statussen));
  if (def.talisman) k.append(talismanTeken(def.talisman));
  if (inst.zegel) k.append(el("div", { class: "zegelteken", title: "Zegel: zit in je beginhand en kost geen beurt" }, "Z"));
  if (inst.gewond) k.append(el("div", { class: "gewondlabel" }, "gewond"));
  k.append(el("div", { class: "naam" }, def.naam.replace(/\+$/, ""), def.isVerbeterd ? el("span", { class: "verbeterd-teken" }, " +") : null));
  const t = kaartTekst(def, { verbergTrofee: true });
  const vak = el("div", { class: "tekstvak" });
  vak.append(el("div", { class: "gt" }, t.tekst.join(" ") || (def.sfeer ? el("i", {}, def.sfeer) : "")));
  if (t.verlicht.length) vak.append(el("div", { class: "vt" }, t.verlicht.join(" ")));
  k.append(vak);
  pasTekstIn(vak);
  let aanval = def.aanval, leven = def.leven;
  if (inst.gewond) { if (aanval) aanval = Math.floor(aanval / 2); if (leven) leven = Math.ceil(leven / 2); }
  if (aanval != null && def.soort !== "spul") k.append(stat("aanval", aanval));
  if (def.schroot != null) k.append(stat("schroot", def.schroot));
  else if (leven != null) k.append(stat("leven", leven));
  if (def.teller != null) k.append(stat("teller", def.teller));
  return k;
}

function talismanTeken(id) {
  const t = B().talismannen[id];
  return el("div", { class: "talisman-teken", title: `${t.naam}: ${t.tekst}`, style: { backgroundImage: bg(t.art) } });
}

/** Laat de kaarttekst passen: is hij te lang voor het tekstvak, dan wordt hij in kleine stappen kleiner (tot 70%). */
export function pasTekstIn(vak) {
  requestAnimationFrame(() => {
    if (!vak.isConnected || !vak.clientHeight) return;
    vak.style.fontSize = "";
    const basis = parseFloat(getComputedStyle(vak).fontSize);
    for (let f = 1; f >= 0.7 && vak.scrollHeight > vak.clientHeight + 1; f -= 0.05) vak.style.fontSize = `${(basis * f).toFixed(2)}px`;
  });
}

/** Een eenheid op het slagveld. */
export function eenheidEl(u, opties = {}) {
  const def = u.soort === "held" ? { ...B().helden[u.id], soort: "held" } : metTalisman(kaartDef(u.id, u.verbeterd), u.talisman);
  const k = el("div", {
    class: `kaart veld ${u.soort === "held" ? "held" : randKlasse(def)} ${isOccult(def) ? "occult" : ""} ${u.groot ? "groot" : ""} ${u.gewond ? "gewond" : ""} ${u.statussen.mist > 0 ? "mistig" : ""}`,
    data: { uid: u.uid },
  });
  k.append(el("div", { class: "beeld", style: { backgroundImage: bg(def.art || u.art) } }));
  k.append(statusLagen(u.statussen));
  if (u.talisman) k.append(talismanTeken(u.talisman));
  if (u.soort === "held" || (u.kant === "speler" && isOccult(def))) k.append(onweer());
  if (u.soort === "held" && opties.g) {
    const { geest, maxGeest } = opties.g;
    k.append(geestFiche("heldgeest", `${geest}/${maxGeest}`, `Geest ${geest} van ${maxGeest}`));
  }
  k.append(el("div", { class: "naam" }, u.naam.replace(/\+$/, "")));
  if (u.ontmaskerd) k.append(el("div", { class: "ontmaskerd-label", title: "Ontmaskerd: neemt extra schade van elke treffer" }, "ontmaskerd"));
  if (u.overgelopen) k.append(el("div", { class: "ontmaskerd-label overloper", title: "Overgelopen naar jouw kant" }, "overgelopen"));
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
  for (const sel of [".stat.aanval", ".stat.leven", ".stat.schroot", ".stat.teller", ".statussen", ".statuslagen"]) {
    const oud = k.querySelector(sel), n = nieuw.querySelector(sel);
    if (oud && n) oud.replaceWith(n); else if (oud) oud.remove(); else if (n) k.append(n);
  }
  k.classList.toggle("mistig", u.statussen.mist > 0);
  k.classList.toggle("angstig", u.statussen.angst > 0);
}

/** Een uitleg voor de lange-druk- en muisweergave. */
export function uitlegEl(def, eenheid, opties = {}) {
  def = voorSpeler(def);
  const t = kaartTekst(def);
  const kinderen = [el("h3", {}, def.naam)];
  if (def.soort === "held") kinderen.push(el("p", {}, el("b", {}, def.vermogen.naam + ": "), def.vermogen.tekst));
  if (def.soort === "held" && opties.g) {
    kinderen.push(el("p", { class: "geestuitleg" }, `Geest ${opties.g.geest}/${opties.g.maxGeest} · Verlicht bij ${opties.grens} of lager.`));
  }
  for (const r of t.tekst) kinderen.push(el("p", {}, r));
  if (t.verlicht.length) kinderen.push(el("p", { class: "vl" }, el("b", {}, opties.g?.verlicht ? "Verlichting actief: " : "Verlicht: "), t.verlicht.join(" ")));
  if (def.verlichtPrijsVervalt) kinderen.push(el("p", { class: "muted" }, "Als occultist betaal je geen extra Geest voor de verlichte tekst."));
  if (opties.g && JSON.stringify(def).includes('"perWaanzin"')) {
    const n = waanzinInStapel(opties.g);
    kinderen.push(el("p", { class: "vl" }, el("b", {}, "Waanzin in je stapel: "), n ? `${n}, dus +${n}.` : "geen, dus nog niets extra."));
  }
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
  if (eenheid?.aanval != null || eenheid?.leven != null) {
    const delen = [];
    if (eenheid.aanval != null) delen.push(`Aanval ${Math.max(0, eenheid.aanval + (eenheid.statussen?.woede || 0) - (eenheid.statussen?.angst || 0))} (het sterretje): zoveel schade doet een treffer.`);
    if (eenheid.schroot != null) delen.push(`Schroot ${eenheid.schroot}: elke treffer kost 1.`);
    else if (eenheid.leven != null) delen.push(`Leven ${eenheid.leven} van ${eenheid.maxLeven} (het hart).`);
    kinderen.push(el("p", { class: "muted" }, delen.join(" ")));
  }
  if (eenheid?.teller != null) kinderen.push(el("p", { class: "muted" }, `Slaat toe over ${eenheid.teller} ${eenheid.teller === 1 ? "slag" : "slagen"}${eenheid.statussen.mist ? " (staat stil door Mist)" : ""}.`));
  if (eenheid?.gruwel) kinderen.push(el("p", { class: "muted" }, `Doet ${eenheid.gruwel} Gruwel per treffer.`));
  if (eenheid?.ontmaskerd) kinderen.push(el("p", {}, el("b", {}, "Ontmaskerd: "), "neemt extra schade van elke treffer."));
  if (def.deductie) kinderen.push(el("p", { class: "muted" }, `Deductie: kost ${opties.aanwijzingKost ?? def.deductie} Aanwijzingen. Waarneming krijgt Aanwijzingen van kaarten en telkens als de held toeslaat.`));
  if (eenheid?.mens || def.mens) kinderen.push(el("p", { class: "muted" }, "Een mens, geen monster."));
  if (def.baas) kinderen.push(el("p", { class: "muted" }, "Baas: versla hem en de rest slaat op de vlucht."));
  if (def.talisman) { const t = B().talismannen[def.talisman]; kinderen.push(el("p", {}, el("b", {}, `Talisman, ${t.naam}: `), t.tekst)); }
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
