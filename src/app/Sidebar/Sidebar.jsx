import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { useStore } from '../../shared/context/StoreContext';
import Icon from '../../shared/components/Icons';
import ThemeToggle from '../../shared/components/ThemeToggle';
import './Sidebar.css';

const Sidebar = ({ activePage, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const { alerts } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const alertCount = alerts ? alerts.length : 0;

  const navItems = [
    { icon: 'shopping-cart', label: 'Punto de Venta', page: 'pos' },
    { icon: 'package', label: 'Inventario', page: 'inventory', badge: alertCount },
    { icon: 'clock', label: 'Historial de Ventas', page: 'history' },
    ...(isAdmin ? [{ icon: 'bar-chart', label: 'Dashboard', page: 'dashboard' }] : []),
    { icon: 'store', label: 'Supermercado', page: 'supermarket', badge: alertCount }
  ];

  const handleNav = (page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
        <Icon name="grid" size={24} />
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar glass ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Icon name="layers" size={28} />
          </div>
          <div className="sidebar-brand">
            <h2>FIS</h2>
            <span>POS System</span>
          </div>
          {mobileOpen && (
            <button className="close-sidebar btn-icon" onClick={() => setMobileOpen(false)}>
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.page}
              className={`nav-item ${activePage === item.page ? 'active' : ''}`}
              onClick={() => handleNav(item.page)}
            >
              <Icon name={item.icon} size={20} />
              <span className="nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="badge badge-err">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              <Icon name="user" size={20} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Usuario'}</span>
              <span className="user-role badge badge-accent">
                {user?.role || 'Staff'}
              </span>
            </div>
          </div>
          
          <div className="sidebar-actions">
            <ThemeToggle />
            <button className="btn-icon btn-danger" onClick={logout} title="Cerrar Sesión">
              <Icon name="log-out" size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
