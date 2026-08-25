import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { initialProducts, initialSales, categories } from '../data/products';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState(initialSales);
  const [saleCounter, setSaleCounter] = useState(initialSales.length + 1);

  /* ── Cart Operations ── */
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        category: product.category,
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateCartQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, qty } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  /* ── Sales Operations ── */
  const completeSale = useCallback((cashierName) => {
    if (cart.length === 0) return null;

    const saleId = `VTA-${String(saleCounter).padStart(3, '0')}`;
    const sale = {
      id: saleId,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
      date: new Date().toISOString(),
      cashier: cashierName || 'Cajero',
    };

    // Decrease stock
    setProducts(prev =>
      prev.map(product => {
        const cartItem = cart.find(c => c.productId === product.id);
        if (cartItem) {
          return { ...product, stock: Math.max(0, product.stock - cartItem.qty) };
        }
        return product;
      })
    );

    setSales(prev => [sale, ...prev]);
    setSaleCounter(prev => prev + 1);
    setCart([]);
    return sale;
  }, [cart, saleCounter]);

  /* ── Product Operations ── */
  const updateProduct = useCallback((id, data) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id ? { ...product, ...data } : product
      )
    );
  }, []);

  const addProduct = useCallback((product) => {
    const maxId = Math.max(...products.map(p => p.id), 0);
    setProducts(prev => [...prev, { ...product, id: maxId + 1 }]);
  }, [products]);

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    return products
      .filter(p => p.stock <= p.minStock)
      .map(p => ({
        ...p,
        severity: p.stock === 0 ? 'critical' : p.stock <= Math.floor(p.minStock / 2) ? 'warning' : 'low',
        categoryName: categories.find(c => c.id === p.category)?.name || p.category,
      }))
      .sort((a, b) => {
        const order = { critical: 0, warning: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      });
  }, [products]);

  /* ── Stats for Dashboard ── */
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalSales = sales.length;
    const totalProducts = products.length;
    const alertCount = alerts.length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    // Sales by category
    const salesByCategory = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || 'other';
        if (!salesByCategory[cat]) salesByCategory[cat] = 0;
        salesByCategory[cat] += item.price * item.qty;
      });
    });

    // Top products
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, totalQty: 0, totalRevenue: 0 };
        }
        productSales[item.productId].totalQty += item.qty;
        productSales[item.productId].totalRevenue += item.price * item.qty;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Daily sales (last 7 days)
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date.split('T')[0] === dayStr);
      dailySales.push({
        date: dayStr,
        label: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        total: daySales.reduce((sum, s) => sum + s.total, 0),
        count: daySales.length,
      });
    }

    return { totalRevenue, totalSales, totalProducts, alertCount, outOfStock, salesByCategory, topProducts, dailySales };
  }, [sales, products, alerts]);

  const value = useMemo(() => ({
    products, cart, sales, categories,
    addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount,
    completeSale, updateProduct, addProduct,
    alerts, stats,
  }), [products, cart, sales, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount, completeSale, updateProduct, addProduct, alerts, stats]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
