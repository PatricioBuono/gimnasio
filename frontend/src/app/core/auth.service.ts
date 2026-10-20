import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';
import { JWT_CLAVE } from './auth.interceptor';

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_URL}/auth/login`, { username, password })
      .pipe(tap((r) => localStorage.setItem(JWT_CLAVE, r.token)));
  }

  logout(): void {
    localStorage.removeItem(JWT_CLAVE);
  }

  estaAutenticado(): boolean {
    return localStorage.getItem(JWT_CLAVE) !== null;
  }
}
