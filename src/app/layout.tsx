import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Score Weddings",
  description: "Calculadora de Score para Casamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">
        <StoreProvider>
          <Navigation />
          <main className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
