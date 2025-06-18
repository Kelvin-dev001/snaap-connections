import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardActionArea, CardContent } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import { Link } from "react-router-dom";
import API from "../api/apiService"; // Adjust path if needed

const colors = [
  "linear-gradient(120deg, #6dd5ed 0%, #2193b0 100%)",
  "linear-gradient(120deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(120deg, #43cea2 0%, #185a9d 100%)",
  "linear-gradient(120deg, #614385 0%, #516395 100%)",
  "linear-gradient(120deg, #02aab0 0%, #00cdac 100%)",
  "linear-gradient(120deg, #396afc 0%, #2948ff 100%)"
];

const ShopByCategorySection = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    API.getCategories()
      .then((res) => {
        // Support both { data: [...] } and [...] returns
        const catArr = res.data?.categories || res.data || [];
        // If icon path is not absolute, prepend server URL
        const catsWithFullIcon = catArr.map(cat => ({
          ...cat,
          icon: cat.icon && typeof cat.icon === "string" && !cat.icon.startsWith("http")
            ? `http://localhost:5000${cat.icon}` // Adjust if your backend is deployed elsewhere
            : cat.icon
        }));
        if (isMounted) setCategories(catsWithFullIcon);
      })
      .catch(() => setCategories([]));
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      <style>
        {`
        @keyframes categoryCardPop {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1);    }
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
        Shop by Category
      </Typography>
      <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
        {categories.map((cat, idx) => (
          <Grid item xs={6} sm={4} md={2} key={cat._id || cat.name} sx={{ minWidth: 120 }}>
            <Link
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: "20px",
                  background: colors[idx % colors.length],
                  color: "#fff",
                  boxShadow: "0 4px 24px 0 rgba(30,60,114,0.13)",
                  transition: "transform 0.35s cubic-bezier(.4,2,.4,1), box-shadow 0.25s",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "visible",
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.04)",
                    boxShadow: "0 10px 32px 0 #1e3c72cc",
                    animation: "categoryCardPop 0.8s",
                    zIndex: 2
                  }
                }}
                tabIndex={0}
              >
                <CardActionArea
                  sx={{
                    borderRadius: "20px",
                    minHeight: 128,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    bgcolor: "transparent",
                    "&:focus-visible": { outline: "none" }
                  }}
                >
                  <Box
                    sx={{
                      mb: 2.5,
                      mt: 1,
                      width: 54,
                      height: 54,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "15px",
                      background: "rgba(255,255,255,0.17)",
                      boxShadow: "0 2px 12px #6dd5ed22",
                      fontSize: 40
                    }}
                  >
                    {cat.icon && typeof cat.icon === "string"
                      ? <img src={cat.icon} alt={cat.name} style={{ width: 40, height: 40, objectFit: "contain" }} />
                      : <CategoryIcon fontSize="large" />}
                  </Box>
                  <CardContent sx={{ p: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{
                        fontSize: "1.10rem",
                        letterSpacing: ".4px",
                        textAlign: "center",
                        textShadow: "0 2px 10px #1e3c7244"
                      }}
                    >
                      {cat.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ShopByCategorySection;