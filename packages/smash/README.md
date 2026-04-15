# SMASH — Entblockungsschicht für Schreibfähigkeit

SMASH ist ein Tool zur Unterbrechung von Schreibblockaden.
Es soll **nicht schreiben**, sondern dabei helfen, wieder **schreibfähig** zu werden.

Der Kernansatz ist: **Intervention statt Ersetzung**.

---

## Problemverständnis

„Schreibblockade“ ist kein einheitlicher Zustand.
Hinter Stillstand können unterschiedliche Ursachen liegen, z. B.:

- kein Zugriff auf die nächste Idee
- Überlastung durch zu viele Möglichkeiten
- Perfektionismus-Schleifen
- Verlust des roten Fadens
- festgefahrener Satz/Absatz
- mentaler Leerlauf trotz Schreibbereitschaft

SMASH behandelt diese Zustände als **unterschiedliche Blockadetypen**, die unterschiedliche Interventionen brauchen.

---

## Produktziel

SMASH bietet kurze, gezielte Interventionsmechaniken, die:

- Blockadezustände aufbrechen
- Reibung senken
- Handlung wiederherstellen
- nicht vom eigentlichen Schreiben wegführen
- keine Autorschaft übernehmen

---

## Rolle im Ökosystem

- **LOOM** hilft beim Erkennen von Zustandsmustern.
- **FLOW** reduziert frühe formale Reibung.
- **SPIN** macht Ausdrucks- und Strukturprobleme sichtbar.
- **SMASH** greift dort ein, wo Schreiben trotzdem festhängt.

SMASH ist damit keine Konkurrenz zu SPIN, sondern eine Rückführungs- und Entlastungsschicht.

---

## Kernfunktionen

1. **Mikrointerventionen**
   Sehr kurze Interventionen mit klarer Rückkehr in den Text.

2. **Blockadetyp-nahe Auswahl**
   Auswahl nach vermutetem Zustand statt Einheitslogik.

3. **Rückführungsmechanik**
   Der Weg zurück in Text/SPIN ist zentral und leicht.

4. **Signalschnittstellen (perspektivisch)**
   Nutzung von LOOM-/SPIN-Signalen zur präziseren Interventionswahl.

### Aktueller technischer Stand der Signalschnittstelle

In `src/signalBridge.js` ist ein minimaler LOOM→SMASH-Vertrag umgesetzt:

- `state_hint`
- `blockage_hint`
- optional `text_ref`

Die Bridge routet Signale in eine `smash-intake` Queue und protokolliert append-only.
Sie trifft **keine** Interventionsentscheidung selbst.

---

## In Scope

- kurze zustandsnahe Interventionen
- frictionless Einstieg
- klare Rückführung in den Schreibprozess
- Messung: wird nach Intervention wieder geschrieben?

## Out of Scope

- AI-Writer / Textgenerator
- Promptgenerator
- Casual-Game-Sammlung
- Produktivitäts-Tracker
- Schreibkurs-Ersatz
- Dauerbeschäftigung statt Rückführung

---

## Status

Aktuell Prototyping-Phase (`smash_html_pack/`) mit kuratierbarer Interventionsbibliothek.
