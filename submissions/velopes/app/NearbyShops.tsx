"use client";

import { useState } from "react";
import type { Shop } from "@/lib/types";

const CITIES: Record<string, { lat: number; lng: number }> = {
  Київ: { lat: 50.4501, lng: 30.5234 },
  Львів: { lat: 49.8419, lng: 24.0315 },
  Одеса: { lat: 46.4825, lng: 30.7233 },
  Дніпро: { lat: 48.4647, lng: 35.0462 },
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; shops: Shop[] }
  | { kind: "error"; message: string };

const field = "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700";

export function NearbyShops() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function load(lat: number, lng: number) {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/shops?lat=${lat}&lng=${lng}`);
      const body = await res.json();
      setState(res.ok ? { kind: "done", shops: body.shops } : { kind: "error", message: body.errors?.[0] ?? "Помилка" });
    } catch {
      setState({ kind: "error", message: "Сервер не відповів. Спробуйте ще раз." });
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "Браузер не підтримує геолокацію — оберіть місто." });
      return;
    }
    setState({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => setState({ kind: "error", message: "Немає доступу до геолокації — оберіть місто." }),
      { timeout: 10_000 },
    );
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="text-xl font-bold">Прокати велосипедів поруч</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Реальні прокати з Google Maps — якщо потрібного велосипеда в нас немає.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={useMyLocation} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          📍 Моя геолокація
        </button>
        <select
          aria-label="Місто"
          className={field}
          defaultValue=""
          onChange={(e) => {
            const c = CITIES[e.target.value];
            if (c) load(c.lat, c.lng);
          }}
        >
          <option value="" disabled>
            або оберіть місто
          </option>
          {Object.keys(CITIES).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="mt-5" aria-live="polite">
        {state.kind === "loading" && <p className="text-sm text-neutral-500">Шукаємо прокати…</p>}
        {state.kind === "error" && <p className="text-sm text-red-600">{state.message}</p>}
        {state.kind === "done" && state.shops.length === 0 && (
          <p className="text-sm text-neutral-500">Поруч прокатів не знайдено.</p>
        )}
        {state.kind === "done" && state.shops.length > 0 && (
          <ul className="space-y-3">
            {state.shops.map((s) => (
              <li key={s.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className="shrink-0 text-sm text-neutral-500">{s.distanceKm.toLocaleString("uk-UA")} км</span>
                </div>
                {s.address && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{s.address}</p>}
                <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline dark:text-emerald-400">
                  Відкрити в Google Maps ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
