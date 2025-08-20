import { useEffect, useState } from "react";
import API from "../api/apiService";

export default function useBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getBrands()
      .then(res => setBrands(res.data))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  return { brands, loading };
}