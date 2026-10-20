"use client";

import { useEffect } from "react";

/** Registra el service worker (PWA instalable) solo en producción. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin SW la app funciona igual; solo no es instalable/offline.
    });
  }, []);
  return null;
}
