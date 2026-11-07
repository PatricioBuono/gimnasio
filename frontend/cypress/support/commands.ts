/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /** Inicia sesión vía API y deja el JWT en localStorage. Requiere estar en el origen de la app. */
      loginComo(username: string, password: string): Chainable<void>;
      /** Petición autenticada con el JWT de localStorage. No falla por status. */
      apiAutenticada(
        method: string,
        path: string,
        body?: Cypress.RequestBody,
      ): Chainable<Cypress.Response<unknown>>;
      /** Petición sin autenticación. No falla por status. */
      apiPublica(
        method: string,
        path: string,
        body?: Cypress.RequestBody,
      ): Chainable<Cypress.Response<unknown>>;
    }
  }
}

Cypress.Commands.add('loginComo', (username: string, password: string) => {
  cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { username, password }).then(
    (respuesta) => {
      cy.window().then((win) => win.localStorage.setItem('jwt', respuesta.body.token));
    },
  );
});

Cypress.Commands.add(
  'apiAutenticada',
  (method: string, path: string, body?: Cypress.RequestBody) => {
    return cy.window().then((win) => {
      const token = win.localStorage.getItem('jwt');
      return cy.request({
        method,
        url: `${Cypress.expose('apiUrl')}${path}`,
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        failOnStatusCode: false,
      });
    });
  },
);

Cypress.Commands.add(
  'apiPublica',
  (method: string, path: string, body?: Cypress.RequestBody) => {
    return cy.request({
      method,
      url: `${Cypress.expose('apiUrl')}${path}`,
      body,
      failOnStatusCode: false,
    });
  },
);

export {};
