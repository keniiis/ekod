import React, { useState, useMemo } from 'react';
import type { Product } from '../data/products';
import ProductCard from './ProductCard'; // Import the React ProductCard

interface ShopInterfaceProps {
  products: Product[];
  categories: string[];
}

const ShopInterface: React.FC<ShopInterfaceProps> = ({ products, categories }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.value;
    const isChecked = event.target.checked;

    setSelectedCategories(prevSelected => {
      if (isChecked) {
        // Add category if checked and not already present
        return [...prevSelected, category];
      } else {
        // Remove category if unchecked
        return prevSelected.filter(c => c !== category);
      }
    });
  };

  const filteredProducts = useMemo(() => {
    // If no categories are selected, show all products
    if (selectedCategories.length === 0) {
      return products;
    }
    // Otherwise, filter products whose category is in the selected list
    return products.filter(product => 
      selectedCategories.includes(product.category)
    );
  }, [products, selectedCategories]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filtros */}
      <aside className="md:w-64">
        <div className="space-y-6">
          {/* Filtro por categorías */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Categorías</h3>
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category}>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={category}
                      checked={selectedCategories.includes(category)}
                      onChange={handleCategoryChange}
                      className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-sm capitalize">{category}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {/* Add other filters here if needed */}
        </div>
      </aside>

      {/* Lista de productos */}
      <div className="flex-1">
        {filteredProducts.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {filteredProducts.map(product => (
               <ProductCard key={product.id} product={product} />
             ))}
           </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>No se encontraron productos para las categorías seleccionadas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopInterface;
