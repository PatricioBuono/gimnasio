/** Período AAAA-MM en la zona horaria del negocio. */
export function periodoActual(): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Mendoza',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const anio = partes.find((p) => p.type === 'year')?.value ?? '';
  const mes = partes.find((p) => p.type === 'month')?.value ?? '';
  return `${anio}-${mes}`;
}
