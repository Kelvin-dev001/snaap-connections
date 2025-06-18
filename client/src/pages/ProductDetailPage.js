import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CardMedia, 
  Chip, Container, Divider, Tabs, Tab, List, ListItem,
  ListItemText, IconButton, Rating, useTheme,
  useMediaQuery, Breadcrumbs, Link, Skeleton
} from '@mui/material';
import {
  Favorite, FavoriteBorder, Star,
  WhatsApp, Share, LocalShipping,
  AssignmentReturn, VerifiedUser
} from '@mui/icons-material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ReviewSection from '../components/ReviewsSection';

const FALLBACK_IMAGE = "/fallback.png"; // Place a fallback image in your public folder

const ProductDetailPage = () => {
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const productResponse = await API.getProduct(id);
        setProduct(productResponse.data.product);

        const relatedResponse = await API.getProducts({
          category: productResponse.data.product.category,
          limit: 4
        });
        setRelatedProducts(
          (relatedResponse.data.products || []).filter(p => p._id !== id)
        );
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.inStock ? 10 : 0)) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (product?.inStock ? 10 : 0)) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);

  const handleWhatsAppBuy = () => {
    if (!product) return;
    const message = `I'm interested in: ${product.name}\nPrice: ${formatPrice(product.discountPrice || product.price)}\nQuantity: ${quantity}\nLink: ${window.location.href}`;
    window.open(`https://wa.me/254XXXXXXXXX?text=${encodeURIComponent(message)}`, '_blank');
  };

  const images = (product?.images && product.images.length > 0)
    ? product.images
    : [FALLBACK_IMAGE];

  const mainImage = images[selectedImage] || FALLBACK_IMAGE;

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert error={error} onClose={() => window.location.href = '/products'} />
      </Container>
    );
  }
  if (!product) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" to="/">Home</Link>
        <Link component={RouterLink} color="inherit" to={`/products?category=${product.category}`}>{product.category}</Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 16, borderRadius: 2, overflow: 'hidden' }}>
            <Box>
              <CardMedia
                component="img"
                image={mainImage}
                alt={`${product.name} - main`}
                sx={{
                  width: '100%',
                  height: isMobile ? 250 : 400,
                  objectFit: 'contain',
                  borderRadius: 2,
                  background: '#fafafa'
                }}
              />
            </Box>
            {/* Thumbnail navigation */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              mt: 2,
              overflowX: 'auto',
              py: 1
            }}>
              {images.map((image, index) => (
                <Box
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImage === index ? `2px solid ${theme.palette.primary.main}` : '1px solid #eee',
                    opacity: selectedImage === index ? 1 : 0.7,
                    transition: 'all 0.3s',
                    flexShrink: 0,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              {product.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {/* Optionally: Display average rating from reviews */}
              <Rating value={4.5} precision={0.1} readOnly sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                4.5 (24 reviews)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {formatPrice(product.discountPrice || product.price)}
              </Typography>
              {product.discountPrice && (
                <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  {formatPrice(product.price)}
                </Typography>
              )}
              {product.discountPrice && (
                <Chip
                  label={`Save ${formatPrice(product.price - product.discountPrice)}`}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph>
                {product.shortDescription}
              </Typography>
              <List dense sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText primary="Brand" secondary={product.brand} secondaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Category" secondary={product.category} secondaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Warranty" secondary={product.warrantyPeriod || '1 year'} secondaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Availability"
                    secondary={product.inStock ? 'In stock' : 'Out of stock'}
                    secondaryTypographyProps={{
                      fontWeight: 600,
                      color: product.inStock ? 'success.main' : 'error.main'
                    }}
                  />
                </ListItem>
              </List>
            </Box>
            <Divider sx={{ my: 3 }} />

            {/* Key Specifications */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Key Specifications
              </Typography>
              <Grid container spacing={1}>
                {product.specs &&
                  Object.entries(product.specs).filter(([_, value]) => value).slice(0, 4).map(([key, value]) => (
                    <Grid item xs={6} key={key}>
                      <Box sx={{
                        bgcolor: 'background.paper',
                        p: 1.5,
                        borderRadius: 1,
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          {key.replace(/^[a-z]/, char => char.toUpperCase())}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </Box>
            <Divider sx={{ my: 3 }} />

            {/* Quantity and WhatsApp Buy */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Quantity
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3
              }}>
                <Box sx={{
                  display: 'flex',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Button
                    variant="text"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    sx={{ minWidth: '40px', px: 1 }}
                  >-</Button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={product.inStock ? 10 : 0}
                    onChange={e => handleQuantityChange(e)}
                    style={{
                      width: 50,
                      textAlign: 'center',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                  <Button
                    variant="text"
                    onClick={incrementQuantity}
                    disabled={quantity >= (product.inStock ? 10 : 0)}
                    sx={{ minWidth: '40px', px: 1 }}
                  >+</Button>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<WhatsApp />}
                fullWidth
                sx={{
                  borderRadius: '50px',
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}
                disabled={!product.inStock}
                onClick={handleWhatsAppBuy}
              >
                Buy on WhatsApp
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <IconButton
                  aria-label="add to wishlist"
                  onClick={() => toggleWishlist(product._id)}
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: '50%'
                  }}
                >
                  {wishlist.includes(product._id) ? (
                    <Favorite color="error" />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                <IconButton
                  aria-label="share"
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: '50%'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied!');
                  }}
                >
                  <Share />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ my: 3 }} />

            {/* Delivery Info */}
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping color="primary" />
                <Box>
                  <Typography variant="body2">Free Delivery</Typography>
                  <Typography variant="body2" color="text.secondary">
                    For orders above KES 10,000
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentReturn color="primary" />
                <Box>
                  <Typography variant="body2">7-Day Returns</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No questions asked
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" />
                <Box>
                  <Typography variant="body2">Warranty</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.warrantyPeriod || '1 year'} warranty
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Product Tabs */}
      <Box sx={{ mt: 6 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            mb: 3,
            '& .MuiTabs-indicator': { height: 3 }
          }}
        >
          <Tab label="Description" />
          <Tab label="Specifications" />
          <Tab label="Reviews" />
        </Tabs>

        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          {tabValue === 0 && (
            <Typography variant="body1" whiteSpace="pre-line">
              {product.fullDescription || 'No description available'}
            </Typography>
          )}
          {tabValue === 1 && (
            <Grid container spacing={2}>
              {product.specs &&
                Object.entries(product.specs)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1.5,
                        borderBottom: '1px solid #eee'
                      }}>
                        <Typography variant="body1" color="text.secondary">
                          {key.replace(/^[a-z]/, char => char.toUpperCase())}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
            </Grid>
          )}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Customer Reviews
              </Typography>
              <Box sx={{ mt: 4 }}>
                {/* Render the review section and pass the actual product._id */}
                <ReviewSection productId={product._id} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            You may also like
          </Typography>
          <Grid container spacing={3}>
            {relatedProducts.map((related) => (
              <Grid item xs={12} sm={6} md={3} key={related._id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: 3,
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-5px)' },
                    cursor: 'pointer'
                  }}
                  onClick={() => window.location.href = `/products/${related._id}`}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={related.thumbnail || related.images?.[0] || FALLBACK_IMAGE}
                      alt={related.name}
                      sx={{ objectFit: 'contain', p: 2 }}
                    />
                    <IconButton
                      aria-label="add to wishlist"
                      onClick={e => { e.stopPropagation(); toggleWishlist(related._id); }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'background.paper',
                        '&:hover': { backgroundColor: 'background.default' }
                      }}
                    >
                      {wishlist.includes(related._id) ? (
                        <Favorite color="error" />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </IconButton>
                  </Box>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      {related.category}
                    </Typography>
                    <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                      {related.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star color="warning" fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        4.5
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      {formatPrice(related.discountPrice || related.price)}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      sx={{ mt: 2, borderRadius: '50px' }}
                      onClick={e => { e.stopPropagation(); window.location.href = `/products/${related._id}`; }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ProductDetailPage;