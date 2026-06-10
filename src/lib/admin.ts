"use client";

import { getSupabaseBrowser } from "./supabase/client";
import type { Product, ProductSize, Settings } from "./types";

export const IMAGE_BUCKET = "product-images";

// ---------- Auth ----------
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Cambia la contraseña del admin logueado.
// Verifica la contraseña actual reautenticando antes de aplicar la nueva.
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = getSupabaseBrowser();

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) throw new Error("No hay una sesión activa. Volvé a iniciar sesión.");

  // Reautenticar con la contraseña actual (valida que sea correcta)
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInErr) {
    throw new Error("La contraseña actual es incorrecta.");
  }

  // Aplicar la nueva contraseña
  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updateErr) throw updateErr;
}

// ---------- Settings ----------
export async function saveSettings(patch: Partial<Settings>) {
  const supabase = getSupabaseBrowser();
  const payload = { ...patch, id: 1, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
}

// ---------- Productos ----------
export interface ProductInput {
  code: string;
  name: string;
  price: number;
  offer_price: number | null;
  is_offer: boolean;
  is_active: boolean;
  image_url: string | null;
  sort_order: number;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Talles ----------
// Reemplaza por completo los talles de un producto.
export async function replaceSizes(
  productId: string,
  sizes: { size: string; stock: number }[]
) {
  const supabase = getSupabaseBrowser();
  // Borra los existentes y vuelve a insertar (admin simple)
  const { error: delErr } = await supabase
    .from("product_sizes")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;

  const clean = sizes
    .map((s) => ({
      product_id: productId,
      size: s.size.trim(),
      stock: Math.max(0, Math.round(s.stock || 0)),
    }))
    .filter((s) => s.size.length > 0);

  if (clean.length === 0) return [] as ProductSize[];

  const { data, error } = await supabase
    .from("product_sizes")
    .insert(clean)
    .select();
  if (error) throw error;
  return data as ProductSize[];
}

// ---------- Imágenes (Storage) ----------
// Recibe un Blob (ya recortado a cuadrado por el admin) y lo sube como JPEG.
export async function uploadProductImage(file: Blob, ext = "jpg"): Promise<string> {
  const supabase = getSupabaseBrowser();
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `products/${safe}`;

  const contentType = file.type || "image/jpeg";
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType });
  if (error) throw error;

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
