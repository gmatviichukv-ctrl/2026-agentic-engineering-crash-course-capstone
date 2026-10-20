import rentals from "@/data/rentals.json";
import { checkAvailability, validateBooking } from "@/lib/rental";
import type { Booking, BookingRequest, Equipment, RentalBike } from "@/lib/types";
import { readBookings, writeBookings } from "@/server/bookings-store";

const bikes = rentals.bikes as RentalBike[];
const equipment = rentals.equipment as Equipment[];

function parse(body: unknown): BookingRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const ids = b.equipmentIds ?? [];
  if (typeof b.bikeId !== "string" || typeof b.from !== "string" || typeof b.to !== "string") return null;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) return null;
  return { bikeId: b.bikeId, from: b.from, to: b.to, equipmentIds: ids };
}

export async function POST(request: Request) {
  const req = parse(await request.json().catch(() => null));
  if (!req) return Response.json({ errors: ["Некоректний запит"] }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const invalid = validateBooking(req, { bikes, equipment, today });
  if (invalid.length) return Response.json({ errors: invalid }, { status: 400 });

  const existing = await readBookings();
  const busy = checkAvailability(req, { equipment, bookings: existing });
  if (busy.length) return Response.json({ errors: busy }, { status: 409 });

  const booking: Booking = { ...req, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await writeBookings([...existing, booking]);
  return Response.json({ booking }, { status: 201 });
}
