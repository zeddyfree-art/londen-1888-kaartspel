// De testbot: speelt gevechten en hele runs zonder scherm, met de motor en een seed.
// Hij speelt redelijk, niet perfect: per beurt kiest hij de actie die na een korte vooruitblik
// (deze beurt plus de tellers van de volgende 2 beurten) het beste uitkomt.
//
// Gebruik:
//   node tools/testbot.js --gevechten 1000          het eerste gevecht, 1000 keer
//   node tools/testbot.js --runs 300                 hele runs, per stand
//   node tools/testbot.js --runs 300 --stand normaal --held tobias-hale --seed 7 --uitleg
//   node tools/testbot.js --runs 300 --schrijf       resultaten naar ontwerp/balans.json
import fs from "fs";
import path from "path";
import { zetBibliotheek, DATABESTANDEN, B, kaartDef } from "../app/motor/bibliotheek.js";
import { maakGevecht, doe, alleActies, eindeBeurt, eenhedenVan, levend } from "../app/motor/gevecht.js";
import { nieuweRun, runActie, huidigGedeelte, aantalBondgenoten, MAX_MIDDELTJES } from "../app/motor/run.js";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
export function laadData() {
  const data = {};
  for (const n of DATABESTANDEN) {
    const f = path.join(root, "data", n + ".json");
    data[n] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
  }
  return zetBibliotheek(data);
}

/* ───────── een gevecht spelen ───────── */

function waarde(g) {
  if (g.uitslag === "verloren") return -1e6;
  const h = g.eenheden[g.held];
  let s = 0;
  if (g.uitslag === "gewonnen") s += 5000;
  s += (h?.leven || 0) * 6 + g.geest * 1.2 + (h?.statussen.bescherming || 0) * 2 + (h?.statussen.gezegend || 0) * 4;
  for (const u of eenhedenVan(g, "speler")) {
    if (u.uid === g.held) continue;
    if (u.soort === "ritueel") s += 6 + u.schroot * 3 + 8 / Math.max(1, u.teller || 1);
    else if (u.schroot != null) s += u.schroot * 3;
    else s += 6 + u.leven * 1.2 + (u.aanval || 0) * 3 + (u.statussen.gezegend || 0) * 2;
  }
  for (const u of eenhedenVan(g, "vijand")) {
    s -= 8 + u.leven * 1.5 + (u.aanval || 0) * 4 + (u.gruwel || 0) * 2;
    s += (u.statussen.mist || 0) * 2 + (u.teller || 0) * 1.5 + (u.statussen.vervloekt || 0) * 3 + (u.ontmaskerd ? 3 : 0) + (u.statussen.pest || 0) * 1.2 + (u.statussen.inkt || 0) * 1.5;
  }
  s += Math.min(g.aanwijzingen || 0, 6) * 4;
  s -= (g.golven.length - g.golfNr) * 25 + g.wachtrij.length * 15;
  return s;
}

function vooruitblik(g, diepte = 2) {
  const k = JSON.parse(JSON.stringify(g));
  k.ev = [];
  for (let i = 0; i < diepte && !k.uitslag; i++) eindeBeurt(k);
  return waarde(k);
}

export function kiesActie(g) {
  let beste = null, besteWaarde = -Infinity;
  for (const a of alleActies(g)) {
    let w;
    try {
      const { g: n } = doe(g, a);
      w = n.uitslag ? waarde(n) : vooruitblik(n);
      if (a.soort === "fluitje") w -= 4;
      if (a.soort === "terugroepen") w -= 6;
    } catch (e) { continue; }
    if (w > besteWaarde) { besteWaarde = w; beste = a; }
  }
  return beste;
}

/** Middeltjes en verplaatsen kosten geen beurt; de bot gebruikt ze eenvoudig. */
function vrijeActies(g) {
  const h = g.eenheden[g.held];
  for (let i = g.zak.length - 1; i >= 0; i--) {
    const d = kaartDef(g.zak[i]);
    const genees = (d.effect || []).find(e => e.doe === "lichaam" && e.aantal > 0);
    const geest = (d.effect || []).find(e => e.doe === "geest" && e.aantal > 0);
    if ((genees && h.leven <= h.maxLeven * 0.4) || (geest && g.geest <= 2)) {
      g = doe(g, { soort: "middeltje", index: i, doel: g.held }).g;
    }
  }
  // held liever niet vooraan als er een bondgenoot of barricade voor kan
  const hu = g.eenheden[g.held];
  if (hu.vak.plek < 2) {
    const rij = hu.vak.rij;
    if (!g.veld.speler[rij][2]) g = doe(g, { soort: "verplaats", eenheid: g.held, vak: { rij, plek: 2 } }).g;
  }
  return g;
}

export function speelGevecht(g, maxBeurten = 80) {
  while (!g.uitslag && g.beurt <= maxBeurten) {
    g = vrijeActies(g);
    const a = kiesActie(g);
    if (!a) break;
    g = doe(g, a).g;
  }
  if (!g.uitslag) g.uitslag = "verloren";
  return g;
}

/* ───────── een run spelen ───────── */

const SCORE = { start: 1, gewoon: 4, ongewoon: 6, zeldzaam: 8, speciaal: 0 };
function kaartScore(run, id) {
  const d = kaartDef(id);
  if (d.soort === "waanzin") return -20;
  let s = SCORE[d.zeldzaamheid] ?? 2;
  if (d.soort === "bondgenoot") s += aantalBondgenoten(run) < 4 ? 4 : -3;
  if (d.soort === "barricade" || d.soort === "ritueel") s += 1;
  if (d.soort === "spreuk" && run.geest <= 3) s -= 2;
  return s;
}

function kiesRunActie(run) {
  const bib = B();
  switch (run.fase) {
    case "kaart": {
      if (run.pos.pad == null) {
        const gd = huidigGedeelte(run);
        const opties = gd.paden.map((p, i) => ({ p, i })).filter(x => x.p);
        const score = p => p.reduce((s, k) => s + ({
          ziekenhuis: run.lichaam < run.maxLichaam * 0.6 ? 6 : 1, gaarkeuken: run.geest < run.maxGeest * 0.5 ? 4 : 1,
          markt: run.ponden > 50 ? 4 : 1, universiteit: 3, kist: 3, logement: aantalBondgenoten(run) < 4 ? 3 : 1, kerk: run.stapel.some(i => kaartDef(i.id).soort === "waanzin") ? 4 : 1,
          scheur: run.lichaam > run.maxLichaam * 0.7 ? 3 : -6, ontmoeting: 2, seance: run.geest > 8 ? 2 : -1, club: 0,
        }[k.soort] ?? 0), 0);
        opties.sort((a, b) => score(b.p) - score(a.p));
        return { soort: "kiesPad", pad: opties[0].i };
      }
      return { soort: "verder" };
    }
    case "knoop": {
      const st = run.knoop;
      if (st.vervolg) {
        const kand = run.stapel.filter(i => st.vervolg.soort === "verbeter" ? !i.verbeterd && kaartDef(i.id).verbeterd : true);
        if (!kand.length) return { soort: "slaVervolgOver" };
        kand.sort((a, b) => kaartScore(run, a.id) - kaartScore(run, b.id));
        const i = st.vervolg.soort === "verbeter" ? kand[kand.length - 1] : kand[0];
        return { soort: st.vervolg.soort, inst: i.uid };
      }
      switch (st.soort) {
        case "markt": {
          const opties = st.waren.map((w, i) => ({ w, i })).filter(x => !x.w.verkocht && x.w.prijs <= run.ponden && kaartScore(run, x.w.id) >= 5 && run.stapel.length < 20);
          if (opties.length) { opties.sort((a, b) => kaartScore(run, b.w.id) - kaartScore(run, a.w.id)); return { soort: "koop", index: opties[0].i }; }
          const mi = st.middeltjes.findIndex(m => !m.verkocht && m.prijs <= run.ponden && run.middeltjes.length < MAX_MIDDELTJES);
          if (mi >= 0) return { soort: "koopMiddeltje", index: mi };
          if (!st.zegel.verkocht && st.zegel.prijs <= run.ponden) {
            const kand = run.stapel.filter(i => !i.zegel && ["barricade", "bondgenoot"].includes(kaartDef(i.id).soort));
            if (kand.length) return { soort: "koopZegel", inst: kand[0].uid };
          }
          return { soort: "klaar" };
        }
        case "ziekenhuis": return st.klaar ? { soort: "klaar" } : { soort: "kies", index: run.stapel.some(i => i.gewond) && run.lichaam > run.maxLichaam * 0.6 ? 1 : 0 };
        case "gaarkeuken": return st.klaar ? { soort: "klaar" } : { soort: "kies", index: run.geest < run.maxGeest * 0.6 ? 0 : 1 };
        case "kerk": {
          if ((st.verwijderd || 0) >= 2) return { soort: "klaar" };
          const kand = run.stapel.filter(i => kaartDef(i.id).soort === "waanzin" || (run.stapel.length > 12 && kaartDef(i.id).zeldzaamheid === "start" && kaartDef(i.id).soort === "spul"));
          return kand.length ? { soort: "verwijder", inst: kand[0].uid } : { soort: "klaar" };
        }
        case "universiteit": {
          if (st.klaar) return { soort: "klaar" };
          const kand = run.stapel.filter(i => !i.verbeterd && kaartDef(i.id).verbeterd);
          if (!kand.length) return { soort: "klaar" };
          kand.sort((a, b) => kaartScore(run, b.id) - kaartScore(run, a.id));
          return { soort: "verbeter", inst: kand[0].uid };
        }
        case "logement": case "kist": {
          if (st.klaar) return { soort: "klaar" };
          const best = st.opties.map((id, i) => ({ id, i })).sort((a, b) => kaartScore(run, b.id) - kaartScore(run, a.id))[0];
          return { soort: "kies", index: best.i };
        }
        case "seance": return st.klaar ? { soort: "klaar" } : { soort: "kies", index: run.geest > 7 ? 0 : 1 };
        case "club": return st.klaar ? { soort: "klaar" } : { soort: "kies", index: run.ponden > 40 && run.geest < run.maxGeest - 2 ? 0 : 1 };
        case "ontmoeting": {
          if (st.klaar) return { soort: "klaar" };
          const o = bib.ontmoetingen.find(x => x.id === st.ontmoeting);
          const opties = o.keuzes.map((k, i) => ({ k, i })).filter(x => !x.k.vereist?.ponden || run.ponden >= x.k.vereist.ponden);
          const sc = k => (k.uitkomst.ponden || 0) * 0.2 + (k.uitkomst.geest || 0) * (run.geest < 5 ? 2 : 0.6) + (k.uitkomst.lichaam || 0) * (run.lichaam < run.maxLichaam / 2 ? 1 : 0.3)
            + (k.uitkomst.kaart ? 4 : 0) + (k.uitkomst.artefact ? 7 : 0) + (k.uitkomst.verbeter ? 4 * k.uitkomst.verbeter : 0) + (k.uitkomst.bondgenoot ? (aantalBondgenoten(run) < 4 ? 5 : 0) : 0)
            + (k.uitkomst.gevecht ? (run.lichaam > run.maxLichaam * 0.75 ? 2 : -8) : 0) + (k.uitkomst.middeltje ? 2 : 0);
          opties.sort((a, b) => sc(b.k) - sc(a.k));
          return { soort: "kies", index: opties[0].i };
        }
      }
      return { soort: "klaar" };
    }
    case "gevecht": {
      let g = vrijeActies(run.gevecht);
      if (g !== run.gevecht) return { soort: "_vervang", g };
      return kiesActie(g);
    }
    case "beloning": {
      const b = run.beloning;
      if (!b.artefactGekozen) return { soort: "neemArtefact", index: 0 };
      if (!b.kaartGekozen) {
        const best = b.kaarten.map((id, i) => ({ id, i })).sort((x, y) => kaartScore(run, y.id) - kaartScore(run, x.id))[0];
        if (best && kaartScore(run, best.id) >= 4 && run.stapel.length < 22) return { soort: "neemKaart", index: best.i };
        return { soort: "slaOver" };
      }
      return { soort: "klaar" };
    }
  }
  return null;
}

export function speelRun(opties) {
  let run = nieuweRun(opties);
  let stappen = 0;
  while (run.fase !== "einde" && stappen++ < 5000) {
    const a = kiesRunActie(run);
    if (!a) break;
    if (a.soort === "_vervang") { run = { ...run, gevecht: a.g }; continue; }
    if (run.fase === "gevecht" && run.gevecht.beurt > 80) { run.gevecht.uitslag = "verloren"; }
    run = runActie(run, a).run;
  }
  return run;
}

/* ───────── metingen ───────── */

function procent(a, b) { return b ? Math.round((1000 * a) / b) / 10 : 0; }

function main() {
  laadData();
  const arg = process.argv.slice(2);
  const opt = n => { const i = arg.indexOf("--" + n); return i >= 0 ? arg[i + 1] : undefined; };
  const vlag = n => arg.includes("--" + n);
  const seed0 = Number(opt("seed") || 1);
  const bib = B();
  const klasseVan = id => bib.helden[id].klasse;
  const kracht = bib.data.helden.filter(h => h.speelbaar && (!opt("klasse") || h.klasse === opt("klasse"))).map(h => h.id);

  if (opt("gevechten")) {
    const n = Number(opt("gevechten"));
    let win = 0, beurten = 0, lichaam = 0;
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const held = kracht[i % kracht.length];
      const run = nieuweRun({ klasse: klasseVan(held), held, god: "vathrun", stand: opt("stand") || "normaal", seed: seed0 + i });
      const def = huidigGedeelte(run).gevecht;
      const g = speelGevecht(maakGevecht(run, def));
      if (g.uitslag === "gewonnen") { win++; lichaam += g.eenheden[g.held].leven / g.eenheden[g.held].maxLeven; }
      beurten += g.beurt;
    }
    console.log(`${n} eerste gevechten: ${procent(win, n)}% gewonnen, gemiddeld ${(beurten / n).toFixed(1)} beurten, ${Math.round(100 * lichaam / Math.max(1, win))}% Lichaam over (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    return;
  }

  const n = Number(opt("runs") || 100);
  const standen = opt("stand") ? [opt("stand")] : ["ontspannen", "normaal", "genadeloos"];
  const helden = opt("held") ? [opt("held")] : kracht;
  const resultaat = { datum: new Date().toISOString().slice(0, 10), runsPerStand: n, standen: {} };
  for (const stand of standen) {
    const r = { win: 0, n: 0, perHeld: {}, verlorenIn: {}, perAkte: [0, 0, 0], beurten: 0, gevechten: 0, kaartenInWinst: {} };
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const held = helden[i % helden.length];
      const run = speelRun({ klasse: klasseVan(held), held, god: "vathrun", stand, seed: seed0 + i * 7919 });
      const ph = (r.perHeld[held] ??= { win: 0, n: 0 });
      r.n++; ph.n++;
      r.beurten += run.stats.beurten; r.gevechten += run.stats.gevechten;
      if (run.uitslag === "gewonnen") {
        r.win++; ph.win++;
        for (const i of run.stapel) r.kaartenInWinst[i.id] = (r.kaartenInWinst[i.id] || 0) + 1;
      } else {
        r.verlorenIn[run.stats.verlorenIn] = (r.verlorenIn[run.stats.verlorenIn] || 0) + 1;
        r.perAkte[run.pos.akte] = (r.perAkte[run.pos.akte] || 0) + 1;
      }
      if (vlag("uitleg") && i < 3) console.log(`  run ${i}: ${held} ${run.uitslag} in akte ${run.pos.akte + 1}, ${run.stats.gevechten} gevechten, stapel ${run.stapel.length}, ${run.artefacten.join(",")}`);
    }
    const uit = {
      winkans: procent(r.win, r.n),
      perHeld: Object.fromEntries(Object.entries(r.perHeld).map(([h, x]) => [h, procent(x.win, x.n)])),
      perKlasse: Object.fromEntries(["kennis", "waarneming", "kracht", "charisma"].map(k => {
        const l = Object.entries(r.perHeld).filter(([h]) => klasseVan(h) === k);
        const w = l.reduce((a, [, x]) => a + x.win, 0), t = l.reduce((a, [, x]) => a + x.n, 0);
        return [k, t ? procent(w, t) : null];
      }).filter(([, v]) => v != null)),
      verlorenPerAkte: r.perAkte.map(x => procent(x, r.n)),
      verlorenIn: Object.fromEntries(Object.entries(r.verlorenIn).sort((a, b) => b[1] - a[1]).slice(0, 8)),
      beurtenPerGevecht: +(r.beurten / Math.max(1, r.gevechten)).toFixed(1),
      gevechtenPerRun: +(r.gevechten / r.n).toFixed(1),
      vaakstInWinst: Object.fromEntries(Object.entries(r.kaartenInWinst).sort((a, b) => b[1] - a[1]).slice(0, 10)),
    };
    resultaat.standen[stand] = uit;
    console.log(`${stand}: ${uit.winkans}% gewonnen (${r.n} runs, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    console.log(`  per klasse: ${Object.entries(uit.perKlasse).map(([k, w]) => `${k} ${w}%`).join(", ")}`);
    console.log(`  per held: ${Object.entries(uit.perHeld).map(([h, w]) => `${h} ${w}%`).join(", ")}`);
    console.log(`  verloren in akte 1/2/3: ${uit.verlorenPerAkte.join("% / ")}%   beurten per gevecht ${uit.beurtenPerGevecht}`);
    console.log(`  vaakst verloren in: ${Object.entries(uit.verlorenIn).map(([k, v]) => `${k} (${v})`).join(", ")}`);
  }
  if (vlag("schrijf")) {
    fs.writeFileSync(path.join(root, "ontwerp/balans.json"), JSON.stringify(resultaat, null, 1) + "\n");
    console.log("Geschreven naar ontwerp/balans.json");
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) main();
export const __kies = r => kiesRunActie(r);
