// Contract types from docs/spec.md. Implementations live in search.ts / rental.ts.

export type ListingKind = "bike" | "part";
export type FrameSize = "S" | "M" | "L" | "XL";

export interface Listing {
  id: string;
  kind: ListingKind;
  title: string;
  description: string;
  priceEur: number;
  city: string;
  condition: "як новий" | "добрий" | "задовільний";
  frameSize?: FrameSize;
  postedAt: string; // YYYY-MM-DD
}

export interface SearchQuery {
  text?: string;
  kind?: ListingKind;
  city?: string;
  frameSize?: FrameSize;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
}

export interface RentalBike {
  id: string;
  title: string;
  city: string;
  pricePerDayEur: number;
  trailerHitch: boolean;
}

export interface Equipment {
  id: string;
  title: string;
  pricePerDayEur: number;
  quantity: number;
  requiresHitch: boolean;
}

export interface BookingRequest {
  bikeId: string;
  equipmentIds: string[];
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

export interface Booking extends BookingRequest {
  id: string;
  createdAt: string;
}

export interface Quote {
  days: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

/** Thrown for invalid input (e.g. minPrice > maxPrice). Message is Ukrainian UI copy. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
