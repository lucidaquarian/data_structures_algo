# Data Structures & Algorithms

A hands-on course that pairs a **from-scratch Python implementation** of each
data structure with an **interactive visualization that embeds the program
itself** — you run an operation and watch the exact line of code light up as it
executes.

Written for two readers at once, via a **three-tier depth model**:

| Tier | For | Covers |
|------|-----|--------|
| **1 · Core** | Everyone | Mental model, operations, Big-O, a clean implementation. |
| **2 · Under the Hood** | Seniors, curious juniors | Amortized cost, memory/cache behavior, how production implementations differ. |
| **3 · Edge & Scale** | Seniors / interview depth | Concurrency, failure modes, alternatives at scale. |

See [`docs/syllabus.md`](docs/syllabus.md) for the full 13-module plan.

## Getting started

**Run a module's tests** (needs Python 3.10+ and `pytest`):
```bash
pip install pytest
pytest 01-arrays/          # or: pytest   (runs every module)
```

**Open a visualization:** just open the module's `visualize.html` in any
browser — e.g. `01-arrays/visualize.html`. No server or build step needed; the
D3 and anime.js libraries are vendored in `shared/viz/vendor/`, so the pages
work fully offline.

## Repository layout

```
docs/syllabus.md            # the full course plan
shared/
  viz/                      # shared visualization engine
    viz-core.js             #   D3 array renderer + play/step/speed engine
    code-panel.js           #   the synced, line-highlighting source viewer
    theme.css               #   one look across every module (light/dark, a11y)
    vendor/                 #   vendored D3 + anime.js (offline)
  build/
    embed_source.py         # injects each .py into its visualize.html
NN-topic/                   # one directory per module, same shape each time:
  README.md                 #   the lesson, in the three tiers above
  <structure>.py            #   from-scratch implementation (source of truth)
  test_<structure>.py       #   pytest tests / usage examples
  visualize.html            #   split-view: animation + embedded synced program
```

## For contributors

The `.py` file is the **single source of truth** for the code shown in a
visualization. After editing one, re-sync the embedded copy:

```bash
python shared/build/embed_source.py           # rewrite the HTML page(s)
python shared/build/embed_source.py --check    # verify (exit 1 if stale) — use in CI
```

Animations reference code by unique **snippet**, not by line number, so the sync
survives edits; if a snippet goes missing the page reports it instead of
silently mis-highlighting.

## Modules

| # | Module | Status |
|---|--------|--------|
| 00 | Foundations — Complexity | planned |
| 01 | **Arrays & Dynamic Arrays** | ✅ available |
| 02–12 | Linked lists → Algorithms capstone | planned |

See the [syllabus](docs/syllabus.md) for the complete list.
