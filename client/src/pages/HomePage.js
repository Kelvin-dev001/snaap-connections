import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import API from '../api/apiService';

// Section Components
import HeroBannerSlider from '../components/HeroBannerSlider';
import ShopByBrandSection from '../components/ShopByBrandSection';
import ShopByCategorySection from '../components/ShopByCategorySection';
import FeaturedProductsSection from '../components/FeaturedProductsSection';
import NewArrivalsSection from '../components/NewArrivalsSection';
import ReviewsSection from '../components/ReviewsSection';
import WhyChooseUsSection from '../components/WhyChooseUsSection';
import WhatsAppCTASection from '../components/WhatsAppCTASection';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          featuredRes,
          newArrivalsRes,
          categoriesRes,
          brandsRes,
          reviewsRes
        ] = await Promise.all([
          API.getFeaturedProducts(),
          API.getProducts({ sort: 'createdAt', limit: 8 }),
          API.getCategories(),
          API.getBrands(),
          API.getProductReviews('all') // You may want to adjust this to fetch top/featured reviews
        ]);
        setFeaturedProducts(featuredRes.data.products || []);
        setNewArrivals(newArrivalsRes.data.products || []);
        setCategories(categoriesRes.data.categories || []);
        setBrands(brandsRes.data.brands || []);
        setReviews(reviewsRes.data.reviews || []);
      } catch (err) {
        setError('Failed to load homepage. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <HeroBannerSlider />
      <ShopByBrandSection brands={brands} />
      <ShopByCategorySection categories={categories} />
      <FeaturedProductsSection products={featuredProducts} />
      <NewArrivalsSection products={newArrivals} />
      <ReviewsSection reviews={reviews} />
      <WhyChooseUsSection />
      <WhatsAppCTASection />
    </Box>
  );
};

export default HomePage;