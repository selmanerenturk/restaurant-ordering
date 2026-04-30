import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BsArrowLeft, BsTrash, BsCheckCircle, BsBellSlash, BsBell, BsExclamationTriangleFill, BsClock } from 'react-icons/bs';
import { selectCartItems, selectCartTotal, removeFromCart, clearCart } from '../redux/cartSlice';
import { submitOrder, resetOrder } from '../redux/orderSlice';
import { selectRestaurantOpen, selectRestaurantReason, selectRestaurantNextOpen } from '../redux/restaurantSlice';

function OrderDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const { loading, error, success, currentOrder } = useSelector((state) => state.order);
  const isOpen = useSelector(selectRestaurantOpen);
  const closedReason = useSelector(selectRestaurantReason);
  const nextOpen = useSelector(selectRestaurantNextOpen);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
    delivery_type: 'delivery',
    payment_type: 'cash',
    order_note: '',
    do_not_ring_bell: false,
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'İsim ve soyisim alanları boş bırakılamaz';
    if (!formData.phone.trim()) errors.phone = 'Telefon numarası boş bırakılamaz';
    if (!formData.email.trim()) errors.email = 'Email boş bırakılamaz';
    if (formData.delivery_type === 'delivery') {
      if (!formData.address_line1.trim()) errors.address_line1 = '1. adres satırı boş bırakılamaz';
      if (!formData.city.trim()) errors.city = 'Şehir alanı boş bırakılamaz';
      if (!formData.district.trim()) errors.district = 'İlçe alanı boş bırakılamaz';
      if (!formData.postal_code.trim()) errors.postal_code = 'Posta kodu boş bırakılamaz';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cartItems.length === 0) return;

    const orderData = {
      customer: {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
      },
      delivery_address: {
        address_line1: formData.delivery_type === 'delivery' ? formData.address_line1 : 'Gel Al',
        address_line2: formData.address_line2 || null,
        city: formData.delivery_type === 'delivery' ? formData.city : null,
        district: formData.delivery_type === 'delivery' ? formData.district : null,
        postal_code: formData.delivery_type === 'delivery' ? formData.postal_code : null,
        country_code: 'TR',
      },
      delivery_type: formData.delivery_type,
      payment_type: formData.payment_type,
      order_note: formData.order_note || null,
      do_not_ring_bell: formData.do_not_ring_bell,
      items: cartItems.map((item) => ({
        product_price_id: item.product_price_id,
        quantity: item.quantity,
        selected_options: (item.selected_options || []).map((o) => ({
          option_item_id: o.option_item_id,
          is_removed: o.is_removed || false,
        })),
      })),
      turnstile_token: 'not-required',
    };

    dispatch(submitOrder(orderData));
  };

  const handleBackToHome = () => {
    dispatch(resetOrder());
    dispatch(clearCart());
    navigate('/');
  };

  if (success && currentOrder) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="card border-0 shadow p-5">
              <BsCheckCircle size={64} className="text-success mx-auto mb-3" />
              <h2 className="fw-bold mb-3">Siparişiniz onaylandı!</h2>
              <p className="fs-5 mb-2">
                Order ID: <strong>#{currentOrder.id}</strong>
              </p>
              <p className="fs-5 mb-4">
                Total: <strong>{parseFloat(currentOrder.total).toFixed(2)} {currentOrder.currency_code}</strong>
              </p>
              <p className="text-muted mb-4">Siparişiniz için teşekkür ederiz. En kısa zamanda hazırlamaya başlayacağız.</p>
              <button className="btn btn-gold btn-lg" onClick={handleBackToHome}>
                Alışverişe devam et
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !success) {
    return (
      <div className="container py-5 text-center">
        <h3 className="mb-3">Sepetiniz boş</h3>
        <p className="text-muted mb-4">Ürün ekleyiniz.</p>
        <button className="btn btn-gold" onClick={() => navigate('/')}>
          Ürün ara
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate(-1)}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <h2 className="fw-bold mb-4 section-title">Sipariş Detayları</h2>

      <div className="row">
        {/* Sipariş özeti */}
        <div className="col-lg-5 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark-brown text-white">
              <h5 className="mb-0 fw-bold">Sipariş özeti</h5>
            </div>
            <div className="card-body">
              {cartItems.map((item) => {
                const optionsExtra = (item.selected_options || []).reduce((sum, o) => sum + (o.extra_price || 0), 0);
                const lineTotal = (item.price + optionsExtra) * item.quantity;
                return (
                  <div key={item.cartKey} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                    <img
                      src={item.imageurl}
                      alt={item.product_name}
                      className="rounded me-3"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-semibold">{item.product_name}</h6>
                      <small className="text-muted">
                        {item.quantity_code} {item.unit_code} × {item.quantity}
                      </small>
                      {item.selected_options && item.selected_options.filter((o) => o.is_removed || o.extra_price > 0).length > 0 && (
                        <div className="mt-1">
                          {item.selected_options
                            .filter((o) => o.is_removed || o.extra_price > 0)
                            .map((opt, idx) => (
                              <span
                                key={idx}
                                className={`badge me-1 ${opt.is_removed ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}
                                style={{ fontSize: '0.65rem' }}
                              >
                                {opt.is_removed ? (
                                  <><s>{opt.item_name}</s> ✕</>
                                ) : (
                                  <>{opt.item_name}{opt.extra_price > 0 && ` +${opt.extra_price.toFixed(2)}₺`}</>
                                )}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                      <span className="fw-bold">{lineTotal.toFixed(2)} {item.currency_code}</span>
                      <button
                        className="btn btn-sm btn-link text-danger d-block ms-auto"
                        onClick={() => dispatch(removeFromCart(item.cartKey))}
                      >
                        <BsTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="d-flex justify-content-between pt-2">
                <span className="fs-5 fw-bold">Toplam:</span>
                <span className="fs-5 fw-bold">{cartTotal.toFixed(2)} TRY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Müşteri bilgi formu */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark-brown text-white">
              <h5 className="mb-0 fw-bold">Müşteri bilgileri</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmitOrder}>
                {/* Teslimat Türü */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Teslimat Türü *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-fill ${
                        formData.delivery_type === 'delivery' ? 'btn-gold' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, delivery_type: 'delivery' }))}
                    >
                      Adrese Teslimat
                    </button>
                    <button
                      type="button"
                      className={`btn flex-fill ${
                        formData.delivery_type === 'pickup' ? 'btn-gold' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, delivery_type: 'pickup', do_not_ring_bell: false }))}
                    >
                      Gel Al
                    </button>
                  </div>
                </div>

                {/* Ödeme Türü */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Ödeme Türü *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-fill ${
                        formData.payment_type === 'cash' ? 'btn-gold' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, payment_type: 'cash' }))}
                    >
                      Nakit
                    </button>
                    <button
                      type="button"
                      className={`btn flex-fill ${
                        formData.payment_type === 'card' ? 'btn-gold' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, payment_type: 'card' }))}
                    >
                      Kart (Kapıda)
                    </button>
                  </div>
                </div>

                <hr className="my-3" />

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">İsim ve Soyisim *</label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.full_name ? 'is-invalid' : ''}`}
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="İsim giriniz"
                    />
                    {formErrors.full_name && <div className="invalid-feedback">{formErrors.full_name}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Telefon Numarası *</label>
                    <input
                      type="tel"
                      className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+905551234567"
                    />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email *</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email adresi giriniz"
                  />
                  {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                </div>

                {formData.delivery_type === 'delivery' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">1. Adres satırı *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.address_line1 ? 'is-invalid' : ''}`}
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleChange}
                        placeholder="Mahalle, sokak no."
                      />
                      {formErrors.address_line1 && <div className="invalid-feedback">{formErrors.address_line1}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">2. Adres satırı</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address_line2"
                        value={formData.address_line2}
                        onChange={handleChange}
                        placeholder="Apartman, bina no."
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Şehir *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.city ? 'is-invalid' : ''}`}
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Ankara"
                        />
                        {formErrors.city && <div className="invalid-feedback">{formErrors.city}</div>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">İlçe *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder="Çankaya"
                        />
                        {formErrors.district && <div className="invalid-feedback">{formErrors.district}</div>}
                      </div>
                    </div>
                  </>
                )}

                {formData.delivery_type === 'pickup' && (
                  <div className="alert alert-info mb-3">
                    <strong>Gel Al</strong> seçeneğini tercih ettiniz. Siparişiniz hazır olduğunda restorandan teslim alabilirsiniz.
                  </div>
                )}

                {formData.delivery_type === 'delivery' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Posta Kodu *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.postal_code ? 'is-invalid' : ''}`}
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        placeholder="Posta kodu"
                      />
                      {formErrors.postal_code && <div className="invalid-feedback">{formErrors.postal_code}</div>}
                    </div>
                  </div>
                )}

                {/* Zile Basma */}
                {formData.delivery_type === 'delivery' && (
                  <div className="mb-3">
                    <div className="form-check form-switch d-flex align-items-center gap-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        className="form-check-input ms-0"
                        role="switch"
                        id="doNotRingBell"
                        checked={formData.do_not_ring_bell}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, do_not_ring_bell: !prev.do_not_ring_bell }))
                        }
                      />
                      <label className="form-check-label d-flex align-items-center gap-2" htmlFor="doNotRingBell">
                        {formData.do_not_ring_bell ? <BsBellSlash size={18} /> : <BsBell size={18} />}
                        <span className="fw-semibold">Zile Basma</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Sipariş Notu</label>
                  <textarea
                    className="form-control"
                    name="order_note"
                    value={formData.order_note}
                    onChange={handleChange}
                    placeholder="Eklemek istediğiniz notları buraya yazabilirsiniz..."
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {typeof error === 'string' ? error : 'Sipariş oluşturulurken bir hata oluştu.'}
                  </div>
                )}

                {!isOpen ? (
                  <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start gap-3 mt-3" role="alert">
                    <BsExclamationTriangleFill size={22} className="text-danger flex-shrink-0 mt-1" />
                    <div>
                      <h6 className="alert-heading fw-bold mb-1">Sipariş Alınamıyor</h6>
                      <p className="mb-1">{closedReason}</p>
                      {nextOpen && (
                        <p className="mb-0 d-flex align-items-center gap-1">
                          <BsClock /> <strong>Bir sonraki açılış:</strong> {nextOpen}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-gold btn-lg w-100 fw-bold mt-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sipariş veriliyor...
                      </>
                    ) : (
                      'Sipariş ver'
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
