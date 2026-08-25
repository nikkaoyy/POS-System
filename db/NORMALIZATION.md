# Normalización del modelo FIS — de los datos mock a 4NF

Este documento justifica, forma normal por forma normal (según las definiciones
de IBM), cómo el modelo implícito en `src/shared/data/products.js` y
`src/shared/context/StoreContext.jsx` se convirtió en el esquema de
`fis_oracle_datamodeler.sql` / `fis_supabase.sql`.

## Punto de partida (datos mock del frontend)

```js
// Una "venta" mock lo mezclaba todo:
{
  id: 'VTA-001',                       // folio con formato embebido
  items: [ { productId, name, qty, price } ],  // grupo repetitivo anidado
  total: 9.60,                         // dato derivado almacenado (y además inconsistente: sin IVA)
  cashier: 'Cajero',                   // nombre en claro, sin FK
}
// Un "producto" mezclaba catálogo + categoría-slug + barcode único:
{ id, name, category: 'dairy', price, stock, minStock, barcode }
```

## 1NF — Primera Forma Normal

**IBM**: cada columna contiene valores atómicos y no existen grupos repetitivos.

- El array `items` dentro de cada venta es un grupo repetitivo → se extrae a la
  tabla `sale_item` (una fila por producto vendido).
- El folio `VTA-001` empaqueta un prefijo + un consecutivo → se guarda solo la
  identidad numérica `sale_id`; el folio se formatea en la vista `v_sale_totals`.
- Todos los atributos restantes son atómicos.

## 2NF — Segunda Forma Normal

**IBM**: 1NF y ningún atributo no clave depende de una *parte* de una clave
compuesta (sin dependencias parciales).

- La única tabla con clave compuesta es `sale_item (sale_id, product_id)`.
  - `qty` depende del par completo (cuántas unidades de *ese* producto en *esa* venta). ✔
  - `unit_price` depende del par completo: es el precio vigente en el momento de
    esa venta (hecho histórico congelado), no un atributo del producto solo. ✔
- El `name` del producto que el mock copiaba dentro de cada item **se eliminó**:
  dependía solo de `product_id` (dependencia parcial) y se obtiene por FK.
  *Trade-off consciente*: si se renombra un producto, los tickets históricos
  muestran el nombre nuevo; si el negocio exige el nombre histórico, se
  re-agrega como snapshot documentado, igual que `unit_price`.

## 3NF — Tercera Forma Normal

**IBM**: 2NF y ningún atributo no clave depende transitivamente de la clave a
través de otro atributo no clave.

- En el mock, `category` era un slug con `name/color/icon` asociados en otra
  estructura: `product → category → (name, color_hex, icon_name)` es una
  dependencia transitiva → tabla `category` propia.
- `cashier: 'Cajero'` en la venta dependía de la persona, no de la venta →
  `sale.user_id` FK a `app_user`; el nombre vive una sola vez.
- El rol (`admin`/`cashier`) del usuario → tabla `app_role`.
- La posición del pasillo 3D no es un hecho de la categoría sino del layout →
  tabla `aisle` (1:1 opcional con `category`).

## BCNF — Forma Normal de Boyce-Codd

**IBM**: todo determinante es clave candidata.

- `barcode → product_id`: el código de barras determina al producto. Si viviera
  como columna de `product`, sería una clave candidata escondida; en
  `product_barcode` el barcode **es** la clave primaria. ✔
- En el resto de tablas, los únicos determinantes son las claves primarias y
  las columnas `UNIQUE` declaradas (`category.name`, `product.name`,
  `app_role.role_name`, `supplier.name`). ✔

## 4NF — Cuarta Forma Normal

**IBM**: BCNF y sin dependencias multivaluadas no triviales — una tabla no debe
contener dos o más hechos multivaluados *independientes* sobre la misma entidad.

Un producto tiene dos hechos multivaluados independientes entre sí:

1. **Sus códigos de barras** (EAN del fabricante, código interno, re-empaques).
2. **Sus proveedores** (varios proveedores pueden surtir el mismo producto).

Si ambos vivieran en una tabla `product_info (product_id, barcode, supplier_id)`,
cada combinación barcode×proveedor tendría que repetirse (producto con 2
barcodes y 3 proveedores = 6 filas redundantes), y borrar un proveedor obligaría
a tocar filas de barcodes: exactamente la anomalía que la 4NF prohíbe.

Solución: descomponer en dos tablas, cada una con **un solo** hecho multivaluado:

- `product_barcode (barcode PK, product_id FK)`
- `product_supplier (product_id, supplier_id) PK compuesta`

Toda dependencia multivaluada restante es trivial → el esquema está en 4NF.

## Regla transversal: derivados fuera de las tablas base

No es una forma normal, pero elimina la familia de bugs que hoy tiene el
frontend (total con IVA en el POS, sin IVA en `completeSale`, ticket que divide
entre 1.16): **cada dato derivado se define una sola vez, en una vista**.

| Derivado                          | Dónde vive        |
|-----------------------------------|-------------------|
| `subtotal`, `tax_amount`, `total` | `v_sale_totals`   |
| Folio `VTA-###`                   | `v_sale_totals`   |
| Alertas de stock y su `severity`  | `v_stock_alert`   |

## Correspondencia con el frontend

| Concepto del frontend (StoreContext) | Tabla/Vista               |
|--------------------------------------|---------------------------|
| `products`                           | `product` (+`product_barcode`) |
| `categories`                         | `category` (+`aisle` para la vista 3D) |
| `sales` + `completeSale`             | `sale` + `sale_item` + `v_sale_totals` |
| `alerts`                             | `v_stock_alert`           |
| `USERS` de AuthContext               | `app_user` + `app_role`   |
| `stats` del Dashboard                | agregaciones sobre `v_sale_totals` |
