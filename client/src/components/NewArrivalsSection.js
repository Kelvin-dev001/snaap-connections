import React from "react";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  Rating
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

// Example products for demo/testing, replace with your prop or API data
const demoNewArrivals = [
  {
    _id: "101",
    name: "OnePlus 12R",
    price: 65000,
    discountPrice: 70000,
    category: "Smartphones",
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
    thumbnail: "/products/realmegtneo6.jpg",
    images: [],
    rating: 4.5,
    isNew: true,
    badge: "HOT",
  }
];

const BADGE_COLOR = {
  HOT: "error",
  NEW: "success",
  TRENDING: "info"
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(price);

const NewArrivalsSection = ({ products = demoNewArrivals }) => {
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
      {/* Custom CSS for animated card hover and ribbon */}
      <style>
        {`
        @keyframes newArrivalsPop {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.04); }
          100% { transform: scale(1);    }
        }
        .new-arrival-product-card:hover {
          animation: newArrivalsPop 0.7s;
        }
        .ribbon {
          width: 90px;
          height: 28px;
          background: linear-gradient(90deg, #fc466b 0%, #3f5efb 100%);
          color: white;
          position: absolute;
          top: 18px;
          right: -32px;
          z-index: 3;
          text-align: center;
          line-height: 28px;
          letter-spacing: 1px;
          font-size: 0.98rem;
          font-weight: bold;
          border-radius: 8px 0 0 8px;
          box-shadow: 0 4px 14px #fc466b33;
          transform: rotate(24deg);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-shadow: 0 2px 8px #0002;
        }
        .ribbon-success {
          background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
        }
        .ribbon-info {
          background: linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%);
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
        New Arrivals
      </Typography>
      <Slider {...sliderSettings}>
        {products.map((product) => (
          <Box key={product._id} sx={{ px: 2, outline: "none" }}>
            <Card
              className="new-arrival-product-card"
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
                {/* Ribbon - for badges */}
                {product.badge && (
                  <span className={`ribbon ribbon-${BADGE_COLOR[product.badge] || ""}`}>
                    {product.badge === "HOT" && <LocalFireDepartmentIcon sx={{ fontSize: 18, mr: 0.5 }} />}
                    {product.badge}
                  </span>
                )}
                {/* Chip for new */}
                {product.isNew && (
                  <Chip
                    label="New"
                    size="small"
                    color="success"
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      fontWeight: 600,
                      zIndex: 2,
                      bgcolor: "#38ef7d",
                      color: "#fff",
                      fontSize: "0.92rem",
                      boxShadow: "0 1px 8px #38ef7d33"
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
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 2,
                    borderRadius: "50px",
                    fontWeight: 700,
                    color: "primary.main",
                    borderColor: "#6dd5ed",
                    textTransform: "none",
                    fontSize: "1.07rem",
                    transition: "all 0.19s cubic-bezier(.4,2,.4,1)",
                    "&:hover": {
                      background: "linear-gradient(96deg,#6dd5ed 10%,#1e3c72 90%)",
                      color: "#fff",
                      borderColor: "transparent",
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

export default NewArrivalsSection;