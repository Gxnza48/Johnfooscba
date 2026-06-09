import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint "keep-alive": hace una consulta mínima a Supabase para registrar
// actividad y evitar que el proyecto gratuito se pause por inactividad
// (Supabase pausa los proyectos free tras ~7 días sin uso).
//
// Lo llama un Cron Job de Vercel una vez por día (ver vercel.json).
// No toca ni afecta la web pública: es una ruta aislada.

export const dynamic = "force-dynamic"; // nunca cachear: debe ejecutarse cada vez
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Si configurás CRON_SECRET en Vercel, exigimos que el llamado venga del cron.
  // (Vercel manda automáticamente "Authorization: Bearer <CRON_SECRET>".)
  // Si no lo configurás, la ruta funciona igual; solo hace una lectura inocua.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: "Supabase no configurado" },
      { status: 200 }
    );
  }

  try {
    const supabase = createClient(url, anon, {
      auth: { persistSession: false },
    });
    // Consulta mínima sobre una tabla con lectura pública (RLS lo permite).
    const { error } = await supabase.from("settings").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, pinged: "settings", ts: new Date().toISOString() });
  } catch (err: any) {
    // Devolvemos 200 igual: el solo hecho de llegar a Supabase ya cuenta como
    // actividad, y no queremos que el cron lo marque como fallido.
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error", ts: new Date().toISOString() },
      { status: 200 }
    );
  }
}
