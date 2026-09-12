/**
 * pages/CustomerOrdersPage.jsx - Customer Order & Stock Reservation screen
 * SALES_USER creates orders and reserves stock
 * Shows live available quantity from inventory
 * Clear error when requested qty > available
 */

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import AlertMessage from '../components/AlertMessage';
import StatusBadge from '../components/StatusBadge';
import { getOrders, createOrder, reserveOrder } from '../api/orders.api';
import { getInventory, getItems } from '../api/inventory.api';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [inventory, setInventory] = useState([]);

  // Form
  const [form, setForm] = useState({
    customerName: '',
    notes: '',
    items: [{ inventoryId: '', itemId: '', requestedQty: '' }],
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordRes, invRes] = await Promise.all([getOrders(), getInventory()]);
      setOrders(ordRes.data.data);
      setInventory(invRes.data.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Get selected inventory record for a form line item
  const getSelectedInv = (inventoryId) => inventory.find(i => i.id === inventoryId);

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const newItems = [...f.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      // Auto-fill itemId from inventory selection
      if (field === 'inventoryId') {
        const inv = inventory.find(i => i.id === value);
        if (inv) newItems[idx].itemId = inv.item.id;
      }
      return { ...f, items: newItems };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { inventoryId: '', itemId: '', requestedQty: '' }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.customerName.trim()) { setFormError('Customer name is required'); return; }

    for (const [i, item] of form.items.entries()) {
      if (!item.inventoryId) { setFormError(`Select inventory for item ${i + 1}`); return; }
      if (!item.requestedQty || parseFloat(item.requestedQty) <= 0) { setFormError(`Enter valid quantity for item ${i + 1}`); return; }

      // Frontend validation (backend also validates)
      const inv = getSelectedInv(item.inventoryId);
      if (inv && parseFloat(item.requestedQty) > inv.availableQty) {
        setFormError(
          `Item ${i + 1} (${inv.item.name}): Requested ${item.requestedQty} exceeds available ${inv.availableQty.toFixed(2)}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createOrder({
        customerName: form.customerName,
        notes: form.notes,
        items: form.items.map(item => ({
          itemId: item.itemId,
          inventoryId: item.inventoryId,
          requestedQty: parseFloat(item.requestedQty),
        })),
      });
      setSuccess('Customer order created. Use "Reserve" to lock stock.');
      setShowModal(false);
      setForm({ customerName: '', notes: '', items: [{ inventoryId: '', itemId: '', requestedQty: '' }] });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async (id) => {
    setActionLoading(id);
    try {
      await reserveOrder(id);
      setSuccess('Stock reserved successfully! Inventory updated.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Reservation failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Customer Orders</h2>
            <p>Create orders and reserve stock with concurrency-safe locking</p>
          </div>
          <button id="btn-create-order" className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); }}>
            + New Order
          </button>
        </div>

        <div className="page-body">
          <AlertMessage type="error" message={error} onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <div>
              <strong>Reservation uses PostgreSQL row-level locking</strong> - concurrent reservations are handled safely.
              If two users try to reserve the same stock simultaneously, only one will succeed.
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Loading orders...</p></div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>All Customer Orders ({orders.length})</h3>
              </div>
              <div className="table-container">
                {orders.length === 0 ? (
                  <div className="empty-state"><p>No orders yet. Create your first customer order.</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {order.orderNumber}
                          </td>
                          <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                          <td>
                            {order.orderItems.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
                                <span style={{ fontWeight: 500 }}>{item.item.name}</span>
                                <span className="text-muted"> - Req: {item.requestedQty.toFixed(2)}</span>
                                {item.isReserved && (
                                  <span style={{ color: 'var(--color-success)', marginLeft: '4px' }}>
                                    ✓ Reserved: {item.reservedQty.toFixed(2)}
                                  </span>
                                )}
                                {/* Show available qty from inventory */}
                                {item.inventory && !item.isReserved && (
                                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px', fontSize: '0.72rem' }}>
                                    (avail: {item.inventory.availableQty.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            ))}
                          </td>
                          <td><StatusBadge status={order.status} /></td>
                          <td style={{ fontSize: '0.8rem' }}>{order.createdBy?.name}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            {order.status === 'PENDING' && (
                              <button
                                id={`reserve-${order.id}`}
                                className="btn btn-success btn-xs"
                                onClick={() => handleReserve(order.id)}
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? 'Reserving...' : '🔒 Reserve Stock'}
                              </button>
                            )}
                            {order.status === 'RESERVED' && (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.78rem', fontWeight: 600 }}>
                                ✓ Stock Reserved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Order Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Customer Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <AlertMessage type="error" message={formError} onClose={() => setFormError('')} />

                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Customer Name <span className="required">*</span></label>
                    <input type="text" className="form-control" placeholder="Customer / Company name"
                      value={form.customerName} onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input type="text" className="form-control" placeholder="Optional"
                      value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Order Items <span className="required">*</span></label>
                    <button type="button" className="btn btn-outline btn-xs" onClick={addItem}>+ Add Item</button>
                  </div>

                  {form.items.map((item, idx) => {
                    const selectedInv = getSelectedInv(item.inventoryId);
                    return (
                      <div key={idx} style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '10px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Item {idx + 1}</span>
                          {form.items.length > 1 && (
                            <button type="button" style={{ background: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => removeItem(idx)}>Remove</button>
                          )}
                        </div>
                        <div className="form-row form-row-2">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.78rem' }}>Inventory Record</label>
                            <select className="form-control" value={item.inventoryId} onChange={(e) => updateItem(idx, 'inventoryId', e.target.value)}>
                              <option value="">Select inventory...</option>
                              {inventory.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.item.name} @ {inv.location.name} (avail: {inv.availableQty.toFixed(2)} {inv.item.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.78rem' }}>Quantity</label>
                            <input type="number" className="form-control" min="0.001" step="0.001" placeholder="0"
                              value={item.requestedQty} onChange={(e) => updateItem(idx, 'requestedQty', e.target.value)} />
                          </div>
                        </div>
                        {/* Live availability check */}
                        {selectedInv && item.requestedQty && (
                          <div style={{ marginTop: '8px' }}>
                            {parseFloat(item.requestedQty) > selectedInv.availableQty ? (
                              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', fontWeight: 500 }}>
                                ⚠ Exceeds available ({selectedInv.availableQty.toFixed(2)}) - will fail reservation
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 500 }}>
                                ✓ Available: {selectedInv.availableQty.toFixed(2)} - sufficient
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
