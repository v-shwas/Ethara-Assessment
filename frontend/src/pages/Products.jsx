import { useState, useEffect } from 'react'
import { productsApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'

const emptyForm = { name: '', sku: '', price: '', stock: '' }

export default function Products() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const load = () =>
    productsApi.list().then((r) => setItems(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const filtered = items.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm(emptyForm)
    setErrors({})
    setShowAdd(true)
  }

  const openEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, price: String(p.price), stock: String(p.stock) })
    setErrors({})
    setEditing(p)
  }

  const closeModal = () => {
    setShowAdd(false)
    setEditing(null)
  }

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      e.price = 'Enter a valid price'
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0)
      e.stock = 'Enter valid stock quantity'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
    }
    try {
      if (editing) {
        await productsApi.update(editing.id, payload)
        showToast('Product updated')
      } else {
        await productsApi.create(payload)
        showToast('Product added')
      }
      closeModal()
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try {
      await productsApi.remove(p.id)
      showToast('Product deleted')
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete product', 'error')
    }
  }

  const isOpen = showAdd || !!editing

  return (
    <>
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Product
        </button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="form-input"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <p>{search ? 'No products match your search' : 'No products yet — add your first one'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Added</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>
                        <span className="badge badge-gray">{p.sku}</span>
                      </td>
                      <td>${p.price.toFixed(2)}</td>
                      <td>
                        <span
                          className={
                            p.stock === 0
                              ? 'badge badge-red'
                              : p.stock <= 10
                              ? 'badge badge-yellow'
                              : 'badge badge-green'
                          }
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">
                            ✏️
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDelete(p)}
                            title="Delete"
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

      {isOpen && (
        <Modal
          title={editing ? 'Edit Product' : 'Add Product'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              className={`form-input${errors.name ? ' error' : ''}`}
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Wireless Keyboard"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              className={`form-input${errors.sku ? ' error' : ''}`}
              value={form.sku}
              onChange={set('sku')}
              placeholder="e.g. WK-001"
            />
            {errors.sku && <span className="form-error">{errors.sku}</span>}
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-input${errors.price ? ' error' : ''}`}
                value={form.price}
                onChange={set('price')}
                placeholder="0.00"
              />
              {errors.price && <span className="form-error">{errors.price}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                className={`form-input${errors.stock ? ' error' : ''}`}
                value={form.stock}
                onChange={set('stock')}
                placeholder="0"
              />
              {errors.stock && <span className="form-error">{errors.stock}</span>}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
