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
