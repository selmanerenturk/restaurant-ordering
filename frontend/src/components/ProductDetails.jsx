import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BsCartPlus, BsArrowLeft, BsDash, BsPlus } from 'react-icons/bs';
import { getProductWithPrices, clearSelectedProduct } from '../redux/productsSlice';
import { addToCart } from '../redux/cartSlice';

function ProductDetails() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct, loading, error } = useSelector((state) => state.products);

  const [selectedPriceId, setSelectedPriceId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(getProductWithPrices(productId));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (selectedProduct?.prices) {
      const defaultPrice = selectedProduct.prices.find((p) => p.is_default);
      if (defaultPrice) {
        setSelectedPriceId(defaultPrice.id);
      } else if (selectedProduct.prices.length > 0) {
        setSelectedPriceId(selectedProduct.prices[0].id);
      }
    }
  }, [selectedProduct]);

  const handleAddToCart = () => {
    const priceOption = selectedProduct.prices.find((p) => p.id === selectedPriceId);
    if (!priceOption) return;

    dispatch(
      addToCart({
        product_price_id: priceOption.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity_code: priceOption.quantity_code,
        unit_code: priceOption.unit_code,
        price: parseFloat(priceOption.price),
        currency_code: priceOption.currency_code,
        quantity,
        imageurl: selectedProduct.imageurl,
      })
    );
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
      </div>
    );
  }

  if (!selectedProduct) return null;

  const selectedPrice = selectedProduct.prices.find((p) => p.id === selectedPriceId);

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate(-1)}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="product-detail-img-wrapper">
            <img
              src={selectedProduct.imageurl}
              alt={selectedProduct.name}
              className="img-fluid rounded shadow product-detail-img"
            />
            {!selectedProduct.instock && (
              <div className="out-of-stock-badge-lg">Stokta yok</div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h2 className="product-detail-name fw-bold mb-3">{selectedProduct.name}</h2>
          <p className="product-detail-desc mb-4">{selectedProduct.description}</p>

          <h5 className="fw-semibold mb-3">Fiyat Seçenekleri</h5>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {selectedProduct.prices.map((priceOption) => (
              <button
                key={priceOption.id}
                className={`btn price-option-btn ${
                  selectedPriceId === priceOption.id ? 'active' : ''
                }`}
                onClick={() => setSelectedPriceId(priceOption.id)}
              >
                <span className="fw-semibold">{priceOption.quantity_code} {priceOption.unit_code}</span>
                <br />
                <span className="price-value">{parseFloat(priceOption.price).toFixed(2)} {priceOption.currency_code}</span>
              </button>
            ))}
          </div>

          {selectedPrice && (
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Miktar</h5>
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <BsDash />
                </button>
                <span className="mx-3 fs-5 fw-bold">{quantity}</span>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <BsPlus />
                </button>
              </div>
              <p className="mt-2 fs-5">
                Toplam: <span className="fw-bold">{(parseFloat(selectedPrice.price) * quantity).toFixed(2)} {selectedPrice.currency_code}</span>
              </p>
            </div>
          )}

          <button
            className="btn btn-gold btn-lg w-100 fw-bold"
            onClick={handleAddToCart}
            disabled={!selectedProduct.instock || !selectedPrice}
          >
            <BsCartPlus className="me-2" />
            {selectedProduct.instock ? 'Sepete ekle' : 'Stokta yok'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
