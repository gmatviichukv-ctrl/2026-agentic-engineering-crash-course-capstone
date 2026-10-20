import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ListingGrid } from "./ListingGrid";

test("F5: renders a card per listing with price in €", () => {
  render(
    <ListingGrid
      listings={[{ id: "1", kind: "part", title: "Сідло Brooks", description: "шкіра", priceEur: 60, city: "Львів", condition: "добрий", postedAt: "2026-10-01" }]}
    />,
  );
  expect(screen.getByText("Сідло Brooks")).toBeDefined();
  expect(screen.getByText(/60\s€/)).toBeDefined();
  expect(screen.getByText(/Запчастина · Львів/)).toBeDefined();
});

test("F5: empty result shows a hint instead of a blank page", () => {
  render(<ListingGrid listings={[]} />);
  expect(screen.getByText(/Нічого не знайдено/)).toBeDefined();
});
