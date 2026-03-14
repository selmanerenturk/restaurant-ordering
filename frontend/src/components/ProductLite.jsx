import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { BsCartPlus } from 'react-icons/bs';
import { addToCart } from '../redux/cartSlice';

function ProductLite({ product }) {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      addToCart({
        product_price_id: product.default_price_id,
        product_id: product.product_id,
        product_name: product.product_name,
        quantity_code: product.default_quantity_code,
        unit_code: product.default_unit_code,
        price: parseFloat(product.default_price),
        currency_code: product.currency_code,
        quantity: 1,
        imageurl: product.imageurl,
      })
    );
  };

  return (
    <div className="col-6 col-md-4 col-lg-3 mb-4">
      <Link to={`/product/${product.product_id}`} className="text-decoration-none">
        <div className="card product-card h-100 border-0 shadow-sm">
          <div className="product-img-wrapper">
            <img
              src={product.imageurl}
              className="card-img-top product-img"
              alt={product.product_name}
            />
            {!product.in_stock && (
              <div className="out-of-stock-badge">Stokta yok</div>
            )}
          </div>
          <div className="card-body d-flex flex-column text-center">
            <h6 className="card-title product-name fw-semibold mb-2">{product.product_name}</h6>
            <p className="card-text product-price mb-2">
              <span className="fw-bold">{parseFloat(product.default_price).toFixed(2)}</span>
              <small className="ms-1">{product.currency_code}</small>
            </p>
            <small className="text-muted mb-2">
              {product.default_quantity_code} {product.default_unit_code}
            </small>
            <button
              className="btn btn-gold btn-sm mt-auto w-100"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
            >
              <BsCartPlus className="me-1" /> Sepete ekle
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductLite;
