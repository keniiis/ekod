// Asegúrate de exportar tanto la interfaz como los datos
export interface Product {
  id: string; // Keep ID for internal reference if needed
  slug: string; // Add slug field
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  variants?: {
    name: string;
    options: string[];
  }[];
  category: string;
  tags?: string[];
}

// Helper function to generate slugs
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
    name: 'Camiseta Minimal',
    price: 29990,
    compareAtPrice: 39990,
    description: 'Camiseta de algodón orgánico',
    images: ['https://placehold.co/600x600'], // Placeholder image
    category: 'ropa',
    variants: [
      { name: 'Talla', options: ['S', 'M', 'L'] }
    ]
  },
  {
    id: '2',
    name: 'Jeans Ajustados Negros',
    price: 49990,
    description: 'Jeans cómodos y versátiles para cualquier ocasión.',
    images: ['https://placehold.co/600x600?text=Jeans'],
    category: 'ropa',
    variants: [
      { name: 'Talla', options: ['38', '40', '42', '44'] }
    ]
  },
  {
    id: '3',
    name: 'Zapatillas Urbanas Blancas',
    price: 54990,
    compareAtPrice: 64990,
    description: 'Zapatillas de cuero sintético, estilo clásico.',
    images: ['https://placehold.co/600x600?text=Zapatillas'],
    category: 'calzado',
  },
  // ... add more products as needed
];

// Add slugs to each product
export const products: Product[] = rawProducts.map(product => ({
  ...product,
  slug: generateSlug(product.name),
}));
