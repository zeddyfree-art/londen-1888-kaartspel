// Het begin: data laden, schermen kiezen, de run bewaren.
import { el, bg, ICOON, opslag, melding, modaal, banner } from "./gemeen.js";
import { zetBibliotheek, DATABESTANDEN, B, kaartDef } from "../motor/bibliotheek.js";
import { nieuweRun, runActie, VERSIE } from "../motor/run.js";
import { maakGevecht, doe as gevechtDoe } from "../motor/gevecht.js";
import { speelkamer } from "./speelkamer.js";
import { kaartEl } from "./kaart-dom.js";
import { gevechtScherm } from "./gevecht-scherm.js";
import { kaartScherm, knoopScherm, beloningScherm, eindScherm, stapelScherm, plekArt } from "./run-scherm.js";
import { laadGeluiden, speel, sfeer, zetMuziek, zetGeluid, geluidAan, muziekIsAan, huidigNummer, volgendNummer } from "./geluid.js";

const app = document.getElementById("app");
let run = null;
let meta = opslag.lees("meta", { alles: false, ontgrendeld: [], runs: 0, gewonnen: 0, perHeld: {}, nieuwsGezien: 0 });
let instellingen = opslag.lees("instellingen", { volgorde: true, snel: false });
let nieuws = [];
let balans = null;

async function laad() {
  const data = {};
  await Promise.all(DATABESTANDEN.map(async n => {
    try { const r = await fetch(`data/${n}.json`); data[n] = r.ok ? await r.json() : []; } catch { data[n] = []; }
  }));
  zetBibliotheek(data);
  try { nieuws = await (await fetch("data/nieuws.json")).json(); } catch { nieuws = []; }
  try { balans = await (await fetch("data/winkans.json")).json(); } catch { balans = null; }
  const bewaard = opslag.lees("run", null);
  if (bewaard && bewaard.versie === VERSIE && bewaard.fase !== "einde") run = bewaard;
  laadGeluiden();
  startScherm();
}

const bewaar = () => opslag.schrijf("run", run && run.fase !== "einde" ? run : null);
const bewaarMeta = () => opslag.schrijf("meta", meta);
const bewaarInst = () => { const i = opslag.lees("instellingen", {}); opslag.schrijf("instellingen", { ...i, ...instellingen }); };

/* ───────── startscherm ───────── */

function startScherm() {
  document.body.classList.remove("verlicht");
  sfeer("sfeer-start");
  speelkamer(app, {
    nieuw: nieuweRunKiezen, hervat, oefen: oefengevecht, hoofdkwartier,
    regels: spelregels, nieuws: nieuwsScherm, muziek: muziekMenu, instellingen: instellingenModaal,
  }, nieuws[0], !!run);
}

function hervat() { toonRun(); }

/* ───────── een run kiezen ───────── */

function heldVrij(h) { return meta.alles || h.vrij || meta.ontgrendeld.includes(h.id); }

function nieuweRunKiezen() {
  const keuze = { klasse: null, held: null, god: null, stand: "normaal" };
  const bib = B();
  const kop = (titel, terug) => el("div", { class: "kop" }, el("button", { class: "icoonknop", html: ICOON.terug, "aria-label": "Terug", onclick: terug }), el("h2", {}, titel));
  const scherm = (titel, terug, uitleg, inhoud, voet) => app.replaceChildren(el("div", { class: "scherm" },
    el("div", { class: "achtergrond", style: { backgroundImage: bg("plekken/bloomsbury.jpg") } }),
    kop(titel, terug), el("div", { class: "midden" }, uitleg ? el("p", { class: "uitleg" }, uitleg) : null, inhoud), voet ? el("div", { class: "voet" }, voet) : null));

  const VOORBEELD = { kennis: "ambrose-pell", waarneming: "silas-rook", kracht: "tobias-hale", charisma: "cordelia-vane" };
  function stapKlasse() {
    const tegels = el("div", { class: "tegels" });
    for (const k of bib.data.klassen) {
      const t = el("button", { class: `tegel ${k.speelbaar ? "" : "dicht"}`, style: { "--rand": k.kleur }, disabled: !k.speelbaar, onclick: () => { keuze.klasse = k.id; stapHeld(); } },
        el("div", { class: "tbeeld", style: { backgroundImage: bg(bib.helden[VOORBEELD[k.id]].art) } }),
        el("div", { class: "ttekst" }, el("div", { class: "tnaam", style: { color: k.kleur === "#8e2a22" ? "#e88a7a" : undefined } }, k.naam), el("div", { class: "tsub" }, k.rol), el("div", {}, k.kort)),
        k.speelbaar ? null : el("span", { class: "slot" }, "komt later"));
      tegels.append(t);
    }
    scherm("Kies een klasse", startScherm, "Je klasse bepaalt je kaarten en je manier van vechten. Kracht is als eerste klaar; de andere drie volgen.", tegels);
  }

  function heldTegel(h, gekozen) {
    const pers = h.persoonlijk.map(id => bib.kaarten[id]?.naam).filter(Boolean).join(" en ");
    return el("button", { class: `tegel breed ${heldVrij(h) ? "" : "dicht"} ${gekozen ? "gekozen" : ""}`, style: { "--rand": "var(--goud)" }, disabled: !heldVrij(h), onclick: () => { keuze.held = h.id; stapGod(); } },
      el("div", { class: "tbeeld", style: { backgroundImage: bg(h.art), height: "220px" } }),
      el("div", { class: "ttekst" },
        el("div", { class: "tnaam" }, h.naam), el("div", { class: "tsub" }, `${h.rol} · Lichaam ${h.lichaam} · Geest ${h.geest}`),
        el("div", {}, el("b", {}, h.vermogen.naam + ": "), h.vermogen.tekst),
        pers ? el("div", { class: "tsub" }, "Neemt mee: " + pers) : null),
      heldVrij(h) ? null : el("span", { class: "slot" }, "op slot"));
  }

  function stapHeld(alle = false) {
    const helden = bib.data.helden.filter(h => h.klasse === keuze.klasse);
    const vrij = helden.filter(heldVrij);
    let toon;
    if (alle) toon = helden;
    else {
      // drie willekeurige ontgrendelde helden
      toon = vrij.map(h => ({ h, k: Math.random() })).sort((a, b) => a.k - b.k).slice(0, 3).map(x => x.h);
    }
    const tegels = el("div", { class: "tegels" }, toon.map(h => heldTegel(h, keuze.held === h.id)));
    scherm("Kies je held", stapKlasse, alle ? "Alle helden van deze klasse. Win runs om er meer te ontgrendelen." : "Drie helden die vannacht wakker zijn.", tegels,
      [el("button", { class: "knop stil", onclick: () => stapHeld(!alle) }, alle ? "Toon er drie" : "Kies zelf uit alle helden")]);
  }

  function stapGod() {
    const tegels = el("div", { class: "tegels" });
    for (const g of bib.data.goden) {
      tegels.append(el("button", { class: `tegel ${g.speelbaar ? "" : "dicht"}`, style: { "--rand": "#5a3a6a" }, disabled: !g.speelbaar, onclick: () => { keuze.god = g.id; stapStand(); } },
        el("div", { class: "tbeeld", style: { backgroundImage: bg(g.art) } }),
        el("div", { class: "ttekst" }, el("div", { class: "tnaam" }, g.naam), el("div", { class: "tsub" }, g.titel), g.regel ? el("div", { style: { fontSize: "14px" } }, g.regel) : null),
        g.speelbaar ? null : el("span", { class: "slot" }, "komt later")));
    }
    scherm("Welke oude god ontwaakt?", () => stapHeld(), "De god bepaalt je vijanden, je bazen, de muziek en één regel die de hele nacht geldt.", tegels,
      [el("button", { class: "knop", onclick: () => { const vrij = bib.data.goden.filter(g => g.speelbaar); keuze.god = vrij[Math.floor(Math.random() * vrij.length)].id; stapStand(); } }, "Willekeurig")]);
  }

  function stapStand() {
    const tegels = el("div", { class: "keuzes" });
    for (const s of bib.data.standen) {
      const kans = balans?.standen?.[s.id];
      tegels.append(el("button", { class: `keuze ${keuze.stand === s.id ? "gekozen" : ""}`, style: keuze.stand === s.id ? { borderColor: "var(--goud-licht)", boxShadow: "0 0 0 2px var(--goud-licht)" } : {}, onclick: () => { keuze.stand = s.id; stapStand(); } },
        el("b", {}, s.naam), el("span", {}, s.tekst), el("span", { style: { color: "var(--goud-licht)" } }, kans != null ? `Geschatte winkans: ${Math.round(kans)}%` : `Doel: ${s.doel}`)));
    }
    const klokken = el("div", { class: "paneel", style: { padding: "14px 16px", maxWidth: "720px", margin: "18px auto 0" } },
      el("b", { style: { color: "var(--goud-licht)", fontFamily: "var(--display)", fontSize: "20px" } }, "De dertien klokken"),
      el("p", { class: "muted", style: { margin: "6px 0 0" } }, "Wie wint, ontgrendelt straks de klokken: extra moeilijkheden die je stapelt, zoals Lege zakken en Dikke mist. Ze komen in een volgende versie."),
      el("div", { style: { display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" } }, ["lege-zakken", "zware-benen", "zwijgende-getuigen", "gesloten-lijnen", "taaie-wezens", "huiveringwekkend", "dikke-mist", "scheurende-stad", "slapeloze-nachten", "geen-tweede-worp", "ongeduldige-god", "geen-genade", "dertien-slagen"].map(k => el("div", { title: k.replace(/-/g, " "), style: { width: "40px", height: "40px", borderRadius: "50%", backgroundImage: bg(`klokken/${k}.jpg`), backgroundSize: "cover", filter: "grayscale(1) brightness(.5)", border: "1px solid var(--line)" } }))));
    scherm("Hoe zwaar wordt de nacht?", stapGod, null, el("div", {}, tegels, klokken),
      [el("button", { class: "knop", onclick: begin }, "Begin de nacht")]);
  }

  async function begin() {
    if (run && run.fase !== "einde") {
      const ok = await modaal("Nieuwe run?", "Je lopende run gaat dan verloren.", [{ tekst: "Annuleren", waarde: false, soort: "stil" }, { tekst: "Nieuwe run", waarde: true, soort: "gevaar" }]);
      if (!ok) return;
    }
    run = nieuweRun({ klasse: keuze.klasse, held: keuze.held, god: keuze.god, stand: keuze.stand });
    meta.runs = (meta.runs || 0) + 1; bewaarMeta();
    bewaar();
    banner(B().goden[run.god].naam, B().goden[run.god].titel, "violet");
    toonRun();
  }
  stapKlasse();
}

/* ───────── de run ───────── */

async function runDoe(actie) {
  try {
    const r = runActie(run, actie);
    run = r.run;
    bewaar();
    return r;
  } catch (e) {
    melding(e.message || String(e));
    throw e;
  }
}

function toonRun() {
  if (!run) return startScherm();
  sfeer(`sfeer-${run.god}`);
  document.body.classList.toggle("verlicht", false);
  switch (run.fase) {
    case "kaart":
      return kaartScherm(app, { run, actie: async a => { const r = await runDoe(a); if (a.soort === "verder" && run.fase === "gevecht") speel("golf"); toonRun(); }, menu: runMenu, stapel: () => stapelScherm(app, run, toonRun) });
    case "knoop":
      return knoopScherm(app, { run, actie: async a => { try { await runDoe(a); } catch { return; } toonRun(); } });
    case "gevecht": {
      const plek = run.gevechtDef?.plek;
      return gevechtScherm(app, {
        g: () => run.gevecht, instellingen, ponden: () => run.ponden, plekArt: plek ? plekArt(plek) : null,
        stuur: async a => { const r = await runDoe(a); return { ev: r.ev }; },
        klaar: () => setTimeout(toonRun, 300),
        menu: runMenu,
        hulp: run.oefening ? oefenHulp : null,
      });
    }
    case "beloning":
      return beloningScherm(app, { run, actie: async a => { await runDoe(a); toonRun(); } });
    case "einde": {
      const ontgrendeld = verwerkEinde();
      opslag.schrijf("run", null);
      return eindScherm(app, { run, ontgrendeld, opnieuw: () => { run = null; nieuweRunKiezen(); }, naarStart: () => { run = null; startScherm(); } });
    }
  }
}

function verwerkEinde() {
  if (run.verwerkt) return run.ontgrendeld || [];
  run.verwerkt = true;
  const uit = [];
  const ph = (meta.perHeld[run.held] ??= { runs: 0, gewonnen: 0 });
  ph.runs++;
  if (run.uitslag === "gewonnen") {
    meta.gewonnen = (meta.gewonnen || 0) + 1; ph.gewonnen++;
    // ontgrendel de volgende held van deze klasse
    const dicht = B().data.helden.filter(h => h.klasse === run.klasse && h.speelbaar && !heldVrij(h));
    if (dicht.length) { meta.ontgrendeld.push(dicht[0].id); uit.push(dicht[0].naam); }
  }
  if (run.achtergelaten) meta.achtergelaten = run.achtergelaten;
  bewaarMeta();
  run.ontgrendeld = uit;
  return uit;
}

async function runMenu() {
  const knoppen = [
    { tekst: "Terug naar het begin", waarde: "start", soort: "stil" },
    { tekst: "Geef op", waarde: "opgeven", soort: "gevaar" },
    { tekst: "Instellingen", waarde: "instellingen", soort: "stil" },
    { tekst: "Verder spelen", waarde: null },
  ];
  const w = await modaal("Menu", el("p", { class: "muted" }, "Je run wordt na elke stap bewaard. Je kunt altijd later verder."), knoppen);
  if (w === "start") startScherm();
  else if (w === "instellingen") { await instellingenModaal(); toonRun(); }
  else if (w === "opgeven") {
    const ok = await modaal("Opgeven?", "Je run eindigt hier.", [{ tekst: "Nee", waarde: false, soort: "stil" }, { tekst: "Geef op", waarde: true, soort: "gevaar" }]);
    if (ok) { run.fase = "einde"; run.uitslag = "verloren"; run.stats.verlorenIn = "een nacht die je opgaf"; toonRun(); }
  }
}

async function instellingenModaal() {
  const rij = (tekst, aan, zet) => el("label", { class: "schakel" }, el("span", {}, tekst), el("input", { type: "checkbox", checked: aan, onchange: e => zet(e.target.checked) }));
  const inhoud = el("div", {},
    rij("Geluid", geluidAan(), v => zetGeluid(v)),
    rij("Muziek", muziekIsAan(), v => zetMuziek(v)),
    rij("Snelle animaties", !!instellingen.snel, v => { instellingen.snel = v; bewaarInst(); }),
    rij("Volgorde van toeslaan tonen", instellingen.volgorde !== false, v => { instellingen.volgorde = v; bewaarInst(); }),
    rij("Vraag bevestiging bij het politiefluitje", instellingen.vraagFluitje !== false, v => { instellingen.vraagFluitje = v; bewaarInst(); }),
    rij("Alles vrijgeven (alle helden)", !!meta.alles, v => { meta.alles = v; bewaarMeta(); }));
  await modaal("Instellingen", inhoud, [{ tekst: "Klaar" }]);
}

/* ───────── hoofdkwartier, nieuws, regels, muziek ───────── */

function pagina(titel, inhoud, achtergrond = "plekken/bloomsbury.jpg") {
  app.replaceChildren(el("div", { class: "scherm" },
    el("div", { class: "achtergrond", style: { backgroundImage: bg(achtergrond) } }),
    el("div", { class: "kop" }, el("button", { class: "icoonknop", html: ICOON.terug, "aria-label": "Terug", onclick: startScherm }), el("h2", {}, titel)),
    el("div", { class: "midden" }, el("div", { class: "tekstpagina" }, inhoud))));
}

function hoofdkwartier() {
  const bib = B();
  const kracht = bib.data.helden.filter(h => h.klasse === "kracht");
  pagina("Het hoofdkwartier", [
    el("p", { class: "sfeertekst" }, "De achterkamer van een occulte boekwinkel in Bloomsbury. Kaarten van de riolen aan de muur, een pot thee die nooit warm blijft, en een gastenboek met namen die je beter niet hardop zegt."),
    el("div", { class: "cijfers" }, el("div", {}, el("b", {}, String(meta.runs || 0)), "runs begonnen"), el("div", {}, el("b", {}, String(meta.gewonnen || 0)), "runs gewonnen")),
    el("h3", {}, "De wachtkamer: helden"),
    el("p", {}, "Elke gewonnen run ontgrendelt een nieuwe held van die klasse."),
    el("div", { class: "tegels" }, kracht.map(h => el("div", { class: `tegel ${heldVrij(h) ? "" : "dicht"}`, style: { width: "150px", minHeight: "0", cursor: "default" } },
      el("div", { class: "tbeeld", style: { backgroundImage: bg(h.art), height: "150px" } }),
      el("div", { class: "ttekst" }, el("div", { class: "tnaam", style: { fontSize: "16px" } }, h.naam), el("div", { class: "tsub" }, meta.perHeld[h.id] ? `${meta.perHeld[h.id].gewonnen} van ${meta.perHeld[h.id].runs} gewonnen` : heldVrij(h) ? "vrij" : "op slot"))))),
    el("h3", {}, "Nog dicht"),
    el("p", { class: "muted" }, "Het rariteitenkabinet, de leeszaal, het gastenboek, de kaartentafel en de torenklok gaan open in een volgende versie, met uitdagingen zoals 'Win met elke klasse' en 'Win een gevecht met 1 Lichaam'."),
    el("button", { class: "knop stil", onclick: async () => { await instellingenModaal(); hoofdkwartier(); } }, "Instellingen"),
  ]);
}

function nieuwsScherm() {
  meta.nieuwsGezien = nieuws[0]?.id || 0; bewaarMeta();
  pagina("Wat is er nieuw", nieuws.map(n => el("div", { class: "nieuwsitem" }, el("div", { class: "datum" }, n.datum), el("h3", { style: { marginTop: "2px" } }, n.titel), el("ul", {}, n.punten.map(p => el("li", {}, p))))));
}

function spelregels() {
  const S = (t, ...p) => [el("h3", {}, t), ...p.map(x => el("p", {}, x))];
  pagina("Spelregels", [
    el("p", { class: "sfeertekst" }, "Eén nacht in Londen, drie akten, en aan het eind een oude god die wakker wordt. Je trekt met een held en een stapel kaarten door de stad."),
    el("div", { style: { textAlign: "center" } }, el("button", { class: "knop", onclick: oefengevecht }, "Speel het oefengevecht")),
    ...S("Het slagveld", "Je speelt links, de vijanden staan rechts. Elke kant heeft twee rijen van drie vakken: de Straat boven en het Riool onder. Het vak het dichtst bij het midden is het voorste. Een kaart valt de voorste vijand in haar eigen rij aan; is die rij leeg, dan de voorste in de andere rij."),
    ...S("Tellers", "Kaarten zijn gratis, maar elke kaart op het veld heeft een teller (het klokje). Aan het eind van elke beurt gaat elke teller 1 omlaag. Op 0 slaat de kaart toe en begint de teller opnieuw. Eerst slaan de vijanden toe, dan jouw kant, in de volgorde van de nummertjes. Een rood vizier toont wie deze beurt wordt aangevallen."),
    ...S("Je beurt", "Je hebt 6 kaarten in je hand en doet één ding: een kaart spelen, het politiefluitje blazen (nieuwe hand), of een bondgenoot terugroepen naar je hand (hij geneest helemaal). Je eigen kaarten verplaatsen is gratis. Middeltjes uit je zak kosten ook geen beurt. Er is geen knop om een beurt over te slaan."),
    ...S("Golven", "Big Ben telt af naar de volgende golf vijanden. Is het veld leeg, dan komt de volgende golf meteen. Versla alle golven, of de baas, om te winnen."),
    ...S("Lichaam, Geest en Verlichting", "Je held heeft Lichaam en Geest. Valt het Lichaam op 0, dan is de run voorbij. Monsters doen ook Gruwel: dat gaat van je Geest af, of geeft een bondgenoot Angst.", "Zakt je Geest tot de helft of lager, dan raak je verlicht: occulte kaarten (met een violette gloed) gebruiken dan hun verlichte tekst, die sterker is en vaak iets kost. Valt je Geest op 0, dan krijg je een Waanzin-kaart in je stapel en herstelt je Geest tot de helft. De Kerk neemt Waanzin weer weg."),
    ...S("Statussen", "Mist (teller staat stil), Pest (schade aan het eind van de beurt), Doorns (wie raakt, krijgt schade terug), Gezegend (blokkeert de volgende treffer), Bescherming (vangt schade op), Vervloekt (volgende treffer dubbel), Inkt (vermogens doen niets), Bekoring (volgende aanval raakt de eigen kant), Angst (minder aanval), Woede (meer schade bij de volgende aanval)."),
    ...S("Kracht", "Kaarten van de klasse Kracht verdienen trofeeën: wie een vijand doodt, krijgt +1 aanval voor de rest van het gevecht. Barricades hebben schroot in plaats van Leven: elke treffer kost precies 1 schroot, hoe hard hij ook is."),
    ...S("De kaart van Londen", "Elke akte heeft drie gedeelten. Je kiest steeds een van twee paden, met winkels, rust, ontmoetingen en Scheuren, en elk gedeelte eindigt met een gevecht waarvan je de naam en de vijanden vooraf ziet. Je hebt hooguit vier bondgenoten in je stapel; de rest wacht in de reserve. Een gevallen bondgenoot is gewond tot je hem laat verzorgen."),
    ...S("Bediening", "Sleep een kaart naar een vak of een doel, of tik op een kaart en daarna op het doel. Kaarten zonder doel speel je door er twee keer op te tikken. Houd een kaart lang ingedrukt (of houd de muis erboven) voor de volledige tekst."),
  ]);
}

const OEFENHULP = [
  "<b>Welkom.</b> Sleep een <b>bondgenoot</b> of <b>barricade</b> uit je hand naar een leeg vak aan jouw kant (links). Kaarten zijn gratis, maar je doet <b>één ding per beurt</b>.",
  "Elke kaart op het veld heeft een <b>teller</b> (het klokje rechtsboven). Na je beurt gaat hij 1 omlaag; op 0 slaat de kaart toe. De nummertjes tonen de <b>volgorde</b>.",
  "Een <b>rood vizier</b> toont wie deze beurt wordt aangevallen. Sleep een <b>spul</b> naar een vijand om hem te raken, of zet iemand voor je held.",
  "<b>Big Ben</b> (bovenaan) telt af naar de volgende <b>golf</b>. Versla alle golven om te winnen.",
  "Slechte hand? Blaas op het <b>politiefluitje</b> voor een nieuwe hand. Na 4 beurten zonder fluiten kost het geen beurt.",
  "<b>Gruwel</b> kost je held Geest. Onder de helft raak je <b>verlicht</b>: occulte kaarten worden sterker. Houd een kaart lang ingedrukt voor alle tekst.",
];
function oefenHulp(g) { return OEFENHULP[g.beurt - 1] || null; }

function oefengevecht() {
  const oud = run;
  const oefen = nieuweRun({ klasse: "kracht", held: "tobias-hale", god: "vathrun", stand: "ontspannen", seed: 1888 });
  oefen.oefening = true;
  const def = { id: "oefening", naam: "Oefening op de kade", plek: "wapping", bigben: 5, golven: [["cultist"], ["cultist", { id: "logebroeder", rij: "riool" }]] };
  oefen.gevecht = maakGevecht(oefen, def);
  oefen.gevechtDef = def;
  oefen.fase = "gevecht";
  const ctx = { run: oefen };
  gevechtScherm(app, {
    g: () => ctx.run.gevecht, instellingen, ponden: () => 0, plekArt: plekArt("wapping"),
    stuur: async a => { const r = gevechtDoe(ctx.run.gevecht, a); ctx.run.gevecht = r.g; return { ev: r.ev }; },
    klaar: async () => {
      const won = ctx.run.gevecht.uitslag === "gewonnen";
      await modaal(won ? "Goed gedaan" : "Helaas", won ? "Je kent nu de basis. Een echte run begint met een makkelijk gevecht, en wordt daarna snel zwaarder." : "Probeer het nog eens: zet bondgenoten en barricades vóór je held.", [{ tekst: "Terug" }]);
      run = oud; startScherm();
    },
    menu: async () => { const w = await modaal("Oefengevecht", "Wil je stoppen met oefenen?", [{ tekst: "Stoppen", waarde: true, soort: "stil" }, { tekst: "Verder", waarde: false }]); if (w) { run = oud; startScherm(); } },
    hulp: oefenHulp,
  });
}

async function muziekMenu() {
  const nu = huidigNummer();
  const w = await modaal("Muziek", el("div", {}, el("p", {}, "De acht stukken uit Londen 1888 spelen zacht onder de sfeer van de nacht."), nu ? el("p", { class: "muted" }, `Nu: ${nu}`) : null),
    [{ tekst: muziekIsAan() ? "Muziek uit" : "Muziek aan", waarde: "wissel", soort: "stil" }, ...(muziekIsAan() ? [{ tekst: "Volgend stuk", waarde: "volgend", soort: "stil" }] : []), { tekst: "Klaar" }]);
  if (w === "wissel") zetMuziek(!muziekIsAan());
  if (w === "volgend") volgendNummer();
}

/* PWA */
if ("serviceWorker" in navigator && location.protocol !== "file:" && !location.hostname.match(/^(localhost|127\.)/)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

laad().catch(e => { app.replaceChildren(el("div", { style: { padding: "30px" } }, "Het spel kon niet laden: " + e.message)); console.error(e); });
window.__spel = { get run() { return run; } };
