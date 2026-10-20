import listingsData from "@/data/listings.json";
import { parseSearchParams } from "@/lib/query";
import { searchListings } from "@/lib/search";
import { ValidationError, type Listing } from "@/lib/types";
import { ListingGrid } from "./components/ListingGrid";

const listings = listingsData as Listing[];
const cities = [...new Set(listings.map((l) => l.city))].sort();

const field = "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseSearchParams(await searchParams);
  let results: Listing[] = [];
  let error: string | null = null;
  try {
    results = searchListings(listings, query);
  } catch (e) {
    if (!(e instanceof ValidationError)) throw e;
    error = e.message;
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Б/у велосипеди та запчастини</h1>
      <form className="mt-6 grid gap-3 sm:grid-cols-4" method="get">
        <input name="q" defaultValue={query.text} placeholder="Пошук: trek, сідло, shimano…" className={`${field} sm:col-span-4`} />
        <select name="kind" defaultValue={query.kind ?? ""} className={field} aria-label="Категорія">
          <option value="">Усе</option>
          <option value="bike">Велосипеди</option>
          <option value="part">Запчастини</option>
        </select>
        <select name="city" defaultValue={query.city ?? ""} className={field} aria-label="Місто">
          <option value="">Усі міста</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="size" defaultValue={query.frameSize ?? ""} className={field} aria-label="Розмір рами">
          <option value="">Будь-яка рама</option>
          {["S", "M", "L", "XL"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="sort" defaultValue={query.sort ?? "newest"} className={field} aria-label="Сортування">
          <option value="newest">Спершу нові</option>
          <option value="price-asc">Дешевші</option>
          <option value="price-desc">Дорожчі</option>
        </select>
        <input name="min" type="number" min={0} defaultValue={query.minPrice} placeholder="Ціна від, €" className={field} />
        <input name="max" type="number" min={0} defaultValue={query.maxPrice} placeholder="Ціна до, €" className={field} />
        <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">Шукати</button>
      </form>

      <section className="mt-8">
        {error ? <p className="text-red-600">{error}</p> : <ListingGrid listings={results} />}
      </section>
    </main>
  );
}
