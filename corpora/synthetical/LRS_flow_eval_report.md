# LRS Flow Evaluation Report

**Dataset:** LRS Orthographic Normalization Dataset German v1 (70 Sätze)
**Pipeline:** PUNCT → CTX → SN → SL → MO → PG → GR → POST
**CTX aktiv (DE):** universal-space-before-punct, universal-multiple-spaces
**CTX deaktiviert (disabledByDefault):** de-weil-dass, de-dem-hause, de-seit-seid

---

## DE_ERR_0001 — Schule

**Fehlertypen:** Groß-/Kleinschreibung · Flexion · f/v-Verwechslung · das/dass · lautnahe Schreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `gestan hab ich mein sport beutel in der shule fergeßen, obwohl mama noch gesakt hat das ich for der tür kucken soll.` |
| FLOW output   | `Gestan habe ich mein sport beutel in der Schule vergessen, obwohl mama noch gesagt hat das ich vor der tür gucken soll.` |
| Gold (clean)  | `Gestern habe ich meinen Sportbeutel in der Schule vergessen, obwohl Mama noch gesagt hat, dass ich vor der Tür schauen soll.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (6 Regeln)

- `PG:/\bshule\b/` — \bshule\b
  - Änderung: `shule`→`Schule`
- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`
- `PG:/\bfor\b/` — \bfor\b
  - Änderung: `for`→`vor`
- `PG:/\bgesakt\b/` — \bgesakt\b
  - Änderung: `gesakt`→`gesagt`
- `PG:/\bferge(?:ß|s)en\b/` — \bferge(?:ß|s)en\b
  - Änderung: `fergeßen,`→`vergessen,`
- `PG:/\bkucken\b/` — \bkucken\b
  - Änderung: `kucken`→`gucken`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `gestan`→`Gestan`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `Gestan`→`Gestern`
- `mein`→`meinen`
- `sport`→`Sportbeutel`
- `beutel`→`in`
- `in`→`der`
- `der`→`Schule`
- `Schule`→`vergessen,`
- `vergessen,`→`obwohl`
- `obwohl`→`Mama`
- `mama`→`noch`
- `noch`→`gesagt`
- `gesagt`→`hat,`
- `hat`→`dass`
- `das`→`ich`
- `ich`→`vor`
- `vor`→`der`
- `der`→`Tür`
- `tür`→`schauen`
- `gucken`→`soll.`
- `soll.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Lautnahe Schreibung / f/v: PG-Regeln decken nur explizit gelistete Formen ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0002 — Wetter

**Fehlertypen:** Verbform · trotzdem-Schreibung · Groß-/Kleinschreibung · wahr/war · Doppelkonsonanten · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil es morgens so geregnet hatt, sind wir in der pause trozdem raus und danach wahren meine soken ganz kalt und matschig.` |
| FLOW output   | `Weil es morgens so geregnet hat, sind wir in der pause trotzdem raus und danach wahren meine soken ganz kalt und matschig.` |
| Gold (clean)  | `Weil es morgens so geregnet hat, sind wir in der Pause trotzdem raus und danach waren meine Socken ganz kalt und matschig.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\btrozdem\b/` — \btrozdem\b
  - Änderung: `trozdem`→`trotzdem`

**PG** (1 Regel)

- `PG:/\bhatt\b/` — \bhatt\b
  - Änderung: `hatt,`→`hat,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `pause`→`Pause`
- `wahren`→`waren`
- `soken`→`Socken`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- wahr/war: Homophones Paar, kein regelbasierter Kontexttest vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0003 — Freunde

**Fehlertypen:** Groß-/Kleinschreibung · Verbform · das/dass · Worttrennung · Doppelkonsonanten · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich wolte meiner freundin das bild zeigen was ich gemalt hab aber dan ist ausversehen der saft drüber gekipt.` |
| FLOW output   | `Ich wollte meiner freundin das bild zeigen was ich gemalt habe aber dann ist aus Versehen der saft drüber gekippt.` |
| Gold (clean)  | `Ich wollte meiner Freundin das Bild zeigen, das ich gemalt habe, aber dann ist aus Versehen der Saft darüber gekippt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bausversehen\b/` — \bausversehen\b
  - Änderung: `ausversehen`→`aus`, `der`→`Versehen`, `saft`→`der`, `drüber`→`saft`, `gekipt.`→`drüber`, `∅`→`gekipt.`

**SL** (2 Regeln)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte`→`wollte`
- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**PG** (2 Regeln)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`
- `PG:/\bgekipt\b/` — \bgekipt\b
  - Änderung: `gekipt.`→`gekippt.`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `freundin`→`Freundin`
- `bild`→`Bild`
- `zeigen`→`zeigen,`
- `was`→`das`
- `habe`→`habe,`
- `saft`→`Saft`
- `drüber`→`darüber`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0004 — Familie

**Fehlertypen:** Groß-/Kleinschreibung · Verbform · ä/e-Verwechslung · Getrennt-/Zusammenschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mein kleiner bruder hat so getan als ob er schläft, damit er nicht den müll mit runter nemen muss.` |
| FLOW output   | `Mein kleiner bruder hat so getan als, ob er schläft, damit er nicht den müll mit runternehmen muss.` |
| Gold (clean)  | `Mein kleiner Bruder hat so getan, als ob er schläft, damit er nicht den Müll mit runternehmen muss.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\brunter nemen\b/` — \brunter nemen\b
  - Änderung: `runter`→`runternehmen`, `nemen`→`muss.`, `muss.`→`∅`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `als`→`als,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mein`→`Mein`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `bruder`→`Bruder`
- `getan`→`getan,`
- `als,`→`als`
- `müll`→`Müll`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0005 — Ausflug

**Fehlertypen:** das/dass · lautnahe Schreibung · anderst/anders · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `im bus hab ich die ganze zeit gedacht das wir schon zu weit gefahren sind, weil die häuser irgentwie alle anderst aussahn.` |
| FLOW output   | `Im bus habe ich die ganze zeit gedacht das wir schon zu weit gefahren sind, weil die häuser irgendwie alle anders aussahn.` |
| Gold (clean)  | `Im Bus habe ich die ganze Zeit gedacht, dass wir schon zu weit gefahren sind, weil die Häuser irgendwie alle anders aussahen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (2 Regeln)

- `MO:/\birgentwie\b/` — \birgentwie\b
  - Änderung: `irgentwie`→`irgendwie`
- `MO:/\banderst\b/` — \banderst\b
  - Änderung: `anderst`→`anders`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `im`→`Im`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `bus`→`Bus`
- `zeit`→`Zeit`
- `gedacht`→`gedacht,`
- `das`→`dass`
- `häuser`→`Häuser`
- `aussahn.`→`aussahen.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Lautnahe Schreibung / f/v: PG-Regeln decken nur explizit gelistete Formen ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0006 — Tiere

**Fehlertypen:** seid/seit · Groß-/Kleinschreibung · Doppelkonsonanten · außer/äu-Verwechslung · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `seid wir den neuen hund haben ist es abents nie mehr leise, weil er immer knurt wenn drausen einer vorbei leuft.` |
| FLOW output   | `Seid wir den neuen hund haben ist es abends nie mehr leise, weil er immer knurrt, wenn draußen einer vorbei läuft.` |
| Gold (clean)  | `Seit wir den neuen Hund haben, ist es abends nie mehr leise, weil er immer knurrt, wenn draußen einer vorbeiläuft.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (2 Regeln)

- `MO:/\babents\b/` — \babents\b
  - Änderung: `abents`→`abends`
- `MO:/\bdrausen\b/` — \bdrausen\b
  - Änderung: `drausen`→`draußen`

**PG** (2 Regeln)

- `PG:/\bknurt\b/` — \bknurt\b
  - Änderung: `knurt`→`knurrt`
- `PG:/\bleuft\b/` — \bleuft\b
  - Änderung: `leuft.`→`läuft.`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `knurrt`→`knurrt,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `seid`→`Seid`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `Seid`→`Seit`
- `hund`→`Hund`
- `haben`→`haben,`
- `vorbei`→`vorbeiläuft.`
- `läuft.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- seid/seit: CTX-Regel de-seit-seid vorhanden aber deaktiviert (Homonyme-Grenzfall)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0007 — Hausaufgaben

**Fehlertypen:** Groß-/Kleinschreibung · eigentlich-Schreibung · Getrennt-/Zusammenschreibung · Flexion · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich habe die mathe aufgabe eigendlich verstanden gehabt, nur wo die zahlen mit komma kamen war aufeinmal alles fals gewesen.` |
| FLOW output   | `Ich habe die mathe aufgabe eigentlich verstanden gehabt, nur wo die zahlen mit komma kamen war auf einmal alles fals gewesen.` |
| Gold (clean)  | `Ich hatte die Matheaufgabe eigentlich verstanden, nur als die Zahlen mit Komma kamen, war auf einmal alles falsch gewesen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\baufeinmal\b/` — \baufeinmal\b
  - Änderung: `aufeinmal`→`auf`, `alles`→`einmal`, `fals`→`alles`, `gewesen.`→`fals`, `∅`→`gewesen.`

**MO** (1 Regel)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `habe`→`hatte`
- `mathe`→`Matheaufgabe`
- `aufgabe`→`eigentlich`
- `eigentlich`→`verstanden,`
- `verstanden`→`nur`
- `gehabt,`→`als`
- `nur`→`die`
- `wo`→`Zahlen`
- `die`→`mit`
- `zahlen`→`Komma`
- `mit`→`kamen,`
- `komma`→`war`
- `kamen`→`auf`
- `war`→`einmal`
- `auf`→`alles`
- `einmal`→`falsch`
- `alles`→`gewesen.`
- `fals`→`∅`
- `gewesen.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0008 — Gefühle

**Fehlertypen:** wen/wenn · Groß-/Kleinschreibung · eigentlich-Schreibung · gar nicht · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen papa schimpft rede ich manchma garnicht mehr, auch wen ich eigendlich nur helfen wolte.` |
| FLOW output   | `Wenn papa schimpft rede ich manchmal gar nicht mehr, auch wenn ich eigentlich nur helfen wollte.` |
| Gold (clean)  | `Wenn Papa schimpft, rede ich manchmal gar nicht mehr, auch wenn ich eigentlich nur helfen wollte.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bgarnicht\b/` — \bgarnicht\b
  - Vorher: `wen papa schimpft rede ich manchma garnicht mehr, auch wen ich eigendlich nur helfen wolte.`
  - Nachher: `wen papa schimpft rede ich manchma gar nicht mehr, auch wen ich eigendlich nur helfen wolte.`

**SL** (3 Regeln)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte.`→`wollte.`
- `SL:/\bmanchma\b/` — \bmanchma\b
  - Änderung: `manchma`→`manchmal`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`, `wen`→`wenn`

**MO** (1 Regel)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`

**GR** (2 Regeln)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `auch`→`auch,`
- `de-gr-komma-nach-auch-undo` — de-gr-komma-nach-auch-undo
  - Änderung: `auch,`→`auch`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `papa`→`Papa`
- `schimpft`→`schimpft,`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0009 — Ausflug

**Fehlertypen:** ü/u-Verwechslung · Groß-/Kleinschreibung · Verbform · Zeitform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `am wochenende sollten wir frür zum see fahren, aber weil meine schwester so lange im bad gebraucht hatt sind wir erst los als es schon fast dunkler war.` |
| FLOW output   | `Am wochenende sollten wir früher zum see fahren, aber weil meine schwester so lange im bad gebraucht hat sind wir erst los als es schon fast dunkler war.` |
| Gold (clean)  | `Am Wochenende sollten wir früher zum See fahren, aber weil meine Schwester so lange im Bad gebraucht hat, sind wir erst los, als es schon fast dunkel war.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (2 Regeln)

- `PG:/\bhatt\b/` — \bhatt\b
  - Änderung: `hatt`→`hat`
- `PG:/\bfrür\b/` — \bfrür\b
  - Änderung: `frür`→`früher`

**GR** (2 Regeln)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `aber`→`aber,`
- `de-gr-komma-nach-koordinator-undo` — de-gr-komma-nach-koordinator-undo
  - Änderung: `aber,`→`aber`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `am`→`Am`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `wochenende`→`Wochenende`
- `see`→`See`
- `schwester`→`Schwester`
- `bad`→`Bad`
- `hat`→`hat,`
- `los`→`los,`
- `dunkler`→`dunkel`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0010 — Ängste

**Fehlertypen:** wen/wenn · weis/weiß · ie/ei-Verwechslung · Pronomengebrauch · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich mag es nicht wen alle lachen und ich nicht weis ob die vieleicht wegen mir meinen.` |
| FLOW output   | `Ich mag es nicht, wenn alle lachen und ich nicht weiß, ob die vielleicht wegen mir meinen.` |
| Gold (clean)  | `Ich mag es nicht, wenn alle lachen und ich nicht weiß, ob sie vielleicht mich meinen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bvieleicht\b/` — \bvieleicht\b
  - Änderung: `vieleicht`→`vielleicht`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**PG** (1 Regel)

- `PG:/\bweis\b/` — \bweis\b
  - Änderung: `weis`→`weiß`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `nicht`→`nicht,`, `weiß`→`weiß,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `die`→`sie`
- `wegen`→`mich`
- `mir`→`meinen.`
- `meinen.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0011 — Schule

**Fehlertypen:** das/dass · Groß-/Kleinschreibung · Doppelkonsonanten · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `unsere lehrerin hat gesagt das wir den aufsatz sauber schreiben sollen, aber mein radiergummi war weg und dann sah alles noch schlimer aus.` |
| FLOW output   | `Unsere lehrerin hat gesagt, dass wir den aufsatz sauber schreiben sollen, aber mein radiergummi war weg und dann sah alles noch schlimer aus.` |
| Gold (clean)  | `Unsere Lehrerin hat gesagt, dass wir den Aufsatz sauber schreiben sollen, aber mein Radiergummi war weg und dann sah alles noch schlimmer aus.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `gesagt`→`gesagt,`, `das`→`dass`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `unsere`→`Unsere`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `lehrerin`→`Lehrerin`
- `aufsatz`→`Aufsatz`
- `radiergummi`→`Radiergummi`
- `schlimer`→`schlimmer`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0012 — kleine Geschichten

**Fehlertypen:** das/dass · Groß-/Kleinschreibung · Verbform · Artikel/Präposition · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als ich nachts wach geworden bin, hab ich erst gedacht das der wind ans fenster haut, dabei war nur die katze auf den mülleimer gesprungen.` |
| FLOW output   | `Als ich nachts wach geworden bin, habe ich erst gedacht das der wind ans fenster haut, dabei war nur die katze auf den mülleimer gesprungen.` |
| Gold (clean)  | `Als ich nachts wach geworden bin, habe ich erst gedacht, dass der Wind ans Fenster haut, dabei war nur die Katze auf den Mülleimer gesprungen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `gedacht`→`gedacht,`
- `das`→`dass`
- `wind`→`Wind`
- `fenster`→`Fenster`
- `katze`→`Katze`
- `mülleimer`→`Mülleimer`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0013 — Familie

**Fehlertypen:** wider/wieder · erzählt-Schreibung · trotzdem-Schreibung · u/ck-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mein opa erzält immer die gleiche geschichte wider, aber ich hör trozdem zu weil er dann so komisch ernst kuckt.` |
| FLOW output   | `Mein opa erzält immer die gleiche geschichte wieder, aber ich hör trotzdem zu, weil er dann so komisch ernst kuckt.` |
| Gold (clean)  | `Mein Opa erzählt immer die gleiche Geschichte wieder, aber ich höre trotzdem zu, weil er dann so komisch ernst guckt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\btrozdem\b/` — \btrozdem\b
  - Änderung: `trozdem`→`trotzdem`

**MO** (1 Regel)

- `MO:/\bwider\b/` — \bwider\b
  - Änderung: `wider,`→`wieder,`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `zu`→`zu,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mein`→`Mein`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `opa`→`Opa`
- `erzält`→`erzählt`
- `geschichte`→`Geschichte`
- `hör`→`höre`
- `kuckt.`→`guckt.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0014 — Schule

**Fehlertypen:** Verbform · wahr/war · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `heute in musik muste ich alleine singen weil lena heiser wahr, und mein bauch hat die ganze zeit gezittert.` |
| FLOW output   | `Heute in musik musste ich alleine singen, weil lena heiser wahr, und mein bauch hat die ganze zeit gezittert.` |
| Gold (clean)  | `Heute in Musik musste ich alleine singen, weil Lena heiser war, und mein Bauch hat die ganze Zeit gezittert.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bmuste\b/` — \bmuste\b
  - Änderung: `muste`→`musste`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `singen`→`singen,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `heute`→`Heute`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `musik`→`Musik`
- `lena`→`Lena`
- `wahr,`→`war,`
- `bauch`→`Bauch`
- `zeit`→`Zeit`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wahr/war: Homophones Paar, kein regelbasierter Kontexttest vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0015 — Tiere

**Fehlertypen:** Groß-/Kleinschreibung · Doppelkonsonanten · Verbform · Kasusfehler · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `obwohl ich den hamster nur kurz auf den tepich setzen wolte, ist er sofort hinter den schrank verschwunden und wir musten ewig warten.` |
| FLOW output   | `Obwohl ich den hamster nur kurz auf den tepich setzen wollte, ist er sofort hinter den schrank verschwunden und wir mussten ewig warten.` |
| Gold (clean)  | `Obwohl ich den Hamster nur kurz auf den Teppich setzen wollte, ist er sofort hinter dem Schrank verschwunden und wir mussten ewig warten.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte,`→`wollte,`
- `SL:/\bmusten\b/` — \bmusten\b
  - Änderung: `musten`→`mussten`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `obwohl`→`Obwohl`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `hamster`→`Hamster`
- `tepich`→`Teppich`
- `den`→`dem`
- `schrank`→`Schrank`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0016 — Schule

**Fehlertypen:** Worttrennung · Groß-/Kleinschreibung · das/dass · gar kein · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab ausversehen die brotdose von jonas mitgenommen und erst zuhause gemerkt das da garkein käsebrot sondern gurken drin waren.` |
| FLOW output   | `Ich habe aus Versehen die brotdose von jonas mitgenommen und erst zu Hause gemerkt, dass da gar kein käsebrot sondern gurken drin waren.` |
| Gold (clean)  | `Ich habe aus Versehen die Brotdose von Jonas mitgenommen und erst zu Hause gemerkt, dass da gar kein Käsebrot, sondern Gurken drin waren.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (4 Regeln)

- `SN:/\bgarkein\b/` — \bgarkein\b
  - Änderung: `garkein`→`gar`, `käsebrot`→`kein`, `sondern`→`käsebrot`, `gurken`→`sondern`, `drin`→`gurken`, `waren.`→`drin`, `∅`→`waren.`
- `SN:/\bausversehen\b/` — \bausversehen\b
  - Vorher: `ich hab ausversehen die brotdose von jonas mitgenommen und erst zuhause gemerkt das da gar kein käsebrot sondern gurken `
  - Nachher: `ich hab aus Versehen die brotdose von jonas mitgenommen und erst zuhause gemerkt das da gar kein käsebrot sondern gurken`
- `SN:/\bzuhause\b/` — \bzuhause\b
  - Vorher: `ich hab aus Versehen die brotdose von jonas mitgenommen und erst zuhause gemerkt das da gar kein käsebrot sondern gurken`
  - Nachher: `ich hab aus Versehen die brotdose von jonas mitgenommen und erst zu Hause gemerkt das da gar kein käsebrot sondern gurke`
- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `gemerkt`→`gemerkt,`, `das`→`dass`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `brotdose`→`Brotdose`
- `jonas`→`Jonas`
- `käsebrot`→`Käsebrot,`
- `gurken`→`Gurken`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0017 — Wetter

**Fehlertypen:** Groß-/Kleinschreibung · Verbform · Zusammenschreibung · ie/i-Verwechslung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil ich meine regenhose nicht anziehen wolte, war danach die ganze strumpfhose klitsch nass und es hat in den schuhen gequitscht.` |
| FLOW output   | `Weil ich meine regenhose nicht anziehen wollte, war danach die ganze strumpfhose klitsch nass und es hat in den schuhen gequietscht.` |
| Gold (clean)  | `Weil ich meine Regenhose nicht anziehen wollte, war danach die ganze Strumpfhose klitschnass und es hat in den Schuhen gequietscht.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte,`→`wollte,`

**PG** (1 Regel)

- `PG:/\bgequitscht\b/` — \bgequitscht\b
  - Änderung: `gequitscht.`→`gequietscht.`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `regenhose`→`Regenhose`
- `strumpfhose`→`Strumpfhose`
- `klitsch`→`klitschnass`
- `nass`→`und`
- `und`→`es`
- `es`→`hat`
- `hat`→`in`
- `in`→`den`
- `den`→`Schuhen`
- `schuhen`→`gequietscht.`
- `gequietscht.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0018 — Freunde

**Fehlertypen:** Kasusfehler · Worttrennung · Groß-/Kleinschreibung · Verbform · umgangssprachliche Verkürzung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `meine freundin war beleidigt, weil ich bei den geheimnis ausversehen doch meiner cousine was davon erzählt hab.` |
| FLOW output   | `Meine freundin war beleidigt, weil ich bei den geheimnis aus Versehen doch meiner cousine was davon erzählt habe.` |
| Gold (clean)  | `Meine Freundin war beleidigt, weil ich bei dem Geheimnis aus Versehen doch meiner Cousine etwas davon erzählt habe.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bausversehen\b/` — \bausversehen\b
  - Vorher: `meine freundin war beleidigt, weil ich bei den geheimnis ausversehen doch meiner cousine was davon erzählt hab.`
  - Nachher: `meine freundin war beleidigt, weil ich bei den geheimnis aus Versehen doch meiner cousine was davon erzählt hab.`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab.`→`habe.`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `meine`→`Meine`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `freundin`→`Freundin`
- `den`→`dem`
- `geheimnis`→`Geheimnis`
- `cousine`→`Cousine`
- `was`→`etwas`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0019 — Alltag

**Fehlertypen:** Partizip-Schreibung · Groß-/Kleinschreibung · Verbzeit · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich dachte erst der kuchen ist verbrant, aber unten war er noch weich und dann ist beim rausholen alles zerbrochen.` |
| FLOW output   | `Ich dachte erst der kuchen ist verbrant, aber unten war er noch weich und dann ist beim rausholen alles zerbrochen.` |
| Gold (clean)  | `Ich dachte erst, der Kuchen ist verbrannt, aber unten war er noch weich und dann ist beim Rausholen alles zerbrochen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `erst`→`erst,`
- `kuchen`→`Kuchen`
- `verbrant,`→`verbrannt,`
- `rausholen`→`Rausholen`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0020 — Gefühle

**Fehlertypen:** wen/wenn · Groß-/Kleinschreibung · ss/ß · ig/ich-Verwechslung · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen ich krank bin find ich es erst gut nicht in die shule zu müßen, aber später ist mir dann immer langweilich und komisch.` |
| FLOW output   | `Wenn ich krank bin find ich es erst gut nicht in die Schule zu müßen, aber später ist mir dann immer langweilich und komisch.` |
| Gold (clean)  | `Wenn ich krank bin, finde ich es erst gut, nicht in die Schule zu müssen, aber später ist mir dann immer langweilig und komisch.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**PG** (1 Regel)

- `PG:/\bshule\b/` — \bshule\b
  - Änderung: `shule`→`Schule`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `bin`→`bin,`
- `find`→`finde`
- `gut`→`gut,`
- `müßen,`→`müssen,`
- `langweilich`→`langweilig`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0021 — Schule

**Fehlertypen:** Zeitform · wider/wieder · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab mein referat fast fertig gehabt bis der computer einfach ausging und danach war die hälfte wider weg.` |
| FLOW output   | `Ich habe mein referat fast fertig gehabt bis der computer einfach ausging und danach war die hälfte wieder weg.` |
| Gold (clean)  | `Ich hatte mein Referat fast fertig, bis der Computer einfach ausging, und danach war die Hälfte wieder weg.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (1 Regel)

- `MO:/\bwider\b/` — \bwider\b
  - Änderung: `wider`→`wieder`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `habe`→`hatte`
- `referat`→`Referat`
- `fertig`→`fertig,`
- `gehabt`→`bis`
- `bis`→`der`
- `der`→`Computer`
- `computer`→`einfach`
- `einfach`→`ausging,`
- `ausging`→`und`
- `und`→`danach`
- `danach`→`war`
- `war`→`die`
- `die`→`Hälfte`
- `hälfte`→`wieder`
- `wieder`→`weg.`
- `weg.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0022 — Familie

**Fehlertypen:** Groß-/Kleinschreibung · eigentlich-Schreibung · wider/wieder · Getrennt-/Zusammenschreibung · lautnahe Schreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als wir bei tante mila waren durfte ich eigendlich fern sehen, nur dan haben die erwaksenen wider angefangen über geld zu reden und ich sollte leiser sein.` |
| FLOW output   | `Als wir bei tante mila waren durfte ich eigentlich fern sehen, nur dann haben die erwaksenen wieder angefangen über geld zu reden und ich sollte leiser sein.` |
| Gold (clean)  | `Als wir bei Tante Mila waren, durfte ich eigentlich fernsehen, nur dann haben die Erwachsenen wieder angefangen, über Geld zu reden, und ich sollte leiser sein.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**MO** (2 Regeln)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`
- `MO:/\bwider\b/` — \bwider\b
  - Änderung: `wider`→`wieder`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

- Vorher (FLOW): `Als wir bei tante mila waren durfte ich eigentlich fern sehen, nur dann haben die erwaksenen wieder angefangen über geld zu reden und ich sollte leiser sein.`
- Nachher (Gold): `Als wir bei Tante Mila waren, durfte ich eigentlich fernsehen, nur dann haben die Erwachsenen wieder angefangen, über Geld zu reden, und ich sollte leiser sein.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Lautnahe Schreibung / f/v: PG-Regeln decken nur explizit gelistete Formen ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0023 — Tiere

**Fehlertypen:** Groß-/Kleinschreibung · Doppelkonsonanten · überhaupt-Schreibung · konnte-Schreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `im zoo wollte ich die ziegen nur streicheln, aber eine hat meine karte angeknabert bevor ich überhaubt was machen konte.` |
| FLOW output   | `Im zoo wollte ich die ziegen nur streicheln, aber eine hat meine karte angeknabert, bevor ich überhaubt was machen konte.` |
| Gold (clean)  | `Im Zoo wollte ich die Ziegen nur streicheln, aber eine hat meine Karte angeknabbert, bevor ich überhaupt etwas machen konnte.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `angeknabert`→`angeknabert,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `im`→`Im`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `zoo`→`Zoo`
- `ziegen`→`Ziegen`
- `karte`→`Karte`
- `angeknabert,`→`angeknabbert,`
- `überhaubt`→`überhaupt`
- `was`→`etwas`
- `konte.`→`konnte.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0024 — Streit

**Fehlertypen:** obwohl-Schreibung · will-Schreibung · das/dass · Wortstellung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mein bruder sagt immer ich petze, obwol ich nur nicht wil das ich nacher mit ärger kriege.` |
| FLOW output   | `Mein bruder sagt immer ich petze, obwohl ich nur nicht wil das ich nacher mit ärger kriege.` |
| Gold (clean)  | `Mein Bruder sagt immer, ich petze, obwohl ich nur nicht will, dass ich nachher mit Ärger kriege.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bobwol\b/` — \bobwol\b
  - Änderung: `obwol`→`obwohl`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mein`→`Mein`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `bruder`→`Bruder`
- `immer`→`immer,`
- `wil`→`will,`
- `das`→`dass`
- `nacher`→`nachher`
- `ärger`→`Ärger`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0025 — Ausflug

**Fehlertypen:** das/dass · Groß-/Kleinschreibung · trotzdem-Schreibung · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab mich so auf den schulausflug gefreut das ich nachts kaum geschlafen habe, und morgens dan den wecker trozdem nicht gehört.` |
| FLOW output   | `Ich habe mich so auf den schulausflug gefreut das ich nachts kaum geschlafen habe, und morgens dann den wecker trotzdem nicht gehört.` |
| Gold (clean)  | `Ich habe mich so auf den Schulausflug gefreut, dass ich nachts kaum geschlafen habe und morgens dann den Wecker trotzdem nicht gehört habe.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\btrozdem\b/` — \btrozdem\b
  - Änderung: `trozdem`→`trotzdem`
- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `schulausflug`→`Schulausflug`
- `gefreut`→`gefreut,`
- `das`→`dass`
- `habe,`→`habe`
- `wecker`→`Wecker`
- `gehört.`→`gehört`
- `∅`→`habe.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0026 — kleine Geschichten

**Fehlertypen:** Verbform · Groß-/Kleinschreibung · das/dass · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil oma die fenster offen gelassen hatt sind die vorhänge so doll geflattert, das ich dachte da ist jemand im wohnzimmer.` |
| FLOW output   | `Weil oma die fenster offen gelassen hat sind die vorhänge so doll geflattert, das ich dachte da ist jemand im wohnzimmer.` |
| Gold (clean)  | `Weil Oma die Fenster offen gelassen hat, sind die Vorhänge so doll geflattert, dass ich dachte, da ist jemand im Wohnzimmer.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhatt\b/` — \bhatt\b
  - Änderung: `hatt`→`hat`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `oma`→`Oma`
- `fenster`→`Fenster`
- `hat`→`hat,`
- `vorhänge`→`Vorhänge`
- `das`→`dass`
- `dachte`→`dachte,`
- `wohnzimmer.`→`Wohnzimmer.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0027 — kleine Missgeschicke

**Fehlertypen:** Groß-/Kleinschreibung · Doppelkonsonanten · Partizip/Verbform · n/t-Verwechslung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich wollte nur kurz den ball holen, aber dan bin ich auf den nassen blättern ausgerutscht und mein knie hat ganz gebrant.` |
| FLOW output   | `Ich wollte nur kurz den ball holen, aber dann bin ich auf den nassen blättern ausgerutscht und mein knie hat ganz gebrannt.` |
| Gold (clean)  | `Ich wollte nur kurz den Ball holen, aber dann bin ich auf den nassen Blättern ausgerutscht und mein Knie hat ganz gebrannt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`
- `SL:/\bgebrant\b/` — \bgebrant\b
  - Änderung: `gebrant.`→`gebrannt.`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `ball`→`Ball`
- `blättern`→`Blättern`
- `knie`→`Knie`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab

---

## DE_ERR_0028 — Gefühle

**Fehlertypen:** wen/wenn · Verbform · gar nicht · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen mama traurig ist redet sie leiser als sonst, und dann trau ich mich meistens garnicht was lustiges zu sagen.` |
| FLOW output   | `Wenn mama traurig ist redet sie leiser als sonst, und dann trau ich mich meistens gar nicht was lustiges zu sagen.` |
| Gold (clean)  | `Wenn Mama traurig ist, redet sie leiser als sonst, und dann traue ich mich meistens gar nicht, etwas Lustiges zu sagen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bgarnicht\b/` — \bgarnicht\b
  - Änderung: `garnicht`→`gar`, `was`→`nicht`, `lustiges`→`was`, `zu`→`lustiges`, `sagen.`→`zu`, `∅`→`sagen.`

**SL** (1 Regel)

- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `mama`→`Mama`
- `ist`→`ist,`
- `trau`→`traue`
- `nicht`→`nicht,`
- `was`→`etwas`
- `lustiges`→`Lustiges`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0029 — Alltag

**Fehlertypen:** Groß-/Kleinschreibung · Kasusfehler · Getrennt-/Zusammenschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mein fahrradlicht ging nicht mehr obwohl papa das erst vorgestern gemacht hatte, und ich musste auf den heimweg neben her schieben.` |
| FLOW output   | `Mein fahrradlicht ging nicht mehr, obwohl papa das erst vorgestern gemacht hatte, und ich musste auf den heimweg neben her schieben.` |
| Gold (clean)  | `Mein Fahrradlicht ging nicht mehr, obwohl Papa das erst vorgestern gemacht hatte, und ich musste auf dem Heimweg nebenherschieben.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `mehr`→`mehr,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mein`→`Mein`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `fahrradlicht`→`Fahrradlicht`
- `papa`→`Papa`
- `den`→`dem`
- `heimweg`→`Heimweg`
- `neben`→`nebenherschieben.`
- `her`→`∅`
- `schieben.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0030 — Tiere

**Fehlertypen:** dan/dann · wen/wenn · Groß-/Kleinschreibung · Getrennt-/Zusammenschreibung · Konjunktiv-Schreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `unsere katze kommt immer genau dan rein wen ich die türe grade wieder zu gemacht habe und dan mauzt sie als wär ich schuld.` |
| FLOW output   | `Unsere katze kommt immer genau dann rein, wenn ich die türe grade wieder zu gemacht habe und dann mauzt sie als wär ich schuld.` |
| Gold (clean)  | `Unsere Katze kommt immer genau dann rein, wenn ich die Tür gerade wieder zugemacht habe, und dann mauzt sie, als wäre ich schuld.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`, `dan`→`dann`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `rein`→`rein,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `unsere`→`Unsere`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `katze`→`Katze`
- `türe`→`Tür`
- `grade`→`gerade`
- `zu`→`zugemacht`
- `gemacht`→`habe,`
- `habe`→`und`
- `und`→`dann`
- `dann`→`mauzt`
- `mauzt`→`sie,`
- `sie`→`als`
- `als`→`wäre`
- `wär`→`ich`
- `ich`→`schuld.`
- `schuld.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0031 — Schule

**Fehlertypen:** Groß-/Kleinschreibung · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `in deutsch sollte ich laut vorlesen, aber weil ich bei langen wörtern immer stolbere haben hinten welche gekichert.` |
| FLOW output   | `In deutsch sollte ich laut vorlesen, aber weil ich bei langen wörtern immer stolbere haben hinten welche gekichert.` |
| Gold (clean)  | `In Deutsch sollte ich laut vorlesen, aber weil ich bei langen Wörtern immer stolpere, haben hinten welche gekichert.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**GR** (2 Regeln)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `aber`→`aber,`
- `de-gr-komma-nach-koordinator-undo` — de-gr-komma-nach-koordinator-undo
  - Änderung: `aber,`→`aber`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `in`→`In`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `deutsch`→`Deutsch`
- `wörtern`→`Wörtern`
- `stolbere`→`stolpere,`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0032 — Familie

**Fehlertypen:** obwohl-Schreibung · gar keinen · Groß-/Kleinschreibung · Wortwahl Umgangssprache · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `obwol ich garkeinen hunger mehr hatte, sollte ich den teller leer essen und mir war danach voll schlecht im auto.` |
| FLOW output   | `Obwohl ich garkeinen hunger mehr hatte, sollte ich den teller leer essen und mir war danach voll schlecht im auto.` |
| Gold (clean)  | `Obwohl ich gar keinen Hunger mehr hatte, sollte ich den Teller leer essen, und mir war danach im Auto total schlecht.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bobwol\b/` — \bobwol\b
  - Änderung: `obwol`→`obwohl`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `obwohl`→`Obwohl`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `garkeinen`→`gar`
- `hunger`→`keinen`
- `mehr`→`Hunger`
- `hatte,`→`mehr`
- `sollte`→`hatte,`
- `ich`→`sollte`
- `den`→`ich`
- `teller`→`den`
- `leer`→`Teller`
- `essen`→`leer`
- `und`→`essen,`
- `mir`→`und`
- `war`→`mir`
- `danach`→`war`
- `voll`→`danach`
- `schlecht`→`im`
- `im`→`Auto`
- `auto.`→`total`
- `∅`→`schlecht.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0033 — Freunde

**Fehlertypen:** trotzdem-Schreibung · Groß-/Kleinschreibung · Worttrennung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab meiner besten freundin versprochen nichts zu sagen, trozdem ist es mir in der pause einfach so raus gerutscht.` |
| FLOW output   | `Ich habe meiner besten freundin versprochen nichts zu sagen, trotzdem ist es mir in der pause einfach so raus gerutscht.` |
| Gold (clean)  | `Ich habe meiner besten Freundin versprochen, nichts zu sagen, trotzdem ist es mir in der Pause einfach so rausgerutscht.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\btrozdem\b/` — \btrozdem\b
  - Änderung: `trozdem`→`trotzdem`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `freundin`→`Freundin`
- `versprochen`→`versprochen,`
- `pause`→`Pause`
- `raus`→`rausgerutscht.`
- `gerutscht.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0034 — Ängste

**Fehlertypen:** dan/dann · Groß-/Kleinschreibung · das/dass · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als der strom kurz weg war, hab ich erst gelacht aber dan wurde es im flur so still das ich doch angst gekriegt habe.` |
| FLOW output   | `Als der strom kurz weg war, habe ich erst gelacht aber dann wurde es im flur so still das ich doch angst gekriegt habe.` |
| Gold (clean)  | `Als der Strom kurz weg war, habe ich erst gelacht, aber dann wurde es im Flur so still, dass ich doch Angst gekriegt habe.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `strom`→`Strom`
- `gelacht`→`gelacht,`
- `flur`→`Flur`
- `still`→`still,`
- `das`→`dass`
- `angst`→`Angst`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0035 — kleine Missgeschicke

**Fehlertypen:** ie/i-Verwechslung · Verbform · Groß-/Kleinschreibung · Worttrennung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich sollte nur die pflanzen giesen, aber dabei hab ich den topf vom fensterbrett gestoßen und die erde lag über all.` |
| FLOW output   | `Ich sollte nur die pflanzen giesen, aber dabei habe ich den topf vom fensterbrett gestoßen und die erde lag über all.` |
| Gold (clean)  | `Ich sollte nur die Pflanzen gießen, aber dabei habe ich den Topf vom Fensterbrett gestoßen und die Erde lag überall.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `pflanzen`→`Pflanzen`
- `giesen,`→`gießen,`
- `topf`→`Topf`
- `fensterbrett`→`Fensterbrett`
- `erde`→`Erde`
- `über`→`überall.`
- `all.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)

---

## DE_ERR_0036 — Alltag

**Fehlertypen:** seid/seit · ü/u-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `seid die neue nachbarin da wohnt, bellen die hunde morgens noch früer und ich bin in der ersten stunde immer müde.` |
| FLOW output   | `Seid die neue nachbarin da wohnt, bellen die hunde morgens noch früer und ich bin in der ersten stunde immer müde.` |
| Gold (clean)  | `Seit die neue Nachbarin da wohnt, bellen die Hunde morgens noch früher und ich bin in der ersten Stunde immer müde.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `seid`→`Seid`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `Seid`→`Seit`
- `nachbarin`→`Nachbarin`
- `hunde`→`Hunde`
- `früer`→`früher`
- `stunde`→`Stunde`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- seid/seit: CTX-Regel de-seit-seid vorhanden aber deaktiviert (Homonyme-Grenzfall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0037 — Familie

**Fehlertypen:** Kasusfehler · Doppelkonsonanten · tz/ts-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil ich zu doll an den luftbalon gezogen hab ist er geplatst, und meine kleine cousine hat sofort angefangen zu weinen.` |
| FLOW output   | `Weil ich zu doll an den luftbalon gezogen habe ist er geplatst, und meine kleine cousine hat sofort angefangen zu weinen.` |
| Gold (clean)  | `Weil ich zu doll an dem Luftballon gezogen habe, ist er geplatzt, und meine kleine Cousine hat sofort angefangen zu weinen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `den`→`dem`
- `luftbalon`→`Luftballon`
- `habe`→`habe,`
- `geplatst,`→`geplatzt,`
- `cousine`→`Cousine`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0038 — Wünsche

**Fehlertypen:** Konjunktivform · nicht mal/nicht einmal · Kasus/Flexion · Groß-/Kleinschreibung

| Rolle | Text |
|---|---|
| Input (noisy) | `am liebsten würd ich ein pferd haben, aber wir haben nichtmal platz für mein roller in der garage.` |
| FLOW output   | `Am liebsten würd ich ein pferd haben, aber wir haben nichtmal platz für mein roller in der garage.` |
| Gold (clean)  | `Am liebsten würde ich ein Pferd haben, aber wir haben nicht einmal Platz für meinen Roller in der Garage.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `am`→`Am`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `würd`→`würde`
- `pferd`→`Pferd`
- `nichtmal`→`nicht`
- `platz`→`einmal`
- `für`→`Platz`
- `mein`→`für`
- `roller`→`meinen`
- `in`→`Roller`
- `der`→`in`
- `garage.`→`der`
- `∅`→`Garage.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen

---

## DE_ERR_0039 — Hausaufgaben

**Fehlertypen:** umgangssprachliche Verkürzung · dan/dann · Doppelkonsonanten · Infinitiv/Substantivierung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab die hausis extra gleich gemacht damit ich später spielen kann, aber dan kam noch lesen und zimmer aufreumen dazu.` |
| FLOW output   | `Ich habe die hausis extra gleich gemacht, damit ich später spielen kann, aber dann kam noch lesen und zimmer aufreumen dazu.` |
| Gold (clean)  | `Ich habe die Hausaufgaben extra gleich gemacht, damit ich später spielen kann, aber dann kamen noch Lesen und Zimmer aufräumen dazu.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `gemacht`→`gemacht,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `hausis`→`Hausaufgaben`
- `kam`→`kamen`
- `lesen`→`Lesen`
- `zimmer`→`Zimmer`
- `aufreumen`→`aufräumen`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0040 — Schule

**Fehlertypen:** wen/wenn · dan/dann · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen der bus zu spät kommt werde ich immer hibbelig, weil ich dan denke die lehrerin glaubt mir das eh nicht.` |
| FLOW output   | `Wenn der bus zu spät kommt werde ich immer hibbelig, weil ich dann denke die lehrerin glaubt mir das eh nicht.` |
| Gold (clean)  | `Wenn der Bus zu spät kommt, werde ich immer hibbelig, weil ich dann denke, die Lehrerin glaubt mir das eh nicht.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `bus`→`Bus`
- `kommt`→`kommt,`
- `denke`→`denke,`
- `lehrerin`→`Lehrerin`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0041 — Wetter

**Fehlertypen:** Zusammenschreibung · lautnahe Schreibung · das/dass · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als ich den schnee mann gebaut hab, sind meine handschuhe irgentwann so nass geworden das die finger weh getan haben.` |
| FLOW output   | `Als ich den schnee mann gebaut habe, sind meine handschuhe irgendwann so nass geworden das die finger weh getan haben.` |
| Gold (clean)  | `Als ich den Schneemann gebaut habe, sind meine Handschuhe irgendwann so nass geworden, dass die Finger wehgetan haben.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (1 Regel)

- `MO:/\birgentwann\b/` — \birgentwann\b
  - Änderung: `irgentwann`→`irgendwann`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab,`→`habe,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `schnee`→`Schneemann`
- `mann`→`gebaut`
- `gebaut`→`habe,`
- `habe,`→`sind`
- `sind`→`meine`
- `meine`→`Handschuhe`
- `handschuhe`→`irgendwann`
- `irgendwann`→`so`
- `so`→`nass`
- `nass`→`geworden,`
- `geworden`→`dass`
- `das`→`die`
- `die`→`Finger`
- `finger`→`wehgetan`
- `weh`→`haben.`
- `getan`→`∅`
- `haben.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Lautnahe Schreibung / f/v: PG-Regeln decken nur explizit gelistete Formen ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0042 — Schule

**Fehlertypen:** Verbform · Zusammenschreibung · drin/drinn · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich wolte nicht petzen aber weil der raucheralarm im schulklo los ging haben sowieso alle gefragt wer da drinn war.` |
| FLOW output   | `Ich wollte nicht petzen aber weil der raucheralarm im schulklo los ging haben sowieso alle gefragt wer da drinn war.` |
| Gold (clean)  | `Ich wollte nicht petzen, aber weil der Rauchalarm im Schulklo losging, haben sowieso alle gefragt, wer da drin war.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte`→`wollte`

**GR** (2 Regeln)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `aber`→`aber,`
- `de-gr-komma-nach-koordinator-undo` — de-gr-komma-nach-koordinator-undo
  - Änderung: `aber,`→`aber`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `petzen`→`petzen,`
- `raucheralarm`→`Rauchalarm`
- `schulklo`→`Schulklo`
- `los`→`losging,`
- `ging`→`haben`
- `haben`→`sowieso`
- `sowieso`→`alle`
- `alle`→`gefragt,`
- `gefragt`→`wer`
- `wer`→`da`
- `da`→`drin`
- `drinn`→`war.`
- `war.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0043 — Streit

**Fehlertypen:** Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mama hat gesagt ich soll mich nicht immer mit meiner schwester streiten, aber sie nimmt mir auch dauernd meine stifte weg.` |
| FLOW output   | `Mama hat gesagt ich soll mich nicht immer mit meiner schwester streiten, aber sie nimmt mir auch dauernd meine stifte weg.` |
| Gold (clean)  | `Mama hat gesagt, ich soll mich nicht immer mit meiner Schwester streiten, aber sie nimmt mir auch dauernd meine Stifte weg.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mama`→`Mama`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `gesagt`→`gesagt,`
- `schwester`→`Schwester`
- `stifte`→`Stifte`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0044 — Alltag

**Fehlertypen:** das/dass · Zusammenschreibung · Verbform · g/ch-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich dachte das eis ist schon fest genug, aber als ich rein gebissen hab war in der mitte noch alles flüssich.` |
| FLOW output   | `Ich dachte, dass eis ist schon fest genug, aber als ich rein gebissen habe war in der mitte noch alles flüssich.` |
| Gold (clean)  | `Ich dachte, das Eis ist schon fest genug, aber als ich reingebissen habe, war in der Mitte noch alles flüssig.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `dachte`→`dachte,`, `das`→`dass`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `dass`→`das`
- `eis`→`Eis`
- `rein`→`reingebissen`
- `gebissen`→`habe,`
- `habe`→`war`
- `war`→`in`
- `in`→`der`
- `der`→`Mitte`
- `mitte`→`noch`
- `noch`→`alles`
- `alles`→`flüssig.`
- `flüssich.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0045 — Ängste

**Fehlertypen:** Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `obwohl ich die ganze zeit tapfer sein wolte, musste ich beim impfen doch heulen und das war mir hinterher peinlich.` |
| FLOW output   | `Obwohl ich die ganze zeit tapfer sein wollte, musste ich beim impfen doch heulen und das war mir hinterher peinlich.` |
| Gold (clean)  | `Obwohl ich die ganze Zeit tapfer sein wollte, musste ich beim Impfen doch heulen, und das war mir hinterher peinlich.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte,`→`wollte,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `obwohl`→`Obwohl`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `zeit`→`Zeit`
- `impfen`→`Impfen`
- `heulen`→`heulen,`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0046 — Tiere

**Fehlertypen:** Verbform · Substantivierung · Konjunktiv-Schreibung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `unser meerschweinchen frist nur das grüne aus dem salat und lässt die anderen sachen liegen, als wär es was besseres.` |
| FLOW output   | `Unser meerschweinchen frist nur das grüne aus dem salat und lässt die anderen sachen liegen, als wär es was besseres.` |
| Gold (clean)  | `Unser Meerschweinchen frisst nur das Grüne aus dem Salat und lässt die anderen Sachen liegen, als wäre es etwas Besseres.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `unser`→`Unser`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `meerschweinchen`→`Meerschweinchen`
- `frist`→`frisst`
- `grüne`→`Grüne`
- `salat`→`Salat`
- `sachen`→`Sachen`
- `wär`→`wäre`
- `was`→`etwas`
- `besseres.`→`Besseres.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0047 — Alltag

**Fehlertypen:** ü/u-Verwechslung · dan/dann · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil ich die uhr falsch gelesen hab stand ich viel zu frü auf und hab dan im dunkeln schon mein brot geschmiert.` |
| FLOW output   | `Weil ich die uhr falsch gelesen habe stand ich viel zu frü auf und habe dann im dunkeln schon mein brot geschmiert.` |
| Gold (clean)  | `Weil ich die Uhr falsch gelesen habe, stand ich viel zu früh auf und habe dann im Dunkeln schon mein Brot geschmiert.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`, `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `uhr`→`Uhr`
- `habe`→`habe,`
- `frü`→`früh`
- `dunkeln`→`Dunkeln`
- `brot`→`Brot`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0048 — Ausflug

**Fehlertypen:** Groß-/Kleinschreibung · eigentlich-Schreibung · Kasusfehler · Verbform · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `im ferienlager hab ich nachts so getan als wär ich mutig, aber eigendlich hab ich bei jeden geräusch an wildschweine gedacht.` |
| FLOW output   | `Im ferienlager habe ich nachts so getan als wär ich mutig, aber eigentlich habe ich bei jeden geräusch an wildschweine gedacht.` |
| Gold (clean)  | `Im Ferienlager habe ich nachts so getan, als wäre ich mutig, aber eigentlich habe ich bei jedem Geräusch an Wildschweine gedacht.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (1 Regel)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`, `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `im`→`Im`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `ferienlager`→`Ferienlager`
- `getan`→`getan,`
- `wär`→`wäre`
- `jeden`→`jedem`
- `geräusch`→`Geräusch`
- `wildschweine`→`Wildschweine`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0049 — kleine Missgeschicke

**Fehlertypen:** Getrennt-/Zusammenschreibung · dan/dann · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich wollte nur helfen die taschen rein zu tragen und dan ist mir genau der beutel mit den äpfeln unten aufgeplatzt.` |
| FLOW output   | `Ich wollte nur helfen die taschen rein zu tragen und dann ist mir genau der beutel mit den äpfeln unten aufgeplatzt.` |
| Gold (clean)  | `Ich wollte nur helfen, die Taschen reinzutragen, und dann ist mir genau der Beutel mit den Äpfeln unten aufgeplatzt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `helfen`→`helfen,`
- `taschen`→`Taschen`
- `rein`→`reinzutragen,`
- `zu`→`und`
- `tragen`→`dann`
- `und`→`ist`
- `dann`→`mir`
- `ist`→`genau`
- `mir`→`der`
- `genau`→`Beutel`
- `der`→`mit`
- `beutel`→`den`
- `mit`→`Äpfeln`
- `den`→`unten`
- `äpfeln`→`aufgeplatzt.`
- `unten`→`∅`
- `aufgeplatzt.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0050 — Schule

**Fehlertypen:** Groß-/Kleinschreibung · nix/nichts · das/dass · zu tuhn/zu tun · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `in sachkunde hab ich erst nix verstanden, weil alle von verdunstung geredet haben und ich dachte das hat was mit dunst im bad zu tuhn.` |
| FLOW output   | `In sachkunde habe ich erst nichts verstanden, weil alle von verdunstung geredet haben und ich dachte, dass hat was mit dunst im bad zu tuhn.` |
| Gold (clean)  | `In Sachkunde habe ich erst nichts verstanden, weil alle von Verdunstung geredet haben und ich dachte, das hat etwas mit Dunst im Bad zu tun.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (2 Regeln)

- `SN:/\bnix\b/` — \bnix\b
  - Änderung: `nix`→`nichts`
- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `dachte`→`dachte,`, `das`→`dass`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `in`→`In`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `sachkunde`→`Sachkunde`
- `verdunstung`→`Verdunstung`
- `dass`→`das`
- `was`→`etwas`
- `dunst`→`Dunst`
- `bad`→`Bad`
- `tuhn.`→`tun.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0051 — Gefühle

**Fehlertypen:** Verbverkürzung · Artikel-Auslassung · Konjunktiv-Schreibung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `meine cousine redet schon fast wie erwachsen, und ich komm mir daneben immer so vor als ob ich noch baby wär.` |
| FLOW output   | `Meine cousine redet schon fast wie erwachsen, und ich komm mir daneben immer so vor als, ob ich noch baby wär.` |
| Gold (clean)  | `Meine Cousine redet schon fast wie erwachsen, und ich komme mir daneben immer so vor, als ob ich noch ein Baby wäre.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**GR** (1 Regel)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `als`→`als,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `meine`→`Meine`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `cousine`→`Cousine`
- `komm`→`komme`
- `vor`→`vor,`
- `als,`→`als`
- `baby`→`ein`
- `wär.`→`Baby`
- `∅`→`wäre.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0052 — Freizeit

**Fehlertypen:** das/dass · Getrennt-/Zusammenschreibung · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als wir vom spielplatz heim sind, hab ich gemerkt das mein pulli hinten falschrum war und alle das bestimmt gesehen haben.` |
| FLOW output   | `Als wir vom spielplatz heim sind, habe ich gemerkt, dass mein pulli hinten falschrum war und alle das bestimmt gesehen haben.` |
| Gold (clean)  | `Als wir vom Spielplatz heim sind, habe ich gemerkt, dass mein Pulli hinten falsch herum war und alle das bestimmt gesehen haben.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `gemerkt`→`gemerkt,`, `das`→`dass`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `spielplatz`→`Spielplatz`
- `pulli`→`Pulli`
- `falschrum`→`falsch`
- `war`→`herum`
- `und`→`war`
- `alle`→`und`
- `das`→`alle`
- `bestimmt`→`das`
- `gesehen`→`bestimmt`
- `haben.`→`gesehen`
- `∅`→`haben.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0053 — Alltag

**Fehlertypen:** wen/wenn · dan/dann · ei/ie-Verwechslung · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen papa sagt wir fahren nur ganz kurz einkaufen, dan dauert es meisstens extra lang und ich krieg hunger im laden.` |
| FLOW output   | `Wenn papa sagt wir fahren nur ganz kurz einkaufen, dann dauert es meisstens extra lang und ich krieg hunger im laden.` |
| Gold (clean)  | `Wenn Papa sagt, wir fahren nur ganz kurz einkaufen, dann dauert es meistens extra lang und ich bekomme Hunger im Laden.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `papa`→`Papa`
- `sagt`→`sagt,`
- `meisstens`→`meistens`
- `krieg`→`bekomme`
- `hunger`→`Hunger`
- `laden.`→`Laden.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0054 — Schule

**Fehlertypen:** obwohl-Schreibung · Doppelkonsonanten · das/dass · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `obwol wir im test leise sein sollten, hat mein magen so laut geknurt das sogar tom sich umgedreht hat.` |
| FLOW output   | `Obwohl wir im test leise sein sollten, hat mein magen so laut geknurt das sogar tom sich umgedreht hat.` |
| Gold (clean)  | `Obwohl wir im Test leise sein sollten, hat mein Magen so laut geknurrt, dass sogar Tom sich umgedreht hat.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bobwol\b/` — \bobwol\b
  - Änderung: `obwol`→`obwohl`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `obwohl`→`Obwohl`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `test`→`Test`
- `magen`→`Magen`
- `geknurt`→`geknurrt,`
- `das`→`dass`
- `tom`→`Tom`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0055 — Familie

**Fehlertypen:** ie/i-Verwechslung · wider/wieder · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab meiner oma einen brief gemalt und geschriben, aber die adresse war falsch und er kam wider zurück.` |
| FLOW output   | `Ich habe meiner oma einen brief gemalt und geschriben, aber die adresse war falsch und er kam wieder zurück.` |
| Gold (clean)  | `Ich habe meiner Oma einen Brief gemalt und geschrieben, aber die Adresse war falsch und er kam wieder zurück.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (1 Regel)

- `MO:/\bwider\b/` — \bwider\b
  - Änderung: `wider`→`wieder`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `oma`→`Oma`
- `brief`→`Brief`
- `geschriben,`→`geschrieben,`
- `adresse`→`Adresse`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0056 — Freunde

**Fehlertypen:** Konjunktivform · umgangssprachliche Verkürzung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil mein freund zuerst mit den anderen gegangen ist, hab ich so getan als wärs mir egal aber innerlich war ich voll sauer.` |
| FLOW output   | `Weil mein freund zuerst mit den anderen gegangen ist, habe ich so getan als wärs mir egal aber innerlich war ich voll sauer.` |
| Gold (clean)  | `Weil mein Freund zuerst mit den anderen gegangen ist, habe ich so getan, als wäre es mir egal, aber innerlich war ich total sauer.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `freund`→`Freund`
- `getan`→`getan,`
- `wärs`→`wäre`
- `mir`→`es`
- `egal`→`mir`
- `aber`→`egal,`
- `innerlich`→`aber`
- `war`→`innerlich`
- `ich`→`war`
- `voll`→`ich`
- `sauer.`→`total`
- `∅`→`sauer.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0057 — Ängste

**Fehlertypen:** eigentlich-Schreibung · wider/wieder · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich sollte eigendlich nur die decke holen, aber dann hab ich im dunklen keller wider dieses komische ticken gehört.` |
| FLOW output   | `Ich sollte eigentlich nur die decke holen, aber dann habe ich im dunklen keller wieder dieses komische ticken gehört.` |
| Gold (clean)  | `Ich sollte eigentlich nur die Decke holen, aber dann habe ich im dunklen Keller wieder dieses komische Ticken gehört.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (2 Regeln)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`
- `MO:/\bwider\b/` — \bwider\b
  - Änderung: `wider`→`wieder`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `decke`→`Decke`
- `keller`→`Keller`
- `ticken`→`Ticken`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0058 — Schule

**Fehlertypen:** Kompositum/Flexion · Kasusfehler · Groß-/Kleinschreibung

| Rolle | Text |
|---|---|
| Input (noisy) | `im kunstunterricht ist mein pinselhaar in den kleber gekommen und danach sah der himmel auf mein bild aus wie suppe.` |
| FLOW output   | `Im kunstunterricht ist mein pinselhaar in den kleber gekommen und danach sah der himmel auf mein bild aus wie suppe.` |
| Gold (clean)  | `Im Kunstunterricht ist mein Pinselhaar in den Kleber gekommen und danach sah der Himmel auf meinem Bild aus wie Suppe.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `im`→`Im`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `kunstunterricht`→`Kunstunterricht`
- `pinselhaar`→`Pinselhaar`
- `kleber`→`Kleber`
- `himmel`→`Himmel`
- `mein`→`meinem`
- `bild`→`Bild`
- `suppe.`→`Suppe.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen

---

## DE_ERR_0059 — Familie

**Fehlertypen:** nix/nichts · das/dass · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `meine schwester behauptet immer sie hätte nix gemacht, obwohl man genau sieht das sie die schokoladenfinger an der tür hatte.` |
| FLOW output   | `Meine schwester behauptet immer sie hätte nichts gemacht, obwohl man genau sieht das sie die schokoladenfinger an der tür hatte.` |
| Gold (clean)  | `Meine Schwester behauptet immer, sie hätte nichts gemacht, obwohl man genau sieht, dass sie die Schokoladenfinger an der Tür hatte.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bnix\b/` — \bnix\b
  - Änderung: `nix`→`nichts`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `meine`→`Meine`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `schwester`→`Schwester`
- `immer`→`immer,`
- `sieht`→`sieht,`
- `das`→`dass`
- `schokoladenfinger`→`Schokoladenfinger`
- `tür`→`Tür`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0060 — Wetter

**Fehlertypen:** das/dass · pp/p-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `heute war es so windig das mein regenschirm gleich beim ersten mal umgeklapt ist und ich doch ganz nass wurde.` |
| FLOW output   | `Heute war es so windig das mein regenschirm gleich beim ersten mal umgeklapt ist und ich doch ganz nass wurde.` |
| Gold (clean)  | `Heute war es so windig, dass mein Regenschirm gleich beim ersten Mal umgeklappt ist und ich doch ganz nass wurde.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `heute`→`Heute`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `windig`→`windig,`
- `das`→`dass`
- `regenschirm`→`Regenschirm`
- `mal`→`Mal`
- `umgeklapt`→`umgeklappt`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0061 — kleine Missgeschicke

**Fehlertypen:** Groß-/Kleinschreibung · Getrennt-/Zusammenschreibung · Umgangssprache · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `als wir den kuchen zu oma gebracht haben, ist die sahne in der kurve zur seite gerutscht und es sah dann voll traurig aus.` |
| FLOW output   | `Als wir den kuchen zu oma gebracht haben, ist die sahne in der kurve zur seite gerutscht und es sah dann voll traurig aus.` |
| Gold (clean)  | `Als wir den Kuchen zu Oma gebracht haben, ist die Sahne in der Kurve zur Seite gerutscht und es sah dann total traurig aus.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `als`→`Als`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `kuchen`→`Kuchen`
- `oma`→`Oma`
- `sahne`→`Sahne`
- `kurve`→`Kurve`
- `seite`→`Seite`
- `voll`→`total`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0062 — Schule

**Fehlertypen:** gar nicht · das/dass · Partizip/Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab dem lehrer erst garnicht gesagt das ich die mappe vergessen habe, weil ich gehoft hab das er es nicht merkt.` |
| FLOW output   | `Ich habe dem lehrer erst gar nicht gesagt, dass ich die mappe vergessen habe, weil ich gehoft habe das er es nicht merkt.` |
| Gold (clean)  | `Ich habe dem Lehrer erst gar nicht gesagt, dass ich die Mappe vergessen habe, weil ich gehofft habe, dass er es nicht merkt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (2 Regeln)

- `SN:/\bgarnicht\b/` — \bgarnicht\b
  - Vorher: `ich hab dem lehrer erst garnicht gesagt das ich die mappe vergessen habe, weil ich gehoft hab das er es nicht merkt.`
  - Nachher: `ich hab dem lehrer erst gar nicht gesagt das ich die mappe vergessen habe, weil ich gehoft hab das er es nicht merkt.`
- `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` — \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b
  - Änderung: `gesagt`→`gesagt,`, `das`→`dass`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`, `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `lehrer`→`Lehrer`
- `mappe`→`Mappe`
- `gehoft`→`gehofft`
- `habe`→`habe,`
- `das`→`dass`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0063 — Familie

**Fehlertypen:** wen/wenn · dan/dann · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `wen wir im auto singen findet mama das lustig, aber papa sagt dan immer wir treffen die töne von außen.` |
| FLOW output   | `Wenn wir im auto singen findet mama das lustig, aber papa sagt dann immer wir treffen die töne von außen.` |
| Gold (clean)  | `Wenn wir im Auto singen, findet Mama das lustig, aber Papa sagt dann immer, wir treffen die Töne von außen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bdan\b/` — \bdan\b
  - Änderung: `dan`→`dann`
- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `wenn`→`Wenn`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `auto`→`Auto`
- `singen`→`singen,`
- `mama`→`Mama`
- `papa`→`Papa`
- `immer`→`immer,`
- `töne`→`Töne`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0064 — Freizeit

**Fehlertypen:** gar nicht · eigentlich-Schreibung · Getrennt-/Zusammenschreibung · Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `im schwimmbad hab ich so getan als wär das wasser garnicht kalt, obwohl ich eigendlich fast wieder raus springen wolte.` |
| FLOW output   | `Im schwimmbad habe ich so getan als wär das wasser gar nicht kalt, obwohl ich eigentlich fast wieder raus springen wollte.` |
| Gold (clean)  | `Im Schwimmbad habe ich so getan, als wäre das Wasser gar nicht kalt, obwohl ich eigentlich fast wieder rausspringen wollte.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SN** (1 Regel)

- `SN:/\bgarnicht\b/` — \bgarnicht\b
  - Vorher: `im schwimmbad hab ich so getan als wär das wasser garnicht kalt, obwohl ich eigendlich fast wieder raus springen wolte.`
  - Nachher: `im schwimmbad hab ich so getan als wär das wasser gar nicht kalt, obwohl ich eigendlich fast wieder raus springen wolte.`

**SL** (1 Regel)

- `SL:/\bwolte\b/` — \bwolte\b
  - Änderung: `wolte.`→`wollte.`

**MO** (1 Regel)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `im`→`Im`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `schwimmbad`→`Schwimmbad`
- `getan`→`getan,`
- `wär`→`wäre`
- `wasser`→`Wasser`
- `raus`→`rausspringen`
- `springen`→`wollte.`
- `wollte.`→`∅`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0065 — Freunde

**Fehlertypen:** Partizip/Verbform · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `mein freund hat gesagt er kommt gleich runter, aber ich hab bestimmt zehn minuten unten gestanden bis seine mutter ihn gesucht hat.` |
| FLOW output   | `Mein freund hat gesagt er kommt gleich runter, aber ich habe bestimmt zehn minuten unten gestanden bis seine mutter ihn gesucht hat.` |
| Gold (clean)  | `Mein Freund hat gesagt, er kommt gleich runter, aber ich habe bestimmt zehn Minuten unten gestanden, bis seine Mutter ihn gesucht hat.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `mein`→`Mein`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `freund`→`Freund`
- `gesagt`→`gesagt,`
- `minuten`→`Minuten`
- `gestanden`→`gestanden,`
- `mutter`→`Mutter`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0066 — Schule

**Fehlertypen:** Verbform · Groß-/Kleinschreibung · ch/g-Verwechslung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `weil ich beim basteln zu viel kleber genommen hab, klebte mein ärmel nachher am tisch fest und ich musste ganz vorsichtig ziehen.` |
| FLOW output   | `Weil ich beim basteln zu viel kleber genommen habe, klebte mein ärmel nachher am tisch fest und ich musste ganz vorsichtig ziehen.` |
| Gold (clean)  | `Weil ich beim Basteln zu viel Kleber genommen habe, klebte mein Ärmel nachher am Tisch fest und ich musste ganz vorsichtig ziehen.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab,`→`habe,`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `weil`→`Weil`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `basteln`→`Basteln`
- `kleber`→`Kleber`
- `ärmel`→`Ärmel`
- `tisch`→`Tisch`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0067 — Tiere

**Fehlertypen:** das/dass · Kasusfehler · Partizip-Schreibung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab gedacht das die ente am teich friedlich ist, aber dann hat sie einfach nach mein schnürsenkel geschnapt.` |
| FLOW output   | `Ich habe gedacht das die ente am teich friedlich ist, aber dann hat sie einfach nach mein schnürsenkel geschnapt.` |
| Gold (clean)  | `Ich habe gedacht, dass die Ente am Teich friedlich ist, aber dann hat sie einfach nach meinem Schnürsenkel geschnappt.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `gedacht`→`gedacht,`
- `das`→`dass`
- `ente`→`Ente`
- `teich`→`Teich`
- `mein`→`meinem`
- `schnürsenkel`→`Schnürsenkel`
- `geschnapt.`→`geschnappt.`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0068 — Alltag

**Fehlertypen:** obwohl-Schreibung · Verbform · n/t-Verwechslung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `obwol ich heute mal früh schlafen sollte hab ich noch so lange unter der decke gelesen bis die augen gebrant haben.` |
| FLOW output   | `Obwohl ich heute mal früh schlafen sollte habe ich noch so lange unter der decke gelesen bis die augen gebrannt haben.` |
| Gold (clean)  | `Obwohl ich heute mal früh schlafen sollte, habe ich noch so lange unter der Decke gelesen, bis die Augen gebrannt haben.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (2 Regeln)

- `SL:/\bgebrant\b/` — \bgebrant\b
  - Änderung: `gebrant`→`gebrannt`
- `SL:/\bobwol\b/` — \bobwol\b
  - Änderung: `obwol`→`obwohl`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `obwohl`→`Obwohl`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `sollte`→`sollte,`
- `decke`→`Decke`
- `gelesen`→`gelesen,`
- `augen`→`Augen`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0069 — Familie

**Fehlertypen:** wen/wenn · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `meine tante fragt immer ob ich schon groß bin, aber wen ich dann was alleine machen will sagen alle gleich pass auf.` |
| FLOW output   | `Meine tante fragt immer, ob ich schon groß bin, aber wenn ich dann was alleine machen will sagen alle gleich pass auf.` |
| Gold (clean)  | `Meine Tante fragt immer, ob ich schon groß bin, aber wenn ich dann etwas alleine machen will, sagen alle gleich: Pass auf.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**SL** (1 Regel)

- `SL:/\bwen\b/` — \bwen\b
  - Änderung: `wen`→`wenn`

**GR** (2 Regeln)

- `de-gr-komma-nebensatz` — de-gr-komma-nebensatz
  - Änderung: `immer`→`immer,`, `aber`→`aber,`
- `de-gr-komma-nach-koordinator-undo` — de-gr-komma-nach-koordinator-undo
  - Änderung: `aber,`→`aber`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `meine`→`Meine`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `tante`→`Tante`
- `was`→`etwas`
- `will`→`will,`
- `gleich`→`gleich:`
- `pass`→`Pass`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## DE_ERR_0070 — Schule

**Fehlertypen:** wusste-Schreibung · eigentlich-Schreibung · Groß-/Kleinschreibung · Zeichensetzung

| Rolle | Text |
|---|---|
| Input (noisy) | `ich hab beim rechnen die zahlen immer wieder vertauscht, obwohl ich genau wuste wie es eigendlich gehen sollte.` |
| FLOW output   | `Ich habe beim rechnen die zahlen immer wieder vertauscht, obwohl ich genau wuste wie es eigentlich gehen sollte.` |
| Gold (clean)  | `Ich habe beim Rechnen die Zahlen immer wieder vertauscht, obwohl ich genau wusste, wie es eigentlich gehen sollte.` |
| Übereinstimmung | ⚠️ partiell |

### Regelentscheidungen

**MO** (1 Regel)

- `MO:/\beigendlich\b/` — \beigendlich\b
  - Änderung: `eigendlich`→`eigentlich`

**PG** (1 Regel)

- `PG:/\bhab\b/` — \bhab\b
  - Änderung: `hab`→`habe`

**POST** (1 Regel)

- `post-normalize` — Whitespace + Satzanfang-Großschreibung
  - Änderung: `ich`→`Ich`

### Abweichung von Gold

Token-Differenzen (FLOW→Gold):

- `rechnen`→`Rechnen`
- `zahlen`→`Zahlen`
- `wuste`→`wusste,`

**ZH1-Scope-Analyse:**

- Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen
- Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)

---

## Zusammenfassung

### Trefferquote

| Kategorie | Anzahl | Anteil |
|---|---|---|
| ✅ Vollständige Gold-Übereinstimmung | 0 | 0.0% |
| ⚠️ Partielle Korrekturen           | 70 | 100.0% |
| ❌ Keine Änderung                   | 0    | 0.0% |

### Häufigste Regelauslösungen (über alle 70 Sätze)

| Stage | Regel-ID | Beschreibung | Auslösungen |
|---|---|---|---|
| POST | `post-normalize` | Whitespace + Satzanfang-Großschreibung | 70 |
| PG | `PG:/\bhab\b/` | \bhab\b | 29 |
| GR | `de-gr-komma-nebensatz` | de-gr-komma-nebensatz | 15 |
| SL | `SL:/\bdan\b/` | \bdan\b | 12 |
| SL | `SL:/\bwen\b/` | \bwen\b | 9 |
| SL | `SL:/\bwolte\b/` | \bwolte\b | 7 |
| MO | `MO:/\beigendlich\b/` | \beigendlich\b | 7 |
| SN | `SN:/\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/` | \b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b | 6 |
| MO | `MO:/\bwider\b/` | \bwider\b | 5 |
| SL | `SL:/\btrozdem\b/` | \btrozdem\b | 4 |
| SN | `SN:/\bgarnicht\b/` | \bgarnicht\b | 4 |
| GR | `de-gr-komma-nach-koordinator-undo` | de-gr-komma-nach-koordinator-undo | 4 |
| SL | `SL:/\bobwol\b/` | \bobwol\b | 4 |
| PG | `PG:/\bhatt\b/` | \bhatt\b | 3 |
| SN | `SN:/\bausversehen\b/` | \bausversehen\b | 3 |
| PG | `PG:/\bshule\b/` | \bshule\b | 2 |
| SL | `SL:/\bgebrant\b/` | \bgebrant\b | 2 |
| SN | `SN:/\bnix\b/` | \bnix\b | 2 |
| PG | `PG:/\bfor\b/` | \bfor\b | 1 |
| PG | `PG:/\bgesakt\b/` | \bgesakt\b | 1 |
| PG | `PG:/\bferge(?:ß|s)en\b/` | \bferge(?:ß|s)en\b | 1 |
| PG | `PG:/\bkucken\b/` | \bkucken\b | 1 |
| PG | `PG:/\bgekipt\b/` | \bgekipt\b | 1 |
| SN | `SN:/\brunter nemen\b/` | \brunter nemen\b | 1 |
| MO | `MO:/\birgentwie\b/` | \birgentwie\b | 1 |
| MO | `MO:/\banderst\b/` | \banderst\b | 1 |
| MO | `MO:/\babents\b/` | \babents\b | 1 |
| MO | `MO:/\bdrausen\b/` | \bdrausen\b | 1 |
| PG | `PG:/\bknurt\b/` | \bknurt\b | 1 |
| PG | `PG:/\bleuft\b/` | \bleuft\b | 1 |
| SN | `SN:/\baufeinmal\b/` | \baufeinmal\b | 1 |
| SL | `SL:/\bmanchma\b/` | \bmanchma\b | 1 |
| GR | `de-gr-komma-nach-auch-undo` | de-gr-komma-nach-auch-undo | 1 |
| PG | `PG:/\bfrür\b/` | \bfrür\b | 1 |
| SL | `SL:/\bvieleicht\b/` | \bvieleicht\b | 1 |
| PG | `PG:/\bweis\b/` | \bweis\b | 1 |
| SL | `SL:/\bmuste\b/` | \bmuste\b | 1 |
| SL | `SL:/\bmusten\b/` | \bmusten\b | 1 |
| SN | `SN:/\bgarkein\b/` | \bgarkein\b | 1 |
| SN | `SN:/\bzuhause\b/` | \bzuhause\b | 1 |
| PG | `PG:/\bgequitscht\b/` | \bgequitscht\b | 1 |
| MO | `MO:/\birgentwann\b/` | \birgentwann\b | 1 |

### Nicht vollständig korrigierte Fehlerklassen

(Jede Zeile = mindestens ein Satz hatte diesen Fehlertyp und ist nicht identisch mit Gold)

| Fehlertyp | Sätze mit Abweichung |
|---|---|
| Groß-/Kleinschreibung | 70 |
| Zeichensetzung | 66 |
| Verbform | 31 |
| das/dass | 19 |
| Doppelkonsonanten | 10 |
| Getrennt-/Zusammenschreibung | 9 |
| wen/wenn | 9 |
| dan/dann | 8 |
| eigentlich-Schreibung | 7 |
| Kasusfehler | 7 |
| Worttrennung | 5 |
| wider/wieder | 5 |
| lautnahe Schreibung | 4 |
| trotzdem-Schreibung | 4 |
| gar nicht | 4 |
| Zusammenschreibung | 4 |
| obwohl-Schreibung | 4 |
| ü/u-Verwechslung | 3 |
| ie/i-Verwechslung | 3 |
| umgangssprachliche Verkürzung | 3 |
| Partizip/Verbform | 3 |
| Konjunktiv-Schreibung | 3 |
| Flexion | 2 |
| wahr/war | 2 |
| seid/seit | 2 |
| Zeitform | 2 |
| Partizip-Schreibung | 2 |
| n/t-Verwechslung | 2 |
| Konjunktivform | 2 |
| nix/nichts | 2 |
| f/v-Verwechslung | 1 |
| ä/e-Verwechslung | 1 |
| anderst/anders | 1 |
| außer/äu-Verwechslung | 1 |
| weis/weiß | 1 |
| ie/ei-Verwechslung | 1 |
| Pronomengebrauch | 1 |
| Artikel/Präposition | 1 |
| erzählt-Schreibung | 1 |
| u/ck-Verwechslung | 1 |
| gar kein | 1 |
| Verbzeit | 1 |
| ss/ß | 1 |
| ig/ich-Verwechslung | 1 |
| überhaupt-Schreibung | 1 |
| konnte-Schreibung | 1 |
| will-Schreibung | 1 |
| Wortstellung | 1 |
| gar keinen | 1 |
| Wortwahl Umgangssprache | 1 |
| tz/ts-Verwechslung | 1 |
| nicht mal/nicht einmal | 1 |
| Kasus/Flexion | 1 |
| Infinitiv/Substantivierung | 1 |
| drin/drinn | 1 |
| g/ch-Verwechslung | 1 |
| Substantivierung | 1 |
| zu tuhn/zu tun | 1 |
| Verbverkürzung | 1 |
| Artikel-Auslassung | 1 |
| ei/ie-Verwechslung | 1 |
| Kompositum/Flexion | 1 |
| pp/p-Verwechslung | 1 |
| Umgangssprache | 1 |
| ch/g-Verwechslung | 1 |
| wusste-Schreibung | 1 |

### Pipeline-Abdeckung

| Stage | Regel-IDs | Abgedeckte Phänomene |
|---|---|---|
| PUNCT | de-punct-anfuehrungszeichen, universal-punct-ellipsis, universal-punct-em-dash-* | Typografische Anführungszeichen, Ellipsis, Gedankenstrich |
| CTX   | universal-space-before-punct, universal-multiple-spaces | Leerzeichen vor Satzzeichen, doppelte Leerzeichen |
| CTX (deaktiviert) | de-weil-dass, de-seit-seid, de-dem-hause | das/dass nach weil/ob; seid/seit; Dativ-Formen |
| SN    | garnich, garnicht, ausversehen, aufeinmal, zuende, weiter-gegangen, hats, dachte/gesagt/gewusst/gehört-dass | Getrennt-/Zusammenschreibung, Worttrennung, dass-Konjunktion |
| SL    | villeicht/vieleicht, wier, wolte, trozdem, dan→dann, wen→wenn, gebrant→gebrannt | Silbenstruktur, Doppelkonsonanten, Vokalfolgen |
| MO    | irgentwie, irgentwann, eigendlich, obwol→obwohl, erklert, gewessen, wolte | Morphologische Stammformen, nd/nt-Verwechslung |
| PG    | gelsen, ferig, weis→weiß, shule→Schule, nich→nicht, hab→habe | Phonem-Graphem-Korrespondenz, sh/sch-Verwechslung |
| GR    | komma-nebensatz (+damit), word-repeat, sodass, apostroph-genitiv, als-wie | Kommasetzung, Wortwiederholung, Zusammenschreibung |
| POST  | normalizeSentenceStarts, normalizeWhitespace | Satzanfang-Großschreibung, Whitespace |

### Strukturelle Lücken (nicht abgedeckt durch FLOW DE v0.5)

| Lücke | Grund |
|---|---|
| Substantiv-Großschreibung (alle Nomen) | Erfordert POS-Tagging; nicht in regelbasiertem System lösbar |
| Verbformen (hatt→hat, wahren→waren) | Grammatische Morphologie außerhalb ZH1-Scope |
| Flexionsendungen (meinen, habe) | Grammatische Morphologie außerhalb ZH1-Scope |
| das/dass (kontextabhängig) | de-weil-dass deaktiviert; allgemein-kontextuell nicht lösbar |
| seid/seit | de-seit-seid deaktiviert; Homophones Paar |
| wen/wenn, dan/dann | Doppelkonsonant-Regel fehlt im Regelwerk |
| wahr/war, anderst/anders | Kein Kontextmodell für Homonyme |
| wider/wieder | Homophones Paar; "wider" ist gültiges deutsches Wort (gegen/contrary) |
| gar keinen / gar kein (zusammengeschrieben) | Nur 1× in Datensatz; Einzelfall |
| Lautnahe Schreibvarianten (verbleibend) | PG-Lexikon abgedeckt für: shule, weis, hab, gelsen, ferig, nigh |
| f/v-Verwechslung (for→vor, fergeßen→vergessen) | "for" ist englisches Wort; globale f/v-Regel zu riskant |
| wen→wenn: bekanntes falsch-positiv | Akkusativ "wen" (wen rufst du an?) wird ebenfalls korrigiert |
