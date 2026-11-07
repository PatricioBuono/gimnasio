/** Tipos de retorno de las tareas de `cypress.config.ts`. */

export interface SocioSembrado {
  id: number;
  periodoEsperado: string;
}

export interface EscenarioDashboard {
  musculacionId: number;
  crossfitId: number;
  deudorViejoId: number;
  deudorNuevoId: number;
  alDiaConActividadId: number;
  alDiaSinActividadId: number;
}

/** Fila de pago + comprobante con la pista de auditoría de caja. */
export interface PagoAuditoria {
  cuota: string;
  recargo: string;
  total: string;
  metodo: string;
  exonerado: boolean;
  motivo_exoneracion: string | null;
  exonerado_por: number | null;
  tiene_exonerado_at: boolean;
  cobrado_por: number;
  nro: string;
  etiqueta: string | null;
}
