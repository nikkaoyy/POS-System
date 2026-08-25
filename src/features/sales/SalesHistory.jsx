import React, { useState, useMemo } from 'react';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import './SalesHistory.css';

const SalesHistory = () => {
  const { sales } = useStore();
  const [filter, setFilter] = useState('all'); // all, today, week
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const filteredSales = useMemo(() => {
    let result = [...sales].reverse();
    const now = new Date();
    
    if (filter === 'today') {
      result = result.filter(s => {
        const d = new Date(s.date);
        return d.toDateString() === now.toDateString();
      });
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(s => new Date(s.date) >= weekAgo);
    }

    if (search) {
      result = result.filter(s => 
        s.id.toLowerCase().includes(search.toLowerCase()) || 
        s.cashier.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return result;
  }, [sales, filter, search]);

  return (
    <div className="sales-history-page anim-slide-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Historial de Ventas</h1>
          <p className="page-subtitle">{sales.length} ventas totales</p>
        </div>
      </header>

      <div className="filter-bar card">
        <div className="filter-pills">
          <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>Todas</button>
          <button className={`btn ${filter === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('today')}>Hoy</button>
          <button className={`btn ${filter === 'week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('week')}>Esta Semana</button>
        </div>
        <div className="search-wrap">
          <Icon name="search" size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por ID o Cajero..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="card table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Cajero</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-muted">No se encontraron ventas.</td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td className="mono">{sale.id}</td>
                    <td>
                      {new Date(sale.date).toLocaleDateString('es-MX', {dateStyle:'medium'})}{' '}
                      <span className="time-sub">{new Date(sale.date).toLocaleTimeString('es-MX', {timeStyle:'short'})}</span>
                    </td>
                    <td>{sale.items.reduce((acc, it) => acc + it.qty, 0)}</td>
                    <td className="fw-bold">${sale.total.toFixed(2)}</td>
                    <td>{sale.cashier}</td>
                    <td>
                      <button className="btn btn-icon btn-ghost" onClick={() => setSelectedSale(sale)}>
                        <Icon name="eye" size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="modal-overlay anim-pop">
          <div className="modal receipt-modal">
            <div className="modal-header">
              <h2 className="modal-title">Ticket de Venta</h2>
              <button className="btn btn-icon btn-ghost" onClick={() => setSelectedSale(null)}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="receipt-content">
              <div className="receipt-header">
                <h3>FIS POS</h3>
                <p className="mono">Ticket: {selectedSale.id}</p>
                <p>{new Date(selectedSale.date).toLocaleDateString('es-MX', {dateStyle:'medium'})} {new Date(selectedSale.date).toLocaleTimeString('es-MX', {timeStyle:'short'})}</p>
                <p>Cajero: {selectedSale.cashier}</p>
              </div>
              <div className="receipt-divider"></div>
              <table className="receipt-items">
                <thead>
                  <tr>
                    <th>CANT</th>
                    <th>DESCRIPCIÓN</th>
                    <th className="text-right">IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.qty}</td>
                      <td>{item.name}</td>
                      <td className="text-right">${(item.qty * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="receipt-divider"></div>
              <div className="receipt-totals">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span className="mono">${(selectedSale.total / 1.16).toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>IVA (16%)</span>
                  <span className="mono">${(selectedSale.total - (selectedSale.total / 1.16)).toFixed(2)}</span>
                </div>
                <div className="totals-row grand-total">
                  <span>TOTAL</span>
                  <span className="mono">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="receipt-footer">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
