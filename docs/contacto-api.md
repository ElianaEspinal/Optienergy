# API y estructura de datos – Formulario de contacto

## Objetivo

Los datos del formulario de contacto se envían al backend en **multipart/form-data** (para permitir adjuntar la factura eléctrica) y se almacenan en la tabla `contact_mensajes`. Esta documentación define la estructura de datos y buenas prácticas.

---

## 1. Petición (frontend → backend)

El formulario envía un **POST** con `Content-Type: multipart/form-data` al endpoint que configures (por ejemplo `/api/contacto`).

### Campos enviados

| Campo    | Tipo   | Obligatorio | Longitud / Límite | Descripción        |
|----------|--------|-------------|-------------------|--------------------|
| `nombre` | string | Sí          | max 200           | Nombre completo    |
| `email`  | string | Sí          | max 254           | Email válido       |
| `empresa`| string | No          | max 200           | Empresa (opcional) |
| `mensaje`| string | Sí          | max 2000          | Texto del mensaje   |
| `factura`| file   | No          | máx. 5 MB         | Factura eléctrica: PDF o imagen JPG/PNG (opcional). Permite hacer simulación previa antes de contactar. |

### Ejemplo (FormData)

El frontend construye un `FormData` con los campos anteriores. Si el usuario adjunta factura, se incluye el archivo en el campo `factura`. El backend debe aceptar `multipart/form-data`, validar tipos de archivo (PDF, JPEG, PNG) y tamaño (≤ 5 MB), guardar el archivo en disco/storage con nombre único y almacenar la ruta en la columna `factura_adjunto`.

---

## 2. Estructura de la base de datos

La tabla `contact_mensajes` debe tener los mismos nombres de campo para un mapeo directo:

| Columna          | Tipo         | Null | Default             | Descripción        |
|------------------|--------------|------|---------------------|--------------------|
| `id`             | INT (auto)   | No   | AUTO_INCREMENT      | Identificador único |
| `nombre`         | VARCHAR(200) | No   | —                   | Nombre completo    |
| `email`          | VARCHAR(254) | No   | —                   | Email              |
| `empresa`        | VARCHAR(200) | Sí   | NULL                | Empresa (opcional) |
| `mensaje`        | TEXT         | No   | —                   | Mensaje            |
| `factura_adjunto`| VARCHAR(255) | Sí   | NULL                | Ruta/nombre del archivo de factura subido (opcional) |
| `fecha_envio`    | DATETIME     | No   | CURRENT_TIMESTAMP   | Fecha de envío     |

El script SQL completo está en `database/contact_mensajes.sql` (MySQL/MariaDB y variante PostgreSQL).

---

## 3. Validación recomendada en el backend

- **nombre**: no vacío, trim, longitud ≤ 200.
- **email**: no vacío, formato válido, longitud ≤ 254.
- **empresa**: opcional; si viene, longitud ≤ 200.
- **mensaje**: no vacío, trim, longitud ≤ 2000.
- **factura** (archivo opcional): si se envía, validar tipo (`application/pdf`, `image/jpeg`, `image/png`) y tamaño ≤ 5 MB. Guardar con nombre único (ej. UUID + extensión) y registrar la ruta en `factura_adjunto`.

Usar **prepared statements** para evitar inyección SQL. No confiar solo en la validación del frontend.

---

## 4. Seguridad y escalabilidad

- **reCAPTCHA**: validar el token en el servidor si se usa reCAPTCHA v2/v3.
- **Honeypot**: el frontend envía un campo oculto `web`; si viene rellenado, no guardar ni responder como éxito.
- **Archivos**: guardar facturas fuera del document root o en storage seguro; no ejecutar contenido subido; validar MIME type en servidor.
- **Rate limiting**: limitar envíos por IP o por email (ej. 5 envíos/hora).
- **HTTPS**: usar siempre en producción.
- **Respuesta**: no devolver detalles internos en errores (ej. mensajes de SQL).

---

## 5. Respuesta sugerida del API

- **200 OK**: mensaje recibido correctamente. Cuerpo opcional, por ejemplo `{ "ok": true }`.
- **400 Bad Request**: validación fallida (campos obligatorios, email inválido, etc.).
- **429 Too Many Requests**: si aplicas rate limiting.
- **500 Internal Server Error**: error del servidor; mensaje genérico al cliente.

El frontend actual muestra un `alert` de éxito o error; puedes sustituirlo por un mensaje en la propia página.
