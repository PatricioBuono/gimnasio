# 2026-11-06 — Rediseño de Nuevo Socio

* Tarea: `F3-T3` (alcance visual)
* Estado al cerrar: hecho
* Duración aproximada: 1 sesión corta

## Objetivo

Rediseñar la pantalla de alta de socio con el lenguaje visual Hulk ya aplicado a
Dashboard, Actividades y Precios, sin tocar el contrato con `SocioService`, las
validaciones del formulario ni el flujo de creación.

## Decisiones (y por qué)

* **Mostrador de alta, no formulario suelto.** La pantalla se divide en el alta
  (izquierda) y una credencial de vista previa (derecha). La credencial es el
  elemento característico del gimnasio y ayuda a verificar nombre/DNI antes de
  confirmar.
* **Tres campos en una fila en desktop.** DNI, nombre y apellido se leen como una
  ficha de recepción; en mobile se apilan y el botón ocupa el ancho completo.
* **Vista previa tipográfica, sin imagen adicional.** Se reutiliza la marca
  `HULK / GIMNASIO` y un monograma con las iniciales; no se agrega otra foto ni
  se inventa un estado de cuenta antes de crear el socio.
* **Errores inline.** Se muestran mensajes por campo (`Ingresá el DNI.`, etc.) y
  se asocian con `aria-describedby`/`aria-invalid`. Esto cubre MR-US1 esc. 3 sin
  depender de burbujas nativas: el formulario usa `novalidate`.
* **Se conserva el comportamiento existente.** Mismos controles reactivos,
  mismo payload con DNI sin normalizar en frontend, mismo `409`, mismo reset y
  mismo enlace a la ficha.

## Hecho

* `frontend/src/app/socios/registro-socio.html`: estructura de mostrador,
  formulario accesible, alertas, enlaces y credencial de vista previa.
* `frontend/src/app/socios/registro-socio.css`: paleta Hulk, retícula responsive,
  estados de foco/error, tarjeta de credencial y layout mobile.
* `frontend/src/app/socios/registro-socio.ts`: getters de vista previa y mensajes
  de error por campo; sin cambios en `guardar()` ni en `mensajeError()`.
* `frontend/src/app/socios/registro-socio.spec.ts`: pruebas de campos faltantes,
  formato inválido de DNI y actualización de la credencial.

## No hecho / pendientes

* No se cambió el contrato del backend ni se agregó endpoint para resolver el
  perfil existente desde el error `409`; el mensaje actual se mantiene.
* La ficha del socio (`ficha-socio.*`) no se rediseñó en esta sesión.
* No se ejecutó Cypress full-stack en esta sesión; los selectores usados por
  `frontend/cypress/e2e/socios.cy.ts` se conservaron (`formcontrolname`,
  `role="status"`, `Registrar socio`, `Ver ficha`).

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx ng test --watch=false --include=src/app/socios/*.spec.ts` | 10/10 tests OK (6 de alta + 4 de ficha) |
| `npx ng build` | OK, sin errores |
| `npx prettier --check src/app/socios/registro-socio.*` | OK |
| Auditoría CDP 1280/768/360 | Sin overflow, sin errores de consola; vista previa, validación, alta y 409 verificados |

## Archivos tocados

* `frontend/src/app/socios/registro-socio.html`
* `frontend/src/app/socios/registro-socio.css`
* `frontend/src/app/socios/registro-socio.ts`
* `frontend/src/app/socios/registro-socio.spec.ts`

## Riesgos y próximos pasos

* La credencial es una vista previa de presentación: no persiste ni genera
  credencial física. Si el producto necesita impresión o QR, requiere ticket
  aparte y decisión de contrato.
* Revisar las capturas 1280/768/360 con revisión humana antes de commitear; el
  layout quedó validado por métricas, no por inspección visual del modelo.
* Siguiente paso natural: unificar el lenguaje visual de la ficha del socio con
  este mostrador de alta.

## Links

* [Estado de tareas](../tareas/estado.md)
* [Rediseño de actividades](2026-11-06-rediseno-actividades.md)
* [Rediseño de precios](2026-11-06-rediseno-precios.md)
