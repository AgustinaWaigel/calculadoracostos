import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf usa APIs de Node: lo dejamos fuera del bundle del servidor.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
