# LOOM

LOOM is the engine diagnostics/signals layer.

DB/data ownership note:
- shared Loom-owned language truth is being migrated into `loom-db/`.
- package runtime modules should consume canonical Loom resources from `loom-db` rather than duplicating them in package-local files.

Current state:
- marker-set resources are sourced from `loom-db/language/markers.js`.
- additional Loom-owned resources remain to be extracted in later controlled migration blocks.
