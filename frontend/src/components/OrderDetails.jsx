import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BsArrowLeft, BsTrash, BsCheckCircle } from 'react-icons/bs';
import { selectCartItems, selectCartTotal, removeFromCart, clearCart } from '../redux/cartSlice';
import { submitOrder, resetOrder } from '../redux/orderSlice';

function OrderDetails() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);
  const { loading, error, success, currentOrder } = useSelector((state) => state.order);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    postal_code: '',
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
    if (!formData.address_line1.trim()) errors.address_line1 = '1. adres satırı boş bırakılamaz';
    if (!formData.city.trim()) errors.city = 'Şehir alanı boş bırakılamaz';
    if (!formData.district.trim()) errors.district = 'İlçe alanı boş bırakılamaz';
    if (!formData.postal_code.trim()) errors.postal_code = 'Posta kodu boş bırakılamaz';
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
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        district: formData.district,
        postal_code: formData.postal_code,
        country_code: 'TR',
      },
      items: cartItems.map((item) => ({
        product_price_id: item.product_price_id,
        quantity: item.quantity,
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
              {cartItems.map((item) => (
                <div key={item.product_price_id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
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
                  </div>
                  <div className="text-end">
                    <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} {item.currency_code}</span>
                    <button
                      className="btn btn-sm btn-link text-danger d-block ms-auto"
                      onClick={() => dispatch(removeFromCart(item.product_price_id))}
                    >
                      <BsTrash />
                    </button>
                  </div>
                </div>
              ))}
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

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {typeof error === 'string' ? error : 'Sipariş oluşturulurken bir hata oluştu.'}
                  </div>
                )}

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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
