# Was macht FLOW besonders? – Vergleich mit anderen Tools

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

### 2.1 LanguageTool (open-source)

| Merkmal | LanguageTool | FLOW |
|---------|-------------|------|
| Ansatz | Regelbasiert + ML-Komponente | Rein regelbasiert |
| Sprachmodell | Ja (n-gram, BERT optional) | Nein |
| Systemweit | Nein (Browser-Extension, API) | Ja (Keyboard-Hook) |
| LRS-Fokus | Nein (allgemeine Grammatik) | Ja |
| Offline | Ja (selbst gehostet) | Ja (lokal) |
| Transparenz | Teilweise (Regel-IDs) | Vollständig (rule_hits) |

**Fazit:** LanguageTool ist mächtiger bei allgemeiner Grammatik, aber nicht LRS-spezifisch und nicht systemweit.

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

## 3 Was kann FLOW von anderen lernen?

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

## 4 Was können andere von FLOW lernen?

### 4.1 LRS-spezifische Fehlerklassifizierung

Die Trennung in SN / SL / MO / PG ermöglicht eine präzise Diagnose: Welche Fehlerklasse tritt bei einem Nutzer wie häufig auf?  
Tools wie LanguageTool oder Duden Mentor könnten diese Klassifizierung für gezielte Lernhilfen übernehmen.

### 4.2 Protected Spans als Standard

Das Konzept, technische Zeichenketten (URLs, Code, Abkürzungen) explizit zu schützen, fehlt in vielen Korrektur-Tools und führt zu fehlerhaften Korrekturen in technischen Texten.  
FLOW's Ansatz ist einfach und übertragbar.

### 4.3 Vollständige lokale Verarbeitung ohne Datenweitergabe

FLOW verarbeitet alles lokal – kein Text verlässt das Gerät.  
Für datenschutzsensible Umgebungen (Schulen, medizinische Einrichtungen) ist das ein entscheidender Vorteil, den andere Tools häufig nicht bieten.

### 4.4 Deterministisches, auditierbares Regelwerk

Jede Korrektur ist an eine Regel gebunden, jede Regel hat eine klare ID.  
Dieses Prinzip macht FLOW auditierbar und erklärt, warum eine Korrektur vorgenommen wurde – besonders wertvoll in pädagogischen Kontexten.

---

## 5 Zusammenfassung

```
┌────────────────────────────────────────────────────────┐
│  FLOW ist einzigartig in der Kombination aus:          │
│  • LRS-spezifischer Vierstufen-Pipeline                │
│  • Systemweiter Echtzeit-Korrektur (Keyboard-Hook)     │
│  • Voller Transparenz und Determinismus                │
│  • Lokaler Verarbeitung (Datenschutz)                  │
│  • Sofortiger Lernfähigkeit ohne Modell-Retraining     │
└────────────────────────────────────────────────────────┘
```

Kein bekanntes öffentliches Tool vereint alle fünf Eigenschaften.  
FLOW kann von etablierten Tools vor allem durch **breitere Regeldatenbanken** und **plattformübergreifende Unterstützung** profitieren.  
Umgekehrt bietet FLOW mit seiner **LRS-Klassifizierung**, dem **Protected-Spans-Konzept** und dem **auditierbaren Regelwerk** Ansätze, von denen andere Korrektur-Tools lernen können.
