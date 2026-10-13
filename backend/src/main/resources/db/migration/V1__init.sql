-- V1__init.sql — Fase 1 (F1-T1 + F1-T2). Setup base + usuarios/roles + admin maestro.
-- TZ de sesión para cálculos de mora: America/Argentina/Mendoza.
SET TIME ZONE 'America/Argentina/Mendoza';

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SEQUENCE IF NOT EXISTS comprobante_seq START 1;

CREATE TABLE IF NOT EXISTS usuario (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL CONSTRAINT uq_usuario_username UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol           VARCHAR(20)  NOT NULL CONSTRAINT ck_usuario_rol CHECK (rol IN ('ADMIN', 'RECEPCIONISTA')),
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actividad (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA' CONSTRAINT ck_actividad_estado CHECK (estado IN ('ACTIVA', 'INHABILITADA')),
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_actividad_nombre ON actividad (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS socio (
  id        SERIAL PRIMARY KEY,
  dni       VARCHAR(20)  NOT NULL CONSTRAINT uq_socio_dni UNIQUE,
  nombre    VARCHAR(100) NOT NULL,
  apellido  VARCHAR(100) NOT NULL,
  creado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_socio_dni ON socio USING btree (dni);
CREATE INDEX IF NOT EXISTS idx_socio_nombre_trgm ON socio USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_socio_apellido_trgm ON socio USING gin (apellido gin_trgm_ops);

CREATE TABLE IF NOT EXISTS socio_actividad (
  socio_id     INTEGER NOT NULL REFERENCES socio (id) ON DELETE CASCADE,
  actividad_id INTEGER NOT NULL REFERENCES actividad (id) ON DELETE RESTRICT,
  PRIMARY KEY (socio_id, actividad_id)
);

CREATE TABLE IF NOT EXISTS parametro_precio (
  clave         VARCHAR(50)   NOT NULL PRIMARY KEY,
  valor         NUMERIC(10,2) NOT NULL,
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);
ALTER TABLE parametro_precio ADD CONSTRAINT ck_parametro_valor CHECK (
  (clave = 'CUOTA' AND valor > 0) OR
  (clave = 'RECARGO_SEMANAL' AND valor >= 0)
);

CREATE TABLE IF NOT EXISTS feriado (
  fecha       DATE         PRIMARY KEY,
  descripcion VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS pago (
  id                 SERIAL PRIMARY KEY,
  socio_id           INTEGER      NOT NULL REFERENCES socio (id) ON DELETE RESTRICT,
  periodo            CHAR(7)      NOT NULL,
  cuota              NUMERIC(10,2) NOT NULL CONSTRAINT ck_pago_cuota CHECK (cuota > 0),
  recargo            NUMERIC(10,2) NOT NULL DEFAULT 0 CONSTRAINT ck_pago_recargo CHECK (recargo >= 0),
  total              NUMERIC(10,2) NOT NULL CONSTRAINT ck_pago_total CHECK (total > 0),
  metodo             VARCHAR(20)  NOT NULL CONSTRAINT ck_pago_metodo CHECK (metodo IN ('EFECTIVO', 'TRANSFERENCIA')),
  exonerado          BOOLEAN      NOT NULL DEFAULT FALSE,
  motivo_exoneracion TEXT,
  exonerado_por      INTEGER REFERENCES usuario (id),
  exonerado_at       TIMESTAMPTZ,
  cobrado_por        INTEGER REFERENCES usuario (id),
  creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_pago_socio_periodo UNIQUE (socio_id, periodo)
);

CREATE TABLE IF NOT EXISTS comprobante (
  id        SERIAL PRIMARY KEY,
  nro       BIGINT      NOT NULL DEFAULT nextval('comprobante_seq') CONSTRAINT uq_comprobante_nro UNIQUE,
  pago_id   INTEGER     NOT NULL UNIQUE REFERENCES pago (id) ON DELETE RESTRICT,
  etiqueta  VARCHAR(50),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parámetros iniciales (se ajustan en Fase 2 por Admin)
INSERT INTO parametro_precio (clave, valor) VALUES ('CUOTA', 1.00), ('RECARGO_SEMANAL', 0.00)
ON CONFLICT (clave) DO NOTHING;

-- Admin maestro (clave inicial: admin123 — cambiar en producción).
-- Hash BCrypt (coste 10) de 'admin123'. Nunca commitear claves en claro.
INSERT INTO usuario (username, password_hash, rol)
VALUES ('admin', '$2b$10$YS.BOzgdMEJZlPqksEb2OeEA8m9s/q8Zgo2ZzCP4x1j0qg0CK.0yu', 'ADMIN')
ON CONFLICT (username) DO NOTHING;
