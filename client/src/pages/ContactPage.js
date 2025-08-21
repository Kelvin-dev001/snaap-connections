import React from 'react';
import { Container, Typography, Box, Stack, TextField, Button, Paper } from '@mui/material';
import { LocationOn, Email, Phone } from '@mui/icons-material';

const ContactPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Typography variant="h4" fontWeight={800} mb={2} color="primary.main">
      Contact Us
    </Typography>
    <Typography variant="body1" mb={4} color="text.secondary">
      We'd love to hear from you! Reach out for inquiries, support, or feedback.
    </Typography>
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <LocationOn color="primary" />
          <Typography>Digo Rd Opp Baroda Mall, Mombasa, Kenya.</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Email color="primary" />
          <Typography>
            <a href="mailto:info@snaapconnections.com" style={{ color: 'inherit', textDecoration: 'none' }}>
              info@snaapconnections.com
            </a>
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Phone color="primary" />
          <Typography>
            <a href="tel:+254722800278" style={{ color: 'inherit', textDecoration: 'none' }}>
              +254 722800278
            </a>
          </Typography>
        </Stack>
      </Stack>
    </Paper>
    <Box component="form" noValidate autoComplete="off">
      <Typography variant="h6" mb={2}>Send us a message</Typography>
      <Stack spacing={2}>
        <TextField label="Your Name" variant="outlined" required fullWidth />
        <TextField label="Email Address" variant="outlined" required fullWidth type="email" />
        <TextField label="Message" variant="outlined" required fullWidth multiline minRows={4} />
        <Button variant="contained" color="primary" size="large" sx={{ alignSelf: 'flex-start' }}>Send Message</Button>
      </Stack>
    </Box>
  </Container>
);

export default ContactPage;