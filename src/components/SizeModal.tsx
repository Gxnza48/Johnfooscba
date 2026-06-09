"use client";

import { useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/lib/types";
import { effectivePrice, hasDiscount } from "@/lib/types";
import { formatPrice } from "@/lib/format";

interface Props {
  product: Product;
  currencySymbol: string;
  onClose: () => void;
  onAdd: (items: CartItem[]) => void;
}

// Tope de stock que se muestra al cliente (oculta el número exacto cuando hay mucho).
const STOCK_CAP = 20;

function stockLabel(stock: number) {
  return stock > STOCK_CAP ? `${STOCK_CAP}+` : String(stock);
}

export default function SizeModal({ product, currencySymbol, onClose, onAdd }: Props) {
  const sizes = useMemo(
    () => (product.sizes || []).filter((s) => s.stock > 0),
    [product]
  );

  // Cantidad pedida por talle, indexada por id del talle.
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const price = effectivePrice(product);
  const discounted = hasDiscount(product);

  const totalStock = useMemo(
    () => sizes.reduce((a, s) => a + s.stock, 0),
    [sizes]
  );
  const totalOrdered = useMemo(
    () => Object.values(qtys).reduce((a, q) => a + q, 0),
    [qtys]
  );

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setQty(sizeId: string, stock: number, value: number) {
    const q = Math.max(0, Math.min(stock, value));
    setQtys((prev) => ({ ...prev, [sizeId]: q }));
  }

  const canAdd = totalOrdered > 0;

  function handleAdd() {
    const items: CartItem[] = sizes
      .filter((s) => (qtys[s.id] ?? 0) > 0)
      .map((s) => ({
        productId: product.id,
        code: product.code,
        name: product.name,
        size: s.size,
        unitPrice: price,
        qty: qtys[s.id],
        stock: s.stock,
        imageUrl: product.image_url,
      }));
    if (items.length === 0) return;
    onAdd(items);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado producto */}
        <div className="border-b border-line px-5 pb-4 pt-5 sm:px-6">
          <p className="text-xs text-neutral-400">{product.code}</p>
          <p className="text-xl font-700 uppercase leading-tight text-ink sm:text-2xl">
            {product.name}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-700 text-ink sm:text-2xl">
              {formatPrice(price, currencySymbol)}
            </span>
            <span className="text-sm text-neutral-400">por par</span>
            {discounted && (
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(product.price, currencySymbol)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {totalStock} {totalStock === 1 ? "par" : "pares"} disponibles ·{" "}
            {sizes.length} {sizes.length === 1 ? "talle" : "talles"}
          </p>
        </div>

        {/* Tabla cantidad por talle */}
        {sizes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 sm:px-6">
            Sin talles disponibles por ahora.
          </p>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <p className="text-xs font-600 uppercase tracking-widest text-neutral-500">
              Cantidad por talle
            </p>

            {/* Cabecera de columnas */}
            <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line pb-2 text-[11px] font-600 uppercase tracking-wider text-neutral-400">
              <span>Talle</span>
              <span className="text-center">Disponible</span>
              <span className="text-right pr-1">Pedido</span>
            </div>

            <div className="divide-y divide-line">
              {sizes.map((s) => {
                const qty = qtys[s.id] ?? 0;
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5"
                  >
                    <span className="text-lg font-700 text-ink">{s.size}</span>
                    <span className="min-w-[60px] text-center text-sm text-neutral-500">
                      {stockLabel(s.stock)}
                    </span>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setQty(s.id, s.stock, qty - 1)}
                        disabled={qty <= 0}
                        className="h-10 w-10 rounded-l-md border border-line text-lg font-600 text-ink transition hover:bg-neutral-50 disabled:opacity-40"
                        aria-label={`Restar talle ${s.size}`}
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={qty}
                        onChange={(e) => {
                          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                          setQty(s.id, s.stock, Number.isNaN(n) ? 0 : n);
                        }}
                        className="h-10 w-12 border-y border-line text-center text-base font-600 text-ink focus:outline-none"
                        aria-label={`Cantidad talle ${s.size}`}
                      />
                      <button
                        type="button"
                        onClick={() => setQty(s.id, s.stock, qty + 1)}
                        disabled={qty >= s.stock}
                        className="h-10 w-10 rounded-r-md border border-line text-lg font-600 text-ink transition hover:bg-neutral-50 disabled:opacity-40"
                        aria-label={`Sumar talle ${s.size}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-3 gap-3 border-t border-line px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-white py-3 text-sm font-600 uppercase tracking-wider text-ink transition hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="col-span-2 rounded-md bg-ink py-3 text-sm font-600 uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agregar al pedido
            {totalOrdered > 0 ? ` · ${totalOrdered}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
