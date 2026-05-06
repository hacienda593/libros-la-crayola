-- Actualizar nombres reales de unidades educativas
UPDATE lb_unidades SET nombre = 'Colegio Bernabe de Larraul de Fe y Alegria' WHERE id = '30fea9c5-1a53-48e1-a60b-aec57ac3f5cf';
UPDATE lb_unidades SET nombre = 'Escuela San Patricio de Fe y Alegria'        WHERE id = '9c61543f-5ca3-46b3-bf0c-3490e778ef5c';

-- Libros My English Workbook — Escuela San Patricio (activa)
INSERT INTO lb_libros (unidad_id, titulo, materia, grado, precio, imagen_url, activo) VALUES
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 1', 'Inglés', '1er Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 2', 'Inglés', '2do Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 3', 'Inglés', '3er Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 4', 'Inglés', '4to Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 5', 'Inglés', '5to Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 6', 'Inglés', '6to Grado', 12.50, null, true),
  ('9c61543f-5ca3-46b3-bf0c-3490e778ef5c', 'My English Workbook 7', 'Inglés', '7mo Grado', 12.50, null, true);
