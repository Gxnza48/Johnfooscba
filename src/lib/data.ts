"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";
import type { Product, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  store_name: "JOHN FOOS",
  store_subtitle: "CARRITO DE COMPRAS",
  whatsapp_number: process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP || "549351169536",
  show_offer_banner: false,
  offer_banner_text: "",
  currency_symbol: "$",
  updated_at: new Date(0).toISOString(),
};

// Settings (fila singleton id=1). Devuelve defaults si no hay config/fila.
export async function fetchSettings(): Promise<Settings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return data as Settings;
}

const PRODUCT_SELECT = "*, sizes:product_sizes(*)";

function sortProduct(p: Product): Product {
  if (p.sizes) {
    p.sizes = [...p.sizes].sort((a, b) =>
      a.size.localeCompare(b.size, "es", { numeric: true })
    );
  }
  return p;
}

// Productos activos para el catálogo público
export async function fetchActiveProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Product[]).map(sortProduct);
}

// Todos los productos (panel admin)
export async function fetchAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Product[]).map(sortProduct);
}
