# Arquitectura — Proyecto Gimnasio

Estado: **Aprobada para MVP** — Basada en `documentacion_gimnasio.md` (Versión Revisada) y decisiones del 12/10/2026.
Alcance: solo documentación. Sin implementación.

## 1. Resumen

Sistema web para gestión de socios, cobros mensuales con mora semanal y dashboard de recepcionista.

* Módulos: MA (Administrador) / MR (Recepcionista).
* Núcleo operativo MVP: cobros + moras + exoneración auditada + dashboard + búsqueda.
* Estilo: monolito backend desacoplado de SPA frontend (no microservicios en MVP).

## 2. Stack fijo

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Backend | Java LTS | 21 | LTS, virtual threads para concurrencia de cobros/búsquedas |
| Framework | Spring Boot | 3.x | REST, validación, transacciones, Security, Data JPA |
| Base de datos | PostgreSQL | 16 | Integridad referencial, transacciones, secuencias, `pg_trgm` |
| Migraciones | Flyway | compatible Boot 3.x | Despliegue idéntico: constraints, extensiones, admin inicial |
| Frontend | Angular + TypeScript | 20 | SPA desacoplada, standalone components, signals, `FormControl` + `debounceTime` |
| Test FE unit | Vitest | default Angular CLI 20 | Ciclos rápidos, reemplaza Karma/Jasmine |
| Test E2E | Cypress | vigente | Flujos: buscar deuda → registrar pago → verificar comprobante |

> Regla: no cambiar versiones sin ADR. `double/float` prohibidos para dinero: usar `BigDecimal` / `NUMERIC(10,2)`.

## 3. Backend (Spring Boot)

Estructura por capas: `controller → service → repository (JPA) → entity`, más `dto`, `security`, `config`, `util (FechaService, ComprobanteService)`.

Reglas clave:
* `MA-US1 / MA-US3`: cambios de precio/recargo solo a futuro. Validar `>0` (precio) y `>=0` (recargo). No recalcular comprobantes emitidos.
* `MA-US2`: nombre único case-insensitive/trim. Borrado físico bloqueado si hay socios → `inhabilitar`.
* `MR-US1`: `DNI` único (normalizado sin puntos/espacios). Alta deja socio `Al día` hasta día 10 del mes siguiente.
* `MR-US2`: transaccional (`@Transactional`). Genera comprobante (ver §6), marca período pagado, fija próxima `fecha_limite`. Bloquea duplicado `UNIQUE(socio_id, periodo)` y lo mapea a error 409 con comprobante existente.
* `MR-US4`: `FechaService` centraliza: `fecha_limite`, `dias_atraso`, `semanas=ceil(dias/7)`, `total_recargo`. Inyectar `Clock` para testear sin flakiness.
* `MR-US5`: exoneración exige motivo no vacío, registra `motivo + usuario + fecha/hora`, etiqueta `Recargo Bonificado`. Reversión solo antes de confirmar.

## 4. Base de datos (PostgreSQL 16)

Entidades mínimas: `usuario, socio, actividad, socio_actividad, parametro_precio, feriado, periodo_pago / pago, comprobante`.

Constraints obligatorios (Flyway `V1__init.sql`):
* `UNIQUE(socio.dni)`, `UNIQUE(pago.socio_id, periodo)`, `UNIQUE(comprobante.nro)`.
* `FK socio_actividad → socio/actividad ON DELETE RESTRICT`.
* `CHECK (precio > 0)`, `CHECK (recargo >= 0)`.
* Extensión: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
* Índices: `B-Tree(dni)`, `GIN(nombre gin_trgm_ops, apellido gin_trgm_ops)`.

Admin maestro: insertado solo por migración (`V1__init.sql`) con password hasheado `BCrypt`. Ningún endpoint público crea admins.

## 5. Frontend (Angular 20)

* Standalone components + signals para dashboard `MR-US6`.
* `MR-US7`: `FormControl + valueChanges → debounceTime(~300ms) → distinctUntilChanged → switchMap → backend`. Backend pagina `LIMIT 20`. Mensaje `Sin resultados` + CTA a Nuevo Socio. Click → ficha/cobro.
* `MR-US8` (incluido MVP): filtro por actividad en memoria. Requisito: DTO `Socio { ..., actividades: [{id,nombre}] }`. No pide índice extra en MVP. Si el volumen crece, mover a backend en V2.
* Desglose cobro: `Cuota $X + Recargo (Y semanas) $Z + Total`.
* Formato comprobante `0001-XXXXXXXX` solo en DTO/presentación (ver §6).

## 6. Comprobantes y concurrencia

* Secuencia nativa PG: `CREATE SEQUENCE comprobante_seq;` Evita colisiones con 2 recepcionistas concurrentes.
* Formato `0001-XXXXXXXX`: `0001` = prefijo sucursal (prepara expansión), `XXXXXXXX` = valor secuencia con ceros a izquierda formateado en DTO, no almacenado formateado.
* Contenido comprobante: nro + fecha + socio + período + cuota + recargo + total + método + usuario que cobró.

## 7. Seguridad — JWT stateless

* Frontend desacoplado → JWT (`Authorization: Bearer`), sin sesión servidor. Escala y evita sesiones cruzadas.
* Roles: `ADMIN` (MA + crear recepcionistas + gestionar feriados) / `RECEPCIONISTA` (MR). Endpoints protegidos por rol (`403` si rol insuficiente).
* Creación de usuarios: solo `ADMIN`. Login emite JWT corto + refresh (a definir expiración en detalle de diseño).
* Passwords: `BCrypt`. Auditoría usa `sub` del JWT (`exonerado_por`, `cobrado_por`).

## 8. Fechas, feriados y zona horaria

* `fecha_limite` = día 10 del mes; si sábado/domingo/feriado → primer día hábil posterior.
* Fuente feriados: tabla local `feriado(fecha, descripcion)` gestionada por Admin. Sin API externa en MVP (evita punto de falla en facturación).
* Zona horaria estricta: `America/Argentina/Mendoza` en JVM (`-Duser.timezone`, `TimeZone.setDefault`) y en PG (`SET TIME ZONE`, `timestamptz`). `dias_atraso = fecha_actual - fecha_limite` en esa zona.
* Lógica de fecha aislada y testeable con `Clock`.

## 9. Migraciones (Flyway)

* `V1__init.sql`: tablas, constraints, índices, `pg_trgm`, secuencia, admin inicial.
* `V2__...`: cambios posteriores. Prohibido `ddl-auto: update` en prod. Flyway valida que todo entorno sea idéntico.

## 10. Testing

* Vitest: unit FE (cálculo desglose, filtro MR-US8, validaciones form, búsqueda con debounce mockeado).
* Cypress E2E (solo críticos): 1) buscar moroso por DNI, 2) registrar pago con recargo y verificar desglose, 3) exonerar con motivo y verificar etiqueta, 4) verificar comprobante `0001-...`.
* Backend (cuando se implemente): JUnit + `Clock` fijo para `MR-US4`, Testcontainers PG para constraints/transacciones, tests Security por rol.

## 11. Alcance MVP

Incluido: `MA-US1..3, MR-US1..7, MR-US8` (filtro actividad en memoria), auth JWT, feriados locales, comprobantes con secuencia, búsqueda paginada, auditoría exoneración.

Diferido a V2: anulación de pagos, cierre de caja complejo/reportes, comprobantes fiscales/impresión, cupos por actividad, pago parcial/adelantado, tope de recargo, mover filtro a backend si escala.

## 12. Riesgos asumidos

* JWT requiere gestión de expiración/refresh y revocación limitada — aceptar para MVP stateless.
* Tabla feriados exige carga manual inicial correcta o la mora falla.
* Filtro en memoria solo válido con `LIMIT 20`; si crece a miles, pasar a query backend.
* Sin anulación de pagos: error de cobro requiere corrección manual DB en MVP (documentar procedimiento).
