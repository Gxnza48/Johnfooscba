"use client";

import { useCart } from "@/lib/cart";

function CartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2 12.2a1.5 1.5 0 0 0 1.5 1.3h9.3a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
    </svg>
  );
}

export default function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir carrito"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-card ring-1 ring-black/5 transition hover:bg-neutral-800"
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-offer px-1.5 text-xs font-700 text-white">
          {count}
        </span>
      )}
    </button>
  );
}
