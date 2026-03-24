# Ungewöhnliche Ansätze der Sprachverarbeitung – Bezug zu SPIN/FLOW

> Dieses Dokument beschreibt Ansätze aus der Linguistik und Computerlinguistik,
> die ähnlich unkonventionell sind wie SPIN/FLOW: deterministisch, regel- statt ML-basiert,
> auf kognitive oder strukturelle Phänomene fokussiert – kein generativer Output.
> Jeder Abschnitt schließt mit einer konkreten Erweiterungsmöglichkeit für FLOW.

---

## 1 Constraint Grammar (CG)

**Ursprung:** Fred Karlsson, Universität Helsinki (1990). Weiterentwickelt als CG-2, CG-3.

**Idee:** Anstatt zu sagen, was eine Wortform *ist*, werden Regeln formuliert, die bestimmte
Analysen *ausschließen*. Der Ausgangszustand ist maximale Ambiguität; Regeln eliminieren
inkompatible Lesarten solange, bis nur noch eine übrig bleibt – oder mehrere, wenn Ambiguität
nicht auflösbar ist.

```
REMOVE Verb IF (0 Noun) (-1 Det) ;
# Entferne die Verb-Lesart, wenn links ein Determiner steht und davor ein Nomen.
```

**Warum ähnlich wie SPIN/FLOW:**
- Rein regelbasiert, kein ML, vollständig deterministisch.
- Jede Entscheidung ist auf eine Regel zurückführbar (Transparenz).
- Kein generativer Output – CG liefert nur eine Auswahl, nie neuen Text.
- Genutzt u. a. für Isländisch, Finnisch, Norsk – Sprachen mit komplexer Morphologie
  ähnlich wie Deutsch.

**Erweiterung für FLOW (→ `src/confidenceFilter.js`):**
CG zeigt, dass Regeln nach *Sicherheit* gewichtet werden können:
stark sichere Regeln eliminieren sofort; schwache Regeln nur im Multi-Kontext.
FLOW bildet das über den `confidence`-Wert in `contextWindowRules.js` ab.
Der neue `confidenceFilter`-Modul erlaubt, zur Laufzeit einen Schwellenwert zu setzen
und nur Regeln oberhalb des Schwellenwerts anzuwenden.

---

## 2 Zwei-Ebenen-Morphologie (TWOL)

**Ursprung:** Kimmo Koskenniemi, Universität Helsinki (1983).

**Idee:** Morphologische Regeln werden nicht sequenziell hintereinander angewendet
(wie in der generativen Phonologie und wie in FLOWs SN → SL → MO → PG Pipeline),
sondern **alle gleichzeitig** als parallele Constraints.
Eine Wortform ist wohlgeformt, wenn *alle* Regeln gleichzeitig erfüllt sind.

```
Lexikalische Ebene: katt+s    (= Katze + Plural-Suffix)
Oberfläche:        katter     (nach Vokalharmonie + Assimilation)
Alle TWOL-Regeln müssen gleichzeitig gelten.
```

**Warum ähnlich wie SPIN/FLOW:**
- Kein neuronales Modell – rein endliche Transducer.
- Vollständig deterministisch und auditierbar.
- Sehr effizient für agglutinierende Sprachen (Finnisch, Türkisch, aber auch Deutsch).
- Wurde in LEXC/XFST (Xerox) für hochwertige morphologische Analysatoren industrialisiert.

**Erweiterung für FLOW:**
Die Erkenntnis aus TWOL: FLOWs sequenzielle Pipeline (SN → SL → MO → PG) kann
Konflikte erzeugen, wenn eine frühe Stufe eine Korrektur vorwegnimmt, die einer
späteren Stufe die Grundlage entzieht. TWOL inspiriert ein *Konflikterkennungs-Log*:
nach dem Pipeline-Durchlauf prüfen, ob eine spätere Stufe eine Korrektur einer
früheren Stufe überschrieben hat (→ Audit-Erweiterung für `rule_hits`).

---

## 3 Kölner Phonetik (Cologne Phonetics)

**Ursprung:** Hans Postel (1969), veröffentlicht in „IBM-Nachrichten".

**Idee:** Phonetische Kodierung für *deutschsprachige* Zeichenketten.
Ähnlich wie Soundex für Englisch oder Metaphone, aber explizit für deutsches Lautinventar:
Umlaute, Doppelkonsonanten, PH-Digraphen, stimm(un)lose Paare (B/P, D/T, G/K, S/Z).

```
"Müller"   → 657
"Miller"   → 657   # phonetisch identisch
"Meier"    → 67
"Meyer"    → 67    # phonetisch identisch
"Maier"    → 67    # phonetisch identisch
```

**Warum ähnlich wie SPIN/FLOW:**
- Deterministisch, keine Stochastik, keine Lernphase.
- Fokussiert auf *kognitive* phonetische Ähnlichkeit – genau die Fehlerklasse,
  die FLOWs PG-Stufe (Phonem-Graphem-Korrespondenz) adressiert.
- Vollständig lokal, keine externen Abhängigkeiten.
- Besonders wertvoll für LRS-spezifische Fehler: *ferig* ↔ *fertig*, *gelsen* ↔ *gelesen*.

**Erweiterung für FLOW (→ `src/phoneticSimilarity.js`):**
Das neue Modul `phoneticSimilarity` implementiert die Kölner Phonetik vollständig.
Es kann von der PG-Stufe genutzt werden, um zu prüfen, ob ein unbekanntes Wort
phonetisch mit einem bekannten Wort übereinstimmt – ohne ML, ohne externe API.

---

## 4 Optimality Theory (OT) für Normalisierung

**Ursprung:** Alan Prince & Paul Smolensky (1993), Rutgers/Boulder.

**Idee:** Kandidaten-Generierung + Ranking von Constraints.
Statt Regeln sequenziell anzuwenden, werden alle möglichen Ausgabeformen generiert,
und die Ausgabe mit den wenigsten (hochrangigen) Constraint-Verletzungen gewinnt.

```
Eingabe: "ferig"
Kandidaten: "fertig", "ferig", "ferrig", ...
Constraint-Ranking:
  1. *ONSET-DELETION (Stärkstes Constraint)
  2. FAITHFULNESS
Gewinner: "fertig" (verletzt keine starken Constraints)
```

**Warum ähnlich wie SPIN/FLOW:**
- Keine neuronalen Modelle.
- Explizite, auditierbare Constraint-Hierarchie.
- Erklärt *warum* eine Ausgabe bevorzugt wird – analog zu FLOWs `rule_hits`.
- In der Phonologie Standardansatz für regelbasierte Erklärungen seit den 1990ern.

**Erweiterung für FLOW:**
Der `confidence`-Wert in `contextWindowRules.js` entspricht einem OT-Constraint-Rang.
Eine zukünftige Erweiterung könnte mehrere konkurrierende Korrekturen generieren
und die mit dem höchsten kumulativen Konfidenzwert zurückgeben – als `candidates`-Feld
im Ergebnisobjekt (neben dem bestehenden `corrected`).

---

## 5 Phonologische Featuregeometrie

**Ursprung:** Elizabeth Clements & Elizabeth Hume (1995), Weiterentwicklung der SPE-Notation.

**Idee:** Phoneme werden nicht als atomare Symbole betrachtet, sondern als Hierarchien
von binären Merkmalen (Features):
```
[+SONORANT] [−VOICE] [+ANTERIOR] ...
```
Assimilationsregeln operieren auf ganzen Feature-Teilbäumen, nicht auf einzelnen Phonemen.

**Warum ähnlich wie SPIN/FLOW:**
- Vollständig formales, deterministisches System.
- Erklärt LRS-typische Verwechslungen strukturell: B↔P (nur [VOICE] unterschiedlich),
  D↔T, G↔K – genau die Fehler in FLOWs PG-Regeln.
- Keine stochastischen Komponenten.

**Erweiterung für FLOW:**
Die Kölner Phonetik (→ Abschnitt 3) realisiert implizit Feature-Kollaps:
alle [±VOICE]-Paare werden auf denselben Code abgebildet.
Ein explizites Feature-Mapping als Erweiterung der PG-Regeln würde ermöglichen,
neue Regeln automatisch aus phonologischen Feature-Beziehungen abzuleiten,
statt jeden Einzelfall manuell einzupflegen.

---

## 6 Finite-State-Transducer (FST) für Textkorrektur

**Ursprung:** Lauri Karttunen, Xerox PARC (1983–2000er).
Implementierungen: XFST, foma, OpenFST.

**Idee:** Morphologische Analysen, Normalisierungen und Korrekturen werden als
endliche Transducer modelliert. Ein Transducer bildet eine Eingabe-Zeichenkette
deterministisch auf eine Ausgabe-Zeichenkette ab – in Linearzeit und mit minimalem Speicher.

**Warum ähnlich wie SPIN/FLOW:**
- Deterministisch, lokal kompilierbar, keine Cloud-Aufrufe.
- Transparente Zustandsmaschinen – jeder Übergang ist nachvollziehbar.
- Gleiche Eingabe → immer gleiche Ausgabe.
- Leichtgewichtige Runtime (nur der kompilierte Transducer, kein Interpreter nötig).
- In der Praxis: Hunspell (Spell-Check), LanguageTool-Tokenizer verwenden FSTs intern.

**Erweiterung für FLOW:**
FLOWs Regex-Regeln sind semantisch bereits endliche Transduktionen.
Eine mögliche Optimierung: PG-Regeln als deterministischen Minimal-Transducer kompilieren
(mit der `foma`-Bibliothek), was für sehr lange Texte deutliche Durchsatzgewinne bringt.

---

## 7 Dysorthographie-Typisierung (DAS / OLSAT)

**Ursprung:** Klinische Sonderpädagogik; u. a. OLSAT (Oldenburger Lernstandsanalyse),
die Hamburger Schreibprobe (HSP), und Arbeiten von Günther Scheerer-Neumann.

**Idee:** LRS-Fehler werden nicht als zufällig betrachtet, sondern in stabile
*Fehlertypen* klassifiziert:
- **Alphabetische Strategie:** phonetisch korrekt, aber regelwidrig (*gelsen* für *gelesen*).
- **Silbische Strategie:** Silbenstruktur korrekt, aber Vokal falsch (*wier* für *wir*).
- **Morphematische Strategie:** Stamm erkannt, aber Flexion falsch (*eigendlich*).
- **Wortbild-Strategie:** Gestalt-ähnlich, aber Buchstaben verwechselt (*ferig*).

**Warum ähnlich wie SPIN/FLOW:**
- FLOW *implementiert* exakt diese vier Strategien als Pipeline-Stufen:
  SN ≈ syntaktische Fehlstellen, SL ≈ silbische Strategie,
  MO ≈ morphematische Strategie, PG ≈ alphabetische/phonetische Strategie.
- Die klinische LRS-Forschung bestätigt damit FLOWs Architektur unabhängig.
- Kein ML nötig – die Klassifikation basiert auf linguistischen Merkmalen.

**Erweiterung für FLOW:**
Das `rule_hits`-Objekt pro Pipeline-Stufe entspricht bereits einem Fehlertyp-Profil.
Eine Erweiterung: `errorProfile(rule_hits)`-Funktion, die aus den `rule_hits` ableitet,
welche Strategie der Nutzer primär einsetzt (alphabetisch, silbisch, morphematisch, Wortbild)
und dies als diagnostische Ausgabe zurückgibt.

---

## 8 Zusammenfassung: Erweiterungsmatrix

| Ungewöhnlicher Ansatz      | SPIN/FLOW-Bezug                            | Umgesetzt als                      |
|---------------------------|--------------------------------------------|------------------------------------|
| Constraint Grammar (CG)   | Regelbasierte Eliminierung, Konfidenz       | `src/confidenceFilter.js`          |
| Kölner Phonetik            | PG-Schicht, phonetische LRS-Fehler         | `src/phoneticSimilarity.js`        |
| TWOL (Zwei-Ebenen-Morph.) | Sequenzielle vs. parallele Regelanwendung  | Audit-Hinweis in Architektur-Doku  |
| Optimality Theory          | Confidence-Ranking, Kandidaten-Selektion   | `confidence`-Feld + Filter         |
| FST-Transducer             | Regex als Transduktion, Laufzeit-Optim.    | Architektur-Notiz (future work)    |
| Featuregeometrie           | PG-Paare (B↔P, D↔T, G↔K)                 | Basis für Kölner Phonetik          |
| Dysorthographie-Typisierung| SN/SL/MO/PG entsprechen klinischen Typen  | `errorProfile()` in pipeline.js    |
