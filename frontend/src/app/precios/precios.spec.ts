import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Precios } from './precios';
import { PrecioService } from '../core/precio.service';

describe('Precios', () => {
  let fixture: ComponentFixture<Precios>;
  let comp: Precios;
  let servicio: Record<'listar' | 'actualizarCuota' | 'actualizarRecargo', ReturnType<typeof vi.fn>>;

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

  it('muestra los valores actuales', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('15000');
    expect(texto).toContain('500');
  });

  it('guardar cuota válida llama al servicio', () => {
    comp.formCuota.setValue({ valor: 20000 });
    comp.guardarCuota();

    expect(servicio.actualizarCuota).toHaveBeenCalledWith(20000);
    expect(comp.cuotaActual()).toBe(20000);
  });

  it('cuota inválida (menor a 0.01) no llama al servicio', () => {
    comp.formCuota.setValue({ valor: 0 });
    comp.guardarCuota();

    expect(servicio.actualizarCuota).not.toHaveBeenCalled();
  });

  it('error 400 del backend muestra mensaje', () => {
    servicio.actualizarRecargo.mockReturnValue(throwError(() => ({ status: 400 }) as never));
    comp.formRecargo.setValue({ valor: 10 });
    comp.guardarRecargo();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Monto inválido');
  });
});
