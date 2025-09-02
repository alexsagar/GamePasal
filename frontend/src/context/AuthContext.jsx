import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const RAW_API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const NORMALIZED_ROOT = RAW_API_ROOT.replace(/\/$/, '');
const API_BASE_URL = NORMALIZED_ROOT.endsWith('/api') ? NORMALIZED_ROOT : `${NORMALIZED_ROOT}/api`;

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'UPDATE_TOKENS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [walletBalancePaisa, setWalletBalancePaisa] = React.useState(0);

  useEffect(() => {
    // Check for existing tokens on app load
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = JSON.parse(localStorage.getItem('user'));

    if (accessToken && refreshToken && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken, refreshToken }
      });
      const wb = parseInt(localStorage.getItem('walletBalancePaisa') || '0', 10);
      if (!Number.isNaN(wb)) setWalletBalancePaisa(wb);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data?.twoFactorRequired) {
        return { success: true, twoFactorRequired: true, tempToken: data.data.tempToken, user: data.data.user };
      }

      if (data.success) {
        const { accessToken, refreshToken, user } = data.data;
        
        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken }
        });

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const completeTwoFactorLogin = async (code, tempToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tempToken })
      });
      const data = await response.json();
      if (data.success) {
        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken, refreshToken } });
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid code' };
    } catch (e) {
      return { success: false, message: 'Network error occurred' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, refreshToken, user } = data.data;
        
        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken }
        });

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate refresh tokens
      if (state.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken } = data.data;
        
        // Update access token
        localStorage.setItem('accessToken', accessToken);
        
        dispatch({
          type: 'UPDATE_TOKENS',
          payload: { accessToken, refreshToken: state.refreshToken }
        });

        return accessToken;
      } else {
        // Refresh token is invalid, logout user
        logout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  };

  const refreshWallet = async () => {
    try {
      if (!state.accessToken) return;
      const res = await fetch(`${API_BASE_URL}/wallet/me`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalancePaisa(data.data?.balancePaisa || 0);
        localStorage.setItem('walletBalancePaisa', String(data.data?.balancePaisa || 0));
      }
    } catch {}
  };

  useEffect(() => {
    if (!state.accessToken) return;
    
    let es = null;
    let reconnectTimer = null;
    
    const connectSSE = () => {
      try {
        es = new EventSource(`${API_BASE_URL}/wallet/stream?token=${state.accessToken}`);
        
        es.addEventListener('connected', (e) => {
          console.log('SSE connected:', e.data);
        });
        
        es.addEventListener('wallet:update', (e) => {
          try {
            const { balancePaisa } = JSON.parse(e.data || '{}');
            if (typeof balancePaisa === 'number') {
              setWalletBalancePaisa(balancePaisa);
              localStorage.setItem('walletBalancePaisa', String(balancePaisa));
            }
          } catch (err) {
            console.error('SSE data parse error:', err);
          }
        });
        
        es.addEventListener('ping', (e) => {
          // Keep connection alive
        });
        
        es.onerror = (e) => {
          console.log('SSE connection error, will retry...');
          if (es) {
            es.close();
            es = null;
          }
          // Retry after 5 seconds
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
        
        es.onopen = () => {
          console.log('SSE connection opened');
        };
        
      } catch (err) {
        console.error('SSE connection failed:', err);
        // Retry after 5 seconds
        reconnectTimer = setTimeout(connectSSE, 5000);
      }
    };
    
    connectSSE();
    
    return () => {
      if (es) es.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [state.accessToken]);

  // Polling fallback every 30s and on window focus
  useEffect(() => {
    if (!state.accessToken) return;
    const id = setInterval(() => { refreshWallet(); }, 30000);
    const onFocus = () => refreshWallet();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [state.accessToken]);

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    localStorage.setItem('user', JSON.stringify({ ...state.user, ...userData }));
  };

  const googleLogin = async (googleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleData),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, refreshToken, user } = data.data;
        
        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken }
        });

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const facebookLogin = async (facebookData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facebookData),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken, refreshToken, user } = data.data;
        
        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken }
        });

        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  // Make refreshWallet available globally for admin panel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshUserWallet = refreshWallet;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshUserWallet;
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      // Derived/computed helpers for consumers
      isAdmin: state.user?.role === 'admin',
      loading: state.isLoading,
      walletBalancePaisa,
      login,
      register,
      verifyOTP,
      logout,
      refreshAccessToken,
      refreshWallet,
      updateUser,
      completeTwoFactorLogin,
      googleLogin,
      facebookLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};