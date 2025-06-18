import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Slide
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const MainNavbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Slide appear={false} direction="down" in>
      <AppBar
        position="sticky"
        elevation={4}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          zIndex: theme.zIndex.drawer + 1,
          boxShadow: '0 2px 24px 0 rgba(0,0,0,0.06), 0 0.5px 1.5px 0 rgba(0,0,0,0.03)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onMenuClick} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Avatar
            src="/logo192.png"
            sx={{ width: 40, height: 40, mr: 2 }}
            alt="Site Logo"
          />
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '1.5px'
            }}
            component="a"
            href="/"
          >
            Snaap Connections
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
              <Button href="/" variant="text" color="inherit">Home</Button>
              <Button href="/products" variant="text" color="inherit">Shop</Button>
              <Button href="/about" variant="text" color="inherit">About</Button>
              <Button href="/contact" variant="text" color="inherit">Contact</Button>
            </Box>
          )}
          <IconButton href="/cart" color="primary" size="large">
            <ShoppingCartIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default MainNavbar;