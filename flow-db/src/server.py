"""
Minimal HTTP server for the synthetic dataset generator GUI.

Start with:
    cd flow-db
    python -m src.server --db corpus.db [--port 5174] [--no-browser]

Routes
------
  GET  /                    → serve gui/index.html
  GET  /api/stats           → DB row counts
  GET  /api/profiles        → available profiles list
  POST /api/preview         → {profile_id, overrides, max_preview} → sample rows
  POST /api/generate        → {profile_id, overrides, max_cases, options} → dataset
  POST /api/save            → {profile_id, format, data} → save to datasets/
  GET  /api/datasets        → list saved datasets
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import webbrowser
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse

# Ensure flow-db/ is on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.database import connect
from src.generators.profiles import list_profiles
from src.generators.dataset_generator import generate, preview

GUI_DIR = ROOT / "gui"
DATASETS_DIR = ROOT / "datasets"
DEFAULT_DB = ROOT / "corpus.db"

# Will be set at startup
_DB_PATH: Path = DEFAULT_DB


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_stats() -> dict:
    tables = [
        "sources", "participants", "documents", "segments",
        "lexicon_entries", "lexicon_variants",
        "error_cases", "error_spans",
        "linguistic_features", "orthographic_feature_flags",
        "benchmark_collections", "benchmark_subsets", "corpus_profiles",
    ]
    with connect(_DB_PATH) as con:
        counts = {t: con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in tables}
        lang_breakdown = {
            r[0]: r[1]
            for r in con.execute(
                "SELECT language, COUNT(*) FROM error_cases GROUP BY language ORDER BY 2 DESC"
            ).fetchall()
        }
        status_breakdown = {
            r[0]: r[1]
            for r in con.execute(
                "SELECT review_status, COUNT(*) FROM error_cases "
                "GROUP BY review_status ORDER BY 2 DESC"
            ).fetchall()
        }
    return {
        "db_path": str(_DB_PATH),
        "counts": counts,
        "error_cases_by_language": lang_breakdown,
        "error_cases_by_status": status_breakdown,
    }


def _list_datasets() -> list[dict]:
    if not DATASETS_DIR.exists():
        return []
    entries = []
    for f in sorted(DATASETS_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if f.suffix in {".json", ".csv", ".js"} and f.name != ".gitkeep":
            entries.append({
                "name": f.name,
                "size_bytes": f.stat().st_size,
                "modified": datetime.fromtimestamp(
                    f.stat().st_mtime, tz=timezone.utc
                ).isoformat(timespec="seconds"),
            })
    return entries


def _safe_filename(profile_id: str, fmt: str, total: int) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    ext = {"flow-lab-json": "json", "languagetool-json": "json",
           "csv": "csv", "flow-test-js": "js"}.get(fmt, "json")
    return f"{profile_id}_{ts}_{total}cases.{ext}"


# ── Request handler ───────────────────────────────────────────────────────────

class _Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):  # suppress default access log
        pass

    # ── routing ───────────────────────────────────────────────────────────────

    def do_OPTIONS(self):
        self._send_cors_preflight()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        if path in ("/", "/index.html"):
            self._serve_file(GUI_DIR / "index.html", "text/html; charset=utf-8")
        elif path == "/api/stats":
            try:
                self._json(_get_stats())
            except Exception as exc:
                self._error(500, str(exc))
        elif path == "/api/profiles":
            self._json(list_profiles())
        elif path == "/api/datasets":
            self._json(_list_datasets())
        else:
            self._error(404, f"Not found: {path}")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        try:
            body = self._read_json_body()
        except Exception as exc:
            self._error(400, f"Invalid JSON body: {exc}")
            return

        if path == "/api/preview":
            self._handle_preview(body)
        elif path == "/api/generate":
            self._handle_generate(body)
        elif path == "/api/save":
            self._handle_save(body)
        else:
            self._error(404, f"Not found: {path}")

    # ── POST handlers ─────────────────────────────────────────────────────────

    def _handle_preview(self, body: dict) -> None:
        profile_id = body.get("profile_id", "flow_standard")
        overrides = body.get("overrides") or {}
        max_p = min(int(body.get("max_preview", 10)), 50)
        try:
            with connect(_DB_PATH) as con:
                rows = preview(con, profile_id, overrides, max_p)
            self._json({"rows": rows, "count": len(rows)})
        except Exception as exc:
            self._error(500, str(exc))

    def _handle_generate(self, body: dict) -> None:
        profile_id = body.get("profile_id", "flow_standard")
        overrides = body.get("overrides") or {}
        max_cases = int(body.get("max_cases", 200))
        fmt = body.get("output_format") or None
        include_neg = body.get("include_negatives")
        add_var = body.get("add_variations")
        wrap_sent = body.get("wrap_sentences")
        seed = int(body.get("seed", 42))
        try:
            with connect(_DB_PATH) as con:
                result = generate(
                    con, profile_id, overrides,
                    max_cases=max_cases,
                    include_negatives=include_neg,
                    add_variations=add_var,
                    wrap_sentences=wrap_sent,
                    output_format=fmt,
                    seed=seed,
                )
            self._json(result)
        except Exception as exc:
            self._error(500, str(exc))

    def _handle_save(self, body: dict) -> None:
        profile_id = body.get("profile_id", "dataset")
        fmt = body.get("format", "flow-lab-json")
        data = body.get("data")
        total = int(body.get("total_count", 0))
        if data is None:
            self._error(400, "Missing 'data' field")
            return
        try:
            DATASETS_DIR.mkdir(exist_ok=True)
            fname = _safe_filename(profile_id, fmt, total)
            fpath = DATASETS_DIR / fname
            if isinstance(data, (dict, list)):
                fpath.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            else:
                fpath.write_text(str(data), encoding="utf-8")
            self._json({"saved": fname, "path": str(fpath)})
        except Exception as exc:
            self._error(500, str(exc))

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw)

    def _serve_file(self, path: Path, content_type: str) -> None:
        if not path.exists():
            self._error(404, f"File not found: {path}")
            return
        content = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(content)

    def _json(self, data) -> None:
        body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _error(self, code: int, message: str) -> None:
        body = json.dumps({"error": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_cors_preflight(self) -> None:
        self.send_response(204)
        self._cors_headers()
        self.end_headers()


# ── CLI entry point ───────────────────────────────────────────────────────────

def main() -> None:
    global _DB_PATH

    parser = argparse.ArgumentParser(description="flow-db synthetic dataset generator GUI")
    parser.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH",
                        help="SQLite database file (default: %(default)s)")
    parser.add_argument("--port", type=int, default=5174, metavar="PORT",
                        help="HTTP port (default: %(default)s)")
    parser.add_argument("--no-browser", action="store_true",
                        help="Do not open the browser automatically")
    args = parser.parse_args()

    _DB_PATH = Path(args.db).resolve()
    if not _DB_PATH.exists():
        print(f"[error] Database not found: {_DB_PATH}", file=sys.stderr)
        print("        Run: python -m src.database seed --db corpus.db", file=sys.stderr)
        sys.exit(1)

    DATASETS_DIR.mkdir(exist_ok=True)

    url = f"http://localhost:{args.port}"
    server = HTTPServer(("127.0.0.1", args.port), _Handler)

    print(f"\n  flow-db Dataset Generator")
    print(f"  ─────────────────────────")
    print(f"  DB   : {_DB_PATH}")
    print(f"  GUI  : {url}")
    print(f"  Quit : Ctrl-C\n")

    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[server] stopped.")


if __name__ == "__main__":
    main()
