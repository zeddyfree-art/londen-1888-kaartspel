// Controleert de vorm van alle kaarten, vijanden, bazen, gevechten, artefacten en ontmoetingen.
// Stopt met een foutcode als er iets niet klopt, zodat de workflow niet bouwt met kapotte data.
// Gebruik: node tools/controleer-kaarten.js
import fs from "fs";
import path from "path";
import { laadData } from "./testbot.js";
import { EFFECTSOORTEN, DOELWOORDEN } from "../app/motor/effecten.js";
import { STATUSSEN } from "../app/motor/gevecht.js";
import { kaartTekst } from "../app/motor/tekst.js";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const bib = laadData();
const fouten = [], waarschuwingen = [];
const fout = (waar, t) => fouten.push(`${waar}: ${t}`);

const SOORTEN = ["bondgenoot", "barricade", "ritueel", "spul", "spreuk", "middeltje", "waanzin"];
const ZELDZAAM = ["start", "gewoon", "ongewoon", "zeldzaam", "speciaal"];
const KLASSEN = ["kennis", "waarneming", "kracht", "charisma", "londen", "persoonlijk"];
const DOELEN = ["vijand", "eigen", "bondgenoot", "iedereen", "geen"];
const KENMERKEN = ["salvo", "scherpschutter", "achterhoede", "trofee"];

function artBestaat(waar, a) {
  if (!a) { fout(waar, "geen art"); return; }
  if (!fs.existsSync(path.join(root, "art", a))) fout(waar, `art bestaat niet: ${a}`);
}

function effecten(waar, lijst) {
  if (lijst == null) return;
  if (!Array.isArray(lijst)) { fout(waar, "effect moet een lijst zijn"); return; }
  for (const e of lijst) {
    if (!EFFECTSOORTEN.includes(e.doe)) fout(waar, `onbekende effectsoort '${e.doe}'`);
    if (e.op && !DOELWOORDEN.includes(e.op)) fout(waar, `onbekend doelwoord '${e.op}'`);
    if (e.doe === "status" && !(e.status in STATUSSEN)) fout(waar, `onbekende status '${e.status}'`);
    if (e.doe === "oproepen" && !bib.vijanden[e.kaart] && !bib.kaarten[e.kaart]) fout(waar, `oproepen: onbekende kaart '${e.kaart}'`);
    if (e.doe === "verwijder") for (const s of [].concat(e.status)) if (s !== "negatief" && !(s in STATUSSEN)) fout(waar, `verwijder: onbekende status '${s}'`);
  }
}

function eenheid(waar, d) {
  for (const k of d.kenmerken || []) if (!KENMERKEN.includes(k)) fout(waar, `onbekend kenmerk '${k}'`);
  for (const s of Object.keys(d.statussen || {})) if (!(s in STATUSSEN)) fout(waar, `onbekende beginstatus '${s}'`);
  effecten(waar + " bijToeslaan", d.bijToeslaan);
  effecten(waar + " bijToeslaanVerlicht", d.bijToeslaanVerlicht);
  effecten(waar + " bijBinnenkomst", d.bijBinnenkomst);
  effecten(waar + " bijVallen", d.bijVallen);
  effecten(waar + " bijFase", d.bijFase);
  if (d.reactie) effecten(waar + " reactie", d.reactie.effect);
}

const ids = new Set();
for (const [id, k] of Object.entries(bib.kaarten)) {
  const w = `kaart ${id}`;
  if (ids.has(id)) fout(w, "dubbel id"); ids.add(id);
  if (!k.naam) fout(w, "geen naam");
  if (!SOORTEN.includes(k.soort)) fout(w, `onbekende soort '${k.soort}'`);
  if (k.soort !== "waanzin" && !ZELDZAAM.includes(k.zeldzaamheid)) fout(w, `onbekende zeldzaamheid '${k.zeldzaamheid}'`);
  if (k.soort !== "waanzin" && !KLASSEN.includes(k.klasse)) fout(w, `onbekende klasse '${k.klasse}'`);
  artBestaat(w, k.art);
  if (["bondgenoot", "barricade", "ritueel"].includes(k.soort)) {
    if (k.soort === "ritueel" && !(k.schroot > 0 && k.teller > 0 && k.bijToeslaan)) fout(w, "een ritueel heeft schroot, een teller en een effect bij toeslaan nodig");
    if (k.soort === "bondgenoot" && !(k.leven > 0)) fout(w, "een bondgenoot heeft Leven nodig");
    if (k.soort === "barricade" && !(k.schroot > 0)) fout(w, "een barricade heeft schroot nodig");
    eenheid(w, k);
  } else if (!k.onspeelbaar) {
    if (!DOELEN.includes(k.doel || "geen")) fout(w, `onbekend doel '${k.doel}'`);
    if (!k.effect?.length) fout(w, "geen effect");
    effecten(w, k.effect);
    effecten(w + " verlicht", k.effectVerlicht);
  }
  if (k.verbeterd) { effecten(w + " verbeterd", k.verbeterd.effect); effecten(w + " verbeterd verlicht", k.verbeterd.effectVerlicht); if (k.verbeterd.bijToeslaan) effecten(w + " verbeterd", k.verbeterd.bijToeslaan); }
  else if (!["waanzin", "middeltje"].includes(k.soort) && k.zeldzaamheid !== "speciaal") waarschuwingen.push(`${w}: geen verbeterde versie`);
  if (k.soort === "spreuk" && k.geest == null) fout(w, "een spreuk moet een Geest-prijs hebben (mag 0 zijn)");
  if (k.held && !bib.helden[k.held]) fout(w, `onbekende held '${k.held}'`);
  if (k.deductie != null && !(k.deductie > 0)) fout(w, "een Deductie kost minstens 1 Aanwijzing");
  if (!kaartTekst(k).tekst.length && !k.sfeer) waarschuwingen.push(`${w}: geen tekst en geen sfeer`);
}

for (const [id, v] of Object.entries(bib.vijanden)) {
  const w = `vijand ${id}`;
  artBestaat(w, v.art);
  if (!(v.leven > 0)) fout(w, "geen Leven");
  if (v.aanval == null) fout(w, "geen aanval");
  if (!(v.teller > 0)) fout(w, "geen teller");
  eenheid(w, v);
  for (const f of v.fasen || []) eenheid(`${w} fase ${f.faseNaam}`, f);
}

for (const h of bib.data.helden) {
  artBestaat(`held ${h.id}`, h.art);
  if (h.speelbaar) for (const p of h.persoonlijk) if (!bib.kaarten[p]) fout(`held ${h.id}`, `persoonlijke kaart '${p}' ontbreekt`);
  if (h.vermogen.extraKaart && !bib.kaarten[h.vermogen.extraKaart]) fout(`held ${h.id}`, `extra kaart '${h.vermogen.extraKaart}' ontbreekt`);
  if (h.vermogen.startKaart && !bib.kaarten[h.vermogen.startKaart]) fout(`held ${h.id}`, `startkaart '${h.vermogen.startKaart}' ontbreekt`);
  if (h.vermogen.actie) effecten(`held ${h.id} vermogen`, h.vermogen.actie.effect);
  if (h.vermogen.bijToeslaan) effecten(`held ${h.id} vermogen`, h.vermogen.bijToeslaan);
}

for (const [god, gd] of Object.entries(bib.gevechten)) {
  if (!bib.goden[god]) fout(`gevechten ${god}`, "onbekende god");
  gd.akten.forEach((a, i) => {
    const alle = [...a.gewoon, ...a.elite, a.baas];
    if (a.gewoon.length < 2) fout(`gevechten ${god} akte ${i + 1}`, "minstens 2 gewone gevechten nodig");
    for (const g of alle) {
      if (!g.golven?.length) fout(`gevecht ${g.id}`, "geen golven");
      for (const x of g.golven.flat()) { const vid = typeof x === "string" ? x : x.id; if (!bib.vijanden[vid]) fout(`gevecht ${g.id}`, `onbekende vijand '${vid}'`); }
    }
    if (!a.baas.golven.flat().some(x => bib.vijanden[typeof x === "string" ? x : x.id]?.baas)) fout(`gevecht ${a.baas.id}`, "het baasgevecht heeft geen baas");
  });
}

for (const a of bib.data.artefacten) {
  artBestaat(`artefact ${a.id}`, a.art);
  if (!["begin-gevecht", "na-gevecht", "passief", "oppakken"].includes(a.haak)) fout(`artefact ${a.id}`, `onbekende haak '${a.haak}'`);
  effecten(`artefact ${a.id}`, a.effect);
}

for (const o of bib.ontmoetingen) {
  artBestaat(`ontmoeting ${o.id}`, o.art);
  if (o.god && !bib.goden[o.god]) fout(`ontmoeting ${o.id}`, `onbekende god '${o.god}'`);
  for (const k of o.keuzes) {
    const u = k.uitkomst || {};
    if (u.kaart && !/^(klasse|londen)/.test(u.kaart) && !bib.kaarten[u.kaart]) fout(`ontmoeting ${o.id}`, `onbekende kaart '${u.kaart}'`);
    if (u.bondgenoot && !bib.kaarten[u.bondgenoot]) fout(`ontmoeting ${o.id}`, `onbekende bondgenoot '${u.bondgenoot}'`);
    if (u.middeltje && u.middeltje !== "willekeurig" && !bib.kaarten[u.middeltje]) fout(`ontmoeting ${o.id}`, `onbekend middeltje '${u.middeltje}'`);
  }
}

// nieuws
const nieuws = JSON.parse(fs.readFileSync(path.join(root, "data/nieuws.json"), "utf8"));
for (let i = 1; i < nieuws.length; i++) if (nieuws[i].id >= nieuws[i - 1].id) fout("nieuws", "het nieuwste bericht moet bovenaan staan, met het hoogste id");

const tel = s => Object.values(bib.kaarten).filter(k => k.soort === s).length;
console.log(`${Object.keys(bib.kaarten).length} kaarten (${SOORTEN.map(s => `${tel(s)} ${s}`).join(", ")}), ${Object.keys(bib.vijanden).length} vijanden, ${bib.data.artefacten.length} artefacten, ${bib.ontmoetingen.length} ontmoetingen`);
if (waarschuwingen.length) console.log("Let op:\n  " + waarschuwingen.join("\n  "));
if (fouten.length) { console.error("FOUTEN:\n  " + fouten.join("\n  ")); process.exit(1); }
console.log("Alles klopt.");
