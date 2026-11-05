# 2026-11-05 — Bootstrap de memoria documental y comandos de servidor

* Tarea: sin ticket (infraestructura de trabajo)
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión

## Objetivo

Dejar comandos de OpenCode para levantar/bajar el servidor y crear la capa de memoria operativa (`docs/bitacora/` + `docs/tareas/estado.md`) para recuperar contexto sin releer todo.

## Decisiones (y por qué)

* Comandos en `.opencode/commands/` (no en una carpeta «comandos»): es la única ruta que OpenCode descubre; el nombre del archivo define el comando.
* Los comandos son prompts que el agente ejecuta con el tool de shell en background. Un bloque `` !`...` `` bloquearía la sesión con un dev server.
* Alcance backend 8080 + frontend 4200. PostgreSQL 5432 queda fuera: es infraestructura, no se baja con el comando.
* Backend arranca con `-Dspring-boot.run.jvmArguments=-Duser.timezone=America/Argentina/Mendoza` para cumplir `AGENTS.md` §3.
* Fecha de las sesiones con `TimeZoneInfo` e IANA + fallback `Argentina Standard Time`: Windows PowerShell 5.1 no incluye la base IANA y el ID `America/Argentina/Mendoza` falla; el fallback mantiene UTC-3.
* Bitácora **por sesión** (no por ticket) + tablero único `tareas/estado.md`: menos archivos y lectura barata.
* Se normalizó `docs/Documentación Gimnasio.md` → `docs/documentacion_gimnasio.md` para que coincida con `AGENTS.md` (espacios y acentos rompían búsquedas).

## Hecho

* `.opencode/commands/levantar-server.md` y `bajar-server.md`.
* `docs/INDICE.md` con orden de lectura, reglas y presupuesto de tokens.
* `docs/bitacora/_plantilla.md` y esta primera sesión.
* `docs/tareas/estado.md` con F1..F5 auditado por evidencia de código/tests.
* `.opencode/commands/nueva-sesion.md` y `cerrar-sesion.md`.
* `AGENTS.md`: índice en §1, bitácora en el DoD §5, ruta corregida en §6.2 y nueva §7.

## No hecho / pendientes

* Probar `/levantar-server` y `/bajar-server` de punta a punta (requiere PostgreSQL y que los puertos estén libres).
* Instalar/configurar Cypress (bloquea F2-T5, F3-T4, F4-T5, F5-T4).
* Auditoría Gherkin escenario por escenario de lo marcado como «Hecho».
* Registrar corrida de Vitest y verificación manual de F1-T6.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `Get-ChildItem .opencode\commands` | 4 archivos `.md` presentes |
| `Get-NetTCPConnection -LocalPort 8080,4200 -State Listen` | sin salida: puertos libres al momento de la sesión |
| `Select-String backend\target\surefire-reports\*.txt -Pattern "Tests run"` | 13 suites, 0 fallos (corrida del 14/10/2026) |
| `git mv` del documento funcional | rename detectado por git (`R`) |
| `[TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow,'America/Argentina/Mendoza')` | falla en PowerShell 5.1 (`TimeZoneNotFound`); se corrigió con fallback |
| `FindSystemTimeZoneById('Argentina Standard Time')` | `2026-11-05 12:55` (-03:00), igual a `Get-Date -Format zzz` |
| `Get-ChildItem docs\bitacora` filtrando `_plantilla.md` y `## Cierre` | 1 sesión, ya cerrada; no hay bitácoras abiertas |

## Archivos tocados

* `AGENTS.md`
* `docs/INDICE.md`
* `docs/bitacora/_plantilla.md`
* `docs/bitacora/2026-11-05-bootstrap-memoria.md`
* `docs/tareas/estado.md`
* `docs/documentacion_gimnasio.md` (renombrado)
* `docs/plan_implementacion.md` (referencias)
* `.opencode/commands/levantar-server.md`
* `.opencode/commands/bajar-server.md`
* `.opencode/commands/nueva-sesion.md`
* `.opencode/commands/cerrar-sesion.md`

## Riesgos y próximos pasos

* Los comandos asumen Windows + PowerShell y puertos fijos 8080/4200. Si cambian, actualizar ambos archivos.
* Próximo paso: correr `/levantar-server`, verificar ambas URLs y luego `/bajar-server`; registrar el resultado en la próxima bitácora.

## Links

* `docs/tareas/estado.md`
* `docs/INDICE.md`
* `docs/plan_implementacion.md`

## Cierre

Cerrada el 2026-11-05 (America/Argentina/Mendoza). DoD verificado: sí, con alcance acotado: sesión de documentación e infraestructura, sin cambios de lógica de negocio; los puntos de producto de `AGENTS.md` §5 (JUnit/Vitest/Cypress) no aplican y las 4 auditorías de §6 se revisaron sin hallazgos en este alcance.
