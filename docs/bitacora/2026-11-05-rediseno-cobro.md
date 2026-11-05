# 2026-11-05 — Rediseño visual de la pantalla de Cobro

* Tarea: `F4-T4` (rediseño visual, sin cambios de contrato)
* Estado al cerrar: hecho
* Duración aproximada: ~2 h

## Objetivo

Rediseñar la pantalla de Cobro con el lenguaje visual de Dashboard/Actividades/Precios, sin tocar lógica de negocio, permisos, guards ni contratos de API.

## Decisiones (y por qué)

* Concepto «mesa de caja»: panel de operación + ticket lateral sticky; una columna bajo 860 px — separa decidir de confirmar y mantiene el total visible.
* Sin modal de confirmación: el botón «Registrar pago» vive junto al total y se deshabilita durante el envío — menos fricción en mostrador.
* Cambiar el período invalida el desglose — evita cobrar un período con el total de otro.
* La exoneración solo aparece si `recargo > 0`; se muestra el recargo original tachado y el sello «Recargo Bonificado» — no se oculta información.
* Mensaje de 409: «El período ya está pagado.» — no hay endpoint que exponga el comprobante existente.
* Formato de moneda/fecha compartido en `core/formato.ts` y reutilizado por Precios.
* Foco programático al error y al comprobante con `afterNextRender`; el título del ticket recibe foco al registrar.
* `font: inherit` para botones/inputs y corrección de especificidad de `.btn-primario`/`.btn-peligro` — los controles usaban Arial por defecto y las variantes de peligro perdían el borde.

## Hecho

* `frontend/src/app/cobros/cobro.ts`, `cobro.html`, `cobro.css` reescritos.
* `frontend/src/app/cobros/cobro.spec.ts`: 15 tests (incluye cancelación de cálculo en curso y reinicio de cobro).
* `frontend/src/app/core/formato.ts`: formateadores compartidos.
* `frontend/src/app/precios/precios.ts`: usa `formatearMoneda`.
* `frontend/src/styles.css`: borde de control accesible, `font: inherit` y variantes de botón.
* `frontend/src/app/dashboard/dashboard.css`, `precios/precios.css`: borde del buscador/campo moneda al nuevo token.
* `frontend/src/app/app.ts`: imports sin uso eliminados (build sin warnings).
* `backend/src/main/java/com/gimnasio/seguridad/SecurityConfig.java`: CORS de desarrollo con `PATCH` y headers explícitos (soporte de verificación, sin cambios de negocio).

## No hecho / pendientes

* Cypress: no está instalado; F4-T5 sigue pendiente.
* Suite Vitest completa: no se corrió por OOM en 8 GB; se ejecutaron Cobro y Precios.
* Revisión visual humana de las capturas: el agente no puede interpretar imágenes; se validó con DOM/geometría/contraste.
* No se registró un pago real: el comprobante y el 409 se verificaron interceptando la respuesta HTTP, sin escribir en la base.
* Gherkin MR-US2 esc. 2 pide mostrar el comprobante existente al 409; no hay endpoint que lo exponga.
* Comprobante y errores de red no se probaron contra el backend real en esta sesión (sí los estados de UI).

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false --include "src/app/cobros/cobro.spec.ts"` | 15/15 |
| `npx ng test --watch=false --include "src/app/precios/precios.spec.ts"` | 8/8 |
| `npx ng test --watch=false --include "src/app/app.spec.ts"` | 2/2 |
| `npx ng build` | OK, sin warnings |
| Chrome headless 1280/768/360 (DOM, overflow, targets, contraste) | Sin desborde; controles de 44 px; contraste mínimo 6,26:1; foco en alerta y comprobante |
| `POST /api/pagos` interceptado | Comprobante simulado `0001-00000099`, sin escritura |
| `GET /api/pagos/vista-previa` interceptado con 409 | Mensaje «El período ya está pagado.» y foco en la alerta |

## Archivos tocados

* `frontend/src/app/cobros/cobro.ts`
* `frontend/src/app/cobros/cobro.html`
* `frontend/src/app/cobros/cobro.css`
* `frontend/src/app/cobros/cobro.spec.ts`
* `frontend/src/app/core/formato.ts`
* `frontend/src/app/precios/precios.ts`
* `frontend/src/app/precios/precios.css`
* `frontend/src/app/dashboard/dashboard.css`
* `frontend/src/app/app.ts`
* `frontend/src/styles.css`
* `backend/src/main/java/com/gimnasio/seguridad/SecurityConfig.java`

## Riesgos y próximos pasos

* El cambio global de `font: inherit` en botones/inputs afecta Login, Dashboard, Actividades y Precios; conviene una revisión visual rápida de esas pantallas.
* Validar en navegador real los flujos de cobro, exoneración y 409; luego instalar Cypress para F4-T5.
* Decidir si se agrega un endpoint de consulta de comprobante por período para cerrar la brecha del Gherkin.
* Revisar las capturas temporales de la verificación headless (1280/768/360, comprobante y 409) y commitear.

## Links

* `docs/tareas/estado.md`
* `docs/documentacion_gimnasio.md`
* `docs/arquitectura.md`
* `AGENTS.md`
