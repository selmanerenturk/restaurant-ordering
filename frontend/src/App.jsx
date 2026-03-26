import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Cart from './components/Cart';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import OrderPage from './pages/OrderPage';
import LoginPage from './pages/LoginPage';
import SellerDashboard from './pages/SellerDashboard';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import ManagePrices from './pages/ManagePrices';
import ManageOrders from './pages/ManageOrders';
import ManageProductOptions from './pages/ManageProductOptions';
import ManageSettings from './pages/ManageSettings';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        <Cart />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
            <Route path="/seller/categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
            <Route path="/seller/products" element={<ProtectedRoute><ManageProducts /></ProtectedRoute>} />
            <Route path="/seller/prices" element={<ProtectedRoute><ManagePrices /></ProtectedRoute>} />
            <Route path="/seller/orders" element={<ProtectedRoute><ManageOrders /></ProtectedRoute>} />
            <Route path="/seller/product-options" element={<ProtectedRoute><ManageProductOptions /></ProtectedRoute>} />
            <Route path="/seller/settings" element={<ProtectedRoute><ManageSettings /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="pastry-footer text-center py-4">
          <div className="container">
            <p className="mb-0">&copy; 2023 Ay Işığı Tatlıcısı. Tüm hakları saklıdır.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
