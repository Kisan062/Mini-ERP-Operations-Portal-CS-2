/**
 * pages/DashboardPage.jsx - Overview dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInventory } from '../api/inventory.api';
import { getWorkOrders } from '../api/workOrders.api';
import { getTransfers } from '../api/transfers.api';
import { getOrders } from '../api/orders.api';
import Sidebar from '../components/Sidebar';

const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inventory: 0,
    workOrders: 0,
    transfers: 0,
    orders: 0,
    shortages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [inv] = await Promise.all([getInventory()]);
        const invData = inv.data.data;
        const shortages = invData.filter((i) => i.availableQty < 10).length;

        let woCount = 0, trCount = 0, ordCount = 0;

        if (hasRole('ADMIN', 'OPERATIONS_USER')) {
          try {
            const [wo, tr] = await Promise.all([getWorkOrders(), getTransfers()]);
            woCount = wo.data.data.length;
            trCount = tr.data.data.length;
          } catch (_) {}
        }

        if (hasRole('SALES_USER', 'ADMIN')) {
          try {
            const ord = await getOrders();
            ordCount = ord.data.data.length;
          } catch (_) {}
        }

        setStats({
          inventory: invData.length,
          workOrders: woCount,
          transfers: trCount,
          orders: ordCount,
          shortages,
        });
      } catch (_) {} finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const flow = [
    { icon: '📦', label: 'Inventory', path: '/inventory' },
    { icon: '📋', label: 'Work Order', path: '/work-orders' },
    { icon: '🔍', label: 'Stock Check', path: '/work-orders' },
    { icon: '🔄', label: 'Transfer', path: '/transfers' },
    { icon: '🛒', label: 'Customer Order', path: '/orders' },
    { icon: '🔒', label: 'Reservation', path: '/orders' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, {user?.name} - {user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Inventory Records</div>
              <div className="stat-value">{stats.inventory}</div>
              <div className="stat-sub">Active items tracked</div>
            </div>
            {hasRole('ADMIN', 'OPERATIONS_USER') && (
              <div className="stat-card">
                <div className="stat-label">Work Orders</div>
                <div className="stat-value">{stats.workOrders}</div>
                <div className="stat-sub">Total created</div>
              </div>
            )}
            {hasRole('ADMIN', 'OPERATIONS_USER') && (
              <div className="stat-card">
                <div className="stat-label">Stock Transfers</div>
                <div className="stat-value">{stats.transfers}</div>
                <div className="stat-sub">Internal movements</div>
              </div>
            )}
            {hasRole('SALES_USER', 'ADMIN') && (
              <div className="stat-card">
                <div className="stat-label">Customer Orders</div>
                <div className="stat-value">{stats.orders}</div>
                <div className="stat-sub">Total orders</div>
              </div>
            )}
            <div className="stat-card" style={{ borderColor: stats.shortages > 0 ? 'var(--color-danger)' : 'var(--color-border)' }}>
              <div className="stat-label">Low Stock Alerts</div>
              <div className="stat-value" style={{ color: stats.shortages > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {stats.shortages}
              </div>
              <div className="stat-sub">Items with available &lt; 10</div>
            </div>
          </div>

          {/* Business Flow */}
          <div className="card">
            <div className="card-header">
              <h3>Business Process Flow</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {flow.map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '6px', cursor: 'pointer', padding: '12px 16px',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)', minWidth: '90px', transition: 'all 0.15s',
                      }}
                      onClick={() => navigate(step.path)}
                      title={`Go to ${step.label}`}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{step.label}</span>
                    </div>
                    {i < flow.length - 1 && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-muted" style={{ marginTop: '12px', fontSize: '0.8rem' }}>
                Click any step to navigate directly to that module
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
