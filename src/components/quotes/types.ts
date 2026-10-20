export interface QuoteProductOption {
  id: string;
  name: string;
  /** Precio sugerido (canal de referencia) por unidad, sin descuento por volumen. */
  price: string;
}

export interface QuoteFormValues {
  id?: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  notes: string | null;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  discountPercent: string;
  items: { productId: string | null; description: string; quantity: string; unitPrice: string }[];
}
