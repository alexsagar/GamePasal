import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Smartphone } from 'lucide-react';
import PaymentCard from '../../components/Payment/PaymentCard';
import api from '../../services/api';
import paymentAPI from '../../services/paymentAPI';
import toast from 'react-hot-toast';

const Method = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/${orderId}`);
        const order = response.data.data || response.data;
        setOrderData(order);
      } catch (error) {
        toast.error('Order not found');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrderData();
    else navigate('/cart');
  }, [orderId, navigate]);

  const handleContinue = async () => {
    if (selectedMethod !== 'esewa') {
      toast.error('Please select eSewa to continue');
      return;
    }

    try {
      setCreatingIntent(true);
      const esewaRes = await paymentAPI.initiateEsewa(orderId);
      const esewaData = esewaRes.data?.data;

      if (!esewaData?.signature) {
        throw new Error('Failed to generate eSewa payment signature');
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = esewaData.gateway_url;

      const fields = {
        amount: esewaData.amount,
        tax_amount: esewaData.tax_amount,
        total_amount: esewaData.total_amount,
        transaction_uuid: esewaData.transaction_uuid,
        product_code: esewaData.product_code,
        product_service_charge: esewaData.product_service_charge,
        product_delivery_charge: esewaData.product_delivery_charge,
        success_url: esewaData.success_url,
        failure_url: esewaData.failure_url,
        signed_field_names: esewaData.signed_field_names,
        signature: esewaData.signature
      };

      for (const key in fields) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error('Failed to initiate eSewa payment');
    } finally {
      setCreatingIntent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-8">The order you're looking for could not be found.</p>
            <button
              onClick={() => navigate('/cart')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const orderAmountNPR = orderData ? (orderData.totalPaisa || orderData.totalAmount * 100) / 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Choose Payment Method</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <PaymentCard
                id="esewa"
                title="Pay via eSewa"
                subtitle="Pay instantly and securely using your eSewa digital wallet."
                icon={Smartphone}
                isSelected={selectedMethod === 'esewa'}
                onSelect={() => setSelectedMethod('esewa')}
                variant="primary"
              />
            </div>

            <div className="mt-8">
              <button
                onClick={handleContinue}
                disabled={selectedMethod !== 'esewa' || creatingIntent}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingIntent ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redirecting to eSewa...
                  </div>
                ) : (
                  'Continue to eSewa'
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Order ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {orderData.orderCode || orderData.orderNumber || orderData._id?.slice(-8)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Items</span>
                  <span className="text-sm text-gray-900">
                    {orderData.products?.length || orderData.items?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    NPR {orderAmountNPR.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Payment Information</h4>
                <p className="text-xs text-blue-700">
                  eSewa is the only available payment method for checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Method;
