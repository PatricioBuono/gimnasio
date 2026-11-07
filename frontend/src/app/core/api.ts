interface VentanaConApiE2E {
  /** Override usado por Cypress para apuntar el SPA a un backend E2E aislado. */
  __GIMNASIO_API_URL__?: string;
}

const override = (globalThis as VentanaConApiE2E).__GIMNASIO_API_URL__;

export const API_URL = override ?? 'http://localhost:8080/api';
