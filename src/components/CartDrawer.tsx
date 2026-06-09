"use client";

import { useCart } from "@/lib/cart";
import type { Settings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { buildWhatsappLink, sanitizeWhatsapp } from "@/lib/whatsapp";

function WhatsappIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.95 1.36-.5.04-.5.4-3.16-.66-2.66-1.05-4.32-3.77-4.45-3.95-.13-.18-1.06-1.4-1.06-2.67 0-1.27.67-1.9.9-2.16.24-.26.52-.32.7-.32l.5.01c.16 0 .38-.06.59.45.24.58.81 2 .88 2.14.07.14.12.31.02.49-.09.18-.14.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.28-.12.54.16.26.7 1.15 1.5 1.86 1.04.92 1.9 1.21 2.17 1.34.27.13.42.11.58-.07.16-.18.67-.78.85-1.05.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.88.27.13.45.2.51.31.07.11.07.63-.17 1.31Z" />
    </svg>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
}

export default function CartDrawer({ open, onClose, settings }: Props) {
  const { items, total, count, setQty, removeItem, clear } = useCart();
  const symbol = settings.currency_symbol || "$";
  const hasNumber = sanitizeWhatsapp(settings.whatsapp_number).length >= 8;

  function checkout() {
    if (items.length === 0) return;
    const link = buildWhatsappLink(items, settings);
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={
          "fixed inset-0 z-50 bg-black/50 transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform " +
          (open ? "translate-x-0" : "translate-x-full")
        }
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-brand text-lg font-700 uppercase tracking-widest">
            Tu pedido {count > 0 && <span className="text-neutral-400">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="text-2xl leading-none text-neutral-500 hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-neutral-400">
              Todavía no agregaste productos.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li
                  key={`${it.productId}-${it.size}`}
                  className="flex gap-3 border-b border-line pb-4"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-line bg-neutral-100">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-700 uppercase text-ink">{it.name}</p>
                    <p className="text-xs text-neutral-400">
                      Cod. {it.code} · Talle {it.size}
                    </p>
                    <p className="mt-0.5 text-sm font-600">
                      {formatPrice(it.unitPrice, symbol)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(it.productId, it.size, it.qty - 1)}
                        disabled={it.qty <= 1}
                        className="h-7 w-7 rounded border border-line text-sm font-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Restar"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{it.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(it.productId, it.size, it.qty + 1)}
                        disabled={typeof it.stock === "number" && it.qty >= it.stock}
                        className="h-7 w-7 rounded border border-line text-sm font-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Sumar"
                      >
                        +
                      </button>
                      {typeof it.stock === "number" && it.qty >= it.stock && (
                        <span className="text-[11px] text-neutral-400">
                          Máx. {it.stock}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(it.productId, it.size)}
                        className="ml-auto text-xs text-offer underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-700">
                    {formatPrice(it.unitPrice * it.qty, symbol)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-5 py-4">
          <div className="mb-3 flex items-center justify-between text-base font-700">
            <span>Total</span>
            <span>{formatPrice(total, symbol)}</span>
          </div>

          {!hasNumber && items.length > 0 && (
            <p className="mb-2 text-xs text-offer">
              ⚠ Falta configurar el número de WhatsApp en el panel de administración.
            </p>
          )}

          <button
            type="button"
            onClick={checkout}
            disabled={items.length === 0 || !hasNumber}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1faf54] py-3.5 text-sm font-700 uppercase tracking-wider text-white transition hover:bg-[#1b9c4b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <WhatsappIcon />
            Finalizar pedido por WhatsApp
          </button>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full text-center text-xs text-neutral-400 underline hover:text-neutral-600"
            >
              Vaciar carrito
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
