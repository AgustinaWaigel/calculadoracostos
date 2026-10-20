import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";
import { getDolarRates } from "@/lib/dolar";
import { getBusiness } from "@/server/costing";

// Todo sale de la base de datos: nada se prerenderiza en el build.
export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Calculadora de Costos", template: "%s · Calculadora de Costos" },
  description: "Calculá costos de producción y precios de venta para tu emprendimiento.",
  applicationName: "Calculadora de Costos",
  appleWebApp: { capable: true, title: "Costos", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [rates, business] = await Promise.all([getDolarRates(), getBusiness()]);
  return (
    <html lang="es-AR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers rates={rates}>
          <AppShell businessName={business.name}>{children}</AppShell>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
