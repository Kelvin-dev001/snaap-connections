import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardActionArea } from "@mui/material";
import { Link } from "react-router-dom";
import API from "../api/apiService";

const ShopByCategorySection = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    API.getCategories()
      .then((res) => {
        const catArr = res.data?.categories || res.data || [];
        const catsWithFullImage = catArr.map(cat => ({
          ...cat,
          image: cat.icon && typeof cat.icon === "string"
            ? cat.icon
            : "",
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
        .scroll-row {
          display: flex;
          flex-direction: row;
          overflow-x: auto;
          gap: 18px;
          scrollbar-width: thin;
        }
        .scroll-row::-webkit-scrollbar {
          height: 8px;
          background: #f5f7fa;
        }
        .scroll-row::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 4px;
        }
        .flip-card {
          perspective: 900px;
          min-width: 140px;
          max-width: 160px;
          flex: 0 0 auto;
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
      <Box className="scroll-row" sx={{ px: { xs: 1, md: 3 }, pb: 1 }}>
        {categories.map((cat, idx) => (
         <Link
         to={`/products?category=${encodeURIComponent(cat.name)}`}
         style={{ textDecoration: "none" }}
         key={cat._id || cat.name}
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
                minWidth: 140,
                maxWidth: 160,
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
        ))}
      </Box>
    </Box>
  );
};

export default ShopByCategorySection;