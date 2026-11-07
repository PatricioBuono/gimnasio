import { defineConfig } from 'cypress';
import { Client } from 'pg';

/**
 * E2E contra el stack real (Angular + Spring Boot + PostgreSQL).
 *
 * Requisitos:
 *  - PostgreSQL accesible en DATABASE_URL (por defecto el contenedor de e2e en :55432).
 *  - Backend E2E en http://localhost:8081 y frontend en http://localhost:4200.
 *    (El backend de desarrollo en 8080 no se toca.)
 *
 * Las tareas de Node sembrar datos deterministas (fechas relativas) y consultan
 * la auditoría del cobro directamente en la base. No mockean la API.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:55432/gimnasio';

/** Puerto del PostgreSQL efímero de E2E; nunca debe apuntar a la base de desarrollo. */
const PUERTO_PG_E2E = '55432';

function asegurarBaseE2E(): void {
  const url = new URL(DATABASE_URL);
  if (url.port === PUERTO_PG_E2E || process.env.CYPRESS_ALLOW_DB_RESET === 'true') {
    return;
  }
  throw new Error(
    `limpiarBase rechazó ${url.host}: usá el PostgreSQL E2E (:${PUERTO_PG_E2E}) ` +
      'o definí CYPRESS_ALLOW_DB_RESET=true bajo tu responsabilidad.',
  );
}

/** Hash BCrypt de 'admin123' (mismo seed de V1__init.sql). */
const HASH_ADMIN = '$2b$10$YS.BOzgdMEJZlPqksEb2OeEA8m9s/q8Zgo2ZzCP4x1j0qg0CK.0yu';

async function conBase<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export default defineConfig({
  // Cypress 16: valores públicos compartidos con el navegador vía Cypress.expose().
  expose: {
    apiUrl: 'http://localhost:8081/api',
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10_000,
    setupNodeEvents(on) {
      on('task', {
        /** Deja la base en estado limpio conservando admin, precios y feriados. */
        async limpiarBase() {
          asegurarBaseE2E();
          return conBase(async (c) => {
            await c.query(
              'TRUNCATE TABLE comprobante, pago, socio_actividad, socio, actividad RESTART IDENTITY CASCADE',
            );
            await c.query('ALTER SEQUENCE comprobante_seq RESTART WITH 1');
            await c.query("DELETE FROM usuario WHERE username <> 'admin'");
            return null;
          });
        },

        async configurarPrecios({ cuota, recargo }: { cuota: number; recargo: number }) {
          return conBase(async (c) => {
            await c.query(
              "UPDATE parametro_precio SET valor = $1, actualizado_en = now() WHERE clave = 'CUOTA'",
              [cuota],
            );
            await c.query(
              "UPDATE parametro_precio SET valor = $1, actualizado_en = now() WHERE clave = 'RECARGO_SEMANAL'",
              [recargo],
            );
            return null;
          });
        },

        async crearActividad({
          nombre,
          descripcion = null,
        }: {
          nombre: string;
          descripcion?: string | null;
        }) {
          return conBase(async (c) => {
            const r = await c.query(
              "INSERT INTO actividad (nombre, descripcion, estado) VALUES ($1, $2, 'ACTIVA') RETURNING id",
              [nombre, descripcion],
            );
            return r.rows[0].id as number;
          });
        },

        /**
         * Crea un socio con `creado_en` relativo a hoy (mesesAtras).
         * Devuelve el id y el período que el backend considera esperado:
         * mes de alta + 1. Con mesesAtras >= 2 el socio queda moroso.
         */
        async sembrarSocio({
          dni,
          nombre,
          apellido,
          mesesAtras = 0,
          actividadId = null,
        }: {
          dni: string;
          nombre: string;
          apellido: string;
          mesesAtras?: number;
          actividadId?: number | null;
        }) {
          return conBase(async (c) => {
            const r = await c.query(
              "INSERT INTO socio (dni, nombre, apellido, creado_en) VALUES ($1, $2, $3, now() - ($4::int * INTERVAL '1 month')) RETURNING id",
              [dni, nombre, apellido, mesesAtras],
            );
            const id = r.rows[0].id as number;
            if (actividadId !== null) {
              await c.query(
                'INSERT INTO socio_actividad (socio_id, actividad_id) VALUES ($1, $2)',
                [id, actividadId],
              );
            }
            const periodo = await c.query(
              `SELECT to_char(
                        date_trunc('month', creado_en AT TIME ZONE 'America/Argentina/Mendoza')
                          + INTERVAL '1 month',
                        'YYYY-MM') AS periodo_esperado
                 FROM socio WHERE id = $1`,
              [id],
            );
            return { id, periodoEsperado: periodo.rows[0].periodo_esperado as string };
          });
        },

        /**
         * Escenario de dashboard: dos deudores (6 y 3 meses) con Musculación,
         * un socio al día con Crossfit y otro sin actividad.
         */
        async sembrarEscenarioDashboard() {
          return conBase(async (c) => {
            const musculacion = await c.query(
              "INSERT INTO actividad (nombre, descripcion, estado) VALUES ('Musculación', 'Fuerza', 'ACTIVA') RETURNING id",
            );
            const crossfit = await c.query(
              "INSERT INTO actividad (nombre, descripcion, estado) VALUES ('Crossfit', 'Funcional', 'ACTIVA') RETURNING id",
            );
            const musculacionId = musculacion.rows[0].id as number;
            const crossfitId = crossfit.rows[0].id as number;

            const insertar = async (
              dni: string,
              nombre: string,
              apellido: string,
              meses: number,
              actividadId: number | null,
            ) => {
              const r = await c.query(
                "INSERT INTO socio (dni, nombre, apellido, creado_en) VALUES ($1, $2, $3, now() - ($4::int * INTERVAL '1 month')) RETURNING id",
                [dni, nombre, apellido, meses],
              );
              const id = r.rows[0].id as number;
              if (actividadId !== null) {
                await c.query(
                  'INSERT INTO socio_actividad (socio_id, actividad_id) VALUES ($1, $2)',
                  [id, actividadId],
                );
              }
              return id;
            };

            return {
              musculacionId,
              crossfitId,
              deudorViejoId: await insertar('20000001', 'Bruno', 'Diaz', 6, musculacionId),
              deudorNuevoId: await insertar('20000002', 'Ana', 'Gomez', 3, musculacionId),
              alDiaConActividadId: await insertar('20000003', 'Carla', 'Perez', 0, crossfitId),
              alDiaSinActividadId: await insertar('20000004', 'Diego', 'Sosa', 0, null),
            };
          });
        },

        /** Crea un recepcionista con la misma clave del admin (solo para probar 403). */
        async sembrarRecepcionista({ username }: { username: string }) {
          return conBase(async (c) => {
            await c.query(
              "INSERT INTO usuario (username, password_hash, rol) VALUES ($1, $2, 'RECEPCIONISTA') ON CONFLICT (username) DO NOTHING",
              [username, HASH_ADMIN],
            );
            return null;
          });
        },

        /** Devuelve el pago/comprobante con su pista de auditoría, o null. */
        async consultarPago({ socioId, periodo }: { socioId: number; periodo: string }) {
          return conBase(async (c) => {
            const r = await c.query(
              `SELECT p.cuota, p.recargo, p.total, p.metodo, p.exonerado,
                      p.motivo_exoneracion, p.exonerado_por,
                      (p.exonerado_at IS NOT NULL) AS tiene_exonerado_at,
                      p.cobrado_por, c.nro, c.etiqueta
                 FROM pago p
                 JOIN comprobante c ON c.pago_id = p.id
                WHERE p.socio_id = $1 AND p.periodo = $2`,
              [socioId, periodo],
            );
            return r.rows[0] ?? null;
          });
        },
      });
    },
  },
});
