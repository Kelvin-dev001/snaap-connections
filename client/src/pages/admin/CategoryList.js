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
import CategoryForm from './CategoryForm';

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await API.getCategories(); // <-- FIXED
    setCategories(res.data);
  };

  const handleEdit = (category) => {
    setEditCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await API.deleteCategory(id); // <-- You may need to add this to apiService.js
    fetchCategories();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            Categories
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditCategory(null);
              setShowForm(true);
            }}
          >
            Add Category
          </Button>
        </Stack>
        {showForm && (
          <CategoryForm
            category={editCategory}
            onSuccess={() => {
              fetchCategories();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
        <List>
          {categories.map((cat) => (
            <ListItem
              key={cat._id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(cat)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDelete(cat._id)}>
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
                primary={cat.name}
                secondary={cat.description}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default CategoryList;