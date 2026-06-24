import { useState, useEffect } from 'react';
import { BsArrowLeft, BsPlusCircle, BsPencil, BsTrash, BsCheck2, BsX } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import {
  fetchProductPrices,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
} from '../services/productPriceService';
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
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceData, setEditPriceData] = useState({});

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

  const handleStartEdit = (p) => {
    setEditingPriceId(p.id);
    setEditPriceData({
      quantity_code: p.quantity_code,
      unit_code: p.unit_code,
      price: p.price,
      currency_code: p.currency_code,
      is_default: p.is_default,
    });
  };

  const handleSaveEdit = async (priceId) => {
    try {
      await updateProductPrice(priceId, {
        quantity_code: parseInt(editPriceData.quantity_code),
        unit_code: editPriceData.unit_code,
        price: parseFloat(editPriceData.price),
        currency_code: editPriceData.currency_code,
        is_default: editPriceData.is_default,
      });
      setEditingPriceId(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Fiyat güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (priceId) => {
    if (!window.confirm('Bu fiyatı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProductPrice(priceId);
      setPrices((prev) => prev.filter((p) => p.id !== priceId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Fiyat silinirken hata oluştu');
    }
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
                    <option value="pcs">adet</option>
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
                  <th style={{ width: '120px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {prices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">Fiyat bulunamadı</td>
                  </tr>
                ) : (
                  prices.map((p) => {
                    const isEditing = editingPriceId === p.id;
                    return (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td className="fw-semibold">{getProductName(p.product_id)}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: '90px' }}
                            value={editPriceData.quantity_code}
                            onChange={(e) => setEditPriceData({ ...editPriceData, quantity_code: e.target.value })}
                          />
                        ) : p.quantity_code}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm"
                            style={{ width: '90px' }}
                            value={editPriceData.unit_code}
                            onChange={(e) => setEditPriceData({ ...editPriceData, unit_code: e.target.value })}
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="pcs">adet</option>
                            <option value="box">kutu</option>
                          </select>
                        ) : p.unit_code}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm"
                            style={{ width: '100px' }}
                            value={editPriceData.price}
                            onChange={(e) => setEditPriceData({ ...editPriceData, price: e.target.value })}
                          />
                        ) : parseFloat(p.price).toFixed(2)}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="form-select form-select-sm"
                            style={{ width: '90px' }}
                            value={editPriceData.currency_code}
                            onChange={(e) => setEditPriceData({ ...editPriceData, currency_code: e.target.value })}
                          >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        ) : p.currency_code}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="form-check form-switch mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              role="switch"
                              checked={editPriceData.is_default}
                              onChange={(e) => setEditPriceData({ ...editPriceData, is_default: e.target.checked })}
                            />
                          </div>
                        ) : (
                          <span className={`badge ${p.is_default ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {p.is_default ? 'Evet' : 'Hayır'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => handleSaveEdit(p.id)} title="Kaydet"><BsCheck2 /></button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingPriceId(null)} title="İptal"><BsX /></button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleStartEdit(p)} title="Düzenle"><BsPencil /></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)} title="Sil"><BsTrash /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
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
