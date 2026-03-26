-- =============================================================================
-- Tabla: contacto_mensajes
-- Uso: mensajes del formulario de contacto (OptiEnergy)
-- Compatible: MySQL 8+, MariaDB 10.3+
-- =============================================================================

CREATE TABLE IF NOT EXISTS contacto_mensajes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  empresa           VARCHAR(150) NULL DEFAULT NULL,
  email             VARCHAR(150) NOT NULL,
  telefono          VARCHAR(50)  NULL DEFAULT NULL,
  mensaje           TEXT NOT NULL,
  archivo_adjunto   VARCHAR(255) NULL DEFAULT NULL COMMENT 'Ruta/nombre del archivo subido (PDF, Excel, imagen)',
  fecha_envio       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha_envio),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
