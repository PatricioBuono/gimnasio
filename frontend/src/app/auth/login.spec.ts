import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../core/auth.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let comp: Login;
  let auth: Record<'login', ReturnType<typeof vi.fn>>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { login: vi.fn().mockReturnValue(of({ token: 'jwt-test' })) };
    router = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submit válido guarda token vía servicio y redirige a dashboard', () => {
    comp.form.setValue({ username: 'admin', password: 'admin123' });
    comp.ingresar();

    expect(auth.login).toHaveBeenCalledWith('admin', 'admin123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('formulario vacío no llama al servicio', () => {
    comp.ingresar();

    expect(auth.login).not.toHaveBeenCalled();
  });

  it('401 muestra credenciales inválidas', () => {
    auth.login.mockReturnValue(throwError(() => ({ status: 401 }) as never));
    comp.form.setValue({ username: 'admin', password: 'mal' });
    comp.ingresar();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Usuario o contraseña inválidos');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
