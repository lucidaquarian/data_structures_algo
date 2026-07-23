"""Tests for DynamicArray.

These double as usage examples — read them top to bottom to see every operation
in action. Run them with:

    pytest 01-arrays/            # from the repo root
    pytest                       # or just this, from inside 01-arrays/
"""

import pytest

from dynamic_array import DynamicArray


def test_starts_empty():
    arr = DynamicArray()
    assert len(arr) == 0
    assert arr.capacity == 1
    assert list(arr) == []


def test_append_and_index():
    arr = DynamicArray()
    arr.append("a")
    arr.append("b")
    arr.append("c")
    assert len(arr) == 3
    assert arr.get(0) == "a"
    assert arr.get(2) == "c"
    assert list(arr) == ["a", "b", "c"]


def test_capacity_doubles_on_growth():
    arr = DynamicArray()
    # capacity starts at 1 and doubles each time it fills: 1, 2, 4, 8, ...
    expected_capacity = [1, 2, 4, 4, 8, 8, 8, 8]
    for i in range(8):
        arr.append(i)
        assert arr.capacity == expected_capacity[i], f"after {i + 1} appends"
    assert len(arr) == 8
    # capacity is always >= size
    assert arr.capacity >= len(arr)


def test_set_overwrites_in_place():
    arr = DynamicArray()
    arr.append(10)
    arr.append(20)
    arr.set(1, 99)
    assert list(arr) == [10, 99]
    assert len(arr) == 2  # set never changes size


def test_insert_shifts_right():
    arr = DynamicArray()
    for x in [1, 2, 3]:
        arr.append(x)
    arr.insert(1, 99)
    assert list(arr) == [1, 99, 2, 3]
    arr.insert(0, 42)          # at the front
    assert list(arr) == [42, 1, 99, 2, 3]
    arr.insert(len(arr), 7)    # at the very end
    assert list(arr) == [42, 1, 99, 2, 3, 7]


def test_pop_returns_and_removes_last():
    arr = DynamicArray()
    for x in [1, 2, 3]:
        arr.append(x)
    assert arr.pop() == 3
    assert arr.pop() == 2
    assert list(arr) == [1]
    assert len(arr) == 1


def test_delete_shifts_left():
    arr = DynamicArray()
    for x in ["a", "b", "c", "d"]:
        arr.append(x)
    arr.delete(1)
    assert list(arr) == ["a", "c", "d"]
    arr.delete(0)
    assert list(arr) == ["c", "d"]
    arr.delete(len(arr) - 1)
    assert list(arr) == ["c"]


def test_append_after_pop_reuses_capacity():
    arr = DynamicArray()
    for x in range(4):
        arr.append(x)          # capacity now 4
    cap = arr.capacity
    arr.pop()
    arr.append(99)             # fits without growing
    assert arr.capacity == cap
    assert list(arr) == [0, 1, 2, 99]


@pytest.mark.parametrize("bad_index", [-1, 0, 5])
def test_get_out_of_range_raises(bad_index):
    arr = DynamicArray()
    arr.append(1)  # size == 1, so only index 0 is valid
    if bad_index == 0:
        assert arr.get(0) == 1  # sanity: valid index does not raise
    else:
        with pytest.raises(IndexError):
            arr.get(bad_index)


def test_insert_out_of_range_raises():
    arr = DynamicArray()
    arr.append(1)
    with pytest.raises(IndexError):
        arr.insert(-1, 0)
    with pytest.raises(IndexError):
        arr.insert(5, 0)  # > size is invalid for insert


def test_pop_empty_raises():
    arr = DynamicArray()
    with pytest.raises(IndexError):
        arr.pop()


def test_delete_out_of_range_raises():
    arr = DynamicArray()
    arr.append(1)
    with pytest.raises(IndexError):
        arr.delete(1)  # == size is invalid for delete


def test_repr_is_readable():
    arr = DynamicArray()
    arr.append(1)
    arr.append(2)
    text = repr(arr)
    assert "1" in text and "2" in text
    assert "capacity=" in text
