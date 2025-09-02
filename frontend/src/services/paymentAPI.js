import api from './api';

const paymentAPI = {
  // Initiate eSewa payment
  initiateEsewaPayment: async (data) => {
    return api.post('/payments/esewa/initiate', data);
  },

  // Initiate Khalti payment
  initiateKhaltiPayment: async (data) => {
    return api.post('/payments/khalti/initiate', data);
  },

  // Verify eSewa payment
  verifyEsewaPayment: async (data) => {
    return api.post('/payments/esewa/verify', data);
  },

  // Verify Khalti payment
  verifyKhaltiPayment: async (data) => {
    return api.post('/payments/khalti/verify', data);
  },

  // Get payment status
  getPaymentStatus: async (txnId) => {
    return api.get(`/payments/status/${txnId}`);
  },

  // Wallet top-up with gateway
  initTopupGateway: async (data) => {
    return api.post('/wallet/topup/gateway/init', data);
  }
};

export default paymentAPI;
