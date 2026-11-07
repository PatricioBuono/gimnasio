/// <reference types="cypress" />

import { periodoActual } from '../support/periodo';
import type { PagoAuditoria, SocioSembrado } from '../support/tipos';

/**
 * F4-T5 — Flujo crítico de caja: cobro, mora, exoneración, comprobante y duplicado.
 * MR-US2, MR-US4 y MR-US5 contra backend + PostgreSQL reales.
 */
describe('F4-T5 — Cobro, mora, exoneración y comprobante', () => {
  let token: string;

  before(() => {
    cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    }).then((respuesta) => {
      token = respuesta.body.token;
    });
  });

  beforeEach(() => {
    cy.task('limpiarBase');
    cy.task('configurarPrecios', { cuota: 10000, recargo: 1500 });
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('jwt', token);
      },
    });
  });

  it('cobra en término, genera comprobante 0001-XXXXXXXX y audita el cobro', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000001',
      nombre: 'Lucia',
      apellido: 'Fernandez',
      mesesAtras: 0,
    }).then((socio) => {
      const periodo = socio.periodoEsperado;

      cy.visit(`/cobros/${socio.id}`);
      cy.get('#periodo').clear().type(periodo);
      cy.contains('button', 'Calcular desglose').click();

      cy.get('.ticket').should('contain.text', 'En término');
      cy.get('.ticket .linea.total dd').should('contain.text', '10.000,00');
      cy.contains('button', 'Registrar pago').should('be.enabled').click();

      cy.contains('Cobro registrado').should('be.visible');
      cy.get('.numero').should('have.text', '0001-00000001');
      cy.get('.ticket').should('contain.text', 'Vence el');
      cy.get('.ticket').should('not.contain.text', 'Recargo Bonificado');

      cy.task<PagoAuditoria>('consultarPago', { socioId: socio.id, periodo }).then((pago) => {
        expect(pago).to.not.be.null;
        expect(Number(pago.cuota)).to.eq(10000);
        expect(Number(pago.recargo)).to.eq(0);
        expect(Number(pago.total)).to.eq(10000);
        expect(pago.metodo).to.eq('EFECTIVO');
        expect(pago.exonerado).to.eq(false);
        expect(pago.cobrado_por).to.be.a('number');
        expect(pago.etiqueta).to.eq(null);
        expect(pago.nro).to.match(/^\d+$/);
      });
    });
  });

  it('bloquea el período duplicado con 409 y muestra el error en pantalla', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000002',
      nombre: 'Duplicado',
      apellido: 'Test',
      mesesAtras: 0,
    }).then((socio) => {
      const periodo = socio.periodoEsperado;

      cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/pagos`,
        body: {
          socioId: socio.id,
          periodo,
          metodo: 'EFECTIVO',
          exonerado: false,
          motivo: null,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
        .its('status')
        .should('eq', 201);

      cy.visit(`/cobros/${socio.id}`);
      cy.get('#periodo').clear().type(periodo);
      cy.contains('button', 'Calcular desglose').click();

      cy.get('[role="alert"]').should('contain.text', 'El período ya está pagado.');

      cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/pagos`,
        body: {
          socioId: socio.id,
          periodo,
          metodo: 'EFECTIVO',
          exonerado: false,
          motivo: null,
        },
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 409);
    });
  });

  it('calcula el recargo semanal por atraso y lo cobra sin exonerar', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000003',
      nombre: 'Mora',
      apellido: 'SinExonerar',
      mesesAtras: 4,
    }).then((socio) => {
      const periodo = socio.periodoEsperado;

      cy.visit(`/cobros/${socio.id}`);
      cy.get('#periodo').clear().type(periodo);
      cy.contains('button', 'Calcular desglose').click();

      cy.get('.ticket').should('contain.text', 'Recargo');
      cy.get('.ticket').should('not.contain.text', 'En término');
      cy.get('.ticket').should('not.contain.text', 'Recargo Bonificado');

      cy.contains('button', 'Registrar pago').click();
      cy.contains('Cobro registrado').should('be.visible');
      cy.get('.sello').should('not.exist');

      cy.task<PagoAuditoria>('consultarPago', { socioId: socio.id, periodo }).then((pago) => {
        expect(Number(pago.recargo)).to.be.greaterThan(0);
        expect(Number(pago.total)).to.be.greaterThan(Number(pago.cuota));
        expect(pago.exonerado).to.eq(false);
        expect(pago.etiqueta).to.eq(null);
      });
    });
  });

  it('exonera con motivo, deja total = cuota y registra la auditoría', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000004',
      nombre: 'Exonerada',
      apellido: 'ConMotivo',
      mesesAtras: 4,
    }).then((socio) => {
      const periodo = socio.periodoEsperado;

      cy.visit(`/cobros/${socio.id}`);
      cy.get('#periodo').clear().type(periodo);
      cy.contains('button', 'Calcular desglose').click();

      cy.contains('button', 'Registrar pago').should('be.enabled');

      cy.contains('label', 'Exonerar el recargo de este cobro')
        .find('input[type="checkbox"]')
        .check();

      cy.contains('Recargo Bonificado').should('be.visible');
      // En la vista previa el recargo original queda tachado.
      cy.get('.ticket .tachado').should('exist');
      cy.get('.ticket .linea.total dd').should('contain.text', '10.000,00');
      cy.contains('button', 'Registrar pago').should('be.disabled');

      cy.get('#motivo').type('   ');
      cy.contains('button', 'Registrar pago').should('be.disabled');

      cy.get('#motivo').clear().type('Retoma tras inactividad');
      cy.contains('button', 'Registrar pago').should('be.enabled').click();

      cy.contains('Cobro registrado').should('be.visible');
      cy.get('.sello').should('contain.text', 'Recargo Bonificado');
      // El comprobante actual omite la línea de recargo cuando el importe quedó en 0;
      // la bonificación se refleja en el sello y en el total igual a la cuota.
      cy.get('.tachado').should('not.exist');
      cy.get('.ticket .linea.total dd').should('contain.text', '10.000,00');

      cy.task<PagoAuditoria>('consultarPago', { socioId: socio.id, periodo }).then((pago) => {
        expect(pago.exonerado).to.eq(true);
        expect(pago.motivo_exoneracion).to.eq('Retoma tras inactividad');
        expect(pago.exonerado_por).to.be.a('number');
        expect(pago.tiene_exonerado_at).to.eq(true);
        expect(Number(pago.recargo)).to.eq(0);
        expect(Number(pago.total)).to.eq(10000);
        expect(pago.etiqueta).to.eq('Recargo Bonificado');
      });
    });
  });

  it('al desmarcar la exoneración vuelve a sumar el recargo', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000005',
      nombre: 'Reversion',
      apellido: 'Test',
      mesesAtras: 4,
    }).then((socio) => {
      const periodo = socio.periodoEsperado;

      cy.visit(`/cobros/${socio.id}`);
      cy.get('#periodo').clear().type(periodo);
      cy.contains('button', 'Calcular desglose').click();

      cy.get('.ticket .linea.total dd')
        .invoke('text')
        .then((totalConRecargo) => {
          const checkbox = () =>
            cy
              .contains('label', 'Exonerar el recargo de este cobro')
              .find('input[type="checkbox"]');

          checkbox().check();
          cy.contains('Recargo Bonificado').should('be.visible');
          cy.get('.ticket .linea.total dd').should('contain.text', '10.000,00');

          checkbox().uncheck();
          cy.contains('Recargo Bonificado').should('not.exist');
          cy.get('.ticket .linea.total dd')
            .invoke('text')
            .should('eq', totalConRecargo);
        });
    });
  });

  it('acepta el período del mes corriente como valor inicial', () => {
    cy.task<SocioSembrado>('sembrarSocio', {
      dni: '30000006',
      nombre: 'Periodo',
      apellido: 'Inicial',
      mesesAtras: 0,
    }).then(() => {
      cy.visit('/dashboard');
      cy.get('#busqueda-socios').type('30000006');
      cy.contains('section[aria-label="Resultados de búsqueda"] button', 'Cobrar').click();
      cy.contains('dialog[open] button', 'Ir a cobrar').click();

      cy.get('#periodo').should('have.value', periodoActual());
    });
  });
});
