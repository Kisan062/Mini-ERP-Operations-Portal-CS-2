/**
 * components/StatusBadge.jsx - Colored status badge
 */

import React from 'react';

const statusConfig = {
  // Work order statuses
  ASSIGNED:    { className: 'badge-gray',    label: 'Assigned' },
  IN_PROGRESS: { className: 'badge-warning', label: 'In Progress' },
  COMPLETED:   { className: 'badge-success', label: 'Completed' },
  // Transfer statuses
  REQUESTED:   { className: 'badge-info',    label: 'Requested' },
  DISPATCHED:  { className: 'badge-warning', label: 'Dispatched' },
  RECEIVED:    { className: 'badge-success', label: 'Received' },
  // Order statuses
  PENDING:     { className: 'badge-gray',    label: 'Pending' },
  RESERVED:    { className: 'badge-primary', label: 'Reserved' },
  CANCELLED:   { className: 'badge-danger',  label: 'Cancelled' },
  // Roles
  ADMIN:             { className: 'badge-danger',  label: 'Admin' },
  OPERATIONS_USER:   { className: 'badge-primary', label: 'Operations' },
  SALES_USER:        { className: 'badge-success', label: 'Sales' },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { className: 'badge-gray', label: status };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};

export default StatusBadge;
