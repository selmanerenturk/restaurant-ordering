import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsArrowLeft,
  BsEye,
  BsArrowRepeat,
  BsFunnel,
  BsXCircle,
  BsCheckCircleFill,
  BsClockHistory,
  BsFire,
  BsBagCheck,
  BsTruck,
  BsXLg,
  BsArrowReturnLeft,
  BsBellSlash,
  BsStickyFill,
} from 'react-icons/bs';
import { getOrders, updateOrderStatus } from '../services/orderService';

const STATUS_CONFIG = {
  new: { label: 'Yeni', badge: 'bg-primary', icon: BsClockHistory },
  confirmed: { label: 'Onaylandı', badge: 'bg-info', icon: BsCheckCircleFill },
  preparing: { label: 'Hazırlanıyor', badge: 'bg-warning text-dark', icon: BsFire },
  ready: { label: 'Hazır', badge: 'bg-success', icon: BsBagCheck },
  delivered: { label: 'Teslim Edildi', badge: 'bg-secondary', icon: BsTruck },
  cancelled: { label: 'İptal', badge: 'bg-danger', icon: BsXLg },
  returned: { label: 'İade', badge: 'bg-dark', icon: BsArrowReturnLeft },
};

const STATUS_FLOW = ['new', 'confirmed', 'preparing', 'ready', 'delivered'];

const DELIVERY_TYPE_LABELS = { delivery: 'Teslimat', pickup: 'Gel Al' };
const PAYMENT_TYPE_LABELS = { cash: 'Nakit', card: 'Kart' };

function ManageOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders(filterStatus || null);
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Siparişler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Durum güncellenirken hata oluştu');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[idx + 1];
    }
    return null;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || { label: status, badge: 'bg-secondary' };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.badge} d-inline-flex align-items-center gap-1`}>
        {Icon && <Icon size={12} />} {config.label}
      </span>
    );
  };

  return (
    <div className="container py-4">
      <button
        className="btn btn-link text-decoration-none mb-3 back-link"
        onClick={() => navigate('/seller/dashboard')}
      >
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold section-title mb-0">Sipariş Yönetimi</h2>
        <button className="btn btn-outline-secondary" onClick={loadOrders} disabled={loading}>
          <BsArrowRepeat className={`me-1 ${loading ? 'spin-animation' : ''}`} /> Yenile
        </button>
      </div>

      {/* Status Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <BsFunnel className="text-muted" />
            <button
              className={`btn btn-sm ${!filterStatus ? 'btn-gold' : 'btn-outline-secondary'}`}
              onClick={() => setFilterStatus('')}
            >
              Tümü
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                className={`btn btn-sm ${filterStatus === key ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <BsXCircle className="me-2" />
          {error}
          <button className="btn-close ms-auto" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Orders Table */}
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
                  <th style={{ width: '70px' }}>#</th>
                  <th>Müşteri</th>
                  <th>Telefon</th>
                  <th>Teslimat</th>
                  <th>Ödeme</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th style={{ width: '180px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      {filterStatus
                        ? `"${STATUS_CONFIG[filterStatus]?.label}" durumunda sipariş bulunamadı`
                        : 'Henüz sipariş bulunmuyor'}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const nextStatus = getNextStatus(order.status);
                    return (
                      <tr key={order.id}>
                        <td className="fw-bold">#{order.id}</td>
                        <td className="fw-semibold">{order.full_name}</td>
                        <td>{order.phone}</td>
                        <td>
                          <span className={`badge ${order.delivery_type === 'pickup' ? 'bg-info' : 'bg-outline-secondary border'}`}>
                            {DELIVERY_TYPE_LABELS[order.delivery_type] || order.delivery_type}
                          </span>
                          {order.do_not_ring_bell && (
                            <BsBellSlash className="text-warning ms-1" title="Zile basma" size={14} />
                          )}
                        </td>
                        <td>
                          <span className={`badge ${order.payment_type === 'card' ? 'bg-primary' : 'bg-success'}`}>
                            {PAYMENT_TYPE_LABELS[order.payment_type] || order.payment_type}
                          </span>
                        </td>
                        <td className="fw-bold">{parseFloat(order.total).toFixed(2)} ₺</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>
                          <small className="text-muted">{formatDate(order.created_at)}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              title="Detay"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <BsEye />
                            </button>
                            {nextStatus && (
                              <button
                                className="btn btn-sm btn-gold"
                                disabled={updatingId === order.id}
                                onClick={() => handleStatusChange(order.id, nextStatus)}
                                title={`→ ${STATUS_CONFIG[nextStatus]?.label}`}
                              >
                                {updatingId === order.id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  STATUS_CONFIG[nextStatus]?.label
                                )}
                              </button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'returned' && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={updatingId === order.id}
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                title="İptal Et"
                              >
                                <BsXLg />
                              </button>
                            )}
                          </div>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-dark-brown text-white">
                  <h5 className="modal-title fw-bold">
                    Sipariş #{selectedOrder.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedOrder(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Status + Date */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <StatusBadge status={selectedOrder.status} />
                    <small className="text-muted">{formatDate(selectedOrder.created_at)}</small>
                  </div>

                  {/* Customer Info */}
                  <div className="card bg-light border-0 mb-3">
                    <div className="card-body py-3">
                      <h6 className="fw-bold mb-2">Müşteri Bilgileri</h6>
                      <div className="row">
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Ad Soyad</small>
                          <span className="fw-semibold">{selectedOrder.full_name}</span>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Telefon</small>
                          <span className="fw-semibold">{selectedOrder.phone}</span>
                        </div>
                      </div>
                      <div className="row mt-2">
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Email</small>
                          <span>{selectedOrder.email}</span>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted d-block">Adres</small>
                          <span>
                            {selectedOrder.delivery_type === 'pickup' ? (
                              <em className="text-info">Gel Al</em>
                            ) : (
                              <>
                                {selectedOrder.address_line1}
                                {selectedOrder.address_line2 && `, ${selectedOrder.address_line2}`}
                                {selectedOrder.district && `, ${selectedOrder.district}`}
                                {selectedOrder.city && ` / ${selectedOrder.city}`}
                                {selectedOrder.postal_code && ` ${selectedOrder.postal_code}`}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="row mt-2">
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Teslimat Türü</small>
                          <span className="fw-semibold">
                            {DELIVERY_TYPE_LABELS[selectedOrder.delivery_type] || selectedOrder.delivery_type}
                          </span>
                        </div>
                        <div className="col-sm-4">
                          <small className="text-muted d-block">Ödeme Türü</small>
                          <span className="fw-semibold">
                            {PAYMENT_TYPE_LABELS[selectedOrder.payment_type] || selectedOrder.payment_type}
                          </span>
                        </div>
                        <div className="col-sm-4">
                          {selectedOrder.do_not_ring_bell && (
                            <>
                              <small className="text-muted d-block">Uyarı</small>
                              <span className="text-warning fw-semibold d-flex align-items-center gap-1">
                                <BsBellSlash /> Zile Basma
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sipariş Notu */}
                  {selectedOrder.order_note && (
                    <div className="card bg-warning bg-opacity-10 border-warning mb-3">
                      <div className="card-body py-2">
                        <h6 className="fw-bold mb-1 d-flex align-items-center gap-1">
                          <BsStickyFill /> Sipariş Notu
                        </h6>
                        <p className="mb-0">{selectedOrder.order_note}</p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <h6 className="fw-bold mb-2">Sipariş Kalemleri</h6>
                  <div className="table-responsive">
                    <table className="table table-sm mb-3">
                      <thead className="table-light">
                        <tr>
                          <th>Ürün</th>
                          <th>Seçenekler</th>
                          <th>Birim</th>
                          <th className="text-center">Adet</th>
                          <th className="text-end">Birim Fiyat</th>
                          <th className="text-end">Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => {
                          const removedOpts = (item.selected_options || []).filter((o) => o.is_removed);
                          const keptOpts = (item.selected_options || []).filter((o) => !o.is_removed && parseFloat(o.extra_price_snapshot) === 0);
                          const extraOpts = (item.selected_options || []).filter((o) => !o.is_removed && parseFloat(o.extra_price_snapshot) > 0);
                          return (
                            <tr key={item.id}>
                              <td>
                                <span className="fw-semibold">{item.product_name_snapshot}</span>
                              </td>
                              <td>
                                {(item.selected_options && item.selected_options.length > 0) ? (
                                  <div className="d-flex flex-column gap-1">
                                    {removedOpts.length > 0 && (
                                      <div>
                                        <small className="text-danger fw-semibold d-block mb-1">Çıkarılan:</small>
                                        {removedOpts.map((opt) => (
                                          <span
                                            key={opt.id}
                                            className="badge bg-danger-subtle text-danger border-danger me-1 mb-1"
                                            style={{ fontSize: '0.75rem' }}
                                          >
                                            <s>{opt.item_name_snapshot}</s> ✕
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {keptOpts.length > 0 && (
                                      <div>
                                        <small className="text-secondary fw-semibold d-block mb-1">Malzemeler:</small>
                                        {keptOpts.map((opt) => (
                                          <span
                                            key={opt.id}
                                            className="badge bg-light text-dark border me-1 mb-1"
                                            style={{ fontSize: '0.75rem' }}
                                          >
                                            ✓ {opt.item_name_snapshot}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {extraOpts.length > 0 && (
                                      <div>
                                        <small className="text-success fw-semibold d-block mb-1">Ekstra:</small>
                                        {extraOpts.map((opt) => (
                                          <span
                                            key={opt.id}
                                            className="badge bg-success-subtle text-success border-success me-1 mb-1"
                                            style={{ fontSize: '0.75rem' }}
                                          >
                                            {opt.item_name_snapshot}
                                            {` (+${parseFloat(opt.extra_price_snapshot).toFixed(2)} ₺)`}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <small className="text-muted">—</small>
                                )}
                              </td>
                              <td>
                                <small>
                                  {item.quantity_code_snapshot} {item.unit_code_snapshot}
                                </small>
                              </td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">
                                {parseFloat(item.unit_price_snapshot).toFixed(2)} ₺
                              </td>
                              <td className="text-end fw-semibold">
                                {parseFloat(item.line_total).toFixed(2)} ₺
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-top pt-2">
                    <div className="d-flex justify-content-between">
                      <span>Ara Toplam</span>
                      <span>{parseFloat(selectedOrder.subtotal).toFixed(2)} ₺</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Teslimat Ücreti</span>
                      <span>{parseFloat(selectedOrder.delivery_fee).toFixed(2)} ₺</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold fs-5 mt-1">
                      <span>Toplam</span>
                      <span>{parseFloat(selectedOrder.total).toFixed(2)} ₺</span>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  {selectedOrder.status !== 'delivered' &&
                    selectedOrder.status !== 'cancelled' &&
                    selectedOrder.status !== 'returned' && (
                      <div className="border-top mt-3 pt-3">
                        <h6 className="fw-bold mb-2">Durumu Güncelle</h6>
                        <div className="d-flex gap-2 flex-wrap">
                          {STATUS_FLOW.map((s) => {
                            if (s === selectedOrder.status) return null;
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                className={`btn btn-sm btn-outline-secondary`}
                                disabled={updatingId === selectedOrder.id}
                                onClick={() => handleStatusChange(selectedOrder.id, s)}
                              >
                                {cfg.label}
                              </button>
                            );
                          })}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={updatingId === selectedOrder.id}
                            onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                          >
                            İptal Et
                          </button>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            disabled={updatingId === selectedOrder.id}
                            onClick={() => handleStatusChange(selectedOrder.id, 'returned')}
                          >
                            İade
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ManageOrders;
