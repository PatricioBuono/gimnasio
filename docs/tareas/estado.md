# Estado de tareas

Vista de una página del backlog definido en `plan_implementacion.md`.
Última actualización: 2026-11-06.

Vocabulario:

* **Hecho**: código y tests presentes. No reemplaza la auditoría Gherkin punto por punto de `AGENTS.md` §6.
* **Parcial**: implementado sin evidencia completa (Gherkin / E2E).
* **Pendiente**: sin implementar.
* **Bloqueado**: requiere una decisión del usuario.

| Tarea | Alcance corto | Estado | Evidencia | Sesión |
|---|---|---|---|---|
| F1-T1 | Migración `V1__init.sql` (tablas, constraints, índices) | Hecho | `backend/src/main/resources/db/migration/V1__init.sql` | — |
| F1-T2 | Seed admin maestro con BCrypt | Hecho | `V1__init.sql` (bloque admin) | — |
| F1-T3 | Setup Spring Boot, TZ Mendoza, Flyway, JPA validate | Hecho | `pom.xml`, `application.properties`, `config/ZonaHorariaConfig.java` | — |
| F1-T4 | Auth JWT stateless + roles | Hecho | `seguridad/`, `controlador/AuthControlador.java`, `SeguridadControlAccesoTest` | — |
| F1-T5 | Setup Angular + interceptor JWT + guard por rol | Hecho | `frontend/src/app/app.config.ts`, `core/auth.interceptor.ts`, `core/auth.guard.ts` | — |
| F1-T6 | QA migraciones + login admin + 401/403 | Hecho | `frontend/cypress/e2e/login.cy.ts` (5 escenarios reales) + `SeguridadControlAccesoTest` | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |
| F2-T1 | CRUD actividades (inhabilitar, 409 duplicado) | Hecho | `ActividadControlador`, `ActividadServicio`, tests | — |
| F2-T2 | Parámetros de precio y recargo | Hecho | `PrecioControlador`, `PrecioServicio`, tests | — |
| F2-T3 | ABM feriados | Hecho | `FeriadoControlador`, `FeriadoServicio`, tests | — |
| F2-T4 | FE pantallas de actividades y precios | Hecho | `frontend/src/app/actividades/` (rediseño de catálogo y ficha), `precios/` (rediseño de tarifario) + specs | [2026-11-06-rediseno-actividades.md](../bitacora/2026-11-06-rediseno-actividades.md) · [2026-11-06-ajuste-encabezados.md](../bitacora/2026-11-06-ajuste-encabezados.md) · [2026-11-06-rediseno-precios.md](../bitacora/2026-11-06-rediseno-precios.md) |
| F2-T5 | QA Gherkin MA-US1..3 | Hecho | JUnit + `frontend/cypress/e2e/actividades.cy.ts` (3 escenarios) | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |
| F3-T1 | Alta socio con DNI único y normalizado | Hecho | `SocioServicio`, `SocioControlador`, tests | — |
| F3-T2 | Asignación 1..N actividades activas | Hecho | `SocioServicio`, `SocioActividadRepositorio`, tests | — |
| F3-T3 | FE nuevo socio + ficha | Hecho | `frontend/src/app/socios/registro-socio.*` (rediseño de alta), `ficha-socio.*` + specs | [2026-11-06-rediseno-nuevo-socio.md](../bitacora/2026-11-06-rediseno-nuevo-socio.md) |
| F3-T4 | QA Gherkin MR-US1 / MR-US3 | Hecho | JUnit + `frontend/cypress/e2e/socios.cy.ts` (5 escenarios) | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |
| F4-T1 | `FechaService`: fecha límite, mora, feriados | Hecho | `util/FechaService.java`, `FechaServiceTest` | — |
| F4-T2 | `PagoService @Transactional` + secuencia comprobante | Hecho | `PagoServicio`, `PagoServicioIntegracionTest`, `PagoServicioConcurrenciaTest` | — |
| F4-T3 | Exoneración con motivo y auditoría | Hecho | `PagoServicio` (`Recargo Bonificado`), `PagoControladorTest` | — |
| F4-T4 | FE pantalla de cobro y recálculo | Hecho | `frontend/src/app/cobros/cobro.*` + spec | [2026-11-05-rediseno-cobro.md](../bitacora/2026-11-05-rediseno-cobro.md) |
| F4-T5 | Cypress: cobro, mora, exoneración, comprobante | Hecho | `frontend/cypress/e2e/cobro.cy.ts` (6 escenarios) + `PagoServicioIntegracionTest` (9, Testcontainers) | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |
| F5-T1 | Endpoint dashboard por estado | Hecho | `SocioEstadoServicio`, `SocioEstadoServicioTest` | — |
| F5-T2 | Búsqueda DNI + `pg_trgm` con `LIMIT 20` | Hecho | `SocioControlador#buscar`, `SocioRepositorio` | — |
| F5-T3 | FE dashboard, debounce y filtro por actividad | Hecho | `frontend/src/app/dashboard/dashboard.*`, `layout/private-layout.*`, `public/marca-hulk.jpg` + specs | [2026-11-06-rediseno-dashboard.md](../bitacora/2026-11-06-rediseno-dashboard.md) · [2026-11-06-ajuste-encabezados.md](../bitacora/2026-11-06-ajuste-encabezados.md) |
| F5-T4 | Cypress: dashboard, orden, búsqueda, filtro | Hecho | `frontend/cypress/e2e/dashboard.cy.ts` (4 escenarios) | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |

## Infraestructura de trabajo

| Tarea | Alcance corto | Estado | Evidencia | Sesión |
|---|---|---|---|---|
| INFRA-1 | Comandos de servidor + memoria documental | Hecho | `.opencode/commands/`, `docs/INDICE.md`, `docs/bitacora/` | [2026-11-05-bootstrap-memoria.md](../bitacora/2026-11-05-bootstrap-memoria.md) |
| INFRA-2 | Comando `/test <funcionalidad>` de verificación unitaria BE/FE | Hecho | `.opencode/commands/test.md`, `docs/INDICE.md` | [2026-11-05-comando-test.md](../bitacora/2026-11-05-comando-test.md) |
| INFRA-3 | Comando `/subir-cambios` de commit + push seguro a GitHub | Hecho | `.opencode/commands/subir-cambios.md`, `docs/INDICE.md` | [2026-11-05-comando-subir-cambios.md](../bitacora/2026-11-05-comando-subir-cambios.md) |
| INFRA-4 | Desacople HTTP de servicios + formato de comprobante en DTO | Hecho | `excepcion/`, `controlador/ManejadorExcepciones.java`, `dto/ComprobanteResponse.java`, `ComprobanteResponseTest` | [2026-11-06-desacople-excepciones.md](../bitacora/2026-11-06-desacople-excepciones.md) |
| INFRA-5 | Testcontainers + Cypress E2E full-stack | Hecho | `backend/src/test/resources/docker-java.properties`, `frontend/cypress.config.ts`, `frontend/cypress/`; 84 tests BE y 23 E2E | [2026-11-06-testcontainers-e2e-cypress.md](../bitacora/2026-11-06-testcontainers-e2e-cypress.md) |

## Brechas abiertas

1. **MR-US2 esc. 2**: el backend devuelve 409 sin el comprobante existente y la UI muestra `El período ya está pagado.`; falta decidir si el contrato debe incluir el comprobante. El E2E verifica el comportamiento actual.
2. **Comprobante exonerado**: el importe original del recargo no se muestra tachado en el comprobante final (solo en la vista previa); queda el sello `Recargo Bonificado` y total = cuota. Es una brecha de representación, no de cálculo.
3. **Value objects `Dni`/`Money` (C)**: diferidos a V2 por decisión del usuario (2026-11-06); no se toca el modelo de dominio en el MVP.
4. **Vitest directo**: `npx vitest run` no inicializa `TestBed` con Angular 20; usar `npx ng test --watch=false`. La suite completa pasa 92/92.
5. **Cypress/Electron**: Cypress 16 marca Electron como deprecado; migrar a Chrome en la próxima actualización.
6. **Auditoría Gherkin**: los flujos críticos ya tienen espejo E2E; los escenarios restantes siguen apoyados en JUnit/Vitest, sin matriz escenario-por-escenario.

## Nota de mantenimiento

Actualizar esta tabla al cerrar cada sesión con `/cerrar-sesion`. La columna «Sesión» enlaza a `docs/bitacora/YYYY-MM-DD-tema.md`; «—» indica trabajo previo a la existencia de la bitácora.
