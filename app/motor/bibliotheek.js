// De bibliotheek: alle kaarten, vijanden, helden, goden enzovoort, geladen uit data/*.json.
// Het scherm laadt de JSON met fetch, de testbot met fs; daarna roepen ze allebei zetBibliotheek aan.

export const DATABESTANDEN = [
  "klassen", "helden", "persoonlijk", "bondgenoten", "barricades", "rituelen", "spullen", "spreuken", "middeltjes", "waanzin",
  "vijanden", "bazen", "goden", "gevechten", "artefacten", "ontmoetingen", "standen", "bord", "talismannen",
];

let bib = null;

export function zetBibliotheek(data) {
  const kaarten = {};
  for (const soort of ["persoonlijk", "bondgenoten", "barricades", "rituelen", "spullen", "spreuken", "middeltjes", "waanzin"]) {
    for (const k of data[soort] || []) kaarten[k.id] = k;
  }
  // wie voorgoed overloopt, wordt een bondgenoot-kaart
  for (const v of data.vijanden || []) {
    if (!v.mens) continue;
    const { id, naam, art, leven, aanval, teller, kenmerken, bijToeslaan, statussen } = v;
    kaarten[`overgelopen-${id}`] = { id: `overgelopen-${id}`, naam, art, leven, aanval, teller, kenmerken, bijToeslaan, statussen,
      soort: "bondgenoot", klasse: "charisma", zeldzaamheid: "speciaal", overgelopen: true, mens: true, sfeer: "Hij liep over, en bleef." };
  }
  const perId = lijst => Object.fromEntries((lijst || []).map(x => [x.id, x]));
  bib = {
    data,
    kaarten,
    klassen: perId(data.klassen),
    helden: perId(data.helden),
    vijanden: { ...perId(data.vijanden), ...perId(data.bazen) },
    goden: perId(data.goden),
    gevechten: data.gevechten || {},
    artefacten: perId(data.artefacten),
    talismannen: perId(data.talismannen),
    ontmoetingen: data.ontmoetingen || [],
    standen: perId(data.standen),
  };
  return bib;
}

export function B() {
  if (!bib) throw new Error("De bibliotheek is nog niet geladen.");
  return bib;
}

/** De definitie van een kaart, met de verbeterde versie eroverheen als de kaart verbeterd is. */
export function kaartDef(id, verbeterd = false) {
  const k = B().kaarten[id] || B().vijanden[id];
  if (!k) throw new Error(`Onbekende kaart: ${id}`);
  if (!verbeterd || !k.verbeterd) return k;
  return { ...k, ...k.verbeterd, naam: k.naam + "+", verbeterd: undefined, isVerbeterd: true };
}

/** Past een talisman toe op een kaartdefinitie: { aanval, leven, teller, statussen, kenmerken, extraSchade, ... }. */
export function metTalisman(def, talismanId) {
  const t = talismanId && B().talismannen[talismanId];
  if (!t) return def;
  const w = t.wijzig || {};
  const d = { ...def, talisman: talismanId };
  if (w.aanval && d.aanval != null) d.aanval = Math.max(0, d.aanval + w.aanval);
  if (w.leven && d.leven != null) d.leven += w.leven;
  if (w.schroot && d.schroot != null) d.schroot += w.schroot;
  if (w.teller && d.teller != null) d.teller = Math.max(1, d.teller + w.teller);
  if (w.statussen) { d.statussen = { ...(d.statussen || {}) }; for (const [s, n] of Object.entries(w.statussen)) d.statussen[s] = (d.statussen[s] || 0) + n; }
  if (w.kenmerken) d.kenmerken = [...new Set([...(d.kenmerken || []), ...w.kenmerken])];
  if (w.bijToeslaanVerlicht && !d.bijToeslaanVerlicht) { d.bijToeslaanVerlicht = [...(d.bijToeslaan || []), ...w.bijToeslaanVerlicht]; d.occult = true; }
  if (w.bijVallen) d.bijVallen = [...(d.bijVallen || []), ...w.bijVallen];
  if (w.bijBinnenkomst) d.bijBinnenkomst = [...(d.bijBinnenkomst || []), ...w.bijBinnenkomst];
  if (w.geestMin && d.geest) d.geest = Math.max(0, d.geest - w.geestMin);
  const plus = lijst => lijst && lijst.map(e => (e.doe === "schade" ? { ...e, aantal: e.aantal + (w.extraSchade || 0) } : e)).concat(w.extraEffect || []);
  if ((w.extraSchade || w.extraEffect) && d.effect) { d.effect = plus(d.effect); if (d.effectVerlicht) d.effectVerlicht = plus(d.effectVerlicht); }
  return d;
}

/** De definitie van een kaart zoals ze in je stapel zit: verbeterd en met haar talisman. */
export function instDef(inst) {
  return metTalisman(kaartDef(inst.id, inst.verbeterd), inst.talisman);
}

/** Past de talisman op deze kaart? */
export function talismanPast(talismanId, inst) {
  const t = B().talismannen[talismanId], d = kaartDef(inst.id);
  if (!t || inst.talisman) return false;
  const veld = ["bondgenoot", "barricade", "ritueel"].includes(d.soort);
  if (t.voor === "veld") return veld && (t.wijzig?.aanval == null || d.aanval != null) && (t.wijzig?.teller == null || d.teller != null);
  if (t.voor === "bondgenoot") return d.soort === "bondgenoot";
  if (t.voor === "spel") return ["spul", "spreuk"].includes(d.soort) && (!t.wijzig?.extraSchade || (d.effect || []).some(e => e.doe === "schade"));
  if (t.voor === "spreuk") return d.soort === "spreuk";
  return d.soort !== "waanzin" && d.soort !== "middeltje";
}
