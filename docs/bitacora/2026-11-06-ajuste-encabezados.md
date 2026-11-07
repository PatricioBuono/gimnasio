# 2026-11-06 — Ajuste de encabezados en dashboard y actividades

* Tareas: `F5-T3`, `F2-T4`
* Estado al cerrar: hecho
* Duración aproximada: continuación de sesión

## Objetivo

Quitar los subtítulos de los encabezados de Dashboard (`Socios`) y Actividades, y reducir un poco el tamaño del título principal sin alterar estructura, comportamiento ni contratos.

## Decisiones (y por qué)

* Se eliminaron los `<p class="subtitulo">` de ambos encabezados y su CSS muerto local — el contexto ya lo aporta la etiqueta superior (`Recepción Hulk` / `Administración Hulk`) y el contenido de la pantalla.
* El `h1` pasó de `clamp(2.25rem, 5vw, 3.25rem)` a `clamp(2rem, 4.5vw, 3rem)` — reducción moderada que mantiene jerarquía y mejora el equilibrio al no tener subtítulo.
* El override mobile pasó de `2.25rem` a `2rem` en ambos módulos — misma proporción de reducción en pantallas angostas.
* No se tocaron el subtítulo de Cobro ni el del Login: el pedido fue específico para Dashboard y Actividades.

## Hecho

* `frontend/src/app/dashboard/dashboard.html`: encabezado sin subtítulo.
* `frontend/src/app/dashboard/dashboard.css`: título reducido y bloque `.subtitulo` eliminado.
* `frontend/src/app/actividades/actividades.html`: encabezado sin subtítulo.
* `frontend/src/app/actividades/actividades.css`: título reducido y bloque `.subtitulo` eliminado.
* `docs/tareas/estado.md`: F5-T3 y F2-T4 enlazadas también a esta nota.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng build` | Build de producción correcto |
| `npx ng test --watch=false --include=src/app/dashboard/dashboard.spec.ts --include=src/app/actividades/actividades.spec.ts` | 27/27 tests pasan (Dashboard 13, Actividades 14) |
| Auditoría headless CDP Dashboard 1280 / 768 / 360 | Sin overflow horizontal, consola limpia, sin `.subtitulo`, `h1` de 48 / 34.56 / 32 px |
| Auditoría headless CDP Actividades 1280 / 768 / 360 | Sin overflow horizontal, consola limpia, sin `.subtitulo`, `h1` de 48 / 34.56 / 32 px |

## No hecho / pendientes

* La revisión visual humana de las capturas actualizadas sigue pendiente.
* Cypress continúa sin instalar; F2-T5 y F5-T4 no se cierran por este cambio.

## Archivos tocados

* `frontend/src/app/dashboard/dashboard.html`
* `frontend/src/app/dashboard/dashboard.css`
* `frontend/src/app/actividades/actividades.html`
* `frontend/src/app/actividades/actividades.css`
* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-06-ajuste-encabezados.md`

## Links

* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-06-rediseno-dashboard.md`
* `docs/bitacora/2026-11-06-rediseno-actividades.md`
