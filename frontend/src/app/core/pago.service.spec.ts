import { beforeEach, describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { PagoService } from './pago.service';

describe('PagoService', () => {
  let servicio: PagoService;
  let http: HttpTestingController;
  const base = `${API_URL}/pagos`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(PagoService);
    http = TestBed.inject(HttpTestingController);
  });

  it('vistaPrevia pide GET con socioId y periodo', () => {
    let semanas = 0;
    servicio.vistaPrevia(1, '2026-10').subscribe((r) => (semanas = r.semanas));

    const req = http.expectOne(`${base}/vista-previa?socioId=1&periodo=2026-10`);
    expect(req.request.method).toBe('GET');
    req.flush({ cuota: 10000, fechaLimite: '2026-10-12', diasAtraso: 8, semanas: 2, recargo: 1000, total: 11000 });
    expect(semanas).toBe(2);
  });

  it('registrar envía POST con el payload', () => {
    servicio
      .registrar({ socioId: 1, periodo: '2026-10', metodo: 'EFECTIVO', exonerado: true, motivo: 'Retoma' })
      .subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      socioId: 1,
      periodo: '2026-10',
      metodo: 'EFECTIVO',
      exonerado: true,
      motivo: 'Retoma',
    });
    req.flush({ numero: '0001-00000001', total: 10000 });
  });

  it('propaga el 409 de período duplicado', () => {
    let codigo = 0;
    servicio
      .registrar({ socioId: 1, periodo: '2026-10', metodo: 'EFECTIVO', exonerado: false, motivo: null })
      .subscribe({ error: (e: HttpErrorResponse) => (codigo = e.status) });

    http.expectOne(base).flush('Duplicado', { status: 409, statusText: 'Conflict' });
    expect(codigo).toBe(409);
  });
});
