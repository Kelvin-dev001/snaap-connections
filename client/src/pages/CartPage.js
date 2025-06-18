import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CardMedia, 
  Divider, Container, TextField, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  useTheme, useMediaQuery, Link
} from '@mui/material';
import {
  Delete, Add, Remove, ShoppingCart, WhatsApp, ArrowBack
} from '@mui/icons-material';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const CartPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would call API.getCart()
        // For now, we'll use localStorage as a mock
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
        
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load your cart. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      // In a real implementation, you would call API.updateCartItem()
      const updatedCart = cartItems.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart. Please try again.');
    }
  };

  const removeItem = async (productId) => {
    try {
      // In a real implementation, you would call API.removeCartItem()
      const updatedCart = cartItems.filter(item => item.id !== productId);
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      // In a real implementation, you would call API.clearCart()
      setCartItems([]);
      localStorage.removeItem('cart');
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart. Please try again.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 10000 ? 0 : 500;
  const total = subtotal + shippingFee;

  if (loading) {
    return <LoadingSpinner message="Loading your cart..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorAlert error={error} onClose={() => setError(null)} />
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <ShoppingCart sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Looks like you haven't added any items to your cart yet.
        </Typography>
        <Button 
          variant="contained" 
          href="/products"
          size="large"
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 4 }}>
        Shopping Cart
      </Typography>
      
      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          {isMobile ? (
            <Box sx={{ mb: 4 }}>
              {cartItems.map((item) => (
                <Card key={item.id} sx={{ mb: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', p: 2 }}>
                    <CardMedia
                      component="img"
                      image={item.image}
                      alt={item.name}
                      sx={{ 
                        width: 100,
                        height: 100,
                        objectFit: 'contain',
                        mr: 2
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                        {formatPrice(item.price)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          type="number"
                          inputProps={{ 
                            min: 1, 
                            style: { 
                              textAlign: 'center',
                              width: '40px'
                            }
                          }}
                          variant="outlined"
                          size="small"
                          sx={{ mx: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => removeItem(item.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Price</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="center">Subtotal</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CardMedia
                            component="img"
                            image={item.image}
                            alt={item.name}
                            sx={{ 
                              width: 80,
                              height: 80,
                              objectFit: 'contain',
                              mr: 2
                            }}
                          />
                          <Typography variant="body1">
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <TextField
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            type="number"
                            inputProps={{ 
                              min: 1, 
                              style: { 
                                textAlign: 'center',
                                width: '50px'
                              }
                            }}
                            variant="outlined"
                            size="small"
                            sx={{ mx: 1 }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {formatPrice(item.price * item.quantity)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => removeItem(item.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 3
          }}>
            <Button 
              variant="outlined" 
              href="/products"
              startIcon={<ArrowBack />}
            >
              Continue Shopping
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
          </Box>
        </Grid>
        
        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1
                }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatPrice(subtotal)}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1
                }}>
                  <Typography variant="body1">Shipping:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {formatPrice(total)}
                  </Typography>
                </Box>
              </Box>
              
              <Button 
                variant="contained" 
                size="large"
                fullWidth
                href="/checkout"
                sx={{ 
                  mb: 2,
                  py: 1.5,
                  borderRadius: '50px'
                }}
              >
                Proceed to Checkout
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                fullWidth
                startIcon={<WhatsApp />}
                sx={{ 
                  py: 1.5,
                  borderRadius: '50px'
                }}
                href={`https://wa.me/254XXXXXXXXX?text=${encodeURIComponent(`I want to order:\n${cartItems.map(item => `${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join('\n')}\n\nTotal: ${formatPrice(total)}`)}`}
                target="_blank"
              >
                Checkout via WhatsApp
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                * Orders above KES 10,000 qualify for free delivery
              </Typography>
            </CardContent>
          </Card>
          
          {/* Promo Code */}
          <Card sx={{ borderRadius: 2, mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Promo Code
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Enter promo code"
                  fullWidth
                  size="small"
                />
                <Button variant="contained" size="small">
                  Apply
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage;