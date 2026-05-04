import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BsCheckCircle, BsClock, BsXCircle, BsTruck, BsFire, BsArrowLeft } from 'react-icons/bs';
import api from '../config/api';

const STATUS_STEPS = [
  { key: 'new',        label: 'Alındı',       icon: <BsCheckCircle /> },
  { key: 'confirmed',  label: 'Onaylandı',    icon: <BsCheckCircle /> },
  { key: 'preparing',  label: 'Hazırlanıyor', icon: <BsFire /> },
  { key: 'ready',      label: 'Yolda',        icon: <BsTruck /> },
  { key: 'delivered',  label: 'Teslim Edildi',icon: <BsCheckCircle /> },
];

const TERMINAL_STATUSES = ['cancelled', 'returned'];

function StatusBadge({ status }) {
  const map = {
    new:       { color: 'primary',   label: 'Alındı' },
    confirmed: { color: 'info',      label: 'Onaylandı' },
    preparing: { color: 'warning',   label: 'Hazırlanıyor' },
    ready:     { color: 'warning',   label: 'Hazır / Yolda' },
    delivered: { color: 'success',   label: 'Teslim Edildi' },
    cancelled: { color: 'danger',    label: 'İptal Edildi' },
    returned:  { color: 'secondary', label: 'İade Edildi' },
  };
  const { color, label } = map[status] || { color: 'secondary', label: status };
  return <span className={`badge bg-${color} fs-6 px-3 py-2`}>{label}</span>;
}

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const [order, setOrder]   = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/track/${orderId}`);
      setOrder(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.detail || 'Sipariş bulunamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentStepIndex = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  const isTerminal = order && TERMINAL_STATUSES.includes(order.status);

  return (
    <div className="container py-5">
      <Link to="/" className="btn btn-link text-decoration-none mb-4 ps-0">
        <BsArrowLeft className="me-1" /> Anasayfaya dön
      </Link>

      <h2 className="fw-bold mb-4">Sipariş Takibi</h2>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-3 text-muted">Sipariş bilgileri yükleniyor…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <BsXCircle size={20} />
          {error}
        </div>
      )}

      {order && (
        <>
          {/* Header card */}
          <div className="card border-0 shadow-sm mb-4 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h5 className="fw-bold mb-1">Sipariş #{order.id}</h5>
                <p className="text-muted mb-0 small">
                  {new Date(order.created_at).toLocaleString('tr-TR')}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Progress stepper (only for non-terminal statuses) */}
          {!isTerminal && (
            <div className="card border-0 shadow-sm mb-4 p-4">
              <h6 className="fw-semibold mb-4">Sipariş Durumu</h6>
              <div className="d-flex justify-content-between align-items-start position-relative">
                {/* connector line */}
                <div
                  className="position-absolute top-0 start-0 end-0"
                  style={{ height: '3px', background: '#e9ecef', top: '18px', zIndex: 0 }}
                />
                <div
                  className="position-absolute top-0 start-0"
                  style={{
                    height: '3px',
                    background: '#198754',
                    top: '18px',
                    zIndex: 1,
                    width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
                {STATUS_STEPS.map((step, idx) => {
                  const done    = idx <= currentStepIndex;
                  const current = idx === currentStepIndex;
                  return (
                    <div key={step.key} className="d-flex flex-column align-items-center" style={{ zIndex: 2, flex: 1 }}>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{
                          width: 36, height: 36,
                          background: done ? '#198754' : '#e9ecef',
                          color: done ? '#fff' : '#6c757d',
                          border: current ? '3px solid #198754' : 'none',
                          fontWeight: 'bold',
                          fontSize: 16,
                        }}
                      >
                        {step.icon}
                      </div>
                      <span className={`small text-center ${done ? 'fw-semibold text-success' : 'text-muted'}`} style={{ fontSize: 11 }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled / returned banner */}
          {isTerminal && (
            <div className="alert alert-danger mb-4 d-flex align-items-center gap-2">
              <BsXCircle size={22} />
              {order.status === 'cancelled' ? 'Siparişiniz iptal edilmiştir.' : 'Siparişiniz iade edilmiştir.'}
            </div>
          )}

          {/* Order details */}
          <div className="row g-4">
            <div className="col-md-7">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h6 className="fw-semibold mb-3">Ürünler</h6>
                {order.items.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.quantity} × {item.product_name_snapshot}
                      <span className="text-muted small ms-1">
                        ({item.quantity_code_snapshot} {item.unit_code_snapshot})
                      </span>
                    </span>
                    <span className="fw-semibold">{parseFloat(item.line_total).toFixed(2)} ₺</span>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <span>Toplam</span>
                  <span>{parseFloat(order.total).toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h6 className="fw-semibold mb-3">Teslimat Bilgileri</h6>
                <p className="mb-1"><strong>{order.full_name}</strong></p>
                <p className="mb-1 text-muted">{order.phone}</p>
                {order.delivery_type === 'delivery' ? (
                  <>
                    <p className="mb-1">{order.address_line1}</p>
                    {order.address_line2 && <p className="mb-1">{order.address_line2}</p>}
                    <p className="mb-1">{[order.district, order.city].filter(Boolean).join(', ')}</p>
                  </>
                ) : (
                  <p className="mb-1 text-info">Gel-al siparişi</p>
                )}
                <hr />
                <p className="mb-1 small text-muted">
                  Ödeme: <strong>{order.payment_type === 'cash' ? 'Nakit' : 'Kart'}</strong>
                </p>
                {order.order_note && (
                  <p className="mb-0 small text-muted">Not: {order.order_note}</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-muted small mt-4 text-center">
            <BsClock className="me-1" />
            Bu sayfa her 30 saniyede bir otomatik güncellenir.
          </p>
        </>
      )}
    </div>
  );
}

