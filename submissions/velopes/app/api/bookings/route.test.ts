// @vitest-environment node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { POST } from "./route";

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const post = (body: unknown) =>
  POST(new Request("http://x/api/bookings", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

beforeEach(() => {
  process.env.BOOKINGS_FILE = join(mkdtempSync(join(tmpdir(), "velopes-")), "bookings.json");
});

describe("F5: POST /api/bookings", () => {
  const valid = { bikeId: "r-trek", equipmentIds: ["e-trailer"], from: day(3), to: day(5) };

  test("F5: valid booking → 201 and it is stored", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    const { booking } = await res.json();
    expect(booking).toMatchObject(valid);
    expect(booking.id).toBeTypeOf("string");
  });

  test("F5: same bike on overlapping days → 409 with a Ukrainian message", async () => {
    expect((await post(valid)).status).toBe(201);
    const res = await post({ ...valid, equipmentIds: [], from: day(5), to: day(6) });
    expect(res.status).toBe(409);
    expect((await res.json()).errors).toEqual(["Велосипед уже заброньовано на ці дати"]);
  });

  test("F5: last trailer taken → 409 for a different bike on the same days", async () => {
    // e-trailer has quantity 2 in data/rentals.json
    expect((await post({ ...valid, bikeId: "r-trek" })).status).toBe(201);
    expect((await post({ ...valid, bikeId: "r-ebike" })).status).toBe(201);
    // Only 2 hitch bikes exist, so the bike is busy too — assert BOTH reasons, otherwise the 409
    // could come from the bike alone and the trailer rule would be untested (caught in self-review).
    const third = await post({ bikeId: "r-ebike", equipmentIds: ["e-trailer"], from: day(4), to: day(4) });
    expect(third.status).toBe(409);
    expect((await third.json()).errors).toEqual([
      "Велосипед уже заброньовано на ці дати",
      "«Причіп для собаки (до 30 кг)» недоступне на ці дати",
    ]);
  });

  test("F4/F5: two simultaneous requests for the same bike → exactly one wins", async () => {
    const statuses = (await Promise.all([post(valid), post(valid)])).map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
  });

  test("F5: trailer on a bike without a hitch → 400", async () => {
    const res = await post({ ...valid, bikeId: "r-city" });
    expect(res.status).toBe(400);
    expect((await res.json()).errors.join(" ")).toMatch(/фаркоп/);
  });

  test("F5: malformed JSON or wrong shape → 400, not 500", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ bikeId: 1 })).status).toBe(400);
    expect((await post({ ...valid, equipmentIds: "e-trailer" })).status).toBe(400);
  });
});
