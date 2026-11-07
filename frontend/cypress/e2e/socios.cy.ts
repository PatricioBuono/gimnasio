/// <reference types="cypress" />

/**
 * F3-T4 — Alta de socio, normalización de DNI y asignación de actividades.
 * MA-US4 y MA-US5.
 */
describe('F3-T4 — Socios y asignación de actividades', () => {
  let token: string;

  const api = (method: string, path: string, body?: Cypress.RequestBody) =>
    cy.request({
      method,
      url: `${Cypress.expose('apiUrl')}${path}`,
      body,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });

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
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('jwt', token);
      },
    });
  });

  it('da de alta un socio, normaliza el DNI y abre la ficha', () => {
    cy.visit('/socios/nuevo');
    cy.get('input[formcontrolname="dni"]').type('12.345.678');
    cy.get('input[formcontrolname="nombre"]').type('Nuevo');
    cy.get('input[formcontrolname="apellido"]').type('Socio');
    cy.contains('button', 'Registrar').click();

    cy.contains('[role="status"]', 'Socio Nuevo Socio registrado.').should('be.visible');
    cy.contains('a', 'Ver ficha').click();

    cy.contains('h2', 'Nuevo Socio (DNI 12345678)').should('be.visible');
  });

  it('rechaza un DNI duplicado aunque venga con puntos', () => {
    api('POST', '/socios', {
      dni: '30111222',
      nombre: 'Existente',
      apellido: 'Socio',
    })
      .its('status')
      .should('eq', 201);

    cy.visit('/socios/nuevo');
    cy.get('input[formcontrolname="dni"]').type('30.111.222');
    cy.get('input[formcontrolname="nombre"]').type('Otro');
    cy.get('input[formcontrolname="apellido"]').type('Socio');
    cy.contains('button', 'Registrar').click();

    cy.get('[role="alert"]').should('contain.text', 'El DNI ya está registrado');
  });

  it('rechaza DNI inválido tanto en UI como en API', () => {
    api('POST', '/socios', { dni: 'abc', nombre: 'Sin', apellido: 'Numero' })
      .its('status')
      .should('eq', 400);

    cy.visit('/socios/nuevo');
    cy.get('input[formcontrolname="dni"]').type('abc');
    cy.get('input[formcontrolname="nombre"]').type('Sin');
    cy.get('input[formcontrolname="apellido"]').type('Numero');
    cy.contains('button', 'Registrar').click();

    cy.get('[role="status"]').should('not.exist');
  });

  it('asigna actividades activas y las muestra en la ficha', () => {
    api('POST', '/admin/actividades', { nombre: 'Yoga', descripcion: 'Movilidad' })
      .its('body.id')
      .then((actividadId) => {
        api('POST', '/socios', { dni: '30111223', nombre: 'Asignado', apellido: 'Test' })
          .its('body.id')
          .then((socioId) => {
            cy.visit(`/socios/${socioId}`);
            cy.contains('label', 'Yoga').find('input[type="checkbox"]').check();
            cy.contains('button', 'Guardar asignación').click();

            cy.contains('[role="status"]', 'Actividades actualizadas').should('be.visible');
            cy.contains('h3', 'Actividades asignadas').next('ul').should('contain.text', 'Yoga');
          });
      });
  });

  it('no ofrece actividades inhabilitadas y rechaza asignarlas por API', () => {
    api('POST', '/admin/actividades', { nombre: 'Inactiva', descripcion: null })
      .its('body.id')
      .then((actividadId) => {
        api('PATCH', `/admin/actividades/${actividadId}/inhabilitar`)
          .its('status')
          .should('eq', 200);

        api('POST', '/socios', { dni: '30111224', nombre: 'Sin', apellido: 'Inactiva' })
          .its('body.id')
          .then((socioId) => {
            cy.visit(`/socios/${socioId}`);
            cy.contains('label', 'Inactiva').should('not.exist');

            api('PUT', `/socios/${socioId}/actividades`, { actividadIds: [actividadId] })
              .its('status')
              .should('eq', 400);
          });
      });
  });
});
