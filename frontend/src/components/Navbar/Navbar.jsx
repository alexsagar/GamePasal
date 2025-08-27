import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api, { walletAPI } from '../../services/api';
import { Wallet, Wallet2 } from 'lucide-react';

import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Gamepad2,
  ChevronRight,
} from 'lucide-react';
import './Navbar.css';

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || '';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // left drawer
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false); // right drawer
  const [isProfileOpen, setIsProfileOpen] = useState(false); // desktop dropdown
  const [isSmall, setIsSmall] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const searchRef = useRef();
  const leftDrawerRef = useRef(null);
  const rightDrawerRef = useRef(null);
  const burgerBtnRef = useRef(null);
  const userBtnRef = useRef(null);

  const { user, logout, isAdmin, walletBalancePaisa, refreshWallet } = useAuth();
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Breakpoint watcher
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const apply = () => setIsSmall(!!mql.matches);
    apply();
    const onChange = (e) => setIsSmall(!!e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Ensure only one drawer at a time
  useEffect(() => {
    if (isMenuOpen) setIsUserDrawerOpen(false);
  }, [isMenuOpen]);
  useEffect(() => {
    if (isUserDrawerOpen) setIsMenuOpen(false);
  }, [isUserDrawerOpen]);

  // Live Search with debounce + guard
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const handler = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set('q', searchQuery);
        params.set('limit', '10');
        params.set('startsWith', 'true');
        const res = await api.get(`/products/search?${params.toString()}`);
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setSearchResults(data);
        setOpen(true);
        setActiveIndex(0);
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setOpen(true);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300); // debounce

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close transient UI on route change (React Router v6-safe)
  useEffect(() => {
    setOpen(false);
    setIsMenuOpen(false);
    setIsUserDrawerOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Fetch wallet balance when user present and on profile wallet actions
  useEffect(() => {
    if (user) refreshWallet();
  }, [user]);

  // Desktop profile dropdown outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Body scroll lock & ESC for drawers
  useEffect(() => {
    const anyOpen = isMenuOpen || isUserDrawerOpen;
    if (!anyOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsUserDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isMenuOpen, isUserDrawerOpen]);

  // Focus trap utility
  const trapFocus = (containerRef) => (e) => {
    if (e.key !== 'Tab') return;
    const root = containerRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled'));
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Move focus into drawer on open
  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        leftDrawerRef.current?.querySelector('button, a, input')?.focus();
      }, 0);
    } else if (burgerBtnRef.current) {
      burgerBtnRef.current.blur();
    }
  }, [isMenuOpen]);
  useEffect(() => {
    if (isUserDrawerOpen) {
      setTimeout(() => {
        rightDrawerRef.current?.querySelector('button, a, input')?.focus();
      }, 0);
    } else if (userBtnRef.current) {
      userBtnRef.current.blur();
    }
  }, [isUserDrawerOpen]);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, searchResults.length - 1)));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && searchResults[activeIndex]) {
      e.preventDefault();
      navigate(`/product/${searchResults[activeIndex]._id}`);
      setSearchQuery('');
      setSearchResults([]);
      setOpen(false);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchResults([]);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsUserDrawerOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'PC', path: '/products/PC' },
    { name: 'PlayStation', path: '/products/PlayStation' },
    { name: 'Xbox', path: '/products/Xbox' },
    { name: 'Gift Cards', path: '/products/gift-cards' },
  ];

  const getThumbSrc = (image) => {
    if (!image) return '';
    return image.startsWith('http') ? image : `${BACKEND_BASE_URL}/uploads/${image}`;
  };

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={() => {
            setIsMenuOpen(false);
            setIsUserDrawerOpen(false);
          }}
        >
          <Gamepad2 size={28} />
          <span>GamePasal</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav">
          <Link key="home" to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/products/PC" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            PC
          </Link>
          <Link to="/products/PlayStation" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            PlayStation
          </Link>
          <Link to="/products/Xbox" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Xbox
          </Link>
          <Link to="/products/gift-cards" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Gift Cards
          </Link>
        </div>

        {/* Search Bar with live results */}
        <form
          className="navbar-search"
          onSubmit={handleSearch}
          autoComplete="off"
          role="search"
          aria-label="Site search"
          ref={searchRef}
        >
          <input
            type="text"
            placeholder="Search games, gift cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            onKeyDown={onKeyDown}
            onFocus={() => {
              if (searchQuery && searchResults.length >= 0) setOpen(true);
            }}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={open}
            aria-activedescendant={open ? `sr-${activeIndex}` : undefined}
          />
          <button type="submit" className="search-btn" aria-label="Search">
            <Search size={20} />
          </button>

          {open && (
            <ul
              id="search-suggestions"
              className="search-dropdown search-dropdown-panel"
              role="listbox"
            >
              {searching && <li className="search-result-loading">Searching…</li>}

              {!searching &&
                searchResults.length > 0 &&
                searchResults.map((product, i) => (
                  <li
                    id={`sr-${i}`}
                    key={product._id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`search-item ${i === activeIndex ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={() => {
                      navigate(`/product/${product._id}`);
                      setSearchQuery('');
                      setSearchResults([]);
                      setOpen(false);
                    }}
                  >
                    {product.image && (
                      <img src={getThumbSrc(product.image)} alt="" className="thumb" />
                    )}
                    <div className="meta">
                      <div className="title">{product.title}</div>
                      <div className="price">
                        NRS {Number(product.salePrice || product.price).toLocaleString()}
                      </div>
                      {product.popular && <span className="badge-popular">Popular</span>}
                    </div>
                  </li>
                ))}

              {!searching && searchResults.length === 0 && searchQuery.trim() && (
                <li className="search-result-empty">No results found</li>
              )}
            </ul>
          )}
        </form>

        {/* Right Actions */}
        <div className="navbar-actions">
          {user && (
            <div title="GP Credits" aria-label="Wallet balance" className="wallet-chip" style={{ display:'flex', alignItems:'center', gap:6, marginRight:8 }}>
              <Wallet2 size={20} />
              <span style={{ fontWeight:600, cursor:'pointer' }} onClick={()=>navigate('/profile/wallet')}>NRS {(Math.round(walletBalancePaisa)/100).toFixed(2)}</span>
              <button className="btn btn-outline" style={{ padding:'2px 6px' }} onClick={()=>setTopupOpen(true)}>+</button>
            </div>
          )}
          <Link
            to="/cart"
            className="cart-link"
            onClick={() => {
              setIsMenuOpen(false);
              setIsUserDrawerOpen(false);
            }}
          >
            <ShoppingCart size={24} />
            {getCartItemsCount() > 0 && (
              <span className="cart-badge">{getCartItemsCount()}</span>
            )}
          </Link>

          {/* Always show user button; contents change by auth state */}
          <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`} style={{ position: 'relative' }}>
            <button
              ref={userBtnRef}
              className="profile-btn"
              onClick={() => {
                if (isSmall) {
                  setIsUserDrawerOpen(true);
                  setIsProfileOpen(false);
                } else {
                  setIsProfileOpen((v) => !v);
                }
              }}
              aria-expanded={isSmall ? isUserDrawerOpen : isProfileOpen}
              aria-haspopup="true"
            >
              <User size={24} />
              {user && <span className="profile-name">{user.username}</span>}
            </button>

            {/* Desktop dropdown */}
            {!isSmall && (
              <div
                className="dropdown-menu"
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 1100, maxHeight: 360, overflowY: 'auto' }}
              >
                {user ? (
                  <>
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <User size={18} />Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                        <Settings size={18} />Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <LogOut size={18} />Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      Login
                    </Link>
                    <Link to="/signup" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Burger */}
          <button
            ref={burgerBtnRef}
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>

    {/* === Portaled Drawers === */}
    {isSmall && createPortal(
      <>
        {/* Left Drawer (Main Menu) */}
        <div
          className={`nav-drawer drawer-left ${isMenuOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          ref={leftDrawerRef}
          onKeyDown={trapFocus(leftDrawerRef, () => setIsMenuOpen(false))}
        >
          <div className="drawer-header">
            <h3>Platforms</h3>
            <button className="drawer-close" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Mobile search inside left drawer */}
          <div className="mobile-search">
            <form onSubmit={handleSearch} className="mobile-search-form">
              <input
                className="mobile-search-input"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button type="submit" className="mobile-search-btn" aria-label="Search">
                <Search size={18} />
              </button>
            </form>
          </div>

          <nav className="drawer-nav">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="drawer-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name} <ChevronRight size={16} className="chev" />
              </Link>
            ))}
          </nav>
        </div>

        {isMenuOpen && (
          <div className="nav-backdrop" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />
        )}
      </>,
      document.body
    )}

    {isSmall && createPortal(
      <>
        {/* Right Drawer (User) */}
        <div
          className={`nav-drawer drawer-right ${isUserDrawerOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="User menu"
          ref={rightDrawerRef}
          onKeyDown={trapFocus(rightDrawerRef, () => setIsUserDrawerOpen(false))}
        >
          <div className="drawer-header">
            <h3>{user ? 'Account' : 'Welcome'}</h3>
            <button
              className="drawer-close"
              aria-label="Close user menu"
              onClick={() => setIsUserDrawerOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="drawer-nav">
            {user ? (
              <>
                <Link to="/profile" className="drawer-link" onClick={() => setIsUserDrawerOpen(false)}>
                  Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="drawer-link" onClick={() => setIsUserDrawerOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <button className="drawer-link" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="drawer-link" onClick={() => setIsUserDrawerOpen(false)}>
                  Login
                </Link>
                <Link to="/signup" className="drawer-link" onClick={() => setIsUserDrawerOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>

        {isUserDrawerOpen && (
          <div className="nav-backdrop" onClick={() => setIsUserDrawerOpen(false)} aria-hidden="true" />
        )}
      </>,
      document.body
    )}

    {topupOpen && (
      <TopUpModal onClose={() => setTopupOpen(false)} onDone={() => { setTopupOpen(false); setTopupSuccess(true); refreshWallet(); }} />
    )}
    {topupSuccess && (
      <div className="modal-overlay" onClick={() => setTopupSuccess(false)}>
        <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <h2>Success</h2>
            <button className="close-btn" onClick={() => setTopupSuccess(false)}>×</button>
          </div>
          <div className="modal-content" style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:'50%', background:'#00d4aa', color:'#fff', fontWeight:700 }}>✓</span>
            <div>Receipt received. Your top‑up is under review.</div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};


export default Navbar;

// --- TopUp Modal (client-side Cloudinary-ready) ---
const TopUpModal = ({ onClose, onDone }) => {
  const { refreshWallet } = useAuth();
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [txnId, setTxnId] = useState('');
  const [qr, setQr] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const formatErr = (t) => setMessage(t);

  const init = async () => {
    const n = Number(amount);
    if (!n || n < 100 || n > 25000) return formatErr('Amount must be 100–25,000');
    setSubmitting(true); setMessage('');
    try {
      const idempotencyKey = (window.crypto?.randomUUID && window.crypto.randomUUID()) || `${Date.now()}-${Math.random()}`;
      const res = await walletAPI.initTopupEsewaQR({ amountPaisa: Math.round(n*100), idempotencyKey, referenceNote: reference });
      if (res.data?.success) { setTxnId(res.data.data.txnId); setQr(res.data.data.qr); }
      else formatErr(res.data?.message || 'Failed to create ticket');
    } catch { formatErr('Failed to create ticket'); }
    setSubmitting(false);
  };

  const upload = async () => {
    if (!txnId) return;
    setSubmitting(true); setMessage('');
    try {
      // If you upload to Cloudinary on client, send receiptUrl instead.
      if (file) {
        const fd = new FormData();
        fd.append('txnId', txnId);
        fd.append('file', file);
        if (reference) fd.append('referenceNote', reference);
        await walletAPI.uploadReceipt(fd);
      } else {
        return formatErr('Select a receipt file to upload');
      }
      setMessage('Receipt received. Your top‑up is under review.');
      refreshWallet();
      setDone(true);
      // Immediately pass control to parent to close and show success modal
      if (onDone) onDone();
    } catch { formatErr('Upload failed'); }
    setSubmitting(false);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2>Add GP Credits</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          {done && (
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:32, height:32, borderRadius:'50%', background:'#00d4aa', color:'#fff', fontWeight:700
              }}>
                ✓
              </span>
              <div>Receipt received. Under review.</div>
            </div>
          )}
          {message && <div className="message success">{message}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Amount (NPR)</label>
              <input type="number" min="100" max="25000" className="form-input" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="e.g., 1000" />
            </div>
            <div className="form-group">
              <label>Reference Note (optional)</label>
              <input type="text" className="form-input" value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="Sender name / eSewa ref" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={init} disabled={submitting || !!txnId}>Create Ticket &amp; Show QR</button>

          {qr && (
            <div className="setting-card" style={{ marginTop: 16 }}>
              <h3>Scan the eSewa QR</h3>
              <p className="muted">Scan and pay, then upload the receipt (jpg/png/pdf ≤ 10 MB).</p>
              <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                <img src={qr.qrUrl} alt="eSewa QR" style={{ width: 180, height: 180, background:'#fff', padding:8, borderRadius:8 }} />
                <div>
                  <p><strong>Account:</strong> {qr.accountName}</p>
                  <p><strong>eSewa ID:</strong> {qr.esewaId}</p>
                  <input type="file" accept="image/*,application/pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
                  <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={upload} disabled={submitting || !file}>Upload Receipt</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
