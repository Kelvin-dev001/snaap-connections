import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardActionArea, Avatar } from "@mui/material";
import { Link } from "react-router-dom";
import API from "../api/apiService"; // Adjust the import path if needed

const ShopByBrandSection = () => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    let isMounted = true;
    API.getBrands()
      .then((res) => {
        const brandArr = res.data?.brands || res.data || [];
        const brandsWithFullLogo = brandArr.map(b => ({
          ...b,
          logo: b.logo && !b.logo.startsWith("http")
            ? `http://localhost:5000${b.logo}`
            : b.logo
        }));
        if (isMounted) setBrands(brandsWithFullLogo);
      })
      .catch(() => setBrands([]));
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
          fontFamily: "'Montserrat', 'Roboto', sans-serif",
        }}
      >
        Shop Top Brands
      </Typography>
      <Grid container spacing={{ xs: 2, md: 4 }} justifyContent="center">
        {brands.map((brand, idx) => (
          <Grid item xs={6} sm={4} md={2} key={brand._id || brand.id || idx} sx={{ minWidth: 120 }}>
            <Link
              to={`/products?brand=${encodeURIComponent(brand.name)}`}
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
                  minHeight: 160,
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
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    bgcolor: "transparent",
                    "&:focus-visible": { outline: "none" }
                  }}
                >
                  <Box className="flip-card-inner" sx={{ width: "100%", height: "100%", minHeight: 90 }}>
                    {/* Front Face */}
                    <Box className="flip-card-front">
                      {brand.logo ? (
                        <Avatar
                          src={brand.logo}
                          alt={brand.name}
                          variant="square"
                          sx={{
                            width: 54,
                            height: 54,
                            mb: 1.5,
                            bgcolor: "#fff",
                            boxShadow: "none",
                            objectFit: "contain"
                          }}
                        />
                      ) : (
                        <Avatar
                          variant="square"
                          sx={{
                            width: 54,
                            height: 54,
                            mb: 1.5,
                            bgcolor: "#fff",
                          }}
                        >
                          {brand.name?.charAt(0) || "?"}
                        </Avatar>
                      )}
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                          color: "primary.dark",
                          letterSpacing: 0.8,
                          fontSize: "1rem",
                          textAlign: "center",
                          textShadow: "none",
                        }}
                      >
                        {brand.name}
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
                        Shop {brand.name}
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

export default ShopByBrandSection;