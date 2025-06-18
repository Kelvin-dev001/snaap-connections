import React, { useEffect, useState } from "react";
import API from "../api/apiService";
import ReviewFilter from "./ReviewFilter";
import ReviewCard from "./ReviewCard";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Alert,
  Link,
  Stack
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import Slider from "react-slick";

// --- Review Summary with Star Icons ---
const ReviewSummary = ({ reviews }) => {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => Math.round(r.rating) === star).length
  );

  return (
    <Box className="bg-gray-50 p-4 rounded shadow-md mb-6" sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Review Summary
      </Typography>
      {counts.map((count, idx) => {
        const star = 5 - idx;
        const percent = total ? (count / total) * 100 : 0;
        return (
          <Box key={star} sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center">
                {[...Array(star)].map((_, i) => (
                  <StarIcon key={i} fontSize="small" htmlColor="#FFD600" sx={{ mr: 0.2 }} />
                ))}
              </Stack>
              <Typography variant="body2" sx={{ minWidth: 22 }}>{count}</Typography>
            </Stack>
            <Box sx={{ width: "100%", bgcolor: "#e0e0e0", borderRadius: 1, height: 6, mt: 0.5 }}>
              <Box
                sx={{
                  width: `${percent}%`,
                  bgcolor: "primary.main",
                  height: 6,
                  borderRadius: 1,
                  transition: "width 0.5s"
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// ===== Review Submission Form =====
const ReviewForm = ({ open, handleClose, productId, onSubmitSuccess }) => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const handleSubmit = async () => {
    setError("");
    if (!name || !comment || !rating) {
      setError("Name, rating, and comment are required.");
      return;
    }
    if (lastSubmitted && Date.now() - lastSubmitted < 60000) {
      setError("You can only submit one review per minute.");
      return;
    }
    setSubmitting(true);
    try {
      await API.submitProductReview(productId, { name, whatsapp, rating, comment });
      setLastSubmitted(Date.now());
      setName("");
      setWhatsapp("");
      setRating(0);
      setComment("");
      onSubmitSuccess();
      handleClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit review.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Write a Review</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          label="Name"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="WhatsApp (optional)"
          fullWidth
          variant="standard"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography sx={{ mt: 2, mb: 1 }}>Rating</Typography>
        <Rating value={rating} onChange={(_, val) => setRating(val)} precision={1} />
        <TextField
          label="Comment"
          fullWidth
          multiline
          minRows={3}
          variant="standard"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 2 }}
        />
        <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
          Submitted reviews are subject to admin approval before they appear publicly.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !name || !comment || !rating}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===== Main Review Section =====
const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [filterStars, setFilterStars] = useState(0); // 0 = all
  const [sortOrder, setSortOrder] = useState("newest");
  const [showForm, setShowForm] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Fetch approved reviews
  useEffect(() => {
    if (!productId || productId === "all") {
      setReviews([]);
      return;
    }
    API.getProductReviews(productId)
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => setReviews([]));
  }, [productId, refreshFlag]);

  // Filter and sort reviews
  const filtered = reviews
    .filter((r) => (filterStars ? Math.round(r.rating) === filterStars : true))
    .sort((a, b) =>
      sortOrder === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  // Top reviews summary: average, count, best/worst
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(2)
    : "—";

  // Carousel settings for best reviews
  const sliderSettings = {
    dots: true,
    infinite: filtered.length > 3,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 3,
    responsive: [
      { breakpoint: 900, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ fontWeight: 700, mb: 1.5, color: "primary.main" }}
      >
        What Customers Say
      </Typography>
      {/* Review summary */}
      <ReviewSummary reviews={reviews} />
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="subtitle1" color="text.secondary">
          <b>{reviews.length}</b> review{reviews.length !== 1 && "s"} &middot; Average Rating:{" "}
          <b>{avgRating}</b>/5
        </Typography>
        {/* Only allow review submission if a valid productId is present */}
        {productId && productId !== "all" && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 1 }}
            onClick={() => setShowForm(true)}
          >
            Write a Review
          </Button>
        )}
      </Box>
      {/* Filter bar */}
      <ReviewFilter
        filterStars={filterStars}
        sortOrder={sortOrder}
        setFilterStars={setFilterStars}
        setSortOrder={setSortOrder}
      />
      {/* Reviews carousel */}
      {filtered.length === 0 ? (
        <Typography
          align="center"
          color="text.secondary"
          sx={{ mt: 6, mb: 10 }}
        >
          No reviews yet.{" "}
          <Link href="/products" underline="hover" color="primary">
            Be the first to review — Shop Now!
          </Link>
        </Typography>
      ) : (
        <Box sx={{ maxWidth: 1090, mx: "auto" }}>
          <Slider {...sliderSettings}>
            {filtered.map((review, i) => (
              <Box key={review._id || review.id || i} sx={{ px: 1 }}>
                <ReviewCard review={review} />
              </Box>
            ))}
          </Slider>
        </Box>
      )}
      {/* Review form dialog */}
      {productId && productId !== "all" && (
        <ReviewForm
          open={showForm}
          handleClose={() => setShowForm(false)}
          productId={productId}
          onSubmitSuccess={() => setRefreshFlag((f) => !f)}
        />
      )}
      {/* Brief summary of top reviews */}
      {reviews.length > 0 && (
        <Box sx={{ mt: 6, bgcolor: "#f3fbff", p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Top Comments:
          </Typography>
          {reviews
            .filter((r) => r.rating >= 4)
            .slice(0, 3)
            .map((r, i) => (
              <Typography
                key={i}
                variant="body2"
                sx={{ mb: 1.5, fontStyle: "italic" }}
              >
                “
                {r.comment && r.comment.length > 120
                  ? r.comment.slice(0, 120) + "..."
                  : r.comment}
                ” — <b>{r.name}</b>
              </Typography>
            ))}
        </Box>
      )}
    </Box>
  );
};

export default ReviewSection;