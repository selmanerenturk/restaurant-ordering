import { useState, useEffect } from 'react';
import {
  BsArrowLeft,
  BsPlusCircle,
  BsArrowUp,
  BsArrowDown,
  BsPencil,
  BsTrash,
  BsCheck2,
  BsX,
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';

function ManageCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createCategory({ ...formData, sort_order: categories.length });
      setFormData({ name: '', description: '', sort_order: 0 });
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Kategori oluşturulurken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      await loadCategories();
    } catch {
      setError('Durum güncellenirken hata oluştu');
    }
  };

  const handleMove = async (cat, direction) => {
    const idx = categories.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const other = categories[swapIdx];
    try {
      await updateCategory(cat.id, { sort_order: other.sort_order });
      await updateCategory(other.id, { sort_order: cat.sort_order });
      await loadCategories();
    } catch {
      setError('Sıralama güncellenirken hata oluştu');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditData({ name: cat.name, description: cat.description });
  };

  const handleSaveEdit = async () => {
    try {
      await updateCategory(editingId, editData);
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Güncelleme sırasında hata oluştu');
    }
  };

  const handleDelete = async (catId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteCategory(catId);
      await loadCategories();
    } catch {
      setError('Kategori silinirken hata oluştu');
    }
  };

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate('/seller/dashboard')}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold section-title">Kategori yönetimi</h2>
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          <BsPlusCircle className="me-1" /> Kategori Ekle
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-dark-brown text-white">
            <h5 className="mb-0">Yeni Kategori Ekle</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">İsim *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Açıklama *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
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
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '70px' }}>Sıra</th>
                  <th>İsim</th>
                  <th>Açıklama</th>
                  <th style={{ width: '90px' }}>Durum</th>
                  <th style={{ width: '160px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">Kategori bulunamadı</td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.id} className={!cat.is_active ? 'table-secondary' : ''}>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-secondary p-0 px-1"
                            disabled={idx === 0}
                            onClick={() => handleMove(cat, 'up')}
                            title="Yukarı"
                          >
                            <BsArrowUp />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary p-0 px-1"
                            disabled={idx === categories.length - 1}
                            onClick={() => handleMove(cat, 'down')}
                            title="Aşağı"
                          >
                            <BsArrowDown />
                          </button>
                        </div>
                      </td>
                      <td>
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        ) : (
                          <span className="fw-semibold">{cat.name}</span>
                        )}
                      </td>
                      <td>
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          />
                        ) : (
                          cat.description
                        )}
                      </td>
                      <td>
                        <div className="form-check form-switch mb-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            role="switch"
                            checked={cat.is_active}
                            onChange={() => handleToggleActive(cat)}
                          />
                        </div>
                      </td>
                      <td>
                        {editingId === cat.id ? (
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={handleSaveEdit}><BsCheck2 /></button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingId(null)}><BsX /></button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleStartEdit(cat)} title="Düzenle">
                              <BsPencil />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat.id)} title="Sil">
                              <BsTrash />
                            </button>
                          </div>
                        )}
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

export default ManageCategories;
