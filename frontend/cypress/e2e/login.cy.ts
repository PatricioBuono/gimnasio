/// <reference types="cypress" />

/**
 * F1-T6 — Login, sesión y control de acceso.
 * Cubre login real, credenciales inválidas, guard de rutas y 401/403 del backend.
 */
describe('F1-T6 — Login y control de acceso', () => {
  beforeEach(() => {
    cy.task('limpiarBase');
    cy.visit('/login');
  });

  it('el admin inicia sesión y llega al dashboard', () => {
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.contains('button', 'Ingresar').click();

    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Socios').should('be.visible');
  });

  it('credenciales inválidas muestran error y no navegan', () => {
    cy.get('#username').type('admin');
    cy.get('#password').type('clave-incorrecta');
    cy.contains('button', 'Ingresar').click();

    cy.get('[role="alert"]').should('contain.text', 'Usuario o contraseña inválidos');
    cy.url().should('include', '/login');
  });

  it('una ruta privada sin token redirige al login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('protege /api/admin: 401 sin token y 403 con rol RECEPCIONISTA', () => {
    cy.apiPublica('GET', '/admin/actividades').its('status').should('eq', 401);

    cy.task('sembrarRecepcionista', { username: 'recepcion' });
    cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, {
      username: 'recepcion',
      password: 'admin123',
    })
      .its('body.token')
      .then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/admin/actividades`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        })
          .its('status')
          .should('eq', 403);
      });
  });

  it('un token inválido en localStorage no permite cargar el dashboard', () => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('jwt', 'token-invalido');
      },
    });
    cy.visit('/dashboard');

    cy.get('[role="alert"]').should('contain.text', 'No se pudo cargar el tablero');
  });
});
