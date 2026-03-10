import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import QRBlock from '../../components/Payment/QRBlock';
import UploadField from '../../components/Payment/UploadField';
import paymentAPI from '../../services/paymentAPI';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * QR Payment Page Component
 * Displays QR code and allows users to upload receipt and enter transaction reference
 */
const QRPay = () => {
  const navigate = useNavigate();
  const { intentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [intentData, setIntentData] = useState(null);
  const [externalRef, setExternalRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    if (intentId) {
      fetchIntentData();
    } else {
      setError('No payment intent ID provided');
      setLoading(false);
    }
  }, [intentId]);

  const fetchIntentData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await paymentAPI.getQRStatus(intentId);
      setIntentData(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching intent data:', error);
      setError(error.response?.data?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!externalRef.trim()) {
      setError('Please enter your transaction reference');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await paymentAPI.uploadReceipt(intentId, {
        externalRef: externalRef.trim(),
        file: receiptFile
      });
      
      setSuccess('Receipt uploaded successfully! Your payment is now under review.');
      toast.success('Payment submitted for verification');
      
      // Navigate to pending page after a short delay
      setTimeout(() => {
        navigate(`/payment/pending/${intentId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading receipt:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload receipt';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !intentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Setup Failed</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Go Back
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
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scan & Pay via Fonepay QR</h1>
            <p className="text-gray-600 mt-1">Complete your payment using the QR code below</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="space-y-6">
            {(() => {
              // Build a robust fallback URL for the static QR image
              const envQr = import.meta.env.VITE_FONEPAY_QR_IMAGE_URL;
              const apiRoot = (api?.defaults?.baseURL || '').replace(/\/?api$/, '');
              const derivedQr = apiRoot ? `${apiRoot}/uploads/qr/fonepay.png` : '/fonepay-qr.png';
              const fallbackQr = envQr || derivedQr;
              const qrUrl = intentData?.qrImageUrl || fallbackQr;
              return (
                <QRBlock
                  qrImageUrl={qrUrl}
                  qrData={intentData?.qrData}
                  merchantName={intentData?.instructions?.merchantName || "GamePasal"}
                  amount={intentData?.amount * 100 || 0} // Convert to paisa
                  currency={intentData?.currency || 'NPR'}
                />
              );
            })()}
          </div>

          {/* Receipt Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Submit Payment Proof</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={externalRef}
                    onChange={(e) => setExternalRef(e.target.value)}
                    placeholder="Enter your bank transaction reference"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the reference number from your banking app or SMS
                  </p>
                </div>

                {/* Receipt Upload */}
                <UploadField
                  label="Upload Receipt Screenshot"
                  value={receiptFile}
                  onChange={setReceiptFile}
                  accept="image/*"
                  maxSize={5}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !externalRef.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting for Verification...
                    </div>
                  ) : (
                    'I\'ve Paid — Submit for Verification'
                  )}
                </button>
              </form>
            </div>

            {/* Important Notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Important Payment Information
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Your payment will be verified within 24 hours. You will receive an email confirmation once approved. 
                    Make sure you pay the exact amount and include your transaction reference in the payment note.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPay;