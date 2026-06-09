"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import OfferBanner from "@/components/OfferBanner";
import SearchBar from "@/components/SearchBar";
import SizeFilter from "@/components/SizeFilter";
import ProductCard from "@/components/ProductCard";
import SizeModal from "@/components/SizeModal";
import CartButton from "@/components/CartButton";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/lib/cart";
import { DEFAULT_SETTINGS, fetchActiveProducts, fetchSettings } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product, Settings } from "@/lib/types";

export default function HomePage() {
  const { addItem } = useCart();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    let active = true;
    (async () => {
      const [s, p] = await Promise.all([fetchSettings(), fetchActiveProducts()]);
      if (!active) return;
      setSettings(s);
      setProducts(p);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Talles disponibles (unión de talles con stock en productos activos)
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const s of p.sizes || []) {
        if (s.stock > 0) set.add(s.size);
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesTerm =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term);
      const matchesSize =
        !sizeFilter ||
        (p.sizes || []).some((s) => s.size === sizeFilter && s.stock > 0);
      return matchesTerm && matchesSize;
    });
  }, [products, search, sizeFilter]);

  return (
    <main className="min-h-screen pb-24">
      <div className="sticky top-0 z-30 shadow-sm">
        <Header name={settings.store_name} subtitle={settings.store_subtitle} />
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
            <SearchBar value={search} onChange={setSearch} />
            <SizeFilter sizes={availableSizes} selected={sizeFilter} onSelect={setSizeFilter} />
          </div>
        </div>
      </div>

      <OfferBanner show={settings.show_offer_banner} text={settings.offer_banner_text} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!configured ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-700">Falta conectar Supabase</p>
            <p className="mt-1">
              Copiá <code>.env.local.example</code> a <code>.env.local</code>, completá
              <code> NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, y reiniciá el servidor.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-lg border border-line bg-white"
              >
                <div className="aspect-square w-full bg-neutral-100" />
                <div className="space-y-2 p-3.5">
                  <div className="h-2.5 w-1/3 rounded bg-neutral-100" />
                  <div className="h-3 w-2/3 rounded bg-neutral-100" />
                  <div className="h-4 w-1/2 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-white py-16 text-center text-sm text-neutral-500">
            {products.length === 0
              ? "Todavía no hay productos cargados."
              : "No se encontraron modelos con ese filtro."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                currencySymbol={settings.currency_symbol}
                onOpen={setModalProduct}
              />
            ))}
          </div>
        )}
      </div>

      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} settings={settings} />

      {modalProduct && (
        <SizeModal
          product={modalProduct}
          currencySymbol={settings.currency_symbol}
          onClose={() => setModalProduct(null)}
          onAdd={(items) => {
            items.forEach(addItem);
            setCartOpen(true);
          }}
        />
      )}

      <footer className="mt-8 border-t border-line bg-white py-7 text-center">
        <p className="font-brand text-sm font-700 uppercase tracking-[0.26em] text-ink">
          {settings.store_name}
        </p>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-neutral-400">
          Catálogo mayorista · Pedidos por WhatsApp
        </p>
      </footer>
    </main>
  );
}
