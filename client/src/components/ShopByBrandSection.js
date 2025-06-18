import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardActionArea, Avatar } from "@mui/material";
import { Link } from "react-router-dom";
import API from "../api/apiService"; // Adjust the import path if needed

const colors = [
  "linear-gradient(120deg, #6dd5ed 0%, #2193b0 100%)",
  "linear-gradient(120deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(120deg, #43cea2 0%, #185a9d 100%)",
  "linear-gradient(120deg, #614385 0%, #516395 100%)",
  "linear-gradient(120deg, #02aab0 0%, #00cdac 100%)",
  "linear-gradient(120deg, #396afc 0%, #2948ff 100%)"
];

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
        @keyframes brand-glow {
          0% { box-shadow: 0 0 0 0 rgba(30,60,114,0.14); }
          50% { box-shadow: 0 4px 28px 0 rgba(30,60,114,0.22); }
          100% { box-shadow: 0 0 0 0 rgba(30,60,114,0.14); }
        }
        @keyframes brandCardPop {
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1);    }
        }
        .brand-card-flip {
          perspective: 900px;
        }
        .brand-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(.4,2,.4,1);
          transform-style: preserve-3d;
        }
        .brand-card-flip:hover .brand-card-inner,
        .brand-card-flip:focus .brand-card-inner {
          transform: rotateY(180deg);
        }
        .brand-card-front, .brand-card-back {
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
        .brand-card-front {
          background: rgba(255,255,255,0.8);
          box-shadow: 0 2px 20px 0 rgba(109,213,237,0.07);
          transition: box-shadow 0.4s;
          border: 1.5px solid #e3f3ff;
          animation: brand-glow 3.8s ease-in-out infinite;
        }
        .brand-card-flip:hover .brand-card-front,
        .brand-card-flip:focus .brand-card-front {
          box-shadow: 0 8px 32px 0 #6dd5ed44, 0 1.5px 12px 0 #1e3c7233;
          border-color: #6dd5ed;
        }
        .brand-card-back {
          background: linear-gradient(120deg, #6dd5ed 0%, #1e3c72 100%);
          color: #fff;
          transform: rotateY(180deg);
          box-shadow: 0 4px 24px #1e3c7265;
          border: 1.5px solid #6dd5ed;
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
                className="brand-card-flip"
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
                    animation: "brandCardPop 0.8s",
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
                  <Box className="brand-card-inner" sx={{ minHeight: 90 }}>
                    {/* Front Face */}
                    <Box className="brand-card-front">
                      {brand.logo ? (
                        <Avatar
                          src={brand.logo}
                          alt={brand.name}
                          variant="square"
                          sx={{
                            width: 54,
                            height: 54,
                            mb: 1.5,
                            bgcolor: "transparent",
                            boxShadow: "0 2px 12px #6dd5ed22",
                            objectFit: "contain",
                            transition: "transform 0.5s cubic-bezier(.4,2,.4,1)",
                            "&:hover": {
                              transform: "scale(1.12) rotate(-7deg)",
                            },
                          }}
                        />
                      ) : (
                        <Avatar
                          variant="square"
                          sx={{
                            width: 54,
                            height: 54,
                            mb: 1.5,
                            bgcolor: "#e3f3ff",
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
                          textShadow: "0 2px 10px #6dd5ed33",
                        }}
                      >
                        {brand.name}
                      </Typography>
                    </Box>
                    {/* Back Face */}
                    <Box className="brand-card-back">
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{
                          fontSize: "1.08rem",
                          letterSpacing: 0.7,
                          textShadow: "0 2px 12px #1e3c7234",
                        }}
                      >
                        Shop {brand.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          opacity: 0.92,
                          fontWeight: 500,
                          letterSpacing: 0.2,
                        }}
                      >
                        Explore latest {brand.name} devices
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