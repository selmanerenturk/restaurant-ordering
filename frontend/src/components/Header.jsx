import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BsBoxArrowRight, BsMoonStars } from 'react-icons/bs';
import HeaderCart from './HeaderCart';
import SearchBar from './SearchBar';
import { NotificationPanel } from './NotificationPanel';
import { selectIsAuthenticated, selectIsSeller, logout } from '../redux/authSlice';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSeller = useSelector(selectIsSeller);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark pastry-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <BsMoonStars className="brand-icon" />
          <span className="brand-text fs-4 fw-bold">Ay Işığı Tatlıcısı</span>
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
    </nav>
  );
}

export default Header;
