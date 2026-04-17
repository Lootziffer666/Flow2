# Database Support Layer (Non-canonical DB Runtime)

`flow-db/` is the canonical database home (schema, migrations, runtime DB tooling, ingestion tools, tests, and FLOW-owned DB data territory).

This `database/` tree is intentionally reduced to supporting/transitional content:
- rule documentation (`database/rules/`)
- generated/support artifacts and reports (`database/artifacts/`)
- compatibility pointer docs (`database/debug/`)

Important boundary:
- `database/` is not the canonical DB runtime code home.
- maintained rule docs stay here for now (by design) until a curated migration is explicitly approved.
