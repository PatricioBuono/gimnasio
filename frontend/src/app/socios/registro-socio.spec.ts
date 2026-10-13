import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroSocio } from './registro-socio';
import { SocioService } from '../core/socio.service';

describe('RegistroSocio', () => {
  let fixture: ComponentFixture<RegistroSocio>;
  let comp: RegistroSocio;
  let servicio: Record<'alta', ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    servicio = {
      alta: vi.fn().mockReturnValue(of({ id: 1, dni: '34567890', nombre: 'Juan', apellido: 'Pérez' })),
    };
    await TestBed.configureTestingModule({
      imports: [RegistroSocio, ReactiveFormsModule],
      providers: [{ provide: SocioService, useValue: servicio }, provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistroSocio);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('alta válida llama al servicio y muestra enlace a la ficha', () => {
    comp.form.setValue({ dni: '34.567.890', nombre: 'Juan', apellido: 'Pérez' });
    comp.guardar();
    fixture.detectChanges();

    expect(servicio.alta).toHaveBeenCalledWith({ dni: '34.567.890', nombre: 'Juan', apellido: 'Pérez' });
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('registrado');
    expect(texto).toContain('Ver ficha');
  });

  it('formulario incompleto no llama al servicio', () => {
    comp.form.setValue({ dni: '', nombre: 'Juan', apellido: 'Pérez' });
    comp.guardar();

    expect(servicio.alta).not.toHaveBeenCalled();
  });

  it('DNI duplicado (409) muestra mensaje', () => {
    servicio.alta.mockReturnValue(throwError(() => ({ status: 409 }) as never));
    comp.form.setValue({ dni: '123', nombre: 'Juan', apellido: 'Pérez' });
    comp.guardar();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('ya está registrado');
  });
});
