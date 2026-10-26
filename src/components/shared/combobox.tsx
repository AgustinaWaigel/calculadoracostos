"use client";

import { useRef, useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  /** Para los filtros de arriba (por ejemplo, material o servicio). */
  group?: string;
}

/** Selector con búsqueda (para listas largas de insumos). */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Elegí una opción",
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados",
  className,
  ariaLabel,
  filters,
  footer,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  ariaLabel?: string;
  /** Filtros rápidos por `group`; "Todos" se agrega solo. */
  filters?: { value: string; label: string }[];
  /** Acciones al pie (por ejemplo, crear lo que no se encontró). Recibe lo buscado y cómo cerrar. */
  footer?: (search: string, close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value);
  const visible = group ? options.filter((o) => o.group === group) : options;
  const close = () => setOpen(false);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          title={selected?.label}
          className={cn(
            "h-auto min-h-9 w-full justify-between py-1.5 text-left font-normal whitespace-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 wrap-break-word">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-w-[calc(100vw-2rem)] min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput ref={searchRef} placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          {filters && (
            <div className="flex gap-1 border-b p-1.5" role="radiogroup" aria-label="Filtrar">
              {[{ value: null, label: "Todos" }, ...filters].map((f) => (
                <button
                  key={f.label}
                  type="button"
                  role="radio"
                  aria-checked={group === f.value}
                  onClick={() => {
                    setGroup(f.value);
                    searchRef.current?.focus(); // que se pueda seguir escribiendo
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150",
                    group === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {visible.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  disabled={o.disabled}
                  onSelect={() => {
                    onChange(o.value);
                    close();
                  }}
                >
                  <CheckIcon className={cn(o.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 wrap-break-word">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{o.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {footer && <div className="grid gap-0.5 border-t p-1">{footer(search.trim(), close)}</div>}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
