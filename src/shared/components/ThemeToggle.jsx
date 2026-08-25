import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icons';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isDark ? 'flex-end' : 'flex-start',
        width: '48px',
        height: '24px',
        borderRadius: 'var(--r-full)',
        backgroundColor: isDark ? 'var(--c-accent)' : 'var(--bg-surface-2)',
        border: '1px solid var(--c-border)',
        cursor: 'pointer',
        padding: '2px',
        position: 'relative',
        transition: 'all var(--t-base) ease'
      }}
      aria-label="Toggle theme"
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: isDark ? 'var(--bg-body)' : 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--t-spring) ease',
        color: isDark ? 'var(--c-accent)' : 'var(--c-text-2)'
      }}>
        <Icon name={isDark ? 'sun' : 'moon'} size={12} />
      </div>
    </button>
  );
};

export default ThemeToggle;
