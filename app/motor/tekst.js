// Kaarttekst, gegenereerd uit de effecten. Zo lopen tekst en werking nooit uit elkaar.
import { B, kaartDef } from "./bibliotheek.js";

const S = {
  mist: "Mist", pest: "Pest", doorns: "Doorns", gezegend: "Gezegend", bescherming: "Bescherming", vervloekt: "Vervloekt",
  inkt: "Inkt", bekoring: "Bekoring", angst: "Angst", woede: "Woede",
};

const WIE = {
  doel: "het doel", held: "je held", zelf: "deze kaart", "eigen-rij": "elke kaart in die rij", "alle-eigen": "al je kaarten",
  "alle-bondgenoten": "al je bondgenoten", "vijand-rij": "elke vijand in die rij", "alle-vijanden": "elke vijand",
  "willekeurige-vijand": "een willekeurige vijand", "voorste-vijand": "de voorste vijand", buren: "de kaarten ernaast", achter: "de vijand erachter",
  "zwakste-bondgenoot": "je zwakste gewonde bondgenoot", "alle-ontmaskerd": "elke ontmaskerde vijand",
};
// vanuit een vijand gezien
const WIE_VIJAND = { ...WIE, "alle-eigen": "alle vijanden", "alle-vijanden": "al jouw kaarten", "eigen-rij": "elke vijand in die rij", doel: "het doel" };

const hoofd = s => s.charAt(0).toUpperCase() + s.slice(1);
const klein = s => (s.startsWith("Big Ben") ? s : s.charAt(0).toLowerCase() + s.slice(1));

function zin(e, vijand) {
  const w = (vijand ? WIE_VIJAND : WIE)[e.op || "doel"] || "het doel";
  const n = e.aantal ?? 0;
  const keer = e.keer > 1 ? `, ${e.keer} keer` : "";
  switch (e.doe) {
    case "schade": {
      let t = (e.op || "doel") === "doel" ? `Doe ${n} schade${keer}` : `Doe ${n} schade aan ${w}${keer}`;
      if (e.gruwel) t += ` en ${e.gruwel} Gruwel`;
      if (e.extraMens) t += ` (+${e.extraMens} tegen mensen)`;
      if (e.extraMonster) t += ` (+${e.extraMonster} tegen monsters)`;
      if (e.extraOntmaskerd) t += ` (+${e.extraOntmaskerd} tegen een ontmaskerde vijand)`;
      if (e.perAanwijzing) t += `, plus ${e.perAanwijzing} per Aanwijzing die je hebt`;
      if (e.perWaanzin) t += `, plus ${e.perWaanzin} per Waanzin-kaart in je stapel`;
      return t + ".";
    }
    case "gruwel": return `Doe ${n} Gruwel aan ${w}.`;
    case "status": return `${hoofd(w)} ${w.startsWith("al") ? "krijgen" : "krijgt"} ${n} ${S[e.status]}${e.perWaanzin ? `, plus ${e.perWaanzin} per Waanzin-kaart in je stapel` : ""}.`;
    case "teller": return n < 0 ? `Zet de teller van ${w} ${-n} lager.` : `Zet de teller van ${w} ${n} hoger.`;
    case "genees": return e.op === "held" ? `Je held herstelt ${n} Lichaam.` : `${hoofd(w)} ${w.startsWith("al") ? "herstellen" : "herstelt"} ${n} Leven.`;
    case "geest": return n < 0 ? `Je verliest ${-n} Geest.` : `Je held herstelt ${n} Geest.`;
    case "lichaam": return n < 0 ? `Je held verliest ${-n} Lichaam.` : `Je held herstelt ${n} Lichaam.`;
    case "trek": return n === 1 ? "Trek 1 kaart." : `Trek ${n} kaarten.`;
    case "ponden": return n < 0 ? `Betaal ${-n} Ponden.` : `Krijg ${n} Ponden.`;
    case "aanval": return `${hoofd(w)} krijgt +${n} aanval voor dit gevecht.`;
    case "oproepen": { const d = kaartDef(e.kaart); return e.keer > 1 ? `Roept ${e.keer} × ${d.naam} op.` : `Roept een ${d.naam} op.`; }
    case "verwijder": {
      const st = e.status === "negatief" ? "alle nadelige statussen" : [].concat(e.status).map(s => S[s]).join(" en ");
      return `Verwijder ${st} van ${w}.`;
    }
    case "bigben": return n > 0 ? `Big Ben slaat ${n} slag later.` : `Big Ben slaat ${-n} slag eerder.`;
    case "schroot": return `Herstel ${n} schroot van ${w}.`;
    case "aanwijzing": return `Krijg ${n} Aanwijzing${n > 1 ? "en" : ""}.`;
    case "overtuigen": return `Overtuig een menselijke vijand met ${n} Leven of minder: hij loopt over naar jouw kant${e.voorgoed ? " en blijft voorgoed in je stapel" : " voor dit gevecht"}.`;
    case "ontmasker": return `Ontmasker ${w}: ${w.startsWith("elke") ? "ze krijgen" : "hij krijgt"} 1 Vervloekt en neemt voortaan 1 schade extra van elke treffer.`;
    case "aanvalVoorgoed": return `${hoofd(w)} krijgt voorgoed +${n} aanval.`;
    case "verdwijn": return `${hoofd(w)} verdwijnt en komt terug met de volgende golf.`;
    case "naarAchter": return `Zet ${w} achteraan in zijn rij.`;
    case "voorgevoel": return "De volgende vijandelijke aanval gaat mis.";
    default: return "";
  }
}

export function beschrijf(effecten, vijand = false) {
  return (effecten || []).map(e => zin(e, vijand)).join(" ");
}

const KENMERK = {
  salvo: ["Salvo", "Raakt de hele rij."],
  scherpschutter: ["Scherpschutter", "Valt de zwakste vijand aan."],
  achterhoede: ["Achterhoede", "Valt de achterste vijand aan."],
  trofee: ["Trofee", "Doodt deze kaart een vijand, dan krijgt ze +1 aanval voor de rest van het gevecht."],
};
export const kenmerkNaam = k => KENMERK[k]?.[0] || k;
export const kenmerkUitleg = k => KENMERK[k]?.[1] || "";

const REACTIE = {
  geraakt: "Als deze kaart geraakt wordt",
  "bondgenoot-geraakt": "Als een kaart aan deze kant geraakt wordt",
};

/** De regels tekst van een kaart: { tekst, verlicht } als lijstjes zinnen. */
export function kaartTekst(def, opties = {}) {
  const vijand = def.soort === "vijand";
  const regels = [], verlicht = [];
  if (def.tekst) regels.push(def.tekst);
  if (def.onspeelbaar) regels.push("Onspeelbaar.");
  if (def.deductie) regels.push(`Deductie: kost ${def.deductie} Aanwijzingen.`);
  if (def.kenmerken?.length) regels.push(def.kenmerken.filter(k => k !== "trofee" || !opties.verbergTrofee).map(kenmerkNaam).join(", ") + ".");
  if (def.statussen) for (const [s, n] of Object.entries(def.statussen)) regels.push(`Begint met ${n} ${S[s]}.`);
  if (def.bijBinnenkomst) regels.push("Bij binnenkomst: " + klein(beschrijf(def.bijBinnenkomst, vijand)));
  if (def.bijToeslaan) regels.push((def.aanval != null ? "Bij toeslaan, ook: " : "Bij toeslaan: ") + klein(beschrijf(def.bijToeslaan, vijand)));
  if (def.reactie) regels.push(`! ${REACTIE[def.reactie.bij] || "Bij " + def.reactie.bij}${def.reactie.alleenRij ? " in zijn rij" : ""}: ` + klein(beschrijf(def.reactie.effect, vijand)));
  if (def.bijVallen) regels.push("Als hij valt: " + klein(beschrijf(def.bijVallen, vijand)));
  if (def.bijTrekken) regels.push("Als je deze trekt: " + klein(beschrijf(def.bijTrekken)));
  if (def.komtTerug) regels.push("Komt één keer terug met de helft van zijn Leven.");
  if (def.buit) regels.push(`Buit: ${def.buit} Ponden.`);
  if (def.spreukDuurder) regels.push("Zolang hij op het veld staat, kosten spreuken 1 Geest extra.");
  if (def.vermogen && typeof def.vermogen === "string") regels.push(def.vermogen);
  if (def.effect && !def.tekst) regels.push(beschrijf(def.effect));
  if (def.eenmalig) regels.push("Na gebruik verbannen voor dit gevecht.");
  if (def.verdwijntNaToeslaan) regels.push("Ritueel: slaat één keer toe en gaat dan naar de aflegstapel.");
  if (def.gratis) regels.push("Kost geen beurt.");
  if (def.effectVerlicht) verlicht.push(beschrijf(def.effectVerlicht));
  if (def.bijToeslaanVerlicht) verlicht.push("Bij toeslaan, ook: " + klein(beschrijf(def.bijToeslaanVerlicht)));
  return { tekst: regels, verlicht };
}

export function heldTekst(held) {
  return `${held.vermogen.naam}: ${held.vermogen.tekst}`;
}

export const STATUSNAAM = S;
