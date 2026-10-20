import rentals from "@/data/rentals.json";
import type { Equipment, RentalBike } from "@/lib/types";
import { NearbyShops } from "./NearbyShops";
import { RentForm } from "./RentForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Оренда велосипеда з собакою 🐕</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Оберіть велосипед, дати та екіпірування для собаки. Від 7 днів — знижка 10 %.
      </p>
      <RentForm bikes={rentals.bikes as RentalBike[]} equipment={rentals.equipment as Equipment[]} />
      <NearbyShops />
    </main>
  );
}
