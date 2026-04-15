---

# Ausgabe 1 — PRD: LOOM

## Die zugrunde liegende Sprach- und Strukturengine für FLOW, SPIN und SMASH

## TL;DR

**LOOM** ist die grundlegende Engine des Ökosystems.
LOOM schreibt nicht, bewertet nicht im literarischen Sinn und ersetzt keine Autorenschaft. LOOM ist die **strukturelle Verarbeitungs- und Diagnoseschicht**, die sprachliche Einheiten zerlegt, Relationen sichtbar macht, Zustände klassifiziert und daraus produktabhängige Signale für andere Werkzeuge ableitet.

Wenn FLOW Texte repariert, SPIN Ausdruck sichtbar macht und SMASH Blockaden unterbricht, dann ist LOOM die Ebene, die erkennt, **womit** das jeweilige System es überhaupt zu tun hat.

LOOM ist damit nicht einfach „Backend“, sondern die gemeinsame **Interpretationslogik** des gesamten Produktuniversums.

---

## Problem Statement

Die meisten Sprachtools sind entweder:

* reine Oberflächenwerkzeuge,
* generative Systeme ohne transparente Zwischenlogik,
* oder eng begrenzte Einzeltools ohne gemeinsame strukturelle Basis.

Das erzeugt ein Kernproblem:
Jedes Produkt löst lokal einen Ausschnitt, aber es gibt **keine konsistente Sprachebene**, auf der Text, Reibung, Struktur, Konflikt, Schreibzustand und Überarbeitung zusammenhängend beschrieben werden können.

Ohne diese gemeinsame Grundlage entstehen:

* inkonsistente Diagnosen,
* unverbundene Features,
* schwer erklärbare Produktentscheidungen,
* und langfristig ein zerfaserter Werkzeugpark statt eines echten Systems.

LOOM schließt genau diese Lücke.

---

## Produktziel

LOOM soll eine gemeinsame, deterministische und erweiterbare Engine bereitstellen, die:

* Text in strukturell sinnvolle Einheiten zerlegt
* sprachliche Muster klassifiziert
* Reibung, Belastung, Konflikt, Dichte und Zustand als getrennte Signale modelliert
* produktübergreifend nutzbare Diagnosen erzeugt
* keine generative Ersetzung, sondern interpretierbare Strukturarbeit ermöglicht

---

## Business Goals

* Gemeinsame Grundlage für alle Produkte im Ökosystem schaffen
* Technische und konzeptionelle Doppelarbeit vermeiden
* Eine klare proprietäre Produktlogik aufbauen, die nicht nur UI, sondern Denkmodell ist
* Erweiterbarkeit sicherstellen: von Textnormalisierung über Strukturdiagnose bis Zustandsintervention
* Das System langfristig als **eigenständige Sprachinfrastruktur** positionieren, nicht als lose Tool-Sammlung

---

## User Goals

LOOM hat keine direkte Endnutzeroberfläche im klassischen Sinn, aber indirekt dient es vier Nutzerzielen:

* Nutzer:innen sollen konsistente Signale über alle Tools hinweg erleben
* Hinweise sollen erklärbar statt magisch wirken
* unterschiedliche Probleme sollen als unterschiedliche Probleme erkannt werden
* Produkte sollen nicht widersprüchlich handeln, sondern auf derselben Grundlogik aufbauen

---

## Non-Goals

LOOM ist nicht:

* ein generatives Sprachmodell
* ein Ghostwriter
* ein universelles NLP-System für beliebige Aufgaben
* ein Black-Box-Scoring-Modell
* ein Produkt mit Selbstzweck
* eine reine Datenhaltungsschicht
* ein Marketingname ohne technische Substanz

---

## Kernthese

**Ohne LOOM wären FLOW, SPIN und SMASH drei getrennte Werkzeuge.
Mit LOOM werden sie zu drei Ausdrucksformen derselben sprachlichen Intelligenz.**

---

## Produktprinzipien

### 1. Struktur vor Oberfläche

LOOM interessiert sich nicht zuerst für hübschen Output, sondern für belastbare Zerlegung, Relation und Signalbildung.

### 2. Diagnose vor Ersetzung

LOOM soll Probleme kenntlich machen, nicht Texte übernehmen.

### 3. Trennung statt Einheits-Score

Phonetische Reibung, strukturelle Leselast, Normalisierungsbedarf, Blockadesignale und logische Konflikte bleiben getrennte Ebenen.

### 4. Determinismus, wo möglich

Gerade im Kernsystem ist Nachvollziehbarkeit wichtiger als „Smartness“.

### 5. Erweiterbarkeit ohne Identitätsverlust

LOOM muss neue Signale und Module aufnehmen können, ohne in einen beliebigen Feature-Sumpf zu kippen.

---

## Funktionsbild von LOOM

LOOM ist die Ebene, die aus sprachlichem Material eine bearbeitbare Struktur macht.

### LOOM soll können:

* Satz- und Segmentzerlegung
* Chunking in bedeutungstragende Einheiten
* Erkennung lokaler Relationen
* Diagnose von Stabilität, Mehrkernigkeit, Konflikt, Dichte oder Bruch
* Ableitung produktrelevanter Signale für FLOW, SPIN und SMASH
* Re-Rendering als strukturell nachvollziehbaren Schritt, ohne Textproduktion zu übernehmen
* Übergabe von Signalen an darüberliegende Produktschichten

---

## Rolle im Ökosystem

### LOOM → FLOW

LOOM liefert Struktur- und Kontextverständnis, damit FLOW Reparatur nicht blind als bloße Wortersetzung ausführt.

### LOOM → SPIN

LOOM liefert die eigentliche strukturelle Grammatik, Chunk-Logik, Diagnose und Re-Render-Basis, auf der SPIN als Arbeitsoberfläche operiert.

### LOOM → SMASH

LOOM liefert Signale darüber, ob das Problem eher in Struktur, Entscheidung, Festhängen, Satzzustand oder textinternen Konflikten liegt — und macht Interventionen gezielter.

---

## User Experience — indirekt, aber zentral

Nutzer:innen „sehen“ LOOM meist nicht als eigenes Produkt. Sie erleben LOOM über Eigenschaften wie:

* Konsistenz
* Präzision
* Nachvollziehbarkeit
* geringe Willkür
* sinnvoll getrennte Signale
* gleiche Produktphilosophie über alle Tools hinweg

Das ist wichtig:
LOOM ist nicht unsichtbar im Wert, nur unsichtbar in der UI.

---

## Kernkomponenten

### 1. Chunking Engine

Zerlegt Texte in funktionale Einheiten wie Subjekt, Handlung, Zustand, Relation, Objekt, Modifikator.

### 2. Structural State Layer

Klassifiziert strukturelle Zustände:

* stabil
* mehrkernig
* konfliktär
* überladen
* fragmentiert
* linear tragfähig

### 3. Re-Render Layer

Erlaubt strukturelle Neuordnung als prüfbaren Schritt, ohne generative Ausformulierung zu übernehmen.

### 4. Signal Layer

Leitet produktspezifische Signale ab:

* Reparaturbedarf für FLOW
* Ausdrucks- und Lastsignale für SPIN
* Blockade- oder Festhängesignale für SMASH

### 5. Explainability Layer

Jede Diagnose sollte auf interne Strukturen oder Regeln zurückführbar sein.

---

## Success Metrics

* Konsistenz produktübergreifender Diagnosen
* Erklärbarkeit von Signalen
* Wiederverwendbarkeit derselben Kernlogik in mehreren Produkten
* Reduktion redundanter Regeln in einzelnen Tools
* Produktteams können Features auf LOOM aufbauen statt parallel neue Logiken zu erfinden

---

## Technical Considerations

* modulare Engine-Architektur
* deterministische Kernpfade
* klar trennbare Signalklassen
* API oder interne Contracts für FLOW / SPIN / SMASH
* Versionierung von Diagnosen und States
* später erweiterbar um schwächere probabilistische Hilfssignale, aber nie als Black Box im Kern

---

## Milestones & Sequencing

### Milestone 1

Chunking- und Strukturdiagnose für einfache bis mittlere Satzformen

### Milestone 2

Stabilitäts-, Konflikt- und Dichtezustände sauber modellieren

### Milestone 3

Signal-API für FLOW und SPIN

### Milestone 4

Blockade-relevante Zustandsmuster für SMASH anbinden

### Milestone 5

Erklär- und Benchmark-Oberfläche für Engine-Qualität

---

## Narrative

LOOM ist der Webstuhl des gesamten Systems. Ohne ihn bleiben die Produkte Einzellösungen: eins repariert, eins analysiert, eins entblockt. Mit LOOM bekommen sie eine gemeinsame grammatische, strukturelle und zustandsbezogene Basis. Das macht das Ökosystem nicht nur technisch sauberer, sondern inhaltlich glaubwürdiger. Es entsteht keine lose Familie von Schreibtools, sondern eine zusammenhängende Sprachumgebung, in der jede Schicht eine andere Aufgabe erfüllt, aber alle dieselbe Sprache sprechen.

---

# Ausgabe 2 — PRD: FLOW

## Reibungskiller am Ursprung / deterministische Normalisierungsschicht

## TL;DR

**FLOW** ist die frühe Reparatur- und Normalisierungsschicht des Ökosystems.
FLOW kümmert sich um den Bereich, in dem Schreiben oft schon vor Stil, Struktur oder Ausdruck scheitert: **orthografische, formale und oberflächennahe Reibung**.

FLOW ist kein Ghostwriter und kein freier Rewriter. FLOW repariert **begrenzt, nachvollziehbar und deterministisch**. Die bestehende Engine-Realität ist hier bereits deutlich: rule-based pipeline, grammar/context layer, benchmark tooling und native Windows shell. 

Wichtig: FLOW ist **nicht die Hauptengine**, sondern eine **abgeleitete Normalisierungsschicht**, die auf der zugrunde liegenden Logik des Gesamtsystems aufsetzt. 

---

## Problem Statement

Viele Texte scheitern schon auf der untersten Ebene:

* orthografische Fehler
* LRS-nahe Fehlermuster
* Oberflächenrauschen
* fehlerhafte Schreibbilder
* unnötige Friktion beim Tippen und Lesen

Diese Reibung ist nicht nur kosmetisch. Sie beschädigt:

* Schreibfluss
* Selbstvertrauen
* Lesbarkeit
* Anschlussfähigkeit an weitere Bearbeitung

Gleichzeitig sind viele bestehende Korrekturtools zu breit, zu intransparent oder zu generativ. Sie reparieren nicht nur Oberfläche, sondern greifen in Ton, Stil oder Formulierung ein.

FLOW adressiert deshalb nicht „Textverbesserung allgemein“, sondern **bounded text repair**. 

---

## Produktziel

FLOW soll Texte an der Oberfläche so weit stabilisieren, dass Nutzer:innen ohne unnötige Reibung weiterschreiben, prüfen und überarbeiten können.

FLOW soll:

* zuverlässig reparieren
* nicht umschreiben
* transparent bleiben
* lokal und kontrollierbar sein
* für LRS-nahe Fehlermuster besonders stark sein
* als vorgeschaltete Schicht den Weg zu SPIN und SMASH erleichtern

---

## Business Goals

* Eine starke, glaubwürdige Unterkante des Produktökosystems schaffen
* Ein reales Alltagsproblem mit klarer Nutzbarkeit lösen
* FLOW als stabilen Einstieg in das System nutzbar machen
* Eine differenzierte Alternative zu cloudbasierten, intransparenten Korrekturtools aufbauen
* Benchmark- und Evaluationskultur zum Kernbestandteil machen statt „smart sounding edits“ 

---

## User Goals

* Ich will, dass unnötige Schreibfehler mich nicht dauernd ausbremsen
* Ich will Hilfe, ohne dass mir mein Text weggenommen wird
* Ich will nachvollziehen können, was korrigiert wurde und warum
* Ich will lokale, datenschutzfreundliche Verarbeitung
* Ich will auch bei fehlerhaftem Rohtext anschlussfähig bleiben

---

## Non-Goals

FLOW ist nicht:

* ein freier Paraphrasier
* ein Stiloptimierer
* ein AI-Rewriter
* ein Tool für ästhetische Ausdrucksverbesserung
* eine Strukturdiagnose-Umgebung
* ein Schreibtrainer
* ein System, das semantisch offen „bessere“ Formulierungen generiert

---

## Produktprinzipien

### 1. Deterministisch statt magisch

Gleiche Eingabe, gleiche Ausgabe. 

### 2. Begrenzt statt übergriffig

FLOW repariert, aber übernimmt keine Textverantwortung.

### 3. Lokal statt Cloud-Zwang

Datenschutz und Kontrolle sind Teil des Produkts. 

### 4. Messbar statt gefühlt

Änderungen sollen benchmarkbar und prüfbar sein. 

### 5. Reibung früh senken

FLOW arbeitet am Ursprung vieler Schreibabbrüche: Oberfläche, Lesbarkeit, formale Hürden.

---

## Produktlogik

FLOW ist die erste praktische Schicht im System.

### Im Gesamtbild:

* **LOOM** interpretiert Struktur und Signale
* **FLOW** reduziert Oberflächenreibung
* **SPIN** macht Ausdruck und Struktur sichtbar
* **SMASH** hilft, wenn Schreiben trotz allem blockiert

FLOW muss daher nicht „alles können“. FLOW muss seinen Bereich kompromisslos gut können.

---

## Kernfunktionen

## 1. Deterministische Reparaturpipeline

Bestehende Pipeline: **SN → SL → MO → PG**.  

Diese Einteilung ist stark, weil sie Fehlerklassen trennt:

* syntaktische / surface normalization
* syllabic / letter-pattern normalization
* morphological normalization
* phoneme–grapheme correction

Das ist mehr als Autocorrect. Es ist eine echte Produktlogik.

## 2. Grammar / Context Layer

Clause detection, context window rules, confidence filtering und grammar-oriented rules erweitern die Reparatur um kontrollierte Kontextsensitivität. 

## 3. Lab / Benchmark Layer

FLOW enthält explizite Evaluationsoberflächen, Suite Runs, Promotion Flow und Testlogik. Das ist strategisch wertvoll, weil FLOW nicht nach „fühlt sich smarter an“ weiterentwickelt werden soll, sondern nach geringerem Schaden und besserer Retention valider Texte. 

## 4. Native Shell / Echtzeitnutzung

Die Windows-Tray-Anbindung macht FLOW zu einem Werkzeug im tatsächlichen Schreiballtag, nicht nur zu einer Batch-Funktion. 

## 5. Protected Spans

Technische Strings, URLs, Codefragmente etc. sollen geschützt bleiben, damit FLOW nicht an den falschen Stellen „hilft“. 

---

## User Experience — Step by Step

### Einstieg

Nutzer:in schreibt in beliebiger Umgebung.

### FLOW greift früh, aber begrenzt ein

* lokale Korrektur
* keine stilistische Vereinnahmung
* keine langen Menüs
* keine generative Ersatzformulierung

### Ergebnis

Die Oberfläche wird stabiler. Nutzer:innen können weiterschreiben, ohne an banaler Reibung hängenzubleiben.

### Übergang

Sobald die Oberfläche ausreichend tragfähig ist:

* zu **SPIN**, wenn Ausdruck, Rhythmus oder Struktur Thema sind
* zu **SMASH**, wenn das Problem nicht Korrektur, sondern Blockade ist

---

## Zielgruppen

### Primär

* Nutzer:innen mit LRS-nahen Fehlerbildern
* Menschen mit hoher Reibung beim Tippen
* neurodivergente Nutzer:innen mit formaler Schreibhürde
* alle, die systemweite lokale Korrektur ohne generative Bevormundung wollen

### Sekundär

* pädagogische Kontexte
* datenschutzsensible Umgebungen
* Nutzer:innen, die klassische Cloud-Korrekturtools bewusst ablehnen

---

## Success Metrics

* Korrekturrate bei relevanten Fehlerklassen
* niedrige Damage-Rate an validem Text
* hohe Akzeptanz trotz deterministischem Ansatz
* messbare Reduktion von Schreibabbrüchen durch formale Reibung
* Nutzung in Echtzeit-Kontexten
* Benchmark-Fortschritt über definierte Suiten hinweg 

---

## Technical Considerations

* Node-basierte Engine plus native Shell ist bereits sinnvoll angelegt 
* Signalübergabe aus LOOM perspektivisch weiter vertiefen
* Confidence-Handling differenzieren: Auto-Repair vs. Vorschlag
* Regelbasis weiter ausbauen, aber bounded halten
* Cross-platform-Frage später klären, Windows-first ist für den Anfang okay

---

## Risiken

### 1. Scope Drift

FLOW könnte versucht sein, immer mehr Stil- oder Grammar-Aufgaben zu schlucken.

### 2. Überkorrektur

Wenn bounded repair in verdeckte Umformulierung kippt, verliert FLOW seine Glaubwürdigkeit.

### 3. Zu technische Wahrnehmung

Die Engine ist stark, aber die Produktbotschaft muss einfach bleiben.

### 4. Isolierte Positionierung

FLOW darf nicht so wirken, als sei es die ganze Produktwelt. Es ist die Reibungsschicht, nicht das Gesamtversprechen.

---

## Milestones & Sequencing

### Milestone 1

Reparaturpipeline und Benchmarking absichern

### Milestone 2

Grammar/context layer robust machen

### Milestone 3

UX für Echtzeitnutzung und Review verbessern

### Milestone 4

Saubere Übergänge zu SPIN und SMASH definieren

### Milestone 5

Domänen- oder zielgruppenspezifische Modulation prüfen

---

## Narrative

FLOW kümmert sich um die Stelle, an der viele andere Produkte zu früh ausufern. Es will nicht schönschreiben, nicht glätten, nicht klingen wie „bessere KI“. Es reduziert die Reibung, die Menschen vom Schreiben abhält, noch bevor Stil- oder Strukturfragen überhaupt sinnvoll bearbeitbar sind. Gerade dadurch ist FLOW strategisch wichtig: Es ist die Schicht, die den Text stabil genug macht, damit das eigentliche Arbeiten beginnen kann.

---

# Ausgabe 3 — PRD: SPIN

## Strukturelles Schreiblabor für Ausdruck, Rhythmus, Leselast und Kohärenz

## TL;DR

**SPIN** ist die operative Ausdrucks- und Analyseoberfläche des Systems.
Wenn LOOM die zugrunde liegende Sprachlogik ist und FLOW frühe Oberflächenreibung reduziert, dann ist SPIN der Ort, an dem Autor:innen ihren Text als **bewegliche Struktur** bearbeiten, beobachten, vergleichen und schärfen.

SPIN ist kein Korrektor und kein AI-Writer. SPIN ist ein **Schreiblabor**, das Rhythmus, Leselast, Wiederholung und strukturelle Spannungen sichtbar macht, ohne die Stimme des Autors zu ersetzen.

---

## Problem Statement

Selbst wenn Orthografie stabil ist, bleibt Schreiben schwer.

Warum?

Weil viele Probleme nicht auf der Fehlerschicht liegen, sondern auf der **Ausdrucks- und Strukturwahrnehmung**:

* ein Satz klingt schwer
* ein Absatz ermüdet
* ein Text wird monoton
* Wiederholungen kippen von Motiv zu Last
* eine Struktur wirkt dicht, ohne klar falsch zu sein
* Varianten existieren, aber keine ist offensichtlich „die richtige“

Bestehende Tools reagieren darauf meist mit einer falschen Geste:
Sie schlagen direkt neue Formulierungen vor.

Für viele ernsthafte Schreibende ist das unbrauchbar. Sie wollen nicht ersetzt, sondern **wahrnehmungsfähiger** werden.

---

## Produktziel

SPIN soll Autor:innen helfen,

* den eigenen Text präziser zu sehen,
* Ausdrucksprobleme lokal zu erkennen,
* Varianten ohne Normierungsdruck zu prüfen,
* strukturelle Belastung, Rhythmus und Monotonie sichtbar zu machen,
* und selbstbestimmt zu überarbeiten.

SPIN macht nicht „den besseren Text“.
SPIN macht den **eigenen Text besser lesbar für seinen Autor**.

---

## Business Goals

* Eine klare Gegenposition zu generativen Schreibtools besetzen
* Eine eigenständige Kategorie definieren: diagnostisches Schreiblabor
* Loyale Nutzergruppen im Bereich bewussten Schreibens gewinnen
* SPIN als Herzstück des Ökosystems positionieren
* Eine Oberfläche schaffen, die LOOMs Strukturintelligenz produktiv erfahrbar macht

---

## User Goals

* Ich will meinen eigenen Stil verbessern, ohne ihn ersetzen zu lassen
* Ich will sehen, wo mein Text schwer, dicht oder monoton wird
* Ich will Varianten vergleichen, ohne dass mir eine Maschine die „beste“ diktiert
* Ich will Hinweise, keine Bevormundung
* Ich will in einer ruhigen Umgebung arbeiten

---

## Non-Goals

SPIN ist nicht:

* ein Grammatikprüfer
* ein SEO-Tool
* ein AI-Writer
* ein Auto-Rewrite-System
* ein „optimiere meinen Text“-Button
* ein allgemeines Produktivitätsdashboard
* eine lineare „Version 2 ist besser als Version 1“-Maschine

---

## Produktprinzipien

### 1. Sichtbarmachung statt Ersetzung

### 2. Ausdruck vor Normierung

### 3. Ruhe statt Feature-Cockpit

### 4. Varianten als Möglichkeiten, nicht als Urteilskette

### 5. Unterschiedliche Probleme brauchen unterschiedliche Visualisierungen

---

## Produktlogik

SPIN steht **auf LOOM** und arbeitet **nach FLOW**.

* **LOOM** liefert Chunking, Strukturdiagnose, Re-Render-Grundlage
* **FLOW** sorgt dafür, dass banale Oberflächenreibung nicht alles überlagert
* **SPIN** ist dann die Ebene, auf der der Mensch tatsächlich mit Ausdruck arbeitet

Das ist wichtig: SPIN darf nicht wie ein losgelöstes Tool beschrieben werden. Es ist die **sichtbare Arbeitsfläche** eines tieferen Systems.

---

## Kernfunktionen

### 1. Leselast-Oszilloskop

Visualisiert lokale Leselast statt global zu bewerten.

### 2. Rhythmus-Glättung im Referenzmodus

Zeigt eine geglättete Referenzstruktur, ohne sie in den Text zu übernehmen.

### 3. Wortfriedhof

Sammelt entfernte oder verdächtige Wörter/Phrasen reversibel.

### 4. Motiv- und Wiederholungs-Tracker

Unterscheidet zwischen wiederkehrend und auffällig gehäuft.

###
