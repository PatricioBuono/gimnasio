# Índice de documentación — Proyecto Gimnasio

Mapa de lectura para agentes y humanos. **Leer este archivo primero.**

## Orden de lectura

1. `docs/INDICE.md` — este mapa y las reglas de convivencia.
2. `docs/documentacion_gimnasio.md` — verdad funcional (Gherkin). Qué debe hacer el sistema.
3. `docs/arquitectura.md` — verdad técnica aprobada. Cómo está diseñado.
4. `docs/plan_implementacion.md` — backlog estable por fases (F1..F5).
5. `docs/tareas/estado.md` — estado real de cada tarea.
6. `docs/bitacora/` — historia; leer **solo** la sesión enlazada a la tarea actual.

## Qué leer según lo que necesito

| Necesito… | Leer |
|---|---|
| Saber qué debe hacer el sistema | `documentacion_gimnasio.md` |
| Tomar una decisión técnica | `arquitectura.md` |
| Elegir la próxima tarea | `plan_implementacion.md` + `tareas/estado.md` |
| Retomar trabajo de hace semanas | `bitacora/` (sesión enlazada desde `estado.md`) |
| Cerrar un ticket | `AGENTS.md` §5 y §6 |

## Reglas de convivencia

* Las fuentes de verdad son `documentacion_gimnasio.md` (funcional) y `arquitectura.md` (técnica). La bitácora **no** redefine reglas: las enlaza.
* **Append-only**: una sesión cerrada no se reescribe. Correcciones = nota fechada al final.
* Enlaces relativos, nunca rutas absolutas.
* No duplicar Gherkin, DDL ni reglas de negocio.
* Presupuesto de tokens: este índice ≤ 80 líneas · archivo de sesión ≤ 150 · resumen ≤ 40.
* Cerrar tarea = bitácora + `tareas/estado.md` actualizados, además del DoD de `AGENTS.md`.

## Estructura

```text
docs/
├─ INDICE.md
├─ documentacion_gimnasio.md
├─ arquitectura.md
├─ plan_implementacion.md
├─ tareas/estado.md
└─ bitacora/
   ├─ _plantilla.md
   └─ YYYY-MM-DD-tema.md
```

## Comandos de sesión

* `/nueva-sesion <tema>` — crea la bitácora del día desde la plantilla.
* `/cerrar-sesion` — valida bitácora y estado antes de cerrar el ticket.
* `/levantar-server` / `/bajar-server` — backend 8080 + frontend 4200.
* `/test <funcionalidad>` — corre los tests unitarios BE/FE de esa funcionalidad y reporta huecos de cobertura.
* `/subir-cambios [mensaje]` — commitea lo seleccionado y lo sube a `origin` (sin force, sin PR).
