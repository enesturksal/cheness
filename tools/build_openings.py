#!/usr/bin/env python3
"""Build the offline opening book from lichess-org/chess-openings TSV files.

Input : tools/chess-openings/{a,b,c,d,e}.tsv  (columns: eco, name, pgn) - CC0
Output: src/data/openings.json

Output format (compact, to keep the bundle small):
{
  "meta": {"source": "...", "generatedAt": "...", "count": N},
  "rows": [[eco, name, uci, epd], ...]   # sorted by eco, then name
}

- uci : space separated UCI moves from the standard start position
- epd : EPD (FEN without move counters) of the final position, used as the
        primary lookup key so transpositions resolve to the same name.

Run:  .venv/Scripts/python tools/build_openings.py
"""
from __future__ import annotations

import io
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import chess
    import chess.pgn
except ImportError:  # pragma: no cover
    sys.exit("python-chess is required: .venv/Scripts/python -m pip install chess")

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "tools" / "chess-openings"
OUT = ROOT / "src" / "data" / "openings.json"
VOLUMES = ["a", "b", "c", "d", "e"]


def parse_file(path: Path) -> list[list[str]]:
    rows: list[list[str]] = []
    with path.open(encoding="utf-8") as f:
        for lno, line in enumerate(f, 1):
            cols = line.rstrip("\n").split("\t")
            if lno == 1:
                if cols != ["eco", "name", "pgn"]:
                    sys.exit(f"{path.name}:{lno}: unexpected header {cols}")
                continue
            if len(cols) != 3:
                sys.exit(f"{path.name}:{lno}: expected 3 columns, got {len(cols)}")
            eco, name, pgn = cols
            board = chess.pgn.read_game(io.StringIO(pgn), Visitor=chess.pgn.BoardBuilder)
            if board is None:
                sys.exit(f"{path.name}:{lno}: empty pgn")
            uci = " ".join(m.uci() for m in board.move_stack)
            rows.append([eco, name, uci, board.epd()])
    return rows


def main() -> None:
    rows: list[list[str]] = []
    for vol in VOLUMES:
        rows.extend(parse_file(SRC_DIR / f"{vol}.tsv"))

    seen: dict[str, str] = {}
    for eco, name, _uci, epd in rows:
        if epd in seen and seen[epd] != name:
            print(f"warning: duplicate epd for {seen[epd]!r} and {name!r}", file=sys.stderr)
        seen.setdefault(epd, name)

    rows.sort(key=lambda r: (r[0], r[1], len(r[2])))
    payload = {
        "meta": {
            "source": "https://github.com/lichess-org/chess-openings (CC0)",
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "count": len(rows),
        },
        "rows": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} with {len(rows)} openings ({OUT.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
