import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  Slide,
  Tooltip,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

// WhatsApp number (customize as needed)
const whatsappNumber = "254759293030";
const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hello+Snaap+Connections%2C+I+need+help+with...`;

const WhatsAppCTASection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Animate bubble on mount
  const [showBubble, setShowBubble] = useState(false);
  React.useEffect(() => {
    const timeout = setTimeout(() => setShowBubble(true), 400);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Box
      sx={{
        my: { xs: 5, md: 8 },
        py: { xs: 4, md: 6 },
        px: 2,
        borderRadius: "32px",
        background: "linear-gradient(100deg, #6dd5ed 0%, #1e3c72 120%)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 36px 0 #1e3c7211, 0 1.5px 16px #6dd5ed22",
        textAlign: "center",
        zIndex: 2,
      }}
    >
      {/* Glowing animated WhatsApp Icon */}
      <style>
        {`
        @keyframes whatsapp-pulse {
          0%   { box-shadow: 0 0 0 0 #25d36677;}
          50%  { box-shadow: 0 0 24px 8px #25d36644;}
          100% { box-shadow: 0 0 0 0 #25d36677;}
        }
        .whatsapp-circular {
          background: linear-gradient(120deg,#25d366 60%,#128c7e 100%);
          color: #fff;
          border-radius: 50%;
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 4px 24px #25d36633;
          animation: whatsapp-pulse 2.5s infinite;
          transition: transform 0.25s cubic-bezier(.4,2,.4,1);
          will-change: transform, box-shadow;
        }
        .whatsapp-circular:hover, .whatsapp-circular:focus {
          transform: scale(1.09) rotate(-6deg);
          box-shadow: 0 8px 36px #25d36677;
        }
        .cta-btn-animated {
          transition: background 0.22s, color 0.22s, box-shadow 0.22s, transform 0.22s cubic-bezier(.4,2,.4,1);
          will-change: transform, box-shadow;
        }
        .cta-btn-animated:active {
          transform: scale(0.97);
        }
        .cta-btn-animated:hover, .cta-btn-animated:focus {
          background: linear-gradient(96deg,#25d366 15%,#1e3c72 100%);
          color: #fff;
          box-shadow: 0 3px 24px #25d36655;
        }
        .bubble-anim {
          animation: bubbleIn 0.9s cubic-bezier(.4,2,.4,1);
        }
        @keyframes bubbleIn {
          0%   { opacity: 0; transform: translateY(25px) scale(0.96);}
          60%  { opacity: 1; transform: translateY(-6px) scale(1.07);}
          100% { opacity: 1; transform: translateY(0) scale(1);}
        }
        `}
      </style>
      {/* Decorative animated chat bubble */}
      <Slide direction="up" in={showBubble} timeout={700}>
        <Box
          sx={{
            position: "absolute",
            top: isMobile ? 10 : 18,
            left: isMobile ? 18 : 60,
            zIndex: 1,
            opacity: 0.14,
          }}
          className="bubble-anim"
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: isMobile ? 54 : 88, color: "#fff" }} />
        </Box>
      </Slide>
      <Stack direction="column" alignItems="center" spacing={3} sx={{ zIndex: 2, position: "relative" }}>
        <Box
          className="whatsapp-circular"
          tabIndex={0}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          sx={{
            outline: hovered ? "2.5px solid #fff" : "none",
            border: hovered ? "2.5px solid #25d36677" : "none",
            transition: "outline 0.18s, border 0.18s"
          }}
        >
          <Tooltip title="Chat with us on WhatsApp!" arrow placement="bottom">
            <WhatsAppIcon sx={{ fontSize: 38 }} />
          </Tooltip>
        </Box>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          fontWeight={800}
          sx={{
            color: "#fff",
            textShadow: "0 2px 18px #1e3c72cc",
            letterSpacing: 1.2,
            fontFamily: "'Montserrat', 'Roboto', sans-serif",
            mb: 1,
          }}
        >
          Need Help? Chat with Us on WhatsApp!
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: "#e6f2ff",
            opacity: 0.92,
            mb: 2,
            mx: "auto",
            maxWidth: 480,
            fontWeight: 500,
            textShadow: "0 2px 10px #25d36644"
          }}
        >
          Our friendly team is ready to answer your questions, recommend the perfect phone, or assist with your order—instantly.
        </Typography>
        <Button
          variant="contained"
          size={isMobile ? "medium" : "large"}
          href={whatsappLink}
          target="_blank"
          rel="noopener"
          className="cta-btn-animated"
          onMouseDown={() => setClicked(true)}
          onMouseUp={() => setClicked(false)}
          onBlur={() => setClicked(false)}
          sx={{
            px: isMobile ? 4 : 6,
            py: 1.6,
            borderRadius: "50px",
            fontWeight: 700,
            fontSize: isMobile ? "1.08rem" : "1.19rem",
            background: "linear-gradient(96deg,#1e3c72 50%,#25d366 100%)",
            color: "#fff",
            boxShadow: "0 2px 12px #25d36622",
            ...(clicked && {
              background: "linear-gradient(96deg,#25d366 10%,#1e3c72 90%)",
              color: "#fff",
              boxShadow: "0 2px 24px #1e3c72cc",
            }),
          }}
          aria-label="Chat with us on WhatsApp"
        >
          <WhatsAppIcon sx={{ mr: 1, fontSize: "1.3em" }} />
          Start WhatsApp Chat
        </Button>
        <Typography
          variant="body2"
          sx={{
            mt: 1.8,
            color: "#d6f9e7",
            opacity: 0.8,
            textAlign: "center"
          }}
        >
          Available <b>8:00am – 8:00pm</b>, Monday to Saturday
        </Typography>
      </Stack>
      {/* Decorative WhatsApp wave at bottom */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          bottom: -4,
          width: "100%",
          zIndex: 1,
          pointerEvents: "none"
        }}
        aria-hidden="true"
      >
        <svg width="100%" height="36" viewBox="0 0 1440 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,18 C360,36 1080,0 1440,18 L1440,36 L0,36 Z"
            fill="#25d366"
            fillOpacity="0.18"
          />
        </svg>
      </Box>
    </Box>
  );
};

export default WhatsAppCTASection;