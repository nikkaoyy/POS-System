import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import './Inventory.css';

const Inventory = () => {
  const { user, isAdmin } = useAuth();
  const { products, categories, updateProduct, addProduct, alerts } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // For forms
  const [formData, setFormData] = useState({ name: '', category: '', price: '', stock: '', minStock: '', barcode: '' });

  const lowStockCount = alerts?.lowStock || products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = alerts?.outOfStock || products.filter(p => p.stock === 0).length;
  const totalAlerts = lowStockCount + outOfStockCount;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      let matchStock = true;
      if (stockFilter === 'in-stock') matchStock = p.stock > p.minStock;
      if (stockFilter === 'low-stock') matchStock = p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'out-of-stock') matchStock = p.stock === 0;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, selectedCat, stockFilter]);

  const getStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Sin Stock', class: 'badge-err' };
    if (stock <= minStock) return { label: 'Stock Bajo', class: 'badge-warn' };
    return { label: 'En Stock', class: 'badge-ok' };
  };

  const getCategory = (id) => categories.find(c => c.id === id);

  const openEdit = (p) => {
    setCurrentProduct(p);
    setFormData({ ...p });
    setEditModalOpen(true);
  };

  const openAdd = () => {
    setFormData({ name: '', category: categories[0]?.id || '', price: 0, stock: 0, minStock: 0, barcode: '' });
    setAddModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    updateProduct(currentProduct.id, {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      minStock: parseInt(formData.minStock, 10)
    });
    setEditModalOpen(false);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addProduct({
      id: Date.now().toString(),
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      minStock: parseInt(formData.minStock, 10)
    });
    setAddModalOpen(false);
  };

  return (
    <div className="inv-container">
      <div className="inv-header">
        <div>
          <h1 className="inv-title">Inventario</h1>
          <p className="inv-subtitle">{products.length} productos en total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" size={18} /> Agregar Producto
          </button>
        )}
      </div>

      {totalAlerts > 0 && (
        <div className={`alert-banner ${outOfStockCount > 0 ? 'alert-err' : 'alert-warn'}`}>
          <Icon name="alert-triangle" size={20} />
          <span>Atención: Tienes {totalAlerts} productos con problemas de stock ({outOfStockCount} agotados).</span>
        </div>
      )}

      <div className="inv-filters card">
        <div className="form-group search-filter">
          <Icon name="search" size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group select-filter">
          <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group select-filter">
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="in-stock">En Stock</option>
            <option value="low-stock">Stock Bajo</option>
            <option value="out-of-stock">Sin Stock</option>
          </select>
        </div>
      </div>

      <div className="table-wrap card">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const cat = getCategory(p.category);
              const status = getStatus(p.stock, p.minStock);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="td-product">
                      <span className="td-name">{p.name}</span>
                      <span className="td-barcode">{p.barcode}</span>
                    </div>
                  </td>
                  <td>
                    <div className="td-cat">
                      <span className="cat-dot" style={{ backgroundColor: cat?.color || '#ccc' }}></span>
                      {cat?.name || 'Otro'}
                    </div>
                  </td>
                  <td className="td-price">${p.price.toFixed(2)}</td>
                  <td className={`td-stock stock-${status.class.split('-')[1]}`}>{p.stock}</td>
                  <td className="td-min">{p.minStock}</td>
                  <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Ver detalle">
                        <Icon name="eye" size={16} />
                      </button>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => openEdit(p)}>
                          <Icon name="edit" size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" className="td-empty">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isAdmin && isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal anim-pop">
            <div className="modal-header">
              <h2 className="modal-title">Editar Producto</h2>
              <button className="btn-icon btn-ghost" onClick={() => setEditModalOpen(false)}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input required type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Código de barras</label>
                  <input required type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdmin && isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal anim-pop">
            <div className="modal-header">
              <h2 className="modal-title">Agregar Producto</h2>
              <button className="btn-icon btn-ghost" onClick={() => setAddModalOpen(false)}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input required type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Código de barras</label>
                  <input required type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
