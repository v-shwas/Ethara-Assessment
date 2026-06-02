import { useState, useEffect } from 'react'
import { customersApi } from '../api/client'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'

const emptyForm = { name: '', email: '', phone: '' }

export default function Customers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const load = () =>
    customersApi.list().then((r) => setItems(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const filtered = items.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm(emptyForm)
    setErrors({})
    setShowAdd(true)
  }

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await customersApi.create({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      })
      showToast('Customer added')
      setShowAdd(false)
      load()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Remove "${c.name}" from customers?`)) return
    try {
      await customersApi.remove(c.id)
      showToast('Customer removed')
      load()
    } catch (err) {
      showToast('Failed to delete customer', 'error')
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Customer
        </button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="form-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div className="empty-state">
                <p>Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <p>{search ? 'No customers match your search' : 'No customers yet — add your first one'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-sec)' }}>{c.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(c)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <Modal
          title="Add Customer"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Customer'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className={`form-input${errors.name ? ' error' : ''}`}
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Jane Smith"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-input${errors.email ? ' error' : ''}`}
              value={form.email}
              onChange={set('email')}
              placeholder="jane@example.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Phone{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+1 555 000 1234"
            />
          </div>
        </Modal>
      )}
    </>
  )
}
