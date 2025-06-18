import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API from '../../api/apiService';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.logout(); // Call backend to destroy session
    } catch (err) {
      // Optionally handle error
    }
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  return (
    <Button
      variant="outlined"
      color="secondary"
      onClick={handleLogout}
      sx={{ borderRadius: 2, ml: 2 }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;