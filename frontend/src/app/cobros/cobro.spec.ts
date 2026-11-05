import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Cobro } from './cobro';
import { PagoService } from '../core/pago.service';
import { Comprobante, VistaPrevia } from '../core/models';

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

  const comprobante: Comprobante = {
    numero: '0001-00000042',
    socioId: 1,
    periodo: '2026-10',
    cuota: 10000,
    semanas: 2,
    recargo: 1000,
    total: 11000,
    metodo: 'EFECTIVO',
    etiqueta: null,
    fechaLimite: '2026-10-12',
  };

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function botonRegistrar(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('.registrar') as HTMLButtonElement;
  }

  beforeEach(async () => {
    servicio = {
      vistaPrevia: vi.fn().mockReturnValue(of(vista)),
      registrar: vi.fn().mockReturnValue(of(comprobante)),
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

  it('arranca con el ticket vacío y el período actual precargado', () => {
    expect(texto()).toContain('Sin desglose todavía');
    expect(comp.form.value.periodo).toMatch(/^\d{4}-\d{2}$/);
  });

  it('muestra el desglose Cuota / Recargo (semanas) / Total en pesos', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    expect(texto()).toMatch(/Cuota\s*\$\s*10\.000,00/);
    expect(texto()).toMatch(/Recargo\s*\(2 semanas\)\s*\$\s*1\.000,00/);
    expect(texto()).toMatch(/Total\s*\$\s*11\.000,00/);
    expect(texto()).toContain('Vence el 12/10/2026');
    expect(texto()).toContain('8 días de atraso');
  });

  it('exonerar recalcula el total a la cuota base y muestra el sello', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    fixture.detectChanges();

    expect(comp.totalMostrado()).toBe(10000);
    expect(texto()).toMatch(/Total\s*\$\s*10\.000,00/);
    expect(texto()).toContain('Recargo Bonificado');
  });

  it('sin motivo bloquea el pago exonerado', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    comp.motivo.set('   ');
    fixture.detectChanges();

    expect(comp.puedePagar()).toBe(false);
    expect(botonRegistrar().disabled).toBe(true);
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

  it('cambiar el período invalida el desglose anterior', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();
    expect(comp.vista()).not.toBeNull();

    comp.form.get('periodo')!.setValue('2026-11');
    fixture.detectChanges();

    expect(comp.vista()).toBeNull();
    expect(comp.puedePagar()).toBe(false);
    expect(texto()).toContain('Sin desglose todavía');
  });

  it('no ofrece exoneración cuando el cobro está en término', () => {
    servicio.vistaPrevia.mockReturnValue(of({ ...vista, diasAtraso: 0, semanas: 0, recargo: 0, total: 10000 }));
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    const fieldset = (fixture.nativeElement as HTMLElement).querySelector('fieldset');
    expect(fieldset).toBeNull();
    expect(texto()).toContain('En término');
  });

  it('previene el doble envío mientras registra', () => {
    const pendiente = new Subject<Comprobante>();
    servicio.registrar.mockReturnValue(pendiente);
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.pagar();

    expect(comp.registrando()).toBe(true);
    comp.pagar();

    expect(servicio.registrar).toHaveBeenCalledTimes(1);
    pendiente.complete();
  });

  it('muestra el comprobante emitido con número y método', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.pagar();
    fixture.detectChanges();

    expect(texto()).toContain('Cobro registrado');
    expect(texto()).toContain('0001-00000042');
    expect(texto()).toContain('Efectivo');
    expect(texto()).toMatch(/Total\s*\$\s*11\.000,00/);
  });

  it('nuevo cobro limpia el comprobante y vuelve al ticket vacío', () => {
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.pagar();
    fixture.detectChanges();
    expect(comp.comprobante()).not.toBeNull();

    comp.nuevoCobro();
    fixture.detectChanges();

    expect(comp.comprobante()).toBeNull();
    expect(comp.vista()).toBeNull();
    expect(texto()).toContain('Sin desglose todavía');
  });

  it('nuevo cobro descarta un cálculo que seguía en curso', () => {
    const pendiente = new Subject<VistaPrevia>();
    servicio.vistaPrevia.mockReturnValue(pendiente);
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.nuevoCobro();

    pendiente.next(vista);
    fixture.detectChanges();

    expect(comp.vista()).toBeNull();
    expect(comp.puedePagar()).toBe(false);
  });

  it('el comprobante exonerado conserva la etiqueta Recargo Bonificado', () => {
    servicio.registrar.mockReturnValue(
      of({ ...comprobante, etiqueta: 'Recargo Bonificado', total: 10000 }),
    );
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.alternarExoneracion(true);
    comp.motivo.set('Acuerdo con el socio');
    comp.pagar();
    fixture.detectChanges();

    expect(texto()).toContain('Recargo Bonificado');
    expect(texto()).toMatch(/Total\s*\$\s*10\.000,00/);
  });

  it('409 al calcular muestra período ya pagado', () => {
    servicio.vistaPrevia.mockReturnValue(throwError(() => ({ status: 409 }) as never));
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    expect(texto()).toContain('ya está pagado');
    expect(comp.vista()).toBeNull();
  });

  it('409 al registrar muestra período ya pagado y conserva el desglose', () => {
    servicio.registrar.mockReturnValue(throwError(() => ({ status: 409 }) as never));
    comp.form.setValue({ periodo: '2026-10', metodo: 'EFECTIVO' });
    comp.calcular();
    comp.pagar();
    fixture.detectChanges();

    expect(texto()).toContain('ya está pagado');
    expect(comp.vista()).not.toBeNull();
    expect(comp.comprobante()).toBeNull();
  });

  it('un período inválido no consulta al backend', () => {
    comp.form.setValue({ periodo: '2026-13', metodo: 'EFECTIVO' });
    comp.calcular();
    fixture.detectChanges();

    expect(servicio.vistaPrevia).not.toHaveBeenCalled();
    expect(texto()).toContain('Ingresá el período con formato AAAA-MM');
  });
});
