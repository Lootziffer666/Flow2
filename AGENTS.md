## Goal
Maintain this repo with minimal drift. Prefer small, verifiable changes.

## Working rules
- Read `docs/repo-map.md` before cross-package changes.
- Read `docs/architecture.md` before changing shared abstractions.
- Run the appropriate verification scripts before claiming completion.
- Do not introduce new dependencies without explicit justification.
- Prefer extending existing patterns over inventing new ones.
- Keep changes scoped to one concern when possible.
- Treat docs as part of the product contract, not as disposable commentary.

## Monorepo rules
- `packages/loom` is the canonical shared engine.
- Do not reintroduce legacy `shared` ownership patterns.
- Cross-package renames require docs updates.
- Do not duplicate linguistic truth outside LOOM.
- Product-specific logic belongs to the product layer, not to LOOM.

## DB / data rules
- `flow-db` is the canonical FLOW-specific data layer.
- Do not treat `flow-db` as the canonical source of general language truth.
- Benchmark, corpus, rule, and runtime assets must stay semantically separated.
- Do not move materials across data layers just to make naming look cleaner.

## Output rules
- Summarize changed files.
- State which checks ran and their result.
- If blocked, name the blocker precisely.

## Documentation maintenance
- If structure, ownership, package boundaries, scripts, or canonical locations change, update the relevant README files in the same change.
- Do not leave README updates as optional follow-up work.
- If no README was updated, explicitly state why none was needed.

## Known bugs / incomplete state
- Do not claim completion while known relevant runtime or integration bugs remain unmentioned.
- If checks fail because of a known bug, name it explicitly in the output.
- Keep a `Known Bugs` section updated in the relevant README or status doc when an issue materially affects development or verification.
