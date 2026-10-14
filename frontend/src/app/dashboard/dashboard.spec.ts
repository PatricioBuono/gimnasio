import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { DashboardService } from '../core/dashboard.service';
import { Dashboard, SocioEstado } from '../core/models';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let comp: DashboardComponent;
  let servicio: Record<'estado' | 'buscar', ReturnType<typeof vi.fn>>;

  const crossfit = { id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' as const };
  const yoga = { id: 2, nombre: 'Yoga', descripcion: null, estado: 'ACTIVA' as const };
  const ana: SocioEstado = {
    id: 1, dni: '111', nombre: 'Ana', apellido: 'Luz', actividades: [yoga],
    estado: 'AL_DIA', diasAtraso: 0, fechaLimite: '2026-10-12',
  };
  const juan: SocioEstado = {
    id: 2, dni: '222', nombre: 'Juan', apellido: 'Paz', actividades: [crossfit],
    estado: 'CON_DEUDA', diasAtraso: 8, fechaLimite: '2026-09-10',
  };
  const datos: Dashboard = { alDia: [ana], conDeuda: [juan] };

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
    fixture = TestBed.createComponent(DashboardComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza secciones con actividades y etiqueta de mora', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Al día');
    expect(texto).toContain('Con deuda');
    expect(texto).toContain('Crossfit');
    expect(texto).toContain('8 días (2 semanas) de atraso');
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

    comp.busqueda.setValue('   ');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(servicio.buscar).toHaveBeenCalledTimes(1);
    expect(comp.enBusqueda()).toBe(false);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Al día');
  });

  it('sin resultados muestra mensaje y enlace a Nuevo Socio', () => {
    servicio.buscar.mockReturnValue(of([]));
    comp.busqueda.setValue('nadie');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sin resultados');
    expect(texto).toContain('Nuevo Socio');
  });

  it('filtro por actividad filtra en memoria sin llamadas extra', () => {
    const llamadas = servicio.buscar.mock.calls.length;
    comp.cambiarFiltro('1');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Juan');
    expect(texto).not.toContain('Ana');
    expect(servicio.buscar.mock.calls.length).toBe(llamadas);
    expect(servicio.estado.mock.calls.length).toBe(1);
  });
});
