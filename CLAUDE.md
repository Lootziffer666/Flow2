# CLAUDE.md

## Project defaults
- Start with `docs/repo-map.md`.
- For architecture changes, read `docs/architecture.md`.
- Prefer smallest viable patch.
- Reuse existing patterns.
- Run `npm run verify` before finalizing.

## Important repo truths
- `packages/loom` is the canonical shared foundation.
- Avoid resurrecting deprecated folder structures.
- Treat docs as part of the product contract.

## When uncertain
- Ask: is this hypothetical, verified, or blocked?
- Prefer explicit constraints over plausible guessing.
