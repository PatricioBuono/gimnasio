import './commands';

// No se silencian excepciones: si la app rompe, el test debe fallar.

/**
 * Los specs corren contra el backend E2E aislado (puerto 8081), no contra el
 * backend de desarrollo (8080). La costura está en `core/api.ts`: la app lee
 * `window.__GIMNASIO_API_URL__` al arrancar. Se inyecta en cada navegación
 * completa sin tener que recompilar el frontend.
 */
type Visitar = (
  url: string,
  options?: Partial<Cypress.VisitOptions>,
) => Cypress.Chainable<Cypress.AUTWindow>;

// El cast evita la ambigüedad de las sobrecargas de Cypress 16 para `overwrite`.
Cypress.Commands.overwrite('visit', ((
  originalFn: Visitar,
  url: string,
  options?: Partial<Cypress.VisitOptions>,
) => {
  const opciones: Partial<Cypress.VisitOptions> = { ...(options ?? {}) };
  const onBeforeLoadOriginal = opciones.onBeforeLoad;

  opciones.onBeforeLoad = (win, ...rest) => {
    (win as Window & { __GIMNASIO_API_URL__?: string }).__GIMNASIO_API_URL__ =
      Cypress.expose('apiUrl');
    onBeforeLoadOriginal?.apply(win, [win, ...rest] as never);
  };

  return originalFn(url, opciones);
}) as never);
