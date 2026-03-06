# Flow2

Deterministischer FLOW-MVP-Normalizer (SN -> SL -> MO -> PG) mit minimaler UI-Verdrahtung.

## Tests

- `node test_normalization.js`
- `node test_rules_debug.js`
- `node test_ui_integration.js`

## PR-Fehler "außerhalb von Codex erstellt"

Wenn diese Meldung erscheint, kann die bestehende PR nicht aktualisiert werden.
Vorgehen in diesem Repo:

1. Änderungen lokal committen.
2. Einen **neuen Branch** erstellen.
3. Daraus eine **neue PR** erzeugen.

Kurzablauf:

```bash
git checkout -b fix/<kurzname>
git push -u origin fix/<kurzname>
```

## Merge-Konflikte: `current` oder `incoming`?

Für die Regeldateien gilt standardmäßig **`current`**, wenn `incoming` auf Named Exports umstellt.

- Aktuelles Schema:
  - `rules.*.js`: `module.exports = RULES`
  - `ruleEngine.js`: `require('./rules.sn')`
- Problematische Incoming-Variante:
  - `module.exports = { RULES }` (bricht ohne passende Import-Umstellung)

Schnellcheck vor Commit:

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" -g '*.js' .
```
