import type { FrameSize, ListingKind, SearchQuery } from "./types";

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const num = (v: string | undefined) => (v !== undefined && /^\d+(\.\d+)?$/.test(v) ? Number(v) : undefined);
const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) =>
  allowed.includes(v as T) ? (v as T) : undefined;

/** URL search params → SearchQuery. Unknown or malformed values are dropped, never thrown. */
export function parseSearchParams(p: Params): SearchQuery {
  return {
    text: one(p.q),
    kind: pick<ListingKind>(one(p.kind), ["bike", "part"]),
    city: one(p.city),
    frameSize: pick<FrameSize>(one(p.size), ["S", "M", "L", "XL"]),
    minPrice: num(one(p.min)),
    maxPrice: num(one(p.max)),
    sort: pick(one(p.sort), ["newest", "price-asc", "price-desc"] as const),
  };
}
