const express = require('express');
const {
  getProductReviews,
  addProductReview,
  getAllReviewsForAdmin,
  approveReview,
  deleteReview
} = require('../controllers/reviewController');
const { adminProtect } = require('../middleware/auth');

const router = express.Router();

// Public: Get approved reviews for a product
router.get('/products/:id/reviews', getProductReviews);

// Public: Post a review for a product (no auth)
router.post('/products/:id/reviews', addProductReview);

// Admin: Get all reviews (moderation dashboard)
router.get('/admin/reviews', adminProtect, getAllReviewsForAdmin);

// Admin: Approve review
router.patch('/admin/reviews/:reviewId/approve', adminProtect, approveReview);

// Admin: Delete review
router.delete('/admin/reviews/:reviewId', adminProtect, deleteReview);

module.exports = router;