-- ============================================================================
-- FIS — Sistema POS de Supermercado
-- Script PostgreSQL para SUPABASE (pegar completo en SQL Editor y ejecutar,
-- o correr con: supabase db push / psql "$DATABASE_URL" -f db/fis_supabase.sql)
--
-- Mismo modelo lógico que db/fis_oracle_datamodeler.sql, normalizado hasta
-- la Cuarta Forma Normal (4NF, definición de IBM) — ver db/NORMALIZATION.md.
-- Incluye: tablas, vistas de derivados, RLS y datos semilla migrados desde
-- src/shared/data/products.js (8 categorías, 35 productos, 6 ventas demo).
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────
-- TABLAS
-- ─────────────────────────────────────────────

create table app_role (
    role_id    integer generated always as identity primary key,
    role_name  varchar(30) not null unique
);
comment on table app_role is 'Roles del sistema: ADMIN, CASHIER';

create table app_user (
    user_id    integer generated always as identity primary key,
    full_name  varchar(120) not null,
    pin_hash   varchar(255) not null unique,
    role_id    integer not null references app_role (role_id),
    is_active  boolean not null default true
);
comment on column app_user.pin_hash is 'Hash del PIN; nunca almacenar el PIN en claro';

create table category (
    category_id  integer generated always as identity primary key,
    name         varchar(60) not null unique,
    color_hex    char(7) not null check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
    icon_name    varchar(30) not null
);

create table aisle (
    aisle_id     integer generated always as identity primary key,
    category_id  integer not null unique references category (category_id),
    pos_x        numeric(8,2) not null,
    pos_z        numeric(8,2) not null
);
comment on table aisle is 'Ubicación de cada categoría en la vista 3D (Supermarket)';

create table product (
    product_id   integer generated always as identity primary key,
    category_id  integer not null references category (category_id),
    name         varchar(120) not null unique,
    unit_price   numeric(10,2) not null check (unit_price >= 0),
    stock_qty    integer not null default 0 check (stock_qty >= 0),
    min_stock    integer not null default 0 check (min_stock >= 0),
    is_active    boolean not null default true
);

-- 4NF: hecho multivaluado nº 1 del producto (varios códigos por producto).
-- BCNF: el código de barras determina al producto y es la clave primaria.
create table product_barcode (
    barcode     varchar(32) primary key,
    product_id  integer not null references product (product_id)
);

-- 4NF: hecho multivaluado nº 2, independiente de los códigos de barras.
create table supplier (
    supplier_id  integer generated always as identity primary key,
    name         varchar(120) not null unique,
    phone        varchar(30),
    email        varchar(120)
);

create table product_supplier (
    product_id   integer not null references product (product_id),
    supplier_id  integer not null references supplier (supplier_id),
    primary key (product_id, supplier_id)
);

-- Folio "VTA-001" y total NO se almacenan: derivados en v_sale_totals.
create table sale (
    sale_id    integer generated always as identity primary key,
    sale_date  timestamptz not null default now(),
    user_id    integer not null references app_user (user_id),
    tax_rate   numeric(5,4) not null default 0.16 check (tax_rate >= 0)
);

-- 2NF: qty y unit_price dependen de la clave completa (sale_id, product_id).
-- unit_price = precio congelado al momento de la venta (hecho histórico).
create table sale_item (
    sale_id     integer not null references sale (sale_id),
    product_id  integer not null references product (product_id),
    qty         integer not null check (qty > 0),
    unit_price  numeric(10,2) not null check (unit_price >= 0),
    primary key (sale_id, product_id)
);

-- ─────────────────────────────────────────────
-- VISTAS DE DATOS DERIVADOS
-- (una sola definición de "total" e "IVA" para toda la app)
-- ─────────────────────────────────────────────

create view v_sale_totals with (security_invoker = true) as
select s.sale_id,
       'VTA-' || lpad(s.sale_id::text, 3, '0')            as folio,
       s.sale_date,
       s.user_id,
       u.full_name                                         as cashier_name,
       s.tax_rate,
       sum(i.qty * i.unit_price)                           as subtotal,
       round(sum(i.qty * i.unit_price) * s.tax_rate, 2)    as tax_amount,
       round(sum(i.qty * i.unit_price) * (1 + s.tax_rate), 2) as total
from sale s
join app_user u  on u.user_id = s.user_id
join sale_item i on i.sale_id = s.sale_id
group by s.sale_id, s.sale_date, s.user_id, u.full_name, s.tax_rate;

create view v_stock_alert with (security_invoker = true) as
select p.product_id,
       p.name,
       p.category_id,
       c.name as category_name,
       p.stock_qty,
       p.min_stock,
       case
           when p.stock_qty = 0                       then 'critical'
           when p.stock_qty <= floor(p.min_stock / 2) then 'warning'
           else 'low'
       end as severity
from product p
join category c on c.category_id = p.category_id
where p.is_active
  and p.stock_qty <= p.min_stock;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Punto de partida: lectura pública (anon), escritura solo autenticados.
-- Endurecer cuando se integre Supabase Auth con roles reales.
-- ─────────────────────────────────────────────

alter table app_role         enable row level security;
alter table app_user         enable row level security;
alter table category         enable row level security;
alter table aisle            enable row level security;
alter table product          enable row level security;
alter table product_barcode  enable row level security;
alter table supplier         enable row level security;
alter table product_supplier enable row level security;
alter table sale             enable row level security;
alter table sale_item        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['app_role','app_user','category','aisle','product',
                           'product_barcode','supplier','product_supplier',
                           'sale','sale_item']
  loop
    execute format('create policy %I on %I for select to anon, authenticated using (true)',
                   t || '_read', t);
    execute format('create policy %I on %I for all to authenticated using (true) with check (true)',
                   t || '_write', t);
  end loop;
end $$;

-- ============================================================================
-- DATOS SEMILLA (migrados de src/shared/data/products.js)
-- El orden de inserción importa: las identidades generan los ids 1..N
-- que referencian las ventas demo.
-- ============================================================================

insert into app_role (role_name) values ('ADMIN'), ('CASHIER');

-- PIN demo: 1234 (admin), 1111 (cajero) — se guarda solo el hash SHA-256
insert into app_user (full_name, pin_hash, role_id) values
  ('Administrador', encode(extensions.digest('1234', 'sha256'), 'hex'), 1),
  ('Cajero',        encode(extensions.digest('1111', 'sha256'), 'hex'), 2);

-- Categorías (ids 1..8 en este orden)
insert into category (name, color_hex, icon_name) values
  ('Lácteos',           '#3b82f6', 'milk'),
  ('Carnes',            '#ef4444', 'beef'),
  ('Frutas y Verduras', '#22c55e', 'apple'),
  ('Bebidas',           '#06b6d4', 'cup'),
  ('Panadería',         '#f59e0b', 'bread'),
  ('Limpieza',          '#8b5cf6', 'spray'),
  ('Snacks',            '#f97316', 'cookie'),
  ('Enlatados',         '#64748b', 'can');

-- Pasillos de la vista 3D (una posición por categoría, rejilla 4×2)
insert into aisle (category_id, pos_x, pos_z) values
  (1, -6, -2), (2, -2, -2), (3, 2, -2), (4, 6, -2),
  (5, -6,  2), (6, -2,  2), (7, 2,  2), (8, 6,  2);

-- Productos (ids 1..35 en este orden — los referencian las ventas demo)
insert into product (name, category_id, unit_price, stock_qty, min_stock) values
  ('Leche Entera 1L',            1, 1.50,  45, 10),
  ('Yogurt Natural 500g',        1, 2.30,  28,  8),
  ('Queso Fresco 400g',          1, 3.80,   3,  5),
  ('Mantequilla 250g',           1, 2.90,  15,  5),
  ('Crema Ácida 200ml',          1, 1.80,  20,  6),
  ('Pechuga de Pollo 1kg',       2, 5.50,  20,  8),
  ('Carne Molida 500g',          2, 4.20,   2,  5),
  ('Chuletas de Cerdo 1kg',      2, 6.80,  12,  5),
  ('Salchichas 500g',            2, 3.10,  18,  6),
  ('Manzana Roja 1kg',           3, 2.10,  35, 10),
  ('Plátano 1kg',                3, 1.20,   0, 15),
  ('Tomate 1kg',                 3, 1.80,  50, 10),
  ('Lechuga Romana',             3, 0.90,   8, 10),
  ('Cebolla Blanca 1kg',         3, 1.40,  40, 10),
  ('Aguacate Hass',              3, 2.50,   4,  8),
  ('Agua Mineral 1.5L',          4, 0.80, 100, 20),
  ('Refresco Cola 2L',           4, 1.90,  60, 15),
  ('Jugo de Naranja 1L',         4, 2.50,   4,  8),
  ('Cerveza Lager 6pack',        4, 5.80,  30, 10),
  ('Pan Blanco 500g',            5, 1.20,  30, 10),
  ('Pan Integral 500g',          5, 1.60,  22,  8),
  ('Tortillas Maíz 1kg',         5, 1.10,   0, 12),
  ('Bollería Surtida 6pz',       5, 3.20,  14,  5),
  ('Detergente Líquido 1L',      6, 3.50,  18,  5),
  ('Jabón de Manos 500ml',       6, 2.20,  25,  8),
  ('Papel Higiénico 12 rollos',  6, 4.50,   1,  5),
  ('Cloro 1L',                   6, 1.80,  30,  8),
  ('Papas Fritas 200g',          7, 1.80,  40, 10),
  ('Galletas Chocolate 300g',    7, 2.40,  32,  8),
  ('Cacahuates 250g',            7, 1.50,   5, 10),
  ('Palomitas Microondas',       7, 1.90,  22,  6),
  ('Atún en Lata 170g',          8, 1.60,  55, 10),
  ('Frijoles Negros 400g',       8, 1.30,  42, 10),
  ('Maíz Dulce 340g',            8, 1.40,  38, 10),
  ('Salsa de Tomate 400g',       8, 1.20,   2,  8);

-- Códigos de barras (uno por producto; la tabla admite añadir más)
insert into product_barcode (barcode, product_id)
select '75010000' || lpad(gs::text, 2, '0'), gs
from generate_series(1, 35) as gs;

-- Ventas demo (sale_id 1..6 = folios VTA-001..VTA-006)
-- user_id: 1 = Administrador, 2 = Cajero
insert into sale (sale_date, user_id, tax_rate) values
  ('2026-08-09T10:23:00', 2, 0.16),
  ('2026-08-09T11:45:00', 1, 0.16),
  ('2026-08-09T14:12:00', 2, 0.16),
  ('2026-08-08T09:30:00', 2, 0.16),
  ('2026-08-08T18:05:00', 1, 0.16),
  ('2026-08-07T12:20:00', 2, 0.16);

insert into sale_item (sale_id, product_id, qty, unit_price) values
  (1,  1, 2, 1.50), (1, 20, 1, 1.20), (1, 28, 3, 1.80),
  (2,  6, 1, 5.50), (2, 12, 2, 1.80), (2, 14, 1, 1.40), (2, 17, 2, 1.90),
  (3, 16, 6, 0.80), (3, 29, 2, 2.40),
  (4, 24, 1, 3.50), (4, 25, 2, 2.20), (4, 27, 1, 1.80),
  (5, 19, 2, 5.80), (5, 31, 3, 1.90), (5, 28, 2, 1.80),
  (6,  2, 3, 2.30), (6, 10, 2, 2.10), (6, 21, 1, 1.60);
