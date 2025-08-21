import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton, TextField, Button, Typography, CircularProgress, Paper, Fade } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";

const funGreetings = [
  "👋 Hi there! Need help picking a phone or gadget?",
  "😃 Hey! Ask me anything about devices, deals, or tech.",
  "🦸 Your personal tech guru, at your service!",
  "🚀 Want the best phone for your budget?",
];

const ProductAdvisorBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: funGreetings[Math.floor(Math.random() * funGreetings.length)] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleToggle = () => setOpen(v => !v);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/product-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages([...newMessages, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages([...newMessages, { sender: "bot", text: "Oops, something went wrong. Try again in a moment!" }]);
    }
    setLoading(false);
  };

  return (
    <Box>
      {/* Floating Button */}
      {!open && (
        <Fade in>
          <Box sx={{
            position: "fixed",
            bottom: { xs: 22, md: 32 },
            right: { xs: 18, md: 36 },
            zIndex: 1200
          }}>
            <IconButton
              color="primary"
              size="large"
              sx={{
                bgcolor: "#fff",
                boxShadow: "0 4px 16px #1e3c7299",
                "&:hover": { bgcolor: "#6dd5ed", color: "#fff" },
                animation: "pulse 2.2s infinite"
              }}
              onClick={handleToggle}
            >
              <SmartToyIcon fontSize="large" />
            </IconButton>
          </Box>
        </Fade>
      )}

      {/* Chat Window */}
      {open && (
        <Fade in>
          <Box sx={{
            position: "fixed",
            bottom: { xs: 16, md: 32 },
            right: { xs: 8, md: 32 },
            width: { xs: "94vw", sm: 350, md: 380 },
            maxWidth: 400,
            zIndex: 1300,
          }}>
            <Paper
              elevation={10}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 8px 32px #1e3c7265",
                bgcolor: "#f7fcff"
              }}
            >
              {/* Header */}
              <Box sx={{
                bgcolor: "linear-gradient(96deg,#6dd5ed 30%,#1e3c72 100%)",
                color: "#fff",
                py: 1.4, px: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1.8px solid #6dd5ed"
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SmartToyIcon sx={{ fontSize: 28 }} />
                  <Typography fontWeight={800} fontSize={18}>
                    Snaap Tech Advisor
                  </Typography>
                </Box>
                <IconButton size="small" color="inherit" onClick={handleToggle}>
                  <CloseIcon />
                </IconButton>
              </Box>
              {/* Messages */}
              <Box sx={{
                p: 2,
                minHeight: 240,
                maxHeight: 340,
                overflowY: "auto",
                bgcolor: "#f7fcff",
                fontSize: "1.05rem"
              }}>
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
                    }}
                  >
                    <Box sx={{
                      px: 2, py: 1,
                      borderRadius: 3,
                      bgcolor: msg.sender === "bot" ? "#e6f2ff" : "#6dd5ed",
                      color: msg.sender === "bot" ? "#1e3c72" : "#fff",
                      maxWidth: "80%",
                      boxShadow: msg.sender === "user" ? "0 2px 8px #6dd5ed44" : "none"
                    }}>
                      {msg.text}
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
              {/* Input */}
              <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: "#f7fcff", display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  placeholder="Ask about phones, deals, or compare..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" ? sendMessage() : null}
                  disabled={loading}
                  sx={{ bgcolor: "#fff", borderRadius: 2 }}
                />
                <Button
                  color="primary"
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={loading || !input.trim()}
                  onClick={sendMessage}
                  sx={{ minWidth: 0, px: 2, borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={22} /> : "Send"}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Animation Keyframes */}
      <style>
        {`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 #6dd5ed55; }
          50% { box-shadow: 0 0 16px 8px #6dd5ed55; }
          100% { box-shadow: 0 0 0 0 #6dd5ed55; }
        }
        `}
      </style>
    </Box>
  );
};

export default ProductAdvisorBot;