// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import fixture from "@/lib/__fixtures__/places-kyiv.json";
import { FIELD_MASK } from "@/lib/places";
import { GET } from "./route";

const get = (qs: string) => GET(new Request(`http://x/api/shops?${qs}`));
const KEY = "test-key-not-real";

beforeEach(() => {
  vi.stubEnv("GOOGLE_MAPS_API_KEY", KEY);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("F6: GET /api/shops", () => {
  test("F6: calls Google Places Text Search with key + field mask and returns nearest shops", async () => {
    const fetchMock = vi.fn(async () => Response.json(fixture));
    vi.stubGlobal("fetch", fetchMock);

    const res = await get("lat=50.4501&lng=30.5234");
    expect(res.status).toBe(200);
    expect((await res.json()).shops.map((s: { id: string }) => s.id)).toEqual(["near-shop", "far-shop"]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELD_MASK });
    expect(JSON.parse(String(init.body)).textQuery).toBe("прокат велосипедів");
  });

  test("F6: no API key → 503 and Google is never called", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await get("lat=50.45&lng=30.52");
    expect(res.status).toBe(503);
    expect((await res.json()).errors).toEqual(["Пошук прокатів вимкнено: не задано ключ Google"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("F6: bad or missing coordinates → 400", async () => {
    vi.stubGlobal("fetch", vi.fn());
    for (const qs of ["", "lat=abc&lng=30", "lat=95&lng=30", "lat=50&lng="]) {
      expect((await get(qs)).status, qs).toBe(400);
    }
  });

  test("F6: Google error → 502 without leaking the key or Google's body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`API key ${KEY} is invalid`, { status: 403 })));
    const res = await get("lat=50.45&lng=30.52");
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(KEY);
  });

  test("F6: network failure or timeout → 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("timed out", "TimeoutError"); }));
    expect((await get("lat=50.45&lng=30.52")).status).toBe(502);
  });
});
