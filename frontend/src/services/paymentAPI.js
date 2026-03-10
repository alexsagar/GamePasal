import api from './api';

const paymentAPI = {
  initiateEsewa: async (orderId) => {
    return api.post('/payments/esewa/initiate', { orderId });
  },

  verifyEsewa: async (dataStr) => {
    return api.post('/payments/esewa/verify', { data: dataStr });
  }
};

export default paymentAPI;
