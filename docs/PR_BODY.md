## Motivation

Dieser PR implementiert den deterministischen FLOW-MVP-Normalizer für orthografische Normalisierung nach ZH1 über vier linguistische Ebenen:

**SN → SL → MO → PG**

Ziel ist ein kleiner, testbarer Regelkern, der typische LRS-Orthografiefehler korrigiert.

## Änderungen

Relevante Dateien:

- `ruleEngine.js`
- `rules.sn.js`
- `rules.sl.js`
- `rules.mo.js`
- `rules.pg.js`
- `pipeline.js`
- `test_normalization.js`

Umsetzung:

- Regelanwendung erfolgt deterministisch in fester Reihenfolge: **SN → SL → MO → PG**
- Danach werden `normalizeWhitespace()` und `normalizeSentenceStarts()` angewendet
- `pipeline.js` nutzt `runCorrection(text)` → `runNormalization(text)`
- Rückgabewert ist ausschließlich `{ corrected }`

## Tests

Regressionstest:

- `test_normalization.js`
- nutzt `assert.equal()`
- prüft den vollständigen Stack:

`runCorrection → runNormalization`

## Beispiel

**Input**

`ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind`

**Output**

`Ich habe das gestern gelesen und dachte, dass wir vielleicht schon fertig sind`

## Risiken / Einschränkungen

- Regelbasis bewusst klein (MVP)
- keine semantische Interpretation
- keine grammatische Korrektur über Orthografie hinaus
- keine Kontextmodelle
- System arbeitet ausschließlich deterministisch

## Nächste Schritte

- Erweiterung der Regelbasis
- Benchmark-Runner
- Integration größerer Testdatensätze
- automatische Evaluation (ScoreDock / LAB)
