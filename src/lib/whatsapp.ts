import type { CartItem, Settings } from "./types";
import { formatPrice } from "./format";

// Deja solo dígitos (wa.me requiere número internacional sin signos)
export function sanitizeWhatsapp(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
}

export function totalPairs(items: CartItem[]): number {
  return items.reduce((acc, it) => acc + it.qty, 0);
}

// Arma el texto del pedido y devuelve el link wa.me listo para abrir
export function buildWhatsappLink(items: CartItem[], settings: Settings | null): string {
  const number = sanitizeWhatsapp(
    settings?.whatsapp_number || process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP || ""
  );
  const symbol = settings?.currency_symbol || "$";
  const storeName = settings?.store_name || "John Foos CBA";

  const lines: string[] = [];
  lines.push(`¡Hola ${storeName}! 👟 Quiero hacer este pedido:`);
  lines.push("");

  for (const it of items) {
    const sub = formatPrice(it.unitPrice * it.qty, symbol);
    lines.push(
      `• ${it.name} (Cod. ${it.code}) — Talle ${it.size} x${it.qty} = ${sub}`
    );
  }

  lines.push("");
  lines.push(`*Total: ${formatPrice(cartTotal(items), symbol)}* (${totalPairs(items)} pares)`);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${number}?text=${text}`;
}
