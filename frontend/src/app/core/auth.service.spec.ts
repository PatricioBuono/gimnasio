import { beforeEach, describe, expect, it } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { JWT_CLAVE } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let servicio: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('login envía POST y guarda el token', () => {
    servicio.login('admin', 'admin123').subscribe();

    const req = http.expectOne(`${API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'admin123' });
    req.flush({ token: 'jwt-test' });
    expect(localStorage.getItem(JWT_CLAVE)).toBe('jwt-test');
  });

  it('estaAutenticado refleja el token guardado', () => {
    expect(servicio.estaAutenticado()).toBe(false);
    localStorage.setItem(JWT_CLAVE, 'x');
    expect(servicio.estaAutenticado()).toBe(true);
    servicio.logout();
    expect(servicio.estaAutenticado()).toBe(false);
  });
});
