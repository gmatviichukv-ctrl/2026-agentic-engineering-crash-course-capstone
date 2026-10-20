"use client";

import { useState } from "react";
import { quotePrice, validateBooking } from "@/lib/rental";
import type { Equipment, RentalBike } from "@/lib/types";

const money = (cents: number) => `${(cents / 100).toLocaleString("uk-UA", { minimumFractionDigits: 2 })} €`;
const field = "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok"; id: string } | { kind: "error"; errors: string[] };

export function RentForm({ bikes, equipment }: { bikes: RentalBike[]; equipment: Equipment[] }) {
  // "today" is UTC on both client and API (spec F3) — so they always agree on the boundary.
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [bikeId, setBikeId] = useState(bikes[0]?.id ?? "");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [picked, setPicked] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const req = { bikeId, equipmentIds: picked, from, to };
  const errors = validateBooking(req, { bikes, equipment, today });
  const bike = bikes.find((b) => b.id === bikeId);
  const quote =
    errors.length === 0 && bike
      ? quotePrice({ bike, equipment: equipment.filter((e) => picked.includes(e.id)), from, to })
      : null;

  const toggle = (id: string) => {
    setStatus({ kind: "idle" });
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/bookings", { method: "POST", body: JSON.stringify(req) });
      const body = await res.json();
      setStatus(res.ok ? { kind: "ok", id: body.booking.id } : { kind: "error", errors: body.errors });
    } catch {
      setStatus({ kind: "error", errors: ["Сервер не відповів. Спробуйте ще раз за хвилину."] });
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <fieldset className="space-y-2">
        <legend className="font-semibold">Велосипед</legend>
        {bikes.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-sm">
            <input type="radio" name="bike" checked={bikeId === b.id} onChange={() => { setBikeId(b.id); setStatus({ kind: "idle" }); }} />
            {b.title} · {b.city} · {money(Math.round(b.pricePerDayEur * 100))}/день
            {b.trailerHitch && <span className="rounded bg-emerald-100 px-1.5 text-xs text-emerald-800">фаркоп</span>}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          З <input type="date" className={field} min={today} value={from} onChange={(e) => { setFrom(e.target.value); setStatus({ kind: "idle" }); }} />
        </label>
        <label className="text-sm">
          По <input type="date" className={field} min={from} value={to} onChange={(e) => { setTo(e.target.value); setStatus({ kind: "idle" }); }} />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="font-semibold">Для собаки</legend>
        {equipment.map((e) => (
          <label key={e.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} />
            {e.title} · {money(Math.round(e.pricePerDayEur * 100))}/день
            {e.requiresHitch && <span className="text-xs text-neutral-500">(потрібен фаркоп)</span>}
          </label>
        ))}
      </fieldset>

      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800" aria-live="polite">
        {quote ? (
          <p>
            {quote.days} дн. · {money(quote.subtotalCents)}
            {quote.discountCents > 0 && <> − знижка {money(quote.discountCents)}</>} ={" "}
            <strong>{money(quote.totalCents)}</strong>
          </p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-red-600">
            {errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
      </div>

      <button disabled={!quote || status.kind === "sending"} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-40">
        {status.kind === "sending" ? "Бронюємо…" : "Забронювати"}
      </button>

      {status.kind === "ok" && <p className="text-emerald-700">Заброньовано! Номер: {status.id.slice(0, 8)}</p>}
      {status.kind === "error" && <ul className="list-disc pl-5 text-red-600">{status.errors.map((m) => <li key={m}>{m}</li>)}</ul>}
    </form>
  );
}
