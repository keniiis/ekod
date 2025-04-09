import React from 'react'; // Removed useState and useEffect
import { useCartStore } from '../store/cart';
// Assuming Product type is exported from data/products, but we only need specific fields
// We receive simple types from Astro now for price/image

// Define props for the component
interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number; // Initial price
    images: string[]; // Image URL array reflecting the selected variant
  };
  variant?: string | null; // Variant name string reflecting the selected variant (e.g., "Unidades: 6")
}


const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product, variant }) => {
  // Get the addItem function from the Zustand store
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    // Use the props directly, as they are updated by the parent component
    const itemToAdd = {
      // Generate a unique ID for the cart item, including the variant
      // Example: 'product-1-unidades-6'
      id: variant ? `${product.id}-${variant.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : product.id, 
      name: variant ? `${product.name} (${variant})` : product.name, // Add variant to name
      price: product.price, // Use the price from the product prop (updated by parent)
      image: product.images?.[0] ?? 'https://placehold.co/100x100?text=No+Image', // Use the image from the product prop
      productId: product.id, // Keep original product ID if needed
      variantName: variant // Store variant name separately if needed by cart logic
    };
    
    addItem(itemToAdd);

    console.log(`${itemToAdd.name} added to cart with price ${itemToAdd.price}`); 
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
