/**
 * pages/InventoryPage.jsx - Inventory management screen
 * Shows all inventory records with physical/reserved/available quantities
 * OPERATIONS_USER can add new records and add stock
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AlertMessage from '../components/AlertMessage';
import { getInventory, createInventory, addStock, getItems, getLocations, getBatches } from '../api/inventory.api';

const InventoryPage = () => {
  const { hasRole } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  // Reference data for dropdowns
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [batches, setBatches] = useState([]);

  // Create form state
  const [createForm, setCreateForm] = useState({ itemId: '', locationId: '', batchId: '', physicalQty: '' });
  const [addStockForm, setAddStockForm] = useState({ inventoryId: '', quantity: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, itemsRes, locsRes, batchesRes] = await Promise.all([
        getInventory(), getItems(), getLocations(), getBatches(),
      ]);
      setInventory(invRes.data.data);
      setItems(itemsRes.data.data);
      setLocations(locsRes.data.data);
      setBatches(batchesRes.data.data);
    } catch (err) {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!createForm.itemId || !createForm.locationId || !createForm.physicalQty) {
      setFormError('Item, Location, and Physical Quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      await createInventory({
        itemId: createForm.itemId,
        locationId: createForm.locationId,
        batchId: createForm.batchId || null,
        physicalQty: parseFloat(createForm.physicalQty),
      });
      setSuccess('Inventory record created successfully');
      setShowCreateModal(false);
      setCreateForm({ itemId: '', locationId: '', batchId: '', physicalQty: '' });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!addStockForm.quantity || parseFloat(addStockForm.quantity) <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await addStock({
        inventoryId: addStockForm.inventoryId,
        quantity: parseFloat(addStockForm.quantity),
        notes: addStockForm.notes,
      });
      setSuccess('Stock added successfully');
      setShowAddStockModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddStock = (inv) => {
    setSelectedInv(inv);
    setAddStockForm({ inventoryId: inv.id, quantity: '', notes: '' });
    setFormError('');
    setShowAddStockModal(true);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Inventory</h2>
            <p>Physical, reserved, and available stock levels</p>
          </div>
          {hasRole('OPERATIONS_USER', 'ADMIN') && (
            <button id="btn-create-inventory" className="btn btn-primary" onClick={() => { setShowCreateModal(true); setFormError(''); }}>
              + New Inventory Record
            </button>
          )}
        </div>

        <div className="page-body">
          <AlertMessage type="error" message={error} onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          {loading ? (
            <div className="loading-container"><div className="spinner" /><p>Loading inventory...</p></div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>All Inventory Records ({inventory.length})</h3>
              </div>
              <div className="table-container">
                {inventory.length === 0 ? (
                  <div className="empty-state"><p>No inventory records found</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Batch</th>
                        <th>Unit</th>
                        <th>Physical Qty</th>
                        <th>Reserved Qty</th>
                        <th>Available Qty</th>
                        {hasRole('OPERATIONS_USER', 'ADMIN') && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((inv) => (
                        <tr key={inv.id}>
                          <td className="font-mono">{inv.item.code}</td>
                          <td style={{ fontWeight: 500 }}>{inv.item.name}</td>
                          <td>{inv.item.category?.name}</td>
                          <td>{inv.location.name}</td>
                          <td>{inv.batch?.batchNumber || <span className="text-muted">-</span>}</td>
                          <td>{inv.item.unit}</td>
                          <td style={{ fontWeight: 600 }}>{inv.physicalQty.toFixed(2)}</td>
                          <td style={{ color: inv.reservedQty > 0 ? 'var(--color-warning)' : 'inherit' }}>
                            {inv.reservedQty.toFixed(2)}
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: inv.availableQty <= 0
                                ? 'var(--color-danger)'
                                : inv.availableQty < 20
                                ? 'var(--color-warning)'
                                : 'var(--color-success)',
                            }}>
                              {inv.availableQty.toFixed(2)}
                            </span>
                          </td>
                          {hasRole('OPERATIONS_USER', 'ADMIN') && (
                            <td>
                              <button
                                className="btn btn-outline btn-xs"
                                onClick={() => openAddStock(inv)}
                              >
                                + Add Stock
                              </button>
                            </td>
                          )}
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

      {/* ─── Create Inventory Modal ─── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Inventory Record</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <AlertMessage type="error" message={formError} onClose={() => setFormError('')} />
                <div className="form-group">
                  <label className="form-label">Item <span className="required">*</span></label>
                  <select className="form-control" value={createForm.itemId} onChange={(e) => setCreateForm(f => ({ ...f, itemId: e.target.value }))} required>
                    <option value="">Select item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location <span className="required">*</span></label>
                  <select className="form-control" value={createForm.locationId} onChange={(e) => setCreateForm(f => ({ ...f, locationId: e.target.value }))} required>
                    <option value="">Select location...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Batch (optional)</label>
                  <select className="form-control" value={createForm.batchId} onChange={(e) => setCreateForm(f => ({ ...f, batchId: e.target.value }))}>
                    <option value="">No batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batchNumber}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Quantity <span className="required">*</span></label>
                  <input type="number" className="form-control" min="0.001" step="0.001"
                    value={createForm.physicalQty} onChange={(e) => setCreateForm(f => ({ ...f, physicalQty: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Stock Modal ─── */}
      {showAddStockModal && selectedInv && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Stock</h3>
              <button className="modal-close" onClick={() => setShowAddStockModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <AlertMessage type="error" message={formError} onClose={() => setFormError('')} />
                <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.875rem' }}>
                  <strong>{selectedInv.item.name}</strong> @ {selectedInv.location.name}
                  <div className="qty-display" style={{ marginTop: '8px' }}>
                    <div className="qty-item qty-physical"><span className="qty-label">Physical</span><span className="qty-value">{selectedInv.physicalQty.toFixed(2)}</span></div>
                    <div className="qty-item qty-reserved"><span className="qty-label">Reserved</span><span className="qty-value">{selectedInv.reservedQty.toFixed(2)}</span></div>
                    <div className="qty-item qty-available"><span className="qty-label">Available</span><span className="qty-value">{selectedInv.availableQty.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity to Add <span className="required">*</span></label>
                  <input type="number" className="form-control" min="0.001" step="0.001"
                    value={addStockForm.quantity} onChange={(e) => setAddStockForm(f => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input type="text" className="form-control" placeholder="Optional notes"
                    value={addStockForm.notes} onChange={(e) => setAddStockForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={submitting}>{submitting ? 'Adding...' : 'Add Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
