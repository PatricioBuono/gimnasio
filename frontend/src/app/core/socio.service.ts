import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { FichaSocio, Socio } from './models';

export interface SocioPayload {
  dni: string;
  nombre: string;
  apellido: string;
}

@Injectable({ providedIn: 'root' })
export class SocioService {
  private readonly baseUrl = `${API_URL}/socios`;

  constructor(private http: HttpClient) {}

  alta(payload: SocioPayload): Observable<Socio> {
    return this.http.post<Socio>(this.baseUrl, payload);
  }

  ficha(id: number): Observable<FichaSocio> {
    return this.http.get<FichaSocio>(`${this.baseUrl}/${id}`);
  }

  asignar(id: number, actividadIds: number[]): Observable<FichaSocio> {
    return this.http.put<FichaSocio>(`${this.baseUrl}/${id}/actividades`, { actividadIds });
  }
}
