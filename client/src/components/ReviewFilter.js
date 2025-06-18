import React from "react";

const ReviewFilter = ({ filterStars, sortOrder, setFilterStars, setSortOrder }) => {
  return (
    <div className="bg-gray-100 p-4 rounded shadow-md mb-6 flex gap-4 items-center flex-wrap">
      <div>
        <label className="mr-2 font-medium">Filter by Star:</label>
        <select
          className="border rounded px-2 py-1"
          value={filterStars}
          onChange={(e) => setFilterStars(Number(e.target.value))}
        >
          <option value={0}>All</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s} Stars
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mr-2 font-medium">Sort:</label>
        <select
          className="border rounded px-2 py-1"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
};

export default ReviewFilter;
