import ProductList from '../components/ProductList';

function HomePage() {
  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold section-title">Tatlı ve Waffle</h1>
        <p className="lead text-muted">Özenle hazırlanır, Hızlıca teslim edilir.</p>
      </div>
      <ProductList />
    </div>
  );
}

export default HomePage;
