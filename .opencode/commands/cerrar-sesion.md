---
description: Valida y cierra la bitácora de la sesión actual
---

Cierra la sesión en curso. No marques un ticket como terminado si falta un solo punto de esta lista.

1. Identifica la bitácora abierta:
   - La sesión enlazada desde `docs/tareas/estado.md`, o
   - el archivo más reciente de `docs/bitacora/` que no tenga sección `## Cierre`.
   Si hay más de uno posible, pregunta cuál cerrar.
2. Verifica que la bitácora tenga todas las secciones de `docs/bitacora/_plantilla.md` completas:
   - Sin `YYYY-MM-DD` ni textos de plantilla sin reemplazar.
   - Sin `TBD` / `TODO` / «pendiente de completar».
   - «Decisiones» explica el porqué, no solo el qué.
   - «Pruebas ejecutadas» tiene comando **y** resultado real (no «funciona»).
3. Actualiza `docs/tareas/estado.md`:
   - Estado de la tarea (`Hecho` / `Parcial` / `Pendiente` / `Bloqueado`).
   - Columna «Sesión» con el enlace relativo a la bitácora.
   - «Última actualización» con la fecha de Mendoza (IANA `America/Argentina/Mendoza` y, si el sistema no la tiene, fallback `Argentina Standard Time`; misma fórmula que `/nueva-sesion`).
4. Revisa el DoD de `AGENTS.md` §5 y las 4 auditorías de §6. Si alguna no se puede verificar, la tarea queda `Parcial`, no `Hecho`.
5. Si todo pasa, agrega al final de la bitácora:

   ```md
   ## Cierre

   Cerrada el YYYY-MM-DD (America/Argentina/Mendoza). DoD verificado: sí.
   ```

6. Si algo falta, lista exactamente qué falta (archivo + sección) y no cierres la sesión.
