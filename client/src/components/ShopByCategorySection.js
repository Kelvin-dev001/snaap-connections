import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardActionArea, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import API from "../api/apiService"; // Adjust path if needed

const ShopByCategorySection = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    API.getCategories()
      .then((res) => {
        const catArr = res.data?.categories || res.data || [];
        // If image path is not absolute, prepend server URL
        const catsWithFullImage = catArr.map(cat => ({
          ...cat,
          // Change 'icon' to 'image' if your backend uses 'image' for categories
          image: cat.image && typeof cat.image === "string" && !cat.image.startsWith("http")
            ? `http://localhost:5000${cat.image}`
            : cat.image
        }));
        if (isMounted) setCategories(catsWithFullImage);
      })
      .catch(() => setCategories([]));
    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      <style>
        {`
        .flip-card {
          perspective: 900px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.7s cubic-bezier(.4,2,.4,1);
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner,
        .flip-card:focus .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
        }
        .flip-card-front {
          background: #fff;
          color: #222;
        }
        .flip-card-back {
          background: #f5f7fa;
          color: #1e3c72;
          transform: rotateY(180deg);
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
                className="flip-card"
                elevation={0}
                sx={{
                  borderRadius: "20px",
                  background: "#fff",
                  color: "primary.main",
                  boxShadow: "0 4px 24px 0 rgba(30,60,114,0.08)",
                  transition: "transform 0.35s cubic-bezier(.4,2,.4,1), box-shadow 0.25s",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "visible",
                  border: "none",
                  minHeight: 180,
                  "&:hover": {
                    boxShadow: "0 10px 32px 0 rgba(30,60,114,0.14)",
                    zIndex: 2
                  }
                }}
                tabIndex={0}
              >
                <CardActionArea
                  sx={{
                    borderRadius: "20px",
                    minHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    bgcolor: "transparent",
                    "&:focus-visible": { outline: "none" }
                  }}
                >
                  <Box className="flip-card-inner" sx={{ width: "100%", height: "100%" }}>
                    {/* Front Face */}
                    <Box className="flip-card-front">
                      <Box
                        sx={{
                          mb: 2.5,
                          mt: 1,
                          width: 80,
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "15px",
                          background: "#fff",
                          boxShadow: "none",
                        }}
                      >
                        {cat.image && typeof cat.image === "string" ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            style={{
                              width: 68,
                              height: 68,
                              objectFit: "contain",
                              borderRadius: 12,
                              background: "#fff"
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 68,
                              height: 68,
                              background: "#f0f0f0",
                              borderRadius: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#bbb",
                              fontSize: 32
                            }}
                          >
                            {cat.name ? cat.name[0] : "?"}
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                          fontSize: "1.10rem",
                          letterSpacing: ".4px",
                          textAlign: "center",
                          textShadow: "none"
                        }}
                      >
                        {cat.name}
                      </Typography>
                    </Box>
                    {/* Back Face */}
                    <Box className="flip-card-back">
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{
                          fontSize: "1.10rem",
                          letterSpacing: ".4px",
                          textAlign: "center"
                        }}
                      >
                        Shop {cat.name}
                      </Typography>
                    </Box>
                  </Box>
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