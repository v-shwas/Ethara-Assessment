import { useState, useEffect } from 'react'
import { ordersApi, productsApi, customersApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'

const blankItem = { product_id: '', qty: 1 }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const [form, setForm] = useState({ customer_id: '', items: [{ ...blankItem }] })
  const [formErrors, setFormErrors] = useState({})

  const load = () =>
    Promise.all([ordersApi.list(), productsApi.list(), customersApi.list()])
      .then(([o, p, c]) => {
        setOrders(o.data)
        setProducts(p.data)
        setCustomers(c.data)
      })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const calcTotal = () =>
    form.items.reduce((sum, item) => {
      if (!item.product_id || !item.qty) return sum
      const p = products.find((x) => x.id === parseInt(item.product_id))
      return sum + (p ? p.price * item.qty : 0)
    }, 0)

  const addItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...blankItem }] }))

  const removeItem = (idx) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))

  const updateItem = (idx, field, val) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
    }))

  const validateForm = () => {
    const e = {}
    if (!form.customer_id) e.customer_id = 'Select a customer'
    const valid = form.items.filter((i) => i.product_id && Number(i.qty) > 0)
    if (valid.length === 0) e.items = 'Add at least one item with a product and quantity'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        items: form.items
          .filter((i) => i.product_id && Number(i.qty) > 0)
          .map((i) => ({ product_id: parseInt(i.product_id), qty: parseInt(i.qty) })),
      }
      await ordersApi.create(payload)
      showToast('Order placed successfully')
      setShowCreate(false)
      setForm({ customer_id: '', items: [{ ...blankItem }] })
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create order', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (o) => {
    if (!window.confirm(`Cancel order #${o.id}? Stock will be restored.`)) return
    try {
      await ordersApi.remove(o.id)
      showToast('Order cancelled')
      load()
    } catch (err) {
      showToast('Failed to cancel order', 'error')
    }
  }

  const openCreate = () => {
    setForm({ customer_id: '', items: [{ ...blankItem }] })
    setFormErrors({})
    setShowCreate(true)
  }

  const fmt = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <>
      <div className="page-header">
        <h2>Orders</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Order
        </button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🛒</span>
                <p>No orders yet — create your first one</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <span className="badge badge-blue">#{o.id}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.customer?.name || '—'}</td>
                      <td>
                        <span className="badge badge-gray">
                          {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>${o.total.toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{fmt(o.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => setViewing(o)} title="View details">
                            👁️
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDelete(o)}
                            title="Cancel order"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal
          title="New Order"
          size="lg"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Placing...' : 'Place Order'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className={`form-select${formErrors.customer_id ? ' error' : ''}`}
              value={form.customer_id}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_id: e.target.value }))}
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>
            {formErrors.customer_id && (
              <span className="form-error">{formErrors.customer_id}</span>
            )}
          </div>

          <div className="form-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label className="form-label" style={{ margin: 0 }}>
                Items
              </label>
              <button className="btn btn-ghost btn-sm" type="button" onClick={addItem}>
                + Add Item
              </button>
            </div>
            <div className="order-items-list">
              {form.items.map((item, idx) => {
                const selected = products.find((p) => p.id === parseInt(item.product_id))
                return (
                  <div key={idx} className="order-item-row">
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.stock === 0}>
                          {p.name} (${p.price.toFixed(2)}) — {p.stock} in stock
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className="form-input qty-input"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(idx, 'qty', parseInt(e.target.value) || 1)
                      }
                    />
                    {selected && (
                      <span className="item-subtotal">
                        ${(selected.price * item.qty).toFixed(2)}
                      </span>
                    )}
                    {form.items.length > 1 && (
                      <button
                        className="btn-icon danger"
                        type="button"
                        onClick={() => removeItem(idx)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {formErrors.items && <span className="form-error">{formErrors.items}</span>}
          </div>

          <div className="order-total-bar">
            <span>Estimated Total</span>
            <strong>${calcTotal().toFixed(2)}</strong>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal
          title={`Order #${viewing.id}`}
          size="lg"
          onClose={() => setViewing(null)}
          footer={
            <button className="btn btn-ghost" onClick={() => setViewing(null)}>
              Close
            </button>
          }
        >
          <div className="detail-grid" style={{ marginBottom: '20px' }}>
            <div className="detail-item">
              <label>Customer</label>
              <p>{viewing.customer?.name || '—'}</p>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <p>{viewing.customer?.email || '—'}</p>
            </div>
            <div className="detail-item">
              <label>Order Date</label>
              <p>{fmt(viewing.created_at)}</p>
            </div>
            <div className="detail-item">
              <label>Total Amount</label>
              <p style={{ color: 'var(--blue-dark)', fontSize: '18px', fontWeight: 800 }}>
                ${viewing.total.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="section-label">Order Items</p>
          <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {viewing.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.product?.name || '—'}</td>
                    <td>
                      <span className="badge badge-gray">{item.product?.sku || '—'}</span>
                    </td>
                    <td>{item.qty}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  )
}
