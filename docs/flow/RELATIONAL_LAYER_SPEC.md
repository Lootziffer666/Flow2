# FLOW/LOOM Relational Layer — Architekturspezifikation

**Status:** ENTWURF — kanonische Referenz für die BindingGraph-Architektur.
**Datum:** 2026-04-18
**Geltungsbereich:** packages/loom/src/, packages/flow/src/
**Bindend:** Ja. Neue Implementierungen, die den Beziehungslayer berühren, orientieren
sich an diesem Dokument, nicht an impliziten Konventionen im Code.

---

## 1. Ausgangspunkt und Fehlerquelle

FLOW wurde nicht als Token-Korrektorsystem konzipiert.
Der Ursprungsgedanke — aus der Arbeit mit SPIN/Flammi entstanden — ist,
dass sprachliche Elemente umgestellt werden können, ohne ihre Funktion zu
zerstören. Ein Adverb muss mit seinem Verb "verknotet" sein. Diese Bindung
ist elastisch: andere Elemente können sich dazwischen schieben, aber die
funktionale Relation darf nicht zerstört werden.

Das ist kein Dokumentationszweck. Es ist ein Architekturprinzip.

Der aktuelle Stand (HEAD `412c96b`) implementiert dieses Prinzip nicht:
- `chunker.js` erzeugt funktionale Einheiten, aber keine Bindungsobjekte.
- `ruleEngine.js` arbeitet auf dem rohen String, vor jeder relationalen Analyse.
- `signalLayer.js` liefert Skalarsignale über den Satz, keine Bindungsstruktur.
- Normalisierung findet vor Strukturmodellierung statt.

Das ist die Fehlerquelle, nicht ein Implementierungsdetail.

---

## 2. Kernprinzipien

Diese Prinzipien sind nicht verhandelbar. Sie gelten als Architekturvorgabe.

**P1 — Primäre Arbeitsebene sind Bindungen, nicht Tokens.**
Token-Grenzen sind eine mögliche Oberflächensegmentierung. Sie sind eine
Hypothese über die Struktur, nicht die Struktur selbst.

**P2 — Bindungen sind persistent, auch wenn die Oberfläche beschädigt ist.**
Getrennte, verschmolzene, phonetisch verzerrte oder fehlende Tokens ändern
die Bindungsstruktur nicht automatisch. Die Bindung zwischen einem Adverb-LO
und einem Prädikat-LO bleibt bestehen, auch wenn das Adverb im Satz
verschoben ist.

**P3 — Normalisierung ist ein Commit-Schritt, kein erster Schritt.**
Annotieren, Segmentieren und Binden dürfen früher stattfinden als
Normalisieren. Ein Linguistic Object (LO) kann eine unnormalisierte
Oberfläche haben und trotzdem in einer vollständigen Bindungsstruktur
eingebettet sein.

**P4 — Grammatik ist teilweise in Bindungen enthalten.**
Subject-Verb-Agreement, Kasuskongruenz, Subordinationsrahmen sind keine
nachgelagerten Regelprüfungen — sie sind Eigenschaften von Bindings.

**P5 — Ein kleineres Regelwerk ist das Ziel.**
Mehr Regex-Regeln sind nicht der Fortschritt. Ein stärkerer BindingGraph
reduziert den Regelwerk-Bedarf, weil Kontextinformation bereits in der
Bindungsstruktur verfügbar ist.

---

## 3. Kernobjekte

### 3.1 LinguisticObject (LO)

Ein LO ist eine funktionale Einheit — nicht notwendigerweise token-aligniert.

```
LinguisticObject {
  id:          string              // stabile ID, unabhängig von Token-Position
  type:        LOType              // Subject | Predicate | Object |
                                   // Adjunct | Connective | Fragment | Unknown
  span: {
    start:      int,               // Zeichenposition in surface
    end:        int,
    confidence: float              // 0.0–1.0; < 1.0 = Grenzen unsicher
  }
  surface:     string              // Rohform, unnormalisiert
  normalized:  string | null       // null = Commit noch nicht erfolgt
  tags:        string[]            // heuristische Labels (POS, Chunk-Typ)
  committed:   bool                // false = Normalisierungsentscheidung offen
}
```

`span.confidence < 1.0` bedeutet: die Grenzen dieses LOs auf der Oberfläche
sind unsicher. Dies tritt auf bei:
- fehlendem Token (Auslassung)
- verschmolzenen Tokens (fehlende Worttrennung)
- phonetisch verzerrter Form (Buchstabe fehlt oder substituiert)

Die Bindungsstruktur dieses LOs bleibt evaluierbar, auch wenn `confidence < 1.0`.

Erlaubte LOType-Werte:
- `Subject` — Handlungsträger / grammatisches Subjekt
- `Predicate` — Verbalkomplex (finite Form + Hilfsverben)
- `Object` — direktes oder indirektes Objekt
- `Adjunct` — Adverbiale, Modalpartikeln, funktional dem Prädikat zugeordnet
- `Connective` — Konjunktionen, Relationen, Subordinatoren
- `Fragment` — kein erkennbarer Prädikatskern, unvollständige Struktur
- `Unknown` — nicht klassifizierbar mit aktueller Evidenz

### 3.2 Binding

Ein Binding ist ein explizites Objekt zwischen zwei LOs. Es ist kein Attribut
eines LOs, sondern ein eigenständiges Objekt im BindingGraph.

```
Binding {
  id:          string
  source:      LO.id
  target:      LO.id
  type:        BindingType
  strength:    float               // 0.0–1.0: Stärke der funktionalen Relation
  elasticity:  float               // 0.0–1.0: erlaubte Oberflächenverschiebung
  uncertainty: float               // 0.0–1.0: Unsicherheit über die Bindung selbst
  committed:   bool
}
```

Erlaubte BindingType-Werte:
- `agreement`      — grammatische Kongruenz (Numerus, Person, Kasus)
- `modification`   — ein LO modifiziert oder spezifiziert ein anderes
- `subordination`  — Hauptklausel ↔ Nebensatz
- `coordination`   — gleichrangige Verknüpfung
- `reference`      — anaphorische oder kataphorische Verweisung

**Elastizität ist kein Qualitätswert, sondern ein Strukturwert:**

| Bindungsbeispiel | Elastizität | Bedeutung |
|---|---:|---|
| Artikel → Nomen | 0.0 | starr; Trennung = Bindungsverletzung |
| Subjekt → Prädikat | 0.2 | wenig elastisch; Inversion erlaubt |
| Adverb → Prädikat | 0.6 | elastisch; andere Tokens dazwischen erlaubt |
| Modalpartikel → Satz | 0.9 | sehr elastisch; Position variabel |

### 3.3 BindingGraph

```
BindingGraph {
  id:          string
  surface:     string              // Originaltext, unverändert
  lang:        string
  lo_index:    Map<id, LinguisticObject>
  bindings:    Binding[]
}
```

Der BindingGraph ist nicht abhängig von:
- einem externen Dependency-Parser
- CoNLL-U-Annotation
- vollständig normalisierter Oberfläche

Er wird aus dem Chunker-Output aufgebaut. Er ist der primäre Arbeitskontext
für alle nachgelagerten Operationen in FLOW und LOOM.

---

## 4. Bindungsauswertungen (keine neuen Typen)

Diese sind Auswertungen des BindingGraphs, keine neuen Objektklassen:

**RepairHypothesis**
`{ lo_id, candidate_surface, confidence }`
Hypothese: dieses LO sollte auf `candidate_surface` normalisiert werden.
Confidence gibt die Sicherheit dieser Hypothese an, nicht die Stärke der Bindung.

**CommitDecision**
`{ lo_id, normalized_surface, reason }`
Tatsächlicher Normalisierungsschritt. Wird nur dann ausgeführt, wenn die
Bindungsstruktur des LOs stabil ist und die Hypothese hinreichend sicher ist.

**BindingViolation**
`{ binding_id, violation_type, detected_at }`
Strukturelles Signal: eine Binding ist verletzt. Kann Anlass für eine
RepairHypothesis sein, muss aber nicht.

---

## 5. Verhältnis zur aktuellen Implementierung

### 5.1 packages/loom/src/chunker.js

**Aktueller Stand:** `buildChunks()` gibt `chunks[]` zurück — funktionale
Einheiten mit `tokenIds`, aber ohne Bindungsobjekte zwischen ihnen.

**Notwendige Erweiterung:**
`buildChunks()` muss zusätzlich `bindings[]` zurückgeben. Die impliziten
Bindungen sind im Code bereits vorhanden (Schritt 4–7 in `buildChunks`):

```
subject → predicate : agreement,   strength 0.95, elasticity 0.2
predicate → object  : modification, strength 0.85, elasticity 0.3
ornament → predicate: modification, strength 0.55, elasticity 0.7
relation → predicate: subordination, strength 0.80, elasticity 0.1
```

Diese müssen als Binding-Objekte surfaced werden, nicht nur Code-intern
gehalten werden.

### 5.2 packages/loom/src/signalLayer.js

**Aktueller Stand:** `flowSignals()` liefert Skalare über den ganzen Satz
(`sentenceComplexity`, `confidenceHint`, `isMulticore`). Diese werden in
`ruleEngine.js` nur zur Confidence-Gating verwendet.

**Notwendige Erweiterung:** `flowSignals()` oder eine parallele Funktion
`buildBindingGraph(sentence, lang)` muss den vollständigen BindingGraph
zurückgeben, nicht nur Skalarsignale.

### 5.3 packages/flow/src/ruleEngine.js

**Aktueller Stand:** `runNormalizationWithMetadata()` empfängt `loomSignals`
(Skalare), wendet Regex-Substitutionen auf den String an, gibt korrigierten
String + rule_hits zurück.

**Notwendige Erweiterung:** Der BindingGraph muss durch die Pipeline
durchgereicht werden. Korrekturen, die LO-Grenzen verändern (Token-Split,
Token-Merge), müssen den BindingGraph aktualisieren. Korrekturen, die eine
Binding berühren (z.B. Subjekt-Prädikat-Agreement-Reparatur), müssen die
betroffene Binding neu evaluieren.

Das bedeutet NICHT, dass alle Korrekturen auf Binding-Ebene erfolgen müssen.
Sichere, binding-neutrale Korrekturen (Tippfehler-Fixes, die keine Struktur
berühren) können weiterhin regex-basiert sein.

### 5.4 packages/flow/src/rules.*.js

Neue Regeln dürfen nur hinzugefügt werden, wenn:
a) sie binding-neutral sind (die Korrektur berührt keine Bindung), oder
b) der BindingGraph verfügbar ist und die Regel binding-sensitiv formuliert ist.

Regeln, die eine relationale Entscheidung erfordern, aber in Regex-Form
formuliert sind, sind technische Schulden, keine Verbesserungen.

---

## 6. Was dieser Layer nicht ist

- Kein "optionaler Zusatz" für Graph-Metriken. Er ist die primäre Arbeitsebene.
- Kein Wrapper um CoNLL-U. Er ist unabhängig davon erzeugbar.
- Kein Größer-Regelwerk. Er ist der Mechanismus, der das Regelwerk kleiner macht.
- Keine nachgelagerte Grammatikprüfung. Grammatische Constraints sind Eigenschaften
  von Bindings, keine Post-hoc-Prüfungen.

---

## 7. Konkrete nächste Schritte (dependency-geordnet)

1. `loom/src/chunker.js`: `buildChunks()` gibt `{ chunks, bindings }` zurück.
   Bindungsobjekte mit den Standardwerten aus §5.1.

2. `loom/src/index.js`: Exportiere `buildBindingGraph(sentence, lang) → BindingGraph`.

3. `loom/test/test_binding_graph.js`: Mindest-Testabdeckung:
   - Dass jeder Chunk eine oder mehr Bindings hat.
   - Dass Bindings bidirektional traversierbar sind.
   - Dass `elasticity`-Werte in den definierten Bereichen liegen.
   - Dass ein unnormalisiertes LO (`committed: false`) in einer vollständigen
     Bindungsstruktur eingebettet sein kann.

4. `flow/src/ruleEngine.js`: `runNormalizationWithMetadata()` empfängt und
   gibt optional `binding_graph` zurück.

5. Keine neuen regex-Regeln für binding-sensitive Entscheidungen, bis 1–4 fertig.
