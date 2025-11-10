import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Link,
  Divider,
  Stack
} from '@mui/material';
import { SiTiktok } from "react-icons/si";
import {
  Facebook,
  Instagram,
  WhatsApp,
  LocationOn,
  Email,
  Phone
} from '@mui/icons-material';

const bluishGradient =
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #6dd5ed 100%)';

const shopLinks = [
  { label: 'All Products', href: '/products' },
  { label: 'Smartphones', href: '/products?category=Smartphones' },
  { label: 'Laptops', href: '/products?category=Laptops' },
  { label: 'Earbuds', href: '/products?category=Earbuds' },
  { label: 'Tablets', href: '/products?category=Tablets' },
  { label: 'Smart Watches', href: '/products?category=Smart Watches' }
];

const footerLinks = [
  {
    title: 'Shop',
    links: shopLinks
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/our-story' },
      { label: 'Why Choose Us', href: '/why-us' },
      { label: 'Careers', href: '/careers' }
    ]
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'Returns', href: '/returns' },
      { label: 'Shipping', href: '/shipping' }
    ]
  }
];

const socialLinks = [
  { icon: <Facebook />, href: 'https://www.facebook.com/share/1BF9FWk1w7/', label: 'Facebook' },
  { icon: <SiTiktok />, href: 'https://www.tiktok.com/@snaap_connections?_t=ZM-8yavm2c5wJC&_r=1', label: 'TikTok' },
  { icon: <Instagram />, href: 'https://www.instagram.com/snaap_connections1?igsh=Yzc2dDkyejVqeDZl', label: 'Instagram' },
  { icon: <WhatsApp />, href: 'https://wa.me/254722800278', label: 'WhatsApp' }
];

const animatedGradientStyle = {
  background: bluishGradient,
  backgroundSize: '200% 200%',
  // animation removed
};

// All animations removed, including animatedGradientKeyframes

const Footer = () => (
  <>
    {/* <style>{animatedGradientKeyframes}</style> */}
    {/* AnimatedWaveDivider removed */}
    <Box
      sx={{
        ...animatedGradientStyle,
        color: 'white',
        pt: 8,
        pb: 2,
        mt: 0,
        borderTop: '2.5px solid #1e3c72',
        boxShadow: '0 0 32px 0 rgba(30,60,114,0.13)'
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={6} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img
                src="/snaap-logo.jpeg"
                alt="Snaap Connections"
                width={48}
                height={48}
                style={{
                  marginRight: 16,
                  filter: 'drop-shadow(0 2px 8px #2a5298AA)'
                }}
              />
              <Typography variant="h6" fontWeight={700} sx={{
                color: '#fff',
                textShadow: '0 2px 8px rgba(46,90,162,0.2)'
              }}>
                Snaap Connections
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, maxWidth: 350, opacity: 0.9 }}>
              Your one-stop shop for the latest tech gadgets, unbeatable deals, and exceptional customer service across Kenya.
            </Typography>
            <Stack spacing={1} direction="row" sx={{ mb: 2 }}>
              {socialLinks.map(({ icon, href, label }, idx) => (
                <IconButton
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  color="inherit"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), background 0.25s',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.35)',
                      color: '#2a5298',
                      transform: 'scale(1.17) rotate(-8deg)'
                    }
                  }}
                  aria-label={label}
                >
                  {icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>
          {footerLinks.map(section => (
            <Grid item xs={12} sm={4} md={2.5} key={section.title}>
              <Typography variant="subtitle1" fontWeight={700} sx={{
                color: '#c4e0fc',
                letterSpacing: '1.1px',
                mb: 1.5
              }}>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map(link => (
                  <Link
                    key={link.label}
                    href={link.href}
                    underline="hover"
                    color="inherit"
                    sx={{
                      opacity: 0.87,
                      fontSize: '1rem',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      transition: 'color 0.2s, opacity 0.2s',
                      '&:hover': {
                        color: '#81c2ff',
                        opacity: 1,
                        textShadow: '0 2px 12px #c4e0fc55'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" fontWeight={700}
              sx={{ color: '#c4e0fc', letterSpacing: '1.1px', mb: 1.5 }}>
              Contact Us
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <LocationOn sx={{ color: '#6dd5ed' }} />
              <Typography variant="body2" sx={{ color: '#e6f2ff', opacity: 0.9 }}>
                Digo Rd Opp Baroda Mall, Mombasa, Kenya.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Email sx={{ color: '#6dd5ed' }} />
              <a href="mailto:info@snaapconnections.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#e6f2ff', opacity: 0.9 }}>
                  info@snaapconnections.com
                </Typography>
              </a>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Phone sx={{ color: '#6dd5ed' }} />
              <a href="tel:+254722800278" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#e6f2ff', opacity: 0.9 }}>
                  +254 722800278
                </Typography>
              </a>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{
          my: 4,
          borderColor: 'rgba(255,255,255,0.25)'
        }} />
        <Typography variant="body2" sx={{
          color: '#e6f2ff',
          opacity: 0.7,
          textAlign: 'center'
        }}>
          &copy; {new Date().getFullYear()} Snaap Connections. All rights reserved.
        </Typography>
      </Container>
    </Box>
  </>
);

export default Footer;