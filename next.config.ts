import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf usa APIs de Node: lo dejamos fuera del bundle del servidor.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Las fuentes del PDF se leen del disco: que viajen con la función en Vercel. pdfkit carga
  // las estándar (Helvetica, etc.) con un require dinámico que el rastreo no detecta solo.
  outputFileTracingIncludes: {
    "/api/presupuestos/[id]/pdf": ["./src/assets/fonts/**", "./node_modules/pdfkit/js/standard-fonts/**"],
  },
};

export default nextConfig;
