/// <reference types="cypress" />

/**
 * F2-T5 — Catálogo de actividades: alta, edición, inhabilitación y borrado.
 * MA-US2 y MA-US3.
 */
describe('F2-T5 — Catálogo de actividades', () => {
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

  it('crea, edita, inhabilita, habilita y elimina una actividad', () => {
    cy.visit('/actividades');

    cy.get('input[formcontrolname="nombre"]').type('Musculación');
    cy.get('textarea[formcontrolname="descripcion"]').type('Fuerza');
    cy.contains('button', 'Crear actividad').click();

    cy.contains('[role="status"]', 'Actividad "Musculación" creada').should('be.visible');
    cy.contains('li.actividad-fila', 'Musculación').should('contain.text', 'Activa');

    cy.get('button[aria-label="Editar Musculación"]').click();
    cy.get('input[formcontrolname="nombre"]').clear().type('Musculación II');
    cy.contains('button', 'Guardar cambios').click();

    cy.contains('[role="status"]', 'Actividad "Musculación II" actualizada').should('be.visible');
    cy.contains('li.actividad-fila', 'Musculación II').should('contain.text', 'Activa');

    cy.get('button[aria-label="Inhabilitar Musculación II"]').click();
    cy.contains('[role="status"]', 'Actividad "Musculación II" inhabilitada').should('be.visible');
    cy.contains('li.actividad-fila', 'Musculación II').should('contain.text', 'Inactiva');

    cy.get('button[aria-label="Habilitar Musculación II"]').click();
    cy.contains('[role="status"]', 'Actividad "Musculación II" habilitada').should('be.visible');
    cy.contains('li.actividad-fila', 'Musculación II').should('contain.text', 'Activa');

    cy.get('button[aria-label="Eliminar Musculación II"]').click();
    cy.get('dialog[open]').should('contain.text', 'Eliminar Musculación II');
    cy.contains('dialog[open] button', 'Eliminar').click();

    cy.contains('[role="status"]', 'Actividad "Musculación II" eliminada').should('be.visible');
    cy.contains('li.actividad-fila', 'Musculación II').should('not.exist');
  });

  it('rechaza nombres duplicados sin distinguir mayúsculas ni espacios', () => {
    api('POST', '/admin/actividades', { nombre: 'Crossfit', descripcion: null })
      .its('status')
      .should('eq', 201);

    cy.visit('/actividades');
    cy.get('input[formcontrolname="nombre"]').type('  crossfit  ');
    cy.contains('button', 'Crear actividad').click();

    cy.get('[role="alert"]').should(
      'contain.text',
      'Ya existe una actividad con ese nombre',
    );
  });

  it('impide eliminar una actividad con socios asignados y sugiere inhabilitar', () => {
    api('POST', '/admin/actividades', { nombre: 'Crossfit', descripcion: null })
      .its('body.id')
      .then((actividadId) => {
        api('POST', '/socios', { dni: '30111225', nombre: 'Con', apellido: 'Actividad' })
          .its('body.id')
          .then((socioId) => {
            api('PUT', `/socios/${socioId}/actividades`, { actividadIds: [actividadId] })
              .its('status')
              .should('eq', 200);

            cy.visit('/actividades');
            cy.get('button[aria-label="Eliminar Crossfit"]').click();
            cy.contains('dialog[open] button', 'Eliminar').click();

            cy.get('[role="alert"]').should(
              'contain.text',
              'La actividad tiene socios asignados: inhabilítela en lugar de eliminarla',
            );
            cy.contains('li.actividad-fila', 'Crossfit').should('be.visible');
          });
      });
  });
});
