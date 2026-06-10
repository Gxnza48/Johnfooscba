"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import ProductTable from "@/components/admin/ProductTable";
import ProductForm from "@/components/admin/ProductForm";
import SettingsForm from "@/components/admin/SettingsForm";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { signOut } from "@/lib/admin";
import { DEFAULT_SETTINGS, fetchAllProducts, fetchSettings } from "@/lib/data";
import type { Product, Settings } from "@/lib/types";

type Tab = "products" | "settings";

export default function AdminPage() {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [tab, setTab] = useState<Tab>("products");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Verificar sesión + suscribirse a cambios de auth
  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const [s, p] = await Promise.all([fetchSettings(), fetchAllProducts()]);
      setSettings(s);
      setProducts(p);
    } catch (err: any) {
      setLoadError(err?.message || "No se pudieron cargar los datos.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn, loadData]);

  async function handleLogout() {
    await signOut();
    setLoggedIn(false);
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 shadow">
          <h1 className="font-brand text-xl font-700 uppercase">Falta conectar Supabase</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Completá <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en <code>.env.local</code> y reiniciá el
            servidor.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Cargando…
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginForm onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Barra superior */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-brand text-lg font-700 uppercase tracking-widest">
              {settings.store_name} · Admin
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="text-neutral-500 underline">
              Ver tienda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-ink px-4 py-2 text-xs font-700 uppercase tracking-wide text-white hover:bg-neutral-800"
            >
              Salir
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
            Productos
          </TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
            Configuración
          </TabBtn>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loadError && (
          <p className="mb-4 rounded bg-red-50 px-4 py-3 text-sm text-offer">{loadError}</p>
        )}

        {tab === "products" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                {products.length} producto{products.length === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditProduct(null);
                  setShowForm(true);
                }}
                className="rounded bg-ink px-5 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:bg-neutral-800"
              >
                + Nuevo producto
              </button>
            </div>

            {loadingData ? (
              <p className="text-neutral-400">Cargando productos…</p>
            ) : (
              <ProductTable
                products={products}
                currencySymbol={settings.currency_symbol}
                onEdit={(p) => {
                  setEditProduct(p);
                  setShowForm(true);
                }}
                onChanged={loadData}
              />
            )}
          </>
        )}

        {tab === "settings" && (
          <>
            <SettingsForm
              initial={settings}
              onSaved={(s) => setSettings(s)}
            />
            <ChangePasswordForm />
          </>
        )}
      </main>

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => setShowForm(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "border-b-2 px-4 py-2.5 text-sm font-600 uppercase tracking-wide transition " +
        (active
          ? "border-ink text-ink"
          : "border-transparent text-neutral-400 hover:text-neutral-600")
      }
    >
      {children}
    </button>
  );
}
