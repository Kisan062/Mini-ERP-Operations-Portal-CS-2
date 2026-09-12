/**
 * components/AlertMessage.jsx - Dismissible alert/error messages
 */

import React from 'react';

const AlertMessage = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const icons = {
    error: '✕',
    success: '✓',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`alert alert-${type}`} role="alert">
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', opacity: 0.6, marginLeft: '8px', cursor: 'pointer' }}
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
