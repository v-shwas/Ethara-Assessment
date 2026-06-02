import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { ToastContext } from '../context/ToastContext'
import Toast from './Toast'

const navItems = [
  { path: '/dashboard', icon: '▦', label: 'Dashboard' },
  { path: '/products', icon: '⬡', label: 'Products' },
  { path: '/customers', icon: '◎', label: 'Customers' },
  { path: '/orders', icon: '◈', label: 'Orders' },
]

export default function Layout() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Stockwise</h1>
            <span>Inventory Manager</span>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
        <Toast toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}
