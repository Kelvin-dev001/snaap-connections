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
import {
  Facebook,
  Twitter,
  Instagram,
  WhatsApp,
  LocationOn,
  Email,
  Phone
} from '@mui/icons-material';

// Bluish gradient for background
const bluishGradient =
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #6dd5ed 100%)';

const footerLinks = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/products' },
      { label: 'Brands', href: '/brands' },
      { label: 'Categories', href: '/categories' },
      { label: 'Deals', href: '/deals' }
    ]
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/about' },
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
  { icon: <Facebook />, href: 'https://facebook.com/', label: 'Facebook' },
  { icon: <Twitter />, href: 'https://twitter.com/', label: 'Twitter' },
  { icon: <Instagram />, href: 'https://instagram.com/', label: 'Instagram' },
  { icon: <WhatsApp />, href: 'https://wa.me/254759293030', label: 'WhatsApp' }
];

// Keyframes for bluish animated gradient
const animatedGradientStyle = {
  background: bluishGradient,
  backgroundSize: '200% 200%',
  animation: 'gradientMove 8s ease-in-out infinite'
};

const animatedGradientKeyframes = `
@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 50% 100%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 50% 0%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Animated Wave Keyframes */
@keyframes waveAnimation {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

const AnimatedWaveDivider = () => (
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      height: 70,
      marginTop: '-1px', // eliminate any gap
      overflow: 'hidden',
      background: 'transparent'
    }}
  >
    <Box
      component="svg"
      viewBox="0 0 1440 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        width: '200%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        animation: 'waveAnimation 16s linear infinite'
      }}
    >
      <path
        d="
          M0,40 
          C360,80 1080,0 1440,40 
          L1440,70 L0,70 Z
        "
        fill="url(#waveGradient)"
        fillOpacity="0.38"
      />
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="35" x2="0" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6dd5ed" />
          <stop offset="1" stopColor="#1e3c72" />
        </linearGradient>
      </defs>
    </Box>
    <Box
      component="svg"
      viewBox="0 0 1440 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      sx={{
        width: '200%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.7,
        animation: 'waveAnimation 24s linear infinite',
        animationDelay: '0.5s'
      }}
    >
      <path
        d="
          M0,50 
          C360,70 1080,20 1440,50 
          L1440,70 L0,70 Z
        "
        fill="url(#waveGradient2)"
        fillOpacity="0.6"
      />
      <defs>
        <linearGradient id="waveGradient2" x1="0" y1="35" x2="0" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3c72" />
          <stop offset="1" stopColor="#6dd5ed" />
        </linearGradient>
      </defs>
    </Box>
  </Box>
);

const Footer = () => (
  <>
    {/* Inject the animated gradient & wave CSS keyframes only once */}
    <style>{animatedGradientKeyframes}</style>
    <AnimatedWaveDivider />
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
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img
                src="/logo192.png"
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
              Your one-stop shop for the latest tech gadgets, unbeatable deals, and exceptional customer service across Kenya and beyond.
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

          {/* Footer Navigation */}
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

          {/* Contact */}
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle1" fontWeight={700}
              sx={{ color: '#c4e0fc', letterSpacing: '1.1px', mb: 1.5 }}>
              Contact Us
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <LocationOn sx={{ color: '#6dd5ed' }} />
              <Typography variant="body2" sx={{ color: '#e6f2ff', opacity: 0.9 }}>
                Nairobi, Kenya
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
              <a href="tel:+254759293030" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography variant="body2" sx={{ color: '#e6f2ff', opacity: 0.9 }}>
                  +254 759 293030
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