"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { effectivePrice } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { deleteProduct, updateProduct } from "@/lib/admin";

export default function ProductTable({
  products,
  currencySymbol,
  onEdit,
  onChanged,
}: {
  products: Product[];
  currencySymbol: string;
  onEdit: (p: Product) => void;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(p: Product, patch: Partial<Product>) {
    setBusyId(p.id);
    try {
      await updateProduct(p.id, patch as any);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(p.id);
    try {
      await deleteProduct(p.id);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg bg-white p-10 text-center text-neutral-400 shadow-sm">
        Todavía no hay productos. Tocá <span className="font-700">“Nuevo producto”</span>.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="hidden grid-cols-[64px_1fr_120px_120px_160px] gap-3 border-b border-neutral-200 px-4 py-3 text-xs font-600 uppercase tracking-wide text-neutral-400 md:grid">
        <span>Foto</span>
        <span>Modelo</span>
        <span>Precio</span>
        <span>Stock</span>
        <span className="text-right">Acciones</span>
      </div>

      <ul className="divide-y divide-neutral-100">
        {products.map((p) => {
          const totalStock = (p.sizes || []).reduce((a, s) => a + s.stock, 0);
          const busy = busyId === p.id;
          return (
            <li
              key={p.id}
              className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[64px_1fr_120px_120px_160px] md:items-center"
            >
              <div className="h-14 w-14 overflow-hidden border border-neutral-200 bg-[#d9d9d9]">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-neutral-400">{p.code}</p>
                <p className="truncate text-sm font-700 uppercase">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge on={p.is_active} onLabel="Activo" offLabel="Oculto" />
                  {p.is_offer && (
                    <span className="rounded bg-offer px-1.5 py-0.5 text-[10px] font-700 uppercase text-white">
                      Oferta
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <span className="font-700">
                  {formatPrice(effectivePrice(p), currencySymbol)}
                </span>
                {p.is_offer && p.offer_price != null && (
                  <span className="ml-1 text-xs text-neutral-400 line-through">
                    {formatPrice(p.price, currencySymbol)}
                  </span>
                )}
              </div>

              <div className="text-sm text-neutral-600">
                {totalStock} pares
                <span className="block text-xs text-neutral-400">
                  {(p.sizes || []).filter((s) => s.stock > 0).length} talles
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(p, { is_active: !p.is_active })}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {p.is_active ? "Ocultar" : "Mostrar"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(p, { is_offer: !p.is_offer })}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {p.is_offer ? "Sin oferta" : "Oferta"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onEdit(p)}
                  className="rounded bg-ink px-3 py-1 text-xs font-600 text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(p)}
                  className="rounded border border-offer px-2 py-1 text-xs font-600 text-offer hover:bg-offer hover:text-white disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Badge({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={
        "rounded px-1.5 py-0.5 text-[10px] font-700 uppercase " +
        (on ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500")
      }
    >
      {on ? onLabel : offLabel}
    </span>
  );
}
