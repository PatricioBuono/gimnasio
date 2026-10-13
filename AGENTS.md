# AGENTS.md — Instrucciones permanentes del agente

## 1. Documentación Obligatoria (Contexto previo a la implementación)

Antes de escribir o modificar código para una nueva tarea, el agente DEBE leer:

* `docs/documentacion_gimnasio.md` — Criterios de Aceptación (Gherkin). Es la fuente de verdad funcional.
* `docs/arquitectura.md` — Diseño del sistema aprobado. Es la fuente de verdad técnica.

Queda estrictamente prohibido modificar decisiones arquitectónicas, modelos de datos base o flujos de negocio sin aprobación explícita del usuario.

Si hay contradicción entre código y documentación, detener el trabajo y consultar al usuario. No inferir reglas de negocio.

## 2. Stack Tecnológico y Arquitectura

* **Backend:** Java 21 LTS, Spring Boot 3.x, Spring Data JPA, Spring Security (JWT stateless).
* **Base de Datos:** PostgreSQL 16. Migraciones gestionadas obligatoriamente con Flyway.
* **Frontend:** Angular 20, TypeScript.
* **Autenticación:** Sólo el Administrador puede crear usuarios (Recepcionistas). El Administrador maestro inicial se crea a través del script de Flyway `V1__init.sql`. Sin endpoint público de creación de admins. Passwords con BCrypt, JWT en `Authorization: Bearer`.
* **Estilo:** monolito backend + SPA desacoplada. Sin microservicios en MVP.

## 3. Reglas Inquebrantables de Código y Diseño

* **Manejo de Dinero:** prohibido `double` / `float`. Todo monto con `BigDecimal` en Java y `NUMERIC(10,2)` en PostgreSQL.
* **Zona Horaria:** forzar explícitamente `America/Argentina/Mendoza` en la JVM (`-Duser.timezone`, `TimeZone.setDefault`) y en PostgreSQL (`SET TIME ZONE`, `timestamptz`). Regla del día 10 y cálculo de moras dependen de esto. Los tests deben usar relojes (`Clock`) mockeados, nunca fecha real.
* **Comprobantes de Pago:** formato `0001-XXXXXXXX`. No se genera en frontend ni en servicios Java. Se delega a secuencia nativa PostgreSQL (`comprobante_seq`) para evitar colisiones por concurrencia. El formateo con ceros a izquierda y prefijo de sucursal se hace solo en DTO/presentación.
* **Búsqueda y Rendimiento:** backend pagina estrictamente con límite 20 (`LIMIT 20`). Índices `B-Tree` para DNI y `GIN` con `pg_trgm` para nombre/apellido. Frontend: `FormControl + debounceTime(~300ms) + distinctUntilChanged + switchMap`.
* **Integridad Relacional:** constraints a nivel DDL obligatorios: `UNIQUE(dni)`, `UNIQUE(socio_id, periodo)`, `UNIQUE(nro_comprobante)`, `CHECK (precio > 0)`, `CHECK (recargo >= 0)`. Usar `ON DELETE RESTRICT` para evitar borrado de actividades con socios inscriptos (usar inhabilitar).
* **Transacciones:** cobros con `@Transactional`. Duplicado período → error 409, no validación solo UI.
* **Auditoría:** exoneraciones registran `motivo + usuario (sub JWT) + fecha/hora`, etiqueta `Recargo Bonificado`.

## 4. Comandos de Ejecución y Testing

> Placeholders estándar. Ajustar `mvn`/`gradle` según el build que se adopte. No instalar dependencias sin aprobación.

Backend (Spring Boot):
```bash
# Maven
./mvnw spring-boot:run
./mvnw test
# Gradle (alternativo)
./gradlew bootRun
./gradlew test
```

Frontend (Angular):
```bash
ng serve
ng build
```

Testing frontend:
```bash
# Unit (Vitest, default Angular CLI 20)
npx vitest run
# E2E (Cypress, flujos críticos: buscar deuda, registrar pago, verificar comprobante)
npx cypress open
npx cypress run
```

Migraciones:
```bash
./mvnw flyway:migrate
./mvnw flyway:info
```

## 5. Criterios de Finalización de Tarea (Definition of Done)

El agente no puede marcar una tarea como "Completada" sin verificar punto por punto los Criterios de Aceptación en formato Gherkin de `docs/documentacion_gimnasio.md`.

* Toda nueva regla de negocio debe tener su correspondiente test unitario en el backend (con `Clock` fijo para fechas).
* Todo componente visual nuevo debe tener su test en Vitest.
* Flujos críticos (búsqueda, cobro, exoneración, comprobante) deben pasar en Cypress antes de cerrar.
* Sin `ddl-auto: update` en prod. Todo cambio DDL va por Flyway versionado.
* Sin `double/float`, sin fecha real en tests, sin comprobante generado fuera de secuencia.

## 6. Skills de Auditoría (obligatorias pre-cierre de ticket)

Ejecutar estas 4 revisiones antes de marcar cualquier ticket como terminado. Si una falla, el ticket sigue abierto.

### 6.1 Revisión de código y cambios
* Clean code, capas `controller → service → repository`, sin lógica de negocio en controladores ni SQL en servicios.
* Nomenclatura del dominio en español (`socio, actividad, pago, comprobante, recargo, fechaLimite`), técnica en inglés (`controller, service`).
* DTOs para entrada/salida; entidades no se exponen directo. Validación Bean Validation en borde (DNI, montos).

### 6.2 Testing y Criterios de Aceptación
* Cada escenario Gherkin de `docs/Documentación Gimnasio.md` tiene su test espejo: JUnit (BE) / Vitest (FE), incluyendo negativos y bordes (día 10, 7/8/14 días, motivo vacío, DNI duplicado, período duplicado, actividad inactiva).
* Fechas con `Clock` fijo. Flujos críticos (buscar deuda, cobrar, exonerar, comprobante) en Cypress.

### 6.3 Coherencia con la Arquitectura
* Validación cruzada con `docs/arquitectura.md` y §3: solo `BigDecimal`/`NUMERIC(10,2)`, TZ `America/Argentina/Mendoza` en JVM+PG, comprobante solo por `comprobante_seq` (formato en DTO), `LIMIT 20` + índices B-Tree/GIN, Flyway versionado (`validate`, sin `ddl-auto: update` en prod).

### 6.4 Seguridad
* En cada PR simulado: endpoints protegidos por rol (`ADMIN` vs `RECEPCIONISTA`, 401/403 testeados), creación de usuarios solo `ADMIN`, sin creación pública de admins.
* Validación de inputs (DNI normalizado, montos, motivo trim no vacío) contra inyección/errores; mapear `UNIQUE` a 409.
* Pista de auditoría de caja verificada: `cobrado_por/exonerado_por (sub JWT) + fecha/hora + motivo`, etiqueta `Recargo Bonificado` en comprobante/historial.
