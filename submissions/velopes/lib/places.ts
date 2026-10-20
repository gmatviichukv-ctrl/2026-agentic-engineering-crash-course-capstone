import type { Shop } from "./types";

const DEFAULT_RADIUS_M = 5000;
const MIN_RADIUS_M = 100;
const MAX_RADIUS_M = 50000;
const EARTH_RADIUS_KM = 6371;

export const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri";

interface LatLng {
  lat: number;
  lng: number;
}

export function buildPlacesRequest({ lat, lng, radiusM = DEFAULT_RADIUS_M }: LatLng & { radiusM?: number }) {
  return {
    textQuery: "прокат велосипедів",
    languageCode: "uk",
    pageSize: 10,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Number.isFinite(radiusM) ? Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, radiusM)) : DEFAULT_RADIUS_M,
      },
    },
  };
}

export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(km * 10) / 10;
}

export function validateCoords(lat: number, lng: number): string | null {
  const ok =
    typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  return ok ? null : "Некоректні координати";
}

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
}

export function parsePlaces(json: unknown, origin: LatLng): Shop[] {
  const places = (json as { places?: RawPlace[] } | null)?.places;
  if (!Array.isArray(places)) return [];
  const shops: Shop[] = [];
  places.forEach((p, i) => {
    const name = p.displayName?.text;
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (!name || typeof lat !== "number" || typeof lng !== "number") return;
    shops.push({
      id: p.id ?? `place-${i}`,
      name,
      address: p.formattedAddress ?? "",
      lat,
      lng,
      mapsUrl:
        p.googleMapsUri ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`,
      distanceKm: distanceKm(origin, { lat, lng }),
    });
  });
  return shops.sort((a, b) => a.distanceKm - b.distanceKm);
}
