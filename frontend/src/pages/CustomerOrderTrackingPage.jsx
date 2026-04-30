import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderByTrackingToken } from '../services/orderService';

const STATUS_FLOW = ['confirmed', 'preparing', 'ready', 'delivered'];

const STATUS_CONFIG = {
  new:       { label: 'Yeni',           icon: '🕐', badge: 'bg-primary' },
  confirmed: { label: 'Onaylandi',      icon: '✅', badge: 'bg-info'    },
  preparing: { label: 'Hazirlaniyor',   icon: '👨‍🍳', badge: 'bg-warning text-dark' },
  ready:     { label: 'Hazir',          icon: '📦', badge: 'bg-success' },
  delivered: { label: 'Teslim Edildi',  icon: '🚚', badge: 'bg-secondary' },
  cancelled: { label: 'Iptal',          icon: '❌', badge: 'bg-danger'  },
  returned:  { label: 'Iade',           icon: '↩️', badge: 'bg-dark'    },
};

function buildTrackingWsUrl(trackingToken) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/orders/${trackingToken}`;
}

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'returned';

  if (isCancelled) {
    return (
      <div className="alert alert-danger text-center fw-semibold">
        {STATUS_CONFIG[currentStatus]?.icon} Sipariniz {STATUS_CONFIG[currentStatus]?.label}
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-between mb-4 px-2 flex-wrap gap-2">
      {STATUS_FLOW.map((step, idx) => {
        const cfg = STATUS_CONFIG[step];
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="d-flex flex-column align-items-center flex-grow-1 position-relative" style={{ minWidth: 70 }}>
            {idx > 0 && (
              <div
                className="position-absolute top-50 translate-middle-y"
                style={{
                  left: '-50%',
                  right: '50%',
                  height: 3,
                  background: done ? '#198754' : '#dee2e6',
                  zIndex: 0,
                }}
              />
            )}
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold position-relative"
              style={{
                width: 44,
                height: 44,
                background: done ? (active ? '#198754' : '#d1e7dd') : '#f8f9fa',
                border: active ? '3px solid #198754' : '2px solid ' + (done ? '#198754' : '#dee2e6'),
                fontSize: 18,
                zIndex: 1,
              }}
            >
              {done ? (active ? cfg.icon : '✓') : idx + 1}
            </div>
            <small className={`mt-1 text-center ${active ? 'fw-bold text-success' : done ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.72rem' }}>
              {cfg.label}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function CustomerOrderTrackingPage() {
  const { trackingToken } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const statusCfg = useMemo(() => {
    if (!order) return null;
    return STATUS_CONFIG[order.status] || { label: order.status, icon: '📋', badge: 'bg-secondary' };
  }, [order]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getOrderByTrackingToken(trackingToken);
        if (!mounted) return;
        setOrder(data);
        setLastUpdatedAt(new Date());
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.detail || 'Takip bilgisi yuklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const poll = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(poll); };
  }, [trackingToken]);

  useEffect(() => {
    if (!trackingToken) return undefined;
    const ws = new WebSocket(buildTrackingWsUrl(trackingToken));
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 30000);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'order_update') {
          setOrder((prev) => prev ? { ...prev, status: payload.status } : prev);
          setLastUpdatedAt(new Date());
        }
      } catch { /* ignore */ }
    };
    return () => { clearInterval(ping); ws.close(); };
  }, [trackingToken]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success mb-3" role="status" />
        <p className="text-muted">Siparis bilgisi yukleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-5" style={{ maxWidth: 600 }}>
        <div className="alert alert-warning">Siparis bulunamadi.</div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0">Siparis Takibi</h2>
          <small className="text-muted">#{order.id} · {order.full_name}</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${statusCfg?.badge}`}>
            {statusCfg?.icon} {statusCfg?.label}
          </span>
          <span
            className="badge"
            style={{ background: wsConnected ? '#198754' : '#adb5bd', fontSize: '0.65rem' }}
            title={wsConnected ? 'Canli baglanti aktif' : 'Canli baglanti bekleniyor'}
          >
            {wsConnected ? '● Canli' : '○ Bekliyor'}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card border-0 shadow-sm mb-3 p-3">
        <StatusTimeline currentStatus={order.status} />
        {lastUpdatedAt && (
          <p className="text-center text-muted mb-0" style={{ fontSize: '0.78rem' }}>
            Son guncelleme: {lastUpdatedAt.toLocaleTimeString('tr-TR')}
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-light fw-semibold">Siparis Ozeti</div>
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-6">
              <small className="text-muted d-block">Musteri</small>
              <span className="fw-semibold">{order.full_name}</span>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Toplam</small>
              <span className="fw-semibold">{Number(order.total).toFixed(2)} {order.currency_code}</span>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Teslimat</small>
              <span>{order.delivery_type === 'pickup' ? 'Gel Al' : 'Adrese Teslimat'}</span>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Siparis Tarihi</small>
              <span>{new Date(order.created_at).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light fw-semibold">Siparis Kalemleri</div>
        <ul className="list-group list-group-flush">
          {order.items.map((item) => (
            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{item.product_name_snapshot}</div>
                <small className="text-muted">
                  {item.quantity} x {item.quantity_code_snapshot} {item.unit_code_snapshot}
                </small>
              </div>
              <div className="fw-bold">{Number(item.line_total).toFixed(2)} {item.currency_code_snapshot}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CustomerOrderTrackingPage;

