import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import API from './api/apiService';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import CategoryList from './pages/admin/CategoryList';
import BrandList from './pages/admin/BrandList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import Login from './pages/admin/Login';
import RequireAdmin from './components/RequireAdmin'; // <-- Add this import

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.getFeaturedProducts();
        if (response.data) {
          setFeaturedProducts(response.data.products || []);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError(err.response?.data?.message || 'Failed to load featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading store..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 p-4">
        <ErrorAlert error={error} onClose={() => window.location.reload()} />
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage featuredProducts={featuredProducts} />} />
          <Route path="products" element={<ProductListingPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin Panel (guarded by RequireAdmin) */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="brands" element={<BrandList />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;