/**
 * pages/TransfersPage.jsx - Internal Stock Transfer management
 * OPERATIONS_USER can create, dispatch, and receive transfers
 * Shows clear REQUESTED → DISPATCHED → RECEIVED status flow
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AlertMessage from '../components/AlertMessage';
import StatusBadge from '../components/StatusBadge';
import { getTransfers, createTransfer, dispatchTransfer, receiveTransfer } from '../api/transfers.api';
import { getItems, getLocations } from '../api/inventory.api';

const TransfersPage = () => {
  const { hasRole } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // track which row is loading

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form
  const [form, setForm] = useState({ itemId: '', sourceLocationId: '', destLocationId: '', quantity: '', notes: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [trRes, itemsRes, locsRes] = await Promise.all([
        getTransfers(), getItems(), getLocations(),
      ]);
      setTransfers(trRes.data.data);
      setItems(itemsRes.data.data);
      setLocations(locsRes.data.data);
    } catch (err) {
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.itemId || !form.sourceLocationId || !form.destLocationId || !form.quantity) {
      setFormError('All fields except notes are required');
      return;
    }
    if (form.sourceLocationId === form.destLocationId) {
      setFormError('Source and destination locations must be different');
      return;
    }
    setSubmitting(true);
    try {
      await createTransfer({ ...form, quantity: parseFloat(form.quantity) });
      setSuccess('Transfer request created');
      setShowModal(false);
      setForm({ itemId: '', sourceLocationId: '', destLocationId: '', quantity: '', notes: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id) => {
    setActionLoading(id + '_dispatch');
    try {
      await dispatchTransfer(id);
      setSuccess('Transfer dispatched - source inventory reduced');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReceive = async (id) => {
    setActionLoading(id + '_receive');
    try {
      await receiveTransfer(id);
      setSuccess('Transfer received - destination inventory increased');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Receive failed');
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
            <h2>Stock Transfers</h2>
            <p>Internal material movements between warehouse locations</p>
          </div>
          <button id="btn-create-transfer" className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); }}>
            + New Transfer
          </button>
        </div>

        <div className="page-body">
          <AlertMessage type="error" message={error} onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          {/* Status Flow Explanation */}
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <div>
              <strong>Transfer Flow:</strong>&nbsp;
              <span className="badge badge-info">REQUESTED</span>
              &nbsp;→&nbsp;
              <span className="badge badge-warning">DISPATCHED</span>
              &nbsp;(source inventory ↓)&nbsp;→&nbsp;
              <span className="badge badge-success">RECEIVED</span>
              &nbsp;(destination inventory ↑)
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Loading transfers...</p></div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>All Transfers ({transfers.length})</h3>
              </div>
              <div className="table-container">
                {transfers.length === 0 ? (
                  <div className="empty-state"><p>No transfers found. Create your first transfer request.</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Transfer #</th>
                        <th>Item</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Dispatched At</th>
                        <th>Received At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((tr) => (
                        <tr key={tr.id}>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {tr.transferNumber}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{tr.item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tr.item.code}</div>
                          </td>
                          <td>
                            <span style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 500 }}>
                              {tr.sourceLocation.name}
                            </span>
                          </td>
                          <td>
                            <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 500 }}>
                              {tr.destLocation.name}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{tr.quantity.toFixed(2)}</td>
                          <td><StatusBadge status={tr.status} /></td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {tr.dispatchedAt ? new Date(tr.dispatchedAt).toLocaleString() : '-'}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {tr.receivedAt ? new Date(tr.receivedAt).toLocaleString() : '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {tr.status === 'REQUESTED' && (
                                <button
                                  id={`dispatch-${tr.id}`}
                                  className="btn btn-outline btn-xs"
                                  onClick={() => handleDispatch(tr.id)}
                                  disabled={actionLoading === tr.id + '_dispatch'}
                                  style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                                >
                                  {actionLoading === tr.id + '_dispatch' ? '...' : 'Dispatch'}
                                </button>
                              )}
                              {tr.status === 'DISPATCHED' && (
                                <button
                                  id={`receive-${tr.id}`}
                                  className="btn btn-outline btn-xs"
                                  onClick={() => handleReceive(tr.id)}
                                  disabled={actionLoading === tr.id + '_receive'}
                                  style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                >
                                  {actionLoading === tr.id + '_receive' ? '...' : 'Receive'}
                                </button>
                              )}
                              {tr.status === 'RECEIVED' && (
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Complete</span>
                              )}
                            </div>
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

      {/* ─── Create Transfer Modal ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Stock Transfer</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <AlertMessage type="error" message={formError} onClose={() => setFormError('')} />

                <div className="form-group">
                  <label className="form-label">Item <span className="required">*</span></label>
                  <select className="form-control" value={form.itemId} onChange={(e) => setForm(f => ({ ...f, itemId: e.target.value }))} required>
                    <option value="">Select item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                  </select>
                </div>

                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">Source Location <span className="required">*</span></label>
                    <select className="form-control" value={form.sourceLocationId} onChange={(e) => setForm(f => ({ ...f, sourceLocationId: e.target.value }))} required>
                      <option value="">From...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Location <span className="required">*</span></label>
                    <select className="form-control" value={form.destLocationId} onChange={(e) => setForm(f => ({ ...f, destLocationId: e.target.value }))} required>
                      <option value="">To...</option>
                      {locations.filter(l => l.id !== form.sourceLocationId).map(l => (
                        <option key={l.id} value={l.id}>{l.code} - {l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity <span className="required">*</span></label>
                  <input type="number" className="form-control" min="0.001" step="0.001"
                    value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} required />
                  <span className="form-hint">Backend validates against available stock at source location</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" placeholder="Reason for transfer..."
                    value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersPage;
