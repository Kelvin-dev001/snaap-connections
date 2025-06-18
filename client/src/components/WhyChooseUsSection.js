import React from "react";
import { Box, Typography, Grid, Paper, Stack, Avatar, useTheme, useMediaQuery } from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import DiscountIcon from "@mui/icons-material/Discount";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

// You can customize these reasons or pass them as a prop
const reasons = [
  {
    icon: <VerifiedUserIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "100% Genuine Products",
    description: "All our phones are sourced from authorized distributors with a full warranty."
  },
  {
    icon: <LocalShippingIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "Fast & Free Delivery",
    description: "Enjoy same-day delivery in Nairobi and fast, reliable shipping countrywide."
  },
  {
    icon: <SupportAgentIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "Exceptional Support",
    description: "Our friendly experts are available on WhatsApp, phone & live chat to help you anytime."
  },
  {
    icon: <DiscountIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "Unbeatable Deals",
    description: "Save big with exclusive discounts, flash sales, and trade-in offers."
  },
  {
    icon: <FlashOnIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "Easy, Secure Payments",
    description: "Pay with M-Pesa, card, or cash on delivery, with robust buyer protection."
  },
  {
    icon: <EmojiEventsIcon fontSize="large" sx={{ color: "#1e3c72" }} />,
    title: "Trusted by Thousands",
    description: "Thousands of happy customers across Kenya trust us for their mobile needs."
  }
];

const WhyChooseUsSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Glassmorphism and animation
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 0 },
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Animated keyframes for card pop and gradient */}
      <style>
        {`
        @keyframes whyCardPop {
          0%   { transform: scale(1);}
          50%  { transform: scale(1.04);}
          100% { transform: scale(1);}
        }
        .why-card:hover {
          animation: whyCardPop 0.7s;
          box-shadow: 0 10px 32px #1e3c7299, 0 1.5px 12px #6dd5ed33;
          border-color: #6dd5ed;
        }
        .why-avatar {
          background: linear-gradient(120deg, #6dd5ed 0%, #1e3c72 100%);
          color: #fff;
          box-shadow: 0 2px 18px #6dd5ed44;
        }
        @keyframes whyGradientMove {
          0% { background-position: 0% 50%;}
          100% { background-position: 100% 50%;}
        }
        .why-gradient-bg {
          position: absolute;
          z-index: 0;
          width: 100vw;
          height: 100%;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(120deg, #6dd5ed33 0%, #1e3c721a 100%);
          background-size: 200% 200%;
          animation: whyGradientMove 14s linear infinite alternate;
          pointer-events: none;
        }
        `}
      </style>
      <div className="why-gradient-bg" aria-hidden="true" />
      <Typography
        variant="h4"
        align="center"
        sx={{
          fontWeight: 700,
          mb: 4,
          mt: 1,
          color: "primary.main",
          letterSpacing: 1.2,
          fontFamily: "'Montserrat', 'Roboto', sans-serif",
          zIndex: 1,
          position: "relative"
        }}
      >
        Why Choose Snaap Connections?
      </Typography>
      <Grid
        container
        spacing={{ xs: 2, md: 4 }}
        justifyContent="center"
        sx={{ zIndex: 1, position: "relative" }}
      >
        {reasons.map((reason, idx) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={reason.title}
            sx={{ display: "flex" }}
          >
            <Paper
              className="why-card"
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: "26px",
                p: { xs: 3, md: 4 },
                background: "rgba(255,255,255,0.73)",
                border: "1.5px solid #e6f2ff",
                boxShadow: "0 6px 32px 0 rgba(30,60,114,0.07)",
                backdropFilter: "blur(10px)",
                minHeight: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                position: "relative",
                transition: "box-shadow 0.22s, border-color 0.22s, transform 0.22s cubic-bezier(.4,2,.4,1)"
              }}
            >
              <Avatar className="why-avatar" sx={{ width: 54, height: 54, mb: 2 }}>
                {reason.icon}
              </Avatar>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  color: "#1e3c72",
                  letterSpacing: 0.8,
                  mb: 1,
                  textShadow: "0 2px 8px #6dd5ed22"
                }}
              >
                {reason.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#244269",
                  opacity: 0.92,
                  fontWeight: 500,
                  fontSize: isMobile ? "1.01rem" : "1.09rem"
                }}
              >
                {reason.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WhyChooseUsSection;