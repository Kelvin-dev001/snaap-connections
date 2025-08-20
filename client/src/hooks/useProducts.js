import { useEffect, useState } from "react";
import API from "../api/apiService";

export default function useProducts(search = "") {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getProducts(search ? { search } : {})
      .then(res => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search]);

  return { products, loading };
}