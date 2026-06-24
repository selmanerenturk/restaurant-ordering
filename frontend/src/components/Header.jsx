import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BsBoxArrowRight, BsMoonStars, BsInfoCircle, BsTelephone, BsGeoAlt, BsClock, BsXLg } from 'react-icons/bs';
import HeaderCart from './HeaderCart';
import SearchBar from './SearchBar';
import { NotificationPanel } from './NotificationPanel';
import { selectIsAuthenticated, selectIsSeller, logout } from '../redux/authSlice';
import { selectRestaurantInfo } from '../redux/restaurantSlice';
import { getImageUrl } from '../utils/imageUrl';

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

function RestaurantInfoModal({ info, onClose }) {
  const name = info?.name || 'Restoran';
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1080 }}
      onClick={onClose}
    >
      <div
        className="card border-0 shadow"
        style={{ maxWidth: '460px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header bg-dark-brown text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Restoran Bilgileri</h5>
          <button className="btn btn-sm btn-link text-white p-0" onClick={onClose} aria-label="Kapat"><BsXLg /></button>
        </div>
        <div className="card-body text-center">
          {info?.logo_url && (
            <img
              src={getImageUrl(info.logo_url)}
              alt={name}
              className="rounded mb-3"
              style={{ maxHeight: '90px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h4 className="fw-bold mb-3">{name}</h4>

          {info?.phone && (
            <p className="mb-2"><BsTelephone className="me-2 text-gold" /><a href={`tel:${info.phone}`} className="text-decoration-none">{info.phone}</a></p>
          )}
          {info?.address && (
            <p className="mb-3 text-muted"><BsGeoAlt className="me-2 text-gold" />{info.address}</p>
          )}

          {info?.is_temporarily_closed && (
            <div className="alert alert-warning py-2">
              {info.temporary_close_message || 'Restoran geçici olarak kapalıdır.'}
            </div>
          )}

          <hr />
          <h6 className="fw-bold d-flex align-items-center justify-content-center gap-2 mb-3">
            <BsClock className="text-gold" /> Çalışma Saatleri
          </h6>
          <ul className="list-group list-group-flush text-start">
            {DAYS.map((d) => {
              const day = info?.[d.key] || {};
              const open = day.open && day.close ? `${day.open} – ${day.close}` : 'Kapalı';
              return (
                <li key={d.key} className="list-group-item d-flex justify-content-between px-0 py-1">
                  <span>{d.label}</span>
                  <span className={day.open && day.close ? 'fw-semibold' : 'text-muted'}>{open}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSeller = useSelector(selectIsSeller);
  const info = useSelector(selectRestaurantInfo);
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const brandName = info?.name || 'Ay Işığı Tatlıcısı';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark pastry-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          {info?.logo_url ? (
            <img
              src={getImageUrl(info.logo_url)}
              alt={brandName}
              className="brand-logo me-2"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <BsMoonStars className="brand-icon" />
          )}
          <span className="brand-text fs-4 fw-bold">{brandName}</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Anasayfa</Link>
            </li>
            {isAuthenticated && isSeller && (
              <li className="nav-item">
                <Link className="nav-link" to="/seller/dashboard">Satıcı Paneli</Link>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            <SearchBar />
            {isAuthenticated && isSeller && (
              <NotificationPanel />
            )}
            <button className="btn btn-outline-light btn-sm" onClick={() => setShowInfo(true)}>
              <BsInfoCircle className="me-1" /> Restoran Bilgileri
            </button>
            {isAuthenticated && isSeller ? (
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                <BsBoxArrowRight className="me-1" /> Çıkış yap
              </button>
            ) : (
              <Link className="btn btn-outline-light btn-sm" to="/login">
                 Satıcı Girişi
              </Link>
            )}
            <HeaderCart />
          </div>
        </div>
      </div>
      {showInfo && <RestaurantInfoModal info={info} onClose={() => setShowInfo(false)} />}
    </nav>
  );
}

export default Header;
