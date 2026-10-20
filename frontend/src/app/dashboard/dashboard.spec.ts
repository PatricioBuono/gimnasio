import { afterEach, beforeEach, describe, expect, it, vi, MockInstance } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { DashboardService } from '../core/dashboard.service';
import { Dashboard, SocioEstado } from '../core/models';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let comp: DashboardComponent;
  let servicio: Record<'estado' | 'buscar', ReturnType<typeof vi.fn>>;
  let navegar: MockInstance;

  const crossfit = { id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' as const };
  const yoga = { id: 2, nombre: 'Yoga', descripcion: null, estado: 'ACTIVA' as const };
  const ana: SocioEstado = {
    id: 1, dni: '111', nombre: 'Ana', apellido: 'Luz', actividades: [yoga],
    estado: 'AL_DIA', diasAtraso: 0, fechaLimite: '2099-12-10',
  };
  const juan: SocioEstado = {
    id: 2, dni: '222', nombre: 'Juan', apellido: 'Paz', actividades: [crossfit],
    estado: 'CON_DEUDA', diasAtraso: 8, fechaLimite: '2026-09-10',
  };
  const datos: Dashboard = { alDia: [ana], conDeuda: [juan] };

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    servicio = {
      estado: vi.fn().mockReturnValue(of(datos)),
      buscar: vi.fn().mockReturnValue(of([juan])),
    };
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, ReactiveFormsModule],
      providers: [{ provide: DashboardService, useValue: servicio }, provideRouter([])],
    }).compileComponents();
    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(DashboardComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra encabezado, contadores y secciones con deuda primero', () => {
    expect(texto()).toContain('Socios');
    expect(texto()).toContain('Con deuda · 1');
    expect(texto()).toContain('Al día · 1');
    const deuda = texto().indexOf('Con deuda · 1');
    const alDia = texto().indexOf('Al día · 1');
    expect(deuda).toBeLessThan(alDia);
  });

  it('renderiza tabla con DNI, actividad, vencimiento y botón Cobrar', () => {
    expect(texto()).toContain('DNI 222');
    expect(texto()).toContain('Crossfit');
    expect(texto()).toContain('Vence 10/12');
    expect(texto()).toContain('8 días (2 semanas) de atraso');
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    const etiquetas = Array.from(botones).map((b) => b.textContent?.trim());
    expect(etiquetas).toContain('Cobrar');
  });

  it('debounce: escrituras rápidas generan una sola búsqueda', () => {
    comp.busqueda.setValue('J');
    comp.busqueda.setValue('Ju');
    comp.busqueda.setValue('Juan');
    expect(servicio.buscar).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(servicio.buscar).toHaveBeenCalledTimes(1);
    expect(servicio.buscar).toHaveBeenCalledWith('Juan');
  });

  it('valor repetido no dispara otra búsqueda', () => {
    comp.busqueda.setValue('Juan');
    vi.advanceTimersByTime(300);
    comp.busqueda.setValue('Juan');
    vi.advanceTimersByTime(300);

    expect(servicio.buscar).toHaveBeenCalledTimes(1);
  });

  it('limpiar la búsqueda vuelve al dashboard sin llamar al backend', () => {
    comp.busqueda.setValue('Juan');
    vi.advanceTimersByTime(300);
    expect(comp.enBusqueda()).toBe(true);

    comp.limpiarBusqueda();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(servicio.buscar).toHaveBeenCalledTimes(1);
    expect(comp.enBusqueda()).toBe(false);
    expect(texto()).toContain('Al día · 1');
  });

  it('sin resultados muestra mensaje, limpiar y Nuevo Socio', () => {
    servicio.buscar.mockReturnValue(of([]));
    comp.busqueda.setValue('nadie');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(texto()).toContain('Sin resultados');
    expect(texto()).toContain('Nuevo Socio');
  });

  it('filtro por actividad filtra en memoria sin llamadas extra', () => {
    comp.cambiarFiltro('1');
    fixture.detectChanges();

    expect(texto()).toContain('Juan');
    expect(texto()).not.toContain('Ana');
    expect(servicio.estado.mock.calls.length).toBe(1);
  });

  it('contador Por vencer filtra la lista', () => {
    comp.cambiarFiltroEstado('POR_VENCER');
    fixture.detectChanges();

    expect(texto()).not.toContain('Juan');
  });

  it('error de carga muestra reintento', () => {
    servicio.estado.mockReturnValue(throwError(() => ({ status: 500 }) as never));
    comp.cargar();
    fixture.detectChanges();

    expect(texto()).toContain('Reintentar');
    comp.cargar();
    expect(servicio.estado.mock.calls.length).toBe(3);
  });

  it('confirmar cobro navega a la pantalla de cobro', () => {
    comp.abrirConfirmacion(juan, document.createElement('button'));
    fixture.detectChanges();

    expect(texto()).toContain('Confirmar cobro');
    expect(texto()).toContain('Juan Paz');
    comp.irACobrar();

    expect(navegar).toHaveBeenCalledWith(['/cobros', 2]);
    expect(comp.socioDialogo()).toBeNull();
  });

  it('cancelar no navega', () => {
    comp.abrirConfirmacion(juan, document.createElement('button'));
    comp.cerrarConfirmacion();

    expect(navegar).not.toHaveBeenCalled();
    expect(comp.socioDialogo()).toBeNull();
  });
});
