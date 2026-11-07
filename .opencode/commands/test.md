---
description: Ejecuta los tests unitarios (JUnit/Vitest) de una funcionalidad y reporta huecos
---

Verifica con pruebas unitarias la funcionalidad indicada en `$ARGUMENTS`. Este comando **solo verifica**: no crear, editar ni borrar código de producción ni tests.

1. Valida el argumento:
   - Si `$ARGUMENTS` está vacío o es genérico («test», «probar», «todo»), pide la funcionalidad concreta y **detente sin ejecutar nada**.
   - Si el término es ambiguo (por ejemplo «pago» puede ser backend puro o el flujo de cobro del frontend), pregunta a qué te referís antes de correr nada.

2. Descubre qué pruebas existen (sin asumir nombres):
   - Backend: `backend/src/test/java/**/*.java` (clase y método).
   - Frontend: `frontend/src/**/*.spec.ts` (`describe` / `it`).
   - Gherkin: `docs/documentacion_gimnasio.md` (MA-USx / MR-USx) para saber qué escenarios *deberían* estar cubiertos.
   - Usa búsqueda por contenido (grep/Select-String) con el término recibido y sinónimos del dominio:
     `cobro|pago|mora|recargo|exoneraci[oó]n|comprobante` → `Pago*`, `Cobro*`, `cobro.spec.ts`, `pago.service.spec.ts`;
     `socio|dni|ficha|asignaci[oó]n` → `Socio*`, `registro-socio*`, `ficha-socio*`;
     `precio|cuota` → `Precio*`, `precios.spec.ts`;
     `actividad|cat[aá]logo` → `Actividad*`, `actividades.spec.ts`;
     `feriado` → `Feriado*`;
     `dashboard|estado|b[uú]squeda|filtro` → `SocioEstado*`, `Dashboard*`, `dashboard.spec.ts`;
     `login|seguridad|rol|401|403|jwt` → `Seguridad*`, `Auth*`, `login.spec.ts`, `auth.*.spec.ts`.
   - Si no aparece ninguna prueba, **no la inventes**: reportá el hueco y terminá.

3. Ejecuta el backend que corresponda, desde `backend`:
   - Clase completa: `.\mvnw.cmd test "-Dtest=NombreClase"`
   - Varias clases: `.\mvnw.cmd test "-Dtest=ClaseA,ClaseB"`
   - Método puntual: `.\mvnw.cmd test "-Dtest=NombreClase#metodo"`
   - Usá los nombres exactos descubiertos en el paso 2: surefire falla con «No tests matching pattern» si el patrón no coincide. Si eso pasa, corregí el nombre; **no** agregues `-Dsurefire.failIfNoSpecifiedTests=false` para tapar el error.
   - No agregues `-Duser.timezone`: el `argLine` de surefire ya fija `America/Argentina/Mendoza` (AGENTS.md §3). No cambies perfiles ni configuración.

4. Verifica Docker **solo** si alguna clase seleccionada usa Testcontainers (`@Testcontainers` o `PostgreSQLContainer`, p. ej. `PagoServicioIntegracionTest`, `PagoServicioConcurrenciaTest`):
   - `docker info` (o `docker version`).
   - Si Docker no responde, marca esas clases como **BLOQUEADO POR ENTORNO** y seguí con el resto. No lo reportes como fallo de código ni lo reintentes en bucle.

5. Ejecuta el frontend que corresponda, desde `frontend`:
   - `npx ng test --watch=false --include=src/app/<área>/<archivo>.spec.ts`
   - Para varios archivos, repetí `--include=` una vez por archivo.
   - Usa `ng test` (builder `@angular/build:unit-test` con runner Vitest). No uses `npx vitest run`: el proyecto no tiene `vitest.config` propio y depende del builder de Angular.
   - No instales dependencias: si falta `node_modules`, avisá y detenete.

6. Reporta resultados reales, sin inventar ni resumir de más:

   | Capa | Prueba (archivo#método) | Resultado | Detalle |
   |---|---|---|---|
   | BE | `PagoServicioTest#calcularRecargo...` | PASA / FALLA / BLOQUEADO | mensaje real |
   | FE | `cobro.spec.ts > Cobro > ...` | PASA / FALLA | mensaje real |

   - Para cada falla, copiá el mensaje de assertion o excepción y el archivo:línea.
   - Separá siempre **fallo de código** de **bloqueo de entorno** (Docker, `node_modules`, red).
   - Cerrá con una lista de **huecos de cobertura**: funcionalidad o escenario Gherkin sin test espejo.
   - Si todo pasa, decilo explícitamente y aclará que un test verde no reemplaza la auditoría Gherkin de AGENTS.md §6.
   - Prohibido escribir «funciona» sin la salida real del comando.

Reglas: no crear tests faltantes (para eso se implementa la tarea), no tocar `ddl-auto`, no usar fechas reales en tests, no ejecutar Cypress (no está instalado) y no modificar documentación desde este comando.
