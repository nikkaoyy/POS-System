import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import { ThemeProvider } from './shared/context/ThemeContext'
import { AuthProvider } from './features/auth/AuthContext'
import { StoreProvider } from './shared/context/StoreContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
