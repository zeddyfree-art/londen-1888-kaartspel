// Maakt data/helden.json uit bron/helden.json en bron/oude-wereld.json (de helden van Londen 1888).
// Lichaam = 3 × lichaam + 6, Geest = 2 × geest. Klasse en vermogen staan hieronder.
// Gebruik: node tools/maak-helden.js
import fs from "fs";
import path from "path";
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const lees = f => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const bron = [...lees("bron/helden.json"), ...lees("bron/oude-wereld.json").helden];
const persoonlijk = [...lees("bron/persoonlijk.json"), ...lees("bron/oude-wereld.json").persoonlijk];

// klasse, standaard vrij, vermogen (tekst + vlaggen voor de motor)
const H = {
  // Kennis
  "ambrose-pell": ["kennis", true, "Je ziet altijd welke vijanden in de volgende golf zitten. Eén keer per gevecht: zet een vijandelijke teller 1 hoger."],
  "septimus-crane": ["kennis", true, "De eerste spreuk in elk gevecht kost geen Geest."],
  "julian-hartwell": ["kennis", true, "+1 aanval voor elke spreuk die je dit gevecht speelde. Hij raakt al verlicht bij 60% Geest.", { verlichtDrempel: 0.6 }],
  "khalil-nasr": ["kennis", false, "Eén keer per gevecht: een bondgenoot krijgt voorgoed +1 aanval."],
  "hester-quayle": ["kennis", false, "Bij elke kaartbeloning één extra keuze.", { extraKeuze: 1 }],
  "bridie-kavanagh": ["kennis", false, "De eerste spreuk die je in een gevecht speelt, komt terug in je hand."],
  "pema-lhamo": ["kennis", false, "Kaartbeloningen komen uit alle vier de klassen."],
  // Waarneming
  "silas-rook": ["waarneming", true, "Begint elk gevecht met 1 Aanwijzing. Een Deductie kost 1 Aanwijzing minder."],
  "winnie-lusk": ["waarneming", true, "Als je een vijand ontmaskert, krijgt een bondgenoot teller −1."],
  "violet-thorne": ["waarneming", true, "Eén keer per gevecht: verplaats een vijand naar een ander vak."],
  "lottie-finch": ["waarneming", false, "Kan niet worden aangevallen zolang er een bondgenoot voor haar staat. +5 Ponden na elk gewonnen gevecht."],
  "teresa-canul": ["waarneming", false, "De eerste Ontmaskering in elk gevecht kost geen beurt."],
  "owen-marsh": ["waarneming", false, "Eén keer per akte: wissel op de kaart naar het andere pad."],
  "odile-fairweather": ["waarneming", false, "Eén keer per gevecht: annuleer de volgende vijandelijke aanval."],
  // Kracht
  "hu-yiping": ["kracht", true, "Je held en je bondgenoten doen +2 schade tegen menselijke vijanden.", { extraMens: 2, extraMensIedereen: true }],
  "tobias-hale": ["kracht", true, "Doodt hij een vijand, dan slaat hij meteen nog een keer toe (één keer per beurt).", { doorvechter: true }],
  "aggie-pruitt": ["kracht", true, "Aanvallen op bondgenoten in haar rij gaan naar haar. Ze heeft Doorns 2 en begint elk gevecht met 3 Bescherming.", { bredeSchouders: true, beginStatus: { bescherming: 3 } }, { doorns: 2 }],
  "arjan-singh": ["kracht", false, "Je held en je bondgenoten nemen 1 Gruwel minder van elke treffer.", { stalenZenuwen: true }],
  "ang-nima": ["kracht", false, "Begint elk gevecht met 2 Gezegend.", { beginStatus: { gezegend: 2 } }],
  "mahmoud-fathy": ["kracht", false, "Begint elk gevecht met de barricade Dragers in de hand. Kisten geven één extra keuze.", { extraKaart: "dragers", kistExtra: 1 }],
  "cornelius-bray": ["kracht", false, "Bij elk artefact kies je uit één extra.", { artefactExtra: 1 }],
  // Charisma
  "albert-gosling": ["charisma", true, "Eén keer per gevecht: laat een vijand (geen baas) verdwijnen. Hij komt terug in de volgende golf."],
  "cordelia-vane": ["charisma", true, "Alles in winkels kost 25% minder.", { korting: 0.25 }],
  "esme-valentine": ["charisma", true, "Een spreuk die een bondgenoot helpt, helpt ook de bondgenoot ernaast."],
  "clementine-ashby": ["charisma", false, "Elke 3 beurten: je held herstelt 1 Geest en elke bondgenoot 1 Leven."],
  "ezra-whitlock": ["charisma", false, "Na elk gevecht herstelt je held 3 Lichaam. Rusten herstelt extra.", { naGevechtLichaam: 3 }],
  "benedict-ashcombe": ["charisma", false, "De aanval van je held geneest een gewonde bondgenoot in plaats van een vijand te raken.", {}],
  "paddy-flynn": ["charisma", false, "Begint met een vaste hond als bondgenoot."],
};

const helden = bron.map(h => {
  const [klasse, vrij, tekst, vlaggen = {}, statussen] = H[h.id] || [];
  if (!klasse) throw new Error(`Geen klasse voor ${h.id}`);
  const k = h.kenmerken;
  return {
    id: h.id, naam: h.naam, klasse, vrij,
    speelbaar: klasse === "kracht",
    rol: h.rol, beroep: h.beroep, achtergrond: h.achtergrond,
    kenmerken: { kennis: k.kennis, waarneming: k.scherpte, kracht: k.kracht, charisma: k.overtuiging },
    lichaam: 3 * h.lichaam + 6, geest: 2 * h.geest,
    vermogen: { naam: h.vermogen.naam, tekst, ...vlaggen },
    ...(statussen ? { statussen } : {}),
    persoonlijk: persoonlijk.filter(p => p.held === h.id).map(p => p.id),
    art: `helden/${h.id}.jpg`,
  };
});
const volgorde = ["kennis", "waarneming", "kracht", "charisma"];
helden.sort((a, b) => volgorde.indexOf(a.klasse) - volgorde.indexOf(b.klasse));
fs.writeFileSync(path.join(root, "data/helden.json"), JSON.stringify(helden, null, 1) + "\n");
console.log(`${helden.length} helden: ` + volgorde.map(k => `${k} ${helden.filter(h => h.klasse === k).length}`).join(", "));
