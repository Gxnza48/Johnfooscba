"use client";

import { useEffect, useState } from "react";
import { signIn } from "@/lib/admin";

const EMAIL_KEY = "jhonfoos_admin_email";
const REMEMBER_KEY = "jhonfoos_admin_remember";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.9 5a9.7 9.7 0 0 1 2.1-.2c5.5 0 9 5 9 7.2 0 .8-.5 1.9-1.4 3M6.2 6.2C3.6 7.7 2 10.3 2 12c0 2.2 3.5 7.2 9 7.2 1.8 0 3.4-.5 4.7-1.3" />
          <path d="m9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="m3 3 18 18" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export default function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Precargar email recordado en este dispositivo
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(REMEMBER_KEY);
      const rememberPref = savedRemember === null ? true : savedRemember === "1";
      setRemember(rememberPref);
      if (rememberPref) {
        const savedEmail = localStorage.getItem(EMAIL_KEY);
        if (savedEmail) setEmail(savedEmail);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // Recordar (o no) este dispositivo
      try {
        localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
        if (remember) localStorage.setItem(EMAIL_KEY, email.trim());
        else localStorage.removeItem(EMAIL_KEY);
      } catch {
        /* ignore */
      }
      onLoggedIn();
    } catch (err: any) {
      setError(
        err?.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : err?.message || "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-ink px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-7 shadow-xl sm:p-8"
      >
        <h1 className="font-brand text-2xl font-700 uppercase tracking-widest text-ink">
          Panel Admin
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Ingresá con tu cuenta de administrador.</p>

        <label className="mt-6 block text-xs font-600 uppercase tracking-wide text-neutral-500">
          Email
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-3 text-base text-ink outline-none transition focus:border-ink"
          placeholder="user1234@gmail.com"
        />

        <label className="mt-4 block text-xs font-600 uppercase tracking-wide text-neutral-500">
          Contraseña
        </label>
        <div className="relative mt-1">
          <input
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-3 pr-12 text-base text-ink outline-none transition focus:border-ink"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-ink"
          >
            <EyeIcon off={showPass} />
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-ink"
          />
          <span className="text-sm text-neutral-700">
            Recordar este dispositivo
            <span className="block text-xs text-neutral-400">
              Dejá esta opción desmarcada si es un celular prestado o compartido.
            </span>
          </span>
        </label>

        {error && <p className="mt-4 text-sm text-offer">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-ink py-3.5 text-sm font-700 uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
