import React from 'react';
import { 
  Alert, 
  Snackbar, 
  IconButton, 
  Collapse,
  Box,
  Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ErrorAlert = ({ error, onClose }) => {
  return (
    <>
      {/* For toast notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={onClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="error"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* For inline errors */}
      <Collapse in={!!error}>
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity="error"
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={onClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        </Box>
      </Collapse>
    </>
  );
};

export default ErrorAlert;