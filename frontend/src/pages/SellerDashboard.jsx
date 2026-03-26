import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BsTags, BsBox, BsCurrencyDollar, BsBoxArrowRight, BsListCheck, BsSliders, BsGearFill } from 'react-icons/bs';
import { logout, selectCurrentUser } from '../redux/authSlice';

function SellerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
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
