import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import './AdminPanel.css';

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intents, setIntents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });

  // Modal states
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIntents();
  }, [filters]);

  const fetchIntents = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await api.get(`/payments/qr/admin/intents?${params}`);
      
      if (response.data.success) {
        setIntents(response.data.data.intents);
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch payment intents');
      }
    } catch (err) {
      console.error('Error fetching payment intents:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch payment intents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedIntent) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/payments/qr/${selectedIntent._id}/verify`, {
        notes: notes.trim()
      });

      if (response.data.success) {
        setShowVerifyModal(false);
        setNotes('');
        setSelectedIntent(null);
        fetchIntents();
      } else {
        throw new Error(response.data.message || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to verify payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIntent) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/payments/qr/${selectedIntent._id}/reject`, {
        notes: notes.trim()
      });

      if (response.data.success) {
        setShowRejectModal(false);
        setNotes('');
        setSelectedIntent(null);
        fetchIntents();
      } else {
        throw new Error(response.data.message || 'Failed to reject payment');
      }
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reject payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#ff9f43" />;
      case 'awaiting_verification':
        return <AlertCircle size={16} color="#3742fa" />;
      case 'verified':
        return <CheckCircle size={16} color="#00d4aa" />;
      case 'rejected':
        return <XCircle size={16} color="#ff4757" />;
      default:
        return <Clock size={16} color="#666" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9f43';
      case 'awaiting_verification':
        return '#3742fa';
      case 'verified':
        return '#00d4aa';
      case 'rejected':
        return '#ff4757';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount, currency) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  if (loading && intents.length === 0) {
    return (
      <div className="admin-panel">
        <div className="admin-content">
          <div className="loading-container">
            <RefreshCw className="loading-spinner large" size={48} />
            <h2>Loading Payment Intents...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-content">
        <div className="admin-header">
          <h1>Payment Intents</h1>
          <div className="admin-actions">
            <button 
              className="btn btn-outline"
              onClick={fetchIntents}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="filters-section">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="awaiting_verification">Awaiting Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>User</th>
                <th>Order</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {intents.map((intent) => (
                <tr key={intent._id}>
                  <td>{formatDate(intent.createdAt)}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{intent.user?.username || 'N/A'}</div>
                      <div className="user-email">{intent.user?.email || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    {intent.order ? (
                      <div className="order-info">
                        <div className="order-code">
                          {intent.order.orderCode || intent.order.orderNumber}
                        </div>
                        <div className="order-amount">
                          {formatAmount(intent.order.totalAmount || 0, 'NPR')}
                        </div>
                      </div>
                    ) : (
                      <span className="no-order">No Order</span>
                    )}
                  </td>
                  <td className="amount-cell">
                    {formatAmount(intent.amount, intent.currency)}
                  </td>
                  <td>
                    <div className="reference-cell">
                      {intent.externalRef || (
                        <span className="no-reference">Not provided</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(intent.status) }}
                    >
                      {getStatusIcon(intent.status)}
                      {intent.status.toUpperCase().replace('_', ' ')}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setSelectedIntent(intent);
                          setShowDetailModal(true);
                        }}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      
                      {intent.status === 'awaiting_verification' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => {
                              setSelectedIntent(intent);
                              setNotes('');
                              setShowVerifyModal(true);
                            }}
                            title="Verify Payment"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              setSelectedIntent(intent);
                              setNotes('');
                              setShowRejectModal(true);
                            }}
                            title="Reject Payment"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {intents.length === 0 && !loading && (
            <div className="empty-state">
              <AlertCircle size={48} color="#666" />
              <h3>No Payment Intents Found</h3>
              <p>No payment intents match your current filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-outline"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-outline"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedIntent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Payment Intent Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Intent ID:</label>
                  <span>{selectedIntent._id}</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span>{formatAmount(selectedIntent.amount, selectedIntent.currency)}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span style={{ color: getStatusColor(selectedIntent.status) }}>
                    {selectedIntent.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Reference:</label>
                  <span>{selectedIntent.externalRef || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Created:</label>
                  <span>{formatDate(selectedIntent.createdAt)}</span>
                </div>
                {selectedIntent.notes && (
                  <div className="detail-item full-width">
                    <label>Admin Notes:</label>
                    <span>{selectedIntent.notes}</span>
                  </div>
                )}
              </div>

              {selectedIntent.receiptUrl && (
                <div className="receipt-section">
                  <h4>Receipt Image</h4>
                  <div className="receipt-image">
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedIntent.receiptUrl}`}
                      alt="Receipt"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedIntent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Verify Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowVerifyModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to verify this payment?</p>
              <div className="payment-summary">
                <strong>{formatAmount(selectedIntent.amount, selectedIntent.currency)}</strong>
                {selectedIntent.order && (
                  <span> for Order {selectedIntent.order.orderCode || selectedIntent.order.orderNumber}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Notes (optional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowVerifyModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleVerify}
                disabled={submitting}
              >
                {submitting ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedIntent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reject Payment</h3>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to reject this payment?</p>
              <div className="payment-summary">
                <strong>{formatAmount(selectedIntent.amount, selectedIntent.currency)}</strong>
                {selectedIntent.order && (
                  <span> for Order {selectedIntent.order.orderCode || selectedIntent.order.orderNumber}</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Reason for rejection (required):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please provide a reason for rejecting this payment..."
                  rows={3}
                  maxLength={500}
                  required
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReject}
                disabled={submitting || !notes.trim()}
              >
                {submitting ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
