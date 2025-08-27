import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart,
  FileText, Settings, Plus, Edit, Trash2, Eye, Search, Gift, Menu, Wallet
} from "lucide-react";
import api from "../../services/api";
import "./AdminPanel.css";
import BannerForm from "../BannerForm/BannerForm";
import Toast from "../BannerForm/Toast";

// Helper for images
const getImageSrc = (img) =>
  img
    ? img.startsWith("http")
      ? img
      : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/${img}`
    : "";

// =================== AdminPanel Main ===================
const AdminPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0,
  });

  useEffect(() => { fetchDashboardStats(); }, []);
  const fetchDashboardStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        api.get('/users'), api.get('/products/admin'), api.get('/orders')
      ]);
      setStats({
        totalUsers: usersRes.data.stats?.totalUsers || 0,
        totalProducts: productsRes.data.total || 0,
        totalOrders: ordersRes.data.stats?.totalOrders || 0,
        totalRevenue: ordersRes.data.stats?.totalRevenue || 0,
      });
    } catch (error) { console.error('Error fetching dashboard stats:', error); }
  };

  const sidebarItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/gift-cards', label: 'Gift Cards', icon: Gift },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/wallet-reviews', label: 'Wallet Reviews', icon: Wallet },
    { path: '/admin/content', label: 'Content', icon: FileText },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`admin-panel ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
      <div className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${location.pathname === item.path ? "active" : ""}`}
              >
                <Icon size={20} />
                <span className="item-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={`admin-main ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile top bar */}
        <div className="admin-mobile-bar">
          <button className="admin-mobile-toggle" aria-label="Toggle sidebar" onClick={() => setIsMobileSidebarOpen(v => !v)}>
            <Menu size={20} />
          </button>
          <div className="admin-mobile-title">Admin Panel</div>
          <button className="admin-collapse-toggle" aria-label="Collapse sidebar" onClick={() => setIsSidebarCollapsed(v => !v)}>
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard stats={stats} />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/products" element={<ProductsManagement categoryFilter={null} />} />
          <Route path="/gift-cards" element={<ProductsManagement categoryFilter="GiftCard" />} />
          <Route path="/orders" element={<OrdersManagement />} />
          <Route path="/content" element={<ContentManagement />} />
          <Route path="/wallet-reviews" element={<WalletReviews />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </div>
      {/* Mobile backdrop */}
      {isMobileSidebarOpen && <div className="admin-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />}
    </div>
  );
};

// =================== Dashboard ===================
const Dashboard = ({ stats }) => (
  <div className="dashboard">
    <div className="dashboard-header">
      <h1>Dashboard Overview</h1>
      <p>Welcome to GamePasal Admin Panel</p>
    </div>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon users"><Users size={24} /></div><div className="stat-info"><h3>{stats.totalUsers}</h3><p>Total Users</p></div></div>
      <div className="stat-card"><div className="stat-icon products"><Package size={24} /></div><div className="stat-info"><h3>{stats.totalProducts}</h3><p>Total Products</p></div></div>
      <div className="stat-card"><div className="stat-icon orders"><ShoppingCart size={24} /></div><div className="stat-info"><h3>{stats.totalOrders}</h3><p>Total Orders</p></div></div>
      <div className="stat-card"><div className="stat-icon revenue"><FileText size={24} /></div><div className="stat-info"><h3>NRS {stats.totalRevenue.toFixed(2)}</h3><p>Total Revenue</p></div></div>
    </div>
    <div className="dashboard-content">
      <div className="recent-orders">
        <h3>Recent Orders</h3>
        <RecentOrdersList />
      </div>
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Link to="/admin/products" className="action-btn">
            <Plus size={20} />
            Add Product
          </Link>
          <Link to="/admin/gift-cards" className="action-btn">
            <Gift size={20} />
            Add Gift Card
          </Link>
        </div>
      </div>
    </div>
  </div>
);
// =================== Users Management ===================
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => { fetchUsers(); }, [searchTerm, filterRole]);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole) params.append('role', filterRole);

      const response = await api.get(`/users?${params}`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  const updateUserStatus = async (userId, isActive) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Users Management</h1>
        <div className="page-actions">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => updateUserStatus(user._id, !user.isActive)}
                      >
                        {user.isActive ? <Trash2 size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =================== Products Management ===================
const ProductsManagement = ({ categoryFilter }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(categoryFilter || '');

    useEffect(() => {
    setFilterCategory(categoryFilter || '');
  }, [categoryFilter]);

  useEffect(() => { fetchProducts(); }, []);
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/admin');
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.platform?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="products-management">
      <div className="page-header">
        <h1>Products Management</h1>
        <div className="page-actions">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Game">Games</option>
            <option value="GiftCard">Gift Cards</option>
            <option value="Software">Software</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} />
            Add Product
          </button>
          <button className="btn btn-primary" onClick={() => setShowGiftCardForm(true)}>
  <Plus size={20} /> Add Gift Card
</button>

        </div>
      </div>
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product._id} className="product-admin-card">
              <img
                src={product.image?.startsWith('http')
                  ? product.image
                  : `http://localhost:5000/uploads/${product.image}`}
                alt={product.title}
              />
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="product-platform">{product.platform}</p>
                <div className="product-price1">
                  {product.salePrice ? (
                    <>
                      <span className="sale-price">NRS {product.salePrice}</span>
                      <span className="original-price">NRS {product.price}</span>
                    </>
                  ) : (
                    <span>NRS {product.price}</span>
                  )}
                </div>
                <div className="product-meta">
                  <span className="stock">Stock: {product.stock}</span>
                  {product.isFeatured && <span className="featured-badge">Featured</span>}
                </div>
                <div className="product-actions1">
                  <button
                    className="btn-icon"
                    title="Edit"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    className="btn-icon danger"
                    title="Delete"
                    onClick={() => deleteProduct(product._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {(showAddForm || editingProduct) && (
  <ProductForm
    product={editingProduct}
    onClose={() => {
      setShowAddForm(false);
      setEditingProduct(null);
    }}
    onSave={() => {
      fetchProducts();
      setShowAddForm(false);
      setEditingProduct(null);
    }}
  />
)}

{showGiftCardForm && (
  <GiftCardForm
    onClose={() => setShowGiftCardForm(false)}
    onSave={() => {
      fetchProducts();
      setShowGiftCardForm(false);
    }}
  />
)}

    </div>
  );
};

// =================== ProductForm ===================
const ProductForm = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    category: product?.category || 'Game',
    platform: product?.platform || 'PC',
    description: product?.description || '',
    price: product?.price || '',
    salePrice: product?.salePrice || '',
    stock: product?.stock || '',
    image: '',
    imageUrl: product?.image || '',
    genre: product?.genre || '',
    badge: product?.badge || '',
    rating: product?.rating || '',
    type: product?.type || '',
    developer: product?.developer || '',
    publisher: product?.publisher || '',
    releaseDate: product?.releaseDate ? product.releaseDate.split('T')[0] : '',
    isFeatured: product?.isFeatured || false,
    isTopSeller: product?.isTopSeller || false,
    isTrending: product?.isTrending || false,
    isBestSelling: product?.isBestSelling || false,
    isPreOrder: product?.isPreOrder || false,
    features: product?.features ? product.features.join('\n') : '',
    systemRequirements: {
      minimum: product?.systemRequirements?.minimum || '',
      recommended: product?.systemRequirements?.recommended || ''
    }
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    product?.image
      ? (product.image.startsWith('http')
          ? product.image
          : `http://localhost:5000/uploads/${product.image}`)
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData.category === 'Software' && formData.platform) {
      setFormData((f) => ({ ...f, platform: '' }));
    }
  }, [formData.category]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const submitData = new FormData();
      const payload = { ...formData };
      if (payload.category === 'Software') {
        delete payload.platform;
      }

      Object.keys(payload).forEach(key => {
        if (key === 'features') {
          const featuresArray = payload.features.split('\n').filter(f => f.trim());
          submitData.append('features', JSON.stringify(featuresArray));
        } else if (key === 'systemRequirements') {
          submitData.append('systemRequirements', JSON.stringify(payload.systemRequirements));
        } else if (key === 'imageUrl') {
          if (!selectedFile && payload.imageUrl.trim()) {
            submitData.append('image', payload.imageUrl);
          }
        } else if (key !== 'image') {
          submitData.append(key, payload[key]);
        }
      });

      if (selectedFile) {
        submitData.append('image', selectedFile);
      } else if (!formData.imageUrl.trim() && !product) {
        setError('Please either upload an image file or provide an image URL');
        setLoading(false);
        return;
      }

      if (product) {
        await api.put(`/products/${product._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onSave();
    } catch (error) {
      setError(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'category') {
      const newPlatform = value === 'Software' ? 'Software' : 'PC';
      setFormData(prev => ({
        ...prev,
        category: value,
        platform: newPlatform,
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="Game">Game</option>
                <option value="GiftCard">Gift Card</option>
                <option value="Software">Software</option>
              </select>
            </div>
          </div>

          {formData.category !== 'Software' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="platform">Platform</label>
                <select id="platform" name="platform" value={formData.platform || ''} onChange={handleInputChange} required>
                  <option value="" disabled>Select platform</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Nintendo">Nintendo</option>
                  <option value="Steam">Steam</option>
                  <option value="Mobile">Mobile</option>
                  <option value="iTunes">iTunes</option>
                  <option value="All">All</option>
                </select>
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select name="genre" value={formData.genre} onChange={handleInputChange}>
                  <option value="">Select Genre</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="RPG">RPG</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Sports">Sports</option>
                  <option value="Racing">Racing</option>
                  <option value="Simulation">Simulation</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Fighting">Fighting</option>
                  <option value="Shooter">Shooter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (NRS)</label>
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Sale Price (NRS)</label>
              <input type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required />
            </div>
            {formData.category !== 'Software' && (
              <div className="form-group">
                <label>Badge</label>
                <select name="badge" value={formData.badge} onChange={handleInputChange}>
                  <option value="">No Badge</option>
                  <option value="NEW">New</option>
                  <option value="SALE">Sale</option>
                  <option value="HOT">Hot</option>
                  <option value="PREORDER">Pre-order</option>
                  <option value="BESTSELLER">Bestseller</option>
                </select>
              </div>
            )}
          </div>

          {formData.category !== 'Software' && (
            <div className="form-row">
              <div className="form-group">
                <label>Rating (0-5)</label>
                <input type="number" step="0.1" min="0" max="5" name="rating" value={formData.rating} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="">Select Type</option>
                  <option value="game">Game</option>
                  <option value="gift-card">Gift Card</option>
                  <option value="subscription">Subscription</option>
                  <option value="dlc">DLC</option>
                </select>
              </div>
            </div>
          )}

          {formData.category !== 'Software' && (
            <div className="form-row">
              <div className="form-group">
                <label>Developer</label>
                <input type="text" name="developer" value={formData.developer} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Publisher</label>
                <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {formData.category !== 'Software' && (
            <div className="form-row">
              <div className="form-group">
                <label>Release Date</label>
                <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {/* Homepage Section Assignments */}
          <div className="homepage-sections">
            <h4>Homepage Section Assignments</h4>
            <div className="section-toggles">
              <div className="section-toggle">
                <label>Featured Games</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="section-toggle">
                <label>Top Seller</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="isTopSeller" checked={formData.isTopSeller} onChange={handleInputChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="section-toggle">
                <label>Trending Products</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="isTrending" checked={formData.isTrending} onChange={handleInputChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="section-toggle">
                <label>Best Selling</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="isBestSelling" checked={formData.isBestSelling} onChange={handleInputChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="section-toggle">
                <label>Pre-Order</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="isPreOrder" checked={formData.isPreOrder} onChange={handleInputChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Product Image</label>
            <div className="image-upload-section">
              <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
              <p className="file-help">Upload an image file (max 5MB) or use URL below</p>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
              <div className="form-group">
                <label>Or Image URL</label>
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
              </div>
            </div>
          </div>

          {formData.category !== 'Software' && (
            <div className="form-group">
              <label>Features (one per line)</label>
              <textarea name="features" value={formData.features} onChange={handleInputChange} rows="4" placeholder="Enter features, one per line" />
            </div>
          )}

          {formData.category !== 'Software' && (
            <div className="form-group">
              <label>System Requirements</label>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Requirements</label>
                  <textarea name="systemRequirements.minimum" value={formData.systemRequirements.minimum} onChange={handleInputChange} rows="3" placeholder="OS: Windows 10
Processor: Intel i5
Memory: 8 GB RAM" />
                </div>
                <div className="form-group">
                  <label>Recommended Requirements</label>
                  <textarea name="systemRequirements.recommended" value={formData.systemRequirements.recommended} onChange={handleInputChange} rows="3" placeholder="OS: Windows 11
Processor: Intel i7
Memory: 16 GB RAM" />
                </div>
              </div>
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : product ? "Update" : "Create"} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GIFT_CARD_PLATFORMS = [
  { key: "Steam", label: "Steam" },
  { key: "PlayStation", label: "PlayStation" },
  { key: "Xbox", label: "Xbox" },
  { key: "iTunes", label: "iTunes" }
];

const GiftCardForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    platform: "Steam",
    image: "",
    imageUrl: "",
    description: "",
    stock: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setSelectedFile(file);
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("price", formData.price);
      submitData.append("category", "GiftCard");
      submitData.append("platform", formData.platform);
      submitData.append("description", formData.description);
      submitData.append("stock", formData.stock);

      // If image by URL
      if (!selectedFile && formData.imageUrl.trim()) {
        submitData.append("image", formData.imageUrl);
      }
      if (selectedFile) {
        submitData.append("image", selectedFile);
      } else if (!formData.imageUrl.trim()) {
        setError("Please upload an image or provide an image URL");
        setLoading(false);
        return;
      }
      await api.post("/products", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onSave();
    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to add gift card"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Gift Card</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Value (NRS)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Platform</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                required
              >
                {GIFT_CARD_PLATFORMS.map((p) => (
                  <option value={p.key} key={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              minLength={1}
              maxLength={1000}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Gift Card Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
            <div className="form-group">
              <label>Or Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Add Gift Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// =================== Orders Management ===================
const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>Orders Management</h1>
      </div>
      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.userId?.username}</td>
                  <td>{order.products.length} items</td>
                  <td>NRS {order.totalAmount}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-icon">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// =================== Content Management (Banners) ===================
const ContentManagement = () => {
  const [banners, setBanners] = useState([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchBanners(); }, []);
  const fetchBanners = async () => {
    try {
      const res = await api.get("/banners");
      setBanners(res.data.data || []);
    } catch {
      setToast({ message: "Failed to load banners", type: "error" });
    }
  };
  const handleSaveBanner = async (banner) => {
    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, banner);
        setToast({ message: "Banner updated", type: "success" });
      } else {
        await api.post("/banners", banner);
        setToast({ message: "Banner added", type: "success" });
      }
      fetchBanners();
      setShowBannerForm(false);
      setEditingBanner(null);
    } catch {
      setToast({ message: "Failed to save banner", type: "error" });
    }
  };
  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await api.delete(`/banners/${bannerId}`);
      setBanners((prev) => prev.filter((b) => b._id !== bannerId));
      setToast({ message: "Banner deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete banner", type: "error" });
    }
  };
  return (
    <div className="content-management">
      <div className="page-header">
        <h1>Content Management</h1>
        <button className="btn btn-primary" onClick={() => { setShowBannerForm(true); setEditingBanner(null); }}>
          <Plus size={20} /> Add Banner
        </button>
      </div>
      <div className="content-sections">
        <div className="content-section-card">
          <h3>Homepage Banners</h3>
          <p>Manage carousel banners on the homepage</p>
          <div className="banner-list">
            {banners.map((banner) => (
              <div key={banner._id} className="banner-item">
                <img src={banner.image} alt={banner.title} />
                <div className="banner-info">
                  <h4>
                    {banner.title}  <span className={`badge ${banner.isActive ? "badge-success" : "badge-error"}`}>
          {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    
                  </h4>
                  <p>{banner.subtitle}</p>
                </div>
                <div className="banner-actions">
                  <button className="btn-icon" onClick={() => { setEditingBanner(banner); setShowBannerForm(true); }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteBanner(banner._id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showBannerForm && (
        <BannerForm
          banner={editingBanner}
          onClose={() => { setShowBannerForm(false); setEditingBanner(null); }}
          onSave={handleSaveBanner}
        />
      )}
      {toast && (
        <Toast {...toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

// =================== Admin Settings ===================
const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'GamePasal',
    siteDescription: 'Your trusted gaming platform',
    contactEmail: 'admin@gamepasal.com',
    supportPhone: '+977-1-1234567',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxUploadSize: 5,
    currency: 'NRS',
    timezone: 'Asia/Kathmandu',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSettingChange = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Here you would typically save to backend
      // await api.put('/admin/settings', settings);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        siteName: 'GamePasal',
        siteDescription: 'Your trusted gaming platform',
        contactEmail: 'admin@gamepasal.com',
        supportPhone: '+977-1-1234567',
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: true,
        maxUploadSize: 5,
        currency: 'NRS',
        timezone: 'Asia/Kathmandu',
        socialLinks: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: ''
        }
      });
      setToast({ message: 'Settings reset to default', type: 'success' });
    }
  };

  return (
    <div className="admin-settings">
      <div className="page-header">
        <h1>Admin Settings</h1>
        <div className="page-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={20} />
              Edit Settings
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="settings-container">
        {/* General Settings */}
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter site name"
              />
            </div>
            <div className="setting-group">
              <label>Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter site description"
                rows={3}
              />
            </div>
            <div className="setting-group">
              <label>Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                disabled={!isEditing}
                placeholder="admin@gamepasal.com"
              />
            </div>
            <div className="setting-group">
              <label>Support Phone</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                disabled={!isEditing}
                placeholder="+977-1-1234567"
              />
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="settings-section">
          <h3>Platform Settings</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                disabled={!isEditing}
              >
                <option value="NRS">Nepalese Rupee (NRS)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                disabled={!isEditing}
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div className="setting-group">
              <label>Max Upload Size (MB)</label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value))}
                disabled={!isEditing}
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>

        {/* User Management Settings */}
        <div className="settings-section">
          <h3>User Management</h3>
          <div className="settings-grid">
            <div className="setting-group toggle-group">
              <label>Maintenance Mode</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </div>
              <small>When enabled, only admins can access the site</small>
            </div>
            <div className="setting-group toggle-group">
              <label>Allow New Registrations</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowRegistrations}
                  onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </div>
              <small>Allow new users to create accounts</small>
            </div>
            <div className="setting-group toggle-group">
              <label>Require Email Verification</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="toggle-slider"></span>
              </div>
              <small>Users must verify their email before accessing</small>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="settings-section">
          <h3>Social Media Links</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>Facebook URL</label>
              <input
                type="url"
                value={settings.socialLinks.facebook}
                onChange={(e) => handleSettingChange('socialLinks.facebook', e.target.value)}
                disabled={!isEditing}
                placeholder="https://facebook.com/gamepasal"
              />
            </div>
            <div className="setting-group">
              <label>Twitter URL</label>
              <input
                type="url"
                value={settings.socialLinks.twitter}
                onChange={(e) => handleSettingChange('socialLinks.twitter', e.target.value)}
                disabled={!isEditing}
                placeholder="https://twitter.com/gamepasal"
              />
            </div>
            <div className="setting-group">
              <label>Instagram URL</label>
              <input
                type="url"
                value={settings.socialLinks.instagram}
                onChange={(e) => handleSettingChange('socialLinks.instagram', e.target.value)}
                disabled={!isEditing}
                placeholder="https://instagram.com/gamepasal"
              />
            </div>
            <div className="setting-group">
              <label>YouTube URL</label>
              <input
                type="url"
                value={settings.socialLinks.youtube}
                onChange={(e) => handleSettingChange('socialLinks.youtube', e.target.value)}
                disabled={!isEditing}
                placeholder="https://youtube.com/gamepasal"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <h3>Danger Zone</h3>
          <div className="danger-actions">
            <div className="danger-item">
              <div className="danger-info">
                <h4>Reset All Settings</h4>
                <p>This will reset all settings to their default values. This action cannot be undone.</p>
              </div>
              <button className="btn btn-danger" onClick={handleResetSettings}>
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast {...toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

// =================== Recent Orders List ===================
const RecentOrdersList = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  useEffect(() => { fetchRecentOrders(); }, []);
  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/orders?limit=5');
      setRecentOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };
  return (
    <div className="recent-orders-list">
      {recentOrders.map((order) => (
        <div key={order._id} className="order-item">
          <div className="order-info">
            <span className="order-number">{order.orderNumber}</span>
            <span className="customer-name">{order.userId?.username}</span>
          </div>
          <div className="order-amount">NRS {order.totalAmount}</div>
          <div className={`order-status ${order.status}`}>
            {order.status}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;

// =================== Wallet Reviews ===================
const WalletReviews = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('UNDER_REVIEW');
  const [userFilter, setUserFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [approveTxn, setApproveTxn] = useState(null);
  const [adjustTxn, setAdjustTxn] = useState(null);
  const [rejectTxn, setRejectTxn] = useState(null);
  const [revertTxn, setRevertTxn] = useState(null);

  const fetchTxns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (userFilter) params.set('user', userFilter);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get(`/wallet/admin/topups?${params.toString()}`);
      setTransactions(res.data?.data?.transactions || []);
    } catch (e) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTxns(); }, [status, userFilter, from, to]);

  const approve = (txn) => setApproveTxn(txn);
  const reject = (txn) => setRejectTxn(txn);

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Wallet Reviews</h1>
        <div className="page-actions">
          <select className="filter-select" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DELETED">Deleted</option>
          </select>
          <input className="search-box-input" placeholder="Filter by user id" value={userFilter} onChange={(e)=>setUserFilter(e.target.value)} />
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading top-ups…</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Receipt</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{t.user?.username || t.user?.email || t.user}</td>
                  <td>NRS {(Math.round(t.amount)/100).toFixed(2)}</td>
                  <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                  <td className="muted">{t.referenceNote || '-'}</td>
                <td>
                  {t.receiptUrl ? (
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
                        const abs = t.receiptUrl.startsWith('http') ? t.receiptUrl : `${ROOT}${t.receiptUrl}`;
                        setPreviewUrl(abs);
                      }}
                    >
                      View
                    </button>
                  ) : '-'}
                </td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>
                    {t.status === 'UNDER_REVIEW' && (
                      <>
                        <button className="btn btn-primary" onClick={() => approve(t)}>Approve</button>
                        <button className="btn btn-secondary" onClick={() => reject(t)} style={{ marginLeft: 8 }}>Reject</button>
                      </>
                    )}
                    {t.status === 'SUCCESS' && (
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-secondary" onClick={()=> setAdjustTxn(t)}>Edit</button>
                        <button className="btn btn-danger" onClick={()=> setRevertTxn(t)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl('')}>
          <div className="modal" style={{ maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Receipt Preview</h2>
              <button className="close-btn" onClick={() => setPreviewUrl('')}>×</button>
            </div>
            <div className="modal-content" style={{ padding: 0 }}>
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe title="Receipt PDF" src={previewUrl} style={{ width: '90vw', height: '80vh', border: 'none' }} />
              ) : (
                <img src={previewUrl} alt="Receipt" style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block', margin: '0 auto', background: '#fff' }} />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Approve Modal */}
      {approveTxn && (
        <div className="modal-overlay" onClick={()=> setApproveTxn(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Approve Top‑up</h2>
              <button className="close-btn" onClick={()=> setApproveTxn(null)}>×</button>
            </div>
            <div className="modal-content">
              <p>Amount: NRS {(Math.round(approveTxn.amount)/100).toFixed(2)}</p>
              <label>Approval Note (optional)</label>
              <textarea className="form-input" rows="3" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Remarks for approval" />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={()=> setApproveTxn(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={async ()=>{ 
                  try { 
                    await api.post(`/wallet/admin/topups/${approveTxn._id}/approve`, { adminNote: note }); 
                    setApproveTxn(null); 
                    setNote(''); 
                    fetchTxns(); 
                    // Refresh wallet balance for the affected user
                    if (window.refreshUserWallet) {
                      window.refreshUserWallet();
                    }
                  } catch(e){ alert('Approve failed: ' + (e.response?.data?.message||'Error')); } 
                }}>Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustTxn && (
        <div className="modal-overlay" onClick={()=> setAdjustTxn(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Edit Approved Amount</h2>
              <button className="close-btn" onClick={()=> setAdjustTxn(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>New amount (NPR)</label>
                  <input type="number" min="0" className="form-input" id="adj-amount" defaultValue={(Math.round(adjustTxn.amount)/100).toString()} />
                </div>
              </div>
              <label>Admin Note (optional)</label>
              <textarea className="form-input" rows="3" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Why changing?" />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={()=> setAdjustTxn(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={async ()=>{
                  const v = /** @type {HTMLInputElement} */(document.getElementById('adj-amount')).value;
                  if (v === '' || v === null) return;
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  try { 
                    await api.post(`/wallet/admin/topups/${adjustTxn._id}/adjust`, { newAmountPaisa: Math.round(n*100), adminNote: note }); 
                    setAdjustTxn(null); 
                    setNote(''); 
                    fetchTxns(); 
                    // Refresh wallet balance for the affected user
                    if (window.refreshUserWallet) {
                      window.refreshUserWallet();
                    }
                  } catch(e){ alert('Adjust failed: ' + (e.response?.data?.message||'Error')); }
                }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTxn && (
        <div className="modal-overlay" onClick={()=> setRejectTxn(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Reject Top‑up</h2>
              <button className="close-btn" onClick={()=> setRejectTxn(null)}>×</button>
            </div>
            <div className="modal-content">
              <label>Rejection Reason</label>
              <textarea className="form-input" rows="3" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Reason for rejection" />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={()=> setRejectTxn(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={async ()=>{ if (!note.trim()) return; try { await api.post(`/wallet/admin/topups/${rejectTxn._id}/reject`, { adminNote: note }); setRejectTxn(null); setNote(''); fetchTxns(); } catch(e){ alert('Reject failed: ' + (e.response?.data?.message||'Error')); } }}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revert Modal */}
      {revertTxn && (
        <div className="modal-overlay" onClick={()=> setRevertTxn(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Delete Approved Amount</h2>
              <button className="close-btn" onClick={()=> setRevertTxn(null)}>×</button>
            </div>
            <div className="modal-content">
              <p><strong>Warning:</strong> This will permanently delete this approved amount from the user's wallet.</p>
              <p>Amount to be deleted: <strong>NRS {(Math.round(revertTxn.amount)/100).toFixed(2)}</strong></p>
              <p>This action cannot be undone. The user's wallet balance will be reduced by this amount.</p>
              <label>Admin Note (optional)</label>
              <textarea className="form-input" rows="3" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Reason for deletion" />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={()=> setRevertTxn(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={async ()=>{
                  try { 
                    await api.post(`/wallet/admin/topups/${revertTxn._id}/revert`, { adminNote: note }); 
                    setRevertTxn(null); 
                    setNote(''); 
                    fetchTxns(); 
                    // Refresh wallet balance for the affected user
                    if (window.refreshUserWallet) {
                      window.refreshUserWallet();
                    }
                  }
                  catch(e){ alert('Revert failed: ' + (e.response?.data?.message||'Error')); }
                }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};