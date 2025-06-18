import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Card, TextField, Link, Divider, 
  IconButton, Container, useTheme, useMediaQuery
} from '@mui/material';
import { 
  Visibility, VisibilityOff, Facebook, Google, WhatsApp
} from '@mui/icons-material';
import API from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const LoginPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await API.login(formData);
      
      // Save token and user data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home or intended page
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ 
        textAlign: 'center',
        mb: 6
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Login to your account to continue shopping
        </Typography>
      </Box>
      
      <Card sx={{ 
        p: isMobile ? 3 : 4,
        borderRadius: 2,
        boxShadow: 3
      }}>
        {error && (
          <Box sx={{ mb: 3 }}>
            <ErrorAlert error={error} onClose={() => setError('')} />
          </Box>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            mb: 2
          }}>
            <Link href="/forgot-password" variant="body2">
              Forgot Password?
            </Link>
          </Box>
          
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large"
            disabled={loading}
            sx={{ 
              py: 1.5,
              mb: 2,
              borderRadius: '50px'
            }}
          >
            {loading ? <LoadingSpinner size={24} /> : 'Login'}
          </Button>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 3
          }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/register" fontWeight={600}>
                Sign up
              </Link>
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR LOGIN WITH
            </Typography>
          </Divider>
          
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mb: 3
          }}>
            <IconButton 
              sx={{ 
                border: '1px solid #ddd',
                borderRadius: '50%',
                p: 2
              }}
            >
              <Facebook color="primary" />
            </IconButton>
            
            <IconButton 
              sx={{ 
                border: '1px solid #ddd',
                borderRadius: '50%',
                p: 2
              }}
            >
              <Google color="error" />
            </IconButton>
            
            <IconButton 
              sx={{ 
                border: '1px solid #ddd',
                borderRadius: '50%',
                p: 2
              }}
              href="https://wa.me/254XXXXXXXXX"
              target="_blank"
            >
              <WhatsApp color="success" />
            </IconButton>
          </Box>
        </form>
      </Card>
      
      <Box sx={{ 
        textAlign: 'center',
        mt: 4
      }}>
        <Typography variant="body2" color="text.secondary">
          By logging in, you agree to our{' '}
          <Link href="/terms" fontWeight={600}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" fontWeight={600}>
            Privacy Policy
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;