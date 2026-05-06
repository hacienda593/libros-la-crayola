-- Unidades educativas
CREATE TABLE IF NOT EXISTS lb_unidades (
  id      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre  varchar(120) NOT NULL,
  activo  boolean NOT NULL DEFAULT true
);

-- Libros
CREATE TABLE IF NOT EXISTS lb_libros (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad_id   uuid NOT NULL REFERENCES lb_unidades(id),
  titulo      varchar(150) NOT NULL,
  materia     varchar(80)  NOT NULL,
  grado       varchar(80)  NOT NULL,
  precio      numeric(8,2) NOT NULL,
  imagen_url  text,
  activo      boolean NOT NULL DEFAULT true
);

-- Pedidos
CREATE TABLE IF NOT EXISTS lb_pedidos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo      varchar(6)   NOT NULL UNIQUE,
  nombre_est  varchar(100) NOT NULL,
  nombre_pad  varchar(100) NOT NULL,
  telefono    varchar(15)  NOT NULL,
  unidad_id   uuid NOT NULL REFERENCES lb_unidades(id),
  libro_id    uuid NOT NULL REFERENCES lb_libros(id),
  cantidad    integer      NOT NULL DEFAULT 1,
  precio_unit numeric(8,2) NOT NULL,
  total       numeric(8,2) NOT NULL,
  estado_pago varchar(30)  NOT NULL DEFAULT 'pendiente_pago',
  estado_prov varchar(30)  NOT NULL DEFAULT 'pendiente_pedir',
  comp_numero varchar(50),
  comp_monto  numeric(8,2),
  punto_venta varchar(80)  NOT NULL DEFAULT 'web',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Comprobantes (valida duplicados y montos)
CREATE TABLE IF NOT EXISTS lb_comprobantes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero      varchar(50)  NOT NULL UNIQUE,
  monto_total numeric(8,2) NOT NULL,
  monto_usado numeric(8,2) NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lb_pedidos_codigo     ON lb_pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_lb_pedidos_libro       ON lb_pedidos(libro_id);
CREATE INDEX IF NOT EXISTS idx_lb_pedidos_estado_pago ON lb_pedidos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_lb_pedidos_estado_prov ON lb_pedidos(estado_prov);

-- RLS
ALTER TABLE lb_unidades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_libros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_pedidos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lb_comprobantes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lb select unidades"    ON lb_unidades    FOR SELECT USING (true);
CREATE POLICY "lb select libros"      ON lb_libros       FOR SELECT USING (true);
CREATE POLICY "lb insert pedidos"     ON lb_pedidos      FOR INSERT WITH CHECK (true);
CREATE POLICY "lb select pedidos"     ON lb_pedidos      FOR SELECT USING (true);
CREATE POLICY "lb update pedidos"     ON lb_pedidos      FOR UPDATE USING (true);
CREATE POLICY "lb select comprobantes" ON lb_comprobantes FOR SELECT USING (true);
CREATE POLICY "lb insert comprobantes" ON lb_comprobantes FOR INSERT WITH CHECK (true);
CREATE POLICY "lb update comprobantes" ON lb_comprobantes FOR UPDATE USING (true);

-- Datos iniciales
INSERT INTO lb_unidades (nombre, activo) VALUES
  ('Unidad Educativa Ejemplo A', true),
  ('Unidad Educativa Ejemplo B', false)
ON CONFLICT DO NOTHING;
