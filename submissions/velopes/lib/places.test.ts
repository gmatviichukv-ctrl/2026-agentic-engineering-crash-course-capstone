import { describe, expect, test } from "vitest";
import fixture from "./__fixtures__/places-kyiv.json";
import { buildPlacesRequest, distanceKm, FIELD_MASK, parsePlaces, validateCoords } from "./places";

const maidan = { lat: 50.4501, lng: 30.5234 };

describe("F6: buildPlacesRequest", () => {
  test("F6: Ukrainian text query biased to a circle around the user", () => {
    expect(buildPlacesRequest(maidan)).toEqual({
      textQuery: "прокат велосипедів",
      languageCode: "uk",
      pageSize: 10,
      locationBias: { circle: { center: { latitude: 50.4501, longitude: 30.5234 }, radius: 5000 } },
    });
  });

  test("F6: radius is clamped to 100–50000 m", () => {
    expect(buildPlacesRequest({ ...maidan, radiusM: 10 }).locationBias.circle.radius).toBe(100);
    expect(buildPlacesRequest({ ...maidan, radiusM: 999_999 }).locationBias.circle.radius).toBe(50000);
    expect(buildPlacesRequest({ ...maidan, radiusM: Number.NaN }).locationBias.circle.radius).toBe(5000);
  });

  test("F6: field mask asks only for the cheap fields we show — no rating", () => {
    expect(FIELD_MASK).toBe("places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri");
  });
});

describe("F6: parsePlaces", () => {
  test("F6: maps Google places to shops, nearest first, skipping ones without name or location", () => {
    const shops = parsePlaces(fixture, maidan);
    expect(shops.map((s) => s.id)).toEqual(["near-shop", "far-shop"]);
    expect(shops[0]).toEqual({
      id: "near-shop",
      name: "BikeRent Хрещатик",
      address: "вул. Хрещатик, 22, Київ",
      lat: 50.4475,
      lng: 30.5225,
      mapsUrl: "https://maps.google.com/?cid=222",
      distanceKm: 0.3,
    });
  });

  test("F6: an empty Google answer ({}) is an empty list, not a crash", () => {
    expect(parsePlaces({}, maidan)).toEqual([]);
    expect(parsePlaces(null, maidan)).toEqual([]);
  });

  test("F6: a place without googleMapsUri still gets a working Google Maps link", () => {
    const [shop] = parsePlaces(
      { places: [{ id: "x", displayName: { text: "Прокат" }, location: { latitude: 50.45, longitude: 30.52 } }] },
      maidan,
    );
    expect(shop?.mapsUrl).toBe("https://www.google.com/maps/search/?api=1&query=50.45%2C30.52");
    expect(shop?.address).toBe("");
  });
});

describe("F6: distanceKm and validateCoords", () => {
  test("F6: haversine distance rounded to 0.1 km", () => {
    expect(distanceKm(maidan, maidan)).toBe(0);
    // 1° of latitude on a 6371 km sphere = 111.19 km → rounded 111.2 (pins radius, radians and rounding)
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBe(111.2);
    expect(distanceKm(maidan, { lat: 49.8419, lng: 24.0315 })).toBeCloseTo(469, -1); // Kyiv → Lviv sanity check
  });

  test("F6: coordinates must be numbers within range", () => {
    expect(validateCoords(50.45, 30.52)).toBeNull();
    expect(validateCoords(-90, 180)).toBeNull();
    expect(validateCoords(91, 30)).toBe("Некоректні координати");
    expect(validateCoords(50, -181)).toBe("Некоректні координати");
    expect(validateCoords(Number.NaN, 30)).toBe("Некоректні координати");
  });
});
