import type { Booking, BookingRequest, Equipment, Quote, RentalBike } from "./types";

const MS_PER_DAY = 86_400_000;
const MAX_DAYS = 30;
const DISCOUNT_FROM_DAYS = 7;

/** Parses a strict YYYY-MM-DD string to a UTC day number; null if malformed or not a real date. */
function dayNumber(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return ms / MS_PER_DAY;
}

const toCents = (eur: number) => Math.round(eur * 100);

/** Number of calendar days, both ends inclusive. Expects valid dates. */
export function countDays(from: string, to: string): number {
  const a = dayNumber(from);
  const b = dayNumber(to);
  if (a === null || b === null) throw new Error(`Invalid date range: ${from} – ${to}`);
  return b - a + 1;
}

export function quotePrice(input: { bike: RentalBike; equipment: Equipment[]; from: string; to: string }): Quote {
  const days = countDays(input.from, input.to);
  const perDayCents =
    toCents(input.bike.pricePerDayEur) + input.equipment.reduce((sum, e) => sum + toCents(e.pricePerDayEur), 0);
  const subtotalCents = perDayCents * days;
  const discountCents = days >= DISCOUNT_FROM_DAYS ? Math.round(subtotalCents / 10) : 0;
  return { days, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

export function validateBooking(
  req: BookingRequest,
  ctx: { bikes: RentalBike[]; equipment: Equipment[]; today: string },
): string[] {
  const errors: string[] = [];

  const from = dayNumber(req.from);
  const to = dayNumber(req.to);
  if (from === null || to === null) {
    errors.push("Невірний формат дати, очікується РРРР-ММ-ДД");
  } else {
    if (to < from) errors.push("Дата завершення не може бути раніше дати початку");
    else if (to - from + 1 > MAX_DAYS) errors.push(`Максимальний термін оренди — ${MAX_DAYS} днів`);
    const today = dayNumber(ctx.today);
    if (today !== null && from < today) errors.push("Дата початку не може бути в минулому");
  }

  const bike = ctx.bikes.find((b) => b.id === req.bikeId);
  if (!bike) errors.push("Велосипед не знайдено");

  const seen = new Set<string>();
  for (const id of req.equipmentIds) {
    if (seen.has(id)) {
      errors.push("Одне й те саме екіпірування не можна додати двічі");
      continue;
    }
    seen.add(id);
    const item = ctx.equipment.find((e) => e.id === id);
    if (!item) errors.push(`Екіпірування «${id}» не знайдено`);
    else if (item.requiresHitch && bike && !bike.trailerHitch) {
      errors.push(`«${item.title}» можна лише з велосипедом, що має фаркоп`);
    }
  }

  return errors;
}

/** Two inclusive day intervals overlap when they share at least one day. */
export function overlaps(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
  return a.from <= b.to && b.from <= a.to;
}

export function checkAvailability(
  req: BookingRequest,
  ctx: { equipment: Equipment[]; bookings: Booking[] },
): string[] {
  const errors: string[] = [];
  const clashing = ctx.bookings.filter((bk) => overlaps(req, bk));

  if (clashing.some((bk) => bk.bikeId === req.bikeId)) {
    errors.push("Велосипед уже заброньовано на ці дати");
  }

  for (const id of new Set(req.equipmentIds)) {
    const item = ctx.equipment.find((e) => e.id === id);
    if (!item) continue;
    const used = clashing.filter((bk) => bk.equipmentIds.includes(id)).length;
    if (used >= item.quantity) errors.push(`«${item.title}» недоступне на ці дати`);
  }

  return errors;
}
