import { beforeEach, describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { ActividadService } from './actividad.service';
import { Actividad } from './models';

describe('ActividadService', () => {
  let servicio: ActividadService;
  let http: HttpTestingController;
  const base = `${API_URL}/admin/actividades`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(ActividadService);
    http = TestBed.inject(HttpTestingController);
  });

  it('listar pide GET al endpoint', () => {
    const mock: Actividad[] = [{ id: 1, nombre: 'Crossfit', descripcion: null, estado: 'ACTIVA' }];
    let resultado: Actividad[] = [];
    servicio.listar().subscribe((r) => (resultado = r));

    http.expectOne(base).flush(mock);
    expect(resultado).toEqual(mock);
  });

  it('crear envía POST con el payload', () => {
    const creada: Actividad = { id: 2, nombre: 'Funcional', descripcion: 'd', estado: 'ACTIVA' };
    let resultado: Actividad | null = null;
    servicio.crear({ nombre: 'Funcional', descripcion: 'd' }).subscribe((r) => (resultado = r));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush(creada);
    expect(resultado).toEqual(creada);
  });

  it('eliminar envía DELETE y propaga el 409 con socios', () => {
    let codigo = 0;
    servicio.eliminar(1).subscribe({
      error: (e: HttpErrorResponse) => (codigo = e.status),
    });

    const req = http.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush('Tiene socios', { status: 409, statusText: 'Conflict' });
    expect(codigo).toBe(409);
  });

  it('inhabilitar y habilitar usan PATCH', () => {
    servicio.inhabilitar(1).subscribe();
    http.expectOne(`${base}/1/inhabilitar`).flush({});
    servicio.habilitar(1).subscribe();
    const req = http.expectOne(`${base}/1/habilitar`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
