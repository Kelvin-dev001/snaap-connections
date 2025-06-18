import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, Grid,
  TableHead, TableRow, Paper, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Chip, useTheme, useMediaQuery, CircularProgress,
  Tooltip, TablePagination, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import {
  Search, Clear, Visibility, LocalShipping,
  CheckCircle, Cancel, AccessTime
} from '@mui/icons-material';
import { format } from 'date-fns';
import API from '../../api/apiService';
import ErrorAlert from '../../components/ErrorAlert';

const Orders = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter
        };
        const response = await API.getOrders(params);
        // Handle both { orders: [...] } and [ ... ] shaped backends
        let fetchedOrders;
        let count;
        if (Array.isArray(response.data)) {
          fetchedOrders = response.data;
          count = response.data.length;
        } else if (Array.isArray(response.data.orders)) {
          fetchedOrders = response.data.orders;
          count = response.data.count || response.data.orders.length;
        } else {
          fetchedOrders = [];
          count = 0;
        }
        setOrders(fetchedOrders);
        setTotalOrders(count);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
        setOrders([]); // Ensure orders is always an array even on error
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await API.updateOrderStatus(orderId, newStatus);
      // Refresh orders list
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter
      };
      const response = await API.getOrders(params);
      let fetchedOrders;
      let count;
      if (Array.isArray(response.data)) {
        fetchedOrders = response.data;
        count = response.data.length;
      } else if (Array.isArray(response.data.orders)) {
        fetchedOrders = response.data.orders;
        count = response.data.count || response.data.orders.length;
      } else {
        fetchedOrders = [];
        count = 0;
      }
      setOrders(fetchedOrders);
      setTotalOrders(count);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  if (loading && orders.length === 0) {
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
        Orders Management
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search orders..."
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
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.grey[100],
                  '& th': { fontWeight: 600 }
                }}>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(orders) && orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          #{order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.customer?.name || 'Guest'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.customer?.phone || order.customer?.email || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(order.createdAt), 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(order.createdAt), 'hh:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatPrice(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 
                            order.status === 'delivered' ? 'success.light' :
                            order.status === 'cancelled' ? 'error.light' :
                            order.status === 'shipped' ? 'info.light' :
                            order.status === 'processing' ? 'warning.light' : 'grey.100',
                          color: 
                            order.status === 'delivered' ? 'success.dark' :
                            order.status === 'cancelled' ? 'error.dark' :
                            order.status === 'shipped' ? 'info.dark' :
                            order.status === 'processing' ? 'warning.dark' : 'grey.800'
                        }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {order.status}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Status">
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                sx={{ height: '32px' }}
                              >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="processing">Processing</MenuItem>
                                <MenuItem value="shipped">Shipped</MenuItem>
                                <MenuItem value="delivered">Delivered</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                              </Select>
                            </FormControl>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalOrders}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order #{selectedOrder.orderNumber}
              <Typography variant="body2" color="text.secondary">
                {format(new Date(selectedOrder.createdAt), 'PPPPpp')}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 1,
                    mb: 3
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      {selectedOrder.customer?.name || 'Guest Customer'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}
                    </Typography>
                    {selectedOrder.shippingAddress && (
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Address:</strong> {selectedOrder.shippingAddress.street}
                        </Typography>
                        <Typography variant="body2">
                          <strong>City:</strong> {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}
                        </Typography>
                      </>
                    )}
                  </Box>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Order Summary
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 1
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2">
                        {formatPrice(selectedOrder.subtotal)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}>
                      <Typography variant="body2">Shipping:</Typography>
                      <Typography variant="body2">
                        {selectedOrder.shippingFee === 0 ? 'FREE' : formatPrice(selectedOrder.shippingFee)}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>Total:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatPrice(selectedOrder.totalAmount)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 1
                    }}>
                      <Typography variant="body2">Payment Method:</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {selectedOrder.paymentMethod}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="body2">Delivery Method:</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {selectedOrder.deliveryMethod}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Order Items
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 1,
                    mb: 3
                  }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        pb: 2,
                        borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #eee' : 'none'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: 1,
                            overflow: 'hidden',
                            mr: 2,
                            bgcolor: 'grey.200'
                          }}>
                            {item.product?.images?.[0] && (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.product?.name || 'Product not available'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity} × {formatPrice(item.price)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Order Status
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'background.paper',
                    p: 2,
                    borderRadius: 1
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%',
                        bgcolor: 
                          selectedOrder.status === 'delivered' ? 'success.light' :
                          selectedOrder.status === 'cancelled' ? 'error.light' :
                          selectedOrder.status === 'shipped' ? 'info.light' :
                          selectedOrder.status === 'processing' ? 'warning.light' : 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        color: 
                          selectedOrder.status === 'delivered' ? 'success.dark' :
                          selectedOrder.status === 'cancelled' ? 'error.dark' :
                          selectedOrder.status === 'shipped' ? 'info.dark' :
                          selectedOrder.status === 'processing' ? 'warning.dark' : 'grey.800'
                      }}>
                        {selectedOrder.status === 'delivered' ? (
                          <CheckCircle fontSize="small" />
                        ) : selectedOrder.status === 'cancelled' ? (
                          <Cancel fontSize="small" />
                        ) : selectedOrder.status === 'shipped' ? (
                          <LocalShipping fontSize="small" />
                        ) : (
                          <AccessTime fontSize="small" />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {selectedOrder.status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last updated: {format(new Date(selectedOrder.updatedAt), 'PPPPpp')}
                        </Typography>
                      </Box>
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel>Update Status</InputLabel>
                      <Select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          handleStatusChange(selectedOrder._id, e.target.value);
                          setSelectedOrder(prev => ({
                            ...prev,
                            status: e.target.value
                          }));
                        }}
                        label="Update Status"
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="processing">Processing</MenuItem>
                        <MenuItem value="shipped">Shipped</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} sx={{ borderRadius: '50px' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Orders;