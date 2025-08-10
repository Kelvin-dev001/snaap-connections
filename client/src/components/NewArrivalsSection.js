import React from "react";
import Slider from "react-slick";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import ProductCard from "./ProductCard";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

// Example products for demo/testing, replace with your prop or API data
const demoNewArrivals = [
  {
    _id: "101",
    name: "OnePlus 12R",
    price: 65000,
    discountPrice: 70000,
    category: "Smartphones",
    brand: "OnePlus",
    thumbnail: "/products/oneplus12r.jpg",
    images: [],
    rating: 4.7,
    isNew: true,
    badge: "HOT",
  },
  {
    _id: "102",
    name: "Vivo V30 Pro",
    price: 58000,
    discountPrice: 62000,
    category: "Smartphones",
    brand: "Vivo",
    thumbnail: "/products/vivov30pro.jpg",
    images: [],
    rating: 4.6,
    isNew: true,
    badge: "NEW",
  },
  {
    _id: "103",
    name: "Google Pixel 8a",
    price: 78000,
    discountPrice: null,
    category: "Smartphones",
    brand: "Google",
    thumbnail: "/products/pixel8a.jpg",
    images: [],
    rating: 4.8,
    isNew: true,
    badge: "TRENDING",
  },
  {
    _id: "104",
    name: "Realme GT Neo 6",
    price: 43000,
    discountPrice: 48000,
    category: "Smartphones",
    brand: "Realme",
    thumbnail: "/products/realmegtneo6.jpg",
    images: [],
    rating: 4.5,
    isNew: true,
    badge: "HOT",
  }
];

const NewArrivalsSection = ({ products = demoNewArrivals, title = "New Smartphones in Kenya" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Settings for the product carousel
  const sliderSettings = {
    dots: false,
    infinite: products.length > (isMobile ? 1 : isTablet ? 2 : 4),
    speed: 600,
    slidesToShow: isMobile ? 1 : isTablet ? 2 : 4,
    slidesToScroll: isMobile ? 1 : isTablet ? 2 : 4,
    arrows: !isMobile,
    autoplay: true,
    autoplaySpeed: 5300,
    cssEase: "cubic-bezier(.4,2,.4,1)",
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 900, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      <Typography
        variant="h4"
        align="center"
        sx={{
          fontWeight: 700,
          mb: 4,
          color: "primary.main",
          letterSpacing: 1.2,
          fontFamily: "'Montserrat', 'Roboto', sans-serif"
        }}
      >
        {title}
      </Typography>
      <Slider {...sliderSettings}>
        {products.map((product) => (
          <Box key={product._id} sx={{ px: 2, outline: "none" }}>
            <ProductCard
              product={product}
              badge={product.badge}
              showWhatsApp={true}
              showViewBtn={true}
              sx={{
                minHeight: 420,
                borderRadius: "22px",
                boxShadow: "0 4px 24px 0 rgba(30,60,114,0.12)",
                transition: "transform 0.28s cubic-bezier(.4,2,.4,1), box-shadow 0.28s",
                bgcolor: "#fff",
                "&:hover": {
                  boxShadow: "0 12px 46px 0 #1e3c72cc",
                  transform: "translateY(-9px) scale(1.03)",
                  zIndex: 3
                }
              }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default NewArrivalsSection;