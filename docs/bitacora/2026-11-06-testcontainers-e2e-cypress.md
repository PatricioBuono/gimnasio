# 2026-11-06 — Testcontainers, Cypress E2E y cierre de la auditoría

* Tarea: `F1-T6`, `F2-T5`, `F3-T4`, `F4-T5`, `F5-T4` + deuda de arquitectura
* Estado al cerrar: hecho
* Duración aproximada: ~4 h

## Objetivo

Implementar lo pendiente de la auditoría `architecture-patterns`: documentar el estilo Clean-lite, activar los tests de integración con Testcontainers, montar Cypress E2E sobre el stack real, eliminar el controlador de prueba de Fase 1 y dejar evaluados los value objects.

## Decisiones (y por qué)

* **Clean-lite pragmático** documentado en `arquitectura.md §3.1`: dependencias hacia adentro (`controller → service → repository`), excepciones de dominio sin HTTP y DTOs; **no** se separan entidades JPA ni se agregan puertos/adapters en el MVP.
* Se eliminó `AdminTestControlador` (`/api/admin/test`). `SeguridadControlAccesoTest` ahora prueba el endpoint real `/api/admin/actividades` con 401/403/200, sin endpoints residuales en producción.
* **Testcontainers**: `PagoServicioIntegracionTest` ya no se omite. Se agregó `backend/src/test/resources/docker-java.properties` con `api.version=1.40` porque Docker 29 rechaza la API 1.32 que usa por defecto `docker-java` 3.3.6. El archivo es solo de test.
* **Cypress full-stack, sin mocks**: SPA `4200` + backend E2E `8081` + PostgreSQL 16 aislado en `55432`. Las tareas de Node (`pg`) siembran fechas relativas deterministas y consultan la auditoría directamente en la base.
* El backend de desarrollo (`8080`, PID 12840) y su base no se tocaron. El E2E usa una instancia y una base propias para evitar truncar datos reales.
* **Costura de API para E2E**: `frontend/src/app/core/api.ts` lee `globalThis.__GIMNASIO_API_URL__`; si existe, reemplaza la URL por defecto. Cypress la inyecta en `onBeforeLoad` mediante un `overwrite` de `cy.visit`, sin recompilar el frontend ni cambiar el bundle de producción.
* **Cypress 16**: `Cypress.env()` fue removido; se migró a `Cypress.expose('apiUrl')` y al bloque `expose` de `cypress.config.ts`.
* **Limpieza de base E2E**: `limpiarBase` trunca `comprobante, pago, socio_actividad, socio, actividad`, reinicia `comprobante_seq` y conserva admin, precios y feriados. Se agregó una guarda que rechaza truncar cualquier PostgreSQL que no esté en `:55432` salvo `CYPRESS_ALLOW_DB_RESET=true`.
* **Bug de seguridad encontrado por E2E**: `/error` estaba protegido por `.anyRequest().authenticated()`. El error dispatch interno es anónimo, así que un 400 de validación o un 403 de rol terminaba devolviendo 401. Se permitió `/error` y se agregó un `accessDeniedHandler` explícito que devuelve 403. Verificado con curl: 401 sin token, 403 con recepcionista, 400 con DNI inválido, 201 con alta válida.
* **MR-US2 esc. 2**: el Gherkin pide mostrar el comprobante existente al detectar el período duplicado. El backend actual devuelve 409 sin el comprobante y la UI muestra `El período ya está pagado.`. El E2E verifica el comportamiento actual y la brecha queda documentada; no se cambió lógica de negocio sin aprobación.
* **Comprobante exonerado**: cuando el recargo queda en 0, el comprobante oculta la línea de recargo; el importe original tachado (`.tachado`) solo aparece en la vista previa. El test verifica el sello `Recargo Bonificado`, total = cuota y ausencia de `.tachado` en el comprobante final. Queda como brecha de representación.
* **C (value objects `Dni`/`Money`)**: diferido a V2 por decisión explícita del usuario (2026-11-06). No se toca el modelo de dominio en esta sesión; queda como deuda con tests propios para cuando se aborde.

## Hecho

* Backend: jerarquía `com.gimnasio.excepcion` + `ManejadorExcepciones`; servicios sin imports de `org.springframework.http`/`ResponseStatusException`.
* `ComprobanteResponse.de(...)` concentra el formato `0001-%08d`; `PagoServicio` entrega la secuencia cruda.
* `SecurityConfig`: `/error` permitido, `accessDeniedHandler` 403, `authenticationEntryPoint` 401.
* `AdminTestControlador` eliminado; `SeguridadControlAccesoTest` apunta a `ActividadControlador`.
* `PagoServicioIntegracionTest` con Testcontainers PostgreSQL 16 (9 tests).
* Frontend: `cypress.config.ts`, `cypress/support/{e2e,commands,periodo,tipos}.ts`, `cypress/tsconfig.json` y 5 specs.
* Specs: `login.cy.ts` (5), `actividades.cy.ts` (3), `socios.cy.ts` (5), `cobro.cy.ts` (6), `dashboard.cy.ts` (4).
* `frontend/src/app/core/api.ts`: costura `__GIMNASIO_API_URL__`.
* `frontend/package.json`: scripts `cypress:open` y `cypress:run`; `pg` y Cypress como devDependencies.
* `frontend/.gitignore`: artefactos de Cypress.
* `docs/arquitectura.md §3.1`: decisión Clean-lite.

## No hecho / pendientes

* Value objects `Dni`/`Money` (C): diferidos a V2 por decisión del usuario.
* MR-US2 esc. 2: el 409 no devuelve el comprobante existente; falta endpoint/consulta y decisión de contrato.
* Comprobante exonerado: no muestra el recargo original tachado; solo el sello y el total.
* `npx vitest run` directo no inicializa `TestBed` (Angular 20 usa el builder `@angular/build:unit-test`). El comando correcto es `npx ng test --watch=false`; se dejó anotado, sin modificar `AGENTS.md`.
* Cypress corre con Electron, que está deprecado; migrar a Chrome en la próxima actualización.
* Quedan cambios locales previos ajenos a esta sesión: `application.properties`, `.opencode/`, `.agents/`, `skills-lock.json`, `backend/mvn-test.log`.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `.\mvnw.cmd -B test` | 84/84, 0 fallos, 0 errores, 0 omitidos; `PagoServicioIntegracionTest` 9/9 con Testcontainers PG 16 |
| `npx ng test --watch=false` | 18 archivos, 92/92 tests Vitest |
| `npm run build` | OK, bundle de producción generado |
| `npx cypress run` | 5 specs, 23/23 escenarios (login 5, actividades 3, socios 5, cobro 6, dashboard 4) |
| `npx tsc -p cypress/tsconfig.json --noEmit` | OK |
| Verificación manual API | 401 sin token · 403 recepcionista en `/api/admin` · 400 DNI inválido · 201 alta válida |

## Archivos tocados

* `backend/src/main/java/com/gimnasio/controlador/AdminTestControlador.java` (eliminado)
* `backend/src/main/java/com/gimnasio/controlador/ManejadorExcepciones.java`
* `backend/src/main/java/com/gimnasio/dto/ErrorApiResponse.java`
* `backend/src/main/java/com/gimnasio/dto/ComprobanteResponse.java`
* `backend/src/main/java/com/gimnasio/excepcion/` (6 clases)
* `backend/src/main/java/com/gimnasio/seguridad/SecurityConfig.java`
* `backend/src/main/java/com/gimnasio/servicio/{Pago,Socio,Actividad,Precio,Feriado}Servicio.java`
* `backend/src/test/java/com/gimnasio/controlador/{Actividad,Pago,Precio,Socio}ControladorTest.java`
* `backend/src/test/java/com/gimnasio/seguridad/SeguridadControlAccesoTest.java`
* `backend/src/test/java/com/gimnasio/servicio/{Pago,Socio,Actividad,Precio,Feriado}*Test.java`
* `backend/src/test/java/com/gimnasio/dto/ComprobanteResponseTest.java`
* `backend/src/test/resources/docker-java.properties`
* `frontend/cypress.config.ts`
* `frontend/cypress/tsconfig.json`
* `frontend/cypress/support/{e2e,commands,periodo,tipos}.ts`
* `frontend/cypress/e2e/{login,actividades,socios,cobro,dashboard}.cy.ts`
* `frontend/src/app/core/api.ts`
* `frontend/package.json`, `frontend/package-lock.json`, `frontend/.gitignore`
* `docs/arquitectura.md`, `docs/tareas/estado.md`, esta bitácora

## Riesgos y próximos pasos

* El E2E trunca la base: la guarda de `:55432` es obligatoria; nunca apuntar `DATABASE_URL` a la base de desarrollo.
* La costura `__GIMNASIO_API_URL__` viaja en el bundle de producción; es inofensiva, pero en V2 conviene reemplazarla por configuración de runtime.
* La brecha del comprobante en 409 y la del recargo tachado son decisiones funcionales pendientes; no bloquearon los flujos críticos.
* Próximo paso sugerido: decidir el contrato de MR-US2 esc. 2 (comprobante existente en el 409) y planificar C para V2.

## Cómo reproducir el E2E

```powershell
# 1) PostgreSQL aislado (se puede borrar al terminar)
docker rm -f gimnasio-e2e-pg 2>$null
docker run --name gimnasio-e2e-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gimnasio -p 55432:5432 -d postgres:16

# 2) Backend E2E en 8081 (Flyway migra la base al arrancar)
cd backend
$env:DB_PASSWORD="postgres"
$env:SERVER_PORT="8081"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:55432/gimnasio?options=-c%20TimeZone%3DAmerica/Argentina/Mendoza"
.\mvnw.cmd spring-boot:run

# 3) Frontend en 4200 (en otra terminal)
cd frontend
npm start

# 4) Cypress
cd frontend
$env:DATABASE_URL="postgres://postgres:postgres@localhost:55432/gimnasio"
npm run cypress:run
```

> El backend de desarrollo en `8080` no se usa ni se toca. `limpiarBase` rechaza cualquier base que no esté en `:55432` salvo que se defina `CYPRESS_ALLOW_DB_RESET=true`.

## Links

* [Estado de tareas](../tareas/estado.md)
* [Arquitectura](../arquitectura.md)
* [Documentación funcional](../documentacion_gimnasio.md)
* [Sesión anterior: desacople de excepciones](2026-11-06-desacople-excepciones.md)
* [AGENTS.md](../../AGENTS.md)
