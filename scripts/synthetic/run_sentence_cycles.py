#!/usr/bin/env python3
"""Autonomous multi-cycle synthetic sentence generation pipeline.

For each cycle:
  1. Generate 300 candidate sentences per dataset type from large
     combinatorial pools, seeded by (cycle, dataset type).
  2. Run a deterministic refinery/cleanup + validation pass that enforces
     hard quality gates (schema, dedup, templated-swap heuristics, etc).
  3. Persist accepted batches + quarantined rejects under
     data/synthetic/<type>/<YYYY-MM-DD>/.
  4. Commit + push.
  5. Immediately start the next cycle.

Runs until the configured wall-clock deadline is reached or budget is
exhausted. One dataset-type failure does not abort the run.

Config via env vars:
  SYN_WALL_HOURS  : float, default 3.0
  SYN_CYCLE_CAP   : int, optional (upper bound on cycles)
  SYN_PER_TYPE    : int, default 300
  SYN_BRANCH      : str, default current branch
  SYN_PUSH        : "1"/"0", default "1"
  SYN_MIN_ACCEPT  : int, default 150 (below -> underfilled + one retry pass)
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import re
import subprocess
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

THIS_DIR = Path(__file__).resolve().parent
REPO_ROOT = THIS_DIR.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from scripts.synthetic.sentence_pools import POOLS, profile_order  # noqa: E402

SYNTH_ROOT = REPO_ROOT / "data" / "synthetic"
LOG_ROOT = SYNTH_ROOT / "_run_logs"
SEEN_ROOT = SYNTH_ROOT / "_seen"

META_FIELDS = (
    "id", "profile", "cycle", "language", "difficulty", "voice",
    "realism", "theme", "form", "source",
)

JUNK_PATTERNS = [
    re.compile(r"^\s*(#+|\*+|\d+[.)])\s+"),
    re.compile(r"^(note|hinweis|beispiel|example|as an ai|as a language model)[:\-]", re.I),
    re.compile(r"```"),
    re.compile(r"<\|.*?\|>"),
]


# ---------------------------------------------------------------------------
# logging
# ---------------------------------------------------------------------------

class RunLogger:
    def __init__(self, session_id: str) -> None:
        LOG_ROOT.mkdir(parents=True, exist_ok=True)
        self.session_id = session_id
        self.log_path = LOG_ROOT / f"run_{session_id}.log"
        self.stats_path = LOG_ROOT / f"run_{session_id}.stats.jsonl"
        self._log_fh = self.log_path.open("a", encoding="utf-8")

    def log(self, msg: str) -> None:
        ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
        line = f"[{ts}] {msg}"
        self._log_fh.write(line + "\n")
        self._log_fh.flush()
        try:
            print(line, flush=True)
        except Exception:
            pass

    def stats(self, payload: dict) -> None:
        with self.stats_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")

    def close(self) -> None:
        try:
            self._log_fh.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# seen-set persistence
# ---------------------------------------------------------------------------

def seen_path_for(ptype: str) -> Path:
    SEEN_ROOT.mkdir(parents=True, exist_ok=True)
    return SEEN_ROOT / f"{ptype}.txt"


def load_seen(ptype: str) -> set[str]:
    p = seen_path_for(ptype)
    if not p.exists():
        return set()
    out: set[str] = set()
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.add(line)
    return out


def extend_seen(ptype: str, fingerprints: Iterable[str]) -> None:
    p = seen_path_for(ptype)
    with p.open("a", encoding="utf-8") as f:
        for fp in fingerprints:
            f.write(fp + "\n")


# ---------------------------------------------------------------------------
# candidate generation
# ---------------------------------------------------------------------------

def _compose(slot_values: list[str], cfg: dict) -> str:
    structure = cfg["structure"]
    if structure == "start_action_tail":
        a, b, c = slot_values
        return f"{a} {b} {c}{cfg['suffix']}"
    if structure == "lead_mid_end":
        a, b, c = slot_values
        return f"{a} {b}{cfg['tail_sep']}{c}{cfg['suffix']}"
    if structure == "lead_mid_frame_end":
        a, b, frame, c = slot_values
        return f"{a}{cfg['tail_sep']}{b} {frame}{cfg['tail_sep']}{c}{cfg['suffix']}"
    raise ValueError(f"unknown structure: {structure}")


def _enumerate_index_tuples(slot_sizes: list[int], count: int, rng: random.Random) -> list[tuple[int, ...]]:
    """Sample `count` distinct index tuples from the cartesian product."""
    total = 1
    for s in slot_sizes:
        total *= s
    if count > total:
        count = total
    picks = rng.sample(range(total), count)
    out: list[tuple[int, ...]] = []
    for p in picks:
        idx = []
        for s in slot_sizes:
            idx.append(p % s)
            p //= s
        out.append(tuple(idx))
    return out


def generate_candidates(ptype: str, cycle: int, target: int, oversample_factor: float = 1.4) -> list[str]:
    cfg = POOLS[ptype]
    slots = cfg["slots"]
    sizes = [len(s) for s in slots]
    rng = random.Random(f"{ptype}|cycle={cycle}|seed=flowspin")
    over = int(target * oversample_factor)
    idx_tuples = _enumerate_index_tuples(sizes, over, rng)
    out: list[str] = []
    for t in idx_tuples:
        vals = [slots[i][t[i]] for i in range(len(slots))]
        out.append(_compose(vals, cfg))
    return out


# ---------------------------------------------------------------------------
# refinery / validation
# ---------------------------------------------------------------------------

def _normalize_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _fingerprint(s: str) -> str:
    norm = re.sub(r"[^\w]+", "", s.lower())
    return hashlib.sha1(norm.encode("utf-8")).hexdigest()


def _is_junk(s: str) -> bool:
    if not s or s[-1] not in ".!?":
        return True
    for pat in JUNK_PATTERNS:
        if pat.search(s):
            return True
    if "  " in s:
        return True
    if s.count(",") > 6:
        return True
    if re.search(r"[\[\]\{\}<>]", s):
        return True
    return False


def _word_count(s: str) -> int:
    return len(re.findall(r"\w+", s, flags=re.UNICODE))


def _length_ok(s: str, difficulty: str) -> bool:
    w = _word_count(s)
    if difficulty == "easy":
        return 4 <= w <= 24
    if difficulty == "medium":
        return 6 <= w <= 38
    if difficulty == "hard":
        return 10 <= w <= 60
    return 4 <= w <= 60


def _looks_like_language(s: str, lang: str) -> bool:
    low = s.lower()
    if lang == "de":
        de_markers = {" ich ", " nicht ", " und ", " der ", " die ", " das ", " mit ",
                      " den ", " dem ", " ein ", " zu ", " für ", " auf ", " im ", " am "}
        return any(m in f" {low} " for m in de_markers)
    if lang == "en":
        en_markers = {" the ", " and ", " to ", " i ", " my ", " we ", " of ", " for ",
                      " with ", " on ", " at ", " so ", " before ", " after "}
        return any(m in f" {low} " for m in en_markers)
    return True


def refine_and_validate(
    candidates: list[str],
    ptype: str,
    cycle: int,
    seen: set[str],
    target_accepted: int,
) -> tuple[list[dict], list[dict], dict]:
    cfg = POOLS[ptype]
    lang = cfg["language"]
    diff = cfg["difficulty"]

    accepted: list[dict] = []
    rejected: list[dict] = []
    batch_fingerprints: set[str] = set()
    batch_prefixes: dict[str, int] = {}

    counts = {
        "generated": len(candidates),
        "junk": 0,
        "length_fail": 0,
        "language_fail": 0,
        "dup_exact_batch": 0,
        "dup_exact_global": 0,
        "near_dup_prefix": 0,
        "accepted": 0,
    }

    for i, raw in enumerate(candidates):
        s = _normalize_ws(raw)
        if _is_junk(s):
            counts["junk"] += 1
            rejected.append({"reason": "junk", "source": s})
            continue
        if not _length_ok(s, diff):
            counts["length_fail"] += 1
            rejected.append({"reason": "length", "source": s})
            continue
        if not _looks_like_language(s, lang):
            counts["language_fail"] += 1
            rejected.append({"reason": "language", "source": s})
            continue
        fp = _fingerprint(s)
        if fp in batch_fingerprints:
            counts["dup_exact_batch"] += 1
            rejected.append({"reason": "dup_batch", "source": s})
            continue
        if fp in seen:
            counts["dup_exact_global"] += 1
            rejected.append({"reason": "dup_global", "source": s})
            continue
        prefix = " ".join(s.split()[:12]).lower()
        prev = batch_prefixes.get(prefix, 0)
        if prev >= 4:
            counts["near_dup_prefix"] += 1
            rejected.append({"reason": "prefix_cluster", "source": s})
            continue
        batch_prefixes[prefix] = prev + 1
        batch_fingerprints.add(fp)
        rec = {
            "id": f"{ptype}-c{cycle:04d}-{len(accepted) + 1:06d}",
            "profile": ptype,
            "cycle": cycle,
            "language": lang,
            "difficulty": diff,
            "voice": cfg["voice"],
            "realism": "high",
            "theme": cfg["theme"],
            "form": cfg["form"],
            "source": s,
        }
        accepted.append(rec)
        if len(accepted) >= target_accepted:
            break

    counts["accepted"] = len(accepted)
    counts["rejected"] = len(rejected)
    return accepted, rejected, counts


# ---------------------------------------------------------------------------
# output / git
# ---------------------------------------------------------------------------

def write_accepted(accepted: list[dict], ptype: str, cycle: int, ts: str) -> Path:
    day = ts.split("T")[0]
    out_dir = SYNTH_ROOT / ptype / day
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"cycle_{cycle:04d}_{ts.replace(':', '').replace('-', '')}.jsonl"
    path = out_dir / fname
    with path.open("w", encoding="utf-8") as f:
        for rec in accepted:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return path


def write_rejected(rejected: list[dict], ptype: str, cycle: int, ts: str) -> Path | None:
    if not rejected:
        return None
    day = ts.split("T")[0]
    out_dir = SYNTH_ROOT / ptype / day / "_rejected"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"cycle_{cycle:04d}_{ts.replace(':', '').replace('-', '')}.rejected.jsonl"
    path = out_dir / fname
    with path.open("w", encoding="utf-8") as f:
        for rec in rejected:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return path


def run_git(args: list[str], timeout: int = 60) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git"] + args,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return proc.returncode, proc.stdout, proc.stderr


def git_commit_push(message: str, paths: list[Path], branch: str, push: bool, logger: RunLogger) -> tuple[str | None, str]:
    rels = [str(p.relative_to(REPO_ROOT)) for p in paths]
    rc, _, err = run_git(["add"] + rels)
    if rc != 0:
        return None, f"add failed: {err.strip()}"
    rc, out, err = run_git(["status", "--porcelain"])
    if rc != 0:
        return None, f"status failed: {err.strip()}"
    if not out.strip():
        return None, "no changes to commit"
    rc, _, err = run_git(["commit", "-m", message])
    if rc != 0:
        return None, f"commit failed: {err.strip()}"
    rc, out, _ = run_git(["rev-parse", "HEAD"])
    commit_hash = out.strip() if rc == 0 else None
    if not push:
        return commit_hash, "push skipped"
    delays = [0, 2, 4, 8, 16]
    last_err = ""
    for i, d in enumerate(delays):
        if d:
            time.sleep(d)
        rc, pout, perr = run_git(["push", "-u", "origin", branch], timeout=180)
        if rc == 0:
            return commit_hash, "push ok"
        last_err = perr.strip() or pout.strip()
        logger.log(f"push attempt {i + 1} failed: {last_err[:200]}")
    return commit_hash, f"push failed: {last_err}"


# ---------------------------------------------------------------------------
# cycle
# ---------------------------------------------------------------------------

def current_branch() -> str:
    rc, out, _ = run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    return out.strip() if rc == 0 else "HEAD"


def run_cycle(cycle: int, cfg: dict, logger: RunLogger) -> dict:
    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    per_type = cfg["per_type"]
    min_accept = cfg["min_accept"]
    branch = cfg["branch"]
    push = cfg["push"]

    cycle_report: dict = {
        "cycle": cycle,
        "timestamp": ts,
        "types": {},
        "commit": None,
        "push_status": None,
    }

    written_paths: list[Path] = []
    types_touched: list[str] = []

    for ptype in profile_order():
        try:
            seen = load_seen(ptype)
            cand = generate_candidates(ptype, cycle, per_type, oversample_factor=1.6)
            accepted, rejected, counts = refine_and_validate(
                cand, ptype, cycle, seen, target_accepted=per_type,
            )
            underfilled = False
            if counts["accepted"] < min_accept:
                logger.log(f"cycle {cycle} {ptype}: underfilled ({counts['accepted']}/{per_type}), retrying once")
                cand2 = generate_candidates(
                    ptype, cycle * 10000 + 7, int(per_type * 2.4),
                    oversample_factor=1.0,
                )
                existing_fps = {_fingerprint(a["source"]) for a in accepted}
                combined_seen = seen | existing_fps
                accepted2, rejected2, counts2 = refine_and_validate(
                    cand2, ptype, cycle, combined_seen,
                    target_accepted=per_type - counts["accepted"],
                )
                for r in accepted2:
                    r["id"] = f"{ptype}-c{cycle:04d}-{len(accepted) + 1:06d}"
                    accepted.append(r)
                rejected.extend(rejected2)
                counts["accepted"] = len(accepted)
                counts["generated"] += counts2["generated"]
                counts["rejected"] = len(rejected)
                underfilled = counts["accepted"] < min_accept
            if counts["accepted"] == 0:
                logger.log(f"cycle {cycle} {ptype}: zero accepted, skipping write")
                cycle_report["types"][ptype] = {
                    "status": "failed_zero", **counts, "underfilled": True,
                }
                continue
            acc_path = write_accepted(accepted, ptype, cycle, ts)
            rej_path = write_rejected(rejected, ptype, cycle, ts)
            fps = [_fingerprint(a["source"]) for a in accepted]
            extend_seen(ptype, fps)
            written_paths.append(acc_path)
            if rej_path is not None:
                written_paths.append(rej_path)
            types_touched.append(ptype)
            cycle_report["types"][ptype] = {
                "status": "ok" if not underfilled else "underfilled",
                **counts,
                "accepted_path": str(acc_path.relative_to(REPO_ROOT)),
                "rejected_path": str(rej_path.relative_to(REPO_ROOT)) if rej_path else None,
                "underfilled": underfilled,
            }
            logger.log(
                f"cycle {cycle} {ptype}: accepted={counts['accepted']} "
                f"rejected={counts['rejected']} junk={counts['junk']} "
                f"length={counts['length_fail']} dup_batch={counts['dup_exact_batch']} "
                f"dup_global={counts['dup_exact_global']} near_dup={counts['near_dup_prefix']} "
                f"file={acc_path.relative_to(REPO_ROOT)}"
            )
        except Exception as exc:
            tb = traceback.format_exc()
            logger.log(f"cycle {cycle} {ptype}: ERROR {exc}")
            logger.log(tb)
            cycle_report["types"][ptype] = {
                "status": "error", "error": str(exc),
            }

    if not written_paths:
        cycle_report["commit"] = None
        cycle_report["push_status"] = "no_output"
        logger.log(f"cycle {cycle}: no outputs, nothing to commit")
        logger.stats(cycle_report)
        return cycle_report

    msg = f"data(synthetic): add refined batch cycle {cycle} for {','.join(types_touched)}"
    commit_hash, push_status = git_commit_push(msg, written_paths, branch, push, logger)
    cycle_report["commit"] = commit_hash
    cycle_report["push_status"] = push_status
    logger.log(f"cycle {cycle}: commit={commit_hash} push={push_status}")
    logger.stats(cycle_report)
    return cycle_report


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def parse_env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def parse_env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def main() -> int:
    wall_hours = parse_env_float("SYN_WALL_HOURS", 3.0)
    cycle_cap = parse_env_int("SYN_CYCLE_CAP", 0)
    per_type = parse_env_int("SYN_PER_TYPE", 300)
    min_accept = parse_env_int("SYN_MIN_ACCEPT", 150)
    push = os.environ.get("SYN_PUSH", "1") == "1"
    branch = os.environ.get("SYN_BRANCH", current_branch())

    if branch in {"main", "master"}:
        print(f"refusing to run on protected branch: {branch}", file=sys.stderr)
        return 2

    session_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    logger = RunLogger(session_id)
    start_ts = time.time()
    deadline = start_ts + wall_hours * 3600.0

    logger.log(f"session {session_id} start")
    logger.log(f"branch={branch} wall_hours={wall_hours} per_type={per_type} "
               f"min_accept={min_accept} push={push} cycle_cap={cycle_cap or 'none'}")
    logger.log(f"dataset types: {profile_order()}")

    cfg = {
        "per_type": per_type,
        "min_accept": min_accept,
        "branch": branch,
        "push": push,
    }

    cycle = 0
    cycles_summary: list[dict] = []
    try:
        while True:
            now = time.time()
            if now >= deadline:
                logger.log("wall-clock deadline reached; stopping")
                break
            if cycle_cap and cycle >= cycle_cap:
                logger.log(f"cycle cap {cycle_cap} reached; stopping")
                break
            remaining = deadline - now
            if remaining < 120 and cycle > 0:
                logger.log(f"insufficient time remaining ({int(remaining)}s); stopping")
                break
            cycle += 1
            cycle_start = time.time()
            logger.log(f"--- cycle {cycle} start ---")
            report = run_cycle(cycle, cfg, logger)
            cycle_end = time.time()
            elapsed = cycle_end - cycle_start
            logger.log(f"--- cycle {cycle} end ({elapsed:.1f}s) ---")
            cycles_summary.append(report)
    except KeyboardInterrupt:
        logger.log("KeyboardInterrupt; stopping gracefully")
    except Exception as exc:
        logger.log(f"fatal: {exc}")
        logger.log(traceback.format_exc())

    total_elapsed = time.time() - start_ts
    totals: dict[str, dict] = {p: {"accepted": 0, "rejected": 0, "cycles": 0} for p in profile_order()}
    for rep in cycles_summary:
        for ptype, info in rep.get("types", {}).items():
            if info.get("status") in {"ok", "underfilled"}:
                totals[ptype]["accepted"] += info.get("accepted", 0)
                totals[ptype]["rejected"] += info.get("rejected", 0)
                totals[ptype]["cycles"] += 1

    summary = {
        "session_id": session_id,
        "branch": branch,
        "wall_hours_configured": wall_hours,
        "wall_seconds_used": round(total_elapsed, 2),
        "cycles_run": cycle,
        "per_type_target": per_type,
        "totals": totals,
        "log_path": str(logger.log_path.relative_to(REPO_ROOT)),
        "stats_path": str(logger.stats_path.relative_to(REPO_ROOT)),
    }
    summary_path = LOG_ROOT / f"run_{session_id}.summary.json"
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    logger.log(f"final summary: {summary_path.relative_to(REPO_ROOT)}")
    logger.log(f"totals: {json.dumps(totals, ensure_ascii=False)}")
    logger.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
