// De kleine bibliotheek van effectsoorten. Effecten zijn data: { doe, aantal, op, status, ... }.
// Zie ontwerp/woordenlijst.md voor de betekenis van de woorden.
import { kies } from "./toeval.js";
import {
  treffer, geefStatus, veranderTeller, genees, veranderGeest, veranderLichaam, trek, roepOp,
  eenhedenVan, rijVan, eenheidOp, levend, ev, snap, andereKant,
} from "./gevecht.js";

export const EFFECTSOORTEN = [
  "schade", "gruwel", "status", "teller", "genees", "geest", "lichaam", "trek", "ponden", "aanval",
  "oproepen", "verwijder", "bigben", "schroot", "aanwijzing", "overtuigen",
];

export const DOELWOORDEN = [
  "doel", "held", "zelf", "eigen-rij", "alle-eigen", "alle-bondgenoten", "vijand-rij", "alle-vijanden",
  "willekeurige-vijand", "voorste-vijand", "buren", "achter", "geen",
];

/** Welke eenheden een effect raakt. `ctx.kant` is de kant van wie het effect veroorzaakt. */
export function kiesDoelen(g, op, ctx) {
  const eigen = ctx.kant, ander = andereKant(eigen);
  const plekVan = ctx.doel || ctx.bron;
  switch (op) {
    case "doel": return ctx.doel ? [ctx.doel] : [];
    case "held": return g.held && g.eenheden[g.held] ? [g.eenheden[g.held]] : [];
    case "zelf": return ctx.bron ? [ctx.bron] : [];
    case "eigen-rij": {
      if (!plekVan) return [];
      const kant = plekVan.kant, rij = rijVan(g, plekVan);
      return eenhedenVan(g, kant).filter(u => rijVan(g, u) === rij || u.groot);
    }
    case "vijand-rij": {
      const d = ctx.doel; if (!d) return [];
      const rij = rijVan(g, d);
      return eenhedenVan(g, d.kant).filter(u => rijVan(g, u) === rij || u.groot);
    }
    case "alle-eigen": return eenhedenVan(g, eigen);
    case "alle-bondgenoten": return eenhedenVan(g, eigen).filter(u => u.uid !== g.held);
    case "alle-vijanden": return eenhedenVan(g, ander);
    case "willekeurige-vijand": { const l = eenhedenVan(g, ander); return l.length ? [kies(g, l)] : []; }
    case "voorste-vijand": { const l = eenhedenVan(g, ander); return l.length ? [l[0]] : []; }
    case "buren": {
      const d = ctx.doel; if (!d || !d.vak) return [];
      const { rij, plek } = d.vak, andereRij = rij === "straat" ? "riool" : "straat";
      return [eenheidOp(g, d.kant, rij, plek - 1), eenheidOp(g, d.kant, rij, plek + 1), eenheidOp(g, d.kant, andereRij, plek)]
        .filter(u => u && u.uid !== d.uid);
    }
    case "achter": {
      const d = ctx.doel; if (!d || !d.vak) return [];
      for (let p = d.vak.plek + 1; p < 3; p++) { const u = eenheidOp(g, d.kant, d.vak.rij, p); if (u) return [u]; }
      return [];
    }
    default: return [];
  }
}

export function voerUit(g, effecten, ctx) {
  for (const e of effecten || []) {
    if (g.uitslag) return;
    const doelen = kiesDoelen(g, e.op || "doel", ctx).filter(levend);
    const n = e.aantal ?? 0;
    switch (e.doe) {
      case "schade":
      case "gruwel":
        for (let k = 0; k < (e.keer || 1); k++) {
          for (const d of kiesDoelen(g, e.op || "doel", ctx).filter(levend)) {
            let s = e.doe === "schade" ? n : 0;
            if (e.extraMens && d.mens) s += e.extraMens;
            if (e.extraMonster && !d.mens && d.kant === "vijand") s += e.extraMonster;
            treffer(g, ctx.bron, d, s, e.doe === "gruwel" ? n : (e.gruwel || 0), { kaart: ctx.kaart });
          }
        }
        break;
      case "status": for (const d of doelen) geefStatus(g, d, e.status, n); break;
      case "teller": for (const d of doelen) veranderTeller(g, d, n); break;
      case "genees": for (const d of doelen) genees(g, d, n); break;
      case "geest": veranderGeest(g, n); break;
      case "lichaam": veranderLichaam(g, n); break;
      case "trek": trek(g, n); break;
      case "ponden": g.buit += n; ev(g, { t: "ponden", aantal: n }); break;
      case "aanval":
        for (const d of doelen) if (d.aanval != null) { d.aanval = Math.max(0, d.aanval + n); ev(g, { t: "aanval", uid: d.uid, e: snap(d) }); }
        break;
      case "oproepen": for (let k = 0; k < (e.keer || 1); k++) roepOp(g, e.kaart, e.kant === "ander" ? andereKant(ctx.kant) : ctx.kant, ctx.bron ? rijVan(g, ctx.bron) : "straat"); break;
      case "verwijder":
        for (const d of doelen) {
          const lijst = e.status === "negatief" ? ["mist", "pest", "vervloekt", "inkt", "bekoring", "angst"] : [].concat(e.status);
          for (const s of lijst) d.statussen[s] = 0;
          ev(g, { t: "status", uid: d.uid, e: snap(d) });
        }
        break;
      case "bigben":
        if (g.golven.length > g.golfNr) { g.bigben = Math.max(1, g.bigben + n); ev(g, { t: "bigben", waarde: g.bigben }); }
        break;
      case "schroot":
        for (const d of doelen) if (d.schroot != null) { d.schroot = Math.min(d.maxSchroot, d.schroot + n); ev(g, { t: "genees", uid: d.uid, aantal: n, e: snap(d) }); }
        break;
      case "aanwijzing": g.aanwijzingen = (g.aanwijzingen || 0) + n; ev(g, { t: "aanwijzing", aantal: n }); break;
      case "overtuigen": break; // komt met de klasse Charisma
      default: throw new Error(`Onbekende effectsoort: ${e.doe}`);
    }
  }
}
