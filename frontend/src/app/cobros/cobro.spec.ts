import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Cobro } from './cobro';
import { PagoService } from '../core/pago.service';
import { VistaPrevia } from '../core/models';

describe('Cobro', () => {
  let fixture: ComponentFixture<Cobro>;
  let comp: Cobro;
  let servicio: Record<'vistaPrevia' | 'registrar', ReturnType<typeof vi.fn>>;

  const vista: VistaPrevia = {
    cuota: 10000,
    fechaLimite: '2026-10-12',
    diasAtraso: 8,
    semanas: 2,
    recargo: 1000,
    total: 11000,
  };

  beforeEach(async () => {
    servicio = {
      vistaPrevia: vi.fn().mockReturnValue(of(vista)),
      registrar: vi.fn().mockReturnValue(of({ numero: '0001-00000001', total: 11000 })),
    };
    await TestBed.configureTestingModule({
      imports: [Cobro, ReactiveFormsModule],
      providers: [
        { provide: PagoService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Cobro);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra el desglose Cuota / Recargo (semanas) / Total', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cuota: $10000');
    expect(texto).toContain('Recargo (2 semanas): $1000');
    expect(texto).toContain('Total: $11000');
  });

  it('exonerar recalcula el total a la cuota base', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    fixture.detectChanges();

    expect(comp.totalMostrado()).toBe(10000);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Total: $10000');
  });

  it('sin motivo bloquea el pago exonerado', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    comp.motivo.set('   ');
    fixture.detectChanges();

    expect(comp.puedePagar()).toBe(false);
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    comp.pagar();
    expect(servicio.registrar).not.toHaveBeenCalled();
  });

  it('con motivo habilita y envía la exoneración', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    comp.motivo.set('Retoma tras inactividad');
    comp.pagar();

    expect(servicio.registrar).toHaveBeenCalledWith({
      socioId: 1,
      periodo: '2026-10',
      metodo: 'EFECTIVO',
      exonerado: true,
      motivo: 'Retoma tras inactividad',
    });
  });

  it('409 muestra período ya pagado', () => {
    servicio.vistaPrevia.mockReturnValue(throwError(() => ({ status: 409 }) as never));
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('ya está pagado');
  });
});
