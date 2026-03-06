# Flow2

Deterministischer FLOW-MVP-Normalizer (SN -> SL -> MO -> PG) mit minimaler UI-Verdrahtung.

## Tests

- `node test_normalization.js`
- `node test_rules_debug.js`
- `node test_ui_integration.js`

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
