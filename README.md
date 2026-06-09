# JOHN FOOS CÓRDOBA — Catálogo + Admin

Catálogo de zapatillas con carrito que cierra el pedido por **WhatsApp**, y un
panel de administración en `/admin` para controlar todo (productos, fotos,
talles, stock, ofertas, número de WhatsApp y cartel de oferta).

Stack: **Next.js 14 + TypeScript + Tailwind CSS + Supabase** (Auth + Postgres + Storage).

---

## 1) Requisitos

- Node.js 18.17+ (recomendado 20+)
- Una cuenta gratis en [supabase.com](https://supabase.com)

## 2) Crear el proyecto en Supabase

1. Entrá a supabase.com → **New project**. Anotá la contraseña de la base.
2. Cuando esté listo, andá a **Project Settings → API** y copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Correr las migraciones SQL

En Supabase → **SQL Editor** → **New query**, pegá y ejecutá **en orden**:

1. `supabase/migrations/0001_init.sql` → crea tablas, seguridad (RLS), el bucket
   de imágenes y carga la configuración inicial (incluye el número de WhatsApp
   `549351169536`) + productos de ejemplo.
2. `supabase/migrations/0002_admin_user.sql` → crea el usuario admin.

> **Usuario admin (recomendado por panel):** en vez del archivo `0002`, podés
> crearlo desde **Authentication → Users → Add user**:
> email `jfcba@admin.com`, password `Jfcba2026`, y marcá **Auto Confirm User**.
> Es el método más confiable. El archivo SQL hace lo mismo, por las dudas.

## 4) Configurar variables de entorno

Copiá el ejemplo y completá con tus claves:

```bash
copy .env.local.example .env.local   # Windows (PowerShell/CMD)
# o en bash/mac/linux:  cp .env.local.example .env.local
```

Editá `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_DEFAULT_WHATSAPP=549351169536
```

## 5) Instalar y correr

```bash
npm install
npm run dev
```

- Tienda: http://localhost:3000
- Admin:  http://localhost:3000/admin  (entrar con `jfcba@admin.com` / `Jfcba2026`)

## 6) Build de producción / Deploy

```bash
npm run build
npm start
```

Para deploy: **Vercel** es lo más simple. Importá el repo, cargá las 3 variables
de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_DEFAULT_WHATSAPP`) y listo.

---

## Qué puede hacer el admin desde `/admin`

- **Productos:** crear, editar y borrar. Subir foto, fijar precio, marcar oferta
  (con precio tachado), activar/ocultar de la web, ordenar.
- **Talles y stock:** por producto, agregar/quitar talles con sus pares. Los
  talles en 0 no se ofrecen en la web.
- **Configuración:** nombre y subtítulo de la tienda, **número de WhatsApp**,
  símbolo de moneda, y **cartel de oferta** (mostrar/ocultar + texto).

## Cómo funciona el pedido por WhatsApp

El cliente arma el carrito (modelo + talle + cantidad de pares) y al tocar
**“Finalizar pedido por WhatsApp”** se abre `wa.me` con el pedido y el total ya
escritos, al número configurado en el panel.

---

## Seguridad

- El front usa la **anon key** (pública y segura). El acceso real lo controla
  **Row Level Security** en la base:
  - Cualquiera puede **leer** productos activos y la configuración.
  - Solo usuarios **autenticados** (el admin) pueden crear/editar/borrar y subir fotos.
- Cambiá la contraseña del admin desde Supabase → Authentication cuando quieras.

## Estructura

```
src/
  app/
    page.tsx           Catálogo público
    admin/page.tsx     Panel de administración
    layout.tsx         Layout raíz (fuentes + carrito)
  components/          Header, ProductCard, SizeModal, CartDrawer, admin/*
  lib/                 supabase, datos, carrito, whatsapp, formato, admin
supabase/migrations/   0001_init.sql, 0002_admin_user.sql
```
