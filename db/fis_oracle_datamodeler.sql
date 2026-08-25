-- ============================================================================
-- FIS — Sistema POS de Supermercado
-- DDL Oracle para importar en Oracle SQL Developer Data Modeler
--   (Archivo > Importar > Archivo DDL, base de datos Oracle 12c o superior)
--
-- Modelo normalizado hasta la Cuarta Forma Normal (4NF, definición de IBM):
-- ver db/NORMALIZATION.md para la justificación paso a paso (1NF → 4NF).
--
-- Regla transversal: los datos DERIVADOS (total de venta, IVA, folio,
-- severidad de alertas de stock) NO se almacenan en tablas base;
-- se exponen mediante vistas al final de este script.
-- ============================================================================

-- ─────────────────────────────────────────────
-- ROLES DE USUARIO  (3NF: el rol es entidad propia, no un texto repetido)
-- ─────────────────────────────────────────────
CREATE TABLE app_role (
    role_id    NUMBER(10)        GENERATED ALWAYS AS IDENTITY,
    role_name  VARCHAR2(30 CHAR) NOT NULL,
    CONSTRAINT pk_app_role PRIMARY KEY (role_id),
    CONSTRAINT uq_app_role_name UNIQUE (role_name)
);

COMMENT ON TABLE app_role IS 'Roles del sistema: ADMIN, CASHIER';

-- ─────────────────────────────────────────────
-- USUARIOS (cajeros y administradores)
-- ─────────────────────────────────────────────
CREATE TABLE app_user (
    user_id    NUMBER(10)         GENERATED ALWAYS AS IDENTITY,
    full_name  VARCHAR2(120 CHAR) NOT NULL,
    pin_hash   VARCHAR2(255 CHAR) NOT NULL,
    role_id    NUMBER(10)         NOT NULL,
    is_active  NUMBER(1)          DEFAULT 1 NOT NULL,
    CONSTRAINT pk_app_user PRIMARY KEY (user_id),
    CONSTRAINT uq_app_user_pin UNIQUE (pin_hash),
    CONSTRAINT fk_app_user_role FOREIGN KEY (role_id) REFERENCES app_role (role_id),
    CONSTRAINT ck_app_user_active CHECK (is_active IN (0, 1))
);

COMMENT ON COLUMN app_user.pin_hash IS 'Hash del PIN de acceso; nunca almacenar el PIN en claro';

-- ─────────────────────────────────────────────
-- CATEGORÍAS DE PRODUCTO
-- (3NF: nombre/color/icono dependen solo de la categoría, no del producto)
-- ─────────────────────────────────────────────
CREATE TABLE category (
    category_id  NUMBER(10)        GENERATED ALWAYS AS IDENTITY,
    name         VARCHAR2(60 CHAR) NOT NULL,
    color_hex    CHAR(7 CHAR)      NOT NULL,
    icon_name    VARCHAR2(30 CHAR) NOT NULL,
    CONSTRAINT pk_category PRIMARY KEY (category_id),
    CONSTRAINT uq_category_name UNIQUE (name),
    CONSTRAINT ck_category_color CHECK (REGEXP_LIKE(color_hex, '^#[0-9a-fA-F]{6}$'))
);

-- ─────────────────────────────────────────────
-- PASILLO (vista 3D del supermercado)
-- La posición del pasillo es un hecho del layout, no de la categoría.
-- Relación 1:1 opcional con category (UNIQUE sobre la FK).
-- ─────────────────────────────────────────────
CREATE TABLE aisle (
    aisle_id     NUMBER(10)   GENERATED ALWAYS AS IDENTITY,
    category_id  NUMBER(10)   NOT NULL,
    pos_x        NUMBER(8, 2) NOT NULL,
    pos_z        NUMBER(8, 2) NOT NULL,
    CONSTRAINT pk_aisle PRIMARY KEY (aisle_id),
    CONSTRAINT uq_aisle_category UNIQUE (category_id),
    CONSTRAINT fk_aisle_category FOREIGN KEY (category_id) REFERENCES category (category_id)
);

COMMENT ON TABLE aisle IS 'Ubicación de cada categoría en la vista 3D (Supermarket)';

-- ─────────────────────────────────────────────
-- PRODUCTOS
-- ─────────────────────────────────────────────
CREATE TABLE product (
    product_id   NUMBER(10)         GENERATED ALWAYS AS IDENTITY,
    category_id  NUMBER(10)         NOT NULL,
    name         VARCHAR2(120 CHAR) NOT NULL,
    unit_price   NUMBER(10, 2)      NOT NULL,
    stock_qty    NUMBER(10)         DEFAULT 0 NOT NULL,
    min_stock    NUMBER(10)         DEFAULT 0 NOT NULL,
    is_active    NUMBER(1)          DEFAULT 1 NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (product_id),
    CONSTRAINT uq_product_name UNIQUE (name),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category (category_id),
    CONSTRAINT ck_product_price CHECK (unit_price >= 0),
    CONSTRAINT ck_product_stock CHECK (stock_qty >= 0),
    CONSTRAINT ck_product_minstock CHECK (min_stock >= 0),
    CONSTRAINT ck_product_active CHECK (is_active IN (0, 1))
);

-- ─────────────────────────────────────────────
-- CÓDIGOS DE BARRAS  (4NF: hecho multivaluado nº 1 del producto)
-- Un producto puede tener varios códigos (EAN del fabricante, código interno).
-- BCNF: el código de barras determina al producto y es clave primaria aquí.
-- ─────────────────────────────────────────────
CREATE TABLE product_barcode (
    barcode     VARCHAR2(32 CHAR) NOT NULL,
    product_id  NUMBER(10)        NOT NULL,
    CONSTRAINT pk_product_barcode PRIMARY KEY (barcode),
    CONSTRAINT fk_barcode_product FOREIGN KEY (product_id) REFERENCES product (product_id)
);

-- ─────────────────────────────────────────────
-- PROVEEDORES y PRODUCTO↔PROVEEDOR
-- (4NF: hecho multivaluado nº 2, INDEPENDIENTE de los códigos de barras.
--  Mezclar barcode y supplier en una sola tabla del producto crearía la
--  dependencia multivaluada no trivial que la 4NF de IBM prohíbe.)
-- ─────────────────────────────────────────────
CREATE TABLE supplier (
    supplier_id  NUMBER(10)         GENERATED ALWAYS AS IDENTITY,
    name         VARCHAR2(120 CHAR) NOT NULL,
    phone        VARCHAR2(30 CHAR),
    email        VARCHAR2(120 CHAR),
    CONSTRAINT pk_supplier PRIMARY KEY (supplier_id),
    CONSTRAINT uq_supplier_name UNIQUE (name)
);

CREATE TABLE product_supplier (
    product_id   NUMBER(10) NOT NULL,
    supplier_id  NUMBER(10) NOT NULL,
    CONSTRAINT pk_product_supplier PRIMARY KEY (product_id, supplier_id),
    CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES product (product_id),
    CONSTRAINT fk_ps_supplier FOREIGN KEY (supplier_id) REFERENCES supplier (supplier_id)
);

-- ─────────────────────────────────────────────
-- VENTAS
-- El folio "VTA-001" y el total NO se almacenan: son derivados (ver vistas).
-- tax_rate es la tasa de IVA vigente al momento de la venta (hecho histórico).
-- ─────────────────────────────────────────────
CREATE TABLE sale (
    sale_id    NUMBER(10)   GENERATED ALWAYS AS IDENTITY,
    sale_date  TIMESTAMP    DEFAULT SYSTIMESTAMP NOT NULL,
    user_id    NUMBER(10)   NOT NULL,
    tax_rate   NUMBER(5, 4) DEFAULT 0.16 NOT NULL,
    CONSTRAINT pk_sale PRIMARY KEY (sale_id),
    CONSTRAINT fk_sale_user FOREIGN KEY (user_id) REFERENCES app_user (user_id),
    CONSTRAINT ck_sale_tax CHECK (tax_rate >= 0)
);

-- ─────────────────────────────────────────────
-- DETALLE DE VENTA
-- 2NF: qty y unit_price dependen de la clave completa (sale_id, product_id).
-- unit_price es el precio congelado al momento de la venta (hecho histórico,
-- no una dependencia transitiva del producto).
-- ─────────────────────────────────────────────
CREATE TABLE sale_item (
    sale_id     NUMBER(10)    NOT NULL,
    product_id  NUMBER(10)    NOT NULL,
    qty         NUMBER(10)    NOT NULL,
    unit_price  NUMBER(10, 2) NOT NULL,
    CONSTRAINT pk_sale_item PRIMARY KEY (sale_id, product_id),
    CONSTRAINT fk_item_sale FOREIGN KEY (sale_id) REFERENCES sale (sale_id),
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES product (product_id),
    CONSTRAINT ck_item_qty CHECK (qty > 0),
    CONSTRAINT ck_item_price CHECK (unit_price >= 0)
);

-- ============================================================================
-- VISTAS DE DATOS DERIVADOS
-- (una sola definición de "total" e "IVA" para toda la aplicación)
-- ============================================================================

CREATE OR REPLACE VIEW v_sale_totals AS
SELECT s.sale_id,
       'VTA-' || LPAD(TO_CHAR(s.sale_id), 3, '0')          AS folio,
       s.sale_date,
       s.user_id,
       u.full_name                                          AS cashier_name,
       s.tax_rate,
       SUM(i.qty * i.unit_price)                            AS subtotal,
       ROUND(SUM(i.qty * i.unit_price) * s.tax_rate, 2)     AS tax_amount,
       ROUND(SUM(i.qty * i.unit_price) * (1 + s.tax_rate), 2) AS total
FROM   sale s
JOIN   app_user u  ON u.user_id = s.user_id
JOIN   sale_item i ON i.sale_id = s.sale_id
GROUP BY s.sale_id, s.sale_date, s.user_id, u.full_name, s.tax_rate;

CREATE OR REPLACE VIEW v_stock_alert AS
SELECT p.product_id,
       p.name,
       p.category_id,
       c.name AS category_name,
       p.stock_qty,
       p.min_stock,
       CASE
           WHEN p.stock_qty = 0                        THEN 'critical'
           WHEN p.stock_qty <= FLOOR(p.min_stock / 2)  THEN 'warning'
           ELSE 'low'
       END AS severity
FROM   product p
JOIN   category c ON c.category_id = p.category_id
WHERE  p.is_active = 1
AND    p.stock_qty <= p.min_stock;
