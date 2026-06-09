"use client";

interface Props {
  name: string;
  subtitle: string;
}

export default function Header({ name, subtitle }: Props) {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-brand text-xl font-700 uppercase leading-none tracking-[0.26em] sm:text-2xl">
            {name}
          </h1>
          {subtitle ? (
            <p className="mt-2 truncate text-[10px] font-500 uppercase tracking-[0.3em] text-white/45 sm:text-[11px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] font-600 uppercase tracking-[0.22em] text-white/70 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Catálogo mayorista
        </span>
      </div>
    </header>
  );
}
