import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "MacroPulse Alpha | Quantitative Macro Nowcasting & Intelligence",
  description: "Cross-Asset Quantitative Macro Terminal: Nowcasting Quads, GEX Microstructure, Risk Ranges & Systematic Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b12] text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300 flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}

