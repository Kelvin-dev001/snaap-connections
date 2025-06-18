import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, useTheme, useMediaQuery, CircularProgress,  FormControlLabel,
  Checkbox, Tooltip, TablePagination
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Clear,
  Visibility, Category, Inventory
} from '@mui/icons-material';
import API from '../../api/apiService';
import ErrorAlert from '../../components/ErrorAlert';

const MAX_IMAGES = 10;

const Products = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);

  // For multiple image uploads
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [initialPreviews, setInitialPreviews] = useState([]); // For edit: show already uploaded images

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
          API.getProducts({ 
            page: page + 1, 
            limit: rowsPerPage,
            search: searchTerm 
          }),
          API.getCategories(),
          API.getBrands()
        ]);

        // Support both array and {data: array} API styles
        setProducts(productsRes.data.products || productsRes.data || []);
        setTotalProducts(productsRes.data.count || productsRes.data?.length || 0);
        setCategories(categoriesRes.data.categories || categoriesRes.data || []);
        setBrands(brandsRes.data.brands || brandsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, rowsPerPage, searchTerm]);

  const emptyProduct = {
    name: '',
    price: 0,
    discountPrice: '',
    currency: 'KES',
    isOnSale: false,
    brand: '',
    model: '',
    category: '',
    stockQuantity: 0,
    inStock: true,
    sku: '',
    specs: {
      storage: '',
      ram: '',
      screenSize: '',
      camera: '',
      battery: '',
      processor: '',
      os: '',
      material: '',
      wattage: '',
      connectivity: '',
    },
    accessoryType: '',
    compatibleWith: [],
    images: [],
    thumbnail: '',
    videoUrl: '',
    shortDescription: '',
    fullDescription: '',
    keyFeatures: [],
    tags: [],
    relatedProducts: [],
    isFeatured: false,
    isNewRelease: false,
    releaseDate: '',
    warrantyPeriod: '',
    returnPolicyDays: 30,
    isActive: true, // for UI only
  };

  const handleOpenDialog = (product = null) => {
    setCurrentProduct(product ? {
      ...emptyProduct,
      ...product,
      specs: { ...emptyProduct.specs, ...(product.specs || {}) },
      keyFeatures: product.keyFeatures || [],
      tags: product.tags || [],
      compatibleWith: product.compatibleWith || [],
      relatedProducts: product.relatedProducts || [],
    } : { ...emptyProduct });
    setSelectedImages([]);
    setImagePreviews([]);
    if (product && product.images && product.images.length > 0) {
      setInitialPreviews(product.images);
    } else {
      setInitialPreviews([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduct(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setInitialPreviews([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setCurrentProduct(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setCurrentProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [name]: value
      }
    }));
  };

  // For array fields
  const handleArrayFieldChange = (name, value) => {
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value.split(',').map(v => v.trim()).filter(v => v)
    }));
  };

  // Multiple images upload handler
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedImages.length + initialPreviews.length + files.length > MAX_IMAGES) {
      alert(`You can upload up to ${MAX_IMAGES} images per product.`);
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [
      ...prev,
      ...files.map(file => URL.createObjectURL(file))
    ]);
  };

  // Remove image before upload (from preview)
  const handleRemoveImage = (idx) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Remove already-uploaded image (for edit)
  const handleRemoveInitialImage = (idx) => {
    setInitialPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Collect form data to match schema
  const collectFormData = () => {
    const formData = new FormData();
    // Basic fields
    formData.append('name', currentProduct.name);
    formData.append('price', currentProduct.price);
    if (currentProduct.discountPrice) formData.append('discountPrice', currentProduct.discountPrice);
    formData.append('currency', currentProduct.currency || 'KES');
    formData.append('isOnSale', currentProduct.isOnSale);
    formData.append('brand', currentProduct.brand);
    formData.append('model', currentProduct.model || '');
    formData.append('category', currentProduct.category);
    formData.append('sku', currentProduct.sku || '');
    formData.append('stockQuantity', currentProduct.stockQuantity || 0);
    formData.append('inStock', currentProduct.inStock);
    formData.append('accessoryType', currentProduct.accessoryType || '');
    formData.append('thumbnail', currentProduct.thumbnail || '');
    formData.append('videoUrl', currentProduct.videoUrl || '');
    formData.append('shortDescription', currentProduct.shortDescription || '');
    formData.append('fullDescription', currentProduct.fullDescription || '');
    formData.append('isFeatured', currentProduct.isFeatured);
    formData.append('isNewRelease', currentProduct.isNewRelease);
    if (currentProduct.releaseDate) formData.append('releaseDate', currentProduct.releaseDate);
    if (currentProduct.warrantyPeriod) formData.append('warrantyPeriod', currentProduct.warrantyPeriod);
    if (currentProduct.returnPolicyDays) formData.append('returnPolicyDays', currentProduct.returnPolicyDays);

    // Array type fields
    if (currentProduct.keyFeatures && currentProduct.keyFeatures.length > 0)
      currentProduct.keyFeatures.forEach(k => formData.append('keyFeatures[]', k));
    if (currentProduct.tags && currentProduct.tags.length > 0)
      currentProduct.tags.forEach(t => formData.append('tags[]', t));
    if (currentProduct.compatibleWith && currentProduct.compatibleWith.length > 0)
      currentProduct.compatibleWith.forEach(c => formData.append('compatibleWith[]', c));
    if (currentProduct.relatedProducts && currentProduct.relatedProducts.length > 0)
      currentProduct.relatedProducts.forEach(r => formData.append('relatedProducts[]', r));

    // Specs
    if (currentProduct.specs) {
      Object.entries(currentProduct.specs).forEach(([key, val]) => {
        if (val) formData.append(`specs[${key}]`, val);
      });
    }

    // If editing, include info about which existing images to keep
    if (currentProduct._id && initialPreviews.length > 0) {
      initialPreviews.forEach((imgUrl) => {
        formData.append('existingImages[]', imgUrl);
      });
    }

    // New images
    selectedImages.forEach((img) => {
      formData.append('images', img); // 'images' for multer array
    });

    return formData;
  };

  const handleSaveProduct = async () => {
    console.log('currentProduct before save:', currentProduct);
    if (!currentProduct.name || !currentProduct.price || !currentProduct.brand || !currentProduct.category) {
      setError("Please fill in all required fields (name, price, brand, category).");
      return;
    }
    try {
      setLoading(true);
      const formData = collectFormData();
      if (currentProduct._id) {
        await API.updateProduct(currentProduct._id, formData); // No headers here!
      } else {
        await API.createProduct(formData); // No headers here!
      }
      // Refresh products list
      const res = await API.getProducts({ 
        page: page + 1, 
        limit: rowsPerPage 
      });
      setProducts(res.data.products || res.data || []);
      setTotalProducts(res.data.count || res.data?.length || 0);
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      setLoading(true);
      await API.deleteProduct(id);
      const res = await API.getProducts({ 
        page: page + 1, 
        limit: rowsPerPage 
      });
      setProducts(res.data.products || res.data || []);
      setTotalProducts(res.data.count || res.data?.length || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
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

  if (loading && products.length === 0) {
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Products Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: '50px' }}
        >
          Add Product
        </Button>
      </Box>

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
              placeholder="Search products..."
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
            {/* You can add a category filter here later if desired */}
          </Box>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.grey[100],
                  '& th': { fontWeight: 600 }
                }}>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1,
                          overflow: 'hidden',
                          mr: 2,
                          bgcolor: 'grey.200'
                        }}>
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              style={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.category}
                        size="small" 
                        icon={<Category fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.brand}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {product.currency || "KES"} {product.price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Inventory fontSize="small" color="action" />
                        <Typography variant="body2">
                          {product.stockQuantity}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={product.inStock ? 'In Stock' : 'Out of Stock'} 
                        color={product.inStock ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View">
                          <IconButton size="small" color="info">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalProducts}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentProduct?._id ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={currentProduct?.name || ''}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Brand</InputLabel>
                <Select
                  label="Brand"
                  name="brand"
                  value={currentProduct?.brand || ''}
                  onChange={handleInputChange}
                >
                  {brands.length > 0 ? (
                    brands.map(brand => (
                      <MenuItem key={brand._id} value={brand.name}>{brand.name}</MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No brands found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={currentProduct?.model || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  name="category"
                  value={currentProduct?.category || ''}
                  onChange={handleInputChange}
                >
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <MenuItem key={category._id} value={category.name}>{category.name}</MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No categories found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Price (KES)"
                name="price"
                type="number"
                value={currentProduct?.price || 0}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Discount Price"
                name="discountPrice"
                type="number"
                value={currentProduct?.discountPrice || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Currency"
                name="currency"
                value={currentProduct?.currency || 'KES'}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    name="isOnSale"
                    checked={currentProduct?.isOnSale || false}
                    onChange={handleInputChange}
                  />
                }
                label="On Sale"
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label="SKU"
                name="sku"
                value={currentProduct?.sku || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Stock Quantity"
                name="stockQuantity"
                type="number"
                value={currentProduct?.stockQuantity || 0}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    name="inStock"
                    checked={currentProduct?.inStock || false}
                    onChange={handleInputChange}
                  />
                }
                label="In Stock"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Short Description"
                name="shortDescription"
                value={currentProduct?.shortDescription || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Full Description"
                name="fullDescription"
                value={currentProduct?.fullDescription || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                fullWidth
                label="Key Features (comma separated)"
                name="keyFeatures"
                value={currentProduct?.keyFeatures?.join(', ') || ''}
                onChange={e => handleArrayFieldChange('keyFeatures', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Tags (comma separated)"
                name="tags"
                value={currentProduct?.tags?.join(', ') || ''}
                onChange={e => handleArrayFieldChange('tags', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Accessory Type"
                name="accessoryType"
                value={currentProduct?.accessoryType || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Compatible With (comma separated)"
                name="compatibleWith"
                value={currentProduct?.compatibleWith?.join(', ') || ''}
                onChange={e => handleArrayFieldChange('compatibleWith', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Thumbnail URL"
                name="thumbnail"
                value={currentProduct?.thumbnail || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Video URL"
                name="videoUrl"
                value={currentProduct?.videoUrl || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Warranty Period"
                name="warrantyPeriod"
                value={currentProduct?.warrantyPeriod || ''}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Return Policy Days"
                name="returnPolicyDays"
                type="number"
                value={currentProduct?.returnPolicyDays || 30}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    name="isFeatured"
                    checked={currentProduct?.isFeatured || false}
                    onChange={handleInputChange}
                  />
                }
                label="Featured"
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    name="isNewRelease"
                    checked={currentProduct?.isNewRelease || false}
                    onChange={handleInputChange}
                  />
                }
                label="New Release"
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label="Release Date"
                name="releaseDate"
                type="date"
                value={currentProduct?.releaseDate ? currentProduct.releaseDate.slice(0, 10) : ''}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              {/* Multiple Images upload */}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mt: 1 }}
                  disabled={selectedImages.length + initialPreviews.length >= MAX_IMAGES}
                >
                  Upload Product Images (max {MAX_IMAGES})
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    multiple
                    onChange={handleImagesChange}
                  />
                </Button>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {initialPreviews.map((img, idx) => (
                    <Box
                      key={img + idx}
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #eee',
                        mr: 1,
                        mb: 1
                      }}
                    >
                      <img
                        src={img}
                        alt={`Existing ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveInitialImage(idx)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(255,255,255,0.7)'
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {imagePreviews.map((img, idx) => (
                    <Box
                      key={img + idx}
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #eee',
                        mr: 1,
                        mb: 1
                      }}
                    >
                      <img
                        src={img}
                        alt={`Preview ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveImage(idx)}
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(255,255,255,0.7)'
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Storage"
                    name="storage"
                    value={currentProduct?.specs?.storage || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="RAM"
                    name="ram"
                    value={currentProduct?.specs?.ram || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Screen Size"
                    name="screenSize"
                    value={currentProduct?.specs?.screenSize || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Camera"
                    name="camera"
                    value={currentProduct?.specs?.camera || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Battery"
                    name="battery"
                    value={currentProduct?.specs?.battery || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Processor"
                    name="processor"
                    value={currentProduct?.specs?.processor || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="OS"
                    name="os"
                    value={currentProduct?.specs?.os || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Material"
                    name="material"
                    value={currentProduct?.specs?.material || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Wattage"
                    name="wattage"
                    value={currentProduct?.specs?.wattage || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Connectivity"
                    name="connectivity"
                    value={currentProduct?.specs?.connectivity || ''}
                    onChange={handleSpecChange}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: '50px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProduct} 
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: '50px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;