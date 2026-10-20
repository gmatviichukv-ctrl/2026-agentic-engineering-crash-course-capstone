// Contract types from docs/spec.md. Implementations live in rental.ts and places.ts.

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

/** A real bike-rental shop near the user, from Google Places (spec F6). */
export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  distanceKm: number;
}

/** Thrown for invalid input. Message is Ukrainian UI copy. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
