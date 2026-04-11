import { useSelector } from 'react-redux';
import { BsExclamationTriangleFill, BsClock } from 'react-icons/bs';
import ProductList from '../components/ProductList';
import { selectRestaurantOpen, selectRestaurantReason, selectRestaurantNextOpen } from '../redux/restaurantSlice';

function HomePage() {
  const isOpen = useSelector(selectRestaurantOpen);
  const reason = useSelector(selectRestaurantReason);
  const nextOpen = useSelector(selectRestaurantNextOpen);

  return (
    <div className="container py-4">
      {/* Restaurant closed banner */}
      {!isOpen && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start gap-3 mb-4" role="alert">
          <BsExclamationTriangleFill size={24} className="text-danger flex-shrink-0 mt-1" />
          <div>
            <h5 className="alert-heading fw-bold mb-1">Restoran Şu Anda Kapalı</h5>
            <p className="mb-1">{reason}</p>
            {nextOpen && (
              <p className="mb-0 d-flex align-items-center gap-1">
                <BsClock /> <strong>Bir sonraki açılış:</strong> {nextOpen}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold section-title">Tatlı ve Waffle</h1>
        <p className="lead text-muted">Özenle hazırlanır, Hızlıca teslim edilir.</p>
      </div>
      <ProductList />
    </div>
  );
}

export default HomePage;
