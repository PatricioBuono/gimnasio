# 2026-11-05 — Comando `/test` para verificación unitaria por funcionalidad

* Tarea: sin ticket (infraestructura de trabajo)
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión

## Objetivo

Crear un comando de OpenCode que reciba una funcionalidad y ejecute únicamente los tests unitarios backend/frontend que la cubren, reportando resultados reales y huecos de cobertura.

## Decisiones (y por qué)

* Nombre `/test <funcionalidad>` — corto, técnico y consistente con el resto de comandos del proyecto.
* El comando **solo verifica**: no crea tests faltantes. Crear cobertura es implementar la tarea, no auditar; mezclarlo volvería el resultado ambiguo.
* Descubrimiento dinámico por grep/`Select-String` sobre clases JUnit y specs Vitest, con diccionario de sinónimos del dominio. Evita mantener un mapa hardcodeado que se desactualice.
* Frontend con `npx ng test --watch=false --include=...` y no `npx vitest run`: el proyecto no tiene `vitest.config` propio; los specs corren a través del builder `@angular/build:unit-test` (runner Vitest) configurado en `angular.json`.
* Backend con `-Dtest=Clase#metodo`. Surefire 3.2.5 falla si el patrón no coincide, así que el comando exige nombres exactos y prohíbe `-Dsurefire.failIfNoSpecifiedTests=false`, que taparía errores de tipeo.
* Testcontainers se trata como posible **bloqueo de entorno** (Docker), separado de un fallo de código, para no ensuciar el diagnóstico.
* Se actualizó `docs/INDICE.md` porque el mapa de comandos de sesión debe listar el comando nuevo (AGENTS.md §7).

## Hecho

* `.opencode/commands/test.md`: validación de argumento, descubrimiento BE/FE/Gherkin, ejecución filtrada, chequeo de Docker y tabla de reporte con huecos.
* `docs/INDICE.md`: `/test <funcionalidad>` agregado a «Comandos de sesión».
* `docs/tareas/estado.md`: fila `INFRA-2` con evidencia y enlace a esta bitácora.

## No hecho / pendientes

* No se corrieron los flujos Testcontainers: dependen de Docker y quedan fuera de esta verificación.
* No se ejecutó Cypress (no está instalado).
* `AGENTS.md` §4 documenta `npx vitest run`; este comando usa `ng test` porque es el camino real del builder de Angular. Queda pendiente decidir con el usuario si se corrige §4 (no se tocó AGENTS.md sin aprobación).

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false --include=src/app/core/auth.service.spec.ts` (en `frontend`) | 1 archivo, 2 tests pasaron; 15,75 s; exit 0 |
| `.\mvnw.cmd test "-Dtest=PrecioServicioTest" -q` (en `backend`) | exit 0 |
| `.\mvnw.cmd test "-Dtest=PagoServicioTest" -q` (en `backend`) | exit 1: «No tests matching pattern "PagoServicioTest"»; el nombre no existe (sí existen `PagoServicioIntegracionTest` y `PagoServicioConcurrenciaTest`). Se endureció el comando con la regla de nombres exactos |
| `$tz = ... FindSystemTimeZoneById('America/Argentina/Mendoza') ... ConvertTimeFromUtc` | `2026-11-05 13:06` (-03:00) |

## Archivos tocados

* `.opencode/commands/test.md`
* `docs/INDICE.md`
* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-05-comando-test.md`

## Riesgos y próximos pasos

* El comando asume Windows + PowerShell y los nombres de clases/specs actuales; si se renombran, el descubrimiento lo resuelve, pero los ejemplos del texto quedan desactualizados.
* Un test verde no reemplaza la auditoría Gherkin escenario por escenario de `AGENTS.md` §6.
* Próximo paso: usar `/test <funcionalidad>` en la próxima tarea y registrar en la bitácora si el reporte de huecos resulta útil o hay que ajustar el formato.

## Links

* `docs/tareas/estado.md`
* `docs/INDICE.md`
* `docs/documentacion_gimnasio.md`

## Cierre

Cerrada el 2026-11-05 (America/Argentina/Mendoza). DoD verificado: sí, con alcance acotado a infraestructura de trabajo: no hubo cambios de lógica de negocio, por lo que los puntos de producto de `AGENTS.md` §5 (JUnit/Vitest/Cypress) no aplican; las 4 auditorías de §6 se revisaron sin hallazgos en este alcance.
