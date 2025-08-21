import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ProductListingPage from "./ProductListingPage";

const BrandPage = () => {
  const { brandName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.getProducts({ brand: brandName, limit: 1000 })
      .then((res) => {
        setProducts(res.data.products || []);
        setError(null);
      })
      .catch((err) => {
        setError("Failed to fetch products for this brand.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [brandName]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  // Reuse ProductListingPage's product grid
  return (
    <ProductListingPage
      initialProducts={products}
      title={`Products by ${brandName}`}
      filterBrand={brandName}
    />
  );
};

export default BrandPage;