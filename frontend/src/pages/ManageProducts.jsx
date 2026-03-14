import { useState, useEffect } from 'react';
import { BsArrowLeft, BsPlusCircle } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { fetchProductsWithPrices } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import api from '../config/api';

function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instock: true,
    imageurl: '',
    category_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        fetchProductsWithPrices(),
        fetchCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/products/', {
        ...formData,
        category_id: parseInt(formData.category_id),
      });
      setFormData({ name: '', description: '', instock: true, imageurl: '', category_id: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ürün oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate('/seller/dashboard')}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold section-title">Ürün yönetimi</h2>
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          <BsPlusCircle className="me-1" /> Ürün ekle
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-dark-brown text-white">
            <h5 className="mb-0">Yeni Ürün</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Ürün adı *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Kategori *</label>
                  <select
                    className="form-select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Açıklama *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label fw-semibold">Görsel URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    value={formData.imageurl}
                    onChange={(e) => setFormData({ ...formData, imageurl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="instockCheck"
                      checked={formData.instock}
                      onChange={(e) => setFormData({ ...formData, instock: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="instockCheck">
                      Stok durumu
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Oluşturuluyor...' : 'Ürün oluştur'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Ürün görseli</th>
                  <th>Ürün adı</th>
                  <th>Kategorisi</th>
                  <th>Stok durumu</th>
                  <th>Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">Ürün bulunamadı</td>
                  </tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id}>
                      <td>{prod.id}</td>
                      <td>
                        <img src={prod.imageurl} alt={prod.name} className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                      </td>
                      <td className="fw-semibold">{prod.name}</td>
                      <td>{getCategoryName(prod.category_id)}</td>
                      <td>
                        <span className={`badge ${prod.instock ? 'bg-success' : 'bg-danger'}`}>
                          {prod.instock ? 'Evet' : 'Hayır'}
                        </span>
                      </td>
                      <td>
                        {prod.prices?.map((p) => (
                          <span key={p.id} className={`badge me-1 ${p.is_default ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {p.quantity_code} {p.unit_code} - {parseFloat(p.price).toFixed(2)} {p.currency_code}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProducts;
