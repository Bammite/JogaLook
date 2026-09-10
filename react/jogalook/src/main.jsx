import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import RuntimeRecoveryBoundary from './components/RuntimeRecoveryBoundary.jsx'
import { installRuntimeRecovery } from './utils/runtimeRecovery.js'

installRuntimeRecovery()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RuntimeRecoveryBoundary>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </RuntimeRecoveryBoundary>
  </StrictMode>,
)
