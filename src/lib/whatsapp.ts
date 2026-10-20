/**
 * Normaliza un celular argentino al formato que espera wa.me (549 + área + número).
 * "011 15-1234-5678" → "5491112345678"; "+54 9 351 555-1234" → "5493515551234".
 * Devuelve null si no parece un número válido.
 */
export function normalizeArPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9")) digits = digits.slice(1);
  if (digits.startsWith("0")) digits = digits.slice(1);
  // Quitar el "15" después del código de área (2 a 4 dígitos).
  const withoutFifteen = digits.match(/^(\d{2,4})15(\d{6,8})$/);
  if (withoutFifteen && withoutFifteen[1].length + withoutFifteen[2].length === 10) {
    digits = withoutFifteen[1] + withoutFifteen[2];
  }
  if (digits.length !== 10) return null;
  return `549${digits}`;
}

/** Link de WhatsApp con el mensaje precargado. Sin teléfono abre el selector de contactos. */
export function whatsappUrl(text: string, phone?: string | null): string {
  const normalized = phone ? normalizeArPhone(phone) : null;
  const base = normalized ? `https://wa.me/${normalized}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
