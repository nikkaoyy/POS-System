import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import Login from '../features/auth/Login';
import Sidebar from './Sidebar/Sidebar';
import POS from '../features/pos/POS';
import Inventory from '../features/inventory/Inventory';
import SalesHistory from '../features/sales/SalesHistory';
import Dashboard from '../features/dashboard/Dashboard';
import Supermarket from '../features/supermarket/Supermarket';
import './App.css';

function App() {
  const { user, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState('pos');

  if (!user) {
    return <Login onLogin={() => setActivePage('pos')} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'pos':
        return <POS />;
      case 'inventory':
        return <Inventory />;
      case 'history':
        return <SalesHistory />;
      case 'dashboard':
        return isAdmin ? <Dashboard /> : <POS />;
      case 'supermarket':
        return <Supermarket />;
      default:
        return <POS />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
