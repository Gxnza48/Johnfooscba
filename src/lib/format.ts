// Formato de precios estilo argentino: $50.000 (sin decimales, punto de miles)
const nf = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(value: number, symbol = "$"): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${symbol}${nf.format(n)}`;
}
