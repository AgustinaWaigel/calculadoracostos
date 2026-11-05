import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Qué puede cargar la página. Next mete scripts inline (por eso 'unsafe-inline'); el resto, solo
// de la misma app, salvo las fotos de Mercado Libre del buscador de insumos. Imágenes data: para el logo.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.mlstatic.com",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Nadie puede meter la app en un iframe (evita que te hagan tocar botones sin ver).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // react-pdf usa APIs de Node: lo dejamos fuera del bundle del servidor.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Las fuentes del PDF se leen del disco: que viajen con la función en Vercel. pdfkit carga
  // las estándar (Helvetica, etc.) con un require dinámico que el rastreo no detecta solo.
  outputFileTracingIncludes: {
    "/api/presupuestos/[id]/pdf": ["./src/assets/fonts/**", "./node_modules/pdfkit/js/standard-fonts/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
