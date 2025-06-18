import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, 
  Avatar, Chip, useTheme, useMediaQuery, 
  CircularProgress, TextField, TablePagination
} from '@mui/material';
import {
  Search, Clear, Person, Email, Phone, 
  ShoppingCart, Star, Block
} from '@mui/icons-material';
import { format } from 'date-fns';
import API from '../../api/apiService';
import ErrorAlert from '../../components/ErrorAlert';

const Customers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await API.getCustomers({ 
          page: page + 1, 
          limit: rowsPerPage,
          search: searchTerm 
        });
        setCustomers(response.data.customers);
        setTotalCustomers(response.data.count);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err.response?.data?.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, rowsPerPage, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const toggleCustomerStatus = async (customerId, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'block' : 'unblock'} this customer?`)) return;
    
    try {
      setLoading(true);
      await API.updateCustomer(customerId, { isActive: !isActive });
      // Refresh customers list
      const response = await API.getCustomers({ 
        page: page + 1, 
        limit: rowsPerPage 
      });
      setCustomers(response.data.customers);
      setTotalCustomers(response.data.count);
    } catch (err) {
      console.error('Error updating customer status:', err);
      setError(err.response?.data?.message || 'Failed to update customer status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
    );
  }

  if (error) {
    return <ErrorAlert error={error} onClose={() => setError(null)} />;
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
        Customers Management
      </Typography>

      {/* Search */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'action.active', mr: 1 }} />
              ),
              endAdornment: searchTerm && (
                <IconButton onClick={clearSearch}>
                  <Clear fontSize="small" />
                </IconButton>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.grey[100],
                  '& th': { fontWeight: 600 }
                }}>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={customer.avatar} 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: customer.isActive ? 'primary.main' : 'error.main'
                          }}
                        >
                          {customer.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {customer.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @{customer.username || customer.email.split('@')[0]}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Email fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">
                          {customer.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                        <Typography variant="body2">
                          {customer.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <ShoppingCart fontSize="small" color="action" />
                        <Typography variant="body2">
                          {customer.ordersCount || 0} orders
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Star fontSize="small" color="action" />
                        <Typography variant="body2">
                          {customer.totalSpent ? `KES ${customer.totalSpent.toLocaleString()}` : 'KES 0'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(customer.createdAt), 'dd MMM yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(customer.createdAt), 'hh:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.isActive ? 'Active' : 'Blocked'} 
                        color={customer.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        color={customer.isActive ? 'error' : 'success'}
                        onClick={() => toggleCustomerStatus(customer._id, customer.isActive)}
                      >
                        <Block fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCustomers}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Customers;