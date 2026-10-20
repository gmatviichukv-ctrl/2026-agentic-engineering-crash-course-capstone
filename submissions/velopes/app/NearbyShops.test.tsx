import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { NearbyShops } from "./NearbyShops";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("F6: choosing a city lists shops with a Google Maps link", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ shops: [
    { id: "1", name: "BikeRent Хрещатик", address: "вул. Хрещатик, 22", lat: 50.4475, lng: 30.5225, mapsUrl: "https://maps.google.com/?cid=222", distanceKm: 0.3 },
  ] })));
  render(<NearbyShops />);
  fireEvent.change(screen.getByLabelText("Місто"), { target: { value: "Київ" } });
  expect(await screen.findByText("BikeRent Хрещатик")).toBeDefined();
  expect(screen.getByRole("link", { name: /Google Maps/ }).getAttribute("href")).toBe("https://maps.google.com/?cid=222");
});

test("F6: shows the server's Ukrainian message when the key is missing", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ errors: ["Пошук прокатів вимкнено: не задано ключ Google"] }, { status: 503 })));
  render(<NearbyShops />);
  fireEvent.change(screen.getByLabelText("Місто"), { target: { value: "Львів" } });
  expect(await screen.findByText(/не задано ключ Google/)).toBeDefined();
});

test("F6: geolocation denied → asks to pick a city instead", async () => {
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: (_ok: unknown, err: () => void) => err() } });
  vi.stubGlobal("fetch", vi.fn());
  render(<NearbyShops />);
  fireEvent.click(screen.getByRole("button", { name: /Моя геолокація/ }));
  expect(await screen.findByText(/Немає доступу до геолокації/)).toBeDefined();
  expect(fetch).not.toHaveBeenCalled();
});
