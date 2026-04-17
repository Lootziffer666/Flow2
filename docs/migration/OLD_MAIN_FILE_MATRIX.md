# OLD_MAIN File Matrix

| old_main path | file type | likely purpose | closest current equivalent | classification | confidence | action | notes |
|---|---|---|---|---|---|---|---|
| old_main/.gitignore | config | local ignore for legacy standalone | root `.gitignore` + monorepo ignores | legacy_script_safe_to_drop | high | drop with `old_main` | scoped to old standalone artifacts |
| old_main/package.json | config | standalone package scripts/deps | root `package.json`, `database/tools/**`, `scripts/**` | partially_migrated | medium | archive then drop | scripts point to old layout (`tools/` paths) |
| old_main/package-lock.json | lockfile | dependency lock for legacy package | workspace locks (`package-lock.json`) | legacy_script_safe_to_drop | high | drop | obsolete with monorepo workspace management |
| old_main/README.md | doc | minimal legacy project identity | root README + package READMEs | historical_reference_archive_only | high | archive only | not canonical architecture now |
| old_main/pipeline.js | js code | thin wrapper `runCorrection` calling normalizer | `packages/flow/src/pipeline.js` | already_migrated | high | keep archived reference only | current pipeline much richer (metadata, language, loom signals) |
| old_main/normalizer.js | js code | monolithic deterministic normalization rules + self-test | `packages/flow/src/rules.*.js` + `ruleEngine.js` + tests | partially_migrated | high | no migration now; keep reference | rules are distributed and evolved; not text-identical |
| old_main/grammar.js | js code | grammar stage stub returning empty issues | `packages/shared/src/rules.gr.js` | legacy_script_safe_to_drop | high | drop after verification | legacy file is non-functional stub |
| old_main/tokenizer.js | js code | simple whitespace/punctuation tokenizer | `packages/flow/src/ruleEngine.js` tokenizer + shared analysis modules | already_migrated | high | drop candidate | trivial helper superseded |
| old_main/safeFixes.js | js code | safe-fix stage stub (no-op) | `packages/flow/src/ruleEngine.js` staged normalization | legacy_script_safe_to_drop | high | drop | no meaningful logic |
| old_main/launcher.js | js code | file-based IO launcher (`input.txt` -> `out.txt`) | `packages/flow/src/loom_cli.js`, `loom_cli.js` | unique_must_review | medium | archive + deprecate decision | historical integration for AHK wrappers |
| old_main/test.js | js code | invokes `runSelfTest` in normalizer | `packages/flow/test/test_normalization.js` and related tests | already_migrated | high | drop candidate | legacy self-test entrypoint superseded |
| old_main/tasks.md | doc | migration/backlog notes | `docs/Monorepo*.md`, `docs/Monorepo_Next_Steps_Plan.md` | unique_must_review | medium | review and extract decisions | may contain unresolved tasks |
| old_main/FLOW.ahk | AHK script | desktop hotkey integration with legacy launcher | no direct maintained equivalent found | unique_should_migrate | medium | archive in docs/archive with status note | valuable historical integration path |
| old_main/KLICK_MICH.bat | windows script | starts AHK runtime and FLOW.ahk | none | legacy_script_safe_to_drop | high | drop after AHK decision | helper wrapper only |
| old_main/TEST_PIPELINE.bat | windows script | checks portable node + runs legacy test/launcher | none | legacy_script_safe_to_drop | high | drop after AHK decision | tied to `ahk\node` portable layout |
| old_main/images.jpeg | binary image | unknown legacy asset | none found | unique_must_review | low | inspect origin, then archive or discard | no obvious references in active code/docs |
| old_main/node_modules/** | vendored deps | dependency snapshot for legacy standalone | workspace installs | legacy_script_safe_to_drop | high | drop | generated/vendor content, not source of truth |
| old_main/concepts/Logiktest.md | doc | debug sample text | `database/debug/Logiktest.md` | already_migrated | high | dedupe and drop old copy | verified byte-identical |
| old_main/concepts/Testsatz_1_de.md | doc | debug sample text | `database/debug/Testsatz_1_de.md` | already_migrated | high | dedupe and drop old copy | verified byte-identical |
| old_main/concepts/Regeldatenbank für orthografische Normalisierung und Zielhypothesenbildung.md | doc | long-form rule matrix and rationale | `database/rules/Erweitertes_Regelwerk.md` | partially_migrated | high | keep one canonical copy outside old_main | content appears largely transferred |
| old_main/concepts/Links_Quellen_Flow_NEU.md | doc | source/reference link list | `database/rules/Links_Quellen_NEU_DE.md` | partially_migrated | medium | compare and merge missing links | not byte-identical |
| old_main/concepts/Das Stammprinzip bei der Korrektur von Auslautverhärtungen.md | doc | morphology-focused rationale | `database/rules/Aktuellstes_Regelwerk.md` (partial thematic overlap) | unique_must_review | medium | archive or extract unique rationale | no clear one-to-one copy found |
| old_main/concepts/Herausforderungen der Orthografie_ Dyslexie im Englischen.md | doc | EN dyslexia/orthography context | no direct equivalent confirmed | unique_must_review | medium | archive and tag as research background | may still inform EN roadmap |
| old_main/concepts/PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md | doc | phase-0 PRD | no direct equivalent confirmed | unique_should_migrate | medium | migrate key decisions into docs/architecture | likely historically important planning context |
| old_main/concepts/Systematische Matrix zur orthografischen Normalisierung in Korpora.docx | binary docx | concept matrix source | none verified | unique_must_review | medium | archive binary and decide keep/discard | no text-parsed equivalent proven |
| old_main/concepts/Regeldatenbank zur orthografischen Normalisierung und Zielhypothesenerstellung.docx | binary docx | source draft of rules DB | none verified | unique_must_review | medium | archive binary and decide keep/discard | likely precursor of markdown rules docs |
| old_main/concepts/Linguistische Normalisierung und Orthografische Zielhypothesen.docx | binary docx | conceptual design source | none verified | unique_must_review | medium | archive binary and decide keep/discard | unique binary artifact |
| old_main/concepts/Orthografische Normalisierung und Ambiguitätsmatrix der Zielhypothese 1.docx | binary docx | ambiguity matrix source | none verified | unique_must_review | medium | archive binary and decide keep/discard | unique binary artifact |
| old_main/concepts/Matrix der orthografischen Ersetzungsregeln zur linguistischen Normalisierung (1).xlsx | binary xlsx | structured rule matrix dataset | none verified | unique_must_review | medium | archive binary and decide keep/discard | may contain structured data absent elsewhere |

