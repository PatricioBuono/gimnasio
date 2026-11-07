# 2026-11-06 — Rediseño del módulo de precios

* Tarea: `F2-T4` (pantalla de precios)
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión

## Objetivo

Rediseñar la configuración de precios con la identidad visual de Hulk Gimnasio, sin cambiar contratos de API, validaciones, permisos ni reglas de negocio.

## Plan de diseño

* **Paleta**: verde casi negro para el tablero (`#151a14`), acero (`#303a2e` / `#4d5c49`), verde de marca (`#4caf50`) para la cuota y ámbar (`#ffd166`) para el recargo.
* **Tipografía**: Segoe UI para lectura; Cascadia Mono solo para importes y metadatos numéricos.
* **Layout**: una sola pieza de tarifario enmarcada, con dos placas separadas por una costura y un pie de regla de caja. No son tarjetas flotantes: comparten marco, borde y jerarquía.
* **Principio**: el importe vigente es el héroe; el formulario queda subordinado y la consecuencia del cambio se explica en texto.

## Decisiones (y por qué)

* Tarifario único con dos placas en vez de dos cards independientes — evita el kit genérico de tarjetas y refuerza que ambas tarifas pertenecen a la misma configuración de caja.
* Riel izquierdo verde para la cuota y ámbar para el recargo — distingue base y penalización sin depender solo del texto.
* Importes grandes en mono con `tabular-nums` — se leen como valores de caja, no como títulos decorativos.
* Se quitaron las etiquetas redundantes `Mensual` / `Por semana`: los títulos ya nombran cada concepto y las etiquetas competían con el importe.
* El texto de ayuda conserva las reglas del negocio y las frases exactas que validan los tests (`Debe ser mayor a 0`, `mayor o igual a 0`).
* Etiquetas explícitas (`Nuevo valor de cuota`, `Nuevo valor de recargo`), `aria-describedby` condicional y targets de 44 px — el formulario mantiene contexto accesible y cómodo en mobile.
* `novalidate` en los formularios — el submit muestra el error propio del componente en lugar de delegar en el globo nativo del navegador.
* No se tocó el diálogo compartido de confirmación, los servicios ni las rutas.

## Hecho

* `frontend/src/app/precios/precios.html`: encabezado Hulk, tarifario, placas, formularios accesibles, alertas y pie de regla.
* `frontend/src/app/precios/precios.css`: tablero responsive, rieles semánticos, importes, formularios y estados de carga.
* `frontend/src/app/precios/precios.spec.ts`: cobertura de etiquetas explícitas, valores actuales y asociación con la ayuda.
* `docs/tareas/estado.md`: F2-T4 enlazada a esta sesión y conteo de Precios actualizado.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false --include=src/app/precios/precios.spec.ts` | 9/9 tests pasan |
| `npx ng build` | Build de producción correcto, sin exceder el presupuesto de estilos |
| Auditoría headless CDP 1280 / 768 / 360 | Sin overflow horizontal, consola limpia, tarifario y placas apilados correctamente |
| Validación en navegador | `Debe ser mayor a 0`, `aria-invalid="true"` y `aria-describedby="ayuda-cuota error-cuota"` |
| Confirmación y guardado | Diálogo con importe anterior/nuevo, actualización a `$ 20.000,00` y alerta de éxito |
| Contraste calculado | Texto 16.19:1, secundario 11.42:1, verde 6.35:1, ámbar 12.24:1, alerta 7.73:1 sobre el tablero |

## No hecho / pendientes

* La revisión visual humana de las capturas `01`–`06` queda pendiente.
* Cypress sigue sin instalar; F2-T5 no se cierra por este cambio.
* La suite Vitest completa no se corrió por OOM en 8 GB; se ejecutó el spec de precios de forma aislada.

## Archivos tocados

* `frontend/src/app/precios/precios.html`
* `frontend/src/app/precios/precios.css`
* `frontend/src/app/precios/precios.spec.ts`
* `docs/tareas/estado.md`
* `docs/bitacora/2026-11-06-rediseno-precios.md`

## Links

* `docs/tareas/estado.md`
* `docs/documentacion_gimnasio.md` (MA-US1, MA-US3)
* `docs/arquitectura.md` §5

## Ajuste posterior (misma fecha)

Pedido: reducir un poco el tamaño de los importes de cuota y recargo, mostrarlos sin decimales y quitar el pie que explicaba la regla de recálculo.

### Decisiones (y por qué)

* `formatearPrecio` nuevo en `core/formato.ts` (0 decimales) — el tarifario muestra valores redondos; `formatearMoneda` con 2 decimales se conserva intacto para cobros y comprobantes, donde el centavo importa.
* El componente usa `formatearPrecio` también en el diálogo de confirmación y la alerta de éxito — evita mezclar `$ 20.000` con `$ 20.000,00` en la misma pantalla.
* Se elimina el `<footer class="tarifario-pie">` y sus estilos (`.tarifario-pie`, `.pie-marca`, regla responsive de apilado) — el pedido es quitar el pie completo, no ocultarlo.
* `.placa-valor` pasa de `clamp(2.25rem, 4.6vw, 3.25rem)` a `clamp(1.75rem, 3.4vw, 2.5rem)`; en mobile de `2.25rem` a `1.875rem` — sigue siendo el héroe de cada placa, pero menos dominante.

### Hecho

* `frontend/src/app/core/formato.ts`: nueva función `formatearPrecio` sin decimales.
* `frontend/src/app/precios/precios.ts`: usa `formatearPrecio`.
* `frontend/src/app/precios/precios.html`: se quitó el pie de regla.
* `frontend/src/app/precios/precios.css`: importes más chicos y limpieza de estilos del pie.
* `frontend/src/app/precios/precios.spec.ts`: el caso de formateo exige ausencia de `,00` y se agregó un caso que verifica que el pie no se renderiza.

### Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false` | 18 archivos / 93 tests pasan (incluye 10 de Precios) |

### Archivos tocados

* `frontend/src/app/core/formato.ts`
* `frontend/src/app/precios/precios.ts`
* `frontend/src/app/precios/precios.html`
* `frontend/src/app/precios/precios.css`
* `frontend/src/app/precios/precios.spec.ts`
* `docs/bitacora/2026-11-06-rediseno-precios.md`
