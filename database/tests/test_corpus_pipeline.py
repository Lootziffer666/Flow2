import importlib.util, json, sqlite3, zipfile, sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("cp", BASE_DIR / "tools" / "corpus_pipeline.py")
cp = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = cp
SPEC.loader.exec_module(cp)


def test_reconstruct_litkey(tmp_path: Path):
    src = tmp_path / "corpi"; src.mkdir()
    xlsx = tmp_path / "orig.xlsx"
    with zipfile.ZipFile(xlsx, "w") as z:
        z.writestr("[Content_Types].xml", "ok")
    b = xlsx.read_bytes()
    (src / "Litkey-Tab.xlsx.001").write_bytes(b[:4])
    (src / "Litkey-Tab.xlsx.002").write_bytes(b[4:])
    out = tmp_path / "Litkey-Tab.xlsx"
    cp.reconstruct_litkey(src, out)
    with zipfile.ZipFile(out) as z:
        assert "[Content_Types].xml" in z.namelist()


def test_recursive_extract(tmp_path: Path):
    inner = tmp_path / "inner.zip"
    with zipfile.ZipFile(inner, "w") as z:
        z.writestr("a.txt", "x")
    outer = tmp_path / "outer.zip"
    with zipfile.ZipFile(outer, "w") as z:
        z.write(inner, "inner.zip")
    dest = tmp_path / "x"; dest.mkdir()
    cp.safe_extract(outer, dest)
    cp.recursive_extract(dest)
    assert any(p.name == "a.txt" for p in dest.rglob("a.txt"))


def test_ingestion_and_pattern_determinism(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(cp, "ARTIFACTS", tmp_path / "artifacts")
    monkeypatch.setattr(cp, "DB_PATH", tmp_path / "artifacts/c.sqlite3")
    monkeypatch.setattr(cp, "PATTERN_DIR", tmp_path / "artifacts/patterns")
    monkeypatch.setattr(
        cp,
        "TARGETS",
        {k: (tmp_path / "datasets" / k) for k in cp.TARGETS},
    )
    cp.ARTIFACTS.mkdir(parents=True)
    for t in cp.TARGETS.values():
        t.mkdir(parents=True, exist_ok=True)
    f = cp.TARGETS["rueg"] / "x.conllu"
    f.write_text("1\tHallo\t_\t_\t_\t_\t_\t_\t_\t_\n2\tWelt\t_\t_\t_\t_\t_\t_\t_\t_\n\n", encoding="utf-8")
    cp.init_db(cp.DB_PATH)
    con = sqlite3.connect(cp.DB_PATH)
    n = con.execute("select count(*) from samples").fetchone()[0]
    con.close(); assert n >= 1
    cp.generate_patterns(cp.DB_PATH)
    first = sorted((cp.PATTERN_DIR).glob("*.md"))[0].read_text(encoding="utf-8")
    cp.generate_patterns(cp.DB_PATH)
    second = sorted((cp.PATTERN_DIR).glob("*.md"))[0].read_text(encoding="utf-8")
    assert first == second


def test_benchmark_harness_smoke(tmp_path: Path):
    db = tmp_path / "b.sqlite3"
    con = sqlite3.connect(db)
    con.executescript("""
    create table samples(id integer primary key, input_text text, expected_text text);
    insert into samples(input_text,expected_text) values('nich gut','nicht gut');
    """)
    con.commit(); con.close()
    out = tmp_path / "bench.json"
    benchmark_tool = cp.ROOT / "tools" / "benchmark_flow_spin.mjs"
    code = cp.os.system(f"node {benchmark_tool} {db} {out}")
    assert code == 0
    data = json.loads(out.read_text())
    assert data["status"] in {"executed", "not executed"}
