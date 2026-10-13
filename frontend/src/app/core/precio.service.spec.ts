import { beforeEach, describe, expect, it } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { PrecioService } from './precio.service';

describe('PrecioService', () => {
  let servicio: PrecioService;
  let http: HttpTestingController;
  const base = `${API_URL}/admin/precios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(PrecioService);
    http = TestBed.inject(HttpTestingController);
  });

  it('listar pide GET al endpoint', () => {
    let n = 0;
    servicio.listar().subscribe((r) => (n = r.length));

    http.expectOne(base).flush([
      { clave: 'CUOTA', valor: 15000 },
      { clave: 'RECARGO_SEMANAL', valor: 500 },
    ]);
    expect(n).toBe(2);
  });

  it('actualizarCuota envía PUT con el valor', () => {
    let valor = 0;
    servicio.actualizarCuota(15000.5).subscribe((r) => (valor = r.valor));

    const req = http.expectOne(`${base}/cuota`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valor: 15000.5 });
    req.flush({ clave: 'CUOTA', valor: 15000.5 });
    expect(valor).toBe(15000.5);
  });

  it('actualizarRecargo envía PUT con el valor', () => {
    servicio.actualizarRecargo(0).subscribe();
    const req = http.expectOne(`${base}/recargo`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ valor: 0 });
    req.flush({ clave: 'RECARGO_SEMANAL', valor: 0 });
  });
});
