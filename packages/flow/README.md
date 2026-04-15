# FLOW

FLOW ist die **Reparatur- und Normalisierungsschicht** des Ökosystems.

FLOW stabilisiert Texte an der Oberfläche, ohne Stil oder Autorschaft zu übernehmen.

## Rolle im System

- **LOOM** liefert Struktur- und Kontextsignale.
- **FLOW** repariert deterministisch (bounded repair).
- **SPIN** übernimmt Ausdrucks- und Leselastarbeit.
- **SMASH** greift bei Blockadezuständen.

## In Scope

- orthografische Normalisierung
- LRS-nahe Fehlerbehandlung
- SN → SL → MO → PG Pipeline
- Protected Spans (z. B. URLs, Code, technische Tokens)
- lernbare Ausnahmen / Kontextregeln
- lokale und nachvollziehbare Regelanwendung

## Out of Scope

- freier Stilrewrite
- generative Paraphrase
- strukturelle Tiefendiagnostik als Primärlogik (LOOM)
- Leselast-/Rhythmusdiagnose (SPIN)

## Kernprinzip

**Gleiche Eingabe → gleiche Ausgabe.**

## Einstieg

```bash
# im Repo-Root
npm install

# FLOW Tests
npm test -w packages/flow

# FLOW CLI
node packages/flow/src/loom_cli.js "ich hab das gestern gelsen"
```

