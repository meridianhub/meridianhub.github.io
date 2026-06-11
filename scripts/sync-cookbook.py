#!/usr/bin/env python3
"""Aggregate cookbook pattern metadata from the meridian repo into data/cookbook.json.

Usage: scripts/sync-cookbook.py [path-to-meridian-checkout]
"""
import json
import sys
from pathlib import Path

meridian = Path(sys.argv[1] if len(sys.argv) > 1 else "../../../meridian/meridian-main")
patterns_dir = meridian / "cookbook" / "patterns"

patterns = []
for pattern_json in sorted(patterns_dir.glob("*/pattern.json")):
    p = json.loads(pattern_json.read_text())
    meta = p.get("meta", {})
    provides = meta.get("provides", {})
    patterns.append({
        "name": p["name"],
        "title": p.get("title", p["name"]),
        "description": p.get("description", ""),
        "categories": p.get("categories", []),
        "complexity": meta.get("complexity", 0),
        "industries": meta.get("industries", []),
        "design_pattern": meta.get("design_pattern", ""),
        "instruments": provides.get("instruments", []),
        "account_types": provides.get("account_types", []),
        "sagas": provides.get("sagas", []),
        "composes_with": meta.get("composes_with", []),
        "extends": meta.get("extends", []),
        "files": len(p.get("files", [])),
    })

out = Path(__file__).resolve().parent.parent / "data" / "cookbook.json"
out.write_text(json.dumps({"patterns": patterns}, indent=2) + "\n")
print(f"Wrote {len(patterns)} patterns to {out}")
