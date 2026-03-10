import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

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

  const { user, logout, isAdmin } = useAuth();
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
      <nav className="navbar-modern">
        <div className="navbar-container-modern">
          {/* Logo */}
          <Link
            to="/"
            className="navbar-logo-modern"
            onClick={() => {
              setIsMenuOpen(false);
              setIsUserDrawerOpen(false);
            }}
          >
            <div className="logo-icon">
              <Gamepad2 size={24} />
            </div>
            <span className="logo-text">GamePasal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav-modern">
            <Link key="home" to="/" className="nav-link-modern" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/products/PC" className="nav-link-modern" onClick={() => setIsMenuOpen(false)}>
              PC Games
            </Link>
            <Link to="/products/PlayStation" className="nav-link-modern" onClick={() => setIsMenuOpen(false)}>
              PlayStation
            </Link>
            <Link to="/products/Xbox" className="nav-link-modern" onClick={() => setIsMenuOpen(false)}>
              Xbox
            </Link>
            <Link to="/products/gift-cards" className="nav-link-modern" onClick={() => setIsMenuOpen(false)}>
              Gift Cards
            </Link>
          </div>

          {/* Search Bar with live results */}
          <div className="navbar-search-modern" ref={searchRef}>
            <form
              className="search-form-modern"
              onSubmit={handleSearch}
              autoComplete="off"
              role="search"
              aria-label="Site search"
            >
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search games, gift cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modern"
                  onKeyDown={onKeyDown}
                  onFocus={() => {
                    if (searchQuery && searchResults.length >= 0) setOpen(true);
                  }}
                  aria-autocomplete="list"
                  aria-controls="search-suggestions"
                  aria-expanded={open}
                  aria-activedescendant={open ? `sr-${activeIndex}` : undefined}
                />
                <button type="submit" className="search-btn-modern" aria-label="Search">
                  <Search size={18} />
                </button>
              </div>

              {open && (
                <div className="search-dropdown-modern" id="search-suggestions" role="listbox">
                  {searching && <div className="search-result-loading">Searching…</div>}

                  {!searching &&
                    searchResults.length > 0 &&
                    searchResults.map((product, i) => (
                      <div
                        id={`sr-${i}`}
                        key={product._id}
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`search-item-modern ${i === activeIndex ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={() => {
                          navigate(`/product/${product._id}`);
                          setSearchQuery('');
                          setSearchResults([]);
                          setOpen(false);
                        }}
                      >
                        {product.image && (
                          <img src={getThumbSrc(product.image)} alt="" className="search-thumb" />
                        )}
                        <div className="search-meta">
                          <div className="search-title">{product.title}</div>
                          <div className="search-price">
                            NRS {Number(product.salePrice || product.price).toLocaleString()}
                          </div>
                          {product.popular && <span className="search-badge">Popular</span>}
                        </div>
                      </div>
                    ))}

                  {!searching && searchResults.length === 0 && searchQuery.trim() && (
                    <div className="search-result-empty">No results found</div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right Actions */}
          <div className="navbar-actions-modern">

            <Link
              to="/cart"
              className="cart-link-modern"
              onClick={() => {
                setIsMenuOpen(false);
                setIsUserDrawerOpen(false);
              }}
            >
              <ShoppingCart size={20} />
              {getCartItemsCount() > 0 && (
                <span className="cart-badge-modern">{getCartItemsCount()}</span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className={`profile-dropdown-modern ${isProfileOpen ? 'open' : ''}`}>
              <button
                ref={userBtnRef}
                className="profile-btn-modern"
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
                <User size={20} />
                {user && <span className="profile-name-modern">{user.username}</span>}
              </button>

              {/* Desktop dropdown */}
              {!isSmall && (
                <div className="dropdown-menu-modern">
                  {user ? (
                    <>
                      <Link to="/profile" className="dropdown-item-modern" onClick={() => setIsProfileOpen(false)}>
                        <User size={16} />
                        Profile
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="dropdown-item-modern" onClick={() => setIsProfileOpen(false)}>
                          <Settings size={16} />
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="dropdown-item-modern logout">
                        <LogOut size={16} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item-modern" onClick={() => setIsProfileOpen(false)}>
                        Login
                      </Link>
                      <Link to="/signup" className="dropdown-item-modern" onClick={() => setIsProfileOpen(false)}>
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={burgerBtnRef}
              className="mobile-menu-btn-modern"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu size={20} />
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

    </>
  );
};


export default Navbar;
