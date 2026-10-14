import { beforeEach, describe, expect, it } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from './api';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let servicio: DashboardService;
  let http: HttpTestingController;
  const base = `${API_URL}/socios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    servicio = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  it('estado pide GET al endpoint', () => {
    let secciones = 0;
    servicio.estado().subscribe((r) => (secciones = r.alDia.length + r.conDeuda.length));

    http.expectOne(`${base}/estado`).flush({ alDia: [], conDeuda: [] });
    expect(secciones).toBe(0);
  });

  it('buscar envía q como parámetro', () => {
    let n = 0;
    servicio.buscar('Juan').subscribe((r) => (n = r.length));

    const req = http.expectOne(`${base}/buscar?q=Juan`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
    expect(n).toBe(1);
  });
});
