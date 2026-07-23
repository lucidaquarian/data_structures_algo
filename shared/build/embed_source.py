#!/usr/bin/env python3
"""Embed each module's Python source into its visualize.html.

The visualization's code panel must show *exactly* the code the tests run, but
a browser opened from ``file://`` can't ``fetch`` a sibling ``.py``. So we inject
the source at build time into a ``<script type="text/plain" id="...">`` block.
The ``.py`` file stays the single source of truth; run this whenever you change
one.

Usage:
    python shared/build/embed_source.py            # rewrite all pages
    python shared/build/embed_source.py --check     # verify, exit 1 if stale
                                                    # (use in CI / pre-commit)

To register a new module, add an entry to REGISTRY below.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

# (python source, html page, <script> id) — one row per visualized module.
REGISTRY = [
    ("01-arrays/dynamic_array.py", "01-arrays/visualize.html", "da-source"),
]


def _block_re(script_id: str) -> re.Pattern:
    return re.compile(
        r'(<script[^>]*id="' + re.escape(script_id) + r'"[^>]*>)(.*?)(</script>)',
        re.DOTALL,
    )


def render(html: str, script_id: str, source: str) -> str:
    """Return `html` with the identified script block's body replaced."""
    pattern = _block_re(script_id)
    if not pattern.search(html):
        raise SystemExit(f'no <script id="{script_id}"> block found')
    replacement = r"\1\n" + source.rstrip("\n") + "\n\3"
    # Escape backreference-like sequences in the source before substitution.
    return pattern.sub(lambda m: m.group(1) + "\n" + source.rstrip("\n") + "\n" + m.group(3), html)


def process(check: bool) -> int:
    stale = []
    for py_rel, html_rel, script_id in REGISTRY:
        py_path = REPO / py_rel
        html_path = REPO / html_rel
        source = py_path.read_text(encoding="utf-8")
        html = html_path.read_text(encoding="utf-8")
        updated = render(html, script_id, source)
        if updated != html:
            if check:
                stale.append(html_rel)
            else:
                html_path.write_text(updated, encoding="utf-8")
                print(f"updated {html_rel}  (from {py_rel})")
        else:
            print(f"ok      {html_rel}")

    if check and stale:
        print("\nSTALE — run `python shared/build/embed_source.py`:", file=sys.stderr)
        for s in stale:
            print(f"  {s}", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="verify only; exit 1 if stale")
    args = ap.parse_args()
    return process(check=args.check)


if __name__ == "__main__":
    raise SystemExit(main())
