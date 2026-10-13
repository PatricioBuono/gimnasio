import { beforeEach, describe, expect, it } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { SocioService } from './socio.service';

describe('SocioService', () => {
  let servicio: SocioService;
  let http: HttpTestingController;
  const base = `${API_URL}/socios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(SocioService);
    http = TestBed.inject(HttpTestingController);
  });

  it('alta envía POST con dni, nombre y apellido', () => {
    let dni = '';
    servicio.alta({ dni: '34.567.890', nombre: 'Juan', apellido: 'Pérez' }).subscribe((r) => (dni = r.dni));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, dni: '34567890', nombre: 'Juan', apellido: 'Pérez' });
    expect(dni).toBe('34567890');
  });

  it('propaga el 409 de DNI duplicado', () => {
    let codigo = 0;
    servicio.alta({ dni: '123', nombre: 'A', apellido: 'B' }).subscribe({
      error: (e) => (codigo = e.status),
    });

    http.expectOne(base).flush('Duplicado', { status: 409, statusText: 'Conflict' });
    expect(codigo).toBe(409);
  });

  it('asignar envía PUT con los ids', () => {
    servicio.asignar(1, [1, 2]).subscribe();
    const req = http.expectOne(`${base}/1/actividades`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ actividadIds: [1, 2] });
    req.flush({ id: 1, dni: '123', nombre: 'A', apellido: 'B', actividades: [] });
  });

  it('ficha pide GET por id', () => {
    let nombre = '';
    servicio.ficha(1).subscribe((r) => (nombre = r.nombre));

    http.expectOne(`${base}/1`).flush({ id: 1, dni: '123', nombre: 'Juan', apellido: 'P', actividades: [] });
    expect(nombre).toBe('Juan');
  });
});
