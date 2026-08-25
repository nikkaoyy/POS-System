# FIS

FIS es un sistema de punto de venta para supermercados construido con React, Vite y Three.js. Incluye operaciones de caja, gestión de inventario, historial de ventas, dashboard administrativo y una vista 3D del supermercado.

## Funcionalidades

- Punto de venta con carrito y registro de ventas.
- Inventario de productos y alertas de stock.
- Historial y consulta de ventas.
- Dashboard con métricas para administradores.
- Vista 3D del layout del supermercado.
- Tema claro/oscuro.
- Modelo SQL documentado para Oracle y Supabase en `db/`.

## Requisitos

- Node.js `^20.19.0` o `>=22.12.0`
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Vite mostrará la URL local de la aplicación, normalmente `http://localhost:5173`.

## Otros comandos

```bash
npm run build      # Generar la versión de producción
npm run preview    # Previsualizar la versión de producción
```

## Acceso de demostración

La aplicación utiliza autenticación local para la demo:

| Rol | PIN |
| --- | --- |
| Administrador | `1234` |
| Cajero | `1111` |

Estos PIN son únicamente de demostración y no deben utilizarse en un entorno real.

## Estructura del proyecto

- `src/app/`: composición principal y navegación.
- `src/features/`: módulos de autenticación, POS, inventario, ventas, dashboard y supermercado.
- `src/shared/`: componentes, contextos y datos compartidos.
- `db/`: scripts SQL y documentación del modelo de datos.
- `public/`: recursos estáticos.

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE).
