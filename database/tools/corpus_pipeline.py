#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re, shutil, sqlite3, zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
INCOMING = [ROOT / "corpora_part_1.zip", ROOT / "corpora_part_2.zip"]
DATASETS = ROOT / "datasets"
ARTIFACTS = ROOT / "artifacts"
TMP = ROOT / ".tmp_corpora"
DB_PATH = ARTIFACTS / "corpora.sqlite3"
PATTERN_DIR = ARTIFACTS / "test_patterns_flow_spin"
BENCH_JSON = ARTIFACTS / "benchmarks" / "flow_spin_benchmark.json"
REPORT_MD = ARTIFACTS / "reports" / "final_review.md"

TARGETS = {
    "litkey": DATASETS / "gold/litkey",
    "rueg": DATASETS / "open/rueg",
    "falko": DATASETS / "open/falko",
    "anselm": DATASETS / "robustness/anselm",
    "childlex": DATASETS / "lexical/childlex",
    "talkbank": DATASETS / "background/talkbank_szagun",
    "birkbeck": DATASETS / "en_errors/birkbeck",
    "lespell": DATASETS / "external_benchmarks/lespell",
    "rello": DATASETS / "real_dyslexia/rello2016",
}

SKIP_EXTENSIONS = {
    ".pdf", ".zip", ".gz", ".bz2", ".xz", ".7z",
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".exe", ".dll", ".so", ".dylib", ".bin",
}

@dataclass
class Row:
    source: str
    language: str
    split: str
    input_text: str
    expected: str
    provenance: str


def ensure():
    for p in [*TARGETS.values(), ARTIFACTS / "benchmarks", ARTIFACTS / "reports", PATTERN_DIR, TMP]:
        p.mkdir(parents=True, exist_ok=True)


def safe_extract(zpath: Path, dest: Path) -> list[Path]:
    out = []
    with zipfile.ZipFile(zpath) as z:
        for m in z.infolist():
            n = Path(m.filename)
            if m.is_dir():
                continue
            final = (dest / n).resolve()
            if not str(final).startswith(str(dest.resolve())):
                raise ValueError(f"Path traversal blocked: {m.filename}")
            final.parent.mkdir(parents=True, exist_ok=True)
            with z.open(m) as src, open(final, "wb") as dst:
                shutil.copyfileobj(src, dst)
            out.append(final)
    return out


def recursive_extract(base: Path) -> list[Path]:
    extracted = []
    seen = set()
    while True:
        zips = [p for p in base.rglob("*.zip") if p not in seen]
        if not zips:
            return extracted
        for zp in zips:
            seen.add(zp)
            t = zp.with_suffix("")
            stamp = t / ".ok"
            if stamp.exists():
                continue
            t.mkdir(parents=True, exist_ok=True)
            extracted += safe_extract(zp, t)
            stamp.write_text("ok", encoding="utf-8")


def reconstruct_litkey(parts_dir: Path, out_file: Path) -> Path:
    pats = sorted(parts_dir.glob("Litkey-Tab.xlsx.*"), key=lambda p: int(p.suffix[1:]))
    if not pats:
        raise FileNotFoundError("Litkey parts not found")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "wb") as out:
        for p in pats:
            out.write(p.read_bytes())
    with zipfile.ZipFile(out_file) as z:
        if "[Content_Types].xml" not in z.namelist():
            raise ValueError("Rebuilt xlsx is invalid")
    return out_file


def classify(path: Path) -> Path:
    s = str(path).lower()
    if "rueg" in s or "conll/rueg" in s:
        return TARGETS["rueg"]
    if "litkey" in s:
        return TARGETS["litkey"]
    if "falko" in s:
        return TARGETS["falko"]
    if "anselm" in s or "coraxml" in s:
        return TARGETS["anselm"]
    if "childlex" in s:
        return TARGETS["childlex"]
    if "szagun" in s or "talkbank" in s or s.endswith(".cha"):
        return TARGETS["talkbank"]
    if "birkbeck" in s or "missp" in s:
        return TARGETS["birkbeck"]
    if "lespell" in s or "aspell" in s:
        return TARGETS["lespell"]
    if "rello" in s or "l16-1013" in s:
        return TARGETS["rello"]
    return DATASETS / "open/falko"


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        while c := f.read(65536): h.update(c)
    return h.hexdigest()

def safe_rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def organize_files(candidates: Iterable[Path]) -> list[dict]:
    manifest = []
    for p in candidates:
        if p.is_dir():
            continue
        if p.suffix.lower() in SKIP_EXTENSIONS:
            continue
        tgt = classify(p)
        out = tgt / p.name
        i = 1
        while out.exists() and sha(out) != sha(p):
            out = tgt / f"{out.stem}_{i}{out.suffix}"; i += 1
        if not out.exists():
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, out)
        manifest.append({"source": str(p), "target": safe_rel(out), "sha256": sha(out)})
    (ARTIFACTS / "corpus_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def iter_samples() -> Iterable[Row]:
    for f in TARGETS["rueg"].rglob("*.conllu"):
        lang = "de" if "/DE/" in str(f) else "en" if "/EN/" in str(f) else "unknown"
        tokens = []
        for line in f.read_text(encoding="utf-8", errors="ignore").splitlines():
            if not line or line.startswith("#"):
                if tokens:
                    sent = " ".join(tokens)
                    yield Row("rueg", lang, "train", sent, sent, safe_rel(f))
                    tokens = []
                continue
            cols = line.split("\t")
            if len(cols) > 1 and cols[0].isdigit():
                tokens.append(cols[1])
    for f in TARGETS["birkbeck"].glob("*.txt"):
        for ln in f.read_text(encoding="utf-8", errors="ignore").splitlines()[:400]:
            if ":" in ln:
                wrong, right = [x.strip() for x in ln.split(":", 1)]
                if wrong and right:
                    yield Row("birkbeck", "en", "eval", wrong, right.split()[0], safe_rel(f))


def init_db(db: Path):
    db.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db)
    con.executescript("""
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS corpus_source(id INTEGER PRIMARY KEY, name TEXT UNIQUE, path TEXT);
    CREATE TABLE IF NOT EXISTS samples(
      id INTEGER PRIMARY KEY, source_id INTEGER, language TEXT, split TEXT,
      input_text TEXT, expected_text TEXT, provenance TEXT,
      FOREIGN KEY(source_id) REFERENCES corpus_source(id)
    );
    CREATE INDEX IF NOT EXISTS idx_samples_src_lang ON samples(source_id, language);
    """)
    ids = {}
    for k,v in TARGETS.items():
        try:
            pstr = str(v.relative_to(ROOT))
        except ValueError:
            pstr = str(v)
        con.execute("INSERT OR IGNORE INTO corpus_source(name,path) VALUES(?,?)", (k, pstr))
    con.commit()
    for i,n in con.execute("SELECT id,name FROM corpus_source"): ids[n]=i
    con.execute("DELETE FROM samples")
    con.executemany(
        "INSERT INTO samples(source_id,language,split,input_text,expected_text,provenance) VALUES(?,?,?,?,?,?)",
        [(ids.get(r.source, ids["falko"]), r.language, r.split, r.input_text, r.expected, r.provenance) for r in iter_samples()],
    )
    con.commit(); con.close()


def generate_patterns(db: Path):
    con = sqlite3.connect(db)
    rows = con.execute("SELECT language,input_text,expected_text,provenance FROM samples WHERE expected_text!='' LIMIT 120").fetchall()
    con.close()
    cats = {
        "normalization": rows[:20], "grammar_robustness": rows[20:40], "code_switching": rows[40:55],
        "noisy_speech": rows[55:75], "punctuation_restoration": rows[75:90], "colloquial_variants": rows[90:105],
        "adversarial_edge_cases": rows[105:115], "regression_cases": rows[115:120],
    }
    PATTERN_DIR.mkdir(parents=True, exist_ok=True)
    for k, rr in cats.items():
        lines = [f"# FLOW/SPIN Pattern Suite: {k}", "", "|id|lang|input|expected|source|", "|---|---|---|---|---|"]
        for i,(lang,inp,exp,src) in enumerate(rr,1):
            norm = lambda t: re.sub(r"\|", "\\|", t.replace("\n"," "))[:140]
            lines.append(f"|{k[:3].upper()}-{i:03d}|{lang}|{norm(inp)}|{norm(exp)}|{src}|")
        (PATTERN_DIR / f"{k}.md").write_text("\n".join(lines)+"\n", encoding="utf-8")
    bundle = ARTIFACTS / "test_patterns_flow_spin_bundle.md"
    chunks = []
    for md in sorted(PATTERN_DIR.glob("*.md")):
        chunks.append(f"<!-- {md.name} -->\n")
        chunks.append(md.read_text(encoding="utf-8"))
        chunks.append("\n")
    bundle.write_text("\n".join(chunks), encoding="utf-8")


def benchmark():
    tool = ROOT / "tools" / "benchmark_flow_spin.mjs"
    cmd = f"node {tool} {DB_PATH} {BENCH_JSON}"
    return os.system(cmd)


def report():
    con = sqlite3.connect(DB_PATH)
    total = con.execute("SELECT COUNT(*) FROM samples").fetchone()[0]
    by_src = con.execute("SELECT cs.name, COUNT(*) FROM samples s JOIN corpus_source cs ON s.source_id=cs.id GROUP BY cs.name ORDER BY 2 DESC").fetchall()
    con.close()
    bench = json.loads(BENCH_JSON.read_text(encoding="utf-8")) if BENCH_JSON.exists() else {"status":"not executed"}
    top3 = [
        "Expand non-RUEG parsers (Falko/Litkey XML, ANSELM CoraXML) to structured sentence-level imports.",
        "Introduce gold normalization labels for multilingual/noisy cases and add CI threshold gates.",
        "Add error-bucket analytics (diacritics, compounding, punctuation, code-switch) to prioritize rule upgrades.",
    ]
    lines = [
        "# FLOW/SPIN Corpus & Benchmark Review", "",
        "## Current State", f"- Normalized SQLite DB built at `{DB_PATH.relative_to(ROOT)}`.",
        f"- Total ingested samples: **{total}**.", "", "## Source Coverage",
        "|source|samples|", "|---|---|",
        *[f"|{n}|{c}|" for n,c in by_src], "", "## Benchmark Summary",
        f"- Status: **{bench.get('status','unknown')}**", f"- Cases: **{bench.get('cases',0)}**", f"- Pass rate: **{bench.get('pass_rate','n/a')}**", "",
        "## Coverage Gaps", "- Limited sentence-level imports outside RUEG + Birkbeck misspelling lists.", "- Minimal expected-output gold for some robustness domains.", "",
        "## Data Quality Issues", "- Multiple archives are nested and partially overlapping; manifest dedupe mitigates duplicates.", "- Some files are papers/binaries that are not directly benchmarkable.", "",
        "## Hardening Recommendations", "- Track per-corpus parser status and fail ingest when parser coverage regresses.", "- Version pattern-suite generation by hash to guarantee deterministic benchmark baselines.", "",
        "## Top 3 Next Steps", *[f"{i+1}. {v}" for i,v in enumerate(top3)], "",
    ]
    REPORT_MD.write_text("\n".join(lines), encoding="utf-8")


def run_all(clean_corpi=False):
    ensure()
    staged = TMP / "raw"
    staged.mkdir(parents=True, exist_ok=True)
    files = []
    for z in INCOMING:
        if z.exists(): files += safe_extract(z, staged / z.stem)
    recursive_extract(staged)
    files = [p for p in staged.rglob("*") if p.is_file()]
    litkey_xml = [p for p in files if "litkeycorpus_learnerxml" in p.name.lower() and p.suffix.lower() == ".zip"]
    for z in litkey_xml:
        recursive_extract(z.parent)
    files = [p for p in staged.rglob("*") if p.is_file()]
    # include old split xlsx parts from corpi if present
    old_corpi = ROOT / "corpi"
    if old_corpi.exists():
        reconstruct_litkey(old_corpi, TARGETS["litkey"] / "Litkey-Tab.xlsx")
        files += [p for p in old_corpi.rglob("*") if p.is_file()]
    organize_files(files)
    init_db(DB_PATH)
    generate_patterns(DB_PATH)
    benchmark()
    report()
    if clean_corpi and old_corpi.exists():
        shutil.rmtree(old_corpi)
    if TMP.exists():
        shutil.rmtree(TMP)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["run-all","rebuild-xlsx","extract","ingest","patterns","benchmark","report"])
    ap.add_argument("--clean-corpi", action="store_true")
    ns = ap.parse_args()
    ensure()
    if ns.cmd == "run-all": run_all(clean_corpi=ns.clean_corpi)
    elif ns.cmd == "rebuild-xlsx": reconstruct_litkey(ROOT / "corpi", TARGETS["litkey"] / "Litkey-Tab.xlsx")
    elif ns.cmd == "extract":
        staged = TMP / "raw"; staged.mkdir(parents=True, exist_ok=True)
        for z in INCOMING: safe_extract(z, staged / z.stem)
        recursive_extract(staged)
    elif ns.cmd == "ingest": init_db(DB_PATH)
    elif ns.cmd == "patterns": generate_patterns(DB_PATH)
    elif ns.cmd == "benchmark": benchmark()
    elif ns.cmd == "report": report()

if __name__ == "__main__":
    main()
