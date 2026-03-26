import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsArrowLeft,
  BsPlus,
  BsTrash,
  BsPencil,
  BsCheck2,
  BsX,
  BsChevronDown,
  BsChevronUp,
} from 'react-icons/bs';
import { fetchProductsWithPrices } from '../services/productService';
import {
  getProductOptions,
  createOption,
  updateOption,
  deleteOption,
  createOptionItem,
  updateOptionItem,
  deleteOptionItem,
} from '../services/productOptionService';

function ManageProductOptions() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState(null);

  // New option form
  const [showNewOption, setShowNewOption] = useState(false);
  const [newOption, setNewOption] = useState({ name: '', is_required: false, allow_multiple: false, max_selections: '' });

  // Expanded option (to show items)
  const [expandedOptionId, setExpandedOptionId] = useState(null);

  // New item form
  const [newItemOptionId, setNewItemOptionId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', extra_price: '0', is_default: false });

  // Edit states
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editOptionData, setEditOptionData] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemData, setEditItemData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchProductsWithPrices();
        setProducts(data);
      } catch (err) {
        setError('Ürünler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadOptions = useCallback(async (productId) => {
    try {
      setOptionsLoading(true);
      setError(null);
      const data = await getProductOptions(productId);
      setOptions(data);
    } catch (err) {
      setError('Seçenekler yüklenirken hata oluştu');
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadOptions(selectedProductId);
    } else {
      setOptions([]);
    }
  }, [selectedProductId, loadOptions]);

  const handleCreateOption = async (e) => {
    e.preventDefault();
    if (!newOption.name.trim() || !selectedProductId) return;
    try {
      setError(null);
      await createOption({
        product_id: selectedProductId,
        name: newOption.name,
        is_required: newOption.is_required,
        allow_multiple: newOption.allow_multiple,
        max_selections: newOption.max_selections ? parseInt(newOption.max_selections) : null,
        sort_order: options.length,
      });
      setNewOption({ name: '', is_required: false, allow_multiple: false, max_selections: '' });
      setShowNewOption(false);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Seçenek oluşturulurken hata oluştu');
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!window.confirm('Bu seçenek grubunu ve tüm öğelerini silmek istediğinize emin misiniz?')) return;
    try {
      await deleteOption(optionId);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError('Seçenek silinirken hata oluştu');
    }
  };

  const handleSaveOptionEdit = async (optionId) => {
    try {
      await updateOption(optionId, editOptionData);
      setEditingOptionId(null);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError('Seçenek güncellenirken hata oluştu');
    }
  };

  const handleCreateItem = async (e, optionId) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    try {
      setError(null);
      await createOptionItem(optionId, {
        name: newItem.name,
        extra_price: parseFloat(newItem.extra_price) || 0,
        is_default: newItem.is_default,
        sort_order: 0,
      });
      setNewItem({ name: '', extra_price: '0', is_default: false });
      setNewItemOptionId(null);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Öğe oluşturulurken hata oluştu');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteOptionItem(itemId);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError('Öğe silinirken hata oluştu');
    }
  };

  const handleSaveItemEdit = async (itemId) => {
    try {
      const payload = { ...editItemData };
      if (payload.extra_price !== undefined) {
        payload.extra_price = parseFloat(payload.extra_price) || 0;
      }
      await updateOptionItem(itemId, payload);
      setEditingItemId(null);
      await loadOptions(selectedProductId);
    } catch (err) {
      setError('Öğe güncellenirken hata oluştu');
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="container py-4">
      <button
        className="btn btn-link text-decoration-none mb-3 back-link"
        onClick={() => navigate('/seller/dashboard')}
      >
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <h2 className="fw-bold mb-4 section-title">Ürün Seçenekleri Yönetimi</h2>

      {error && (
        <div className="alert alert-danger d-flex align-items-center">
          {error}
          <button className="btn-close ms-auto" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Product Selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <label className="form-label fw-semibold">Ürün Seçin</label>
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-gold" role="status"></div>
            </div>
          ) : (
            <select
              className="form-select"
              value={selectedProductId || ''}
              onChange={(e) => {
                setSelectedProductId(e.target.value ? parseInt(e.target.value) : null);
                setExpandedOptionId(null);
                setShowNewOption(false);
              }}
            >
              <option value="">-- Ürün seçiniz --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Options Management */}
      {selectedProductId && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              {selectedProduct?.name} - Seçenekler
            </h5>
            <button
              className="btn btn-gold btn-sm"
              onClick={() => setShowNewOption(!showNewOption)}
            >
              <BsPlus className="me-1" /> Yeni Seçenek Grubu
            </button>
          </div>

          {/* New Option Form */}
          {showNewOption && (
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Yeni Seçenek Grubu</h6>
                <form onSubmit={handleCreateOption}>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label">Grup Adı *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newOption.name}
                        onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                        placeholder="ör: Sos Seçimi"
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Maks. Seçim</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newOption.max_selections}
                        onChange={(e) => setNewOption({ ...newOption, max_selections: e.target.value })}
                        placeholder="Sınırsız"
                        min="1"
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-center gap-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isRequired"
                          checked={newOption.is_required}
                          onChange={(e) => setNewOption({ ...newOption, is_required: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="isRequired">Zorunlu</label>
                      </div>
                    </div>
                    <div className="col-md-2 d-flex align-items-center">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="allowMultiple"
                          checked={newOption.allow_multiple}
                          onChange={(e) => setNewOption({ ...newOption, allow_multiple: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="allowMultiple">Çoklu Seçim</label>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn btn-gold w-100">Ekle</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Options List */}
          {optionsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-gold" role="status"></div>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Bu ürün için henüz seçenek tanımlanmamış.
            </div>
          ) : (
            options.map((opt) => (
              <div key={opt.id} className="card border-0 shadow-sm mb-3">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                  {editingOptionId === opt.id ? (
                    <div className="d-flex gap-2 flex-grow-1 me-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editOptionData.name ?? opt.name}
                        onChange={(e) => setEditOptionData({ ...editOptionData, name: e.target.value })}
                      />
                      <button className="btn btn-sm btn-success" onClick={() => handleSaveOptionEdit(opt.id)}>
                        <BsCheck2 />
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingOptionId(null)}>
                        <BsX />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center gap-2 flex-grow-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedOptionId(expandedOptionId === opt.id ? null : opt.id)}
                    >
                      {expandedOptionId === opt.id ? <BsChevronUp /> : <BsChevronDown />}
                      <h6 className="mb-0 fw-bold">{opt.name}</h6>
                      <div className="d-flex gap-1 ms-2">
                        {opt.is_required && <span className="badge bg-danger">Zorunlu</span>}
                        {opt.allow_multiple && <span className="badge bg-info">Çoklu</span>}
                        {opt.max_selections && (
                          <span className="badge bg-secondary">Maks: {opt.max_selections}</span>
                        )}
                        <span className="badge bg-light text-dark">{opt.items.length} öğe</span>
                      </div>
                    </div>
                  )}
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setEditingOptionId(opt.id);
                        setEditOptionData({ name: opt.name, is_required: opt.is_required, allow_multiple: opt.allow_multiple });
                      }}
                    >
                      <BsPencil />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteOption(opt.id)}>
                      <BsTrash />
                    </button>
                  </div>
                </div>

                {expandedOptionId === opt.id && (
                  <div className="card-body">
                    {/* Items list */}
                    {opt.items.length === 0 ? (
                      <p className="text-muted mb-3">Henüz öğe eklenmemiş.</p>
                    ) : (
                      <div className="table-responsive mb-3">
                        <table className="table table-sm table-hover mb-0 align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Öğe Adı</th>
                              <th>Ek Fiyat</th>
                              <th>Varsayılan</th>
                              <th>Durum</th>
                              <th style={{ width: '100px' }}>İşlem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {opt.items.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  {editingItemId === item.id ? (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={editItemData.name ?? item.name}
                                      onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                                    />
                                  ) : (
                                    <span className="fw-semibold">{item.name}</span>
                                  )}
                                </td>
                                <td>
                                  {editingItemId === item.id ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      className="form-control form-control-sm"
                                      style={{ width: '100px' }}
                                      value={editItemData.extra_price ?? item.extra_price}
                                      onChange={(e) => setEditItemData({ ...editItemData, extra_price: e.target.value })}
                                    />
                                  ) : (
                                    <span>
                                      {parseFloat(item.extra_price) > 0
                                        ? `+${parseFloat(item.extra_price).toFixed(2)} ₺`
                                        : 'Ücretsiz'}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {editingItemId === item.id ? (
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={editItemData.is_default ?? item.is_default}
                                      onChange={(e) => setEditItemData({ ...editItemData, is_default: e.target.checked })}
                                    />
                                  ) : (
                                    item.is_default && <span className="badge bg-success">Varsayılan</span>
                                  )}
                                </td>
                                <td>
                                  <div className="form-check form-switch mb-0">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      role="switch"
                                      checked={item.is_available}
                                      onChange={async () => {
                                        try {
                                          await updateOptionItem(item.id, { is_available: !item.is_available });
                                          await loadOptions(selectedProductId);
                                        } catch (err) {
                                          setError('Durum güncellenirken hata oluştu');
                                        }
                                      }}
                                    />
                                    <label className={`form-check-label small ${item.is_available ? 'text-success' : 'text-muted'}`}>
                                      {item.is_available ? 'Aktif' : 'Pasif'}
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  {editingItemId === item.id ? (
                                    <div className="d-flex gap-1">
                                      <button className="btn btn-sm btn-success" onClick={() => handleSaveItemEdit(item.id)}>
                                        <BsCheck2 />
                                      </button>
                                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingItemId(null)}>
                                        <BsX />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="d-flex gap-1">
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                          setEditingItemId(item.id);
                                          setEditItemData({
                                            name: item.name,
                                            extra_price: item.extra_price,
                                            is_default: item.is_default,
                                            is_available: item.is_available,
                                          });
                                        }}
                                      >
                                        <BsPencil />
                                      </button>
                                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem(item.id)}>
                                        <BsTrash />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add new item */}
                    {newItemOptionId === opt.id ? (
                      <form onSubmit={(e) => handleCreateItem(e, opt.id)} className="d-flex gap-2 align-items-end">
                        <div>
                          <label className="form-label small">Öğe Adı *</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="ör: Çikolata Sosu"
                            required
                          />
                        </div>
                        <div>
                          <label className="form-label small">Ek Fiyat (₺)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-sm"
                            style={{ width: '100px' }}
                            value={newItem.extra_price}
                            onChange={(e) => setNewItem({ ...newItem, extra_price: e.target.value })}
                          />
                        </div>
                        <div className="form-check align-self-center mt-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`default-${opt.id}`}
                            checked={newItem.is_default}
                            onChange={(e) => setNewItem({ ...newItem, is_default: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor={`default-${opt.id}`}>Varsayılan</label>
                        </div>
                        <button type="submit" className="btn btn-sm btn-gold">Ekle</button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setNewItemOptionId(null);
                            setNewItem({ name: '', extra_price: '0', is_default: false });
                          }}
                        >
                          İptal
                        </button>
                      </form>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setNewItemOptionId(opt.id);
                          setNewItem({ name: '', extra_price: '0', is_default: false });
                        }}
                      >
                        <BsPlus className="me-1" /> Öğe Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default ManageProductOptions;
