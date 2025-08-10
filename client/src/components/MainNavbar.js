import React, { useState } from 'react';
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
  Slide,
  Drawer,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { SiBrandfolder } from "react-icons/si";

const menuSections = [
  { label: "All Products", icon: <StorefrontIcon />, link: "/products" },
  { label: "Deals", icon: <LocalOfferIcon />, link: "/deals" },
  { label: "New Arrivals", icon: <StarIcon />, link: "/new-arrivals" },
  { label: "Best Sellers", icon: <StarIcon />, link: "/best-sellers" },
  { label: "Pocket Friendly", icon: <LocalOfferIcon />, link: "/pocket-friendly" },
  // Add more sections as needed
];

const categories = [
  { label: "Smartphones", icon: <CategoryIcon />, link: "/category/smartphones" },
  { label: "Laptops", icon: <CategoryIcon />, link: "/category/laptops" },
  { label: "Accessories", icon: <CategoryIcon />, link: "/category/accessories" },
  // Add more categories as needed
];

const brands = [
  { label: "Samsung", icon: <SiBrandfolder />, link: "/brand/samsung" },
  { label: "Apple", icon: <SiBrandfolder />, link: "/brand/apple" },
  { label: "Xiaomi", icon: <SiBrandfolder />, link: "/brand/xiaomi" },
  { label: "OPPO", icon: <SiBrandfolder />, link: "/brand/oppo" },
  // Add more brands as needed
];

const MainNavbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  // For animation on hamburger
  const handleMenuClick = () => {
    setDrawerOpen(true);
    if (onMenuClick) onMenuClick();
  };

  const handleDrawerClose = () => setDrawerOpen(false);

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
            <IconButton edge="start" color="inherit" onClick={handleMenuClick} sx={{ mr: 1 }}>
              <MenuIcon fontSize="large" />
            </IconButton>
          )}
          <Avatar
            src="/snaap-logo.jpeg"
            sx={{ width: 40, height: 40, mr: 2 }}
            alt="Snaap Connections Logo"
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
            <Fade in>
              <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
                <Button href="/" variant="text" color="inherit">Home</Button>
                <Button href="/products" variant="text" color="inherit">Shop</Button>
                <Button href="/about" variant="text" color="inherit">About</Button>
                <Button href="/contact" variant="text" color="inherit">Contact</Button>
                <Box sx={{ ml: 2, minWidth: 220 }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", bgcolor: "#f4f6fa",
                    px: 2, py: 1, borderRadius: "40px", boxShadow: "0 1px 8px #6dd5ed22"
                  }}>
                    <SearchIcon color="primary" />
                    <InputBase
                      placeholder="Search products, brands, categories..."
                      sx={{ ml: 2, flex: 1, fontSize: "1.07rem" }}
                      inputProps={{ 'aria-label': 'search' }}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}
          <IconButton href="/cart" color="primary" size="large">
            <ShoppingCartIcon />
          </IconButton>
        </Toolbar>
        {/* Hamburger Drawer */}
        <Drawer
          anchor={isMobile ? "right" : "top"}
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{
            sx: {
              width: isMobile ? "92vw" : "100vw",
              maxWidth: 400,
              bgcolor: "background.default",
              borderRadius: isMobile ? "24px 0 0 24px" : "0 0 24px 24px",
              boxShadow: "0 8px 32px #1e3c7222"
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Menu
            </Typography>
            {/* Search inside menu */}
            <Box sx={{
              display: "flex", alignItems: "center", bgcolor: "#f7f8fa",
              px: 2, py: 1, borderRadius: "40px", boxShadow: "0 1px 8px #6dd5ed22", mb: 3
            }}>
              <SearchIcon color="primary" />
              <InputBase
                placeholder="Quick search..."
                sx={{ ml: 2, flex: 1, fontSize: "1.07rem" }}
                inputProps={{ 'aria-label': 'quick search' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              {menuSections.map(section => (
                <ListItem button key={section.label} component="a" href={section.link}>
                  <ListItemIcon>{section.icon}</ListItemIcon>
                  <ListItemText primary={section.label} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Categories</Typography>
            <List>
              {categories.map(cat => (
                <ListItem button key={cat.label} component="a" href={cat.link}>
                  <ListItemIcon>{cat.icon}</ListItemIcon>
                  <ListItemText primary={cat.label} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Brands</Typography>
            <List>
              {brands.map(brand => (
                <ListItem button key={brand.label} component="a" href={brand.link}>
                  <ListItemIcon>{brand.icon}</ListItemIcon>
                  <ListItemText primary={brand.label} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      </AppBar>
    </Slide>
  );
};

export default MainNavbar;