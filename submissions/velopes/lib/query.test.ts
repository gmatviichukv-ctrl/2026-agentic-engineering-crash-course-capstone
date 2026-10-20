import { expect, test } from "vitest";
import { parseSearchParams } from "./query";

test("F5: URL params map to a SearchQuery", () => {
  expect(parseSearchParams({ q: " trek ", kind: "bike", city: "Львів", size: "M", min: "100", max: "500", sort: "price-asc" })).toEqual({
    text: "trek",
    kind: "bike",
    city: "Львів",
    frameSize: "M",
    minPrice: 100,
    maxPrice: 500,
    sort: "price-asc",
  });
});

test("F5: empty, unknown and malformed values are dropped", () => {
  const q = parseSearchParams({ q: "", kind: "car", size: "XXL", min: "-5", max: "abc", sort: "random", city: ["Київ", "Львів"] });
  expect(q).toEqual({ text: undefined, kind: undefined, city: "Київ", frameSize: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined });
});
