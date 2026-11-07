# 2026-11-06 — Desacople de excepciones y formato de comprobante

* Tarea: sin ticket (deuda de arquitectura detectada al incorporar el skill `architecture-patterns`)
* Estado al cerrar: hecho
* Duración aproximada: ~1 h

## Objetivo

Quitar de la capa de servicio las dependencias de entrega (`HttpStatus` / `ResponseStatusException`) y mover el formato `0001-XXXXXXXX` al DTO, sin alterar la arquitectura aprobada ni los contratos HTTP observables.

## Decisiones (y por qué)

* Se adopta **Clean-lite pragmático**: capas `controller → service → repository` con dependencias hacia adentro, DTOs y excepciones desacopladas. **No** se separa el ORM del dominio ni se introducen puertos/adapters: `arquitectura.md §3` define `entity` como capa JPA y el MVP prohíbe microservicios (`§1`, `§11`).
* Excepciones de dominio en `com.gimnasio.excepcion`, sin imports de Spring. El mapeo a códigos vive en un único `@RestControllerAdvice` (`ManejadorExcepciones`). Alternativa descartada: devolver `ResponseEntity` desde el servicio, que reintroduce HTTP en el núcleo.
* Mapeo: `SolicitudInvalida` 400 · `NoAutorizado` 401 · `RecursoNoEncontrado` 404 · `Conflicto` 409 · `ErrorInterno` 500. Se mantienen los mismos códigos que antes.
* El servicio entrega la secuencia cruda y `ComprobanteResponse.de(...)` aplica prefijo y ceros. Cumple `arquitectura.md §6` ("formateo solo en DTO/presentación"). Alternativa descartada: crear `ComprobanteService` solo para formatear, que agrega una capa sin valor.
* `AuthControlador` conserva `ResponseStatusException`: es borde HTTP, no dominio.
* Se mantiene el `catch (DataIntegrityViolationException)` en `PagoServicio` para traducir la violación de `UNIQUE(socio_id, periodo)` a `ConflictoException`; se registra como deuda menor.

## Hecho

* `backend/src/main/java/com/gimnasio/excepcion/`: `ExcepcionNegocio` + 5 excepciones de dominio.
* `backend/src/main/java/com/gimnasio/controlador/ManejadorExcepciones.java`: `@RestControllerAdvice` con el mapeo a 400/401/404/409/500.
* `backend/src/main/java/com/gimnasio/dto/ErrorApiResponse.java`: cuerpo `{ "mensaje": "..." }`.
* `PagoServicio`, `SocioServicio`, `ActividadServicio`, `PrecioServicio`, `FeriadoServicio`: sin `HttpStatus` ni `ResponseStatusException`.
* `backend/src/main/java/com/gimnasio/dto/ComprobanteResponse.java`: factory `de(...)` con el formato `0001-%08d`.
* Tests de servicio y de controlador actualizados a las excepciones de dominio; el advice queda ejercitado por los `@WebMvcTest`.
* `backend/src/test/java/com/gimnasio/dto/ComprobanteResponseTest.java`: 2 tests del formateo.

## No hecho / pendientes

* Value objects (`Dni`, `Money`): toca el modelo de dominio y requiere aprobación explícita (`AGENTS.md §1`).
* `AdminTestControlador` (`/api/admin/test`): residuo de Fase 1; no se eliminó porque no estaba en el alcance aprobado.
* Cypress: sigue sin instalar; F4-T5 y F5-T4 permanecen pendientes.
* `DataIntegrityViolationException` en `PagoServicio`: idealmente se traduce en el repositorio/adaptador.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `.\mvnw.cmd -q test` | 84 tests: 0 fallos, 0 errores, 9 omitidos |
| `.\mvnw.cmd -q -Dtest=ComprobanteResponseTest test` | 2/2 |

> Los 9 omitidos son `PagoServicioIntegracionTest` (`@EnabledIf("dockerDisponible")`): Docker no está disponible en esta máquina, igual que en sesiones previas. La compilación de esa clase sí pasó.

## Archivos tocados

* `backend/src/main/java/com/gimnasio/excepcion/ExcepcionNegocio.java`
* `backend/src/main/java/com/gimnasio/excepcion/SolicitudInvalidaException.java`
* `backend/src/main/java/com/gimnasio/excepcion/NoAutorizadoException.java`
* `backend/src/main/java/com/gimnasio/excepcion/RecursoNoEncontradoException.java`
* `backend/src/main/java/com/gimnasio/excepcion/ConflictoException.java`
* `backend/src/main/java/com/gimnasio/excepcion/ErrorInternoException.java`
* `backend/src/main/java/com/gimnasio/controlador/ManejadorExcepciones.java`
* `backend/src/main/java/com/gimnasio/dto/ErrorApiResponse.java`
* `backend/src/main/java/com/gimnasio/dto/ComprobanteResponse.java`
* `backend/src/main/java/com/gimnasio/servicio/PagoServicio.java`
* `backend/src/main/java/com/gimnasio/servicio/SocioServicio.java`
* `backend/src/main/java/com/gimnasio/servicio/ActividadServicio.java`
* `backend/src/main/java/com/gimnasio/servicio/PrecioServicio.java`
* `backend/src/main/java/com/gimnasio/servicio/FeriadoServicio.java`
* Tests: `SocioServicioTest`, `ActividadServicioTest`, `PrecioServicioTest`, `FeriadoServicioTest`, `PagoServicioConcurrenciaTest`, `PagoServicioIntegracionTest`, `SocioControladorTest`, `PagoControladorTest`, `ActividadControladorTest`, `PrecioControladorTest`, `ComprobanteResponseTest`
* `docs/bitacora/2026-11-06-desacople-excepciones.md`
* `docs/tareas/estado.md`

## Riesgos y próximos pasos

* El cuerpo de error cambió de `ProblemDetail`/`status` a `{ "mensaje": ... }`. El frontend solo decide por `HttpStatus`, así que no se rompió; si un consumidor externo leía el body, debe revisarse.
* Si se aprueba, eliminar `AdminTestControlador` antes de producción.
* Si se aprueba, introducir `Dni` como value object en una tarea separada con sus tests.
* Registrar en `arquitectura.md` la decisión "Clean-lite pragmático" para que futuras sesiones no intenten separar ORM y dominio.

## Links

* [Estado de tareas](../tareas/estado.md)
* [Arquitectura](../arquitectura.md)
* [Documentación funcional](../documentacion_gimnasio.md)
* [AGENTS.md](../../AGENTS.md)
