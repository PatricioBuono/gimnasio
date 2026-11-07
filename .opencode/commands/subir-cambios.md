---
description: Commitea los cambios seleccionados y los sube a GitHub (origin)
---

Sube los cambios del proyecto a GitHub. El mensaje opcional viene en `$ARGUMENTS`. Este comando **no ejecuta tests** (para eso está `/test`) ni crea Pull Requests (`gh` no está instalado).

Reglas duras: prohibido `git add -A` / `git add .`, `git push --force`, `git commit --amend` (salvo pedido explícito del usuario) y `git reset --hard`. Nunca commitear secretos, `node_modules/`, `target/` ni `.angular/`.

1. Resuelve el mensaje:
   - Si `$ARGUMENTS` tiene texto, usalo tal cual (si no respeta Conventional Commits, preguntá si querés prefijarlo o dejarlo así).
   - Si está vacío, generá un mensaje desde el diff con el formato del repo: `tipo(scope): descripción en español`.
     Tipos: `feat`, `fix`, `style`, `docs`, `refactor`, `test`, `chore`. Scopes: `backend`, `frontend`, `docs`, `infra`.
     Primera línea ≤ 72 caracteres, imperativa y con acentos. Mostralo y pedí confirmación (usar / editar / cancelar) antes de commitear.

2. Diagnóstico (detenete si algo falla):
   - `git rev-parse --is-inside-work-tree`
   - `git rev-parse --abbrev-ref HEAD` → si devuelve `HEAD`, estás en detached HEAD: abortá.
   - `git remote get-url origin` → si no existe, abortá e informá.
   - `git status --short`, `git diff --stat`, `git log --oneline -5`.
   - `git fetch origin --prune`
   - `git rev-list --left-right --count HEAD...origin/<rama>` (si la rama no tiene upstream, `git rev-parse --abbrev-ref '@{u}'` falla: anotá que hay que usar `-u`).
   - Si estás **atrás** del remoto (`behind > 0`): detenete, explicá y proponé `git pull --rebase origin <rama>`. No hagas merge ni force automático.
   - Si no hay nada para commitear y `ahead = 0`: informá «nada para subir» y terminá.

3. Selección de archivos:
   - Mostrá `git status --short` y `git diff --stat`.
   - Por defecto incluí los archivos **trackeados** modificados/borrados: `git add -u`.
   - Para los **untracked**, listalos agrupados por carpeta de primer nivel y preguntá cuáles incluir; agregalos por ruta explícita (`git add .opencode docs ...`). No uses `.` ni `-A`.
   - Respetá `.gitignore`: no agregues `node_modules/`, `target/`, `.angular/`, `dist/` ni binarios generados.

4. Escaneo de secretos **antes** de commitear:
   - Sobre lo staged: `git diff --cached -U0 | Select-String -Pattern 'password|passwd|secret|token|api[_-]?key|PRIVATE KEY|BEGIN OPENSSH'`
   - Sobre untracked seleccionados: `Select-String -Path <rutas> -Pattern 'password|passwd|secret|token|api[_-]?key|PRIVATE KEY'`
   - Si aparece una credencial literal hardcodeada (por ejemplo `spring.datasource.password=1234`), **frená** y pedí confirmación explícita («sí, subir igual»). Referencias a variables de entorno (`${DB_PASSWORD:...}`) o placeholders son aceptables, pero igual reportalas.
   - Si hay `.env`, `*.pem`, `*.key`, `id_rsa` entre lo seleccionado: excluilos y avisá.

5. Commit:
   - Mostrá `git diff --cached --stat` y `git diff --cached --name-only` para confirmar el alcance.
   - `git commit -m "<mensaje>"`
   - Sin `--amend`, sin `--no-verify`. Si un hook falla, mostrá la salida real y no lo saltees.

6. Push:
   - Con upstream: `git push origin <rama>`.
   - Sin upstream: `git push -u origin <rama>`.
   - Si el push se rechaza (non-fast-forward / protected branch): detenete, mostrá el error y sugerí `git pull --rebase origin <rama>`. Nunca uses `--force` ni `--force-with-lease` sin pedido explícito.

7. Reporte final:
   - Rama y remoto (`origin` → URL).
   - Hash corto y título del commit.
   - Archivos incluidos y untracked excluidos.
   - Resultado del push (commits subidos o error real).
   - Advertencias: secretos detectados, tests no ejecutados, rama protegida.

Si el usuario pide subir a otra rama, preguntá el nombre exacto y no cambies de rama por tu cuenta.
