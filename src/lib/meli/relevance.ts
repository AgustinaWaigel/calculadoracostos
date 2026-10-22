/**
 * El catálogo de ML ordena raro ("papel obra" trae cintas de enmascarar primero), así que pedimos
 * más resultados y los ordenamos nosotros según cuántas palabras de la búsqueda tiene cada título.
 */

const UNITS: Record<string, string> = {
  g: "g", gr: "g", grs: "g", gramos: "g", gramo: "g",
  kg: "kg", kgs: "kg",
  ml: "ml", cc: "ml",
  l: "l", lt: "l", lts: "l", litro: "l", litros: "l",
  mm: "mm", cm: "cm", m: "m", mt: "m", mts: "m", metros: "m",
  u: "u", un: "u", uds: "u", unidades: "u",
};

const STOPWORDS = new Set(["de", "del", "para", "con", "en", "el", "la", "los", "las", "y", "x", "por", "un", "una"]);

const UNIT_GLUED = new RegExp(`(\\d)(${Object.keys(UNITS).join("|")})\\b`, "g");

/** Minúsculas, sin acentos y con el número separado de la unidad: "90Gr" → "90 gr". */
function clean(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(UNIT_GLUED, "$1 $2")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return clean(text)
    .split(" ")
    .filter(Boolean)
    .map((t) => UNITS[t] ?? t);
}

/** Texto que le mandamos a ML: con el número separado de la unidad encuentra mucho más. */
export function prepareQuery(query: string): string {
  return query.trim().replace(UNIT_GLUED, "$1 $2").replace(/\s+/g, " ");
}

/** Palabras que cuentan para la relevancia (sin "de", "para", etc.). */
export function searchTerms(query: string): string[] {
  return [...new Set(tokens(query).filter((t) => !STOPWORDS.has(t)))];
}

const sameWord = (a: string, b: string) => a === b || a + "s" === b || a === b + "s" || a + "es" === b;

/** Qué parte de los términos (0 a 1) aparece en el título. */
export function relevance(title: string, terms: string[]): number {
  if (terms.length === 0) return 1;
  const words = tokens(title);
  const hits = terms.filter((t) => words.some((w) => sameWord(t, w))).length;
  return hits / terms.length;
}

/**
 * Ordena por relevancia y descarta lo que no tiene que ver. Si pocos títulos tienen todas
 * las palabras, se suman los que tienen al menos la mitad.
 */
export function rankByRelevance<T>(items: T[], query: string, titleOf: (item: T) => string, minFull = 5): T[] {
  const terms = searchTerms(query);
  const scored = items.map((item, i) => ({ item, i, score: relevance(titleOf(item), terms) }));
  const full = scored.filter((s) => s.score === 1);
  const pool = full.length >= minFull ? full : scored.filter((s) => s.score >= 0.5);
  return pool.sort((a, b) => b.score - a.score || a.i - b.i).map((s) => s.item);
}
