import React from 'react';
import type { Product } from '../data/products'; // Import the Product type
import { formatPriceCLP } from '../utils/formatting'; // Import the formatting function

// Define the props interface for the React component
interface ProductCardProps {
  product: Product; // Use the imported type
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <article className="group relative">
      <a href={`/producto/${product.slug}`} className="block"> {/* Use product.slug here */}
        {/* Imagen del producto */}
        <div className="aspect-square bg-gray-50 mb-3 overflow-hidden rounded">
          {/* Use defaultImage which contains src, width, height */}
          {product.defaultImage ? (
            <img 
              src={product.defaultImage.src} 
              width={product.defaultImage.width}
              height={product.defaultImage.height}
              alt={product.name}
              className="w-full h-full object-cover transition duration-300 group-hover:opacity-90"
              loading="lazy"
            />
          ) : (
            // Placeholder SVG if no image
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
        </div>
        
        {/* Información del producto */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
          {product.category && (
            <p className="text-xs text-gray-500 mb-2 capitalize">{product.category}</p>
          )}
          <p className="text-sm font-medium text-gray-900">
            {/* Use defaultPrice */}
            ${formatPriceCLP(product.defaultPrice)} 
            {/* Use defaultCompareAtPrice */}
            {product.defaultCompareAtPrice && (
              <span className="ml-2 text-xs text-gray-500 line-through">
                ${formatPriceCLP(product.defaultCompareAtPrice)} 
              </span>
            )}
          </p>
        </div>
      </a>
    </article>
  );
};

export default ProductCard;
