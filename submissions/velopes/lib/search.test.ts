import { describe, expect, test } from "vitest";
import { searchListings } from "./search";
import { ValidationError, type Listing } from "./types";

const L = (over: Partial<Listing> & { id: string }): Listing => ({
  kind: "bike",
  title: "Велосипед",
  description: "",
  priceEur: 100,
  city: "Київ",
  condition: "добрий",
  postedAt: "2026-10-01",
  ...over,
});

const data: Listing[] = [
  L({ id: "a", title: "Гірський Merida Big Nine", priceEur: 420, frameSize: "M", postedAt: "2026-10-10" }),
  L({ id: "b", title: "Шосейний Giant", description: "легка алюмінієва рама", priceEur: 650, frameSize: "L", city: "Львів", postedAt: "2026-10-12" }),
  L({ id: "c", kind: "part", title: "Задній перемикач Shimano Deore", priceEur: 35, postedAt: "2026-10-05" }),
  L({ id: "d", title: "Міський Trek з кошиком", priceEur: 300, frameSize: "M", city: "Львів", postedAt: "2026-09-20" }),
];

const ids = (r: Listing[]) => r.map((x) => x.id);

describe("F1: searchListings", () => {
  test("F1: empty query returns everything, newest first by default", () => {
    expect(ids(searchListings(data, {}))).toEqual(["b", "a", "c", "d"]);
  });

  test("F1: text is case-insensitive and matches title or description", () => {
    expect(ids(searchListings(data, { text: "SHIMANO" }))).toEqual(["c"]);
    expect(ids(searchListings(data, { text: "алюмінієва" }))).toEqual(["b"]);
  });

  test("F1: several words must all match", () => {
    expect(ids(searchListings(data, { text: "міський кошиком" }))).toEqual(["d"]);
    expect(ids(searchListings(data, { text: "міський shimano" }))).toEqual([]);
  });

  test("F1: filters by kind, city and frame size", () => {
    expect(ids(searchListings(data, { kind: "part" }))).toEqual(["c"]);
    expect(ids(searchListings(data, { city: "Львів" }))).toEqual(["b", "d"]);
    expect(ids(searchListings(data, { frameSize: "M" }))).toEqual(["a", "d"]);
  });

  test("F1: price bounds are inclusive", () => {
    expect(ids(searchListings(data, { minPrice: 300, maxPrice: 420, sort: "price-asc" }))).toEqual(["d", "a"]);
  });

  test("F1: sorts by price both ways", () => {
    expect(ids(searchListings(data, { sort: "price-asc" }))).toEqual(["c", "d", "a", "b"]);
    expect(ids(searchListings(data, { sort: "price-desc" }))).toEqual(["b", "a", "d", "c"]);
  });

  test("F1: minPrice > maxPrice is a validation error, not an empty result", () => {
    expect(() => searchListings(data, { minPrice: 500, maxPrice: 100 })).toThrow(ValidationError);
  });

  test("F1: does not mutate the input array", () => {
    const copy = [...data];
    searchListings(data, { sort: "price-asc" });
    expect(data).toEqual(copy);
  });
});
