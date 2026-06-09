"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/types";
import {
  createProduct,
  replaceSizes,
  updateProduct,
  uploadProductImage,
} from "@/lib/admin";
import ImageCropper from "./ImageCropper";

interface SizeRow {
  key: string;
  size: string;
  stock: string;
}

let rowSeq = 0;
function newRow(size = "", stock = ""): SizeRow {
  rowSeq += 1;
  return { key: `r${rowSeq}`, size, stock };
}

export default function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!product;

  const [code, setCode] = useState(product?.code ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [offerPrice, setOfferPrice] = useState(
    product?.offer_price != null ? String(product.offer_price) : ""
  );
  const [isOffer, setIsOffer] = useState(product?.is_offer ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(product ? String(product.sort_order) : "0");
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);

  const [sizes, setSizes] = useState<SizeRow[]>(
    product?.sizes && product.sizes.length > 0
      ? product.sizes.map((s) => newRow(s.size, String(s.stock)))
      : [newRow("35", ""), newRow("36", ""), newRow("37", "")]
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function updateRow(key: string, patch: Partial<SizeRow>) {
    setSizes((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key: string) {
    setSizes((rows) => rows.filter((r) => r.key !== key));
  }

  // Al elegir un archivo abrimos el recortador (no subimos todavía).
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCropSrc(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  // Reajustar una foto ya cargada: la traemos como blob para poder recortarla.
  async function handleRecrop() {
    if (!imageUrl) return;
    setError(null);
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      setCropSrc(URL.createObjectURL(blob));
    } catch {
      setError("No se pudo cargar la foto para acomodarla.");
    }
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  // El recortador nos devuelve el blob cuadrado ya listo para subir.
  async function handleCropConfirm(blob: Blob) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(blob, "jpg");
      setImageUrl(url);
      closeCropper();
    } catch (err: any) {
      setError("No se pudo subir la imagen: " + (err?.message || "error"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    const offerNum = offerPrice.trim() === "" ? null : Number(offerPrice);

    if (!code.trim()) return setError("Falta el código.");
    if (!name.trim()) return setError("Falta el nombre.");
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return setError("El precio debe ser un número mayor a 0.");
    if (isOffer && (offerNum == null || !Number.isFinite(offerNum) || offerNum <= 0))
      return setError("Si está en oferta, cargá un precio de oferta válido.");

    const payload = {
      code: code.trim(),
      name: name.trim(),
      price: priceNum,
      offer_price: offerNum,
      is_offer: isOffer,
      is_active: isActive,
      image_url: imageUrl,
      sort_order: Number(sortOrder) || 0,
    };

    const sizePayload = sizes
      .map((r) => ({ size: r.size.trim(), stock: Number(r.stock) || 0 }))
      .filter((r) => r.size.length > 0);

    setSaving(true);
    try {
      let productId = product?.id;
      if (editing && productId) {
        await updateProduct(productId, payload);
      } else {
        const created = await createProduct(payload);
        productId = created.id;
      }
      if (productId) await replaceSizes(productId, sizePayload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el producto.");
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-ink";
  const labelCls = "block text-xs font-600 uppercase tracking-wide text-neutral-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        className="my-4 w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl sm:my-6 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-brand text-xl font-700 uppercase tracking-widest">
            {editing ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button type="button" onClick={onClose} className="text-2xl text-neutral-400">
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Código / SKU</label>
            <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Orden (menor = primero)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre del modelo</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Precio</label>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Precio de oferta (opcional)</label>
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isOffer}
              onChange={(e) => setIsOffer(e.target.checked)}
              className="h-5 w-5 accent-ink"
            />
            <span className="text-sm font-600">En oferta (muestra badge y precio tachado)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 accent-ink"
            />
            <span className="text-sm font-600">Activo (visible en la web)</span>
          </label>
        </div>

        {/* Imagen */}
        <div className="mt-5">
          <label className={labelCls}>Foto del producto</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-24 w-24 overflow-hidden border border-neutral-200 bg-[#d9d9d9]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-neutral-400">
                  Sin foto
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-600 transition hover:bg-neutral-50"
              >
                {imageUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              <p className="text-xs text-neutral-400">
                Vas a poder acomodar y hacer zoom antes de guardar.
              </p>
              {uploading && <p className="text-xs text-neutral-500">Subiendo...</p>}
              {imageUrl && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleRecrop}
                    className="text-xs font-600 text-ink underline"
                  >
                    Acomodar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="text-xs text-offer underline"
                  >
                    Quitar foto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Talles */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Talles y stock (pares)</label>
            <button
              type="button"
              onClick={() => setSizes((r) => [...r, newRow()])}
              className="text-xs font-600 uppercase text-ink underline"
            >
              + Agregar talle
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {sizes.length === 0 && (
              <p className="text-sm text-neutral-400">Sin talles. Agregá al menos uno.</p>
            )}
            {sizes.map((r) => (
              <div key={r.key} className="flex items-center gap-2">
                <input
                  className="w-24 rounded-md border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-ink"
                  inputMode="numeric"
                  placeholder="Talle"
                  value={r.size}
                  onChange={(e) => updateRow(r.key, { size: e.target.value })}
                />
                <input
                  className="w-28 rounded-md border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-ink"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Pares"
                  value={r.stock}
                  onChange={(e) => updateRow(r.key, { stock: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeRow(r.key)}
                  className="ml-auto rounded-md px-2 py-2 text-sm font-600 text-offer hover:bg-offer/10"
                  aria-label="Quitar talle"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Los talles con 0 pares no aparecen disponibles en la web.
          </p>
        </div>

        {error && <p className="mt-4 text-sm text-offer">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md border border-neutral-300 px-5 py-3 text-sm font-600 uppercase tracking-wide transition hover:bg-neutral-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full rounded-md bg-ink px-6 py-3 text-sm font-700 uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          busy={uploading}
          onCancel={closeCropper}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
