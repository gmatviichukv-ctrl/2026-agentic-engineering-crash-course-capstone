import { ValidationError, type Listing, type SearchQuery } from "./types";

export function searchListings(listings: Listing[], query: SearchQuery): Listing[] {
  const { kind, city, frameSize, minPrice, maxPrice, sort = "newest" } = query;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ValidationError("Мінімальна ціна не може бути більшою за максимальну");
  }

  const words = (query.text ?? "").toLowerCase().split(/\s+/).filter(Boolean);

  const result = listings.filter((l) => {
    if (kind && l.kind !== kind) return false;
    if (city && l.city !== city) return false;
    if (frameSize && l.frameSize !== frameSize) return false;
    if (minPrice !== undefined && l.priceEur < minPrice) return false;
    if (maxPrice !== undefined && l.priceEur > maxPrice) return false;
    const haystack = `${l.title} ${l.description}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });

  if (sort === "price-asc") return result.sort((a, b) => a.priceEur - b.priceEur);
  if (sort === "price-desc") return result.sort((a, b) => b.priceEur - a.priceEur);
  return result.sort((a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : 0));
}
