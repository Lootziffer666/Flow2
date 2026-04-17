## Goal
Maintain this repo with minimal drift. Prefer small, verifiable changes.

## Working rules
- Read `docs/repo-map.md` before cross-package changes.
- Read `docs/architecture.md` before changing shared abstractions.
- Run `npm run verify` before claiming completion.
- Do not introduce new dependencies without explicit justification.
- Prefer editing existing patterns over inventing new ones.
- Keep commits scoped to one concern when possible.

## Monorepo rules
- `packages/loom` is the canonical shared engine.
- Do not reintroduce legacy `shared` ownership patterns.
- Cross-package renames require docs updates.

## Output rules
- Summarize changed files.
- State which checks ran and their result.
- If blocked, name the blocker precisely.
