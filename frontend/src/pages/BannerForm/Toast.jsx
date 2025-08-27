// Toast.jsx
import React from 'react';
const Toast = ({ message, type = "success", onClose }) => (
  <div className={`toast toast-${type}`}>
    {message}
    <button onClick={onClose} style={{ marginLeft: 10 }}>×</button>
  </div>
);
export default Toast;

