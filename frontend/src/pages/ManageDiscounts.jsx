import { useState, useEffect } from 'react';
import { BsArrowLeft, BsPlusCircle, BsTrash, BsPercent } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../services/discountService';
import { fetchCategories } from '../services/categoryService';

function ManageDiscounts() {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    discount_type: 'global',
    category_id: '',
    percentage: '',
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [discountsData, categoriesData] = await Promise.all([
        getDiscounts(),
        fetchCategories(),
      ]);
      setDiscounts(discountsData);
      setCategories(categoriesData);
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
      const payload = {
        label: formData.label,
        discount_type: formData.discount_type,
        percentage: parseFloat(formData.percentage),
        is_active: formData.is_active,
      };
      if (formData.discount_type === 'category') {
        payload.category_id = parseInt(formData.category_id);
      }
      await createDiscount(payload);
      setFormData({ label: '', discount_type: 'global', category_id: '', percentage: '', is_active: true });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'İndirim oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (discount) => {
    try {
      await updateDiscount(discount.id, { is_active: !discount.is_active });
      setDiscounts((prev) =>
        prev.map((d) => (d.id === discount.id ? { ...d, is_active: !d.is_active } : d))
      );
    } catch {
      setError('Durum güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (discountId) => {
    if (!window.confirm('Bu indirimi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDiscount(discountId);
      setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    } catch {
      setError('İndirim silinirken hata oluştu');
    }
  };

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate('/seller/dashboard')}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold section-title">İndirim Yönetimi</h2>
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          <BsPlusCircle className="me-1" /> Yeni İndirim
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Info Boxes */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-1"><BsPercent className="me-1" /> Genel İndirim</h6>
              <p className="text-muted small mb-0">
                Tüm ürünlere uygulanır. Örn: %10 bayram indirimi. Eğer bir kategoriye özel indirim de varsa, o kategorideki ürünlere kategori indirimi uygulanır.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-1">📂 Kategori İndirimi</h6>
              <p className="text-muted small mb-0">
                Sadece seçilen kategorideki ürünlere uygulanır. Genel indirimi geçersiz kılar. Örn: Tatlılarda %15 indirim.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-dark-brown text-white">
            <h5 className="mb-0">Yeni İndirim</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">İndirim Adı *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="ör. Bayram İndirimi"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold">Yüzde (%) *</label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Tür *</label>
                  <select
                    className="form-select"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value, category_id: '' })}
                  >
                    <option value="global">Genel (Tüm Ürünler)</option>
                    <option value="category">Kategori Bazlı</option>
                  </select>
                </div>
                {formData.discount_type === 'category' && (
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Kategori *</label>
                    <select
                      className="form-select"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      required
                    >
                      <option value="">Seçiniz</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Kaydediliyor...' : 'İndirim Oluştur'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discounts Table */}
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
                  <th>Adı</th>
                  <th>Tür</th>
                  <th>Kategori</th>
                  <th>Yüzde</th>
                  <th>Durum</th>
                  <th style={{ width: '80px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Henüz indirim tanımlanmamış</td>
                  </tr>
                ) : (
                  discounts.map((disc) => (
                    <tr key={disc.id}>
                      <td>{disc.id}</td>
                      <td className="fw-semibold">{disc.label}</td>
                      <td>
                        <span className={`badge ${disc.discount_type === 'global' ? 'bg-primary' : 'bg-info text-dark'}`}>
                          {disc.discount_type === 'global' ? 'Genel' : 'Kategori'}
                        </span>
                      </td>
                      <td>{disc.category_name || '—'}</td>
                      <td>
                        <span className="badge bg-danger">%{parseFloat(disc.percentage)}</span>
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            role="switch"
                            checked={disc.is_active}
                            onChange={() => handleToggleActive(disc)}
                          />
                          <label className="form-check-label small">
                            {disc.is_active ? 'Aktif' : 'Pasif'}
                          </label>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(disc.id)}
                          title="Sil"
                        >
                          <BsTrash />
                        </button>
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

export default ManageDiscounts;

