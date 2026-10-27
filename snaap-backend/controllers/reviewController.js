const mongoose = require('mongoose');
const Review = require('../models/review');
const Product = require('../models/Product');

const NAME_MAX = 60;
const COMMENT_MAX = 1000;
const PHONE_MAX = 20;

// The reviewer's phone number is for the shop only. Every public read strips it.
const PUBLIC_FIELDS = '-whatsapp';

// Recompute a product's public rating from its APPROVED reviews only. updateOne,
// not save(): a new review is not an edit to the product, so updatedAt is left
// alone.
async function refreshProductRating(productId) {
  const [agg] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), isApproved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
        reviewCount: agg ? agg.count : 0,
      },
    }
  );
}

// GET: All reviews for a product (approved only)
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }
    const reviews = await Review.find({ product: productId, isApproved: true })
      .select(PUBLIC_FIELDS)
      .sort('-createdAt');
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// POST: Add a new review (no account needed). Held for moderation: nothing a
// visitor posts is public until an admin approves it.
exports.addProductReview = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    // String() so a JSON object can't reach Mongo as an operator.
    const name = String(req.body.name || '').trim();
    const comment = String(req.body.comment || '').trim();
    const whatsapp = String(req.body.whatsapp || '').trim();
    const rating = Number(req.body.rating);

    if (!name || !comment || !req.body.rating) {
      return res.status(400).json({ message: 'Name, rating, and comment are required.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5.' });
    }
    if (name.length > NAME_MAX) {
      return res.status(400).json({ message: `Name must be ${NAME_MAX} characters or fewer.` });
    }
    if (comment.length > COMMENT_MAX) {
      return res.status(400).json({ message: `Review must be ${COMMENT_MAX} characters or fewer.` });
    }
    if (whatsapp.length > PHONE_MAX) {
      return res.status(400).json({ message: 'That phone number is too long.' });
    }

    // A review must belong to a product a customer can actually see.
    const exists = await Product.exists({ _id: productId, isDeleted: { $ne: true } });
    if (!exists) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Was `mongoose.Types.ObjectId(productId)` — a class constructor called
    // without `new`, which throws on Mongoose 8. The schema casts the string.
    await Review.create({
      product: productId,
      name,
      whatsapp: whatsapp || undefined,
      rating,
      comment,
      isApproved: false,
    });

    res.status(201).json({ message: 'Thanks! Your review will appear once it has been approved.' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

// ADMIN: reviews for moderation, newest first. ?status=pending|approved|all
exports.getAllReviewsForAdmin = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = {};
    if (req.query.status === 'pending') filter.isApproved = false;
    else if (req.query.status === 'approved') filter.isApproved = true;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('product', 'name'),
      Review.countDocuments(filter),
    ]);
    res.json({ reviews, total, page, limit });
  } catch (error) {
    console.error('Error fetching reviews for admin:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// ADMIN: Approve a review
exports.approveReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID.' });
    }
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.isApproved = true;
    await review.save();
    await refreshProductRating(review.product);
    res.json({ message: 'Review approved', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ message: 'Failed to approve review' });
  }
};

// ADMIN: Delete a review
exports.deleteReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.reviewId)) {
      return res.status(400).json({ message: 'Invalid review ID.' });
    }
    const review = await Review.findByIdAndDelete(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    // Only an approved review was ever counted in the product's rating.
    if (review.isApproved) await refreshProductRating(review.product);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
};
