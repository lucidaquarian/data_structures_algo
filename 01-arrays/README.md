# 01 · Arrays & Dynamic Arrays

> **In this module:** how an array stores elements in one contiguous block, why
> indexing is O(1), and how a *dynamic* array grows itself so you can keep
> appending forever. Read `dynamic_array.py` alongside `visualize.html` — the
> visualization highlights each line as it runs.

**Files**
- `dynamic_array.py` — the implementation (the single source of truth).
- `test_dynamic_array.py` — tests that double as usage examples.
- `visualize.html` — open in a browser; watch operations animate against the code.

Run the tests:
```bash
pytest 01-arrays/          # from the repo root
```
Open `01-arrays/visualize.html` in any browser (works offline — the libraries
are vendored in `shared/viz/vendor/`).

---

## Tier 1 · Core

### Motivation
You need an ordered collection you can index into instantly and grow on demand:
a list of users, the characters in a string, the pixels in a row. That is an
array — the most fundamental data structure, and the thing most others are
built out of.

### Mental model
An array is **one contiguous block of memory** holding equally-sized slots,
numbered from 0. Because every slot is the same size and they sit back-to-back,
the computer finds slot `i` with a single multiplication:

```
address(i) = base_address + i × slot_size
```

No scanning — that arithmetic is why reading or writing any index is **O(1)**.

A *fixed* array has a set number of slots. A **dynamic array** (Python's `list`,
Java's `ArrayList`, C++'s `vector`) wraps a fixed block with two counters —
`capacity` (slots allocated) and `size` (slots used) — and reallocates a bigger
block when it fills up. That is exactly what `dynamic_array.py` implements.

### Operations & complexity

| Operation | Cost | Why |
|-----------|------|-----|
| `get(i)` / `set(i)` | **O(1)** | address arithmetic, no scan |
| `append(x)` | **O(1) amortized** | usually just a write; occasionally an O(n) resize |
| `insert(i, x)` | **O(n)** | must shift every later element one slot right |
| `pop()` | **O(1) amortized** | drop the last element |
| `delete(i)` | **O(n)** | must shift every later element one slot left |

### The one idea to take away
Arrays make **position** cheap (O(1) random access) and **rearrangement**
expensive (O(n) inserts/deletes in the middle). Every trade-off in this module
flows from that.

---

## Tier 2 · Under the Hood

### Why doubling makes `append` O(1) *amortized*
When the store is full, `append` allocates a new store and copies everything —
an O(n) step. So how can we call `append` O(1)?

Because we grow by a **constant factor** (here, ×2), resizes get exponentially
rarer. Appending `n` elements from empty triggers resizes at sizes
1, 2, 4, 8, …, n — about `log₂ n` of them — and the copies total
`1 + 2 + 4 + … + n < 2n`. Spread that ~`2n` work across `n` appends and each one
costs a **constant on average**. That averaged-over-a-sequence cost is what
*amortized O(1)* means. (Grow by adding a *fixed* number of slots instead of
doubling and you would get O(n) per append — the whole reason the growth is
multiplicative.)

### How CPython's `list` really does it
CPython's `list` is a dynamic array of pointers. Two differences from our
teaching version:
- **Growth factor.** It does *not* double. It grows by roughly `newsize +
  (newsize >> 3)` — about **1.125×** plus a small constant. A gentler factor
  wastes less memory on large lists while staying amortized O(1).
- **Over-allocation on the first append,** so tiny lists don't thrash.

Our `×2` is the textbook choice because the math is clean; production
implementations tune the constant for memory.

### Memory layout & cache locality
Because the elements (or pointers to them) are contiguous, walking an array
reads memory in a straight line — exactly what CPU caches and prefetchers are
built for. This *cache locality* is why iterating an array is dramatically
faster in practice than chasing pointers through a linked list (Module 02),
even when Big-O says both are O(n).

---

## Tier 3 · Edge & Scale

- **Preallocate when you know the size.** If you'll append `n` items, building
  the store once at capacity `n` avoids every resize. In Python, a list
  comprehension or `[None] * n` beats a growing loop; NumPy allocates the exact
  block up front.
- **Growth factor vs. memory reuse.** A factor `< 2` (like CPython's) lets the
  allocator sometimes reuse freed blocks, reducing fragmentation. A factor of
  exactly 2 can never reuse the sum of previous blocks. This is a real
  allocator-level trade-off, not trivia.
- **Typed / packed arrays.** Storing raw numbers (Python's `array`, `bytearray`,
  or NumPy `ndarray`) packs values inline instead of as boxed pointer-objects —
  less memory and far better cache behavior for numeric work.
- **Shrinking.** Our array frees element references on `pop`/`delete` but never
  shrinks capacity. Real implementations that do shrink must avoid *thrashing*
  (repeated grow/shrink at the boundary) by shrinking only well below half full.

---

## Trade-offs — when to reach for an array

**Use an array when** you need indexed access, you mostly append or read, and
you iterate in order (cache-friendly). This covers the large majority of
"list of things" needs.

**Reach for something else when:**
- you insert/delete in the *middle* a lot → a **linked list** (Module 02) makes
  those O(1) *once you hold the node*.
- you look things up by key, not position → a **hash table** (Module 05).
- you always want the smallest/largest next → a **heap** (Module 07).

### Watch the animation for
- **`append` after the store fills** — the resize step copies every element into
  a new, larger block (highlighted as *copied on resize*).
- **`insert` / `delete` in the middle** — the shifting of later elements is the
  O(n) cost made visible.
- **`get`** — a single highlighted slot, no scanning: O(1).
