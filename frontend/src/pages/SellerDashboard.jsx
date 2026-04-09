import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BsTags,
  BsBox,
  BsCurrencyDollar,
  BsBoxArrowRight,
  BsListCheck,
  BsSliders,
  BsGearFill,
  BsCartCheck,
  BsCashCoin,
  BsHourglass,
  BsGraphUp,
  BsArrowRepeat,
  BsPercent,
} from 'react-icons/bs';
import { logout, selectCurrentUser } from '../redux/authSlice';
import { getDailySummary } from '../services/orderService';

function SellerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const loadSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const data = await getDailySummary();
      setSummary(data);
    } catch (err) {
      setSummaryError('Özet veriler yüklenemedi');
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold section-title">Satıcı Paneli</h2>
          <p className="text-muted mt-3">Hoşgeldin, {user?.name || 'Seller'}</p>
        </div>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          <BsBoxArrowRight className="me-1" /> Çıkış Yap
        </button>
      </div>

      {/* Daily Summary Metrics */}
      <div className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">📊 Günlük Sipariş Özeti</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={loadSummary}
            disabled={summaryLoading}
          >
            <BsArrowRepeat className={`me-1 ${summaryLoading ? 'spin-animation' : ''}`} />
            Yenile
          </button>
        </div>

        {summaryError && (
          <div className="alert alert-warning py-2 small">{summaryError}</div>
        )}

        <div className="row g-3">
          {/* Today's Order Count */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm metric-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="metric-icon-wrapper metric-icon-blue">
                  <BsCartCheck size={22} />
                </div>
                <div>
                  <div className="metric-value">
                    {summaryLoading ? (
                      <span className="placeholder-glow"><span className="placeholder col-6"></span></span>
                    ) : (
                      summary?.today_order_count ?? '—'
                    )}
                  </div>
                  <div className="metric-label">Bugünkü Sipariş</div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm metric-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="metric-icon-wrapper metric-icon-green">
                  <BsCashCoin size={22} />
                </div>
                <div>
                  <div className="metric-value">
                    {summaryLoading ? (
                      <span className="placeholder-glow"><span className="placeholder col-8"></span></span>
                    ) : (
                      formatCurrency(summary?.today_revenue)
                    )}
                  </div>
                  <div className="metric-label">Bugünkü Ciro</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm metric-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`metric-icon-wrapper ${summary?.pending_order_count > 0 ? 'metric-icon-orange pulse-animation' : 'metric-icon-orange'}`}>
                  <BsHourglass size={22} />
                </div>
                <div>
                  <div className="metric-value">
                    {summaryLoading ? (
                      <span className="placeholder-glow"><span className="placeholder col-4"></span></span>
                    ) : (
                      <>
                        {summary?.pending_order_count ?? '—'}
                        {summary?.pending_order_count > 0 && (
                          <span className="metric-alert-dot"></span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="metric-label">Bekleyen Sipariş</div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Order Amount */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm metric-card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="metric-icon-wrapper metric-icon-purple">
                  <BsGraphUp size={22} />
                </div>
                <div>
                  <div className="metric-value">
                    {summaryLoading ? (
                      <span className="placeholder-glow"><span className="placeholder col-8"></span></span>
                    ) : (
                      formatCurrency(summary?.avg_order_amount)
                    )}
                  </div>
                  <div className="metric-label">Ortalama Tutar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <h5 className="fw-bold mb-3">⚙️ Yönetim</h5>
      <div className="row g-4">
        <div className="col-md-4">
          <Link to="/seller/orders" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsListCheck size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Siparişler</h4>
                <p className="text-muted">Siparişleri görüntüle ve yönet</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/categories" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsTags size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Kategoriler</h4>
                <p className="text-muted">Ürün kategorilerini yönet</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/products" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsBox size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Ürünler</h4>
                <p className="text-muted">Ürünleri yönet</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/prices" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsCurrencyDollar size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Fiyatlar</h4>
                <p className="text-muted">Ürün fiyatlarını yönet</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/product-options" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsSliders size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Ürün Seçenekleri</h4>
                <p className="text-muted">Ürün opsiyonlarını yönet</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/discounts" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsPercent size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">İndirimler</h4>
                <p className="text-muted">Toplu ve kategori bazlı indirimler</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/seller/settings" className="text-decoration-none">
            <div className="card border-0 shadow-sm dashboard-card h-100">
              <div className="card-body text-center py-5">
                <BsGearFill size={48} className="text-gold mb-3" />
                <h4 className="fw-bold">Restoran Ayarları</h4>
                <p className="text-muted">Çalışma saatleri, iletişim ve ayarlar</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
