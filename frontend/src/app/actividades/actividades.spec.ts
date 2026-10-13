import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Actividades } from './actividades';
import { ActividadService } from '../core/actividad.service';
import { Actividad } from '../core/models';

describe('Actividades', () => {
  let fixture: ComponentFixture<Actividades>;
  let comp: Actividades;
  let servicio: Record<'listar' | 'crear' | 'editar' | 'eliminar' | 'inhabilitar' | 'habilitar', ReturnType<typeof vi.fn>>;

  const lista: Actividad[] = [
    { id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' },
    { id: 2, nombre: 'Yoga', descripcion: 'suave', estado: 'INHABILITADA' },
  ];

  beforeEach(async () => {
    servicio = {
      listar: vi.fn().mockReturnValue(of(lista)),
      crear: vi.fn().mockReturnValue(of(lista[0])),
      editar: vi.fn().mockReturnValue(of(lista[0])),
      eliminar: vi.fn().mockReturnValue(of(undefined)),
      inhabilitar: vi.fn().mockReturnValue(of(lista[0])),
      habilitar: vi.fn().mockReturnValue(of(lista[0])),
    };
    await TestBed.configureTestingModule({
      imports: [Actividades, ReactiveFormsModule],
      providers: [{ provide: ActividadService, useValue: servicio }],
    }).compileComponents();
    fixture = TestBed.createComponent(Actividades);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza el listado con estado', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Crossfit');
    expect(texto).toContain('[ACTIVA]');
    expect(texto).toContain('Yoga');
  });

  it('crear llama al servicio y recarga', () => {
    comp.form.setValue({ nombre: 'Funcional', descripcion: '' });
    comp.guardar();

    expect(servicio.crear).toHaveBeenCalledWith({ nombre: 'Funcional', descripcion: null });
    expect(servicio.listar).toHaveBeenCalledTimes(2);
  });

  it('editar existente llama a editar', () => {
    comp.editar(lista[0]);
    comp.guardar();

    expect(servicio.editar).toHaveBeenCalledWith(1, { nombre: 'Crossfit', descripcion: null });
  });

  it('formulario inválido no llama al servicio', () => {
    comp.form.setValue({ nombre: '', descripcion: '' });
    comp.guardar();

    expect(servicio.crear).not.toHaveBeenCalled();
  });

  it('eliminar con socios muestra mensaje de inhabilitar', () => {
    servicio.eliminar.mockReturnValue(
      throwError(() => ({ status: 409 }) as never),
    );
    comp.eliminar(lista[0]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('inhabilítela');
  });

  it('botones inhabilitar/habilitar llaman al servicio', () => {
    comp.inhabilitar(lista[0]);
    expect(servicio.inhabilitar).toHaveBeenCalledWith(1);
    comp.habilitar(lista[1]);
    expect(servicio.habilitar).toHaveBeenCalledWith(2);
  });
});
