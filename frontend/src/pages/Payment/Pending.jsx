import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import paymentAPI from '../../services/paymentAPI';
import toast from 'react-hot-toast';

/**
 * Payment Pending Page Component
 * Shows payment status and polls for updates until resolved
 */
const Pending = () => {
  const navigate = useNavigate();
  const { intentId } = useParams();
  const [status, setStatus] = useState('pending');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (intentId) {
      fetchStatus();
      // Start polling every 8 seconds
      const interval = setInterval(fetchStatus, 8000);
      return () => clearInterval(interval);
    } else {
      setError('No payment intent ID provided');
      setLoading(false);
    }
  }, [intentId]);

  const fetchStatus = async () => {
    try {
      const response = await paymentAPI.getQRStatus(intentId);
      const data = response.data.data || response.data;
      
      setStatusData(data);
      setStatus(data.status);
      
      // Stop polling if status is final
      if (['verified', 'rejected'].includes(data.status)) {
        setPolling(false);
      }
      
    } catch (error) {
      console.error('Error fetching status:', error);
      if (loading) {
        setError(error.response?.data?.message || 'Failed to load payment status');
      }
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleTryAgain = () => {
    navigate('/cart');
  };

  const handleViewOrders = () => {
    navigate('/profile?tab=orders');
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Payment Verified!',
          message: 'Your payment has been successfully verified and your order is being processed.',
          actionText: 'View Orders',
          actionHandler: handleViewOrders,
          showStepper: true
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Payment Rejected',
          message: statusData?.notes || 'Your payment could not be verified. Please try again with a valid payment.',
          actionText: 'Try Again',
          actionHandler: handleTryAgain,
          showStepper: false
        };
      case 'awaiting_verification':
        return {
          icon: Clock,
          iconColor: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          title: 'Awaiting Verification',
          message: 'Your payment has been submitted and is currently under review by our team.',
          actionText: null,
          actionHandler: null,
          showStepper: true
        };
      default:
        return {
          icon: Clock,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Processing Payment',
          message: 'We are processing your payment. Please wait while we verify your transaction.',
          actionText: null,
          actionHandler: null,
          showStepper: true
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Status</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => navigate('/cart')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/cart')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Payment Status</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Card */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border-2 p-8 text-center ${config.bgColor} ${config.borderColor}`}>
              {/* Status Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                <IconComponent size={40} className={config.iconColor} />
              </div>

              {/* Status Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {config.title}
              </h2>

              {/* Status Message */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                {config.message}
              </p>

              {/* Auto-refresh Notice */}
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Auto-refreshing every 8 seconds</span>
                </div>
              )}

              {/* Action Button */}
              {config.actionText && (
                <button
                  onClick={config.actionHandler}
                  className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-colors ${
                    status === 'verified'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {config.actionText}
                </button>
              )}
            </div>

            {/* Status Stepper */}
            {config.showStepper && (
              <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Progress</h3>
                <div className="space-y-4">
                  {/* Step 1: Submitted */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ['pending', 'awaiting_verification', 'verified', 'rejected'].includes(status)
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Submitted</p>
                      <p className="text-sm text-gray-600">Your payment receipt has been uploaded</p>
                    </div>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ['awaiting_verification', 'verified', 'rejected'].includes(status)
                        ? status === 'awaiting_verification'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'awaiting_verification' ? (
                        <Clock size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Under Review</p>
                      <p className="text-sm text-gray-600">
                        {status === 'awaiting_verification' 
                          ? 'Our team is verifying your payment'
                          : 'Payment verification completed'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Final Status */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ['verified', 'rejected'].includes(status)
                        ? status === 'verified'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {status === 'verified' ? (
                        <CheckCircle size={16} />
                      ) : status === 'rejected' ? (
                        <XCircle size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {status === 'verified' ? 'Payment Verified' : 
                         status === 'rejected' ? 'Payment Rejected' : 
                         'Awaiting Verification'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {status === 'verified' ? 'Your order is being processed' :
                         status === 'rejected' ? 'Please try again with a valid payment' :
                         'Verification in progress'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Payment ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {intentId?.slice(-8)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Amount</span>
                  <span className="text-sm text-gray-900">
                    NPR {statusData?.amount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === 'verified' ? 'bg-green-100 text-green-800' :
                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                    status === 'awaiting_verification' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {statusData?.externalRef && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Transaction Ref</span>
                    <span className="text-sm font-mono text-gray-900">
                      {statusData.externalRef}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Support */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
                <p className="text-xs text-gray-600 mb-3">
                  If you have any questions about your payment, contact our support team.
                </p>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pending;