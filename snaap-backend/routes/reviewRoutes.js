const express = require('express');
const {
  getProductReviews,
  addProductReview,
  getAllReviewsForAdmin,
  approveReview,
  deleteReview
} = require('../controllers/reviewController');
const requireAdmin = require('../middleware/requireAdmin');
const Review = require('../models/review');

const router = express.Router();

// Public: Get approved reviews for a product
router.get('/products/:id/reviews', getProductReviews);

// Public: Post a review for a product (no auth)
router.post('/products/:id/reviews', addProductReview);

// Public: Get recent approved reviews for homepage
router.get('/reviews/recent', async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort('-createdAt')
      .limit(10); // Adjust limit as needed
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recent reviews', error: error.message });
  }
});

// Admin: Get all reviews (moderation dashboard)
router.get('/admin/reviews', requireAdmin, getAllReviewsForAdmin);

// Admin: Approve review
router.patch('/admin/reviews/:reviewId/approve', requireAdmin, approveReview);

// Admin: Delete review
router.delete('/admin/reviews/:reviewId', requireAdmin, deleteReview);

module.exports = router;