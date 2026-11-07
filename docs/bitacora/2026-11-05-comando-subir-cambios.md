# 2026-11-05 — Comando `/subir-cambios` para commit y push a GitHub

* Tarea: sin ticket (infraestructura de trabajo)
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión

## Objetivo

Crear un comando de OpenCode que commitee los cambios seleccionados y los suba a `origin`, con guardas contra secretos, force-push y commits accidentales.

## Decisiones (y por qué)

* Nombre `/subir-cambios` — consistente con `/levantar-server`, `/bajar-server` y `/cerrar-sesion`.
* **Un commit con confirmación** del mensaje: el árbol actual mezcla backend, frontend y docs, pero separar por área en varios commits se vuelve lento y propenso a errores; un commit revisable es más simple y reversible.
* **No ejecutar tests** desde este comando: la verificación unitaria ya tiene `/test`; mezclar git con tests haría el push lento y dependiente de Docker (Testcontainers).
* Escaneo de secretos antes de commitear: el repo tiene credenciales de base en `application.properties` y no hay hook que las detecte. El comando frena ante credenciales literales y exige confirmación explícita.
* Nunca `git add -A` ni `git add .`: con 185 archivos untracked (`.opencode/`, `.agents/`, `skills-lock.json`) un add global arrastraría contenido no revisado. Se agregan rutas explícitas.
* Sin `--force` ni `--amend`: el remoto es compartido (`origin/develop`); un force puede destruir historia.
* Sin creación de PR: `gh` no está instalado en el entorno (verificado).
* Mensajes con el formato ya usado en el historial: Conventional Commits en español (`feat(frontend): ...`, `style(frontend): ...`).

## Hecho

* `.opencode/commands/subir-cambios.md`: mensaje opcional, preflight de rama/remoto/fetch, selección explícita, escaneo de secretos, commit y push seguros, reporte final.
* `docs/INDICE.md`: `/subir-cambios [mensaje]` agregado a «Comandos de sesión».
* `docs/tareas/estado.md`: fila `INFRA-3` con evidencia y enlace a esta bitácora.

## No hecho / pendientes

* No se ejecutó un push real: el árbol tiene trabajo sin revisar y subirlo sin autorización violaría el objetivo del comando. La validación fue con `git add --dry-run` (no modifica el índice).
* `backend/src/main/resources/application.properties` sigue con `spring.datasource.password=1234` hardcodeado. Debe volver a `${DB_PASSWORD:changeme}` o usarse variable de entorno; el comando lo va a bloquear hasta resolverlo.
* No hay hook de pre-commit; el escaneo de secretos vive solo en el prompt del comando.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `git remote -v` | `origin` → `https://github.com/PatricioBuono/gimnasio.git` (fetch/push) |
| `git branch -vv` | rama actual `develop` trackeando `origin/develop`; también existe `main` |
| `git log --oneline -10` | convención confirmada: `feat(frontend): ...`, `feat(backend): ...`, `style(frontend): ...` |
| `git config --get user.name` / `user.email` | `Patricio Buono` / `patriciobuono5@gmail.com` |
| `gh --version` | no instalado (`CommandNotFoundException`) |
| `git add --dry-run -u` | 12 archivos trackeados modificados, sin ignorados |
| `git add --dry-run .opencode docs .agents skills-lock.json frontend/src/app/core/formato.ts` | rutas válidas; aparecen los untracked esperados (`.opencode/commands/subir-cambios.md`, `docs/`, `.agents/`) |
| `git rev-parse --abbrev-ref '@{u}'` | `origin/develop` (la rama tiene upstream) |
| `(Get-Content docs\INDICE.md).Count` | 53 líneas (≤ 80) |

## Archivos tocados

* `.opencode/commands/subir-cambios.md`
* `docs/INDICE.md`
* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-05-comando-subir-cambios.md`

## Riesgos y próximos pasos

* El comando asume Windows + PowerShell y remoto `origin`. Si se agrega `gh`, se puede extender para abrir PR.
* El árbol actual tiene un secreto hardcodeado: resolverlo antes de usar `/subir-cambios`, o el comando va a frenar (comportamiento deseado).
* Próximo paso: corregir `application.properties`, ejecutar `/test` sobre las áreas tocadas y recién entonces `/subir-cambios`.

## Links

* `docs/tareas/estado.md`
* `docs/INDICE.md`
* `docs/bitacora/2026-11-05-comando-test.md`

## Cierre

Cerrada el 2026-11-05 (America/Argentina/Mendoza). DoD verificado: sí, con alcance acotado a infraestructura de trabajo: no hubo cambios de lógica de negocio, por lo que los puntos de producto de `AGENTS.md` §5 (JUnit/Vitest/Cypress) no aplican; las 4 auditorías de §6 se revisaron sin hallazgos en este alcance.

## Nota posterior (2026-11-05, America/Argentina/Mendoza)

* Se resolvió el pendiente del secreto: `backend/src/main/resources/application.properties` pasó de `spring.datasource.password=1234` a `spring.datasource.password=${DB_PASSWORD:changeme}`. Motivo: evitar una credencial literal en el repo y permitir que `/subir-cambios` no bloquee el commit. Verificado con `Select-String`: no quedan credenciales literales; el JWT ya usaba el patrón `${JWT_SECRETO:...}`.
* `spring.datasource.username` sigue en `postgres` (cambio local previo, no revertido). Si el valor compartido debe volver a `gimnasio`, definirlo antes de commitear.
