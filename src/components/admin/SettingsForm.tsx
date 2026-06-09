"use client";

import { useState } from "react";
import type { Settings } from "@/lib/types";
import { saveSettings } from "@/lib/admin";
import { sanitizeWhatsapp } from "@/lib/whatsapp";

export default function SettingsForm({
  initial,
  onSaved,
}: {
  initial: Settings;
  onSaved: (s: Settings) => void;
}) {
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const cleaned: Partial<Settings> = {
        store_name: form.store_name.trim() || "John Foos CBA",
        store_subtitle: form.store_subtitle.trim(),
        whatsapp_number: sanitizeWhatsapp(form.whatsapp_number),
        currency_symbol: form.currency_symbol.trim() || "$",
        show_offer_banner: form.show_offer_banner,
        offer_banner_text: form.offer_banner_text.trim(),
      };
      const updated = await saveSettings(cleaned);
      onSaved(updated);
      setMsg("Configuración guardada ✓");
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded border border-neutral-300 px-3 py-2.5 outline-none focus:border-ink";
  const labelCls = "block text-xs font-600 uppercase tracking-wide text-neutral-500";

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-5 rounded-lg bg-white p-6 shadow-sm">
      <div>
        <label className={labelCls}>Nombre de la tienda</label>
        <input
          className={inputCls}
          value={form.store_name}
          onChange={(e) => set("store_name", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Subtítulo</label>
        <input
          className={inputCls}
          value={form.store_subtitle}
          onChange={(e) => set("store_subtitle", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Número de WhatsApp</label>
        <input
          className={inputCls}
          value={form.whatsapp_number}
          onChange={(e) => set("whatsapp_number", e.target.value)}
          placeholder="5493518009990"
          inputMode="tel"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Solo dígitos con código de país. Se guarda como{" "}
          <code>{sanitizeWhatsapp(form.whatsapp_number) || "—"}</code>.
        </p>
      </div>

      <div>
        <label className={labelCls}>Símbolo de moneda</label>
        <input
          className={inputCls + " max-w-[120px]"}
          value={form.currency_symbol}
          onChange={(e) => set("currency_symbol", e.target.value)}
          placeholder="$"
        />
      </div>

      <div className="rounded border border-neutral-200 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.show_offer_banner}
            onChange={(e) => set("show_offer_banner", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-600">Mostrar cartel de oferta arriba</span>
        </label>
        <input
          className={inputCls}
          value={form.offer_banner_text}
          onChange={(e) => set("offer_banner_text", e.target.value)}
          placeholder="Ej: ¡LIQUIDACIÓN! 20% OFF en toda la web"
        />
      </div>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
      {error && <p className="text-sm text-offer">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-ink px-6 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
