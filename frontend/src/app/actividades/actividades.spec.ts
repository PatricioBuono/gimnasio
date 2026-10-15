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

  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

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

  it('renderiza tabla con pill de estado sin corchetes', () => {
    expect(texto()).toContain('Actividades · 2');
    expect(texto()).toContain('Crossfit');
    expect(texto()).toContain('Activa');
    expect(texto()).toContain('Inactiva');
    expect(texto()).not.toContain('[ACTIVA]');
  });

  it('botones de fila tienen nombre accesible con la actividad', () => {
    const eliminar = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Eliminar Crossfit"]',
    );
    expect(eliminar?.textContent?.trim()).toBe('Eliminar');
  });

  it('crear limpia, enfoca nombre y confirma', () => {
    comp.form.setValue({ nombre: 'Funcional', descripcion: '' });
    comp.guardar();
    fixture.detectChanges();

    expect(servicio.crear).toHaveBeenCalledWith({ nombre: 'Funcional', descripcion: null });
    expect(texto()).toContain('creada');
    expect(document.activeElement?.getAttribute('formcontrolname')).toBe('nombre');
  });

  it('formulario inválido marca aria-invalid y no llama', () => {
    comp.form.setValue({ nombre: '', descripcion: '' });
    comp.guardar();
    fixture.detectChanges();

    expect(servicio.crear).not.toHaveBeenCalled();
    const input = fixture.nativeElement.querySelector('input[formcontrolname="nombre"]');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(texto()).toContain('El nombre es obligatorio');
  });

  it('editar existente llama a editar', () => {
    comp.editar(lista[0]);
    comp.guardar();

    expect(servicio.editar).toHaveBeenCalledWith(1, { nombre: 'Crossfit', descripcion: null });
  });

  it('pedir eliminar abre diálogo con el nombre y confirmar elimina', () => {
    comp.pedirEliminar(lista[0], document.createElement('button'));
    fixture.detectChanges();

    expect(texto()).toContain('Eliminar Crossfit');
    comp.eliminarConfirmado();

    expect(servicio.eliminar).toHaveBeenCalledWith(1);
  });

  it('eliminar con socios muestra mensaje de inhabilitar', () => {
    servicio.eliminar.mockReturnValue(throwError(() => ({ status: 409 }) as never));
    comp.pedirEliminar(lista[0], document.createElement('button'));
    comp.eliminarConfirmado();
    fixture.detectChanges();

    expect(texto()).toContain('inhabilítela');
  });

  it('botones inhabilitar/habilitar llaman al servicio', () => {
    comp.inhabilitar(lista[0]);
    expect(servicio.inhabilitar).toHaveBeenCalledWith(1);
    comp.habilitar(lista[1]);
    expect(servicio.habilitar).toHaveBeenCalledWith(2);
  });

  it('vacío muestra mensaje con guía', () => {
    servicio.listar.mockReturnValue(of([]));
    comp.cargar();
    fixture.detectChanges();

    expect(texto()).toContain('Todavía no hay actividades');
  });

  it('error de carga muestra reintento', () => {
    servicio.listar.mockReturnValue(throwError(() => ({ status: 500 }) as never));
    comp.cargar();
    fixture.detectChanges();

    expect(texto()).toContain('Reintentar');
  });
});
