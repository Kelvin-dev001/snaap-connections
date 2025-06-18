import React from "react";

const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white border rounded shadow-sm p-4">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-bold">{review.name}</h4>
        <div className="text-yellow-500">
          {"⭐".repeat(Math.round(review.rating))}
          <span className="text-gray-400 text-sm">
            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700">{review.comment}</p>
      {review.image && (
        <img
          src={review.image}
          alt="Review"
          className="mt-2 rounded max-h-48 object-cover"
        />
      )}
    </div>
  );
};

export default ReviewCard;