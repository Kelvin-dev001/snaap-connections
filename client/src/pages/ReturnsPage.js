import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ReturnsPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Typography variant="h4" fontWeight={800} mb={2} color="primary.main">
      Returns & Exchanges
    </Typography>
    <Typography variant="body1" mb={3} color="text.secondary">
      We want you to love your purchase! If you’re not satisfied, here’s how we can help.
    </Typography>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Eligibility:</Typography>
      <Typography>
        - Returns/exchanges are accepted within 7 days of delivery.<br />
        - Products must be unused, in original packaging, and with all accessories.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>How to Return:</Typography>
      <Typography>
        1. Contact us at <a href="mailto:info@snaapconnections.com">info@snaapconnections.com</a> or WhatsApp.<br />
        2. Provide your order number and reason for return.<br />
        3. We’ll arrange pickup or advise drop-off.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Refunds:</Typography>
      <Typography>
        - Approved refunds are processed within 2-5 business days.<br />
        - Refunds are made via your original payment method.
      </Typography>
    </Box>
    <Box mb={2}>
      <Typography variant="h6" fontWeight={700} mb={1}>Exceptions:</Typography>
      <Typography>
        - Opened earphones/headphones/smartwatches (for hygiene reasons) may not be eligible.<br />
        - Custom orders and digital products are non-returnable.
      </Typography>
    </Box>
  </Container>
);

export default ReturnsPage;