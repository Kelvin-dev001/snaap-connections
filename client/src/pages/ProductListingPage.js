import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia,
  Chip, Container, Pagination, FormGroup, FormControlLabel, Checkbox, Slider, TextField,
  Select, MenuItem, InputAdornment, IconButton, useTheme, useMediaQuery, Skeleton
} from '@mui/material';
import {
  ShoppingCart, Favorite, FavoriteBorder, Star, Search, Close, Tune, WhatsApp
} from '@mui/icons-material';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { useNavigate } from 'react-router-dom';

const FALLBACK_IMAGE = "/fallback.png";

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

  // Store the _id for category/brand filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: '', // will be category._id
    brand: '',    // will be brand._id
    minPrice: 0,
    maxPrice: 500000,
    sort: 'newest',
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
          category: filters.category, // now _id!
          brand: filters.brand,       // now _id!
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

  // For CHECKBOX: handle with _id
  const handleCategoryChange = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === categoryId ? '' : categoryId,
      page: 1
    }));
  };
  const handleBrandChange = (brandId) => {
    setFilters(prev => ({
      ...prev,
      brand: prev.brand === brandId ? '' : brandId,
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
      sort: 'newest',
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const handleBuyOnWhatsApp = (product) => {
    const message = `I'm interested in: ${product.name}\nPrice: ${formatPrice(product.discountPrice || product.price)}\nLink: ${window.location.origin}/products/${product._id}`;
    window.open(`https://wa.me/254XXXXXXXXX?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleProductClick = (id) => {
    navigate(`/products/${id}`);
  };

  const sliderValue = [
    Number.isFinite(filters.minPrice) ? filters.minPrice : 0,
    Number.isFinite(filters.maxPrice) ? filters.maxPrice : 500000
  ];

  if (loading && filters.page === 1) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3} columns={12}>
          {[...Array(filters.limit)].map((_, idx) => (
            <Grid key={idx} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Skeleton variant="rectangular" height={220} />
                <CardContent>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                  <Skeleton width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
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
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search products..."
                value={filters.search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Price Range (KES)
              </Typography>
              <Slider
                value={sliderValue}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                min={0}
                max={500000}
                step={1000}
                valueLabelFormat={formatPrice}
                sx={{ mx: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{formatPrice(sliderValue[0])}</Typography>
                <Typography variant="body2">{formatPrice(sliderValue[1])}</Typography>
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
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
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
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand._id}>{brand.name}</MenuItem>
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
                ? (categories.find(c => c._id === filters.category)?.name || 'All Products')
                : 'All Products'}
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                ({totalProducts} products)
              </Typography>
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton onClick={() => setShowFilters(true)}>
                  <Tune />
                </IconButton>
              )}
              <Select
                value={filters.sort}
                onChange={handleSortChange}
                size="small"
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </Select>
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
                  <Grid key={product._id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        boxShadow: 3,
                        transition: 'transform 0.3s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => handleProductClick(product._id)}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="220"
                          image={product.thumbnail || product.images?.[0] || FALLBACK_IMAGE}
                          alt={product.name}
                          sx={{ objectFit: 'contain', p: 1 }}
                        />
                        <IconButton
                          aria-label="add to wishlist"
                          onClick={e => { e.stopPropagation(); toggleWishlist(product._id); }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'background.paper',
                            '&:hover': {
                              backgroundColor: 'background.default'
                            }
                          }}
                        >
                          {wishlist.includes(product._id) ? (
                            <Favorite color="error" />
                          ) : (
                            <FavoriteBorder />
                          )}
                        </IconButton>
                        {product.isOnSale && product.discountPrice && (
                          <Chip
                            label={`${Math.round((1 - product.discountPrice / product.price) * 100)}% OFF`}
                            color="error"
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {brands.find(b => b._id === product.brand)?.name || product.brand}
                        </Typography>
                        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Star color="warning" fontSize="small" />
                          <Typography variant="body2" sx={{ ml: 0.5 }}>
                            4.5 {/* Replace with actual rating when available */}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {formatPrice(product.discountPrice || product.price)}
                          </Typography>
                          {product.discountPrice && (
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              {formatPrice(product.price)}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mb: 2
                        }}>
                          {product.specs?.storage && (
                            <Chip
                              label={`Storage: ${product.specs.storage}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {product.specs?.ram && (
                            <Chip
                              label={`RAM: ${product.specs.ram}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<WhatsApp />}
                          sx={{ borderRadius: '50px' }}
                          onClick={e => { e.stopPropagation(); handleBuyOnWhatsApp(product); }}
                        >
                          Buy on WhatsApp
                        </Button>
                      </Box>
                    </Card>
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