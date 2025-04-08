import { useState } from 'react';
import { useCartStore } from '../store/cart';
import { formatPriceCLP } from '../utils/formatting'; // Import the formatter

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string; // Add image to the interface here as well
}

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, updateQuantity } = useCartStore(); // Import updateQuantity
  
  const itemCount = items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  const totalAmount = items.reduce(
    (total: number, item: CartItem) => total + (item.price * item.quantity), 0
  );

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-black relative"
        aria-label="Carrito de compras"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 shadow-sm rounded-md z-10">
          <div className="p-4">
            <h3 className="font-medium text-lg mb-3">Tu carrito</h3>
            
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">El carrito está vacío</p>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto"> {/* Add scroll for many items */}
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-3 border-b border-gray-50 pb-3"> {/* Use items-start and space-x */}
                    {/* Image */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-12 h-12 object-cover rounded flex-shrink-0" // Fixed size image
                    />
                    {/* Details and Controls */}
                    <div className="flex-grow"> 
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        {/* Format item price */}
                        ${formatPriceCLP(item.price)} 
                      </p>
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-xs disabled:opacity-50"
                          aria-label="Disminuir cantidad"
                          disabled={item.quantity <= 1} // Disable if quantity is 1
                        >
                          -
                        </button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-xs"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Keep the remove button, adjust styling */}
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-gray-400 hover:text-red-600 self-start ml-2 p-1" // Adjusted styling
                      aria-label="Eliminar producto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> {/* Slightly smaller icon */}
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between font-medium mb-4">
                  <span>Total:</span>
                   {/* Format total amount */}
                  <span>${formatPriceCLP(totalAmount)}</span>
                </div>
                <a 
                  href="/carrito" 
                  className="block w-full text-center py-2 border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Ver carrito
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
