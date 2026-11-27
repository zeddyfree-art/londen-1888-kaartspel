// De ontvangstkamer toont de drie vrijgespeelde starthelden als geïllustreerde kaarten.
import { el, bg, ICOON } from "./gemeen.js";
import { B } from "../motor/bibliotheek.js";

const lijnIcoon = p => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const MERK = lijnIcoon('<path d="M12 1 23 12 12 23 1 12Z"/><path d="M4 12q8-10 16 0-8 10-16 0Z"/><circle cx="12" cy="12" r="2.5"/>');
const kaarten = lijnIcoon('<rect x="8" y="4" width="12" height="16" rx="1.5"/><path d="m6 6-3 1 3 15 9-2m-1-12 3 4-3 4-3-4Z"/>');
const boek = lijnIcoon('<path d="M12 6C8 3 5 4 2 4v14c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7 0-10 2Zm0 0v14"/>');
const rad = lijnIcoon('<path d="M9.8 3h4.4l.6 2.4 2 .9 2.1-1.1 2.2 3.8-1.7 1.7v2.6l1.7 1.7-2.2 3.8-2.1-1.1-2 .9-.6 2.4H9.8l-.6-2.4-2-.9-2.1 1.1-2.2-3.8 1.7-1.7v-2.6L2.9 9l2.2-3.8 2.1 1.1 2-.9Z"/><circle cx="12" cy="12" r="3"/>');
const icoon = html => el("span", { class: "kamer-icoon", html, "aria-hidden": "true" });

function portret(id) {
  const h = B().helden[id];
  return el("div", { class: "vitrinekaart", style: { backgroundImage: bg(h.art) } },
    el("div", { class: "kaartgravure" }),
    el("div", { class: "kaartonderschrift" }, el("small", {}, h.rol), el("strong", {}, h.naam.replace(/^(Sergeant|Lady|Miss|Professor|Dr\.) /, "")),
      el("span", { class: "kaartstreep" }, "✦")));
}

export function speelkamer(app, acties, laatsteNieuws, bewaard) {
  const deur = (titel, tekst, pad, open) => el("button", { class: "kamerdeur", onclick: open },
    el("span", { class: "deurprent", style: { backgroundImage: bg(pad) } }),
    el("span", { class: "deurtekst" }, el("strong", {}, titel), el("small", {}, tekst)));
  app.replaceChildren(el("main", { class: "scherm speelkamer" },
    el("header", { class: "kamerkop" },
      el("div", { class: "kamermerk" }, icoon(MERK), "Londen 1888"),
      el("div", { class: "kamergereedschap" },
        el("button", { onclick: acties.muziek, title: "Muziek", "aria-label": "Muziek" }, icoon(ICOON.muziek), el("span", {}, "Muziek")),
        el("button", { onclick: acties.instellingen, title: "Instellingen", "aria-label": "Instellingen" }, icoon(rad), el("span", {}, "Instellingen")))),
    el("section", { class: "nacht" },
      el("div", { class: "nachtprent", style: { backgroundImage: bg("scherm/titel-kaartspel.jpg") } }),
      el("div", { class: "nachtinhoud" },
        el("div", { class: "nachttekst" },
          el("div", { class: "rubriek" }, "Het kaartspel"),
          el("h1", {}, "Londen ", el("em", {}, "1888")),
          el("p", {}, "De mist kruipt uit de Theems. Kies je held, stel je stapel samen en overleef de nacht."),
          el("div", { class: "nachtacties" },
            el("button", { class: "knop koper", onclick: bewaard ? acties.hervat : acties.nieuw }, icoon(kaarten), bewaard ? "Hervat de nacht" : "Begin de nacht"),
            el("button", { class: "knop glas", onclick: bewaard ? acties.nieuw : acties.oefen }, icoon(bewaard ? kaarten : boek), bewaard ? "Nieuwe run" : "Oefengevecht"))),
        el("div", { class: "vitrine", "aria-label": "Helden van vier klassen" },
          portret("violet-thorne"), portret("tobias-hale"), portret("cordelia-vane")))),
    el("nav", { class: "kamerdeuren", "aria-label": "Meer aan de speeltafel" },
      deur("Hoofdkwartier", "Helden en voortgang", "scherm/hoofdkwartier.jpg", acties.hoofdkwartier),
      deur("Spelregels", "Leer de kaarten spelen", "spreuken/tarot.jpg", acties.regels),
      deur("Wat is er nieuw", laatsteNieuws?.titel || "Nieuws over het spel", "spullen/boek-reisverslag.jpg", acties.nieuws))));
}
