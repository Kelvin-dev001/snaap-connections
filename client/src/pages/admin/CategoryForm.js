import React, { useState } from 'react';
import API from '../../api/apiService';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Avatar
} from '@mui/material';

function CategoryForm({ category, onSuccess, onCancel }) {
  const [name, setName] = useState(category ? category.name : '');
  const [description, setDescription] = useState(category ? category.description : '');
  const [icon, setIcon] = useState(category ? category.icon : '');
  const [iconFile, setIconFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleIconChange = e => {
    const file = e.target.files[0];
    setIconFile(file);
    if (file) setIcon(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (iconFile) {
        formData.append('icon', iconFile);
      } else if (icon) {
        formData.append('icon', icon);
      }
      if (category) {
        await API.updateCategoryMultipart(category._id, formData);
      } else {
        await API.createCategoryMultipart(formData);
      }
      onSuccess();
    } catch (err) {
      alert("Error saving category: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth required autoFocus />
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                Upload Icon
                <input type="file" accept="image/*" hidden onChange={handleIconChange} />
              </Button>
              {icon && <Avatar src={icon} sx={{ width: 48, height: 48 }} />}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="secondary" disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>{category ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
export default CategoryForm;