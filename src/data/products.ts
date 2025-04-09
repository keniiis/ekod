// Images are now referenced as strings from the public directory
// import bolsaDeAlmacenamientoPrincipal from '../assets/products/bolsa-de-almacenamiento/bolsa-de-almacenamiento-principal.webp';
// import bolsaDeAlmacenamiento6Unidades from '../assets/products/bolsa-de-almacenamiento/bolsa-de-almacenamiento-6-unidades.webp';

// Interfaz para una opción de variante específica
export interface VariantOption {
  name: string; // e.g., "3" or "6"
  price: number;
  image: { // Now an object with src, width, height
    src: string; 
    width: number;
    height: number;
  }; 
  compareAtPrice?: number; // Optional compare price per variant
}

// Interfaz para un tipo de variante (e.g., "Unidades")
export interface VariantType {
  name: string; // e.g., "Unidades"
  options: VariantOption[];
}

// Asegúrate de exportar tanto la interfaz como los datos
export interface Product {
  id: string; 
  slug: string; 
  name: string;
  // price: number; // Price is now per variant option
  // compareAtPrice?: number; // Compare price is now per variant option
  description: string;
  // images: any[]; // Images are now per variant option or default
  variants?: VariantType[]; // Array of variant types
  category: string;
  tags?: string[];
  // Add default image and price for initial display before selection
  defaultImage: { // Now an object with src, width, height
    src: string; 
    width: number;
    height: number;
  }; 
  defaultPrice: number;
  defaultCompareAtPrice?: number;
}

// Helper function to generate slugs (no changes needed here)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Separate accent marks from letters
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Collapse whitespace and replace by -
    .replace(/-+/g, '-'); // Collapse dashes
}

// Generate products with slugs
const rawProducts = [
  {
    id: '1',
    name: 'Bolsa de Almacenamiento Premium',
    // No top-level price/compare/images anymore, moved to variants/defaults
    description: '¿Tu ropa ocupa demasiado espacio? Nuestras bolsas organizadoras premium te ayudan a ordenar tu closet fácilmente. Son resistentes, espaciosas y elegantes. Perfectas para guardar ropa de cama, mantas o ropa de temporada. Además, su diseño plegable permite ahorrar aún más espacio.',
    category: 'casa',
    // Use string paths relative to public/ and add dimensions
    defaultImage: { 
      src: '/assets/products/bolsa-de-almacenamiento/bolsa-de-almacenamiento-principal.webp', 
      width: 600, // Add actual width
      height: 600 // Add actual height
    }, 
    defaultPrice: 19990, // Set default price (for 3 units)
    defaultCompareAtPrice: 29990, // Set default compare price (for 3 units)
    variants: [
      { 
        name: 'Unidades', 
        options: [
          { 
            name: '3', 
            price: 19990, 
            // Use string paths relative to public/ and add dimensions
            image: { 
              src: '/assets/products/bolsa-de-almacenamiento/bolsa-de-almacenamiento-principal.webp', 
              width: 600, // Add actual width
              height: 600 // Add actual height
            }, 
            compareAtPrice: 29990 
          },
          { 
            name: '6', 
            price: 29990, // Different price for 6 units
            // Use string paths relative to public/ and add dimensions
            image: { 
              src: '/assets/products/bolsa-de-almacenamiento/bolsa-de-almacenamiento-6-unidades.webp', 
              width: 600, // Add actual width
              height: 600 // Add actual height
            }, 
            compareAtPrice: 39990 // Optional: Different compare price for 6 units
          }
        ] 
      }
    ]
  },
  {
    // --- Example for product without variants (needs default image/price) ---
    // You'll need to import an image for this product too
    // import jeansNegrosImage from '../assets/productos/jeans-negros/imagen.webp'; 
    id: '2',
    name: 'Jeans Ajustados Negros',
    description: 'Jeans cómodos y versátiles para cualquier ocasión.',
    category: 'ropa',
    // Use string path and add dimensions
    defaultImage: { 
      src: 'https://placehold.co/600x600?text=Jeans', // Placeholder or use real path
      width: 600, 
      height: 600 
    }, 
    defaultPrice: 49990,
    // variants: [ // If Jeans had variants like size, structure like above
    //   { name: 'Talla', options: [ { name: '38', price: 49990, image: { src: '/path/to/jeans.webp', width: 600, height: 600 } }, ... ] }
    // ]
  },
  {
    // import zapatillasBlancasImage from '../assets/productos/zapatillas-blancas/imagen.webp';
    id: '3',
    name: 'Zapatillas Urbanas Blancas',
    description: 'Zapatillas de cuero sintético, estilo clásico.',
    category: 'calzado',
    // Use string path and add dimensions
    defaultImage: { 
      src: 'https://placehold.co/600x600?text=Zapatillas', // Placeholder or use real path
      width: 600, 
      height: 600 
    }, 
    defaultPrice: 54990,
    defaultCompareAtPrice: 64990,
  },
  // ... add more products as needed
];

// Add slugs to each product (no changes needed here)
export const products: Product[] = rawProducts.map(product => ({
  ...product,
  slug: generateSlug(product.name),
}));
