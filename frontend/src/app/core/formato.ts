const monedaARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const precioARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearMoneda(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : monedaARS.format(valor);
}

export function formatearPrecio(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : precioARS.format(valor);
}

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) {
    return iso;
  }
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
}
