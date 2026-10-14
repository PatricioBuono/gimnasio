import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function ejecutar(token: string | null) {
    if (token === null) {
      localStorage.clear();
    } else {
      localStorage.setItem('jwt', token);
    }
    const navegar = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { estaAutenticado: () => token !== null } },
        { provide: Router, useValue: { createUrlTree: navegar.mockReturnValue({} as UrlTree), navigate: vi.fn() } },
      ],
    });
    return { resultado: TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)), navegar };
  }

  it('permite con token', () => {
    const { resultado, navegar } = ejecutar('abc');
    expect(resultado).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
  });

  it('redirige a /login sin token', () => {
    const { resultado, navegar } = ejecutar(null);
    expect(resultado).not.toBe(true);
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
