"""Base utilities for lightweight CSV-based importers."""
from __future__ import annotations
import csv
import sqlite3
from pathlib import Path
from typing import Iterable

def read_csv_rows(file_path: str | Path) -> Iterable[dict]:
    with open(file_path, "r", encoding="utf-8", newline="") as f:
        yield from csv.DictReader(f)

def one(con: sqlite3.Connection, sql: str, params: tuple) -> int:
    cur = con.execute(sql, params)
    row = cur.fetchone()
    if row is None:
        raise ValueError("Expected row, got none")
    return int(row[0])