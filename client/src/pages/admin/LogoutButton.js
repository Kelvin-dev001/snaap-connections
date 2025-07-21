import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API, { removeToken } from '../../api/apiService';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.logout(); // Removes JWT client-side
    } catch (err) {
      // Optionally handle error
    }
    // Also remove any legacy isAdmin/local flags if used
    localStorage.removeItem('isAdmin');
    removeToken();
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