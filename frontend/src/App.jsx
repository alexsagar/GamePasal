import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import Software from './pages/Software/Software';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailure from './pages/Payment/PaymentFailure';
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
// Static pages
import About from './pages/Static/About';
import Careers from './pages/Static/Careers';
import Blog from './pages/Static/Blog';
import Partners from './pages/Static/Partners';
import Affiliate from './pages/Static/Affiliate';
import Help from './pages/Static/Help';
import FAQ from './pages/Static/FAQ';
import Contact from './pages/Static/Contact';
import Terms from './pages/Static/Terms';
import Privacy from './pages/Static/Privacy';

import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:category" element={<Products />} />
          <Route path="/software" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          {/* Static pages */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:section" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Suspense fallback={<div>Loading...</div>}>
                  <AdminPanel />
                </Suspense>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  // Google OAuth Client ID - you'll need to replace this with your actual client ID
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;
