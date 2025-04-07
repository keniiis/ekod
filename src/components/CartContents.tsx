import React, { useMemo } from 'react';
import { useCartStore } from '../store/cart';
import { formatPriceCLP } from '../utils/formatting'; // Import the formatter

const CartContents: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  // Simple shipping calculation for now
  const shipping = subtotal > 0 ? 5.00 : 0; 
  const total = subtotal + shipping;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity);
    } else {
      // Remove item if quantity is less than 1
      removeItem(id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Lista de productos */}
      <div className="lg:flex-1">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-sm font-medium">Tus Productos</h2>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>El carrito está vacío</p>
            <a href="/tienda" className="mt-4 inline-block text-sm underline">Explorar productos</a>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4">
                {/* Basic image placeholder - replace if you have images */}
                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0"></div> 
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {/* Format item price */}
                  <p className="text-sm text-gray-500">${formatPriceCLP(item.price)}</p> 
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                    className="w-16 border rounded px-2 py-1 text-center text-sm"
                  />
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
                <div className="w-20 text-right font-medium">
                  {/* Format line total */}
                  ${formatPriceCLP(item.price * item.quantity)} 
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Resumen */}
      <div className="lg:w-80">
        <div className="border border-gray-100 p-4">
          <h2 className="text-sm font-medium mb-4">RESUMEN</h2>
          
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              {/* Format subtotal */}
              <span>${formatPriceCLP(subtotal)}</span> 
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Envío</span>
               {/* Format shipping */}
              <span>${formatPriceCLP(shipping)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                 {/* Format total */}
                <span>${formatPriceCLP(total)}</span>
              </div>
            </div>
          </div>

          <button 
            className="w-full py-3 border border-black text-black hover:bg-black hover:text-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={items.length === 0}
            onClick={() => { window.location.href = '/checkout'; }} 
          >
            Proceder al pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartContents;
