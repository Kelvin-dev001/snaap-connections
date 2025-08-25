import axios from 'axios';

// API base URL for Render backend
const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://snaap-connections.onrender.com/api';

// For debugging - check what URL is being used
console.log("API base URL:", apiBaseUrl);

if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ REACT_APP_API_URL not set! Using fallback URL. Please set this in Vercel environment variables.");
}

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
  timeout: 30000, // Render can be slower than Vercel
  headers: {
    'Content-Type': 'application/json',
  }
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
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle auth errors
    if (error.response?.status === 401) {
      removeToken();
      // Could redirect to login here if needed
    }
    
    return Promise.reject(error);
  }
);

const API = {
  // Product endpoints
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (params = {}) =>
    api.get('/products', { params: { featured: true, ...params } }),
  getPocketFriendlyProducts: ({ maxPrice = 20000, limit = 10 } = {}) =>
    api.get('/products', { params: { maxPrice, limit, sort: 'price_asc' } }),
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

  // Review endpoints
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),
  submitProductReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  getRecentReviews: () => api.get('/reviews/recent'),
  getAllReviews: () => api.get('/admin/reviews'),
  approveReview: (reviewId) => api.patch(`/admin/reviews/${reviewId}/approve`),
  deleteReview: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),

  // Auth endpoints
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

  // Health check
  healthCheck: () => api.get('/health'),

  // Bot endpoint - using the same axios instance for consistency
  sendBotMessage: (message) => api.post('/product-bot', { message }),
};

export default API;