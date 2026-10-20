"use client";

import { useRouter } from "next/navigation";
import { DownloadIcon, EyeIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { useAction } from "@/components/shared/use-action";
import { deleteQuote, setQuoteStatus } from "@/actions/quotes";
import { QUOTE_STATUS_LABELS, quoteStatuses } from "@/lib/schemas";

export function QuoteActions({
  id,
  status,
  whatsappHref,
}: {
  id: string;
  status: (typeof quoteStatuses)[number];
  whatsappHref: string;
}) {
  const router = useRouter();
  const statusAction = useAction();

  return (
    <>
      <Select
        value={status}
        disabled={statusAction.pending}
        onValueChange={(v) => statusAction.run(() => setQuoteStatus(id, v), () => router.refresh())}
      >
        <SelectTrigger className="w-36" aria-label="Estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {quoteStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {QUOTE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button asChild variant="outline">
        <a href={`/api/presupuestos/${id}/pdf?ver`} target="_blank" rel="noreferrer">
          <EyeIcon /> Ver PDF
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`/api/presupuestos/${id}/pdf`} download>
          <DownloadIcon /> Descargar PDF
        </a>
      </Button>
      <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            if (status === "DRAFT") statusAction.run(() => setQuoteStatus(id, "SENT"), () => router.refresh());
          }}
        >
          <MessageCircleIcon /> Enviar por WhatsApp
        </a>
      </Button>
      <ConfirmDelete
        title="¿Eliminar este presupuesto?"
        onConfirm={() => deleteQuote(id)}
        onDone={() => router.push("/presupuestos")}
      />
    </>
  );
}
