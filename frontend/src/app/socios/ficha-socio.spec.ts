import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FichaSocioComponent } from './ficha-socio';
import { ActividadService } from '../core/actividad.service';
import { SocioService } from '../core/socio.service';
import { Actividad, FichaSocio } from '../core/models';

describe('FichaSocioComponent', () => {
  let fixture: ComponentFixture<FichaSocioComponent>;
  let comp: FichaSocioComponent;
  let socios: Record<'ficha' | 'asignar', ReturnType<typeof vi.fn>>;
  let actividades: Record<'listar', ReturnType<typeof vi.fn>>;

  const ficha: FichaSocio = {
    id: 1,
    dni: '123',
    nombre: 'Juan',
    apellido: 'Pérez',
    actividades: [{ id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' }],
  };
  const catalogo: Actividad[] = [
    { id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' },
    { id: 2, nombre: 'Yoga', descripcion: null, estado: 'INHABILITADA' },
  ];

  beforeEach(async () => {
    socios = {
      ficha: vi.fn().mockReturnValue(of(ficha)),
      asignar: vi.fn().mockReturnValue(of(ficha)),
    };
    actividades = { listar: vi.fn().mockReturnValue(of(catalogo)) };
    await TestBed.configureTestingModule({
      imports: [FichaSocioComponent, ReactiveFormsModule],
      providers: [
        { provide: SocioService, useValue: socios },
        { provide: ActividadService, useValue: actividades },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FichaSocioComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra la ficha con sus actividades', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Juan Pérez');
    expect(texto).toContain('Crossfit');
  });

  it('solo ofrece actividades activas para asignar', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    const checkboxes = (fixture.nativeElement as HTMLElement).querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(1);
    expect(texto).not.toContain('Yoga');
  });

  it('guardar envía los ids seleccionados', () => {
    comp.alternar(1, false);
    comp.guardar();

    expect(socios.asignar).toHaveBeenCalledWith(1, []);
  });

  it('error al asignar inactiva muestra mensaje', () => {
    socios.asignar.mockReturnValue(throwError(() => ({ status: 400 }) as never));
    comp.guardar();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('ya no está activa');
  });
});
