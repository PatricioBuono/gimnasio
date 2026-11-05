# Estado de tareas

Vista de una página del backlog definido en `plan_implementacion.md`.
Última actualización: 2026-11-05.

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
| F1-T6 | QA migraciones + login admin + 401/403 | Parcial | Tests de seguridad pasan (14/10/2026); sin registro de verificación manual | — |
| F2-T1 | CRUD actividades (inhabilitar, 409 duplicado) | Hecho | `ActividadControlador`, `ActividadServicio`, tests | — |
| F2-T2 | Parámetros de precio y recargo | Hecho | `PrecioControlador`, `PrecioServicio`, tests | — |
| F2-T3 | ABM feriados | Hecho | `FeriadoControlador`, `FeriadoServicio`, tests | — |
| F2-T4 | FE pantallas de actividades y precios | Hecho | `frontend/src/app/actividades/`, `precios/` + specs | — |
| F2-T5 | QA Gherkin MA-US1..3 | Parcial | JUnit presente; sin Cypress ni matriz Gherkin | — |
| F3-T1 | Alta socio con DNI único y normalizado | Hecho | `SocioServicio`, `SocioControlador`, tests | — |
| F3-T2 | Asignación 1..N actividades activas | Hecho | `SocioServicio`, `SocioActividadRepositorio`, tests | — |
| F3-T3 | FE nuevo socio + ficha | Hecho | `frontend/src/app/socios/registro-socio.*`, `ficha-socio.*` + specs | — |
| F3-T4 | QA Gherkin MR-US1 / MR-US3 | Parcial | JUnit presente; sin Cypress | — |
| F4-T1 | `FechaService`: fecha límite, mora, feriados | Hecho | `util/FechaService.java`, `FechaServiceTest` | — |
| F4-T2 | `PagoService @Transactional` + secuencia comprobante | Hecho | `PagoServicio`, `PagoServicioIntegracionTest`, `PagoServicioConcurrenciaTest` | — |
| F4-T3 | Exoneración con motivo y auditoría | Hecho | `PagoServicio` (`Recargo Bonificado`), `PagoControladorTest` | — |
| F4-T4 | FE pantalla de cobro y recálculo | Hecho | `frontend/src/app/cobros/cobro.*` + spec | [2026-11-05-rediseno-cobro.md](../bitacora/2026-11-05-rediseno-cobro.md) |
| F4-T5 | Cypress: cobro, mora, exoneración, comprobante | Pendiente | Cypress no instalado ni configurado | — |
| F5-T1 | Endpoint dashboard por estado | Hecho | `SocioEstadoServicio`, `SocioEstadoServicioTest` | — |
| F5-T2 | Búsqueda DNI + `pg_trgm` con `LIMIT 20` | Hecho | `SocioControlador#buscar`, `SocioRepositorio` | — |
| F5-T3 | FE dashboard, debounce y filtro por actividad | Hecho | `frontend/src/app/dashboard/dashboard.ts` + spec | — |
| F5-T4 | Cypress: dashboard, orden, búsqueda, filtro | Pendiente | Cypress no instalado ni configurado | — |

## Infraestructura de trabajo

| Tarea | Alcance corto | Estado | Evidencia | Sesión |
|---|---|---|---|---|
| INFRA-1 | Comandos de servidor + memoria documental | Hecho | `.opencode/commands/`, `docs/INDICE.md`, `docs/bitacora/` | [2026-11-05-bootstrap-memoria.md](../bitacora/2026-11-05-bootstrap-memoria.md) |
| INFRA-2 | Comando `/test <funcionalidad>` de verificación unitaria BE/FE | Hecho | `.opencode/commands/test.md`, `docs/INDICE.md` | [2026-11-05-comando-test.md](../bitacora/2026-11-05-comando-test.md) |
| INFRA-3 | Comando `/subir-cambios` de commit + push seguro a GitHub | Hecho | `.opencode/commands/subir-cambios.md`, `docs/INDICE.md` | [2026-11-05-comando-subir-cambios.md](../bitacora/2026-11-05-comando-subir-cambios.md) |

## Brechas abiertas

1. **Cypress**: no está instalado ni configurado; F2-T5, F3-T4, F4-T5 y F5-T4 no pueden cerrarse según `AGENTS.md` §5/§6.
2. **Auditoría Gherkin**: los estados «Hecho» se basan en presencia de código y tests, no en la verificación escenario por escenario.
3. **Frontend**: specs de Vitest de Cobro (15/15), Precios (8/8) y App (2/2) pasan; la suite completa no se corrió por OOM en 8 GB.
4. **F1-T6**: falta evidencia de la prueba manual de login y 401/403.

## Nota de mantenimiento

Actualizar esta tabla al cerrar cada sesión con `/cerrar-sesion`. La columna «Sesión» enlaza a `docs/bitacora/YYYY-MM-DD-tema.md`; «—» indica trabajo previo a la existencia de la bitácora.
