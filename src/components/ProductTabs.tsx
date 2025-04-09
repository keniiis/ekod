import React, { useState } from 'react';
import type { Product } from '../data/products'; // Assuming Product type might be needed later

interface ProductTabsProps {
  description: string;
  // Add specifications and comments props if they come from product data
  // specifications?: string | { key: string; value: string }[]; 
  // comments?: { author: string; text: string }[];
}

const ProductTabs: React.FC<ProductTabsProps> = ({ description }) => {
  const [activeTab, setActiveTab] = useState<'descripcion' | 'especificaciones' | 'comentarios'>('descripcion');

  const getButtonClasses = (tabName: 'descripcion' | 'especificaciones' | 'comentarios') => {
    const baseClasses = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClasses} border-indigo-500 text-indigo-600`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs" role="tablist">
          <button
            id="tab-descripcion"
            role="tab"
            aria-selected={activeTab === 'descripcion'}
            aria-controls="panel-descripcion"
            onClick={() => setActiveTab('descripcion')}
            className={getButtonClasses('descripcion')}
          >
            DESCRIPCIÓN
          </button>
          <button
            id="tab-especificaciones"
            role="tab"
            aria-selected={activeTab === 'especificaciones'}
            aria-controls="panel-especificaciones"
            onClick={() => setActiveTab('especificaciones')}
            className={getButtonClasses('especificaciones')}
          >
            ESPECIFICACIONES
          </button>
          <button
            id="tab-comentarios"
            role="tab"
            aria-selected={activeTab === 'comentarios'}
            aria-controls="panel-comentarios"
            onClick={() => setActiveTab('comentarios')}
            className={getButtonClasses('comentarios')}
          >
            COMENTARIOS
          </button>
        </nav>
      </div>
      <div>
        {activeTab === 'descripcion' && (
          <section
            id="panel-descripcion"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-descripcion"
            className="prose max-w-none text-gray-600"
          >
            <p>{description}</p>
          </section>
        )}
        {activeTab === 'especificaciones' && (
          <section
            id="panel-especificaciones"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-especificaciones"
            className="prose max-w-none text-gray-600"
          >
            {/* Placeholder content - replace if actual data exists */}
            <p>Aquí irán las especificaciones detalladas del producto.</p>
            <ul>
              <li>Material: Algodón</li>
              <li>Origen: Chile</li>
              <li>Cuidados: Lavar a máquina</li>
            </ul>
          </section>
        )}
        {activeTab === 'comentarios' && (
          <section
            id="panel-comentarios"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="tab-comentarios"
            className="prose max-w-none text-gray-600"
          >
            {/* Placeholder content - replace if actual data exists */}
            <p>Aquí se mostrarán los comentarios y reseñas de los clientes.</p>
            <div className="mt-4 p-4 border rounded">
              <p className="font-medium">Juan Pérez</p>
              <p>"¡Excelente producto, muy buena calidad!"</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
