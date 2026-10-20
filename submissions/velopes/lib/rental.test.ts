import { describe, expect, test } from "vitest";
import { checkAvailability, countDays, overlaps, quotePrice, validateBooking } from "./rental";
import type { Booking, Equipment, RentalBike } from "./types";

const city: RentalBike = { id: "city", title: "Міський", city: "Київ", pricePerDayEur: 12, trailerHitch: false };
const trek: RentalBike = { id: "trek", title: "Trek з фаркопом", city: "Київ", pricePerDayEur: 18.5, trailerHitch: true };
const trailer: Equipment = { id: "trailer", title: "Причіп для собаки", pricePerDayEur: 8, quantity: 1, requiresHitch: true };
const basket: Equipment = { id: "basket", title: "Кошик для собаки", pricePerDayEur: 3.3, quantity: 2, requiresHitch: false };
const leash: Equipment = { id: "leash", title: "Кріплення для повідця", pricePerDayEur: 2, quantity: 5, requiresHitch: false };

const ctx = { bikes: [city, trek], equipment: [trailer, basket, leash], today: "2026-11-01" };
const b = (over: Partial<Booking> & { id: string }): Booking => ({
  bikeId: "trek",
  equipmentIds: [],
  from: "2026-11-10",
  to: "2026-11-12",
  createdAt: "2026-10-20",
  ...over,
});

describe("F2: price", () => {
  test("F2: both dates are inclusive", () => {
    expect(countDays("2026-11-01", "2026-11-03")).toBe(3);
    expect(countDays("2026-11-01", "2026-11-01")).toBe(1);
    expect(countDays("2026-10-31", "2026-11-01")).toBe(2); // across a month
    expect(countDays("2027-03-27", "2027-03-29")).toBe(3); // across a DST switch
  });

  test("F2: bike + equipment per day × days, in cents", () => {
    expect(quotePrice({ bike: trek, equipment: [trailer], from: "2026-11-10", to: "2026-11-12" })).toEqual({
      days: 3,
      subtotalCents: 7950,
      discountCents: 0,
      totalCents: 7950,
    });
  });

  test("F2: no float drift on fractional prices", () => {
    // 3.30 × 3 = 9.90 exactly, not 9.899999…
    expect(quotePrice({ bike: city, equipment: [basket], from: "2026-11-10", to: "2026-11-12" }).subtotalCents).toBe(4590);
  });

  test("F2: 7+ days get 10 % off the whole total; 6 days do not", () => {
    const six = quotePrice({ bike: city, equipment: [], from: "2026-11-10", to: "2026-11-15" });
    expect(six).toMatchObject({ days: 6, discountCents: 0, totalCents: 7200 });
    const seven = quotePrice({ bike: city, equipment: [leash], from: "2026-11-10", to: "2026-11-16" });
    expect(seven).toEqual({ days: 7, subtotalCents: 9800, discountCents: 980, totalCents: 8820 });
  });

  test("F2: discount is rounded to whole cents first, total = subtotal − discount", () => {
    const odd: RentalBike = { ...city, pricePerDayEur: 4.65 }; // 4.65 × 7 = 32.55 → 10 % = 3.255
    expect(quotePrice({ bike: odd, equipment: [], from: "2026-11-10", to: "2026-11-16" })).toEqual({
      days: 7,
      subtotalCents: 3255,
      discountCents: 326, // half-cent rounds up in the customer's favour
      totalCents: 2929,
    });
  });
});

describe("F3: validation", () => {
  const ok = { bikeId: "trek", equipmentIds: ["trailer"], from: "2026-11-02", to: "2026-11-04" };

  test("F3: a valid request has no errors", () => {
    expect(validateBooking(ok, ctx)).toEqual([]);
  });

  test("F3: today is allowed, yesterday is not", () => {
    expect(validateBooking({ ...ok, from: "2026-11-01" }, ctx)).toEqual([]);
    expect(validateBooking({ ...ok, from: "2026-10-31" }, ctx)).toEqual(["Дата початку не може бути в минулому"]);
  });

  test("F3: end before start is rejected", () => {
    expect(validateBooking({ ...ok, from: "2026-11-05", to: "2026-11-04" }, ctx)).toEqual(["Дата завершення не може бути раніше дати початку"]);
  });

  test("F3: 30 days is the maximum", () => {
    expect(validateBooking({ ...ok, from: "2026-11-02", to: "2026-12-01" }, ctx)).toEqual([]);
    expect(validateBooking({ ...ok, from: "2026-11-02", to: "2026-12-02" }, ctx)).toEqual(["Максимальний термін оренди — 30 днів"]);
  });

  test("F3: trailer only on a bike with a hitch", () => {
    const errs = validateBooking({ ...ok, bikeId: "city" }, ctx);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/фаркоп/i);
  });

  test("F3: unknown bike or equipment and duplicates are rejected", () => {
    expect(validateBooking({ ...ok, bikeId: "nope" }, ctx)).toEqual(["Велосипед не знайдено"]);
    expect(validateBooking({ ...ok, equipmentIds: ["nope"] }, ctx)).toEqual(["Екіпірування «nope» не знайдено"]);
    expect(validateBooking({ ...ok, equipmentIds: ["leash", "leash"] }, ctx)).toEqual(["Одне й те саме екіпірування не можна додати двічі"]);
  });

  test("F3: malformed dates are rejected, not crashing", () => {
    expect(validateBooking({ ...ok, from: "завтра" }, ctx)).toEqual(["Невірний формат дати, очікується РРРР-ММ-ДД"]);
    expect(validateBooking({ ...ok, to: "2026-02-30" }, ctx)).toEqual(["Невірний формат дати, очікується РРРР-ММ-ДД"]);
  });
});

describe("F4: availability", () => {
  test("F4: overlap is inclusive on both ends", () => {
    const a = { from: "2026-11-10", to: "2026-11-12" };
    expect(overlaps(a, { from: "2026-11-12", to: "2026-11-14" })).toBe(true);
    expect(overlaps(a, { from: "2026-11-13", to: "2026-11-14" })).toBe(false);
    expect(overlaps(a, { from: "2026-11-01", to: "2026-11-30" })).toBe(true);
  });

  test("F4: a bike booked on overlapping days is unavailable", () => {
    const bookings = [b({ id: "1" })];
    expect(checkAvailability({ bikeId: "trek", equipmentIds: [], from: "2026-11-12", to: "2026-11-13" }, { equipment: ctx.equipment, bookings })).toEqual(["Велосипед уже заброньовано на ці дати"]);
    expect(checkAvailability({ bikeId: "trek", equipmentIds: [], from: "2026-11-13", to: "2026-11-13" }, { equipment: ctx.equipment, bookings })).toEqual([]);
    expect(checkAvailability({ bikeId: "city", equipmentIds: [], from: "2026-11-10", to: "2026-11-10" }, { equipment: ctx.equipment, bookings })).toEqual([]);
  });

  test("F4: equipment is available while overlapping bookings < quantity", () => {
    const one = [b({ id: "1", bikeId: "city", equipmentIds: ["basket"] })];
    const two = [...one, b({ id: "2", bikeId: "x", equipmentIds: ["basket"] })];
    const req = { bikeId: "trek", equipmentIds: ["basket"], from: "2026-11-11", to: "2026-11-11" };
    expect(checkAvailability(req, { equipment: ctx.equipment, bookings: one })).toEqual([]);
    expect(checkAvailability(req, { equipment: ctx.equipment, bookings: two })).toEqual(["«Кошик для собаки» недоступне на ці дати"]);
  });
});
