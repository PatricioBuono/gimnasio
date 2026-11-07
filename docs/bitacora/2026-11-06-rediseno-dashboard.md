# 2026-11-06 — Rediseño del Dashboard y marca Hulk

* Tarea: `F5-T3` (rediseño visual, sin cambios de contrato)
* Estado al cerrar: hecho
* Duración aproximada: ~2 h

## Objetivo

Reemplazar el tablero genérico y el enlace «Dashboard» por una identidad visual propia de Hulk, manteniendo intactas la lógica de negocio, autenticación, guards, permisos y contratos de API.

## Decisiones (y por qué)

* Concepto «tablero de recepción Hulk»: marcador de tres estados, mesa de comandos (búsqueda + actividad), bloques «Con deuda»/«Al día» y tabla tipo ledger — la deuda sigue primero y el flujo de cobro no cambia.
* El marcador usa totales por actividad y no por estado activo; al filtrar por estado se oculta la sección que no corresponde — evita que los contadores se reinicien y que «Con deuda · 0» aparezca mientras hay morosos.
* El logo Hulk reemplaza al enlace «Dashboard» y funciona como acceso a `/dashboard`; «Actividades» y «Precios» quedan como enlaces restantes — menos ruido en la barra y una marca reconocible.
* Los estados usan texto además de color: chips «Con deuda», «Por vencer» y «Al día», con mora y fecha de vencimiento — no se depende solo del color.
* Se agregó un diálogo de confirmación tipo ticket de caja con estado, vencimiento y atraso — evita navegar a Cobro por un clic accidental.
* El foco inicial del diálogo se mueve con `afterNextRender` después de que Angular renderiza el contenido; antes el foco quedaba en el elemento `dialog` porque el contenido aún no existía.
* Sin fuentes externas ni dependencias nuevas; se reutilizan los tokens y controles de `styles.css`.
* Se elevó el budget `anyComponentStyle` de `4kB/8kB` a `12kB/16kB`: el dashboard rediseñado, con tabla responsive y diálogo, supera el límite anterior. Queda registrado como deuda de configuración.

## Hecho

* `frontend/src/app/dashboard/dashboard.html`: nueva estructura del tablero, marcador, tabla, búsqueda, diálogo y etiquetas accesibles.
* `frontend/src/app/dashboard/dashboard.css`: estilos del tablero, responsive, contraste, tabla móvil y diálogo.
* `frontend/src/app/dashboard/dashboard.ts`: foco diferido del diálogo y cierre seguro; sin cambios de reglas de negocio.
* `frontend/src/app/dashboard/dashboard.spec.ts`: 13 tests, incluidos el estado «Por vencer» en el diálogo y el marcador estable al filtrar.
* `frontend/src/app/layout/private-layout.html` y `.css`: logo Hulk enlazado a `/dashboard`, navegación sticky y estados activos.
* `frontend/src/app/layout/private-layout.spec.ts`: verifica que la marca enlaza a `/dashboard` y que «Dashboard» ya no aparece.
* `frontend/src/index.html`: `lang="es"`, título «Hulk Gimnasio» y `theme-color`.
* `frontend/angular.json`: budget de estilos de componente en `12kB/16kB`.

## No hecho / pendientes

* Cypress: no está instalado; F4-T5 y F5-T4 siguen pendientes.
* Suite Vitest completa: no se corrió por OOM en 8 GB; se ejecutaron los specs afectados.
* Revisión visual humana de las capturas: el agente no interpreta imágenes; se validó DOM, geometría, overflow, tamaños táctiles y consola, y las capturas quedan para revisión.
* No se usó el backend ni se escribieron datos: la auditoría visual interceptó `GET /api/socios` con datos ficticios.
* Gherkin MR-US2 esc. 2 pide mostrar el comprobante existente al 409; sigue sin existir endpoint/consulta que lo exponga.
* Persisten cambios locales ajenos al rediseño (`application.properties`) y archivos untracked (`.opencode/`, `.agents/`, `skills-lock.json`) que requieren una decisión aparte.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng build` | OK, sin warnings |
| `npx ng test --watch=false --include "src/app/dashboard/dashboard.spec.ts" --include "src/app/layout/private-layout.spec.ts"` | 14/14 (Dashboard 13/13, PrivateLayout 1/1) |
| `npx ng test --watch=false --include "src/app/app.spec.ts"` | 2/2 |
| Chrome headless 1280/768/360 (DOM, overflow, targets, consola) | Sin desborde horizontal; consola limpia; controles principales ≥ 44 px; marcador 5/3/5 estable al filtrar y sección coherente con el filtro |
| Diálogo en 1280 y 360 | 448 px / 328 px, sin overflow; foco inicial en «Cancelar» y restaurado al cerrar |
| Búsqueda simulada con API interceptada | 1 resultado, estado «Por vencer», sin escritura en base |
| Búsqueda sin resultados | Estado vacío con «Limpiar búsqueda» y «Nuevo socio» |

## Archivos tocados

* `frontend/src/app/dashboard/dashboard.html`
* `frontend/src/app/dashboard/dashboard.css`
* `frontend/src/app/dashboard/dashboard.ts`
* `frontend/src/app/dashboard/dashboard.spec.ts`
* `frontend/src/app/layout/private-layout.html`
* `frontend/src/app/layout/private-layout.css`
* `frontend/src/app/layout/private-layout.spec.ts`
* `frontend/public/marca-hulk.jpg`
* `frontend/src/index.html`
* `frontend/angular.json`
* `docs/bitacora/2026-11-06-rediseno-dashboard.md`
* `docs/tareas/estado.md`

## Riesgos y próximos pasos

* El budget global de estilos de componente quedó en `12kB/16kB`; si aparece otro componente grande, conviene revisar si sus estilos deben compartirse en `styles.css`.
* Revisar las capturas temporales de la verificación headless antes de dar por cerrada la revisión visual humana.
* Instalar y configurar Cypress para cubrir dashboard, búsqueda, cobro, exoneración y comprobante; luego cerrar F4-T5 y F5-T4.
* Decidir el endpoint de consulta de comprobante por período para cerrar la brecha del Gherkin.
* Decidir si `.opencode/`, `.agents/` y `skills-lock.json` se versionan o se ignoran.

## Ajuste posterior — imagen de marca en la navbar

* Se reemplazó el bloque verde «H» por una imagen cuadrada de Hulk junto al wordmark, conservando el enlace a `/dashboard`, el estado activo y el `aria-label` del enlace.
* La imagen se descargó a `frontend/public/marca-hulk.jpg` (JPEG, 370×601) y se sirve localmente; no se hotlinkea Pinterest.
* El original tenía fondo blanco con una grilla clara; se reemplazó por verde de marca `#4caf50`, conservando el trazo negro de Hulk. El CSS también usa `--verde-marca` como color de respaldo.
* Recorte: `44×44`, `object-fit: cover` y `object-position: center top` para priorizar la parte superior del retrato. Si la revisión visual humana prefiere otra zona, solo cambia `object-position`.
* El `alt` queda vacío porque el enlace ya tiene `aria-label` y el wordmark visible; así no se duplica el nombre en lectores de pantalla.
* Prueba nueva en `private-layout.spec.ts`: la imagen existe dentro de la marca, usa un `src` local, tiene `alt=""` y dimensiones 44×44.

### Evidencia del ajuste

| Comprobación | Resultado |
|---|---|
| `npx ng build` | OK, sin warnings |
| `npx ng test --watch=false --include=src/app/layout/private-layout.spec.ts` | 2/2 |
| `npx ng test --watch=false --include=src/app/dashboard/dashboard.spec.ts --include=src/app/app.spec.ts` | 15/15 (Dashboard 13/13, App 2/2) |
| Chrome headless 1280/768/360 | Sin overflow; imagen `complete=true`, natural 370×601, render 44×44, `object-fit: cover`; esquina leída del canvas `76,176,80` (verde); consola limpia |

## Links

* [Estado de tareas](../tareas/estado.md)
* [Documentación funcional](../documentacion_gimnasio.md)
* [Arquitectura](../arquitectura.md)
* [AGENTS.md](../../AGENTS.md)
