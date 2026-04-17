# CLAUDE.md

## Project defaults
- Start with `docs/repo-map.md`.
- For architecture changes, read `docs/architecture.md`.
- Prefer the smallest viable patch.
- Reuse existing patterns.
- Run the appropriate verification scripts before finalizing.

## Important repo truths
- `packages/loom` is the canonical shared foundation.
- Avoid resurrecting deprecated folder structures.
- Treat docs as part of the product contract.
- `flow-db` is FLOW-owned and must not become the general language truth layer.

## Working mode
- Plan first, then execute.
- For prompts and coding tasks, assemble the full result before outputting it.
- Do not emit a “first version” and then append required corrections below it.
- Use explicit constraints instead of plausible guessing.

## When uncertain
- Ask: is this hypothetical, verified, or blocked?
- Prefer explicit constraints over plausible guessing.

## Working mode additions
- Treat README maintenance as part of the implementation, not as optional cleanup.
- When a known bug affects verification or scope, surface it explicitly instead of burying it in a summary.
