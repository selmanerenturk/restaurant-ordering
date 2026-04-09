import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getProductsWithDefaultPrices } from '../redux/productsSlice';
import ProductLite from './ProductLite';
import { BsStarFill, BsSearch } from 'react-icons/bs';

// Turkish-aware lowercase
const toLower = (str) =>
  str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ç/g, 'ç')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ğ/g, 'ğ')
    .toLowerCase();

function ProductList() {
  const dispatch = useDispatch();
  const { items, loading, error, searchQuery } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(getProductsWithDefaultPrices());
  }, [dispatch]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return items;
    const q = toLower(searchQuery.trim());
    return items.filter((p) => {
      const name = toLower(p.product_name || '');
      const category = toLower(p.category_name || '');
      return name.includes(q) || category.includes(q);
    });
  }, [items, searchQuery]);

  const isSearching = searchQuery && searchQuery.trim().length > 0;

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

  // If searching, show flat filtered results
  if (isSearching) {
    return (
      <div>
        <div className="d-flex align-items-center gap-2 mb-4">
          <BsSearch className="text-muted" />
          <span className="text-muted">
            &quot;<strong>{searchQuery.trim()}</strong>&quot; için{' '}
            <strong>{filteredItems.length}</strong> ürün bulundu
          </span>
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted fs-5 mb-1">Sonuç bulunamadı</p>
            <p className="text-muted small">Farklı bir arama terimi deneyin</p>
          </div>
        ) : (
          <div className="row">
            {filteredItems.map((product) => (
              <ProductLite
                key={product.product_id}
                product={product}
                featured={product.is_featured}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default view: Featured + Category groups
  const featuredProducts = items.filter((p) => p.is_featured);

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
      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <div className="mb-5">
          <div className="featured-section-header text-center mb-4">
            <h3 className="fw-bold section-title d-inline-flex align-items-center gap-2">
              <BsStarFill className="text-warning" />
              Öne Çıkan Ürünler
              <BsStarFill className="text-warning" />
            </h3>
            <p className="text-muted mt-2 mb-0">En beğenilen ve popüler ürünlerimiz</p>
          </div>
          <div className="featured-products-container">
            <div className="row justify-content-center">
              {featuredProducts.map((product) => (
                <ProductLite key={`featured-${product.product_id}`} product={product} featured />
              ))}
            </div>
          </div>
          <hr className="my-5" style={{ borderColor: '#e0e0e0' }} />
        </div>
      )}

      {/* Regular Category Groups */}
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
