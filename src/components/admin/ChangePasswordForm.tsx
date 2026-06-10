"use client";

import { useState } from "react";
import { changePassword } from "@/lib/admin";

const MIN_LEN = 6;

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (next.length < MIN_LEN) {
      setError(`La nueva contraseña debe tener al menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (next !== confirm) {
      setError("Las dos contraseñas nuevas no coinciden.");
      return;
    }
    if (next === current) {
      setError("La nueva contraseña no puede ser igual a la actual.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(current, next);
      setMsg("Contraseña actualizada ✓");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: any) {
      setError(err?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-ink";
  const labelCls = "block text-xs font-600 uppercase tracking-wide text-neutral-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 max-w-xl space-y-5 rounded-lg bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="font-brand text-lg font-700 uppercase tracking-wide text-ink">
          Cambiar contraseña
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Ingresá tu contraseña actual y la nueva dos veces.
        </p>
      </div>

      <div>
        <label className={labelCls}>Contraseña actual</label>
        <input
          className={inputCls}
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelCls}>Nueva contraseña</label>
        <input
          className={inputCls}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={labelCls}>Repetir nueva contraseña</label>
        <input
          className={inputCls}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 select-none text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        Mostrar contraseñas
      </label>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
      {error && <p className="text-sm text-offer">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-ink px-6 py-2.5 text-sm font-700 uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
