import React from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Rating
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

// Example products for demo/testing, replace with your prop or API data
const demoProducts = [
  {
    _id: "1",
    name: "Samsung Galaxy S24 Ultra",
    price: 105000,
    discountPrice: 115000,
    category: "Smartphones",
    thumbnail: "/products/s24ultra.jpg",
    images: [],
    rating: 4.8,
    isFeatured: true,
  },
  {
    _id: "2",
    name: "Apple iPhone 15 Pro",
    price: 160000,
    discountPrice: null,
    category: "Smartphones",
    thumbnail: "/products/iphone15pro.jpg",
    images: [],
    rating: 4.9,
    isFeatured: true,
  },
  {
    _id: "3",
    name: "Xiaomi Redmi Note 13",
    price: 42000,
    discountPrice: 48000,
    category: "Smartphones",
    thumbnail: "/products/redminote13.jpg",
    images: [],
    rating: 4.5,
    isFeatured: true,
  },
  {
    _id: "4",
    name: "OPPO Reno11 5G",
    price: 53000,
    discountPrice: 58000,
    category: "Smartphones",
    thumbnail: "/products/reno11.jpg",
    images: [],
    rating: 4.6,
    isFeatured: true,
  }
];

const formatPrice = (price) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(price);

const FeaturedProductsSection = ({ products = demoProducts }) => {
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
    autoplaySpeed: 5200,
    cssEase: "cubic-bezier(.4,2,.4,1)",
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 900, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      {/* Custom CSS for animated card hover */}
      <style>
        {`
        @keyframes featuredCardPop {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.04); }
          100% { transform: scale(1);    }
        }
        .featured-product-card:hover {
          animation: featuredCardPop 0.7s;
        }
        `}
      </style>
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
        Featured Products
      </Typography>
      <Slider {...sliderSettings}>
        {products.map((product) => (
          <Box key={product._id} sx={{ px: 2, outline: "none" }}>
            <Card
              className="featured-product-card"
              sx={{
                borderRadius: "22px",
                boxShadow: "0 4px 24px 0 rgba(30,60,114,0.12)",
                transition: "transform 0.28s cubic-bezier(.4,2,.4,1), box-shadow 0.28s",
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "visible",
                bgcolor: "#fff",
                "&:hover": {
                  boxShadow: "0 12px 46px 0 #1e3c72cc",
                  transform: "translateY(-9px) scale(1.03)",
                  zIndex: 3
                }
              }}
              elevation={0}
            >
              <Box sx={{ position: "relative", pt: 3, px: 2 }}>
                <CardMedia
                  component="img"
                  height={isMobile ? 160 : 210}
                  image={
                    product.thumbnail ||
                    (product.images && product.images[0]) ||
                    "/fallback.png"
                  }
                  alt={product.name}
                  sx={{
                    objectFit: "contain",
                    mx: "auto",
                    maxHeight: isMobile ? 160 : 210,
                    borderRadius: "18px",
                    boxShadow: "0px 2px 18px #6dd5ed33"
                  }}
                />
                {product.isFeatured && (
                  <Chip
                    label="Featured"
                    size="small"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      fontWeight: 600,
                      zIndex: 2,
                      bgcolor: "#6dd5ed",
                      color: "#fff",
                      fontSize: "0.92rem",
                      boxShadow: "0 1px 8px #6dd5ed33"
                    }}
                  />
                )}
              </Box>
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {product.category}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{
                    color: "#1e3c72",
                    textShadow: "0 2px 8px #6dd5ed22"
                  }}
                >
                  {product.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Rating
                    value={product.rating || 4.5}
                    precision={0.1}
                    readOnly
                    size="small"
                    icon={<StarIcon fontSize="inherit" htmlColor="#6dd5ed" />}
                    emptyIcon={<StarIcon fontSize="inherit" htmlColor="#e0e0e0" />}
                  />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {product.rating?.toFixed(1) || "4.5"}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    color="primary"
                    fontWeight={700}
                  >
                    {formatPrice(product.price)}
                  </Typography>
                  {product.discountPrice && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      {formatPrice(product.discountPrice)}
                    </Typography>
                  )}
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    borderRadius: "50px",
                    fontWeight: 700,
                    background:
                      "linear-gradient(96deg,#1e3c72 50%,#6dd5ed 100%)",
                    color: "#fff",
                    textTransform: "none",
                    boxShadow: "0 2px 12px #6dd5ed33",
                    fontSize: "1.07rem",
                    transition: "all 0.19s cubic-bezier(.4,2,.4,1)",
                    "&:hover": {
                      background:
                        "linear-gradient(96deg,#6dd5ed 10%,#1e3c72 90%)",
                      color: "#fff",
                      boxShadow: "0 2px 24px #1e3c72cc",
                      transform: "scale(1.06)"
                    }
                  }}
                  href={`/products/${product._id}`}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default FeaturedProductsSection;