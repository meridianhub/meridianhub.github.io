#!/usr/bin/env python3
"""Aggregate cookbook pattern metadata from the meridian repo into data/cookbook.json.

Reads each pattern's pattern.json for registry metadata and its
manifest-fragment.yaml for the economy graph (instruments, account types
with balance side and allowed instruments, valuation rules).

Usage: scripts/sync-cookbook.py <path-to-meridian-checkout>
"""
import json
import re
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit(f"Usage: {sys.argv[0]} <path-to-meridian-checkout>")

meridian = Path(sys.argv[1])
patterns_dir = meridian / "cookbook" / "patterns"
if not patterns_dir.is_dir():
    sys.exit(f"Error: pattern directory not found: {patterns_dir}")


def split_top_level(yaml_text):
    """Split a manifest fragment into top-level key -> block of lines."""
    sections, current = {}, None
    for line in yaml_text.splitlines():
        m = re.match(r"^([A-Za-z][A-Za-z0-9_]*):\s*$", line)
        if m:
            current = m.group(1)
            sections[current] = []
        elif current is not None:
            sections[current].append(line)
    return sections


def split_items(lines):
    """Split a section's lines into '- ' list items (top indent level)."""
    items, item = [], None
    indents = [len(l) - len(l.lstrip()) for l in lines if l.strip().startswith("- ")]
    if not indents:
        return []
    base = min(indents)
    for line in lines:
        indent = len(line) - len(line.lstrip())
        if line.strip().startswith("- ") and indent == base:
            if item is not None:
                items.append(item)
            item = [line.replace("- ", "  ", 1)]
        elif item is not None:
            item.append(line)
    if item is not None:
        items.append(item)
    return ["\n".join(i) for i in items]


def field(item, key):
    m = re.search(rf"^\s*{key}:\s*(.+?)\s*$", item, re.M)
    return m.group(1).strip("'\"") if m else None


def list_field(item, key):
    raw = field(item, key)
    if not raw or not raw.startswith("["):
        return []
    return [v.strip() for v in raw.strip("[]").split(",") if v.strip()]


def parse_fragment(path):
    if not path.is_file():
        return [], [], []
    sections = split_top_level(path.read_text())
    instruments = []
    for item in split_items(sections.get("instruments", [])):
        code = field(item, "code")
        if code:
            instruments.append({
                "code": code,
                "type": (field(item, "type") or "").replace("INSTRUMENT_TYPE_", ""),
            })
    accounts = []
    for item in split_items(sections.get("accountTypes", [])):
        code = field(item, "code")
        if code:
            accounts.append({
                "code": code,
                "side": "CR" if "CREDIT" in (field(item, "normalBalance") or "") else "DR",
                "instruments": list_field(item, "allowedInstruments"),
            })
    valuations = []
    for item in split_items(sections.get("valuationRules", [])):
        src, dst = field(item, "fromInstrument"), field(item, "toInstrument")
        if src and dst:
            valuations.append({"name": field(item, "name") or "", "from": src, "to": dst})
    return instruments, accounts, valuations


patterns = []
for pattern_json in sorted(patterns_dir.glob("*/pattern.json")):
    p = json.loads(pattern_json.read_text())
    meta = p.get("meta", {})
    provides = meta.get("provides", {})
    instruments, accounts, valuations = parse_fragment(pattern_json.parent / "manifest-fragment.yaml")
    patterns.append({
        "name": p["name"],
        "title": p.get("title", p["name"]),
        "description": p.get("description", ""),
        "categories": p.get("categories", []),
        "complexity": meta.get("complexity", 0),
        "industries": meta.get("industries", []),
        "design_pattern": meta.get("design_pattern", ""),
        "instruments": instruments,
        "account_types": accounts,
        "valuation_rules": valuations,
        "sagas": provides.get("sagas", []),
        "triggers": provides.get("triggers", []),
        "composes_with": meta.get("composes_with", []),
        "extends": meta.get("extends", []),
        "files": len(p.get("files", [])),
    })

out = Path(__file__).resolve().parent.parent / "data" / "cookbook.json"
out.write_text(json.dumps({"patterns": patterns}, indent=2) + "\n")
print(f"Wrote {len(patterns)} patterns to {out}")
