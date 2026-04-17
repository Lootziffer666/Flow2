# OLD_MAIN File Matrix (Refreshed)

| old_main path | file type | likely purpose | closest current equivalent | classification | confidence | action | notes |
|---|---|---|---|---|---|---|---|
| old_main/.gitignore | config | local ignore for legacy standalone | root `.gitignore` + monorepo ignores | legacy_script_safe_to_drop | high | **deleted** | removed as obsolete standalone residue |
| old_main/package-lock.json | lockfile | dependency lock for legacy package | workspace lockfiles | legacy_script_safe_to_drop | high | **deleted** | removed; not canonical in workspace setup |
| old_main/node_modules/** | vendored deps | dependency snapshot | workspace installs | legacy_script_safe_to_drop | high | **deleted** | generated/vendor content removed |
| old_main/grammar.js | js code | grammar stage stub | `packages/shared/src/rules.gr.js` | legacy_script_safe_to_drop | high | **deleted** | no-op legacy stub |
| old_main/tokenizer.js | js code | simple tokenizer helper | `packages/flow/src/ruleEngine.js` tokenizer path | already_migrated | high | **deleted** | superseded in active engine |
| old_main/safeFixes.js | js code | safe-fix stage stub | staged normalization in `packages/flow/src/ruleEngine.js` | legacy_script_safe_to_drop | high | **deleted** | no meaningful logic |
| old_main/test.js | js code | legacy self-test entrypoint | `packages/flow/test/**` | already_migrated | high | **deleted** | superseded by package tests |
| old_main/pipeline.js | js code | thin wrapper around normalizer | `packages/flow/src/pipeline.js` | already_migrated | high | **deleted** | richer current pipeline is canonical |
| old_main/KLICK_MICH.bat | windows helper | wrapper for AHK launcher | none | legacy_script_safe_to_drop | high | **deleted** | tied to legacy desktop wrapper flow |
| old_main/TEST_PIPELINE.bat | windows helper | portable-node pipeline smoke runner | none | legacy_script_safe_to_drop | high | **deleted** | obsolete helper |
| old_main/concepts/Logiktest.md | doc | debug sample text | `data/benchmark/examples/manual_debug/Logiktest.md` | already_migrated | high | **deleted** | verified byte-identical duplicate |
| old_main/concepts/Testsatz_1_de.md | doc | debug sample text | `data/benchmark/examples/manual_debug/Testsatz_1_de.md` | already_migrated | high | **deleted** | verified byte-identical duplicate |
| old_main/concepts/Regeldatenbank für orthografische Normalisierung und Zielhypothesenbildung.md | doc | long-form rules rationale | `database/rules/Erweitertes_Regelwerk.md` | partially_migrated | high | **archived** | moved to `docs/archive/old_main_concepts/` |
| old_main/concepts/Links_Quellen_Flow_NEU.md | doc | source/reference links | `database/rules/Links_Quellen_NEU_DE.md` | partially_migrated | high | **archived** | URL set verified equivalent after normalization |
| old_main/concepts/Das Stammprinzip bei der Korrektur von Auslautverhärtungen.md | doc | morphology rationale | `database/rules/Aktuellstes_Regelwerk.md` (thematic overlap) | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_concepts/` |
| old_main/concepts/Herausforderungen der Orthografie_ Dyslexie im Englischen.md | doc | EN orthography background | no direct equivalent verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_concepts/` |
| old_main/concepts/PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md | doc | early PRD/planning | no direct equivalent verified | unique_should_migrate | medium | **archived** | moved to `docs/archive/old_main_concepts/`; manual extraction still recommended |
| old_main/concepts/Systematische Matrix zur orthografischen Normalisierung in Korpora.docx | binary docx | concept matrix source | none verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_binaries/` |
| old_main/concepts/Regeldatenbank zur orthografische Normalisierung und Zielhypothesenerstellung.docx | binary docx | source draft | none verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_binaries/` |
| old_main/concepts/Linguistische Normalisierung und Orthografische Zielhypothesen.docx | binary docx | conceptual design source | none verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_binaries/` |
| old_main/concepts/Orthografische Normalisierung und Ambiguitätsmatrix der Zielhypothese 1.docx | binary docx | ambiguity matrix source | none verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_binaries/` |
| old_main/concepts/Matrix der orthografischen Ersetzungsregeln zur linguistischen Normalisierung (1).xlsx | binary xlsx | structured rule matrix | none verified | unique_must_review | medium | **archived** | moved to `docs/archive/old_main_binaries/` |
| old_main/FLOW.ahk | AHK script | desktop hotkey integration | none maintained | unique_should_migrate | medium | keep for decision | remaining legacy integration artifact |
| old_main/launcher.js | js code | file-IO launcher bridge | `packages/flow/src/loom_cli.js` (different interface) | unique_must_review | medium | keep for decision | potential historical integration reference |
| old_main/normalizer.js | js code | monolithic deterministic normalizer + self-test | `packages/flow/src/rules.*`, `ruleEngine.js`, tests | partially_migrated | high | keep for decision | rule provenance reference |
| old_main/package.json | config | legacy standalone scripts/deps | root/package scripts + `scripts/**` + `database/tools/**` | partially_migrated | medium | keep for decision | not canonical but still useful migration breadcrumb |
| old_main/README.md | doc | legacy project intro | root/package READMEs | historical_reference_archive_only | high | keep or archive later | harmless historical marker |
| old_main/tasks.md | doc | migration/backlog notes | `docs/Monorepo*.md` | unique_must_review | medium | keep for manual decision | may contain unresolved intent |
| old_main/images.jpeg | binary image | unknown asset | none verified | unique_must_review | low | keep for manual decision | origin/use unclear |

