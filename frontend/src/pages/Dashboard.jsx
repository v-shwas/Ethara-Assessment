import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, customersApi, ordersApi } from '../api/client'

export default function Dashboard() {
  const [data, setData] = useState({ products: [], customers: [], orders: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([productsApi.list(), customersApi.list(), ordersApi.list()])
      .then(([p, c, o]) =>
        setData({ products: p.data, customers: c.data, orders: o.data })
      )
      .finally(() => setLoading(false))
  }, [])

  const lowStock = data.products.filter((p) => p.stock <= 10)
  const recentOrders = [...data.orders].slice(0, 5)

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="page-body">
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📦</div>
            <div className="stat-info">
              <h3>{data.products.length}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">👥</div>
            <div className="stat-info">
              <h3>{data.customers.length}</h3>
              <p>Total Customers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">🛒</div>
            <div className="stat-info">
              <h3>{data.orders.length}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">⚠️</div>
            <div className="stat-info">
              <h3 style={{ color: lowStock.length > 0 ? 'var(--red)' : 'inherit' }}>
                {lowStock.length}
              </h3>
              <p>Low Stock Items</p>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3>Low Stock Alert</h3>
              <Link
                to="/products"
                style={{ fontSize: '13px', color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}
              >
                View all →
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px' }}>
                <p>All products well stocked ✓</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.slice(0, 6).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td>
                          <span className="badge badge-gray">{p.sku}</span>
                        </td>
                        <td>
                          <span className={p.stock === 0 ? 'badge badge-red' : 'badge badge-yellow'}>
                            {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <Link
                to="/orders"
                style={{ fontSize: '13px', color: 'var(--blue)', textDecoration: 'none', fontWeight: 500 }}
              >
                View all →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px' }}>
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="badge badge-blue">#{o.id}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{o.customer?.name || '—'}</td>
                        <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
