/**
 * components/Sidebar.jsx - Application navigation sidebar
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavIcon = ({ name }) => {
  const icons = {
    dashboard: '⊞',
    inventory: '📦',
    workorders: '📋',
    transfers: '🔄',
    orders: '🛒',
  };
  return <span className="nav-icon">{icons[name] || '•'}</span>;
};

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Mini ERP</h1>
        <span>Operations System</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <NavIcon name="dashboard" /> Dashboard
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
          <NavIcon name="inventory" /> Inventory
        </NavLink>

        {hasRole('ADMIN', 'OPERATIONS_USER') && (
          <NavLink to="/work-orders" className={({ isActive }) => isActive ? 'active' : ''}>
            <NavIcon name="workorders" /> Work Orders
          </NavLink>
        )}

        {hasRole('ADMIN', 'OPERATIONS_USER') && (
          <NavLink to="/transfers" className={({ isActive }) => isActive ? 'active' : ''}>
            <NavIcon name="transfers" /> Stock Transfers
          </NavLink>
        )}

        {hasRole('SALES_USER', 'ADMIN') && (
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
            <NavIcon name="orders" /> Customer Orders
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <p>{user?.name}</p>
            <span>{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
