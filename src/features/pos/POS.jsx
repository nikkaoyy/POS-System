import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import './POS.css';

const POS = () => {
  const { user } = useAuth();
  const { 
    products, 
    cart, 
    categories, 
    addToCart, 
    removeFromCart, 
    updateCartQty, 
    clearCart, 
    cartTotal, 
    cartCount, 
    completeSale 
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  const handleCheckout = () => {
    if (cartCount === 0) return;
    completeSale(user?.name || 'Cajero');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getStockColor = (stock, minStock) => {
    if (stock === 0) return 'stock-red';
    if (stock <= minStock) return 'stock-yellow';
    return 'stock-green';
  };

  const subtotal = cartTotal;
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  return (
    <div className="pos-container">
      {/* Left Panel */}
      <div className="pos-main">
        <div className="pos-header">
          <div className="search-bar form-group">
            <Icon name="search" size={20} />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="category-pills">
            <button 
              className={`pill ${selectedCat === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCat('all')}
            >
              Todos
            </button>
            {categories.map(c => (
              <button 
                key={c.id} 
                className={`pill ${selectedCat === c.id ? 'active' : ''}`}
                onClick={() => setSelectedCat(c.id)}
              >
                <span className="cat-dot" style={{ backgroundColor: c.color }}></span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => {
              const cat = categories.find(c => c.id === p.category);
              const stockClass = getStockColor(p.stock, p.minStock);
              const disabled = p.stock === 0;

              return (
                <div 
                  key={p.id} 
                  className={`product-card card ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && addToCart(p)}
                >
                  <div className="product-card-top">
                    <span className="product-cat">
                      <span className="cat-dot" style={{ backgroundColor: cat?.color || '#ccc' }}></span>
                      {cat?.name || 'Otro'}
                    </span>
                    <span className={`badge badge-sm ${stockClass}`}>
                      {p.stock} un.
                    </span>
                  </div>
                  <h3 className="product-name">{p.name}</h3>
                  <div className="product-price">${p.price.toFixed(2)}</div>
                  {!disabled && <div className="product-overlay"><Icon name="plus" size={24} /></div>}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <Icon name="box" size={48} />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="pos-cart glass">
        <div className="cart-header">
          <h2>Carrito <span className="badge badge-accent">{cartCount}</span></h2>
          {cartCount > 0 && (
            <button className="btn btn-ghost btn-sm btn-icon" onClick={clearCart} title="Vaciar">
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length > 0 ? (
            cart.map(item => (
              <div key={item.id} className="cart-item anim-slide-in">
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">${item.price.toFixed(2)}</div>
                </div>
                <div className="item-actions">
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => updateCartQty(item.id, item.qty - 1)}>
                      <Icon name="minus" size={14} />
                    </button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateCartQty(item.id, item.qty + 1)}>
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <Icon name="shopping-cart" size={48} />
              <p>El carrito está vacío</p>
            </div>
          )}
        </div>

        <div className="cart-footer">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA (16%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-primary btn-cobrar" 
            disabled={cartCount === 0}
            onClick={handleCheckout}
          >
            <Icon name="credit-card" size={20} />
            Cobrar ${total.toFixed(2)}
          </button>
        </div>
      </div>
      
      {showSuccess && (
        <div className="toast-success anim-pop">
          <Icon name="check" size={24} />
          Venta completada con éxito
        </div>
      )}
    </div>
  );
};

export default POS;
