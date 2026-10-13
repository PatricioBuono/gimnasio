import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Actividad } from './models';

export interface ActividadPayload {
  nombre: string;
  descripcion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly baseUrl = `${API_URL}/admin/actividades`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.baseUrl);
  }

  crear(payload: ActividadPayload): Observable<Actividad> {
    return this.http.post<Actividad>(this.baseUrl, payload);
  }

  editar(id: number, payload: ActividadPayload): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.baseUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  inhabilitar(id: number): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.baseUrl}/${id}/inhabilitar`, {});
  }

  habilitar(id: number): Observable<Actividad> {
    return this.http.patch<Actividad>(`${this.baseUrl}/${id}/habilitar`, {});
  }
}
