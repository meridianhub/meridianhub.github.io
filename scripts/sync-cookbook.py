#!/usr/bin/env python3
"""Aggregate cookbook pattern metadata from the meridian repo into data/cookbook.json.

Usage: scripts/sync-cookbook.py <path-to-meridian-checkout>
"""
import json
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit(f"Usage: {sys.argv[0]} <path-to-meridian-checkout>")

meridian = Path(sys.argv[1])
patterns_dir = meridian / "cookbook" / "patterns"
if not patterns_dir.is_dir():
    sys.exit(f"Error: pattern directory not found: {patterns_dir}")

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
