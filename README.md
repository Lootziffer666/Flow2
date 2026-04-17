# LOOM · FLOW · SPIN · SMASH

Nicht-generatives Schreibökosystem für **Reparatur**, **Strukturwahrnehmung** und **Entblockung**.

## Portfolio in einem Satz

**LOOM strukturiert, FLOW stabilisiert, SPIN macht sichtbar, SMASH bringt zurück in Bewegung.**

---

## Produktlogik

| Ebene | Rolle | Kernfrage |
|---|---|---|
| **LOOM** | Sprach- und Strukturengine | Womit habe ich es strukturell zu tun? |
| **FLOW** | Reparatur- und Normalisierungsschicht | Wo stört Oberflächenreibung das Schreiben? |
| **SPIN** | Arbeitsoberfläche für Ausdruck & Leselast | Wo kippen Rhythmus, Last, Wiederholung, Struktur? |
| **SMASH** | Entblockungsschicht für Schreibfähigkeit | Wie komme ich aus Stillstand zurück in Handlung, ohne Textübernahme? |

---

## Architektur (Monorepo-Realität)

> Aktuell liegt der technische Engine-Kern in `packages/shared`.
> Fachlich ist diese Schicht im Portfolio als **LOOM** definiert.

```text
packages/shared  (= LOOM-Kern, aktuell)
      ├─ clauseDetector
      ├─ contextWindowRules
      ├─ confidenceFilter
      ├─ phoneticSimilarity
      └─ rules.gr

packages/flow    (Normalisierung, SN→SL→MO→PG + Runtime/Lab)
packages/spin    (Ausdrucks- und Strukturwahrnehmung)
packages/smash   (Mikrointerventionen gegen Blockade, mit schneller Rückführung in Text)
```

---

## Prinzipien

- **nicht-generativ**: kein Ghostwriting, keine verdeckte Textübernahme
- **Diagnose vor Ersetzung**
- **deterministisch und erklärbar**
- **Trennung der Problemklassen** statt Einheits-Score
- **Mensch bleibt Autor**

---

## Quick Start

```bash
npm install
npm test

# FLOW CLI
node packages/flow/src/loom_cli.js "ich hab das gestern gelsen"
```

---

## Readmes pro Produkt

- [`packages/flow/README.md`](packages/flow/README.md)
- [`packages/spin/README.md`](packages/spin/README.md)
- [`packages/smash/README.md`](packages/smash/README.md)

---

## Strategische Dokumente

- [`docs/architecture/Monorepo.md`](docs/architecture/Monorepo.md)
- [`docs/product/Portfolio.md`](docs/product/Portfolio.md)
