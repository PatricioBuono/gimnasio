export interface Actividad {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: 'ACTIVA' | 'INHABILITADA';
}

export interface Precio {
  clave: string;
  valor: number;
}

export interface Socio {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
}

export interface FichaSocio extends Socio {
  actividades: Actividad[];
}

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA';

export interface VistaPrevia {
  cuota: number;
  fechaLimite: string;
  diasAtraso: number;
  semanas: number;
  recargo: number;
  total: number;
}

export interface Comprobante {
  numero: string;
  socioId: number;
  periodo: string;
  cuota: number;
  semanas: number;
  recargo: number;
  total: number;
  metodo: MetodoPago;
  etiqueta: string | null;
  fechaLimite: string;
}
