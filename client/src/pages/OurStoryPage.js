import React from 'react';
import { Container, Typography, Box, Avatar, Stack } from '@mui/material';

const OurStoryPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Stack alignItems="center" mb={4}>
      <Avatar src="/snaap-logo.jpeg" sx={{ width: 80, height: 80, mb: 2 }} />
      <Typography variant="h4" fontWeight={800} color="primary.main">
        Our Story
      </Typography>
    </Stack>
    <Typography variant="body1" color="text.secondary" mb={2}>
      Snaap Connections was founded in 2018 in Mombasa, Kenya, born out of a passion for making technology affordable, accessible, and enjoyable for all. Our founder—a tech enthusiast and entrepreneur—dreamed of a store where everyone could find the latest gadgets, honest advice, and real customer care.
    </Typography>
    <Typography variant="body1" color="text.secondary" mb={2}>
      Over the years, we've grown from a small retail outlet to an online-first destination for smartphones, laptops, wearables, and more. We’re proud to serve thousands of customers across Kenya, delivering not just products, but trust and reliability.
    </Typography>
    <Typography variant="body1" color="text.secondary" mb={2}>
      Our mission is simple: empower Kenyans with authentic tech, unbeatable deals, and support whenever you need it.
    </Typography>
    <Box mt={4}>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Why Choose Snaap Connections?
      </Typography>
      <Typography>
        - Authentic products, directly sourced from top brands.<br />
        - Transparent pricing with no hidden charges.<br />
        - Friendly, knowledgeable support team.<br />
        - Fast delivery nationwide.<br />
        - Community-focused: we regularly sponsor local tech initiatives.
      </Typography>
    </Box>
  </Container>
);

export default OurStoryPage;