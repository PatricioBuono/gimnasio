import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Dashboard, SocioEstado } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${API_URL}/socios`;

  constructor(private http: HttpClient) {}

  estado(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.baseUrl}/estado`);
  }

  buscar(q: string): Observable<SocioEstado[]> {
    const params = new HttpParams({ fromObject: { q } });
    return this.http.get<SocioEstado[]>(`${this.baseUrl}/buscar`, { params });
  }
}
