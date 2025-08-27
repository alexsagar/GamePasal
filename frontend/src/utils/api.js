import axios from "axios";

const RAW_API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const NORMALIZED_ROOT = RAW_API_ROOT.replace(/\/$/, "");
const API_BASE_URL = NORMALIZED_ROOT.endsWith("/api") ? NORMALIZED_ROOT : `${NORMALIZED_ROOT}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies if needed
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token if using JWT/localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or sessionStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors or redirects here
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (maybe redirect to login)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
