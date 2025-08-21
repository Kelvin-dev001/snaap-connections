import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ShippingPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Typography variant="h4" fontWeight={800} mb={2} color="primary.main">
      Shipping Information
    </Typography>
    <Typography variant="body1" mb={3} color="text.secondary">
      Fast, reliable delivery everywhere in Kenya!
    </Typography>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Delivery Times:</Typography>
      <Typography>
        - Mombasa: Same-day delivery for orders placed before 3pm.<br />
        - Nairobi & other towns: 1-3 business days.<br />
        - Remote areas: May take up to 5 business days.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Shipping Fees:</Typography>
      <Typography>
        - Mombasa: Free delivery for orders above KES 10,000.<br />
        - Other locations: Fees vary by weight and location, shown at checkout.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Order Tracking:</Typography>
      <Typography>
        - Receive SMS/WhatsApp updates with your tracking link.<br />
        - Contact our support for real-time order updates.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Important Notes:</Typography>
      <Typography>
        - Double-check your delivery address during checkout.<br />
        - If you have special delivery needs, contact us before placing your order.
      </Typography>
    </Box>
  </Container>
);

export default ShippingPage;