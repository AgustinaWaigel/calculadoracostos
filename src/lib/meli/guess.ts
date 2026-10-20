/**
 * Intenta adivinar cuántas unidades trae una publicación a partir del título:
 * "Pouch A4 X 100 Unidades" → 100, "Resma A4 500 hojas" → 500, "Pack x50" → 50.
 * Devuelve null si no hay un número claro.
 */
export function guessPackQuantity(title: string): number | null {
  const t = title.toLowerCase();
  const patterns = [
    /\bx\s?(\d{1,5})\b/, // x100, x 100
    /\b(\d{1,5})\s?(?:u\b|un\b|uds?\b|unid|unidades|hojas|pouch|pouches|sobres|piezas|pcs|pack)/, // 100 unidades
    /\bpack\s(?:de\s)?(\d{1,5})\b/, // pack de 50
    /\bpor\s(\d{1,5})\b/, // por 100
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n > 1 && n <= 100000) return n;
    }
  }
  return null;
}
