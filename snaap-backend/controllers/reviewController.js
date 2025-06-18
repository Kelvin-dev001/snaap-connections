const mongoose = require('mongoose');
const Review = require('../models/review');

// GET: All reviews for a product (approved only)
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    let reviews;
    if (productId === 'all') {
      // Fetch all product reviews (approved only)
      reviews = await Review.find({ isApproved: true }).sort('-createdAt');
    } else {
      // Validate productId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
      }
      // Fetch reviews for a specific product (approved only)
      reviews = await Review.find({ product: productId, isApproved: true }).sort('-createdAt');
    }
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// POST: Add a new review (no auth, open to all)
exports.addProductReview = async (req, res) => {
  try {
    const { name, whatsapp, rating, comment } = req.body;
    const productId = req.params.id;

    // Required fields validation
    if (!name || !rating || !comment) {
      return res.status(400).json({ message: 'Name, rating, and comment are required.' });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    // Validate rating is between 1 and 5
    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }

    // Create & save review (pending approval)
    const review = new Review({
      product: mongoose.Types.ObjectId(productId),
      name,
      whatsapp,
      rating: parsedRating,
      comment,
      isApproved: false // must be approved by admin before visible
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted and pending approval.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// ADMIN: Get all reviews (for moderation)
exports.getAllReviewsForAdmin = async (req, res) => {
  try {
    const reviews = await Review.find().sort('-createdAt');
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all reviews', error: error.message });
  }
};

// ADMIN: Approve a review
exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.isApproved = true;
    await review.save();
    res.json({ message: 'Review approved', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve review', error: error.message });
  }
};

// ADMIN: Delete a review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};