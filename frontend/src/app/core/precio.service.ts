import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Precio } from './models';

@Injectable({ providedIn: 'root' })
export class PrecioService {
  private readonly baseUrl = `${API_URL}/admin/precios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Precio[]> {
    return this.http.get<Precio[]>(this.baseUrl);
  }

  actualizarCuota(valor: number): Observable<Precio> {
    return this.http.put<Precio>(`${this.baseUrl}/cuota`, { valor });
  }

  actualizarRecargo(valor: number): Observable<Precio> {
    return this.http.put<Precio>(`${this.baseUrl}/recargo`, { valor });
  }
}
