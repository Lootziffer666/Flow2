# Was macht FLOW besonders? – Vergleich mit anderen Tools

> **Wichtige Einordnung:** FLOW ist keine eigenständige Sprachengine, sondern eine
> **Anwendungsschicht**, die auf der übergeordneten Engine **LOOM** basiert.
> Der Vergleich mit Tools wie LanguageTool gilt daher nicht für FLOW allein,
> sondern für das Gesamtsystem **SPIN + FLOW**.
> Dieses Verhältnis wird in Abschnitt 0 erklärt, bevor FLOW selbst charakterisiert wird.

---

## 0 Das Ökosystem: LOOM, SPIN und FLOW

### 0.1 LOOM – die übergeordnete Sprachengine

**LOOM** ist das eigentliche diagnostische Sprachinstrument.
Es zerlegt Sätze in **Bedeutungs-Chunks** (Subjekt, Prädikat, Objekt, Relation, Zustand u. a.), klassifiziert Strukturzustände und liefert erklärbare Signale für FLOW, SPIN und SMASH.

LOOM ist ausdrücklich **kein Korrektor**.
LOOM schreibt nicht, bewertet nicht und schlägt keine Texte vor.
Sein Ziel: Struktur diagnostisch erfassen, damit Oberprodukte gezielt und begrenzt arbeiten.

### 0.2 SPIN – operative Arbeitsoberfläche auf LOOM

**SPIN** bleibt die visuelle und operative Analysefläche (Leselast, Rhythmus, Wiederholung, Varianten), konsumiert aber LOOM-Signale statt selbst Engine-Primärlogik zu sein.

### 0.3 FLOW – abgeleitet von LOOM

**FLOW** ist eine aus LOOM hergeleitete **Normalisierungsschicht**, die sich auf einen spezifischen Anwendungsfall konzentriert: die orthografische Korrektur für Menschen mit Lese-Rechtschreib-Schwäche (LRS).

```
┌──────────────────────────────────────────────────────────┐
│  LOOM – Strukturdiagnose-Engine                          │
│  Chunking · State-Layer · Re-Render · Signalableitung    │
└──────────────────────┬───────────────────────────────────┘
                       │ liefert Basis-Konzepte und Engine
┌──────────────────────▼───────────────────────────────────┐
│  SPIN – Arbeitsoberfläche                                │
│  Leselast · Rhythmus · Varianten · Visualisierung        │
└──────────────────────┬───────────────────────────────────┘
                       │ konsumiert LOOM-Signale
┌──────────────────────▼───────────────────────────────────┐
│  FLOW – Orthografische Normalisierungsschicht            │
│  SN → SL → MO → PG · Keyboard-Hook · Lernregeln         │
└──────────────────────────────────────────────────────────┘
```

FLOW übernimmt von LOOM:
- das deterministische, regelbasierte Paradigma (kein LLM, kein generativer Output)
- den Grundsatz der Transparenz (jede Änderung ist auf eine Regel zurückführbar)
- den Datenschutz-Grundsatz (vollständig lokal, keine Cloud-Aufrufe)

FLOW fügt hinzu:
- die systemweite Echtzeit-Korrektur via Windows-Keyboard-Hook
- die LRS-spezifische Vierstufen-Pipeline (SN → SL → MO → PG)
- die sofortige Lernfähigkeit über `flow_rules.json`

### 0.4 Konsequenz für den Toolvergleich

| Vergleichsobjekt | FLOW allein | SPIN + FLOW |
|-----------------|-------------|-------------|
| LanguageTool | Nein – FLOW adressiert nur LRS-Orthografie, nicht allgemeine Grammatik | Ja – zusammen decken sie Strukturdiagnose + Rechtschreibkorrektur ab |
| Grammarly | Nein | Annähernd – mit dem Unterschied: kein generativer Output, kein Cloud-Zwang |
| Word AutoCorrect | Teilweise – systemweit, aber spezialisierter | Ja – mit deutlich tieferer linguistischer Grundlage |

---

## 1 Was macht FLOW besonders?

FLOW ist ein **deterministischer, systemweiter Orthografie-Normalizer**, der speziell für die Fehlerbilder der Lese-Rechtschreib-Schwäche (LRS) entwickelt wurde.  
Die wichtigsten Alleinstellungsmerkmale:

### 1.1 Vierstellige linguistische Pipeline

```
SN → SL → MO → PG
```

| Stufe | Name | Beispiel |
|-------|------|---------|
| SN | Syntaktische Normalisierung | `garnich` → `gar nicht` |
| SL | Syllabische Ebene | `wier` → `wir`, `villeicht` → `vielleicht` |
| MO | Morphologische Normalisierung | `eigendlich` → `eigentlich` |
| PG | Phonem-Graphem-Korrespondenz | `gelsen` → `gelesen`, `ferig` → `fertig` |

Jede Stufe adressiert eine klar umrissene Fehlerklasse.  
Kein anderes öffentliches Desktop-Tool nutzt eine solche LRS-spezifische Vierstufen-Sequenz.

### 1.2 Systemweite Echtzeit-Korrektur

FLOW hängt sich als Windows-Keyboard-Hook in die gesamte Eingabepipeline ein.  
Jede Anwendung – Browser, E-Mail-Client, Office-Programm, Chat – profitiert automatisch, ohne Plugin oder Integration.

### 1.3 Geschützte Bereiche (Protected Spans)

Code-Snippets (Backtick), URLs, E-Mail-Adressen und Großbuchstaben-Abkürzungen werden **nicht** angefasst.  
Das verhindert unerwünschte Korrekturen in technischen Texten.

### 1.4 Vollständige Transparenz und Determinismus

- Jede Korrektur ist auf eine konkrete Regel zurückführbar (`rule_hits` pro Stufe).
- Gleiche Eingabe liefert immer gleiche Ausgabe – keine stochastischen ML-Effekte.
- Kein Cloud-Aufruf, keine Telemetrie, keine Datenweitergabe.

### 1.5 Lernfähigkeit ohne Modell-Retraining

Nutzer können Ausnahmen und Kontext-Regeln direkt einarbeiten:

```bash
node src/loom_cli.js --learn-exception "teh" "the"
```

Die Regeln landen in `flow_rules.json` und werden sofort aktiv – kein Neustart, kein Neutraining.

---

## 2 Machen andere Tools das ähnlich?

Die folgenden Vergleiche beziehen sich auf **FLOW allein** (Orthografie-Normalisierung).  
Für den Vergleich auf Systemebene siehe Abschnitt 0.3.

### 2.1 LanguageTool (open-source)

| Merkmal | LanguageTool | FLOW |
|---------|-------------|------|
| Ansatz | Regelbasiert + ML-Komponente | Rein regelbasiert |
| Sprachmodell | Ja (n-gram, BERT optional) | Nein |
| Systemweit | Nein (Browser-Extension, API) | Ja (Keyboard-Hook) |
| LRS-Fokus | Nein (allgemeine Grammatik) | Ja |
| Offline | Ja (selbst gehostet) | Ja (lokal) |
| Transparenz | Teilweise (Regel-IDs) | Vollständig (rule_hits) |
| Strukturdiagnose | Nein | Nein (→ SPIN) |

**Fazit:** LanguageTool deckt allgemeine Grammatik breiter ab. FLOW allein ist kein Konkurrent von LanguageTool – **SPIN + FLOW zusammen** sind es, da sie Strukturdiagnose und Orthografiekorrektur verbinden, ohne generativen Output und ohne Cloud-Abhängigkeit.

### 2.2 Microsoft Editor / Word AutoCorrect

| Merkmal | MS Editor | FLOW |
|---------|-----------|------|
| Ansatz | ML-Modelle + statische Wortliste | Regelbasiert |
| Systemweit | Nur innerhalb Microsoft-Apps | Ja |
| LRS-Fokus | Nein | Ja |
| Anpassbarkeit | Begrenzt (AutoCorrect-Liste) | Hoch (regelbasiert + JSON) |
| Datenschutz | Cloud-basiert | Lokal |
| Determinismus | Nicht garantiert | Ja |

### 2.3 Duden Mentor

| Merkmal | Duden Mentor | FLOW |
|---------|-------------|------|
| Ansatz | Cloud-API, NLP | Regelbasiert, lokal |
| Systemweit | Browser-Extension | Ja |
| Offline | Nein | Ja |
| LRS-Fokus | Nein | Ja |
| Kostenlos | Nein (Abo) | Ja (open source) |

### 2.4 AutoHotkey / Typinator (Textersatz)

Einfache Wort-zu-Wort-Ersetzungslisten ohne linguistisches Modell.  
Kein Verständnis von Kontext, Morphologie oder Phonem-Graphem-Mustern.  
FLOW geht hier deutlich weiter.

---

## 3 Was kann das SPIN+FLOW-System von anderen lernen?

### 3.1 Größere Regeldatenbank (von LanguageTool)

LanguageTool pflegt tausende Regeln für Deutsch, inklusive seltenerer Fehlermuster.  
FLOW könnte die eigene Regelbasis (aktuell MVP-Größe) systematisch mit LRS-relevanten Mustern aus öffentlichen Korpora erweitern.

### 3.2 Konfidenz-gesteuerte Aktivierung (von LanguageTool / Grammarly)

Regeln mit niedriger Konfidenz (z. B. `de-seit-seid`, `de-weil-dass`) sind in FLOW bereits über `disabledByDefault` absicherbar.  
Darauf aufbauend könnte ein **Schwellenwert-Mechanismus** eingeführt werden: Regeln unter einem Konfidenz-Schwellenwert werden nur als Vorschlag angeboten, nicht automatisch angewendet.

### 3.3 Erweitertes Lernmodell (von adaptiven Systemen)

Aktuell lernt FLOW Ausnahmen und einfache Kontext-Regeln.  
Ein **Stammregel-Mechanismus** (Lemmatisierung) würde erlauben, eine Korrektur für alle Flexionsformen eines Wortes gleichzeitig zu erfassen.

### 3.4 Plattformübergreifende Unterstützung (von Espanso / AutoKey)

[Espanso](https://espanso.org/) realisiert systemweiten Textersatz unter Windows, macOS und Linux.  
FLOW könnte eine Linux/macOS-Variante des Keyboard-Hooks auf dieser Basis anbieten.

---

## 4 Was können andere von SPIN+FLOW lernen?

### 4.1 Trennung von Normalisierung und Strukturdiagnose

Die meisten Tools mischen Orthografiekorrektur und Stilbewertung.  
SPIN+FLOW trennt beides konsequent: FLOW normalisiert die Oberfläche, SPIN analysiert die Tiefenstruktur – ohne je Entscheidungen für den Nutzer zu treffen.

### 4.2 LRS-spezifische Fehlerklassifizierung

Die Trennung in SN / SL / MO / PG ermöglicht eine präzise Diagnose: Welche Fehlerklasse tritt bei einem Nutzer wie häufig auf?  
Tools wie LanguageTool oder Duden Mentor könnten diese Klassifizierung für gezielte Lernhilfen übernehmen.

### 4.3 Protected Spans als Standard

Das Konzept, technische Zeichenketten (URLs, Code, Abkürzungen) explizit zu schützen, fehlt in vielen Korrektur-Tools und führt zu fehlerhaften Korrekturen in technischen Texten.  
FLOWs Ansatz ist einfach und übertragbar.

### 4.4 Vollständige lokale Verarbeitung ohne Datenweitergabe

FLOW verarbeitet alles lokal – kein Text verlässt das Gerät.  
Für datenschutzsensible Umgebungen (Schulen, medizinische Einrichtungen) ist das ein entscheidender Vorteil, den andere Tools häufig nicht bieten.

### 4.5 Deterministisches, auditierbares Regelwerk

Jede Korrektur ist an eine Regel gebunden, jede Regel hat eine klare ID.  
Dieses Prinzip macht das System auditierbar und erklärt, warum eine Korrektur vorgenommen wurde – besonders wertvoll in pädagogischen Kontexten.

### 4.6 Anti-generativer Ansatz als bewusste Designentscheidung (von SPIN)

SPIN formuliert explizit eine **Anti-Feature-Charta**: kein generativer Output, keine Entscheidungsabnahme, keine Bewertung.  
Das ist keine Einschränkung, sondern Programm.  
In einer Zeit, in der KI-Tools oft zu viel übernehmen, zeigt SPIN+FLOW, dass Instrumente, die Strukturen sichtbar machen statt zu ersetzen, einen eigenen Wert haben.

---

## 5 Zusammenfassung

```
┌──────────────────────────────────────────────────────────────┐
│  FLOW allein:                                                │
│  • LRS-Orthografienormalizer (Keyboard-Hook, Windows)        │
│  • Deterministisch, lokal, transparent                       │
│  • Kein LanguageTool-Konkurrent – andere Problemklasse       │
├──────────────────────────────────────────────────────────────┤
│  SPIN + FLOW zusammen:                                       │
│  • SPIN: Strukturdiagnose ohne generativen Output            │
│  • FLOW: Orthografiekorrektur ohne Cloud und ohne ML         │
│  • Zusammen: vollständiges ND-Schreibsystem                  │
│  • Dann vergleichbar mit LanguageTool – bei komplett         │
│    anderem Paradigma (deterministisch, lokal, kein LLM)      │
└──────────────────────────────────────────────────────────────┘
```

FLOW kann von etablierten Tools vor allem durch **breitere Regeldatenbanken** und **plattformübergreifende Unterstützung** profitieren.  
Das Gesamtsystem SPIN+FLOW bietet mit seiner **strikten Nicht-Generativität**, dem **LRS-Klassifizierungsmodell** und dem **auditierbaren Regelwerk** Ansätze, die für andere Korrektur-Tools – besonders im pädagogischen und ND-Kontext – lehrreich sind.
