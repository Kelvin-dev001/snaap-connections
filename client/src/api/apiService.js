import axios from 'axios';

// Determine backend API URL
const apiBaseUrl =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'https://localhost:5000/api'
    : undefined);

if (!apiBaseUrl) {
  // Warn if missing in production (will break all API calls)
  // eslint-disable-next-line no-console
  console.warn(
    "REACT_APP_API_URL is not set! Please define it in your Vercel environment variables."
  );
}

// For debugging, shows which base URL is being used
console.log("API base URL:", apiBaseUrl);

// --- JWT TOKEN HANDLING ---
export function setToken(token) {
  localStorage.setItem('jwtToken', token);
}

export function getToken() {
  return localStorage.getItem('jwtToken');
}

export function removeToken() {
  localStorage.removeItem('jwtToken');
}

// Configure axios instance
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const API = {
  // Product endpoints
  getProducts: (params = {}) => api.get('/products', { params }),

  getProduct: (id) => api.get(`/products/${id}`),

  // Featured products: accepts custom params (limit, sort, etc)
  getFeaturedProducts: (params = {}) =>
    api.get('/products', { params: { featured: true, ...params } }),

  // Pocket Friendly
  getPocketFriendlyProducts: ({ maxPrice = 20000, limit = 10 } = {}) =>
    api.get('/products', { params: { maxPrice, limit, sort: 'price_asc' } }),

  // Deals/Promotions
  getDealsProducts: ({ limit = 30 } = {}) =>
    api.get('/products', { params: { isOnSale: true, limit } }),

  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // Category endpoints
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  createCategoryMultipart: (formData) =>
    api.post('/categories', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  updateCategoryMultipart: (id, formData) =>
    api.put(`/categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),

  // Brand endpoints
  getBrands: () => api.get('/brands'),
  createBrand: (data) => api.post('/brands', data),
  updateBrand: (id, data) => api.put(`/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/brands/${id}`),
  createBrandMultipart: (formData) =>
    api.post('/brands', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  updateBrandMultipart: (id, formData) =>
    api.put(`/brands/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),

  // Dashboard stats (admin)
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Order endpoints
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}`, { status }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),

  // Cart endpoints
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity = 1) => api.post('/cart', { productId, quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart'),

  // Admin endpoints
  getCustomers: (params = {}) => api.get('/admin/customers', { params }),
  updateCustomer: (id, data) => api.patch(`/admin/customers/${id}`, data),

  // ---- REVIEW ENDPOINTS ----
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),
  submitProductReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  getRecentReviews: () => api.get('/reviews/recent'),
  getAllReviews: () => api.get('/admin/reviews'),
  approveReview: (reviewId) => api.patch(`/admin/reviews/${reviewId}/approve`),
  deleteReview: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),

  // =======================
  // Auth/JWT
  // =======================
  login: async ({ password }) => {
    const response = await api.post('/auth/login', { password });
    if (response.data && response.data.token) {
      setToken(response.data.token);
    }
    return response;
  },
  logout: () => {
    removeToken();
    return Promise.resolve();
  },
  checkAdmin: () => api.get('/auth/check'),

  // =======================
  // Product Advisor Bot (AI Chatbot)
  // =======================
  sendBotMessage: (message) => api.post('/product-bot', { message }),
};

export default API;