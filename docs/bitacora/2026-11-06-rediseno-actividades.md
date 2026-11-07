# 2026-11-06 — Rediseño del módulo de actividades

* Tarea: `F2-T4`
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión

## Objetivo

Rediseñar la pantalla de actividades con una identidad visual propia del gimnasio Hulk, sin cambiar contratos de API, validaciones, permisos ni reglas de negocio.

## Decisiones (y por qué)

* Tablero de dos columnas: catálogo a la izquierda y ficha de alta/edición a la derecha — separa consulta de edición y evita el formulario apilado sobre la tabla. En mobile la ficha pasa primero para que el alta siga siendo la acción principal.
* Estado con riel lateral, pill y nota textual (`Disponible para asignar` / `No se asigna a nuevos socios`) — no depende solo del color.
* Ficha con franja verde de peligro/obra y etiqueta `Alta` / `Edición` — el panel de edición se reconoce como una pieza operativa del gimnasio, no como una tarjeta genérica.
* Resumen `activas / inactivas` con `computed` — es información de UI derivada de la lista; no se agregó lógica de negocio ni endpoints.
* Tipografía: Segoe UI para lectura y Cascadia Mono solo para conteos — evita el patrón de etiquetas mono decorativas y reserva el mono para datos.
* `textarea` para descripción con etiqueta, ayuda y `aria-labelledby` / `aria-describedby` — permite descripciones reales y mantiene el nombre accesible del campo limpio.
* Se conservaron textos y `aria-label` de acciones (`Editar`, `Inhabilitar`, `Habilitar`, `Eliminar`) para no romper los tests ni la operación existente.

## Hecho

* `frontend/src/app/actividades/actividades.html`: encabezado de administración, alertas, catálogo en lista, ficha lateral, estados y acciones.
* `frontend/src/app/actividades/actividades.css`: tablero responsive, rieles de estado, ficha con franja verde, foco y targets de 44 px.
* `frontend/src/app/actividades/actividades.ts`: señales `activasTotal` / `inactivasTotal` con `computed`.
* `frontend/src/app/actividades/actividades.spec.ts`: cobertura del resumen, modo edición, asociación accesible del campo nombre, error de nombre duplicado y limpieza de alertas al editar.
* `docs/tareas/estado.md`: F2-T4 enlazada a esta sesión.

## No hecho / pendientes

* Cypress sigue sin instalar; F2-T5 no puede cerrarse según `AGENTS.md` §5/§6.
* La revisión visual humana de las capturas queda pendiente; el agente no puede interpretar imágenes de forma fiable.
* La suite Vitest completa no se corrió por OOM en 8 GB; se ejecutó el spec de actividades de forma aislada.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false --include=src/app/actividades/actividades.spec.ts` | 14/14 tests pasan |
| `npx ng build` | Build de producción correcto |
| Auditoría headless CDP 1280 / 768 / 360 | Sin overflow horizontal, consola limpia, ficha y catálogo apilados correctamente |
| Auditoría headless CDP de foco y formulario | `textarea` con texto claro, error de nombre obligatorio, modo edición y diálogo de eliminación funcionando |
| Contraste calculado | Texto 16.19:1, secundario 11.42:1, verde 6.35:1, alerta 7.73:1 sobre el tablero |

## Archivos tocados

* `frontend/src/app/actividades/actividades.html`
* `frontend/src/app/actividades/actividades.css`
* `frontend/src/app/actividades/actividades.ts`
* `frontend/src/app/actividades/actividades.spec.ts`
* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-06-rediseno-actividades.md`

## Riesgos y próximos pasos

* El orden DOM prioriza la ficha (primero en mobile) y en desktop se ubica a la derecha por grid; conviene validarlo en la revisión manual de teclado.
* Próximo paso: instalar/configurar Cypress y cubrir alta, edición, inhabilitación y rechazo de eliminación con socios asignados.
* Revisar las capturas `01`–`06` de la auditoría con una persona antes de dar por cerrada la dirección visual.

## Links

* `docs/tareas/estado.md`
* `docs/documentacion_gimnasio.md` (MA-US2)
* `docs/arquitectura.md` §5
