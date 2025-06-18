import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const ProductGrid = ({ items = [], loading = false }) => {
  const [loadedImages, setLoadedImages] = useState({});

  const handleImageLoad = (id) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 py-10">
        {[...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-gray-200 rounded-xl overflow-hidden animate-pulse">
            <div className="w-full h-56 bg-gray-300"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="h-5 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="col-span-full text-center py-20">
        <div className="mx-auto max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="products" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4 py-10">
      {items.map((product) => (
        <Link to={`/product/${product._id}`} key={product._id}>
          <div className="relative bg-white shadow-lg hover:shadow-2xl rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] group">
            <div className="relative w-full h-56 overflow-hidden">
              {product.imageUrl ? (
                <>
                  {!loadedImages[product._id] && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                  )}
                  <img
                    src={`http://localhost:5000${product.imageUrl}`}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loadedImages[product._id] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(product._id)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                    }}
                    loading="lazy"
                  />
                </>
              ) : (
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                    {product.brand} - {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {product.category}
                  </p>
                </div>
                <p className="text-blue-600 font-bold text-md whitespace-nowrap">
                  ${product.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              {product.rating && (
                <div className="mt-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    ({product.reviewCount || 0})
                  </span>
                </div>
              )}
            </div>

            {product.featured && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                Featured
              </div>
            )}

            {product.discount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                -{product.discount}%
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ProductGrid;