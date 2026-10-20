import { buildPlacesRequest, FIELD_MASK, parsePlaces, validateCoords } from "@/lib/places";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const TIMEOUT_MS = 5000;

const fail = (status: number, message: string) => Response.json({ errors: [message] }, { status });

/** GET /api/shops?lat=…&lng=… — real bike-rental shops nearby from Google Places (spec F6). */
export async function GET(request: Request) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return fail(503, "Пошук прокатів вимкнено: не задано ключ Google");

  const params = new URL(request.url).searchParams;
  const raw = [params.get("lat"), params.get("lng")];
  const [lat, lng] = raw.map((v) => (v === null || v.trim() === "" ? Number.NaN : Number(v)));
  if (validateCoords(lat!, lng!)) return fail(400, "Некоректні координати");
  const origin = { lat: lat!, lng: lng! };

  let res: Response;
  try {
    res = await fetch(PLACES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
      body: JSON.stringify(buildPlacesRequest(origin)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return fail(502, "Google Maps не відповідає. Спробуйте пізніше.");
  }
  // Never forward Google's error body: it can echo request details.
  if (!res.ok) return fail(502, "Google Maps повернув помилку. Спробуйте пізніше.");

  const json = await res.json().catch(() => null);
  return Response.json({ shops: parsePlaces(json, origin) });
}
