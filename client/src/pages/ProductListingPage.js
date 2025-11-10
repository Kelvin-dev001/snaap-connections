import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Container, Pagination, Select, MenuItem, IconButton, useTheme,
  useMediaQuery, Slider, Divider
} from '@mui/material';
import {
  Tune, Close
} from '@mui/icons-material';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import AutoCompleteSearch from '../components/AutoCompleteSearch';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard'; // <-- Make sure this path is correct!

const PRODUCTS_PER_PAGE_OPTIONS = [12, 24, 48, 96, 200, 500, 1000];

const ProductListingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const brandFromQuery = urlParams.get('brand') || '';
  const categoryFromQuery = urlParams.get('category') || '';

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: categoryFromQuery,
    brand: brandFromQuery,
    minPrice: 0,
    maxPrice: 500000,
    sort: 'random',
    search: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          API.getCategories(),
          API.getBrands()
        ]);
        const cats = categoriesRes.data.categories || categoriesRes.data || [];
        setCategories(Array.isArray(cats) ? cats : []);
        const brs = brandsRes.data.brands || brandsRes.data || [];
        setBrands(Array.isArray(brs) ? brs : []);
      } catch (err) {
        setCategories([]);
        setBrands([]);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.getProducts({
          page: filters.page,
          limit: filters.limit,
          category: filters.category,
          brand: filters.brand,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          search: filters.search,
          sort: filters.sort
        });
        setProducts(response.data.products);
        setTotalProducts(response.data.count);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  const handleCategoryChange = (categoryName) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === categoryName ? '' : categoryName,
      page: 1
    }));
  };
  const handleBrandChange = (brandName) => {
    setFilters(prev => ({
      ...prev,
      brand: prev.brand === brandName ? '' : brandName,
      page: 1
    }));
  };

  const handlePriceChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      minPrice: newValue[0],
      maxPrice: newValue[1],
      page: 1
    }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({
      ...prev,
      sort: e.target.value,
      page: 1
    }));
  };

  const handleProductsPerPageChange = (e) => {
    setFilters(prev => ({
      ...prev,
      limit: Number(e.target.value),
      page: 1
    }));
  };

  const handlePageChange = (e, value) => {
    setFilters(prev => ({
      ...prev,
      page: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      category: '',
      brand: '',
      minPrice: 0,
      maxPrice: 500000,
      sort: 'random',
      search: ''
    });
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (id) => {
    navigate(`/products/${id}`);
  };

  const handleSearchSelect = (productId) => {
    navigate(`/products/${productId}`);
  };

  const sliderValue = [
    Number.isFinite(filters.minPrice) ? filters.minPrice : 0,
    Number.isFinite(filters.maxPrice) ? filters.maxPrice : 500000
  ];

  if (loading && filters.page === 1) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert error={error} onClose={() => setError(null)} />
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 4
      }}>
        {/* Filters Sidebar */}
        {(!isMobile || showFilters) && (
          <Box sx={{
            width: isMobile ? '100%' : '280px',
            flexShrink: 0,
            position: isMobile ? 'fixed' : 'static',
            top: 0,
            left: 0,
            height: isMobile ? '100vh' : 'auto',
            bgcolor: isMobile ? 'background.paper' : 'transparent',
            zIndex: isMobile ? 1200 : 'auto',
            p: isMobile ? 2 : 0,
            overflowY: isMobile ? 'auto' : 'visible'
          }}>
            {isMobile && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6">Filters</Typography>
                <IconButton onClick={() => setShowFilters(false)}>
                  <Close />
                </IconButton>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Search
              </Typography>
              <AutoCompleteSearch
                onSelect={handleSearchSelect}
                placeholder="Search products..."
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Price Range (KES)
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={sliderValue}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={500000}
                  step={1000}
                  valueLabelFormat={val => `KES ${val.toLocaleString()}`}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                <Typography variant="body2">{sliderValue[0].toLocaleString()}</Typography>
                <Typography variant="body2">{sliderValue[1].toLocaleString()}</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Categories
              </Typography>
              <Select
                name="category"
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
                fullWidth
                displayEmpty
                size="small"
                sx={{ mb: 2 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat, idx) => (
                  <MenuItem key={cat._id || cat.name} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Brands
              </Typography>
              <Select
                name="brand"
                value={filters.brand}
                onChange={e => setFilters(f => ({ ...f, brand: e.target.value, page: 1 }))}
                fullWidth
                displayEmpty
                size="small"
                sx={{ mb: 2 }}
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand, idx) => (
                  <MenuItem key={brand._id || brand.name} value={brand.name}>{brand.name}</MenuItem>
                ))}
              </Select>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={clearFilters}
              sx={{ mb: 2 }}
            >
              Clear All Filters
            </Button>

            {isMobile && (
              <Button
                variant="contained"
                fullWidth
                onClick={() => setShowFilters(false)}
              >
                Show Results
              </Button>
            )}
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Main Content */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              {filters.category
                ? filters.category
                : filters.brand
                  ? filters.brand
                  : 'All Products'}
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                ({totalProducts} products)
              </Typography>
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Select
                value={filters.limit}
                onChange={handleProductsPerPageChange}
                size="small"
                sx={{ minWidth: 120 }}
              >
                {PRODUCTS_PER_PAGE_OPTIONS.map(option => (
                  <MenuItem key={option} value={option}>{option} / page</MenuItem>
                ))}
              </Select>
              <Select
                value={filters.sort}
                onChange={handleSortChange}
                size="small"
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="random">Random</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
              {isMobile && (
                <IconButton onClick={() => setShowFilters(true)}>
                  <Tune />
                </IconButton>
              )}
            </Box>
          </Box>
          {products.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50vh',
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                No products found matching your filters
              </Typography>
              <Button
                variant="outlined"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3} columns={12}>
                {products.map((product) => (
                  <Grid key={product._id || product.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
                    <ProductCard
                      product={product}
                      isWishlisted={wishlist.includes(product._id)}
                      onWishlistToggle={toggleWishlist}
                      showWhatsApp={true}
                      showViewBtn={true}
                    />
                  </Grid>
                ))}
              </Grid>
              {Math.ceil(totalProducts / filters.limit) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={Math.ceil(totalProducts / filters.limit)}
                    page={filters.page}
                    onChange={handlePageChange}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductListingPage;