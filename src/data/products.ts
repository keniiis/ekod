// Asegúrate de exportar tanto la interfaz como los datos
export interface Product {
  id: string;
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

export const products: Product[] = [
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
  // ... otros productos
];
