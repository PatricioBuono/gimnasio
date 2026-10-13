import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Comprobante, MetodoPago, VistaPrevia } from './models';

export interface PagoPayload {
  socioId: number;
  periodo: string;
  metodo: MetodoPago;
  exonerado: boolean;
  motivo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly baseUrl = `${API_URL}/pagos`;

  constructor(private http: HttpClient) {}

  vistaPrevia(socioId: number, periodo: string): Observable<VistaPrevia> {
    const params = new HttpParams({ fromObject: { socioId, periodo } });
    return this.http.get<VistaPrevia>(`${this.baseUrl}/vista-previa`, { params });
  }

  registrar(payload: PagoPayload): Observable<Comprobante> {
    return this.http.post<Comprobante>(this.baseUrl, payload);
  }
}
