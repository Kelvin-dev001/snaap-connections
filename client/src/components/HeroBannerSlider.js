import React from "react";
import { Box, Typography, Button, useMediaQuery, useTheme, Stack } from "@mui/material";

// Cloudinary image URLs
const HERO_IMAGE_DESKTOP = "https://res.cloudinary.com/dltfgasbb/image/upload/f_auto,q_auto,w_1200/banner5_e5vkse.jpg";
const HERO_IMAGE_MOBILE = "https://res.cloudinary.com/dltfgasbb/image/upload/f_auto,q_auto,w_500/banner5_e5vkse.jpg";

const banner = {
  title: "Stay Connected, Stay Ahead!",
  subtitle: "Explore smart devices designed for your lifestyle",
  cta: "Discover more",
  ctaLink: "/products",
};

const HeroBannerSlider = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const imageUrl = isMobile ? HERO_IMAGE_MOBILE : HERO_IMAGE_DESKTOP;
  const imgWidth = isMobile ? 500 : 1200;
  const imgHeight = isMobile ? 210 : 370;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: { xs: 0, md: "0 0 32px 32px" },
        aspectRatio: `${imgWidth} / ${imgHeight}`,
        minHeight: imgHeight,
        height: imgHeight,
      }}
    >
      <Box
        sx={{
          position: "relative",
          minHeight: imgHeight,
          height: imgHeight,
          aspectRatio: `${imgWidth} / ${imgHeight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? "center" : "flex-start",
          px: { xs: 1, md: 8 },
          py: { xs: 2, md: 0 },
          bgcolor: "#1e3c72",
          borderRadius: { xs: 0, md: "0 0 32px 32px" },
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl}
          alt={banner.title}
          width={imgWidth}
          height={imgHeight}
          loading="eager"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0,
            filter: "brightness(.88) saturate(1.08)",
            borderRadius: isMobile ? 0 : "0 0 32px 32px"
          }}
        />
        {/* Content - NO animation property */}
        <Box
          sx={{
            mt: 0,
            ml: { xs: "auto", md: 4 },
            mr: { xs: "auto", md: 0 },
            textAlign: "center",
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: isMobile ? "98vw" : 430,
            minWidth: 0,
            minHeight: isMobile ? 90 : 160,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: "0.8rem 0.5rem", md: "1.6rem 2.1rem" },
            bgcolor: "rgba(18, 36, 60, 0.32)",
            boxShadow: "0 2px 14px 0 #6dd5ed22",
            borderRadius: { xs: "12px", md: "22px" },
            border: "1.5px solid rgba(255,255,255,0.07)"
          }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              mb: 0.2,
              color: "#fff",
              textShadow: "0 2px 16px #0006, 0 1px 4px #2a529899",
              letterSpacing: 1.05,
              fontFamily: "'Montserrat', 'Roboto', sans-serif",
              lineHeight: 1.1,
              fontSize: "1.05rem"
            }}
          >
            {banner.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 1.2,
              color: "#e6f2ff",
              opacity: .94,
              textShadow: "0 2px 12px #2a5298bb",
              letterSpacing: 0.12,
              fontWeight: 500,
              fontSize: "0.94rem"
            }}
          >
            {banner.subtitle}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.1 }}>
            <Button
              variant="contained"
              size="small"
              href={banner.ctaLink}
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                borderRadius: "50px",
                px: 2.3,
                py: 0.8,
                background: "linear-gradient(96deg,#6dd5ed 30%,#1e3c72 100%)",
                color: "#fff",
                boxShadow: "0 2px 12px #6dd5ed33",
                transition: "all 0.19s cubic-bezier(.4,2,.4,1)",
                "&:hover": {
                  background: "linear-gradient(96deg,#1e3c72 10%,#6dd5ed 90%)",
                  color: "#fff",
                  boxShadow: "0 2px 24px #1e3c72cc",
                  transform: "scale(1.06)"
                }
              }}
            >
              {banner.cta}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default HeroBannerSlider;