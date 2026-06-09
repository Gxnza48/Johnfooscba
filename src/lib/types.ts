// ----- Tipos de dominio compartidos por front y admin -----

export interface ProductSize {
  id: string;
  product_id: string;
  size: string; // talle, ej "39"
  stock: number; // pares disponibles
}

export interface Product {
  id: string;
  code: string; // código/SKU, ej "1761913"
  name: string; // ej "176 MEET 21 BLACK"
  price: number; // precio regular
  offer_price: number | null; // precio de oferta (cuando is_offer)
  is_offer: boolean;
  is_active: boolean;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sizes?: ProductSize[];
}

export interface Settings {
  id: number;
  store_name: string;
  store_subtitle: string;
  whatsapp_number: string; // solo dígitos, ej "549351009990"
  show_offer_banner: boolean;
  offer_banner_text: string;
  currency_symbol: string;
  updated_at: string;
}

// Item del carrito (un talle puntual de un producto)
export interface CartItem {
  productId: string;
  code: string;
  name: string;
  size: string;
  unitPrice: number; // precio efectivo (oferta si aplica)
  qty: number;
  stock?: number; // pares disponibles de ese talle (tope para sumar)
  imageUrl: string | null;
}

// Precio efectivo de un producto (considera oferta)
export function effectivePrice(p: Pick<Product, "price" | "offer_price" | "is_offer">): number {
  if (p.is_offer && p.offer_price != null && p.offer_price > 0) return p.offer_price;
  return p.price;
}

// ¿Mostrar precio tachado?
export function hasDiscount(p: Pick<Product, "price" | "offer_price" | "is_offer">): boolean {
  return p.is_offer && p.offer_price != null && p.offer_price > 0 && p.offer_price < p.price;
}
