"""A dynamic (growable) array built from scratch.

This is a *teaching* implementation. It manages its own capacity on top of a
fixed-size backing store, so you can see exactly how a growable array works
under the hood. In real Python code you would just use the built-in ``list`` —
this module shows what ``list`` is doing for you.

The idea: a "dynamic array" is a fixed-size block of memory (the *backing
store*) plus a bit of bookkeeping. Two numbers do all the work:

    capacity - how many slots the backing store has room for
    size      - how many of those slots are actually in use

When you append and the store is full (``size == capacity``), we allocate a
bigger store, copy everything across, and carry on. Growing by *doubling* is
what keeps ``append`` cheap on average (see the note on ``append`` below).

Complexity summary (n = number of elements):

    index get / set : O(1)
    append          : O(1) amortized   (O(n) only on a resize step)
    insert          : O(n)             (must shift later elements right)
    pop (from end)  : O(1) amortized
    delete (middle) : O(n)             (must shift later elements left)
"""

from typing import Any, Iterator


class DynamicArray:
    """A resizable array with amortized O(1) append."""

    def __init__(self) -> None:
        self._capacity: int = 1                       # slots allocated
        self._size: int = 0                           # slots in use
        self._data: list = self._make_store(self._capacity)

    @staticmethod
    def _make_store(capacity: int) -> list:
        """Allocate a fresh backing store of ``capacity`` empty slots."""
        return [None] * capacity

    def __len__(self) -> int:
        """Number of elements stored. O(1)."""
        return self._size

    @property
    def capacity(self) -> int:
        """Number of slots currently allocated (always >= len). O(1)."""
        return self._capacity

    def get(self, index: int) -> Any:
        """Return the element at ``index``. O(1)."""
        self._check_index(index)
        return self._data[index]

    def set(self, index: int, value: Any) -> None:
        """Overwrite the element at ``index``. O(1)."""
        self._check_index(index)
        self._data[index] = value

    def append(self, value: Any) -> None:
        """Add ``value`` to the end. O(1) amortized.

        When the store is full we allocate a store twice as big and copy every
        element across. That copy is O(n), but because the capacity doubles,
        resizes get rarer as the array grows: appending n elements triggers
        only ~log2(n) resizes and ~2n copies total, so the *average* cost per
        append is a constant. That "constant on average" is what amortized
        O(1) means.
        """
        if self._size == self._capacity:
            self._resize(2 * self._capacity)
        self._data[self._size] = value
        self._size += 1

    def insert(self, index: int, value: Any) -> None:
        """Insert ``value`` at ``index``, shifting later elements right. O(n)."""
        if index < 0 or index > self._size:
            raise IndexError("index out of range")
        if self._size == self._capacity:
            self._resize(2 * self._capacity)
        for i in range(self._size, index, -1):
            self._data[i] = self._data[i - 1]
        self._data[index] = value
        self._size += 1

    def pop(self) -> Any:
        """Remove and return the last element. O(1) amortized."""
        if self._size == 0:
            raise IndexError("pop from empty array")
        value = self._data[self._size - 1]
        self._data[self._size - 1] = None             # drop the reference
        self._size -= 1
        return value

    def delete(self, index: int) -> None:
        """Remove the element at ``index``, shifting later elements left. O(n)."""
        self._check_index(index)
        for i in range(index, self._size - 1):
            self._data[i] = self._data[i + 1]
        self._data[self._size - 1] = None             # drop the duplicate tail
        self._size -= 1

    def _resize(self, new_capacity: int) -> None:
        """Move every element into a new, larger backing store. O(n)."""
        new_store = self._make_store(new_capacity)
        for i in range(self._size):
            new_store[i] = self._data[i]
        self._data = new_store
        self._capacity = new_capacity

    def _check_index(self, index: int) -> None:
        """Raise ``IndexError`` unless ``0 <= index < size``."""
        if index < 0 or index >= self._size:
            raise IndexError("index out of range")

    def __iter__(self) -> Iterator[Any]:
        """Yield the elements in order. O(n)."""
        for i in range(self._size):
            yield self._data[i]

    def __repr__(self) -> str:
        items = ", ".join(repr(x) for x in self)
        return f"DynamicArray([{items}], size={self._size}, capacity={self._capacity})"
