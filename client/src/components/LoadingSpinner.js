import React from "react";
import { Box, Typography } from "@mui/material";
import { PulseLoader } from "react-spinners";

const LoadingSpinner = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
    }}
  >
    <PulseLoader color="#1976d2" size={20} speedMultiplier={0.8} />
    <Typography variant="h6" sx={{ mt: 2, color: "#1976d2", fontWeight: 600 }}>
      Loading products for you...
    </Typography>
    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
      Please wait, we’re fetching the latest deals!
    </Typography>
  </Box>
);

export default LoadingSpinner;