-- V2: CHAR(7) rellena con espacios (bpchar) y rompe el validate de Hibernate.
-- VARCHAR(7) conserva los valores existentes (siempre 7 caracteres 'AAAA-MM').
ALTER TABLE pago ALTER COLUMN periodo TYPE VARCHAR(7);
