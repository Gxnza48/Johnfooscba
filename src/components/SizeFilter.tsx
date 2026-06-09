"use client";

interface Props {
  sizes: string[];
  selected: string | null;
  onSelect: (size: string | null) => void;
}

export default function SizeFilter({ sizes, selected, onSelect }: Props) {
  if (sizes.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
      <span className="shrink-0 text-[11px] font-600 uppercase tracking-widest text-neutral-500">
        Talle
      </span>
      {sizes.map((s) => {
        const active = selected === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(active ? null : s)}
            className={
              "shrink-0 rounded-md border px-3 py-1.5 text-sm font-600 transition " +
              (active
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-neutral-700 hover:border-neutral-400")
            }
          >
            {s}
          </button>
        );
      })}
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="shrink-0 pl-1 text-xs font-500 uppercase tracking-wide text-neutral-400 underline-offset-2 hover:text-ink hover:underline"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
