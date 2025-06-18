import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  Divider, Container, TextField, FormControlLabel,
  Checkbox, Radio, RadioGroup, Stepper, Step,
  StepLabel, useTheme, useMediaQuery
} from '@mui/material';
import {
  WhatsApp, ArrowBack, LocalShipping, Payment, Assignment
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const CheckoutPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [orderData, setOrderData] = useState({
    deliveryMethod: 'delivery',
    address: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      street: '',
      city: 'Nairobi',
      postalCode: '',
      notes: ''
    },
    paymentMethod: 'whatsapp',
    agreeToTerms: false
  });

  const steps = ['Delivery', 'Payment', 'Confirmation'];
  
  // Mock cart data - in a real app, this would come from your cart state or API
  const cartItems = [
    { id: 1, name: 'iPhone 14 Pro Max', price: 159999, quantity: 1, image: 'https://example.com/image1.jpg' },
    { id: 2, name: 'AirPods Pro 2', price: 34999, quantity: 2, image: 'https://example.com/image2.jpg' }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = orderData.deliveryMethod === 'delivery' ? (subtotal > 10000 ? 0 : 500) : 0;
  const total = subtotal + shippingFee;

  const handleNext = () => {
    if (activeStep === steps.length - 1) return;
    
    // Validate current step before proceeding
    if (activeStep === 0 && !validateDeliveryStep()) return;
    if (activeStep === 1 && !validatePaymentStep()) return;
    
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateDeliveryStep = () => {
    const errors = [];
    const { firstName, lastName, phone, email, street, city } = orderData.address;
    
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!phone) errors.push('Phone number is required');
    if (!email) errors.push('Email is required');
    if (!street) errors.push('Street address is required');
    if (!city) errors.push('City is required');
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const validatePaymentStep = () => {
    if (!orderData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleDeliveryMethodChange = (e) => {
    setOrderData(prev => ({
      ...prev,
      deliveryMethod: e.target.value
    }));
  };

  const handlePaymentMethodChange = (e) => {
    setOrderData(prev => ({
      ...prev,
      paymentMethod: e.target.value
    }));
  };

  const handleTermsChange = (e) => {
    setOrderData(prev => ({
      ...prev,
      agreeToTerms: e.target.checked
    }));
  };

  const submitOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare order data
      const orderPayload = {
        products: cartItems.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        phone: orderData.address.phone,
        email: orderData.address.email,
        shippingAddress: orderData.deliveryMethod === 'delivery' ? {
          street: orderData.address.street,
          city: orderData.address.city,
          postalCode: orderData.address.postalCode,
          country: 'Kenya'
        } : null,
        deliveryMethod: orderData.deliveryMethod,
        paymentMethod: orderData.paymentMethod,
        subtotal,
        shippingFee,
        total
      };

      // Submit order to backend
      const response = await API.createOrder(orderPayload);
      
      // Clear cart on successful order
      await API.clearCart();
      
      // Proceed to confirmation
      handleNext();
      
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Delivery Method
            </Typography>
            <RadioGroup 
              value={orderData.deliveryMethod} 
              onChange={handleDeliveryMethodChange}
              sx={{ mb: 4 }}
            >
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  borderColor: orderData.deliveryMethod === 'delivery' ? theme.palette.primary.main : 'divider',
                  backgroundColor: orderData.deliveryMethod === 'delivery' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="delivery" color="primary" />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Home Delivery
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Get your order delivered to your doorstep
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {subtotal > 10000 ? (
                          <Typography component="span" color="success.main">
                            Free delivery for orders above KES 10,000
                          </Typography>
                        ) : (
                          `Delivery fee: ${formatPrice(500)}`
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                variant="outlined" 
                sx={{ 
                  borderColor: orderData.deliveryMethod === 'pickup' ? theme.palette.primary.main : 'divider',
                  backgroundColor: orderData.deliveryMethod === 'pickup' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="pickup" color="primary" />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Pickup Station
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pick up your order from our Nairobi store
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                        Free pickup
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </RadioGroup>
            
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {orderData.deliveryMethod === 'delivery' ? 'Delivery Address' : 'Pickup Information'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={orderData.address.firstName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={orderData.address.lastName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={orderData.address.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={orderData.address.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              {orderData.deliveryMethod === 'delivery' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      label="Street Address"
                      name="street"
                      value={orderData.address.street}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="City"
                      name="city"
                      value={orderData.address.city}
                      onChange={handleInputChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Postal Code"
                      name="postalCode"
                      value={orderData.address.postalCode}
                      onChange={handleInputChange}
                      fullWidth
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Additional Notes (Optional)"
                  name="notes"
                  value={orderData.address.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Payment Method
            </Typography>
            <RadioGroup 
              value={orderData.paymentMethod} 
              onChange={handlePaymentMethodChange}
              sx={{ mb: 4 }}
            >
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  borderColor: orderData.paymentMethod === 'whatsapp' ? theme.palette.primary.main : 'divider',
                  backgroundColor: orderData.paymentMethod === 'whatsapp' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="whatsapp" color="primary" />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        WhatsApp Checkout
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete your order via WhatsApp with our sales team
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  borderColor: orderData.paymentMethod === 'mpesa' ? theme.palette.primary.main : 'divider',
                  backgroundColor: orderData.paymentMethod === 'mpesa' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="mpesa" color="primary" />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        M-Pesa
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pay via M-Pesa (You'll receive a payment request)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              {orderData.deliveryMethod === 'delivery' && (
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: orderData.paymentMethod === 'cod' ? theme.palette.primary.main : 'divider',
                    backgroundColor: orderData.paymentMethod === 'cod' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Radio value="cod" color="primary" />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Cash on Delivery
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pay when you receive your order
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Available for Nairobi deliveries only
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </RadioGroup>
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={orderData.agreeToTerms}
                  onChange={handleTermsChange}
                  color="primary"
                />
              }
              label="I agree to the terms and conditions"
              sx={{ mb: 2 }}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ 
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Assignment sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Order Confirmed!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Thank you for your order. Your order number is <strong>#ORD-{Math.floor(Math.random() * 10000)}</strong>.
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {orderData.paymentMethod === 'whatsapp' ? (
                "We've sent you a WhatsApp message to confirm your order details and payment."
              ) : orderData.paymentMethod === 'mpesa' ? (
                "You'll receive an M-Pesa payment request shortly. Please complete the payment to confirm your order."
              ) : (
                "Your order will be prepared for delivery. Our delivery agent will contact you when they're on the way."
              )}
            </Typography>
            <Button 
              variant="contained" 
              href="/products"
              sx={{ 
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                mr: 2
              }}
            >
              Continue Shopping
            </Button>
            {orderData.paymentMethod === 'whatsapp' && (
              <Button 
                variant="outlined" 
                startIcon={<WhatsApp />}
                href={`https://wa.me/254XXXXXXXXX?text=Order%20ID:%20${Math.floor(Math.random() * 10000)}`}
                target="_blank"
                sx={{ 
                  borderRadius: '50px',
                  px: 4,
                  py: 1.5
                }}
              >
                Open WhatsApp
              </Button>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorAlert error={error} onClose={() => setError(null)} />
        </Box>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <Grid container spacing={4}>
        {/* Checkout Form */}
        <Grid item xs={12} md={7}>
          {renderStepContent(activeStep)}
          
          {activeStep < steps.length - 1 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 4
            }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ 
                  borderRadius: '50px',
                  px: 4,
                  py: 1.5
                }}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={activeStep === steps.length - 2 ? submitOrder : handleNext}
                disabled={loading || (activeStep === 1 && !orderData.agreeToTerms)}
                sx={{ 
                  borderRadius: '50px',
                  px: 4,
                  py: 1.5
                }}
              >
                {loading ? (
                  <LoadingSpinner size={24} />
                ) : activeStep === steps.length - 2 ? (
                  'Place Order'
                ) : (
                  'Continue'
                )}
              </Button>
            </Box>
          )}
        </Grid>
        
        {/* Order Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {cartItems.map((item) => (
                  <Box 
                    key={item.id} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1.5
                    }}
                  >
                    <Typography variant="body1">
                      {item.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body1">
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </Box>
                ))}
                
                <Divider sx={{ my: 2 }} />
                
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
              
              {activeStep === 1 && orderData.paymentMethod === 'whatsapp' && (
                <Button 
                  variant="contained" 
                  size="large"
                  fullWidth
                  startIcon={<WhatsApp />}
                  sx={{ 
                    mb: 2,
                    py: 1.5,
                    borderRadius: '50px'
                  }}
                  onClick={submitOrder}
                  disabled={loading || !orderData.agreeToTerms}
                >
                  {loading ? (
                    <LoadingSpinner size={24} />
                  ) : (
                    'Complete Order via WhatsApp'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Delivery Info */}
          {orderData.deliveryMethod === 'delivery' && activeStep === 0 && (
            <Card sx={{ borderRadius: 2, mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalShipping color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Delivery Information
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Delivery Time:</strong> 1-3 business days
                </Typography>
                <Typography variant="body2">
                  <strong>Note:</strong> Orders are processed within 24 hours. Delivery times may vary depending on your location.
                </Typography>
              </CardContent>
            </Card>
          )}
          
          {/* Payment Info */}
          {activeStep === 1 && (
            <Card sx={{ borderRadius: 2, mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Payment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Payment Information
                  </Typography>
                </Box>
                {orderData.paymentMethod === 'whatsapp' && (
                  <Typography variant="body2">
                    You'll be redirected to WhatsApp to confirm your order details and complete payment with our sales team.
                  </Typography>
                )}
                {orderData.paymentMethod === 'mpesa' && (
                  <Typography variant="body2">
                    You'll receive an M-Pesa payment request on your phone. Please enter your M-Pesa PIN to complete payment.
                  </Typography>
                )}
                {orderData.paymentMethod === 'cod' && (
                  <Typography variant="body2">
                    Pay with cash when your order is delivered. Exact amount is required.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;