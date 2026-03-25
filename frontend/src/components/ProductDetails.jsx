import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BsCartPlus, BsArrowLeft, BsDash, BsPlus, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { getProductWithPrices, clearSelectedProduct } from '../redux/productsSlice';
import { addToCart } from '../redux/cartSlice';

function ProductDetails() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct, loading, error } = useSelector((state) => state.products);

  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionErrors, setOptionErrors] = useState({});
  const [expandedExtras, setExpandedExtras] = useState({});

  useEffect(() => {
    dispatch(getProductWithPrices(productId));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (selectedProduct?.prices) {
      const defaultPrice = selectedProduct.prices.find((p) => p.is_default);
      if (defaultPrice) {
        setSelectedPriceId(defaultPrice.id);
      } else if (selectedProduct.prices.length > 0) {
        setSelectedPriceId(selectedProduct.prices[0].id);
      }
    }
    // Initialize selected options with defaults
    if (selectedProduct?.options) {
      const defaults = {};
      selectedProduct.options.forEach((opt) => {
        const defaultItems = opt.items.filter((i) => i.is_default).map((i) => i.id);
        if (defaultItems.length > 0) {
          defaults[opt.id] = opt.allow_multiple ? defaultItems : [defaultItems[0]];
        } else {
          defaults[opt.id] = [];
        }
      });
      setSelectedOptions(defaults);
    }
  }, [selectedProduct]);

  const handleCheckboxToggle = (optionId, itemId, maxSelections) => {
    setSelectedOptions((prev) => {
      const current = prev[optionId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [optionId]: current.filter((id) => id !== itemId) };
      }
      if (maxSelections && current.length >= maxSelections) return prev;
      return { ...prev, [optionId]: [...current, itemId] };
    });
    if (optionErrors[optionId]) {
      setOptionErrors((prev) => ({ ...prev, [optionId]: '' }));
    }
  };

  const handleRadioSelect = (optionId, itemId) => {
    setSelectedOptions((prev) => ({ ...prev, [optionId]: [itemId] }));
    if (optionErrors[optionId]) {
      setOptionErrors((prev) => ({ ...prev, [optionId]: '' }));
    }
  };

  const getOptionsExtraPrice = () => {
    if (!selectedProduct?.options) return 0;
    let extra = 0;
    selectedProduct.options.forEach((opt) => {
      const chosen = selectedOptions[opt.id] || [];
      if (!opt.allow_multiple) {
        opt.items.forEach((item) => {
          if (chosen.includes(item.id)) {
            extra += parseFloat(item.extra_price) || 0;
          }
        });
      }
    });
    return extra;
  };

  const validateOptions = () => {
    if (!selectedProduct?.options) return true;
    const errors = {};
    selectedProduct.options.forEach((opt) => {
      if (opt.is_required && (!selectedOptions[opt.id] || selectedOptions[opt.id].length === 0)) {
        errors[opt.id] = `"${opt.name}" se\u00e7imi zorunludur`;
      }
    });
    setOptionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddToCart = () => {
    const priceOption = selectedProduct.prices.find((p) => p.id === selectedPriceId);
    if (!priceOption) return;
    if (!validateOptions()) return;

    const cartOptions = [];
    if (selectedProduct.options) {
      selectedProduct.options.forEach((opt) => {
        const chosen = selectedOptions[opt.id] || [];
        if (opt.allow_multiple) {
          // Malzemeler: tüm varsayılan öğeleri gönder (kept + removed)
          opt.items.forEach((item) => {
            if (!item.is_available) return;
            if (!item.is_default) return;
            const kept = chosen.includes(item.id);
            cartOptions.push({
              option_item_id: item.id,
              option_name: opt.name,
              item_name: item.name,
              extra_price: 0,
              is_removed: !kept,
            });
          });
        } else {
          // Ekstra malzemeler: seçilen öğe = added
          opt.items.forEach((item) => {
            if (chosen.includes(item.id)) {
              cartOptions.push({
                option_item_id: item.id,
                option_name: opt.name,
                item_name: item.name,
                extra_price: parseFloat(item.extra_price) || 0,
                is_removed: false,
              });
            }
          });
        }
      });
    }

    dispatch(
      addToCart({
        product_price_id: priceOption.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity_code: priceOption.quantity_code,
        unit_code: priceOption.unit_code,
        price: parseFloat(priceOption.price),
        currency_code: priceOption.currency_code,
        quantity,
        imageurl: selectedProduct.imageurl,
        selected_options: cartOptions,
      })
    );
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
      </div>
    );
  }

  if (!selectedProduct) return null;

  const selectedPrice = selectedProduct.prices.find((p) => p.id === selectedPriceId);

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate(-1)}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="product-detail-img-wrapper">
            <img
              src={selectedProduct.imageurl}
              alt={selectedProduct.name}
              className="img-fluid rounded shadow product-detail-img"
            />
            {!selectedProduct.instock && (
              <div className="out-of-stock-badge-lg">Stokta yok</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h2 className="product-detail-name fw-bold mb-3">{selectedProduct.name}</h2>
          <p className="product-detail-desc mb-4">{selectedProduct.description}</p>

          <h5 className="fw-semibold mb-3">Fiyat Seçenekleri</h5>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {selectedProduct.prices.map((priceOption) => (
              <button
                key={priceOption.id}
                className={`btn price-option-btn ${
                  selectedPriceId === priceOption.id ? 'active' : ''
                }`}
                onClick={() => setSelectedPriceId(priceOption.id)}
              >
                <span className="fw-semibold">{priceOption.quantity_code} {priceOption.unit_code}</span>
                <br />
                <span className="price-value">{parseFloat(priceOption.price).toFixed(2)} {priceOption.currency_code}</span>
              </button>
            ))}
          </div>

          {/* Ürün Seçenekleri */}
          {selectedProduct.options && selectedProduct.options.length > 0 && (
            <div className="mb-4">
              {selectedProduct.options.map((opt) => {
                if (opt.allow_multiple) {
                  /* ── Malzemeler — Pill / Chip Butonları ── */
                  return (
                    <div key={opt.id} className="mb-3 p-3 border rounded" style={{ backgroundColor: '#fff8f0' }}>
                      <h6 className="fw-bold mb-1" style={{ color: '#e67e22' }}>
                        {opt.name}
                        {opt.is_required && <span className="text-danger ms-1">*</span>}
                      </h6>
                      <p className="text-muted small mb-3">Lütfen çıkarmak istediğiniz malzemeleri seçiniz</p>
                      <div className="d-flex flex-wrap gap-2">
                        {opt.items.map((item) => {
                          const isSelected = (selectedOptions[opt.id] || []).includes(item.id);
                          const disabled = !item.is_available;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              disabled={disabled}
                              className={`btn btn-sm rounded-pill px-3 py-1 ${
                                disabled
                                  ? 'btn-outline-secondary opacity-50'
                                  : isSelected
                                    ? 'btn-outline-dark border-2'
                                    : 'btn-outline-danger border-2 text-decoration-line-through'
                              }`}
                              style={{ fontSize: '0.85rem', fontWeight: 500 }}
                              onClick={() => handleCheckboxToggle(opt.id, item.id, opt.max_selections)}
                            >
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                      {optionErrors[opt.id] && (
                        <div className="text-danger small mt-2">{optionErrors[opt.id]}</div>
                      )}
                    </div>
                  );
                } else {
                  /* ── Ekstra Malzeme Seçimi — Accordion ── */
                  const isExpanded = expandedExtras[opt.id] ?? false;
                  return (
                    <div key={opt.id} className="mb-3 border rounded overflow-hidden">
                      <button
                        type="button"
                        className="btn w-100 d-flex justify-content-between align-items-center py-3 px-3"
                        style={{ backgroundColor: '#fff', borderBottom: isExpanded ? '1px solid #dee2e6' : 'none' }}
                        onClick={() => setExpandedExtras((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }))}
                      >
                        <span className="fw-semibold" style={{ color: '#e67e22' }}>
                          {opt.name}
                          {opt.is_required && <span className="text-danger ms-1">*</span>}
                        </span>
                        {isExpanded ? (
                          <BsChevronUp style={{ color: '#e67e22' }} />
                        ) : (
                          <BsChevronDown style={{ color: '#e67e22' }} />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="bg-white">
                          {opt.items.map((item, idx) => {
                            const isChecked = (selectedOptions[opt.id] || []).includes(item.id);
                            const disabled = !item.is_available;
                            return (
                              <div
                                key={item.id}
                                className={`d-flex align-items-center justify-content-between px-3 py-3 ${
                                  idx < opt.items.length - 1 ? 'border-bottom' : ''
                                } ${disabled ? 'opacity-50' : ''}`}
                                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                                onClick={() => !disabled && handleRadioSelect(opt.id, item.id)}
                              >
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rounded-circle border d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderWidth: '2px',
                                      borderColor: isChecked ? '#e67e22' : '#ccc',
                                    }}
                                  >
                                    {isChecked && (
                                      <div
                                        className="rounded-circle"
                                        style={{ width: '12px', height: '12px', backgroundColor: '#e67e22' }}
                                      />
                                    )}
                                  </div>
                                  <span className={`fw-medium ${disabled ? 'text-muted text-decoration-line-through' : ''}`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span className="fw-bold" style={{ color: '#e67e22' }}>
                                  {parseFloat(item.extra_price) > 0
                                    ? `+${parseFloat(item.extra_price).toFixed(0)} TL`
                                    : 'Ücretsiz'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {optionErrors[opt.id] && (
                        <div className="text-danger small px-3 py-2">{optionErrors[opt.id]}</div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          )}

          {selectedPrice && (
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Miktar</h5>
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <BsDash />
                </button>
                <span className="mx-3 fs-5 fw-bold">{quantity}</span>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <BsPlus />
                </button>
              </div>
              <p className="mt-2 fs-5">
                Toplam: <span className="fw-bold">{((parseFloat(selectedPrice.price) + getOptionsExtraPrice()) * quantity).toFixed(2)} {selectedPrice.currency_code}</span>
              </p>
            </div>
          )}

          <button
            className="btn btn-gold btn-lg w-100 fw-bold"
            onClick={handleAddToCart}
            disabled={!selectedProduct.instock || !selectedPrice}
          >
            <BsCartPlus className="me-2" />
            {selectedProduct.instock ? 'Sepete ekle' : 'Stokta yok'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
