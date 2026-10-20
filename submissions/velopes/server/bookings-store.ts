// File-backed booking store for local use (spec: `.data/bookings.json`, not in git).
// The store path is a runtime value (BOOKINGS_FILE), so fs calls carry turbopackIgnore — otherwise
// `next build` traces the whole project into the server output (found in v2 build log).
// Not a database: fine for a single local server process, not for serverless or multi-instance deploys.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Booking } from "@/lib/types";

const file = () => process.env.BOOKINGS_FILE ?? join(process.cwd(), ".data", "bookings.json");

async function readBookings(): Promise<Booking[]> {
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ file(), "utf8")) as Booking[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

/** Atomic write: a crash mid-write leaves the old file intact (review finding #1). */
async function writeBookings(bookings: Booking[]): Promise<void> {
  const target = file();
  await mkdir(/*turbopackIgnore: true*/ dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(bookings, null, 2));
  await rename(/*turbopackIgnore: true*/ tmp, target);
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs read → decide → write as ONE critical section, so two simultaneous requests cannot both
 * pass the availability check on the same snapshot (review finding #1).
 * `decide` returns the bookings to persist, or null to leave the store unchanged.
 */
export function withBookings<T>(decide: (current: Booking[]) => { next: Booking[] | null; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const { next, result } = decide(await readBookings());
    if (next) await writeBookings(next);
    return result;
  });
  queue = run.catch(() => undefined); // a failed request must not block the queue forever
  return run;
}
