import React, { useEffect, useState } from 'react';
import API from '../../api/apiService'; // <-- Use your apiService.js
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BrandForm from './BrandForm';

function BrandList() {
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    const res = await API.getBrands(); // <-- FIXED
    setBrands(res.data);
  };

  const handleEdit = (brand) => {
    setEditBrand(brand);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await API.deleteBrand(id); // <-- You may need to add this to apiService.js
    fetchBrands();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            Brands
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditBrand(null);
              setShowForm(true);
            }}
          >
            Add Brand
          </Button>
        </Stack>
        {showForm && (
          <BrandForm
            brand={editBrand}
            onSuccess={() => {
              fetchBrands();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
        <List>
          {brands.map((brand) => (
            <ListItem
              key={brand._id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(brand)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDelete(brand._id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
              sx={{
                mb: 1,
                border: '1px solid #eee',
                borderRadius: 1,
                bgcolor: '#fafafa',
              }}
            >
              <ListItemText
                primary={brand.name}
                secondary={brand.description}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default BrandList;