// De bibliotheek: alle kaarten, vijanden, helden, goden enzovoort, geladen uit data/*.json.
// Het scherm laadt de JSON met fetch, de testbot met fs; daarna roepen ze allebei zetBibliotheek aan.

export const DATABESTANDEN = [
  "klassen", "helden", "persoonlijk", "bondgenoten", "barricades", "rituelen", "spullen", "spreuken", "middeltjes", "waanzin",
  "vijanden", "bazen", "goden", "gevechten", "artefacten", "ontmoetingen", "standen", "bord",
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
