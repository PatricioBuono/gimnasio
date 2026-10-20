import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { Precios } from './precios';
import { PrecioService } from '../core/precio.service';

describe('Precios', () => {
  let fixture: ComponentFixture<Precios>;
  let comp: Precios;
  let servicio: Record<'listar' | 'actualizarCuota' | 'actualizarRecargo', ReturnType<typeof vi.fn>>;

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(async () => {
    servicio = {
      listar: vi
        .fn()
        .mockReturnValue(of([{ clave: 'CUOTA', valor: 15000 }, { clave: 'RECARGO_SEMANAL', valor: 500 }])),
      actualizarCuota: vi.fn().mockReturnValue(of({ clave: 'CUOTA', valor: 20000 })),
      actualizarRecargo: vi.fn().mockReturnValue(of({ clave: 'RECARGO_SEMANAL', valor: 700 })),
    };
    await TestBed.configureTestingModule({
      imports: [Precios, ReactiveFormsModule],
      providers: [{ provide: PrecioService, useValue: servicio }],
    }).compileComponents();
    fixture = TestBed.createComponent(Precios);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra valores formateados como moneda y ayudas', () => {
    expect(texto()).toContain('15.000');
    expect(texto()).toContain('500');
    expect(texto()).toContain('Debe ser mayor a 0');
    expect(texto()).toContain('mayor o igual a 0');
  });

  it('botón deshabilitado si el valor es igual al actual', () => {
    comp.formCuota.setValue({ valor: 15000 });
    fixture.detectChanges();

    expect(comp.puedeGuardarCuota()).toBe(false);
  });

  it('valor inválido muestra mensaje inline con aria-invalid', () => {
    comp.formCuota.setValue({ valor: 0 });
    comp.pedirConfirmarCuota(document.createElement('button'));
    fixture.detectChanges();

    expect(servicio.actualizarCuota).not.toHaveBeenCalled();
    const input = fixture.nativeElement.querySelector('input[formcontrolname="valor"]');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(texto()).toContain('Debe ser mayor a 0');
  });

  it('confirmar guarda, actualiza, limpia y anuncia éxito', () => {
    comp.formCuota.setValue({ valor: 20000 });
    comp.pedirConfirmarCuota(document.createElement('button'));
    fixture.detectChanges();

    expect(texto()).toContain('¿Cambiar la cuota de');
    expect(texto()).toContain('20.000');
    comp.confirmarGuardado();
    fixture.detectChanges();

    expect(servicio.actualizarCuota).toHaveBeenCalledWith(20000);
    expect(comp.cuotaActual()).toBe(20000);
    expect(comp.formCuota.value.valor).toBeNull();
    expect(texto()).toContain('Cuota actualizada');
  });

  it('cancelar no guarda', () => {
    comp.formCuota.setValue({ valor: 20000 });
    comp.pedirConfirmarCuota(document.createElement('button'));
    comp.pendiente.set(null);

    expect(servicio.actualizarCuota).not.toHaveBeenCalled();
  });

  it('error 400 conserva lo escrito', () => {
    servicio.actualizarRecargo.mockReturnValue(throwError(() => ({ status: 400 }) as never));
    comp.formRecargo.setValue({ valor: 10 });
    comp.pedirConfirmarRecargo(document.createElement('button'));
    comp.confirmarGuardado();
    fixture.detectChanges();

    expect(texto()).toContain('Monto inválido');
    expect(comp.formRecargo.value.valor).toBe(10);
  });

  it('durante el guardado muestra Guardando y evita doble envío', () => {
    const pendiente = new Subject<{ clave: string; valor: number }>();
    servicio.actualizarCuota.mockReturnValue(pendiente);
    comp.formCuota.setValue({ valor: 20000 });
    comp.pedirConfirmarCuota(document.createElement('button'));
    comp.confirmarGuardado();
    fixture.detectChanges();

    expect(texto()).toContain('Guardando…');
    expect(comp.puedeGuardarCuota()).toBe(false);
    pendiente.next({ clave: 'CUOTA', valor: 20000 });
    pendiente.complete();
  });

  it('error de carga muestra reintento', () => {
    servicio.listar.mockReturnValue(throwError(() => ({ status: 500 }) as never));
    comp.cargar();
    fixture.detectChanges();

    expect(texto()).toContain('Reintentar');
  });
});
