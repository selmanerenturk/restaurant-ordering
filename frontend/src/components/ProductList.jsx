import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getProductsWithDefaultPrices } from '../redux/productsSlice';
import ProductLite from './ProductLite';

function ProductList() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(getProductsWithDefaultPrices());
  }, [dispatch]);

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

  return (
    <div className="row">
      {items.map((product) => (
        <ProductLite key={product.product_id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;
