import React from 'react';
import { useCartStore } from '../store/cart';
import type { Product } from '../data/products'; // Assuming Product type is exported

// Define props for the component, now including images
interface AddToCartButtonProps {
  product: Pick<Product, 'id' | 'name' | 'price' | 'images'>; // Add 'images'
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product }) => {
  // Get the addItem function from the Zustand store
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    // Ensure there's at least one image, provide a fallback if needed
    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/100x100?text=No+Image'; 
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imageUrl, // Pass the image URL
    });
    // Optional: Add some user feedback, like showing a notification or changing button text
    console.log(`${product.name} added to cart`); 
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="bg-black text-white px-6 py-3 rounded w-full hover:bg-gray-800 transition"
    >
      Añadir al carrito
    </button>
  );
};

export default AddToCartButton;
