import { useState } from 'react';
import { useCartStore } from '../store/cart';
import { formatPriceCLP } from '../utils/formatting'; // Import the formatter

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem } = useCartStore();
  
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
              <div className="space-y-4">
                {items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {/* Format item price */}
                        {item.quantity} × ${formatPriceCLP(item.price)} 
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-black"
                      aria-label="Eliminar producto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
