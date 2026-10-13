# Plan de Implementación — Proyecto Gimnasio (MVP)

Fuentes: `docs/Documentación Gimnasio.md` (verdad funcional), `docs/arquitectura.md` (verdad técnica), `AGENTS.md` (reglas).
Nota de coherencia: `arquitectura.md §11` incluye `MR-US8` (filtro por actividad) en MVP; `Documentación Gimnasio.md:150` lo marca como pendiente a decidir. Se planifica como incluido según decisión aprobada del 12/10/2026. Si se revierte, quitar Fase 5 T5.3 sin afectar resto.

Convención de tareas: `[DB]`, `[BE]`, `[FE]`, `[QA]`. Cada tarea indica dependencias y US que cubre. Sin código aún.

## Fase 1 — Setup, modelo base, seguridad

Objetivo: proyecto compilable, DB migrable, auth JWT mínima.

* F1-T1 [DB] `V1__init.sql` (Flyway): extensión `pg_trgm`, tablas `usuario, socio, actividad, socio_actividad, parametro_precio, feriado, pago, comprobante`, secuencia `comprobante_seq`, constraints `UNIQUE(dni)`, `UNIQUE(socio_id, periodo)`, `UNIQUE(nro_comprobante)`, `CHECK` montos, `FK ON DELETE RESTRICT`, índices `B-Tree(dni)` + `GIN(nombre, apellido)`. TZ `America/Argentina/Mendoza`. Dep: ninguna. Cubre base de MA-US1/2/3, MR-US1/2.
* F1-T2 [DB] Seed admin maestro en `V1__init.sql` (BCrypt, rol ADMIN). Sin endpoint público de admins. Dep: F1-T1.
* F1-T3 [BE] Setup Spring Boot 3.x / Java 21: config TZ Mendoza, `Clock` bean, Flyway, JPA (`ddl-auto: validate`), estructura `controller/service/repository/entity/dto/security/config/util`. Dep: F1-T1.
* F1-T4 [BE] Auth JWT stateless: login, `BCrypt`, filtro `Bearer`, roles `ADMIN/RECEPCIONISTA`, `403` por rol, creación de recepcionistas solo `ADMIN`. Tests JUnit por rol. Dep: F1-T2, F1-T3.
* F1-T5 [FE] Setup Angular 20 + routing + interceptor JWT + guard por rol. Dep: F1-T4.
* F1-T6 [QA] Verificar migraciones idénticas en local (`flyway:migrate/info`), login admin seed, 401/403.

Criterio salida Fase 1: migras, logueas como admin, creas recepcionista, FE redirige por rol.

## Fase 2 — Catálogo y precios (MA)

Depende de Fase 1. Sin socios aún.

* F2-T1 [BE] CRUD actividades: nombre único case-insensitive/trim, estados Activa/Inhabilitada, bloqueo borrado físico si hay socios (MA-US2 Esc.3), error duplicado 409. Tests JUnit incl. negativos. Cubre MA-US2.
* F2-T2 [BE] Parámetros precio cuota (`>0`) y recargo (`>=0`), solo a futuro, sin recalcular comprobantes (MA-US1, MA-US3). Tests validación. Dep: F1-T3.
* F2-T3 [BE] ABM feriados (solo ADMIN): `fecha` única + descripción. Usado por motor de mora. Dep: F1-T3.
* F2-T4 [FE] Pantallas Admin: "Actividades" (crear/editar/inhabilitar) + "Configuración de Precios". Validaciones espejo del BE. Tests Vitest. Dep: F2-T1..T3.
* F2-T5 [QA] Gherkin MA-US1 Esc.1-2, MA-US2 Esc.1-4, MA-US3 Esc.1-2.

Salida: catálogo y precios configurables con negativos cubiertos.

## Fase 3 — Socios (MR-US1, MR-US3)

Depende de Fases 1-2 (requiere actividades activas).

* F3-T1 [BE] Alta socio: obligatorios DNI/nombre/apellido, normalización DNI, `UNIQUE(dni)` → 409 + enlace existente, estado inicial `Al día` hasta día 10 mes siguiente. Tests JUnit (duplicado, incompleto, formato). Cubre MR-US1.
* F3-T2 [BE] Asignación 1..N actividades activas, rechazo inactivas, visible en ficha (MR-US3). Sin cupos (excluido MVP). Dep: F2-T1, F3-T1.
* F3-T3 [FE] "Nuevo Socio" + ficha con multiselect actividades activas + manejo 409. Tests Vitest (vacío, duplicado, inactiva). Dep: F3-T1, F3-T2.
* F3-T4 [QA] Gherkin MR-US1 Esc.1-3, MR-US3 Esc.1-2.

Salida: socios creables y asignables.

## Fase 4 — Motor de pagos y mora (MR-US2, MR-US4, MR-US5)

Depende de Fases 1-3 (requiere socio + precio + recargo + feriados). Núcleo crítico.

* F4-T1 [BE] `FechaService` (Clock inyectado, TZ Mendoza): `fecha_limite` (día 10 → primer hábil si sáb/dom/feriado), `dias_atraso`, `semanas=ceil(dias/7)`, `recargo=semanas*valor`. Tests JUnit: en término=0, 1-7=1x, 8-14=2x, 15-21=3x, corrimiento finde/feriado, borde día 10. Cubre MR-US4.
* F4-T2 [BE] `PagoService @Transactional`: valida período pendiente, calcula total vía F4-T1, obtiene nro. de `comprobante_seq`, persiste pago+comprobante (nro+fecha+socio+período+cuota+recargo+total+método+cobrador), fija próxima `fecha_limite`, `UNIQUE(socio_id,periodo)` → 409. `BigDecimal` exclusivo. Tests Testcontainers PG (concurrencia mismo período). Cubre MR-US2.
* F4-T3 [BE] Exoneración: flag + motivo no vacío/trim, recargo=0, reversión solo pre-confirm, auditoría `motivo+usuario(sub JWT)+fecha/hora`, etiqueta `Recargo Bonificado`. Tests motivo vacío, reversión, auditoría. Cubre MR-US5. Dep: F4-T1, F4-T2.
* F4-T4 [FE] Pantalla cobro: desglose `Cuota + Recargo (Y sem) + Total`, checkbox exonerar con motivo obligatorio + recálculo, errores 409. Tests Vitest. Dep: F4-T1..T3.
* F4-T5 [QA] Cypress: cobrar en término, cobrar con mora 2 semanas, exonerar y verificar etiqueta, duplicado bloqueado, comprobante `0001-...`.

Salida: cobro correcto, concurrente y auditable.

## Fase 5 — Dashboard y búsqueda (MR-US6, MR-US7, MR-US8)

Depende de Fases 3-4 (requiere estados y mora calculada).

* F5-T1 [BE] `GET /socios/estado`: listas `Al día (fecha<=limite)` / `Con deuda (fecha>limite)`, deuda ordenada `dias_atraso DESC`, DTO con `actividades` anidadas, paginado `LIMIT 20`. Cubre MR-US6.
* F5-T2 [BE] `GET /socios/buscar?q=&page=`: DNI exacto (B-Tree) + nombre/apellido `pg_trgm`, insensible mayúsculas, estado incluido, `LIMIT 20`. Tests de índices y paginación. Cubre MR-US7.
* F5-T3 [FE] Dashboard: dos secciones, indicador no-solo-color + etiqueta días/semanas, buscador `FormControl + debounceTime(~300ms) + distinctUntilChanged + switchMap`, `Sin resultados` + CTA Nuevo Socio, click → ficha/cobro, filtro actividad MR-US8 en memoria sobre DTO. Tests Vitest. Dep: F5-T1, F5-T2.
* F5-T4 [QA] Cypress: dashboard separa estados, orden morosos, búsqueda DNI/nombre, sin resultados, acceso a cobro, filtro actividad.

Salida: recepcionista controla accesos y cobra en 2 clics.

## Orden y dependencias (resumen)

F1 → F2 → F3 → F4 → F5. No adelantar F4 sin F1-T1/F4-T1. No adelantar F5 sin F4-T1. Todo cambio DDL por nueva migración `V2__...`, nunca edición de `V1`.

## Excluido MVP (V2)

Anulación de pagos, cierre de caja/reportes, comprobantes fiscales, cupos, pago parcial/adelantado, tope recargo, filtro actividad en backend si escala.
