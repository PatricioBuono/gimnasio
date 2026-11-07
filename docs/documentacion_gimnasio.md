## **HISTORIAS DE USUARIO (Versión Revisada)**

Módulos:
* **MA:** Módulo Administrador
* **MR:** Módulo Recepcionista

> Convenciones: `fecha_limite` = día 10 del mes corriente (o primer día hábil posterior si cae en fin de semana/feriado). `dias_atraso = fecha_actual - fecha_limite`. `semanas = Techo(dias_atraso / 7)`. Estado `Al día` = `fecha_actual <= fecha_limite`; `Con deuda` = `fecha_actual > fecha_limite`.

### **Épica 1: Configuración y Catálogo (Perfil: Administrador)**

**MA-US1: Modificar el listado de precios**
* **Descripción:** Como Administrador, quiero actualizar los precios de las cuotas para mantener los valores al día.
* **Criterios de Aceptación:**
  * **Escenario 1: Actualización exitosa.**
    * **Dado** que el Administrador ha iniciado sesión con rol Admin y está en "Configuración de Precios",
    * **Cuando** ingresa un monto mayor a 0 y guarda,
    * **Entonces** el sistema actualiza el valor y los *nuevos* cobros reflejan el nuevo precio (las deudas ya consolidadas no se recalculan).
  * **Escenario 2: Validación negativa.**
    * **Cuando** intenta guardar un precio negativo, cero o vacío / no numérico,
    * **Entonces** el sistema bloquea la acción y muestra un error sin modificar el valor vigente.

**MA-US2: Gestionar catálogo de actividades**
* **Descripción:** Como Administrador, quiero crear, editar o inhabilitar tipos de entrenamiento.
* **Criterios de Aceptación:**
  * **Escenario 1: Creación de actividad.**
    * **Dado** que el Administrador está en el panel de "Actividades",
    * **Cuando** ingresa un nombre único (que no exista previamente, comparación sin distinguir mayúsculas/espacios) y su descripción, y presiona "Crear",
    * **Entonces** la actividad queda en estado Activa y disponible para asignación.
  * **Escenario 2: Edición.**
    * **Dado** que existe una actividad,
    * **Cuando** edita nombre (manteniendo unicidad) o descripción y guarda,
    * **Entonces** el cambio se refleja en el catálogo y en las fichas que ya la tienen asignada (sin duplicar).
  * **Escenario 3: Restricción de eliminación (Integridad).**
    * **Dado** que una actividad (ej. "Crossfit") tiene socios asignados actualmente,
    * **Cuando** intenta eliminarla,
    * **Entonces** el sistema impide el borrado físico y ofrece "Ocultar/Inhabilitar" para que no se asigne a nuevos socios, pero se conserve en los historiales existentes.
  * **Escenario 4: Nombre duplicado.**
    * **Cuando** intenta crear/editar con un nombre ya existente,
    * **Entonces** bloquea y muestra error.

**MA-US3: Configurar valor del recargo semanal**
* **Descripción:** Como Administrador, quiero definir el monto fijo del recargo por semana de atraso.
* **Criterios de Aceptación:**
  * **Escenario 1: Actualización del recargo.**
    * **Dado** que el Administrador está en "Configuración de Precios" e ingresa un valor mayor o igual a 0,
    * **Cuando** guarda,
    * **Entonces** el nuevo valor se utiliza solo para los cobros que se registren a partir de ese instante (no recalcula comprobantes ya emitidos).
  * **Escenario 2: Validación negativa.**
    * **Cuando** ingresa un valor negativo, vacío o no numérico,
    * **Entonces** bloquea y conserva el valor vigente.

### **Épica 2: Gestión Diaria y Operativa (Perfil: Recepcionista)**

**MR-US1: Registrar un nuevo socio**
* **Descripción:** Como Recepcionista, quiero dar de alta a un cliente nuevo.
* **Criterios de Aceptación:**
  * **Escenario 1: Alta exitosa.**
    * **Dado** que el Recepcionista accede a "Nuevo Socio",
    * **Cuando** completa los obligatorios DNI, nombre y apellido y confirma,
    * **Entonces** el sistema crea el perfil en estado inicial "Al día" hasta la próxima `fecha_limite` (día 10 del mes siguiente al alta) y lo deja habilitado para asignaciones y pagos.
  * **Escenario 2: Prevención de duplicados.**
    * **Dado** que intenta registrar un DNI que ya existe (comparación exacta, sin puntos/espacios),
    * **Cuando** confirma,
    * **Entonces** bloquea el alta, muestra error y enlace al perfil existente.
  * **Escenario 3: Datos incompletos/inválidos.**
    * **Cuando** falta DNI/nombre/apellido o el DNI tiene formato inválido,
    * **Entonces** bloquea e indica el campo faltante.

**MR-US2: Registrar pago de cuota (Modelo Mensual)**
* **Descripción:** Como Recepcionista, quiero asentar el pago de la cuota mensual.
* **Criterios de Aceptación:**
  * **Escenario 1: Pago regular.**
    * **Dado** que el socio existe y tiene un período pendiente,
    * **Cuando** el Recepcionista selecciona el período, elige método (Efectivo/Transferencia) y confirma,
    * **Entonces** el sistema genera un comprobante único (nro. correlativo + fecha + socio + período + cuota + recargo + total + método + usuario que cobró), asienta el período como pagado y fija la próxima `fecha_limite` en el día 10 del mes siguiente al período abonado, dejando al socio "Al día" hasta entonces.
  * **Escenario 2: Pago duplicado.**
    * **Dado** que el período ya figura como pagado,
    * **Cuando** intenta registrarlo de nuevo,
    * **Entonces** bloquea y muestra el comprobante existente.
  * **Nota:** si el pago es posterior a `fecha_limite`, el total incluye el recargo calculado según MR-US4, salvo exoneración (MR-US5).

**MR-US3: Asignar plan de entrenamiento**
* **Descripción:** Como Recepcionista, quiero vincular a un socio con las actividades que realiza.
* **Criterios de Aceptación:**
  * **Escenario 1: Asignación.**
    * **Dado** que el socio existe,
    * **Cuando** en su perfil selecciona una o más actividades en estado Activa y guarda,
    * **Entonces** quedan vinculadas a su ficha y visibles en dashboard y control de acceso.
  * **Escenario 2: Actividad inactiva.**
    * **Cuando** intenta asignar una actividad Inhabilitada/Oculta,
    * **Entonces** no aparece como opción; si se fuerza por dato viejo, bloquea con error.
* **Alcance:** no hay control de cupos/capacidad en esta versión (se eliminó la mención ambigua a "cupos").

**MR-US4: Cálculo automático de recargo acumulativo (semanal)**
* **Descripción:** Como Recepcionista, quiero que el sistema calcule automáticamente la mora por semanas iniciadas de atraso.
* **Regla de Negocio (Fecha Límite):** día 10 del mes. Si el día 10 es sábado, domingo o feriado, se traslada al primer día hábil posterior. `dias_atraso = fecha_actual - fecha_limite`.
* **Criterios de Aceptación:**
  * **Escenario 0: Pago en término.**
    * **Dado** que `fecha_actual <= fecha_limite`,
    * **Entonces** recargo = $0.
  * **Escenario 1: Primera semana (1 a 7 días).**
    * **Dado** que `dias_atraso` está entre 1 y 7,
    * **Cuando** se visualiza/cobra,
    * **Entonces** aplica 1 vez el valor del recargo.
  * **Escenario 2: Semanas múltiples (8+ días).**
    * **Dado** que `dias_atraso >= 8`,
    * **Entonces** `total_recargo = Techo(dias_atraso / 7) * Valor_Recargo` (ej: 8-14 = 2, 15-21 = 3).
  * **Escenario 3: Desglose.**
    * En pantalla de cobro se muestra: "Cuota: $X" + "Recargo (Y semanas): $Z" + "Total: $X+$Z".

**MR-US5: Exonerar recargos por mora con auditoría**
* **Descripción:** Como Recepcionista, quiero poder anular el recargo justificando el motivo, para retener socios que retoman tras inactividad.
* **Criterios de Aceptación:**
  * **Escenario 1: Exoneración justificada.**
    * **Dado** que un cobro tiene recargo > $0,
    * **Cuando** marca "Exonerar recargo" e ingresa un motivo en texto no vacío y confirma,
    * **Entonces** el recargo pasa a $0 y el total = solo cuota base.
  * **Escenario 2: Motivo obligatorio.**
    * **Cuando** marca exonerar sin motivo o con solo espacios,
    * **Entonces** bloquea la confirmación hasta ingresarlo.
  * **Escenario 3: Reversión antes de confirmar.**
    * **Dado** que marcó exonerar pero aún no confirmó el pago,
    * **Cuando** desmarca la opción,
    * **Entonces** el sistema recalcula y vuelve a sumar el recargo correspondiente.
  * **Escenario 4: Auditoría.**
    * **Cuando** se confirma un pago exonerado,
    * **Entonces** queda registrado motivo + usuario + fecha/hora, y el comprobante/historial lleva la etiqueta "Recargo Bonificado".

**MR-US6: Dashboard - Vista general de estados**
* **Descripción:** Como Recepcionista, quiero ver listas separadas de socios al día y morosos al iniciar sesión.
* **Criterios de Aceptación:**
  * **Escenario 1: Listas por estado.**
    * **Cuando** ingresa al inicio,
    * **Entonces** ve dos secciones: "Al Día" (`fecha_actual <= fecha_limite`) y "Con Deuda" (`fecha_actual > fecha_limite`), esta última ordenada por `dias_atraso` descendente. Cada fila muestra nombre, apellido y actividad(es) asignada(s).
  * **Escenario 2: Indicador visual.**
    * Los socios con deuda tienen estado distinguible (no solo por color) + etiqueta de texto con días/semanas de mora.

**MR-US7: Dashboard - Búsqueda y filtrado**
* **Descripción:** Como Recepcionista, quiero buscar socios rápidamente desde el dashboard para agilizar el ingreso y cobro.
* **Criterios de Aceptación:**
  * **Escenario 1: Búsqueda unificada.**
    * **Cuando** ingresa un DNI o fragmento de nombre (insensible a mayúsculas) en la barra superior,
    * **Entonces** filtra instantáneamente mostrando solo coincidencias con su estado actual (Al día / Deuda).
  * **Escenario 2: Sin resultados.**
    * **Cuando** no hay coincidencias,
    * **Entonces** muestra mensaje "Sin resultados" y opción de ir a "Nuevo Socio".
  * **Escenario 3: Acceso rápido.**
    * **Cuando** hace clic en un resultado,
    * **Entonces** redirige a la ficha / pantalla de cobro de ese socio.
* **Pendiente:** filtro por actividad (estaba en versión anterior como "opcional"). No eliminado: se propone como historia separada MR-US8 a decidir.

### **3. Alcance excluido / Decisiones pendientes (no son requisitos confirmados)**

1. Autenticación y gestión de usuarios/roles (solo se asume "sesión iniciada").
2. Baja/edición de datos del socio fuera de actividades, historial de pagos consultable, anulación de pagos erróneos.
3. Cierre de caja, reportes, comprobantes impresos/fiscales.
4. Filtro por actividad (candidata MR-US8), paginación y rendimiento del dashboard.
5. Cupos/capacidad por actividad (excluido en esta versión).
6. Tope máximo de recargo, pago parcial/adelantado, feriados (qué calendario rige).
7. RNF: seguridad, privacidad DNI, concurrencia, backup, auditoría de cambios de precio.
