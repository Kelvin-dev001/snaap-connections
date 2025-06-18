import React from 'react';
import { 
  Box, Typography, Button, Container,
  useTheme, useMediaQuery
} from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WhatsApp from '@mui/icons-material/WhatsApp';

const ErrorPage = ({ status = 404 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const errorMessages = {
    404: {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
      action: "Go back home"
    },
    500: {
      title: "Server Error",
      description: "Something went wrong on our end. We're working to fix it.",
      action: "Try again"
    },
    403: {
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      action: "Go back"
    }
  };
  
  const { title, description, action } = errorMessages[status] || errorMessages[404];

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <Box sx={{ 
          width: isMobile ? 100 : 150,
          height: isMobile ? 100 : 150,
          borderRadius: '50%',
          bgcolor: 'error.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4
        }}>
          <ErrorOutlineIcon sx={{ 
            fontSize: isMobile ? 50 : 80,
            color: 'error.main'
          }} />
        </Box>
        
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            mb: 2
          }}
        >
          {status} - {title}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '600px',
            mb: 4
          }}
        >
          {description}
        </Typography>
        
        <Button 
          variant="contained" 
          component={Link}
          to="/"
          size="large"
          sx={{ 
            px: 4,
            py: 1.5,
            borderRadius: '50px'
          }}
        >
          {action}
        </Button>
        
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          mt: 4
        }}>
          <Button 
            variant="text" 
            component={Link}
            to="/products"
          >
            Continue Shopping
          </Button>
          
          <Button 
            variant="text" 
            component="a"
            href="https://wa.me/254XXXXXXXXX"
            target="_blank"
            startIcon={<WhatsApp />}
          >
            Contact Support
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorPage;