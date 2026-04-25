#!/usr/bin/env python3
"""Multi-cycle synthetic sentence pipeline.

Generates 300 sentences per FLOW profile per cycle, runs a deterministic
refinery (whitespace normalization, exact-duplicate removal, near-duplicate
detection, schema validation), and writes accepted batches into
``data/synthetic/<profile>/<YYYY-MM-DD>/cycle_<NNNNNN>.jsonl``.

Two entry points:

* ``run-cycle`` — execute one cycle and print a JSON metrics line.
* ``run-loop``  — execute cycles back-to-back until a wall-clock budget
  expires, committing and pushing after each successful cycle.

The script reuses ``generate_flow_synthetic_sentences`` for generation
and varies ``seed_offset`` per cycle/profile to keep cross-cycle overlap
bounded while still drawing from the curated template space.
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import os
import re
import subprocess
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = REPO_ROOT / "scripts" / "benchmark"
sys.path.insert(0, str(SCRIPTS_DIR))

import generate_flow_synthetic_sentences as gen  # noqa: E402

OUTPUT_ROOT = REPO_ROOT / "data" / "synthetic"
RUN_LOG_PATH = OUTPUT_ROOT / "_run_log.jsonl"
SESSION_DIR = OUTPUT_ROOT / "_sessions"
PROFILE_INDEX = {p.name: i for i, p in enumerate(gen.PROFILES)}

REQUIRED_FIELDS = {
    "id",
    "profile",
    "language",
    "difficulty",
    "voice",
    "realism",
    "theme",
    "form",
    "source",
}

NEAR_DUP_TOKEN_OVERLAP = 0.92
NEAR_DUP_MIN_TOKENS = 4
TARGET_PER_TYPE = 300
UNDERFILL_THRESHOLD = 150
SENTENCE_END = re.compile(r"[\.!?]$")
WORD_RE = re.compile(r"\w+", re.UNICODE)


@dataclasses.dataclass
class CycleTypeResult:
    profile: str
    generated: int
    refined: int
    duplicates_dropped: int
    near_dup_quarantined: int
    schema_rejected: int
    accepted: int
    underfilled: bool
    output_path: str | None
    quarantine_path: str | None


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def utc_compact() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def normalize_source(text: str) -> str:
    return " ".join(text.split())


def schema_ok(record: dict) -> bool:
    if not isinstance(record, dict):
        return False
    if not REQUIRED_FIELDS.issubset(record.keys()):
        return False
    src = record.get("source")
    if not isinstance(src, str) or not src.strip():
        return False
    if len(src.split()) < 3:
        return False
    if not SENTENCE_END.search(src.strip()):
        return False
    return True


def tokenize(text: str) -> list[str]:
    return [tok.lower() for tok in WORD_RE.findall(text)]


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def detect_near_duplicates(records: list[dict]) -> set[int]:
    """Return indices of records flagged as near-duplicates of an earlier record."""
    flagged: set[int] = set()
    token_sets: list[set[str]] = []
    for idx, rec in enumerate(records):
        tokens = set(tokenize(rec["source"]))
        if len(tokens) < NEAR_DUP_MIN_TOKENS:
            token_sets.append(tokens)
            continue
        for prev_idx, prev_tokens in enumerate(token_sets):
            if prev_idx in flagged:
                continue
            if not prev_tokens:
                continue
            if jaccard(tokens, prev_tokens) >= NEAR_DUP_TOKEN_OVERLAP:
                flagged.add(idx)
                break
        token_sets.append(tokens)
    return flagged


def refine_records(raw: list[dict]) -> tuple[list[dict], list[dict], dict[str, int]]:
    """Run refinery on a list of generated records.

    Returns (accepted, quarantined, counts).
    """
    counts = {
        "generated": len(raw),
        "schema_rejected": 0,
        "duplicates_dropped": 0,
        "near_dup_quarantined": 0,
    }

    cleaned: list[dict] = []
    seen_sources: set[str] = set()
    seen_ids: set[str] = set()
    quarantined: list[dict] = []

    for rec in raw:
        if not isinstance(rec, dict):
            counts["schema_rejected"] += 1
            continue
        # Normalize text, strip junk
        if "source" in rec and isinstance(rec["source"], str):
            rec = dict(rec)
            rec["source"] = normalize_source(rec["source"])
        if not schema_ok(rec):
            counts["schema_rejected"] += 1
            continue
        src = rec["source"]
        if src in seen_sources:
            counts["duplicates_dropped"] += 1
            continue
        rid = rec.get("id")
        if rid in seen_ids:
            counts["duplicates_dropped"] += 1
            continue
        seen_sources.add(src)
        seen_ids.add(rid)
        cleaned.append(rec)

    near_dup_idx = detect_near_duplicates(cleaned)
    accepted: list[dict] = []
    for i, rec in enumerate(cleaned):
        if i in near_dup_idx:
            qrec = dict(rec)
            qrec["_quarantine_reason"] = "near_duplicate"
            quarantined.append(qrec)
            counts["near_dup_quarantined"] += 1
        else:
            accepted.append(rec)

    return accepted, quarantined, counts


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def append_jsonl(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def seed_offset_for(profile_name: str, cycle: int) -> int:
    idx = PROFILE_INDEX.get(profile_name, 0)
    return cycle * 1000 + idx * 7


def generate_for_profile(profile, cycle: int, attempt: int) -> list[dict]:
    offset = seed_offset_for(profile.name, cycle) + attempt * 137
    return gen.generate_records_for_profile(profile, seed_offset=offset)


def generate_for_profile_with_retry(
    profile, cycle: int, max_attempts: int = 5
) -> tuple[list[dict], int, list[str]]:
    """Try multiple seed offsets until generation succeeds or attempts exhausted."""
    errors: list[str] = []
    for attempt in range(max_attempts):
        try:
            return generate_for_profile(profile, cycle, attempt), attempt, errors
        except RuntimeError as exc:
            errors.append(f"attempt {attempt}: {exc}")
            continue
    raise RuntimeError(
        f"all {max_attempts} generation attempts failed for {profile.name}: "
        + " | ".join(errors)
    )


def renumber_ids(records: list[dict], profile_name: str, cycle: int) -> list[dict]:
    out = []
    for i, rec in enumerate(records, start=1):
        rec = dict(rec)
        rec["id"] = f"{profile_name}-c{cycle:04d}-{i:06d}"
        out.append(rec)
    return out


def run_cycle(cycle: int, session_id: str, log_path: Path) -> dict:
    cycle_started = utc_iso()
    cycle_t0 = time.time()
    date_dir = utc_date()
    type_results: list[CycleTypeResult] = []
    failures: list[dict] = []

    for profile in gen.PROFILES:
        try:
            raw, used_attempt, gen_errors = generate_for_profile_with_retry(
                profile, cycle
            )
            if gen_errors:
                failures.extend(
                    {
                        "profile": profile.name,
                        "step": "generate_retry",
                        "error": e,
                    }
                    for e in gen_errors
                )
            accepted, quarantined, counts = refine_records(raw)
            underfilled = False
            # Optional one regeneration pass if underfilled
            if len(accepted) < UNDERFILL_THRESHOLD:
                try:
                    raw2 = generate_for_profile(
                        profile, cycle, used_attempt + 1
                    )
                    accepted2, quarantined2, counts2 = refine_records(raw2)
                    if len(accepted2) > len(accepted):
                        accepted = accepted2
                        quarantined = quarantined2
                        counts = counts2
                except RuntimeError as exc:
                    failures.append(
                        {
                            "profile": profile.name,
                            "step": "underfill_regenerate",
                            "error": str(exc),
                        }
                    )
                if len(accepted) < UNDERFILL_THRESHOLD:
                    underfilled = True

            # Cap to TARGET_PER_TYPE — keep first 300 deterministically
            accepted = accepted[:TARGET_PER_TYPE]
            accepted = renumber_ids(accepted, profile.name, cycle)

            ts = utc_compact()
            out_dir = OUTPUT_ROOT / profile.name / date_dir
            out_path = out_dir / f"cycle_{cycle:04d}_{ts}.jsonl"
            quarantine_path = out_dir / f"cycle_{cycle:04d}_{ts}.quarantine.jsonl"

            write_jsonl(out_path, accepted)
            if quarantined:
                write_jsonl(quarantine_path, quarantined)
                qpath_str = str(quarantine_path.relative_to(REPO_ROOT))
            else:
                qpath_str = None

            type_results.append(
                CycleTypeResult(
                    profile=profile.name,
                    generated=counts["generated"],
                    refined=counts["generated"]
                    - counts["schema_rejected"]
                    - counts["duplicates_dropped"],
                    duplicates_dropped=counts["duplicates_dropped"],
                    near_dup_quarantined=counts["near_dup_quarantined"],
                    schema_rejected=counts["schema_rejected"],
                    accepted=len(accepted),
                    underfilled=underfilled,
                    output_path=str(out_path.relative_to(REPO_ROOT)),
                    quarantine_path=qpath_str,
                )
            )
        except Exception as exc:
            failures.append(
                {
                    "profile": profile.name,
                    "step": "generate_or_refine",
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )

    cycle_summary = {
        "session_id": session_id,
        "cycle": cycle,
        "started_at": cycle_started,
        "ended_at": utc_iso(),
        "elapsed_seconds": round(time.time() - cycle_t0, 2),
        "types_succeeded": [dataclasses.asdict(r) for r in type_results],
        "failures": failures,
        "totals": {
            "accepted": sum(r.accepted for r in type_results),
            "rejected": sum(
                r.schema_rejected + r.duplicates_dropped + r.near_dup_quarantined
                for r in type_results
            ),
            "quarantined_near_dup": sum(r.near_dup_quarantined for r in type_results),
            "underfilled_types": sum(1 for r in type_results if r.underfilled),
        },
    }

    append_jsonl(log_path, cycle_summary)
    append_jsonl(RUN_LOG_PATH, cycle_summary)
    return cycle_summary


def git_run(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def has_changes() -> bool:
    code, out, _ = git_run(["status", "--porcelain"])
    return code == 0 and bool(out.strip())


def commit_and_push(branch: str, cycle: int, summary: dict) -> dict:
    if not has_changes():
        return {"committed": False, "pushed": False, "reason": "no_changes"}
    accepted_types = [
        r["profile"] for r in summary["types_succeeded"] if r["accepted"] > 0
    ]
    types_short = ",".join(sorted({t.split("-", 2)[1] for t in accepted_types}))
    msg_lines = [
        f"data(synthetic): refined batch for {types_short or 'flow'} cycle {cycle}",
        "",
        f"types: {len(accepted_types)} | accepted: {summary['totals']['accepted']} "
        f"| quarantined: {summary['totals']['quarantined_near_dup']} "
        f"| underfilled: {summary['totals']['underfilled_types']}",
        f"session: {summary['session_id']}",
    ]
    git_run(["add", "data/synthetic"])
    code, out, err = git_run(["commit", "-m", "\n".join(msg_lines)])
    if code != 0:
        return {"committed": False, "pushed": False, "reason": err or out}

    code_h, sha, _ = git_run(["rev-parse", "HEAD"])
    commit_hash = sha if code_h == 0 else None

    push_attempts = []
    push_ok = False
    for attempt in range(2):
        code, out, err = git_run(["push", "-u", "origin", branch])
        push_attempts.append({"code": code, "stderr": err[:400]})
        if code == 0:
            push_ok = True
            break
        # one fetch/rebase remediation
        if attempt == 0:
            git_run(["fetch", "origin", branch])

    return {
        "committed": True,
        "pushed": push_ok,
        "commit_hash": commit_hash,
        "push_attempts": push_attempts,
    }


def estimate_cycle_seconds(history: list[float], default: float = 60.0) -> float:
    if not history:
        return default
    return max(history) * 1.5


def run_loop(
    *,
    branch: str,
    budget_seconds: float,
    max_cycles: int,
    session_id: str,
    starting_cycle: int = 1,
) -> dict:
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    session_log = SESSION_DIR / f"{session_id}.jsonl"
    started_at = utc_iso()
    deadline = time.time() + budget_seconds
    cycle = starting_cycle
    cycle_durations: list[float] = []
    cycles_summary: list[dict] = []

    while cycle <= max_cycles:
        remaining = deadline - time.time()
        needed = estimate_cycle_seconds(cycle_durations)
        if remaining <= 0:
            break
        if remaining < needed and cycle > starting_cycle:
            print(
                f"[loop] stopping: remaining={remaining:.0f}s < needed={needed:.0f}s",
                flush=True,
            )
            break

        print(f"[loop] cycle {cycle} starting (remaining={remaining:.0f}s)", flush=True)
        summary = run_cycle(cycle, session_id, session_log)
        elapsed = summary["elapsed_seconds"]
        cycle_durations.append(elapsed)

        # Quality gate: if 0 types succeeded, skip commit
        succeeded = len(summary["types_succeeded"])
        accepted_total = summary["totals"]["accepted"]
        if succeeded == 0 or accepted_total == 0:
            print(f"[loop] cycle {cycle} produced nothing; skipping commit", flush=True)
            cycle += 1
            cycles_summary.append({"cycle": cycle - 1, "git": {"committed": False}})
            continue

        git_result = commit_and_push(branch, cycle, summary)
        cycles_summary.append({"cycle": cycle, "git": git_result, "summary": summary})
        print(
            f"[loop] cycle {cycle} done: accepted={accepted_total} "
            f"committed={git_result.get('committed')} "
            f"pushed={git_result.get('pushed')} "
            f"sha={git_result.get('commit_hash')}",
            flush=True,
        )
        cycle += 1

    ended_at = utc_iso()
    return {
        "session_id": session_id,
        "branch": branch,
        "started_at": started_at,
        "ended_at": ended_at,
        "cycles_run": len(cycles_summary),
        "cycles": cycles_summary,
    }


def cmd_run_cycle(args: argparse.Namespace) -> int:
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    session_log = SESSION_DIR / f"{args.session_id}.jsonl"
    summary = run_cycle(args.cycle, args.session_id, session_log)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


def cmd_run_loop(args: argparse.Namespace) -> int:
    result = run_loop(
        branch=args.branch,
        budget_seconds=args.budget_seconds,
        max_cycles=args.max_cycles,
        session_id=args.session_id,
        starting_cycle=args.starting_cycle,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_cycle = sub.add_parser("run-cycle", help="Run a single cycle.")
    p_cycle.add_argument("--cycle", type=int, required=True)
    p_cycle.add_argument("--session-id", required=True)
    p_cycle.set_defaults(func=cmd_run_cycle)

    p_loop = sub.add_parser("run-loop", help="Run cycles until wall-clock budget.")
    p_loop.add_argument("--branch", required=True)
    p_loop.add_argument("--budget-seconds", type=float, required=True)
    p_loop.add_argument("--max-cycles", type=int, default=200)
    p_loop.add_argument("--session-id", required=True)
    p_loop.add_argument("--starting-cycle", type=int, default=1)
    p_loop.set_defaults(func=cmd_run_loop)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
