import axios from 'axios';

const RAW_API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const NORMALIZED_ROOT = RAW_API_ROOT.replace(/\/$/, "");
const API_BASE_URL = NORMALIZED_ROOT.endsWith("/api") ? NORMALIZED_ROOT : `${NORMALIZED_ROOT}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        if (response.data.success) {
          const { accessToken } = response.data.data;
          
          // Update stored token
          localStorage.setItem('accessToken', accessToken);
          
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyOTP: (otpData) => api.post('/auth/verify-otp', otpData),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetData) => api.post('/auth/reset-password', resetData),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (category) => api.get(`/products/category/${category}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
};

export const orderAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export const checkoutAPI = {
  quote: (payload) => api.post('/checkout/quote', payload),
  createIntent: (payload) => api.post('/checkout/create-intent', payload),
  cancel: (payload) => api.post('/checkout/cancel', payload),
};

export const contentAPI = {
  // NOTE: server exposes /api/banners, so keep using /banners here
  getBanners: () => api.get('/banners'),
  getAnnouncements: () => api.get('/content/announcements'),
};

export const adminAPI = {
  // Products
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Orders
  getAllOrders: () => api.get('/orders/all'),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  
  // Users
  getAllUsers: () => api.get('/users/all'),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  
  // Content
  createBanner: (bannerData) => api.post('/banners', bannerData),
  updateBanner: (id, bannerData) => api.put(`/banners/${id}`, bannerData),
  deleteBanner: (id) => api.delete(`/banners/${id}`),
};

export const walletAPI = {
  initTopupEsewaQR: (payload) => api.post('/wallet/topup/esewa-qr/init', payload),
  uploadReceipt: (formData) => api.post('/wallet/topup/esewa-qr/upload-receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyWallet: (params) => api.get('/wallet/me', { params }),
};

export default api;