import assert from "node:assert/strict";
import test from "node:test";

import {
  filterQuickBites,
  orderRecentlyViewed,
  sortTopRatedItems,
} from "./menuShelfUtils.js";

test("filterQuickBites returns items priced at or below the limit", () => {
  const items = [
    { _id: "1", name: "Roll", price: 120 },
    { _id: "2", name: "Pizza", price: 320 },
    { _id: "3", name: "Momo", price: 200 },
  ];

  assert.deepEqual(filterQuickBites(items).map((item) => item._id), ["1", "3"]);
});

test("sortTopRatedItems prefers rating and then price descending", () => {
  const items = [
    { _id: "1", name: "A", price: 300, rating: 4.3 },
    { _id: "2", name: "B", price: 250, rating: 4.8 },
    { _id: "3", name: "C", price: 500, rating: 4.8 },
    { _id: "4", name: "D", price: 450 },
  ];

  assert.deepEqual(sortTopRatedItems(items).map((item) => item._id), [
    "3",
    "2",
    "1",
    "4",
  ]);
});

test("orderRecentlyViewed preserves localStorage id order", () => {
  const items = [
    { _id: "a", name: "Alpha" },
    { _id: "b", name: "Beta" },
    { _id: "c", name: "Chaat" },
  ];

  assert.deepEqual(orderRecentlyViewed(items, ["c", "a"]).map((item) => item._id), [
    "c",
    "a",
  ]);
});
