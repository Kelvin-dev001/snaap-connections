import React, { useState, useMemo } from "react";
import useProducts from "../hooks/useProducts";
import Fuse from "fuse.js";
import {
  Box,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Paper,
  Popper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function AutoCompleteSearch({ onSelect, placeholder = "Search products, brands, categories...", sx = {} }) {
  const [search, setSearch] = useState("");
  const { products } = useProducts(""); // fetch all for local fuzzy search
  const [anchorEl, setAnchorEl] = useState(null);

  // Setup Fuse.js instance for fuzzy search
  const fuse = useMemo(() => new Fuse(products, {
    keys: ["name", "brand", "category"],
    threshold: 0.3,
    includeScore: true,
  }), [products]);

  // Filtered results
  const results = search.length > 1 ? fuse.search(search).map(r => r.item) : [];

  function handleChange(e) {
    setSearch(e.target.value);
    setAnchorEl(e.currentTarget);
  }

  function handleSelect(productId) {
    setSearch("");
    setAnchorEl(null);
    if (onSelect) onSelect(productId);
  }

  return (
    <Box sx={{ position: "relative", ...sx }}>
      <Box sx={{
        display: "flex", alignItems: "center", bgcolor: "#f4f6fa",
        px: 2, py: 1, borderRadius: "40px", boxShadow: "0 1px 8px #6dd5ed22"
      }}>
        <SearchIcon color="primary" />
        <InputBase
          placeholder={placeholder}
          sx={{ ml: 2, flex: 1, fontSize: "1.07rem" }}
          inputProps={{ 'aria-label': 'search' }}
          value={search}
          onChange={handleChange}
          onFocus={e => setAnchorEl(e.currentTarget)}
          onBlur={() => setTimeout(() => setAnchorEl(null), 200)}
        />
      </Box>
      <Popper open={Boolean(anchorEl) && results.length > 0} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
        <Paper sx={{ mt: 1, maxHeight: 320, overflowY: 'auto', width: 350 }}>
          <List>
            {results.map(p => (
              <ListItem button key={p._id} onMouseDown={() => handleSelect(p._id)}>
                <ListItemText
                  primary={p.name}
                  secondary={`${p.brand} | ${p.category}`}
                />
              </ListItem>
            ))}
            {results.length === 0 && (
              <ListItem><ListItemText primary="No matching products" /></ListItem>
            )}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
}