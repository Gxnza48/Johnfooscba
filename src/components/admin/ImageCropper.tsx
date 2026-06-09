"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Recortador de imágenes sencillo (cuadrado).
 * El admin mueve la foto (arrastrar con mouse o dedo) y hace zoom con la barra
 * hasta dejarla como le gusta. Al confirmar devuelve un Blob JPEG cuadrado,
 * así la foto siempre se ve bien en el catálogo (que usa cuadrados).
 */

const OUTPUT = 1000; // px del lado de la imagen final que se sube

export default function ImageCropper({
  src,
  onCancel,
  onConfirm,
  busy,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  busy?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [V, setV] = useState(320); // lado del marco cuadrado en px (medido)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1); // multiplicador sobre la escala "cover"
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // top-left de la imagen dentro del marco

  // Escala que hace que la foto cubra el marco entero (sin bordes blancos).
  const coverScale = nat ? V / Math.min(nat.w, nat.h) : 1;
  // Escala que hace entrar la foto completa dentro del marco (con bordes).
  const containScale = nat ? V / Math.max(nat.w, nat.h) : 1;
  const minZoom = coverScale > 0 ? containScale / coverScale : 0.5;
  const maxZoom = 3;

  const scale = coverScale * zoom;
  const dispW = nat ? nat.w * scale : 0;
  const dispH = nat ? nat.h * scale : 0;

  // Mide el marco (responsive) al montar y al cambiar el tamaño de ventana.
  useLayoutEffect(() => {
    function measure() {
      const el = viewportRef.current;
      if (el) setV(el.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Centra la foto cuando carga o cuando cambia el tamaño del marco.
  const centerImage = useCallback(() => {
    if (!nat) return;
    const s = (V / Math.min(nat.w, nat.h)) * 1; // cover * zoom(1)
    setZoom(1);
    setOffset({ x: (V - nat.w * s) / 2, y: (V - nat.h * s) / 2 });
  }, [nat, V]);

  useEffect(() => {
    centerImage();
  }, [centerImage]);

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
  }

  // Zoom centrado en el medio del marco.
  function handleZoom(nextZoom: number) {
    if (!nat) return;
    const oldScale = coverScale * zoom;
    const newScale = coverScale * nextZoom;
    const c = V / 2;
    setOffset((o) => ({
      x: c - ((c - o.x) * newScale) / oldScale,
      y: c - ((c - o.y) * newScale) / oldScale,
    }));
    setZoom(nextZoom);
  }

  // --- Arrastrar (mouse + táctil con Pointer Events) ---
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.startX),
      y: drag.current.oy + (e.clientY - drag.current.startY),
    });
  }
  function onPointerUp(e: React.PointerEvent) {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    drag.current = null;
  }

  // Recorta a un canvas cuadrado y devuelve el blob.
  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Fondo blanco (por si la foto no cubre todo el marco) → look limpio B2B.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.imageSmoothingQuality = "high";
    const r = OUTPUT / V; // del marco al canvas final
    ctx.drawImage(img, offset.x * r, offset.y * r, dispW * r, dispH * r);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
      >
        <h3 className="font-brand text-lg font-700 uppercase tracking-widest">
          Acomodar la foto
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Arrastrá la foto y usá el zoom para dejarla como quieras. Lo que se ve en el
          recuadro es lo que se va a mostrar.
        </p>

        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mx-auto mt-4 aspect-square w-full max-w-sm cursor-grab touch-none select-none overflow-hidden rounded-md border border-neutral-300 bg-white active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={handleImgLoad}
            draggable={false}
            crossOrigin="anonymous"
            className="pointer-events-none absolute select-none"
            style={{
              left: offset.x,
              top: offset.y,
              width: dispW,
              height: dispH,
              maxWidth: "none",
            }}
          />
          {/* Guías del encuadre */}
          <div className="pointer-events-none absolute inset-0 border border-white/60" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-600 uppercase tracking-wide text-neutral-500">
            Zoom
          </span>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="h-2 flex-1 accent-ink"
          />
          <button
            type="button"
            onClick={centerImage}
            className="text-xs font-600 uppercase text-ink underline"
          >
            Centrar
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-md border border-neutral-300 px-5 py-3 text-sm font-600 uppercase tracking-wide transition hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !nat}
            className="w-full rounded-md bg-ink px-6 py-3 text-sm font-700 uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Guardando..." : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
