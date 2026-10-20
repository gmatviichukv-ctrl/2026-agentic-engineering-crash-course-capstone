import type { Listing } from "@/lib/types";

export const eur = (n: number) => `${n.toLocaleString("uk-UA", { maximumFractionDigits: 2 })} €`;

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return <p className="text-neutral-500">Нічого не знайдено. Спробуйте змінити фільтри.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <li key={l.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{l.title}</h3>
            <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">{eur(l.priceEur)}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{l.description}</p>
          <p className="mt-3 text-xs text-neutral-500">
            {l.kind === "bike" ? "Велосипед" : "Запчастина"} · {l.city} · {l.condition}
            {l.frameSize ? ` · рама ${l.frameSize}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
