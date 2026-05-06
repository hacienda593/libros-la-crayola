-- Unidades educativas
CREATE TABLE IF NOT EXISTS unidades_educativas (
  id      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre  varchar(120) NOT NULL,
  activo  boolean NOT NULL DEFAULT true
);

-- Libros
CREATE TABLE IF NOT EXISTS libros (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad_educativa_id uuid NOT NULL REFERENCES unidades_educativas(id),
  titulo              varchar(150) NOT NULL,
  materia             varchar(80)  NOT NULL,
  grado               varchar(80)  NOT NULL,
  precio              numeric(8,2) NOT NULL,
  imagen_url          text,
  activo              boolean NOT NULL DEFAULT true
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos_libros (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo              varchar(6)   NOT NULL UNIQUE,
  nombre_estudiante   varchar(100) NOT NULL,
  nombre_padre        varchar(100) NOT NULL,
  telefono            varchar(15)  NOT NULL,
  unidad_educativa_id uuid NOT NULL REFERENCES unidades_educativas(id),
  libro_id            uuid NOT NULL REFERENCES libros(id),
  cantidad            integer NOT NULL DEFAULT 1,
  precio_unitario     numeric(8,2) NOT NULL,
  total               numeric(8,2) NOT NULL,
  -- Estado con el padre
  estado_pago         varchar(30) NOT NULL DEFAULT 'pendiente_pago',
  -- Estado con el proveedor
  estado_proveedor    varchar(30) NOT NULL DEFAULT 'pendiente_pedir',
  -- Comprobante
  comprobante_numero  varchar(50),
  comprobante_monto   numeric(8,2),
  -- Punto de venta
  punto_venta         varchar(80) NOT NULL DEFAULT 'web',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Comprobantes (para validar duplicados)
CREATE TABLE IF NOT EXISTS comprobantes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero      varchar(50)  NOT NULL UNIQUE,
  monto_total numeric(8,2) NOT NULL,
  monto_usado numeric(8,2) NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo        ON pedidos_libros(codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_libro         ON pedidos_libros(libro_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago   ON pedidos_libros(estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_prov   ON pedidos_libros(estado_proveedor);

-- RLS
ALTER TABLE unidades_educativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE libros               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_libros       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico select unidades" ON unidades_educativas FOR SELECT USING (true);
CREATE POLICY "publico select libros"   ON libros               FOR SELECT USING (true);
CREATE POLICY "publico insert pedidos"  ON pedidos_libros        FOR INSERT WITH CHECK (true);
CREATE POLICY "publico select pedidos"  ON pedidos_libros        FOR SELECT USING (true);
CREATE POLICY "publico update pedidos"  ON pedidos_libros        FOR UPDATE USING (true);
CREATE POLICY "publico select comp"     ON comprobantes          FOR SELECT USING (true);
CREATE POLICY "publico insert comp"     ON comprobantes          FOR INSERT WITH CHECK (true);
CREATE POLICY "publico update comp"     ON comprobantes          FOR UPDATE USING (true);

-- Datos iniciales: unidades educativas
INSERT INTO unidades_educativas (nombre, activo) VALUES
  ('Unidad Educativa Ejemplo A', true),
  ('Unidad Educativa Ejemplo B', false)
ON CONFLICT DO NOTHING;
