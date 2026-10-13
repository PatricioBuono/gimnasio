import { beforeEach, describe, expect, it } from 'vitest';
import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { JWT_CLAVE, authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const peticion = () => new HttpRequest('GET', '/api/admin/precios');

  beforeEach(() => {
    localStorage.clear();
  });

  it('agrega Bearer cuando hay token', () => {
    localStorage.setItem(JWT_CLAVE, 'abc123');
    let cabecera: string | null = null;
    const next: HttpHandlerFn = (req) => {
      cabecera = req.headers.get('Authorization');
      return of(new HttpResponse({ status: 200 }));
    };

    authInterceptor(peticion(), next).subscribe();

    expect(cabecera).toBe('Bearer abc123');
  });

  it('no agrega cabecera sin token', () => {
    let presente = true;
    const next: HttpHandlerFn = (req) => {
      presente = req.headers.has('Authorization');
      return of(new HttpResponse({ status: 200 }));
    };

    authInterceptor(peticion(), next).subscribe();

    expect(presente).toBe(false);
  });
});
