// Het oefengevecht als een reeks korte lessen. Elke les is één gevecht met een vaste held,
// vaste vijanden en een paar kaarten die zeker in de beginhand zitten. De tips verschijnen
// zodra er iets voor het eerst gebeurt (een status, Verlichting, Waanzin, een Aanwijzing …).
import { kaartDef } from "../motor/bibliotheek.js";
import { eenhedenVan, verlichtDrempel } from "../motor/gevecht.js";

const heeftStatus = (g, s, kant) => Object.values(g.eenheden).some(u => u.leven > 0 && (!kant || u.kant === kant) && (u.statussen?.[s] || 0) > 0);
const inHand = (g, id) => g.hand.some(i => i.id === id);
const vijanden = g => eenhedenVan(g, "vijand");
const waanzinGehad = g => (g.nieuweWaanzin?.length || 0) > 0;

export const LESSEN = [
  {
    id: "basis", naam: "1. De basis", kort: "Kaarten spelen, tellers, golven en het politiefluitje.",
    klasse: "kracht", held: "tobias-hale", plek: "wapping",
    gevecht: { naam: "Oefening op de kade", bigben: 5, golven: [["cultist"], ["cultist", { id: "logebroeder", rij: "riool" }]] },
    tips: [
      { als: g => g.beurt === 1, tekst: "<b>Welkom.</b> Sleep een <b>bondgenoot</b> of <b>barricade</b> uit je hand naar een leeg vak aan jouw kant (links). Kaarten zijn gratis, maar je doet <b>één ding per beurt</b>." },
      { als: g => g.beurt >= 2, tekst: "Elke kaart op het veld heeft een <b>teller</b> (het klokje rechtsboven). Na je beurt gaat hij 1 omlaag; op 0 slaat de kaart toe. De nummertjes tonen de <b>volgorde</b>." },
      { als: g => g.beurt >= 3, tekst: "Een <b>rood vizier</b> toont wie deze beurt wordt aangevallen. Sleep een <b>spul</b> naar een vijand om hem te raken, of zet iemand voor je held." },
      { als: g => g.beurt >= 4, tekst: "<b>Big Ben</b> (bovenaan) telt af naar de volgende <b>golf</b>. Versla alle golven om te winnen." },
      { als: g => g.beurt >= 5, tekst: "Slechte hand? Blaas op het <b>politiefluitje</b> voor een nieuwe hand. Na 4 beurten zonder fluiten kost het geen beurt." },
      { als: g => g.beurt >= 6, tekst: "Je eigen kaarten <b>verplaatsen</b> is gratis: sleep ze naar een ander vak. Een gewonde bondgenoot kun je <b>terugroepen</b> naar je hand; dan geneest hij helemaal." },
    ],
    klaar: "Je kent nu de basis. Probeer daarna de les over statussen.",
  },
  {
    id: "statussen", naam: "2. Statussen", kort: "Pest, Mist, Woede, Gezegend, Bescherming en Doorns.",
    klasse: "kracht", held: "aggie-pruitt", plek: "whitechapel", inHand: ["wijwater"],
    gevecht: { naam: "Oefening in de pestsloppen", bigben: 6, golven: [["pestdokter"], ["rivierwiedde", { id: "zingend-koor", rij: "riool" }]] },
    tips: [
      { als: g => g.beurt === 1, tekst: "<b>Statussen</b> zie je op twee manieren: een <b>zegel met een getal</b> linksboven op de kaart, en een <b>geschilderde laag</b> over het portret. Aggie heeft al <b>Doorns 1</b>: de ranken langs haar kaart. Wie haar raakt, krijgt zelf schade terug." },
      { als: g => g.beurt >= 2 && inHand(g, "wijwater"), tekst: "Speel <b>Wijwater uit de abdij</b> op Aggie: ze krijgt <b>Gezegend</b> (goudlicht van boven) en <b>Bescherming</b> (een blauwe lichtrand)." },
      { als: g => heeftStatus(g, "gezegend"), tekst: "<b>Gezegend</b>: de volgende treffer op deze kaart wordt <b>helemaal tegengehouden</b>. Daarna is één stapel op." },
      { als: g => heeftStatus(g, "bescherming"), tekst: "<b>Bescherming</b> vangt schade op voordat het Leven daalt." },
      { als: g => heeftStatus(g, "pest"), tekst: "<b>Pest</b> (gifgroen slijm): aan het eind van de beurt neemt de kaart evenveel schade als de Pest, en daarna daalt de Pest met 1." },
      { als: g => heeftStatus(g, "mist"), tekst: "<b>Mist</b> (grijze slierten): de teller en de reacties van die kaart staan stil. De Mist trekt elke beurt 1 op." },
      { als: g => heeftStatus(g, "woede", "vijand"), tekst: "<b>Woede</b> (vuur van onderaf): +1 schade per stapel bij de volgende aanval. Het <b>Zingend koor</b> maakt alle vijanden woedend. Versla het snel." },
      { als: g => g.beurt >= 7, tekst: "Houd een kaart lang ingedrukt (of houd de muis erboven) voor de lijst van al zijn statussen en wat ze doen. Bij <b>Spelregels</b> staan ze allemaal." },
    ],
    klaar: "Je herkent nu de statussen aan hun lagen. Probeer daarna de les over Geest en Verlichting.",
  },
  {
    id: "verlichting", naam: "3. Geest, Verlichting en Waanzin", kort: "Gruwel, verlichte teksten, Waanzin-kaarten. Met de occultist.",
    klasse: "kennis", held: "ambrose-pell", plek: "bloomsbury",
    extraKaarten: ["fluistering-doden", "waanzin-stemmen"], inHand: ["waanzin-stemmen", "fluistering-doden", "etherische-projectie"],
    geestBoven: 1, // begint 1 Geest boven de drempel van Verlichting
    gevecht: { naam: "Oefening in de leeszaal", bigben: 6, golven: [["sterrenkind"], ["mistdwaler", { id: "sterrenkind", rij: "riool" }]] },
    tips: [
      { als: g => g.beurt === 1, tekst: "Je held heeft <b>Geest</b> (het paarse oog). <b>Gruwel</b> en <b>spreuken</b> kosten Geest; op de helft of lager word je <b>verlicht</b>. Ambrose zit er net boven en heeft al een <b>Waanzin-kaart</b> in zijn hand: tik twee keer op <b>De stemmen</b>. Dat kost 1 Geest, je trekt 2 kaarten, en je bent verlicht." },
      { als: g => g.beurt >= 2 && !g.verlicht, tekst: "Spreuken speel je als een spul: sleep <b>Etherische projectie</b> naar een vijand. Bij Kennis zet elke spreuk ook de teller van je held 1 lager." },
      { als: g => g.verlicht, tekst: "<b>Verlicht!</b> Je Geest is op de helft of lager. Kaarten met de paarse bliksem gebruiken nu hun <b>verlichte tekst</b>: vaak veel sterker. Voor de occultist kost dat geen extra Geest." },
      { als: g => g.verlicht && inHand(g, "fluistering-doden"), tekst: "<b>Fluistering van de doden</b> doet verlicht <b>4 schade, plus 1 per Waanzin-kaart</b> in je stapel. Tik erop: je ziet hoeveel Waanzin je nu hebt. Voor de occultist is Waanzin dus ook <b>brandstof</b>." },
      { als: g => g.geest <= 2 && !waanzinGehad(g), tekst: "Pas op: valt je Geest op <b>0</b>, dan krijg je een nieuwe <b>Waanzin-kaart</b> in je stapel. Je Geest herstelt dan tot de helft." },
      { als: waanzinGehad, tekst: "<b>Nieuwe Waanzin.</b> Hij zit nu in je stapel, ook na dit gevecht. De meeste Waanzin is lastig als je hem trekt; de <b>Kerk</b> op de kaart van Londen neemt hem weg. Of je houdt hem, voor je verlichte spreuken." },
    ],
    klaar: "Verlichting is kracht, Waanzin is de prijs. Hoeveel durf je te weten?",
  },
  {
    id: "waarneming", naam: "4. De speurder", kort: "Aanwijzingen, Ontmaskeren en Deducties.",
    klasse: "waarneming", held: "silas-rook", plek: "soho", inHand: ["vergrootglas-hoorn", "sluitend-bewijs"],
    gevecht: { naam: "Oefening in Soho", bigben: 6, golven: [["cultist", "lantaarndrager"], ["kuddeleider"]] },
    tips: [
      { als: g => g.beurt === 1, tekst: "De speurder verzamelt <b>Aanwijzingen</b>: de groene fiche rechtsboven, naast je Lichaam. Silas begint er met 1. Je held krijgt er ook 1 telkens als hij toeslaat." },
      { als: g => g.beurt >= 2 && inHand(g, "vergrootglas-hoorn") && !vijanden(g).some(u => u.ontmaskerd), tekst: "Sleep het <b>Vergrootglas met hoornen greep</b> naar een vijand om hem te <b>ontmaskeren</b>." },
      { als: g => vijanden(g).some(u => u.ontmaskerd), tekst: "<b>Ontmaskerd:</b> de vijand krijgt <b>Vervloekt</b> (violette runen): zijn volgende treffer doet dubbele schade. Bij de speurder neemt hij voortaan ook <b>2 schade extra</b> van elke treffer. Je held valt altijd de zwakste vijand aan." },
      { als: g => (g.aanwijzingen || 0) >= 2 && inHand(g, "sluitend-bewijs"), tekst: "<b>Het sluitende bewijs</b> is een <b>Deductie</b>: hij kost Aanwijzingen (bij Silas 1 minder) en doet 9 schade. Speel hem op de sterkste vijand." },
      { als: g => g.beurt >= 6, tekst: "Spaar Aanwijzingen voor Deducties, maar wacht niet te lang: een vijand die vrij kan toeslaan, kost je meer dan een Aanwijzing waard is." },
    ],
    klaar: "Zoek, ontmasker, bewijs. Probeer daarna de aanvoerder.",
  },
  {
    id: "charisma", naam: "5. De aanvoerder", kort: "Bondgenoten, Overtuigen en Bekoring.",
    klasse: "charisma", held: "cordelia-vane", plek: "mayfair", inHand: ["goed-woord", "betoverende-blik"],
    gevecht: { naam: "Oefening in Mayfair", bigben: 6, golven: [["lantaarndrager", "cultist"], ["lijkenrover", { id: "cultist", rij: "riool" }]] },
    tips: [
      { als: g => g.beurt === 1, tekst: "De aanvoerder vecht met <b>bondgenoten</b>: je mag er zes in je stapel hebben, de anderen vier. Zet ze vóór Cordelia, want haar eigen aanval is klein." },
      { als: g => g.beurt >= 2 && inHand(g, "betoverende-blik") && !heeftStatus(g, "bekoring"), tekst: "Sleep <b>Een betoverende blik</b> naar een vijand: hij krijgt <b>Bekoring</b> (roze gloed)." },
      { als: g => heeftStatus(g, "bekoring", "vijand"), tekst: "<b>Bekoring:</b> de volgende keer dat deze vijand toeslaat, raakt hij <b>zijn eigen kant</b>." },
      { als: g => inHand(g, "goed-woord") && vijanden(g).some(u => u.mens && u.leven <= 5), tekst: "Een <b>mens</b> met 5 Leven of minder kun je <b>overtuigen</b>. Sleep <b>Een goed woord</b> naar hem: hij loopt over naar jouw kant." },
      { als: g => eenhedenVan(g, "speler").some(u => u.overgelopen), tekst: "<b>Overgelopen!</b> Hij vecht dit gevecht voor jou. Met sommige kaarten blijft een overloper <b>voorgoed</b> in je stapel. Monsters laten zich niet overtuigen." },
    ],
    klaar: "Je kent nu alle vier de klassen. Kies een held en begin aan de nacht.",
  },
];

/** Zet de les klaar op een nieuwe run en een nieuw gevecht. `maak` krijgt de run en geeft het gevecht. */
export function richtLesIn(les, run, maak) {
  for (const id of les.extraKaarten || []) run.stapel.push({ uid: `les-${id}`, id });
  const g = maak(run, { id: `oefening-${les.id}`, plek: les.plek, ...les.gevecht });
  if (les.geestBoven != null) {
    g.geest = Math.min(g.maxGeest, Math.floor(g.maxGeest * verlichtDrempel(g) + 1e-9) + les.geestBoven);
    run.geest = g.geest;
  }
  // de kaarten van de les zeker in de beginhand: ruil ze met een andere kaart
  for (const id of les.inHand || []) {
    if (g.hand.some(i => i.id === id)) continue;
    const j = g.trek.findIndex(i => i.id === id);
    if (j < 0) continue;
    const weg = g.hand.findIndex(i => !i.zegel && !i.tijdelijk && !(les.inHand || []).includes(i.id) && kaartDef(i.id).soort !== "bondgenoot");
    const [kaart] = g.trek.splice(j, 1);
    if (weg >= 0) { g.trek.push(g.hand[weg]); g.hand[weg] = kaart; } else g.hand.push(kaart);
  }
  return g;
}

/** De tip van dit moment. Elke tip verschijnt één keer, in volgorde; de laatste blijft staan tot er een nieuwe is. */
export function maakHulp(les) {
  const gezien = new Set();
  let huidig = null;
  return g => {
    const i = les.tips.findIndex((t, n) => !gezien.has(n) && t.als(g));
    if (i >= 0) { gezien.add(i); huidig = les.tips[i].tekst; }
    return huidig;
  };
}
