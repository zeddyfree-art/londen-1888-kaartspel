// Zet de 38 monsters van Londen 1888 om naar vijanden voor het kaartspel, en maakt data/goden.json.
//   Leven  = taaiheid − 4 + 2 × leven
//   Aanval = schade + 1
//   Gruwel = gruwel
//   Teller = 2 voor snelle monsters (beweging), 4 voor taaie (taaiheid 12), anders 3
// Daarna komen de eigenschappen per monster uit de tabel hieronder. Stel getallen bij met de hand en de testbot.
// Gebruik: node tools/zet-monsters-om.js
import fs from "fs";
import path from "path";
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const lees = f => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const monsters = lees("bron/monsters.json");

// Eigenschappen in het kaartspel. Alles hier gaat over de getallen van de omrekening heen.
const EIGEN = {
  rivierwiedde: { sfeer: "Sleept je de diepte in.", bijToeslaan: [{ doe: "status", status: "mist", aantal: 1 }] },
  verdronkene: { komtTerug: true, aanval: 2 },
  rioolkruiper: { rij: "riool", kenmerken: ["achterhoede"] },
  mistdwaler: { kenmerken: ["salvo"], aanval: 1 },
  logebroeder: { buit: 6, reactie: { bij: "bondgenoot-geraakt", effect: [{ doe: "status", status: "woede", aantal: 1, op: "zelf" }] } },
  lantaarndrager: { spreukDuurder: true },
  cultist: { teller: 2, leven: 5 },
  sterrenkind: {},
  pestdokter: { bijToeslaan: [{ doe: "status", status: "pest", aantal: 2 }] },
  kraaienzwerm: { kenmerken: ["salvo"], aanval: 1 },
  "zingend-koor": { bijToeslaan: [{ doe: "status", status: "woede", aantal: 1, op: "alle-eigen" }] },
  maskerdanser: { bijToeslaan: [{ doe: "status", status: "bekoring", aantal: 1 }] },
  bewonderaar: { bijToeslaan: [{ doe: "status", status: "bekoring", aantal: 1 }] },
  doornridder: { statussen: { doorns: 2 } },
  gerucht: { bijToeslaan: [{ doe: "status", status: "inkt", aantal: 1 }] },
  krantenjongen: { bijToeslaan: [{ doe: "status", status: "inkt", aantal: 1 }] },
  leugenaar: { buit: 6 },
  lijkenrover: { buit: 6 },
  reliekjager: { buit: 6 },
  bliksemvanger: { buit: 6 },
  goudworm: { buit: 10 },
  "shabti-wachter": { statussen: { bescherming: 3 } },
  vitrinewachter: { statussen: { bescherming: 3 } },
  opwindsoldaat: { statussen: { bescherming: 3 } },
  knekelman: { komtTerug: true },
  "betoverde-dichter": { bijToeslaan: [{ doe: "status", status: "vervloekt", aantal: 1 }] },
};

const vijanden = monsters.map(m => {
  const snel = !!m.beweging;
  const v = {
    id: m.id, naam: m.naam, soort: "vijand",
    leven: m.taaiheid - 4 + 2 * m.leven,
    aanval: m.schade + 1,
    gruwel: m.gruwel,
    teller: snel ? 2 : m.taaiheid >= 12 ? 4 : 3,
    ...(m.mens ? { mens: true } : {}),
    art: `monsters/${m.id}.jpg`,
    bron: m.eigenschap,
  };
  return { ...v, ...(EIGEN[m.id] || {}) };
});
fs.writeFileSync(path.join(root, "data/vijanden.json"), JSON.stringify(vijanden, null, 1) + "\n");

// Goden: naam en verhaal uit Londen 1888, de spelregel van het kaartspel hieronder.
const REGEL = {
  vathrun: {
    tekst: "De mist kruipt over de kades: telkens als Big Ben slaat, krijgen al je kaarten in de Straat 1 Mist. Vijanden in het Riool hebben +2 Leven.",
    golfMist: "straat", rioolLeven: 2,
  },
};
const BAZEN = {
  vathrun: { luitenant: "moeder-brine", episch: "bisschop-van-het-slib", eindbaas: "vathrun" },
};
const goden = lees("bron/oude-goden.json").map(g => {
  const extra = ["cultist", "lantaarndrager"];
  return {
    id: g.id, naam: g.naam, titel: g.titel, verhaal: g.verhaal,
    speelbaar: g.id in REGEL,
    regel: REGEL[g.id]?.tekst || null,
    spelregel: REGEL[g.id] ? Object.fromEntries(Object.entries(REGEL[g.id]).filter(([k]) => k !== "tekst")) : {},
    monsters: [...new Set([...g.monsters, ...(g.id === "vathrun" ? extra : [])])],
    ...(BAZEN[g.id] || { episch: g.episch }),
    art: `goden/${g.id}.jpg`, sfeer: `sfeer-${g.id}`,
  };
});
fs.writeFileSync(path.join(root, "data/goden.json"), JSON.stringify(goden, null, 1) + "\n");
console.log(`${vijanden.length} vijanden, ${goden.length} goden`);
for (const g of goden) console.log(`  ${g.naam}: ${g.monsters.length} monsters${g.monsters.length < 6 ? "  (te weinig, minstens 6)" : ""}`);
