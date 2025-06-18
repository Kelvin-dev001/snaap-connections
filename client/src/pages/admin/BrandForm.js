import React, { useState } from 'react';
import API from '../../api/apiService';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Avatar
} from '@mui/material';

function BrandForm({ brand, onSuccess, onCancel }) {
  const [name, setName] = useState(brand ? brand.name : '');
  const [description, setDescription] = useState(brand ? brand.description : '');
  const [logo, setLogo] = useState(brand ? brand.logo : '');
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogoChange = e => {
    const file = e.target.files[0];
    setLogoFile(file);
    if (file) setLogo(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (logo) {
        formData.append('logo', logo);
      }
      if (brand) {
        await API.updateBrandMultipart(brand._id, formData);
      } else {
        await API.createBrandMultipart(formData);
      }
      onSuccess();
    } catch (err) {
      alert("Error saving brand: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{brand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth required autoFocus />
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                Upload Logo
                <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
              </Button>
              {logo && <Avatar src={logo} sx={{ width: 48, height: 48 }} />}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="secondary" disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>{brand ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
export default BrandForm;