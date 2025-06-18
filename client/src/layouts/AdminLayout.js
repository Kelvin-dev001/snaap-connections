import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import AdminHeader from '../components/AdminHeader'; // Use your admin header component here
import Sidebar from '../components/Sidebar';
import { DRAWER_WIDTH } from '../constants/layout';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AdminHeader onDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          marginTop: '64px' // Make sure this matches your header height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;