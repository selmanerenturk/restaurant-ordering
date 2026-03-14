import { useState, useEffect } from 'react';
import { BsArrowLeft, BsPlusCircle } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { fetchProductPrices, createProductPrice } from '../services/productPriceService';
import { fetchProductsWithPrices } from '../services/productService';

function ManagePrices() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    is_default: false,
    quantity_code: '',
    unit_code: 'g',
    price: '',
    currency_code: 'TRY',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pricesData, productsData] = await Promise.all([
        fetchProductPrices(),
        fetchProductsWithPrices(),
      ]);
      setPrices(pricesData);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Veriler yüklenirken hata oluştu');
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
      await createProductPrice({
        product_id: parseInt(formData.product_id),
        is_default: formData.is_default,
        quantity_code: parseInt(formData.quantity_code),
        unit_code: formData.unit_code,
        price: parseFloat(formData.price),
        currency_code: formData.currency_code,
      });
      setFormData({
        product_id: '',
        is_default: false,
        quantity_code: '',
        unit_code: 'g',
        price: '',
        currency_code: 'TRY',
      });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Fiyat oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getProductName = (productId) => {
    const prod = products.find((p) => p.id === productId);
    return prod ? prod.name : productId;
  };

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate('/seller/dashboard')}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold section-title">Fiyat yönetimi</h2>
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          <BsPlusCircle className="me-1" /> Fiyat ekle
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-dark-brown text-white">
            <h5 className="mb-0">Yeni Fiyat Seçenekleri</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Ürün *</label>
                  <select
                    className="form-select"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                  >
                    <option value="">Ürün Seçiniz</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Miktar *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantity_code}
                    onChange={(e) => setFormData({ ...formData, quantity_code: e.target.value })}
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Birim *</label>
                  <select
                    className="form-select"
                    value={formData.unit_code}
                    onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
                  >
                    <option value="g">g (gram)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="pcs">pcs (fiyat)</option>
                    <option value="box">kutu</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-semibold">Fiyat *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-semibold">Para Birimi *</label>
                  <select
                    className="form-select"
                    value={formData.currency_code}
                    onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isDefaultCheck"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="isDefaultCheck">
                      Varsayılan Fiyat
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  İptal et
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
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Birim</th>
                  <th>Fiyat</th>
                  <th>Para birimi</th>
                  <th>Varsayılan ürün</th>
                </tr>
              </thead>
              <tbody>
                {prices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Fiyat bulunamadı</td>
                  </tr>
                ) : (
                  prices.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td className="fw-semibold">{getProductName(p.product_id)}</td>
                      <td>{p.quantity_code}</td>
                      <td>{p.unit_code}</td>
                      <td>{parseFloat(p.price).toFixed(2)}</td>
                      <td>{p.currency_code}</td>
                      <td>
                        <span className={`badge ${p.is_default ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {p.is_default ? 'Evet' : 'Hayır'}
                        </span>
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

export default ManagePrices;
