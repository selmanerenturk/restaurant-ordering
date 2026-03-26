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

  // Group products by category
  const grouped = {};
  items.forEach((product) => {
    const catId = product.category_id || 0;
    if (!grouped[catId]) {
      grouped[catId] = {
        name: product.category_name || 'Diğer',
        sortOrder: product.category_sort_order || 0,
        products: [],
      };
    }
    grouped[catId].products.push(product);
  });
  const categoryGroups = Object.values(grouped).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {categoryGroups.map((group) => (
        <div key={group.name} className="mb-5">
          <h3 className="fw-bold mb-3 section-title">{group.name}</h3>
          <div className="row">
            {group.products.map((product) => (
              <ProductLite key={product.product_id} product={product} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
