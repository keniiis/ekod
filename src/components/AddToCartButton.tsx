import React from 'react';
import { useCartStore } from '../store/cart';
import type { Product } from '../data/products'; // Assuming Product type is exported

// Define props for the component, only need id, name, price
interface AddToCartButtonProps {
  product: Pick<Product, 'id' | 'name' | 'price'>;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product }) => {
  // Get the addItem function from the Zustand store
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
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
