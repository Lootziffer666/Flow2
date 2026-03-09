# Flow2

Deterministischer FLOW-MVP-Normalizer (SN -> SL -> MO -> PG) mit minimaler UI-Verdrahtung.

## Tests

- `node test_normalization.js`
- `node test_rules_debug.js`
- `node test_ui_integration.js`
- `node test_flow_learning.js`

## PR-Hinweis (Codex)

Wenn die Meldung erscheint, dass eine bestehende PR nicht aktualisiert werden kann,
muss ein **neuer Branch** mit **neuem PR** erstellt werden.

## Merge-Konflikte: current vs incoming

Für dieses Repo gilt aktuell:

- `rules.sn.js`, `rules.sl.js`, `rules.mo.js`, `rules.pg.js` exportieren Default-Arrays (`module.exports = RULES`).
- `ruleEngine.js` importiert diese als Default (`require('./rules.sn')` etc.).

Darum ist bei Konflikten in diesen Dateien meist **current** korrekt,
sofern `incoming` auf Named Exports umstellt (`module.exports = { RULES }`) und
nicht gleichzeitig alle Importe konsistent angepasst werden.

Schnellcheck vor Commit:

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" -g '*.js' .
```


## Native Windows App (FLOW_Normalizer.cs)

Status im Repo:
- `FLOW_Normalizer.cs` ist jetzt enthalten (native WinForms + Keyboard-Hook + Tray).
- Die App ruft `node loom_cli.js <wort>` auf und nutzt damit direkt `pipeline.js`.

Wenn nach dem Start "nichts passiert":
1. Auf Tray-Ballon achten: Die App führt jetzt automatisch einen Self-Check aus.
2. Im Tray-Menü `Status anzeigen` öffnen (Hook/Node/Dateien auf einen Blick).
3. Im Tray-Menü `Diagnose erneut prüfen` klicken.
4. `flow_startup.log` öffnen (wird im EXE-Ordner geschrieben).
5. Sicherstellen, dass `node` im PATH ist (`node -v`).
6. Sicherstellen, dass `loom_cli.js` + `pipeline.js` im selben Ordner wie die EXE liegen.
7. Testen mit: `node loom_cli.js "ich hab zeit"`.

Build (Windows):
```bash
csc /target:winexe /out:FLOW_Normalizer.exe FLOW_Normalizer.cs
```

### Neue UI-/Branding-Assets

Wenn vorhanden, nutzt `FLOW_Normalizer.cs` jetzt automatisch:
- Splash: `FLOW_SPLASH_DARK.png` / `FLOW_SPLASH_LIGHT.png`
- Tray-Icon: `FLOW_TRAY_ICON_DARK.ico` / `FLOW_TRAY_ICON_LIGHT.ico`
- About-Logo: `FLOW_TRAY_ICON_DARK.png` / `FLOW_TRAY_ICON_LIGHT.png`
- Startsound: `startup.mp3`

Tray-Menü enthält jetzt:
- `Persönliches Wörterbuch` (GUI zum Add/Remove/Save von Ausnahmen)
- `Über FLOW` (inkl. Credit: Yusuf_FX für den Startsound)

## Sprachunterstützung

- Standard: Deutsch (`de`)
- Englisch aktivieren per Env: `FLOW_LANGUAGE=en`
- Englisch aktivieren per CLI: `node loom_cli.js --lang en "i definately dont know"`
- Lernen ist sprachgetrennt in `flow_rules.json` unter `languages.de` / `languages.en`.

- Optionales Englisch-Preset per CLI: `node loom_cli.js --lang en --en-preset en-prose-plus "hello. i am here"`
- Legacy-Kompatibilität: `node loom_cli.js "text" en` funktioniert weiterhin.
