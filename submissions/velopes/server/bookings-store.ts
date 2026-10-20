// File-backed booking store for local use (spec: `.data/bookings.json`, not in git).
// Not a database: fine for a single local server, not for serverless deploys.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Booking } from "@/lib/types";

const file = () => process.env.BOOKINGS_FILE ?? join(process.cwd(), ".data", "bookings.json");

export async function readBookings(): Promise<Booking[]> {
  try {
    return JSON.parse(await readFile(file(), "utf8")) as Booking[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

export async function writeBookings(bookings: Booking[]): Promise<void> {
  await mkdir(dirname(file()), { recursive: true });
  await writeFile(file(), JSON.stringify(bookings, null, 2));
}
