/// <reference types="cypress" />

import type { EscenarioDashboard } from '../support/tipos';

/**
 * F5-T4 — Dashboard: listas por estado, orden por atraso, búsqueda y filtro.
 * MR-US6 y MR-US7.
 */
describe('F5-T4 — Dashboard, búsqueda y filtro', () => {
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
    cy.task('configurarPrecios', { cuota: 10000, recargo: 1000 });
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('jwt', token);
      },
    });
  });

  it('separa al día y con deuda, ordena por atraso y muestra actividades', () => {
    cy.task('sembrarEscenarioDashboard').then(() => {
      cy.visit('/dashboard');

      cy.contains('section[aria-label="Socios con deuda"] h2', 'Con deuda').should(
        'contain.text',
        '· 2',
      );
      cy.contains('section[aria-label="Socios al día"] h2', 'Al día').should('contain.text', '· 2');

      cy.get('section[aria-label="Socios con deuda"] tbody tr').should('have.length', 2);
      cy.get('section[aria-label="Socios con deuda"] tbody tr')
        .eq(0)
        .should('contain.text', 'Bruno Diaz')
        .and('contain.text', 'Musculación')
        .and('contain.text', 'Con deuda');
      cy.get('section[aria-label="Socios con deuda"] tbody tr')
        .eq(1)
        .should('contain.text', 'Ana Gomez');

      cy.get('section[aria-label="Socios al día"] tbody tr').should('have.length', 2);
      cy.get('section[aria-label="Socios al día"] tbody tr')
        .eq(0)
        .should('contain.text', 'Carla Perez')
        .and('contain.text', 'Crossfit');
    });
  });

  it('busca por DNI y por nombre (insensible a mayúsculas) y muestra sin resultados', () => {
    cy.task('sembrarEscenarioDashboard').then(() => {
      cy.visit('/dashboard');

      cy.get('#busqueda-socios').type('20000004');
      cy.contains('section[aria-label="Resultados de búsqueda"] h2', 'Resultados').should(
        'contain.text',
        '· 1',
      );
      cy.get('section[aria-label="Resultados de búsqueda"]').should('contain.text', 'Diego Sosa');

      cy.get('#busqueda-socios').clear().type('GOMEZ');
      cy.get('section[aria-label="Resultados de búsqueda"]')
        .should('contain.text', 'Ana Gomez')
        .and('contain.text', 'Con deuda');

      cy.get('#busqueda-socios').clear().type('zzzz-no-existe');
      cy.contains('Sin resultados').should('be.visible');
      cy.contains('a', 'Nuevo socio').should('be.visible');
    });
  });

  it('filtra por actividad y conserva el estado de cada socio', () => {
    cy.task<EscenarioDashboard>('sembrarEscenarioDashboard').then((ids) => {
      cy.visit('/dashboard');

      cy.get('#filtro-actividad').select(String(ids.musculacionId));

      cy.contains('section[aria-label="Socios con deuda"] h2', 'Con deuda').should(
        'contain.text',
        '· 2',
      );
      cy.get('section[aria-label="Socios con deuda"] tbody tr').should('have.length', 2);
      cy.get('section[aria-label="Socios con deuda"] tbody tr').should(
        'not.contain.text',
        'Carla Perez',
      );

      cy.contains('section[aria-label="Socios al día"] h2', 'Al día').should('contain.text', '· 0');
      cy.contains('No hay socios al día').should('be.visible');
    });
  });

  it('abre la confirmación de cobro y navega a la pantalla del socio', () => {
    cy.task<EscenarioDashboard>('sembrarEscenarioDashboard').then((ids) => {
      cy.visit('/dashboard');

      cy.get('section[aria-label="Socios con deuda"] tbody tr')
        .eq(0)
        .contains('button', 'Cobrar')
        .click();

      cy.get('dialog[open]').should('contain.text', 'Confirmar cobro');
      cy.get('dialog[open]').should('contain.text', 'Bruno Diaz');
      cy.contains('dialog[open] button', 'Ir a cobrar').click();

      cy.url().should('include', `/cobros/${ids.deudorViejoId}`);
    });
  });
});
