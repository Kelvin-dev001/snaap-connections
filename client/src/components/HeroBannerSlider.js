import React from "react";
import Slider from "react-slick";
import { Box, Typography, Button, useMediaQuery, useTheme, Stack } from "@mui/material";

const strikingLightsCSS = `
@keyframes strikingMove {
  0% { background-position: 0% 50%;}
  100% { background-position: 100% 50%;}
}
.striking-lights {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
      120deg, 
      rgba(255,255,255,0.08) 0%, 
      #6dd5ed33 15%, 
      #1e3c72bb 40%, 
      #ffefb0cc 60%,
      #6dd5ed44 75%,
      rgba(255,255,255,0.08) 100%
  );
  background-size: 200% 200%;
  mix-blend-mode: lighten;
  animation: strikingMove 6s linear infinite alternate;
  filter: blur(3px);
}
`;

const parallaxStyle = (img) => ({
  width: "100%",
  height: "min(70vw,470px)",
  minHeight: 220,
  maxHeight: 370,
  position: "absolute",
  top: 0,
  left: 0,
  objectFit: "cover",
  objectPosition: "center",
  zIndex: 0,
  willChange: "transform",
  filter: "brightness(.88) saturate(1.08)",
  transition: "transform 1s cubic-bezier(.4,2,.4,1)",
  backgroundImage: `url(${img})`,
  backgroundSize: "cover",
});


const banners = [
  {
    image: "/assets/banner1.jpg",
    title: "Unbeatable Smartphone Deals",
    subtitle: "Top brands. Latest models. Fast delivery countrywide.",
    cta: "Shop Now",
    ctaLink: "/products",
  },
  {
    image: "/assets/banner2.jpg",
    title: "Upgrade to 5G Today",
    subtitle: "Experience blazing-fast internet on our hottest 5G phones.",
    cta: "Explore 5G Phones",
    ctaLink: "/products?network=5G",
  },
  {
    image: "/assets/banner3.jpg",
    title: "Smart, Stylish, Connected!",
    subtitle: "Explore wearables that match your lifestyle — fitness, fashion, and function.",
    cta: "Shop Wearables",
    ctaLink: "/trade-in",
  },
  {
    image: "/assets/banner5.jpg",
    title: "Stay Connected, Stay Ahead!",
    subtitle: "Explore smart devices designed for your lifestyle",
    cta: "Discover more",
    ctaLink: "/trade-in",
  },
  {
    image: "/assets/banner6.jpg",
    title: "Discover the Newest Tech!",
    subtitle: "Shop smartphones, laptops, earbuds & wearables — all in one place.",
    cta: "View Collection",
    ctaLink: "/trade-in",
  },
  {
    image: "/assets/banner4.jpg",
    title: "Work Hard. Play Harder.",
    subtitle: "Best deals on phones that keep up with your hustle.",
    cta: "Explore Performance",
    ctaLink: "/trade-in",
  },
  {
    image: "/assets/banner7.jpg",
    title: "Gear Up for Success",
    subtitle: "Essential and affordable laptops for work and school ",
    cta: "Explore Deals",
    ctaLink: "/trade-in",
  },
  {
    image: "/assets/banner8.jpg",
    title: "Your One-Stop Gadget Shop",
    subtitle: "one click online shopping. Saving you time and money.",
    cta: "Browse Now",
    ctaLink: "/trade-in",
  },
];

const HeroBannerSlider = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    fade: true,
    autoplaySpeed: 3400,
    arrows: false,
    cssEase: "cubic-bezier(.4,2,.4,1)",
    pauseOnHover: true,
    adaptiveHeight: false,
    appendDots: dots => (
      <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, zIndex: 3, display: 'flex', justifyContent: 'center' }}>
        <ul style={{ margin: 0, padding: 0, display: 'flex', gap: 8 }}>{dots}</ul>
      </Box>
    ),
    customPaging: i => (
      <Box
        sx={{
          width: 12,
          height: 12,
          bgcolor: "rgba(255,255,255,0.7)",
          borderRadius: "50%",
          border: "2px solid #6dd5ed",
          transition: "all 0.4s",
          "&:hover": { bgcolor: "#6dd5ed" },
        }}
      />
    ),
  };

  return (
    <Box sx={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: { xs: 0, md: "0 0 32px 32px" } }}>
      <style>{strikingLightsCSS}</style>
      <Slider {...sliderSettings}>
        {banners.map((banner, idx) => (
          <Box
            key={idx}
            sx={{
              position: "relative",
              minHeight: isMobile ? 210 : 370,
              height: isMobile ? 210 : 370,
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
            {/* Parallax Background */}
            <Box
              sx={{
                ...parallaxStyle(banner.image),
                backgroundAttachment: "fixed",
                borderRadius: { xs: 0, md: "0 0 32px 32px" },
              }}
              aria-hidden="true"
            />
            {/* Striking lights overlay */}
            <div className="striking-lights" />
            {/* Content */}
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
                animation: "fadein 1s cubic-bezier(.4,2,.4,1)",
                p: { xs: "0.8rem 0.5rem", md: "1.6rem 2.1rem" },
                bgcolor: "rgba(18, 36, 60, 0.32)",
                boxShadow: "0 2px 14px 0 #6dd5ed22",
                borderRadius: { xs: "12px", md: "22px" },
                border: "1.5px solid rgba(255,255,255,0.07)",
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
        ))}
      </Slider>
    </Box>
  );
};

export default HeroBannerSlider;