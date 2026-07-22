# Data Structures & Algorithms — Course Syllabus

A hands-on course that takes a developer from *"I've heard of a hash table"* to
*"I can implement one, reason about its cost, and explain how CPython's `dict`
does it differently."* Every topic pairs a **runnable Python implementation**
with an **interactive visualization that embeds the program itself** — you watch
an operation animate while the exact line of code that's running lights up.

---

## Who this is for

This single course is written for two readers at once:

- **Junior developers** meeting these structures for the first time.
- **Senior developers** refreshing fundamentals, going deep on internals, or
  preparing for interviews.

It serves both through a **three-tier depth model**. Read as far down the tiers
as you need for any given module:

| Tier | Name | For | What it covers |
|------|------|-----|----------------|
| **1** | **Core** | Everyone | Mental model, operations, Big-O, a clean from-scratch implementation. |
| **2** | **Under the Hood** | Seniors, curious juniors | Amortized-cost reasoning, memory/cache behavior, how the real production implementation differs from the teaching one. |
| **3** | **Edge & Scale** | Seniors / interview depth | Concurrency, persistence, failure modes, alternatives at scale, war stories. |

A junior can stop at Tier 1 and have a complete, correct understanding. A senior
can drop straight to Tiers 2–3 for the parts they don't already know.

---

## How each module is structured

Every module folder follows the **same shape**, so the pattern is predictable:

```
NN-topic/
├── README.md          # the lesson, written in the three tiers above
├── <structure>.py     # from-scratch implementation — the single source of truth
├── test_<structure>.py# pytest tests that double as usage examples
└── visualize.html     # split-view: animation ⇆ the embedded, synced program
```

And each lesson is taught in the same rhythm:

1. **Motivation** — a concrete problem the structure solves.
2. **Mental model** — plain language + one diagram.
3. **Operations & complexity** — a Big-O table, per operation.
4. **Implementation** — clean, commented, from-scratch Python.
5. **Visualize** — interactive page; step through operations while the code
   highlights.
6. **Trade-offs** — when to use it, and what to use instead.

### The signature feature: the program lives inside the visualization

Each `visualize.html` is a split view. On the left, the structure animates
(D3 for layout, anime.js for motion). On the right, the **exact Python from the
module's `.py` file** is shown, syntax-highlighted. As the animation steps
through an operation, **the executing line highlights in sync** — so you read
and understand the code right after interacting with the structure, with
behavior and implementation on one screen. The `.py` file is the only copy of
the code; the page pulls from it, so what you read is exactly what the tests
run.

---

## Course map

The course has **13 modules** in four phases. Phases 1–2 alone form a complete
junior course; phases 3–4 add interview-ready depth.

| Phase | Modules | Goal |
|-------|---------|------|
| **1 · Foundations & linear structures** | 00–04 | The bedrock every developer needs. |
| **2 · Hashing & trees** | 05–06 | The workhorses of real systems. |
| **3 · Advanced structures** | 07–11 | Interview and systems depth. |
| **4 · Algorithms capstone** | 12 | Put the structures to work. |

---

## Modules

### 00 · Foundations — Complexity & how to measure
**Structures/topics:** Big-O, Big-Θ, Big-Ω, time vs. space trade-offs.
- **Tier 1 · Core:** What Big-O means, the common growth classes (O(1), O(log n),
  O(n), O(n log n), O(n²)), how to read a complexity table.
- **Tier 2 · Under the Hood:** Amortized vs. worst-case vs. average-case; why
  constant factors and cache behavior make "slower" Big-O sometimes win.
- **Tier 3 · Edge & Scale:** How to actually benchmark in Python; when Big-O
  analysis lies to you.
- **Visualization:** Interactive growth-curve comparison — drag `n`, watch the
  curves diverge.

### 01 · Arrays & Dynamic Arrays
**Structures/topics:** fixed-size arrays, dynamic (growable) arrays, amortized
append.
- **Tier 1:** Indexing, append, insert, delete; why resizing happens.
- **Tier 2:** CPython `list` growth factor and over-allocation; contiguous
  memory and cache locality; amortized O(1) append, proven.
- **Tier 3:** When a preallocated array beats a dynamic one; `array`/`bytearray`
  and NumPy for numeric data.
- **Visualization:** Watch capacity double on growth; elements copy to the new
  backing store.

### 02 · Linked Lists
**Structures/topics:** singly, doubly, and circular linked lists.
- **Tier 1:** Nodes and pointers; insert/delete at head/tail/middle; traversal.
- **Tier 2:** Why linked lists lose to arrays on modern CPUs (pointer chasing,
  cache misses); the space overhead of a node.
- **Tier 3:** Where they still win (O(1) splice, intrusive lists, LRU caches);
  sentinel nodes.
- **Visualization:** Pointer rewiring animated step-by-step on insert/delete.

### 03 · Stacks
**Structures/topics:** LIFO; array-backed vs. linked implementations.
- **Tier 1:** push/pop/peek; the LIFO invariant.
- **Tier 2:** The program call stack; stack frames; how recursion uses it.
- **Tier 3:** Stack overflow and Python's recursion limit; converting recursion
  to an explicit stack.
- **Visualization:** Push/pop with a call-stack analogy; overflow on a bounded
  stack.

### 04 · Queues
**Structures/topics:** queue (FIFO), deque, circular (ring) buffer.
- **Tier 1:** enqueue/dequeue; why a naive array queue is O(n).
- **Tier 2:** `collections.deque` internals (block of arrays); the ring-buffer
  head/tail trick for O(1) both ends.
- **Tier 3:** Bounded/backpressure queues; producer–consumer and lock-free
  queues.
- **Visualization:** Ring buffer with head/tail pointers wrapping around a
  fixed-size array.

### 05 · Hash Tables
**Structures/topics:** hashing, collision resolution (chaining vs. open
addressing), load factor, resizing.
- **Tier 1:** Hash function → bucket; handling collisions; average O(1)
  lookup.
- **Tier 2:** CPython `dict` (open addressing + compact dict layout); load
  factor and rehashing; why iteration order is insertion order.
- **Tier 3:** Hash-flooding DoS and hash randomization; consistent hashing for
  distributed systems.
- **Visualization:** Insert with collisions; watch a resize trigger a full
  rehash.

### 06 · Trees & Binary Search Trees
**Structures/topics:** binary trees, BST insert/search/delete, traversals
(in/pre/post-order, level-order).
- **Tier 1:** Tree vocabulary; BST ordering invariant; the four traversals.
- **Tier 2:** Recursive vs. iterative traversal and their stack cost;
  degeneration to a linked list on sorted input.
- **Tier 3:** Threaded trees; Morris traversal (O(1) space); when a tree is the
  wrong choice.
- **Visualization:** Traversal order lights up nodes; insert/delete restructures
  the tree.

### 07 · Heaps & Priority Queues
**Structures/topics:** binary heap, heapify, heapsort, priority queue.
- **Tier 1:** The heap property; sift-up/sift-down; array representation.
- **Tier 2:** `heapq` internals; O(n) bottom-up heapify proven; heapsort.
- **Tier 3:** d-ary heaps; the decrease-key problem (and why it matters for
  Dijkstra); a nod to Fibonacci heaps.
- **Visualization:** Sift-up/sift-down bubbling; the array ⇆ tree duality shown
  side by side.

### 08 · Balanced Trees
**Structures/topics:** AVL trees, red-black trees, rotations.
- **Tier 1:** Why balance matters; single and double rotations; the AVL balance
  factor.
- **Tier 2:** Red-black invariants and how they bound height; rebalancing cost
  vs. lookup speed trade-off.
- **Tier 3:** Where B-trees/B+-trees win (databases, filesystems) and why disk
  block size drives the design.
- **Visualization:** Rotations animate as the tree restores balance after an
  insert.

### 09 · Tries
**Structures/topics:** prefix trees, autocomplete.
- **Tier 1:** Character-by-character paths; insert/search/prefix-match.
- **Tier 2:** Space cost of a trie; radix/compressed (Patricia) tries to fix it.
- **Tier 3:** Ternary search tries; tries vs. hash maps for prefix queries;
  real-world use in routers and autocomplete.
- **Visualization:** Type a word; watch the path light up and autocomplete
  branch.

### 10 · Graphs
**Structures/topics:** representations (adjacency list vs. matrix), BFS, DFS.
- **Tier 1:** Vertices/edges, directed vs. undirected, weighted; BFS and DFS
  traversal.
- **Tier 2:** Representation trade-offs (memory of dense vs. sparse); iterative
  DFS with an explicit stack.
- **Tier 3:** Graphs at scale (adjacency compression, CSR format); when a graph
  DB earns its keep.
- **Visualization:** Frontier expansion for BFS/DFS on a live, editable graph.

### 11 · Union-Find (Disjoint Set)
**Structures/topics:** disjoint-set forest, union by rank, path compression.
- **Tier 1:** find/union; the "connected components" problem.
- **Tier 2:** Union by rank + path compression; near-constant amortized cost.
- **Tier 3:** The inverse-Ackermann bound explained intuitively; uses in
  Kruskal's MST and network connectivity.
- **Visualization:** Sets merging; roots collapsing as path compression flattens
  the forest.

### 12 · Key Algorithms (Capstone)
**Structures/topics:** sorting (merge sort, quicksort), binary search, graph
algorithms (Dijkstra, topological sort).
- **Tier 1:** How each algorithm works; its Big-O; when to reach for it.
- **Tier 2:** Sort stability; hybrid sorts (Timsort); quicksort pivot choice and
  worst case; Dijkstra's dependence on the heap from Module 07.
- **Tier 3:** Dijkstra vs. A*; external/parallel sorting; how the earlier
  data structures show up inside these algorithms.
- **Visualization:** Side-by-side sort "race"; Dijkstra's shortest-path
  relaxation on a weighted graph.

---

## Prerequisites

- Comfortable writing basic Python (functions, classes, loops, lists/dicts).
- Python 3.10+ installed. `pytest` for running the tests.
- A modern browser to open the visualizations. No build tools required to *use*
  the course.

## What you'll be able to do by the end

- Implement every structure above from scratch, with correct edge-case handling.
- State and justify the time/space complexity of each operation.
- Choose the right structure for a problem and defend the trade-off.
- Explain how real production implementations (`list`, `dict`, `deque`, `heapq`)
  differ from the textbook versions — the senior-level context interviews and
  design reviews actually test.

---

## Build order (for reference)

1. **Phase 0 — Scaffolding:** shared visualization core + the synced code-panel
   mechanism.
2. **Phase 1 — Reference module (01 · Arrays)** end-to-end as the template to
   review before scaling out.
3. **Phase 2 — Core essentials** (02–06).
4. **Phase 3 — Advanced structures** (07–11).
5. **Phase 4 — Algorithms capstone** (12) + landing page.
