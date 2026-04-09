import React, { useState, useEffect, useCallback } from 'react';
import {
  BsArrowLeft,
  BsPlusCircle,
  BsChevronDown,
  BsChevronUp,
  BsTrash,
  BsPlus,
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { fetchProductsWithPrices, updateProduct } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import {
  getProductOptions,
  createOption,
  deleteOption,
  createOptionItem,
  updateOptionItem,
  deleteOptionItem,
} from '../services/productOptionService';
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
    is_featured: false,
    imageurl: '',
    category_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Ingredient management state
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', is_required: false, allow_multiple: false });

  const [addingItemToOptionId, setAddingItemToOptionId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', extra_price: '0', is_default: false });

  const loadOptions = useCallback(async (productId) => {
    try {
      setOptionsLoading(true);
      const data = await getProductOptions(productId);
      setProductOptions(data);
    } catch {
      setError('Malzemeler yüklenirken hata oluştu');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  const handleToggleIngredients = async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      setProductOptions([]);
      setShowNewGroup(false);
      setAddingItemToOptionId(null);
      return;
    }
    setExpandedProductId(productId);
    setShowNewGroup(false);
    setAddingItemToOptionId(null);
    await loadOptions(productId);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim() || !expandedProductId) return;
    try {
      await createOption({
        product_id: expandedProductId,
        name: newGroup.name,
        is_required: newGroup.is_required,
        allow_multiple: newGroup.allow_multiple,
        sort_order: productOptions.length,
      });
      setNewGroup({ name: '', is_required: false, allow_multiple: false });
      setShowNewGroup(false);
      await loadOptions(expandedProductId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Grup oluşturulurken hata oluştu');
    }
  };

  const handleDeleteGroup = async (optionId) => {
    if (!window.confirm('Bu grubu ve tüm malzemelerini silmek istediğinize emin misiniz?')) return;
    try {
      await deleteOption(optionId);
      await loadOptions(expandedProductId);
    } catch {
      setError('Grup silinirken hata oluştu');
    }
  };

  const handleAddItem = async (e, optionId) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    try {
      await createOptionItem(optionId, {
        name: newItem.name,
        extra_price: parseFloat(newItem.extra_price) || 0,
        is_default: newItem.is_default,
        sort_order: 0,
      });
      setNewItem({ name: '', extra_price: '0', is_default: false });
      setAddingItemToOptionId(null);
      await loadOptions(expandedProductId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Malzeme eklenirken hata oluştu');
    }
  };

  const handleToggleItemAvailability = async (itemId, currentValue) => {
    try {
      await updateOptionItem(itemId, { is_available: !currentValue });
      await loadOptions(expandedProductId);
    } catch {
      setError('Durum güncellenirken hata oluştu');
    }
  };

  const handleToggleFeatured = async (productId, currentValue) => {
    try {
      await updateProduct(productId, { is_featured: !currentValue });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_featured: !currentValue } : p))
      );
    } catch {
      setError('Öne çıkan durumu güncellenirken hata oluştu');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteOptionItem(itemId);
      await loadOptions(expandedProductId);
    } catch {
      setError('Malzeme silinirken hata oluştu');
    }
  };

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
      setFormData({ name: '', description: '', instock: true, is_featured: false, imageurl: '', category_id: '' });
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
                  <div className="d-flex flex-column gap-2">
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
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isFeaturedCheck"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isFeaturedCheck">
                        ⭐ Öne Çıkan
                      </label>
                    </div>
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
                  <th>Öne Çıkan</th>
                  <th>Fiyat</th>
                  <th style={{ width: '120px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">Ürün bulunamadı</td>
                  </tr>
                ) : (
                  products.map((prod) => (
                    <React.Fragment key={prod.id}>
                      <tr>
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
                        <td className="text-center">
                          <button
                            className={`featured-star-btn ${prod.is_featured ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleFeatured(prod.id, prod.is_featured)}
                            title={prod.is_featured ? 'Öne çıkandan kaldır' : 'Öne çıkan yap'}
                          >
                            {prod.is_featured ? '⭐' : '☆'}
                          </button>
                        </td>
                        <td>
                          {prod.prices?.map((p) => (
                            <span key={p.id} className={`badge me-1 ${p.is_default ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                              {p.quantity_code} {p.unit_code} - {parseFloat(p.price).toFixed(2)} {p.currency_code}
                            </span>
                          ))}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${expandedProductId === prod.id ? 'btn-gold' : 'btn-outline-secondary'}`}
                            onClick={() => handleToggleIngredients(prod.id)}
                          >
                            {expandedProductId === prod.id ? <BsChevronUp className="me-1" /> : <BsChevronDown className="me-1" />}
                            Malzemeler
                          </button>
                        </td>
                      </tr>

                      {/* Inline ingredient management */}
                      {expandedProductId === prod.id && (
                        <tr>
                          <td colSpan="8" className="bg-light p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="fw-bold mb-0">{prod.name} — Malzeme Grupları</h6>
                              <button
                                className="btn btn-sm btn-gold"
                                onClick={() => setShowNewGroup(!showNewGroup)}
                              >
                                <BsPlus className="me-1" /> Yeni Grup
                              </button>
                            </div>

                            {/* New group form */}
                            {showNewGroup && (
                              <div className="card border mb-3">
                                <div className="card-body py-2">
                                  <form onSubmit={handleCreateGroup} className="row g-2 align-items-end">
                                    <div className="col-md-4">
                                      <label className="form-label small mb-1">Grup Adı *</label>
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                        placeholder="ör: Malzemeler"
                                        required
                                      />
                                    </div>
                                    <div className="col-auto">
                                      <div className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id={`req-${prod.id}`}
                                          checked={newGroup.is_required}
                                          onChange={(e) => setNewGroup({ ...newGroup, is_required: e.target.checked })}
                                        />
                                        <label className="form-check-label small" htmlFor={`req-${prod.id}`}>Zorunlu</label>
                                      </div>
                                    </div>
                                    <div className="col-auto">
                                      <div className="form-check">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id={`multi-${prod.id}`}
                                          checked={newGroup.allow_multiple}
                                          onChange={(e) => setNewGroup({ ...newGroup, allow_multiple: e.target.checked })}
                                        />
                                        <label className="form-check-label small" htmlFor={`multi-${prod.id}`}>Çoklu Seçim</label>
                                      </div>
                                    </div>
                                    <div className="col-auto">
                                      <button type="submit" className="btn btn-sm btn-gold">Ekle</button>
                                    </div>
                                    <div className="col-auto">
                                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowNewGroup(false)}>İptal</button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            )}

                            {optionsLoading ? (
                              <div className="text-center py-3">
                                <div className="spinner-border spinner-border-sm text-gold" role="status"></div>
                              </div>
                            ) : productOptions.length === 0 ? (
                              <p className="text-muted mb-0">Henüz malzeme grubu eklenmemiş.</p>
                            ) : (
                              productOptions.map((opt) => (
                                <div key={opt.id} className="card border mb-2">
                                  <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-bold">{opt.name}</span>
                                      {opt.is_required && <span className="badge bg-danger">Zorunlu</span>}
                                      {opt.allow_multiple && <span className="badge bg-info">Çoklu</span>}
                                      <span className="badge bg-light text-dark border">{opt.items.length} malzeme</span>
                                    </div>
                                    <div className="d-flex gap-1">
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                          setAddingItemToOptionId(addingItemToOptionId === opt.id ? null : opt.id);
                                          setNewItem({ name: '', extra_price: '0', is_default: false });
                                        }}
                                      >
                                        <BsPlus /> Malzeme
                                      </button>
                                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGroup(opt.id)}>
                                        <BsTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="card-body py-2">
                                    {opt.items.length === 0 ? (
                                      <small className="text-muted">Henüz malzeme eklenmemiş.</small>
                                    ) : (
                                      <div className="d-flex flex-wrap gap-2">
                                        {opt.items.map((item) => (
                                          <div
                                            key={item.id}
                                            className={`d-flex align-items-center gap-1 px-2 py-1 rounded border ${!item.is_available ? 'bg-light text-muted' : ''}`}
                                          >
                                            <div className="form-check form-switch mb-0" style={{ minHeight: 'auto' }}>
                                              <input
                                                type="checkbox"
                                                className="form-check-input"
                                                role="switch"
                                                checked={item.is_available}
                                                onChange={() => handleToggleItemAvailability(item.id, item.is_available)}
                                              />
                                            </div>
                                            <span className={`small fw-semibold ${!item.is_available ? 'text-decoration-line-through' : ''}`}>
                                              {item.name}
                                            </span>
                                            {parseFloat(item.extra_price) > 0 && (
                                              <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                                +{parseFloat(item.extra_price).toFixed(2)}₺
                                              </span>
                                            )}
                                            {item.is_default && (
                                              <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>Varsayılan</span>
                                            )}
                                            <button
                                              className="btn btn-sm p-0 text-danger ms-1"
                                              style={{ fontSize: '0.75rem', lineHeight: 1 }}
                                              onClick={() => handleDeleteItem(item.id)}
                                              title="Sil"
                                            >
                                              <BsTrash />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Add new item form */}
                                    {addingItemToOptionId === opt.id && (
                                      <form onSubmit={(e) => handleAddItem(e, opt.id)} className="d-flex gap-2 align-items-end mt-2 pt-2 border-top">
                                        <div>
                                          <label className="form-label small mb-0">Malzeme Adı *</label>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            placeholder="ör: Domates"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="form-label small mb-0">Ek Fiyat (₺)</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-sm"
                                            style={{ width: '90px' }}
                                            value={newItem.extra_price}
                                            onChange={(e) => setNewItem({ ...newItem, extra_price: e.target.value })}
                                          />
                                        </div>
                                        <div className="form-check align-self-center mt-3">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`def-${opt.id}`}
                                            checked={newItem.is_default}
                                            onChange={(e) => setNewItem({ ...newItem, is_default: e.target.checked })}
                                          />
                                          <label className="form-check-label small" htmlFor={`def-${opt.id}`}>Varsayılan</label>
                                        </div>
                                        <button type="submit" className="btn btn-sm btn-gold">Ekle</button>
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAddingItemToOptionId(null)}>İptal</button>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
