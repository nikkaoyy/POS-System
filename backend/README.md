# FIS POS Backend

API REST construida con Spring Boot 3.5, Java 25, JDBC y PostgreSQL. Usa el modelo definido en `../db/fis_supabase.sql`, por lo que funciona con PostgreSQL local o con Supabase mediante su cadena JDBC.

## Requisitos

- JDK 25+
- Maven 3.9+
- PostgreSQL o proyecto Supabase inicializado con `db/fis_supabase.sql`

## Configuración

PowerShell:

```powershell
$env:DATABASE_URL = "jdbc:postgresql://HOST:5432/postgres?sslmode=require"
$env:DATABASE_USERNAME = "postgres"
$env:DATABASE_PASSWORD = "TU_PASSWORD"
$env:CORS_ORIGIN = "http://localhost:5173"
```

Para Supabase, usa el host y puerto de la conexión directa o del pooler que proporciona el panel de conexión. No guardes la contraseña en el repositorio.

## Ejecutar

```powershell
mvn spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

## Endpoints

Todas las rutas salvo login, logout y health requieren `Authorization: Bearer <token>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/login` | Iniciar sesión con `{ "pin": "1234" }` |
| GET | `/api/auth/me` | Usuario de la sesión actual |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/categories` | Categorías y posiciones de pasillos |
| GET | `/api/products` | Catálogo; admite `categoryId`, `search`, `barcode` |
| POST | `/api/products` | Crear producto, solo ADMIN |
| PUT | `/api/products/{id}` | Actualizar producto, solo ADMIN |
| GET | `/api/inventory/alerts` | Alertas derivadas de stock |
| GET | `/api/sales` | Historial de ventas |
| POST | `/api/sales` | Registrar venta y descontar stock atomically |
| GET | `/api/dashboard` | Métricas principales |
| GET | `/actuator/health` | Estado del servicio |

Crear una venta:

```json
{
  "items": [
    { "productId": 1, "qty": 2 },
    { "productId": 20, "qty": 1 }
  ],
  "taxRate": 0.16
}
```

La venta bloquea las filas de producto dentro de una transacción, valida existencias, congela el precio histórico y devuelve subtotal, IVA, total y folio.

## Verificación

```powershell
mvn test
```

