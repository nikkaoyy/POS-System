import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Icon from '../../shared/components/Icons';
import './Login.css';

const Login = ({ onLogin }) => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      handleLogin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = (enteredPin) => {
    const result = login(enteredPin);
    if (result && result.success) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        if (onLogin) onLogin(result.user);
      }, 800);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 500);
    }
  };

  const handleKeyClick = (key) => {
    if (error || success || pin.length >= 4) return;
    
    if (key === 'clear') {
      setPin('');
    } else if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev + key);
    }
  };

  const keys = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['clear', 0, 'backspace']
  ];

  return (
    <div className="login-container">
      <div className={`login-card glass card ${error ? 'anim-shake error' : ''} ${success ? 'success' : ''}`}>
        <div className="login-header">
          <div className="logo-box">
            <Icon name="grid" size={32} />
          </div>
          <h1>FIS</h1>
          <p>Sistema POS</p>
        </div>

        <div className="pin-display">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>
        
        {error && <div className="error-message">PIN Incorrecto</div>}
        {success && <div className="success-message">¡Bienvenido!</div>}
        {!error && !success && <div className="placeholder-message">Ingrese su PIN</div>}

        <div className="keypad">
          {keys.flat().map((key, index) => (
            <button
              key={index}
              className={`key-btn ${typeof key === 'string' ? 'action-key' : ''}`}
              onClick={() => handleKeyClick(key)}
            >
              {key === 'clear' ? <Icon name="x" size={24} /> :
               key === 'backspace' ? <Icon name="minus" size={24} /> : 
               key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
