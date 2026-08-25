export const categories = [
  { id: 'dairy', name: 'Lácteos', color: '#3b82f6', icon: 'milk' },
  { id: 'meat', name: 'Carnes', color: '#ef4444', icon: 'beef' },
  { id: 'produce', name: 'Frutas y Verduras', color: '#22c55e', icon: 'apple' },
  { id: 'beverages', name: 'Bebidas', color: '#06b6d4', icon: 'cup' },
  { id: 'bakery', name: 'Panadería', color: '#f59e0b', icon: 'bread' },
  { id: 'cleaning', name: 'Limpieza', color: '#8b5cf6', icon: 'spray' },
  { id: 'snacks', name: 'Snacks', color: '#f97316', icon: 'cookie' },
  { id: 'canned', name: 'Enlatados', color: '#64748b', icon: 'can' },
];

export const initialProducts = [
  // Lácteos
  { id: 1, name: 'Leche Entera 1L', category: 'dairy', price: 1.50, stock: 45, minStock: 10, barcode: '7501000001' },
  { id: 2, name: 'Yogurt Natural 500g', category: 'dairy', price: 2.30, stock: 28, minStock: 8, barcode: '7501000002' },
  { id: 3, name: 'Queso Fresco 400g', category: 'dairy', price: 3.80, stock: 3, minStock: 5, barcode: '7501000003' },
  { id: 4, name: 'Mantequilla 250g', category: 'dairy', price: 2.90, stock: 15, minStock: 5, barcode: '7501000004' },
  { id: 5, name: 'Crema Ácida 200ml', category: 'dairy', price: 1.80, stock: 20, minStock: 6, barcode: '7501000005' },

  // Carnes
  { id: 6, name: 'Pechuga de Pollo 1kg', category: 'meat', price: 5.50, stock: 20, minStock: 8, barcode: '7501000006' },
  { id: 7, name: 'Carne Molida 500g', category: 'meat', price: 4.20, stock: 2, minStock: 5, barcode: '7501000007' },
  { id: 8, name: 'Chuletas de Cerdo 1kg', category: 'meat', price: 6.80, stock: 12, minStock: 5, barcode: '7501000008' },
  { id: 9, name: 'Salchichas 500g', category: 'meat', price: 3.10, stock: 18, minStock: 6, barcode: '7501000009' },

  // Frutas y Verduras
  { id: 10, name: 'Manzana Roja 1kg', category: 'produce', price: 2.10, stock: 35, minStock: 10, barcode: '7501000010' },
  { id: 11, name: 'Plátano 1kg', category: 'produce', price: 1.20, stock: 0, minStock: 15, barcode: '7501000011' },
  { id: 12, name: 'Tomate 1kg', category: 'produce', price: 1.80, stock: 50, minStock: 10, barcode: '7501000012' },
  { id: 13, name: 'Lechuga Romana', category: 'produce', price: 0.90, stock: 8, minStock: 10, barcode: '7501000013' },
  { id: 14, name: 'Cebolla Blanca 1kg', category: 'produce', price: 1.40, stock: 40, minStock: 10, barcode: '7501000014' },
  { id: 15, name: 'Aguacate Hass', category: 'produce', price: 2.50, stock: 4, minStock: 8, barcode: '7501000015' },

  // Bebidas
  { id: 16, name: 'Agua Mineral 1.5L', category: 'beverages', price: 0.80, stock: 100, minStock: 20, barcode: '7501000016' },
  { id: 17, name: 'Refresco Cola 2L', category: 'beverages', price: 1.90, stock: 60, minStock: 15, barcode: '7501000017' },
  { id: 18, name: 'Jugo de Naranja 1L', category: 'beverages', price: 2.50, stock: 4, minStock: 8, barcode: '7501000018' },
  { id: 19, name: 'Cerveza Lager 6pack', category: 'beverages', price: 5.80, stock: 30, minStock: 10, barcode: '7501000019' },

  // Panadería
  { id: 20, name: 'Pan Blanco 500g', category: 'bakery', price: 1.20, stock: 30, minStock: 10, barcode: '7501000020' },
  { id: 21, name: 'Pan Integral 500g', category: 'bakery', price: 1.60, stock: 22, minStock: 8, barcode: '7501000021' },
  { id: 22, name: 'Tortillas Maíz 1kg', category: 'bakery', price: 1.10, stock: 0, minStock: 12, barcode: '7501000022' },
  { id: 23, name: 'Bollería Surtida 6pz', category: 'bakery', price: 3.20, stock: 14, minStock: 5, barcode: '7501000023' },

  // Limpieza
  { id: 24, name: 'Detergente Líquido 1L', category: 'cleaning', price: 3.50, stock: 18, minStock: 5, barcode: '7501000024' },
  { id: 25, name: 'Jabón de Manos 500ml', category: 'cleaning', price: 2.20, stock: 25, minStock: 8, barcode: '7501000025' },
  { id: 26, name: 'Papel Higiénico 12 rollos', category: 'cleaning', price: 4.50, stock: 1, minStock: 5, barcode: '7501000026' },
  { id: 27, name: 'Cloro 1L', category: 'cleaning', price: 1.80, stock: 30, minStock: 8, barcode: '7501000027' },

  // Snacks
  { id: 28, name: 'Papas Fritas 200g', category: 'snacks', price: 1.80, stock: 40, minStock: 10, barcode: '7501000028' },
  { id: 29, name: 'Galletas Chocolate 300g', category: 'snacks', price: 2.40, stock: 32, minStock: 8, barcode: '7501000029' },
  { id: 30, name: 'Cacahuates 250g', category: 'snacks', price: 1.50, stock: 5, minStock: 10, barcode: '7501000030' },
  { id: 31, name: 'Palomitas Microondas', category: 'snacks', price: 1.90, stock: 22, minStock: 6, barcode: '7501000031' },

  // Enlatados
  { id: 32, name: 'Atún en Lata 170g', category: 'canned', price: 1.60, stock: 55, minStock: 10, barcode: '7501000032' },
  { id: 33, name: 'Frijoles Negros 400g', category: 'canned', price: 1.30, stock: 42, minStock: 10, barcode: '7501000033' },
  { id: 34, name: 'Maíz Dulce 340g', category: 'canned', price: 1.40, stock: 38, minStock: 10, barcode: '7501000034' },
  { id: 35, name: 'Salsa de Tomate 400g', category: 'canned', price: 1.20, stock: 2, minStock: 8, barcode: '7501000035' },
];

export const initialSales = [
  {
    id: 'VTA-001',
    items: [
      { productId: 1, name: 'Leche Entera 1L', qty: 2, price: 1.50 },
      { productId: 20, name: 'Pan Blanco 500g', qty: 1, price: 1.20 },
      { productId: 28, name: 'Papas Fritas 200g', qty: 3, price: 1.80 },
    ],
    total: 9.60,
    date: '2026-08-09T10:23:00',
    cashier: 'Cajero',
  },
  {
    id: 'VTA-002',
    items: [
      { productId: 6, name: 'Pechuga de Pollo 1kg', qty: 1, price: 5.50 },
      { productId: 12, name: 'Tomate 1kg', qty: 2, price: 1.80 },
      { productId: 14, name: 'Cebolla Blanca 1kg', qty: 1, price: 1.40 },
      { productId: 17, name: 'Refresco Cola 2L', qty: 2, price: 1.90 },
    ],
    total: 14.30,
    date: '2026-08-09T11:45:00',
    cashier: 'Administrador',
  },
  {
    id: 'VTA-003',
    items: [
      { productId: 16, name: 'Agua Mineral 1.5L', qty: 6, price: 0.80 },
      { productId: 29, name: 'Galletas Chocolate 300g', qty: 2, price: 2.40 },
    ],
    total: 9.60,
    date: '2026-08-09T14:12:00',
    cashier: 'Cajero',
  },
  {
    id: 'VTA-004',
    items: [
      { productId: 24, name: 'Detergente Líquido 1L', qty: 1, price: 3.50 },
      { productId: 25, name: 'Jabón de Manos 500ml', qty: 2, price: 2.20 },
      { productId: 27, name: 'Cloro 1L', qty: 1, price: 1.80 },
    ],
    total: 9.70,
    date: '2026-08-08T09:30:00',
    cashier: 'Cajero',
  },
  {
    id: 'VTA-005',
    items: [
      { productId: 19, name: 'Cerveza Lager 6pack', qty: 2, price: 5.80 },
      { productId: 31, name: 'Palomitas Microondas', qty: 3, price: 1.90 },
      { productId: 28, name: 'Papas Fritas 200g', qty: 2, price: 1.80 },
    ],
    total: 20.90,
    date: '2026-08-08T18:05:00',
    cashier: 'Administrador',
  },
  {
    id: 'VTA-006',
    items: [
      { productId: 2, name: 'Yogurt Natural 500g', qty: 3, price: 2.30 },
      { productId: 10, name: 'Manzana Roja 1kg', qty: 2, price: 2.10 },
      { productId: 21, name: 'Pan Integral 500g', qty: 1, price: 1.60 },
    ],
    total: 12.70,
    date: '2026-08-07T12:20:00',
    cashier: 'Cajero',
  },
];
