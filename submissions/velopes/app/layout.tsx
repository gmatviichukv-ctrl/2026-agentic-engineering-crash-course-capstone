import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ВелоПес",
  description: "Б/у велосипеди, запчастини та оренда з екіпіруванням для собак",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="min-h-screen">
        <nav className="flex gap-6 border-b border-neutral-200 px-4 py-3 text-sm font-semibold sm:px-8 dark:border-neutral-800">
          <Link href="/">🚲 ВелоПес</Link>
          <Link href="/">Купити б/у</Link>
          <Link href="/rent">Оренда з собакою</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
