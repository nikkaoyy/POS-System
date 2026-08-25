import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import './Dashboard.css';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { stats, sales, categories } = useStore();

  if (!isAdmin) {
    return <div className="page-header"><h1 className="page-title">Acceso Denegado</h1></div>;
  }

  const { totalRevenue = 0, totalSales = 0, totalProducts = 0, alertCount = 0, dailySales = [], topProducts = [], salesByCategory = {} } = stats || {};

  const today = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' });

  // Calculate max for bar chart
  const maxDailySale = Math.max(...dailySales.map(d => d.total), 1);
  const maxCategorySale = Math.max(...Object.values(salesByCategory), 1);

  return (
    <div className="dashboard-page anim-slide-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
      </header>

      <div className="stats-grid stagger">
        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--c-accent-l)', color: 'var(--c-accent)' }}>
            <Icon name="shopping-cart" size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Ventas</span>
            <span className="stat-value">{totalSales}</span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--c-ok-l)', color: 'var(--c-ok)' }}>
            <Icon name="dollar-sign" size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Ingresos</span>
            <span className="stat-value">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--c-info-l)', color: 'var(--c-info)' }}>
            <Icon name="package" size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Productos</span>
            <span className="stat-value">{totalProducts}</span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--c-warn-l)', color: 'var(--c-warn)' }}>
            <Icon name="alert-triangle" size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Alertas de Stock</span>
            <span className="stat-value">{alertCount}</span>
          </div>
        </div>
      </div>

      <div className="card dashboard-chart-card stagger">
        <h2 className="card-title">Ventas - Últimos 7 días</h2>
        <div className="css-bar-chart">
          {dailySales.map((day, idx) => (
            <div key={idx} className="chart-bar-wrap">
              <div className="chart-bar-tooltip">${day.total.toFixed(2)}</div>
              <div 
                className="chart-bar" 
                style={{ height: `${(day.total / maxDailySale) * 100}%`, animationDelay: `${idx * 0.1}s` }}
              ></div>
              <div className="chart-label">{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid stagger">
        <div className="card">
          <h2 className="card-title">Top Productos</h2>
          <div className="top-products-list">
            {topProducts.slice(0, 5).map((prod, idx) => (
              <div key={idx} className="top-product-item">
                <span className="rank-badge">{idx + 1}</span>
                <div className="tp-details">
                  <span className="tp-name">{prod.name}</span>
                  <span className="tp-qty">{prod.totalQty} und.</span>
                </div>
                <span className="tp-revenue">${prod.totalRevenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Ventas por Categoría</h2>
          <div className="cat-bars">
            {categories.map((cat, idx) => {
              const amount = salesByCategory[cat.id] || 0;
              const percent = (amount / maxCategorySale) * 100;
              return (
                <div key={cat.id} className="cat-bar-item">
                  <div className="cat-bar-header">
                    <span>{cat.name}</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div 
                      className="cat-bar-fill" 
                      style={{ width: `${percent}%`, backgroundColor: cat.color || 'var(--c-accent)', animationDelay: `${idx * 0.1}s` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card dashboard-table-card stagger">
        <h2 className="card-title">Ventas Recientes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Cajero</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(-5).reverse().map(sale => (
                <tr key={sale.id}>
                  <td className="mono">{sale.id}</td>
                  <td>{new Date(sale.date).toLocaleDateString('es-MX', {dateStyle:'medium'})} {new Date(sale.date).toLocaleTimeString('es-MX', {timeStyle:'short'})}</td>
                  <td>{sale.items.reduce((acc, it) => acc + it.qty, 0)}</td>
                  <td className="fw-bold">${sale.total.toFixed(2)}</td>
                  <td>{sale.cashier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
