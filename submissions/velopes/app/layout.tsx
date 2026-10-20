import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ВелоПес",
  description: "Б/у велосипеди, запчастини та оренда з екіпіруванням для собак",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
