import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/apiService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import ProductListingPage from "./ProductListingPage";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.getProducts({ category: categoryName, limit: 1000 })
      .then((res) => {
        setProducts(res.data.products || []);
        setError(null);
      })
      .catch((err) => {
        setError("Failed to fetch products for this category.");
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [categoryName]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <ProductListingPage
      initialProducts={products}
      title={`Products in ${categoryName}`}
      filterCategory={categoryName}
    />
  );
};

export default CategoryPage;