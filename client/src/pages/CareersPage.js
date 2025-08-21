import React from 'react';
import { Container, Typography, Box, Stack, Button } from '@mui/material';

const CareersPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Typography variant="h4" fontWeight={800} mb={2} color="primary.main">
      Careers at Snaap Connections
    </Typography>
    <Typography variant="body1" mb={4} color="text.secondary">
      Join Kenya’s leading tech retail team! We’re always looking for energetic, passionate people to help us grow and serve our customers better.
    </Typography>
    <Box mb={4}>
      <Typography variant="h6" fontWeight={700} mb={1}>Current Openings:</Typography>
      <Typography>
        - Sales & Customer Experience<br />
        - Content Creator (Social Media, Blog)<br />
        - Logistics & Delivery<br />
        - Tech Support
      </Typography>
    </Box>
    <Box mb={4}>
      <Typography variant="h6" fontWeight={700} mb={1}>Why Work With Us?</Typography>
      <Typography>
        - Modern, friendly work environment<br />
        - Opportunities for career growth<br />
        - Staff discounts and perks<br />
        - Training and mentorship
      </Typography>
    </Box>
    <Stack direction="row" spacing={2} mt={2}>
      <Button
        component="a"
        href="mailto:info@snaapconnections.com?subject=Job Application"
        variant="contained"
        color="primary"
        size="large"
      >
        Apply Now
      </Button>
      <Button
        component="a"
        href="/contact"
        variant="outlined"
        color="primary"
        size="large"
      >
        Contact HR
      </Button>
    </Stack>
  </Container>
);

export default CareersPage;