import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const BannerForm = ({ banner, onClose, onSave }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    isActive: true,
    productId: "",
    buttonLabel: "",
    // buttonUrl: "",  // REMOVED
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        image: banner.image || "",
        active: banner.active !== undefined ? banner.active : true,
        productId: banner.productId || "",
        buttonLabel: banner.buttonLabel || "",
      });
      setImagePreview(banner.image || "");
    }
  }, [banner]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get('/products');
        setProducts(res.data.data || []);
      } catch {
        setProducts([]);
      }
    }
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "image") {
      setSelectedFile(null);
      setImagePreview(value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        return;
      }
      setError("");
      setSelectedFile(file);
      setForm((f) => ({ ...f, image: "" }));
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let finalBanner = { ...form };
    // Upload image if selected
    if (selectedFile) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_URL, { method: "POST", body: uploadData });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Failed to upload image.");
        finalBanner.image = data.secure_url;
      } catch (err) {
        setError("Image upload failed");
        return;
      }
    } else if (!form.image) {
      setError("Please upload an image or provide an image URL.");
      return;
    }
    // Remove buttonUrl before save (for backend)
    // delete finalBanner.buttonUrl;
    onSave(finalBanner);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{banner ? "Edit Banner" : "Add Banner"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Subtitle</label>
            <input name="subtitle" value={form.subtitle} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Select Product</label>
            <select name="productId" value={form.productId} onChange={handleChange} required>
              <option value="">-- Select a Product --</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Banner Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file-input"
            />
            <p className="file-help">Upload image file (max 5MB) or paste image URL below</p>
            {imagePreview && (
              <div className="image-preview" style={{ marginBottom: 12 }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, borderRadius: 8 }} />
              </div>
            )}
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div className="form-group">
            <label>Button Label</label>
            <input
              name="buttonLabel"
              value={form.buttonLabel}
              onChange={handleChange}
              placeholder="Buy Now"
            />
          </div>

          {/* Button URL removed */}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.active}
                onChange={handleChange}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {banner ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
