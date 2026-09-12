/**
 * pages/WorkOrdersPage.jsx - Work Order management screen
 * ADMIN can create work orders; ADMIN + OPERATIONS_USER can view and update status
 * Shows real-time shortage calculation from backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AlertMessage from '../components/AlertMessage';
import StatusBadge from '../components/StatusBadge';
import { getWorkOrders, createWorkOrder, updateWorkOrderStatus } from '../api/workOrders.api';
import { getItems, getLocations, getUsers } from '../api/inventory.api';

const NEXT_STATUS = {
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

const WorkOrdersPage = () => {
  const { hasRole } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);

  // Form
  const [form, setForm] = useState({ itemId: '', locationId: '', assignedUserId: '', requiredQty: '', notes: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [woRes, itemsRes, locsRes, usersRes] = await Promise.all([
        getWorkOrders(), getItems(), getLocations(), getUsers(),
      ]);
      setWorkOrders(woRes.data.data);
      setItems(itemsRes.data.data);
      setLocations(locsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      setError('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.itemId || !form.locationId || !form.assignedUserId || !form.requiredQty) {
      setFormError('All fields except notes are required');
      return;
    }
    setSubmitting(true);
    try {
      await createWorkOrder({ ...form, requiredQty: parseFloat(form.requiredQty) });
      setSuccess('Work order created successfully');
      setShowModal(false);
      setForm({ itemId: '', locationId: '', assignedUserId: '', requiredQty: '', notes: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateWorkOrderStatus(id, newStatus);
      setSuccess(`Status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Work Orders</h2>
            <p>Manage production work orders with material shortage calculation</p>
          </div>
          {hasRole('ADMIN') && (
            <button id="btn-create-wo" className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); }}>
              + New Work Order
            </button>
          )}
        </div>

        <div className="page-body">
          <AlertMessage type="error" message={error} onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Loading work orders...</p></div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>All Work Orders ({workOrders.length})</h3>
              </div>
              <div className="table-container">
                {workOrders.length === 0 ? (
                  <div className="empty-state"><p>No work orders found. {hasRole('ADMIN') && 'Create your first work order.'}</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Item</th>
                        <th>Location</th>
                        <th>Required Qty</th>
                        <th>Available Qty</th>
                        <th>Shortage</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((wo) => (
                        <tr key={wo.id}>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {wo.orderNumber}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{wo.item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{wo.item.code}</div>
                          </td>
                          <td>{wo.location.name}</td>
                          <td style={{ fontWeight: 600 }}>{wo.requiredQty.toFixed(2)}</td>
                          <td style={{ color: wo.availableQty <= 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 500 }}>
                            {wo.availableQty.toFixed(2)}
                          </td>
                          <td>
                            <span className={`shortage-tag ${wo.shortage > 0 ? 'has-shortage' : 'no-shortage'}`}>
                              {wo.shortage > 0 ? `⚠ ${wo.shortage.toFixed(2)}` : '✓ None'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.875rem' }}>{wo.assignedUser.name}</div>
                            <StatusBadge status={wo.assignedUser.role} />
                          </td>
                          <td><StatusBadge status={wo.status} /></td>
                          <td>
                            {NEXT_STATUS[wo.status] && (
                              <button
                                className="btn btn-outline btn-xs"
                                onClick={() => handleStatusUpdate(wo.id, NEXT_STATUS[wo.status])}
                              >
                                → {NEXT_STATUS[wo.status].replace('_', ' ')}
                              </button>
                            )}
                            {wo.status === 'COMPLETED' && (
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Final</span>
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

      {/* ─── Create Work Order Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Work Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <AlertMessage type="error" message={formError} onClose={() => setFormError('')} />

                <div className="form-group">
                  <label className="form-label">Item <span className="required">*</span></label>
                  <select className="form-control" value={form.itemId} onChange={(e) => setForm(f => ({ ...f, itemId: e.target.value }))} required>
                    <option value="">Select item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name} ({i.unit})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location <span className="required">*</span></label>
                  <select className="form-control" value={form.locationId} onChange={(e) => setForm(f => ({ ...f, locationId: e.target.value }))} required>
                    <option value="">Select location...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
                  </select>
                </div>

                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Required Quantity <span className="required">*</span></label>
                    <input type="number" className="form-control" min="0.001" step="0.001"
                      value={form.requiredQty} onChange={(e) => setForm(f => ({ ...f, requiredQty: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign To <span className="required">*</span></label>
                    <select className="form-control" value={form.assignedUserId} onChange={(e) => setForm(f => ({ ...f, assignedUserId: e.target.value }))} required>
                      <option value="">Select user...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" placeholder="Optional notes"
                    value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
                  ℹ️ Shortage = Required Qty − Available Qty at the selected location. Calculated automatically by the backend.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Work Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersPage;
