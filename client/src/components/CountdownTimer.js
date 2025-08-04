import React, { useEffect, useState } from "react";
import { Chip } from "@mui/material";

// Simple countdown timer for deals (props.seconds: total seconds)
const CountdownTimer = ({ seconds }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (!timeLeft || timeLeft < 1) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const format = (secs) => {
    const d = Math.floor(secs / (24 * 3600));
    const h = Math.floor((secs % (24 * 3600)) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      d > 0 ? `${d}d` : null,
      `${h.toString().padStart(2, "0")}`,
      `${m.toString().padStart(2, "0")}`,
      `${s.toString().padStart(2, "0")}`
    ]
      .filter(Boolean)
      .join(":");
  };

  return (
    <Chip
      label={`Ends in: ${format(timeLeft)}`}
      color={timeLeft < 3600 ? "error" : "info"}
      sx={{ fontWeight: 700, fontSize: "1.02rem" }}
    />
  );
};

export default CountdownTimer;