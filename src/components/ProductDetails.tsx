import React, { useState, useRef } from 'react';
import type { Product, VariantOption, VariantType } from '../data/products';
import AddToCartButton from './AddToCartButton';

// REMOVED Drift global declaration

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const firstVariantType = product.variants?.[0];
  const firstVariantOption = firstVariantType?.options?.[0];

  // State for selected variant details
  const [selectedOption, setSelectedOption] = useState<VariantOption | null>(firstVariantOption ?? null);
  const [currentImage, setCurrentImage] = useState(selectedOption?.image ?? product.defaultImage);
  const [currentPrice, setCurrentPrice] = useState(selectedOption?.price ?? product.defaultPrice);
  const [currentCompareAtPrice, setCurrentCompareAtPrice] = useState(selectedOption?.compareAtPrice ?? product.defaultCompareAtPrice ?? null);
  const [selectedVariantTypeName, setSelectedVariantTypeName] = useState<string>(firstVariantType?.name ?? '');

  // State for zoom functionality
  const [showZoom, setShowZoom] = useState(false);
  // Store relative percentages (x, y) and absolute page coordinates (pageX, pageY)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, pageX: 0, pageY: 0 }); 
  const imageRef = useRef<HTMLImageElement>(null);
  const zoomLevel = 2; // Define zoom level (e.g., 2x)

  // REMOVED Drift refs and useEffect

  const handleVariantSelect = (option: VariantOption, variantTypeName: string) => {
    setSelectedOption(option);
    setCurrentImage(option.image);
    setCurrentPrice(option.price);
    setCurrentCompareAtPrice(option.compareAtPrice ?? null);
    setSelectedVariantTypeName(variantTypeName);
  };

  // Event handlers for zoom
  const handleMouseEnter = () => {
    setShowZoom(true);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    // Calculate mouse position relative to the image element
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    // Store both relative and absolute coordinates
    setMousePos({ x, y, pageX: e.pageX, pageY: e.pageY }); 
  };

  // Format price helper (client-side)
  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return '';
    return price.toLocaleString('es-CL');
  };

  // Calculate background size and position for the zoom panel
  const backgroundSize = `${currentImage.width * zoomLevel}px ${currentImage.height * zoomLevel}px`;
  const backgroundPosition = `-${mousePos.x * zoomLevel}% -${mousePos.y * zoomLevel}%`; // Incorrect calculation - needs adjustment based on panel size vs image size

  // Corrected background position calculation
  // We need the size of the zoom panel itself to calculate the correct offset
  // Let's assume the zoom panel is the same size as the original image for simplicity first
  const correctedBackgroundPosition = `${mousePos.x}% ${mousePos.y}%`; // This centers the zoomed point, needs offset calculation

  // More accurate background position:
  // Calculate offset based on mouse position percentage and zoom level
  // This formula centers the zoomed area under the mouse cursor
  const bgPosX = `calc(${mousePos.x}% - (${mousePos.x / 100} * ${currentImage.width}px))`;
  const bgPosY = `calc(${mousePos.y}% - (${mousePos.y / 100} * ${currentImage.height}px))`;
  const finalBackgroundPosition = `${bgPosX} ${bgPosY}`; // Still might need refinement depending on exact desired effect

  // Let's try a simpler, more common calculation:
  const simpleBgPosX = `${mousePos.x}%`;
  const simpleBgPosY = `${mousePos.y}%`;

  // --- Thumbnail Logic ---
  // Create a list of unique thumbnail images to display
  const thumbnailImages = [product.defaultImage]; // Start with default
  const seenSources = new Set([product.defaultImage.src]); // Keep track of sources added

  product.variants?.forEach(variantType => {
    variantType.options.forEach(option => {
      if (option.image && !seenSources.has(option.image.src)) {
        thumbnailImages.push(option.image);
        seenSources.add(option.image.src);
      }
    });
  });

  // Helper function to find the variant option and type matching an image source
  const findMatchingVariant = (imageSrc: string): { option: VariantOption; type: VariantType } | null => {
    if (!product.variants) return null;
    for (const variantType of product.variants) {
        const foundOption = variantType.options.find(o => o.image?.src === imageSrc);
        if (foundOption) {
            return { option: foundOption, type: variantType };
        }
    }
    return null;
  };


  // Handle thumbnail click
  const handleThumbnailClick = (image: { src: string; width: number; height: number }) => {
    setCurrentImage(image); // Always update the main image visually

    const match = findMatchingVariant(image.src);

    if (match) {
        // If it matches a variant, update the full selection state
        setSelectedOption(match.option);
        setCurrentPrice(match.option.price);
        setCurrentCompareAtPrice(match.option.compareAtPrice ?? null);
        setSelectedVariantTypeName(match.type.name);
    } else if (image.src === product.defaultImage.src) {
        // If it's the default image, reset to default price/selection
        // Find the *first* variant option to set as selected (if any)
        const firstVarType = product.variants?.[0];
        const firstVarOpt = firstVarType?.options?.[0];
        setSelectedOption(firstVarOpt ?? null);
        setCurrentPrice(product.defaultPrice);
        setCurrentCompareAtPrice(product.defaultCompareAtPrice ?? null);
        setSelectedVariantTypeName(firstVarType?.name ?? '');
    }
    // If the clicked image doesn't match the default or a *specific* variant's primary image
    // (e.g., multiple variants use the same image), this logic just updates the display image,
    // which might be acceptable depending on requirements.
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Columna Izquierda: Imagen + Miniaturas */}
      <div> {/* Wrapper div for the left column content */}
        {/* Imagen con Zoom */}
        <div
          className="relative product-image-container cursor-zoom-in" // Added cursor-zoom-in
          onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imageRef}
          src={currentImage.src}
          width={currentImage.width}
          height={currentImage.height}
          className="w-full h-auto border rounded block" // Ensure it's a block element
          alt={product.name}
          // REMOVED Drift attributes
        />
        {/* Zoom Panel */}
        {showZoom && (
          <div
            style={{
              position: 'absolute', // Position relative to the container (.product-image-container)
              // Position top-left based on relative mouse percentage within the container
              left: `${mousePos.x}%`, 
              top: `${mousePos.y}%`, 
              // Then use transform to center the panel on that relative point
              transform: 'translate(-50%, -50%)', 
              width: `200px`, // Set fixed smaller width
              height: `200px`, // Set fixed smaller height
              backgroundImage: `url(${currentImage.src})`,
              backgroundSize: `${currentImage.width * zoomLevel}px ${currentImage.height * zoomLevel}px`, // Zoomed background size
              backgroundPosition: `${simpleBgPosX} ${simpleBgPosY}`, // Position based on mouse
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none', // Prevent mouse events on the zoom panel itself
              border: '1px solid #ccc', // Optional border
              zIndex: 10, // Ensure it's above other elements
            }}
          />
        )}
        </div> {/* End of product-image-container */}

        {/* Thumbnail Gallery */}
        {thumbnailImages.length > 1 && (
          <div className="mt-4 flex space-x-2">
            {thumbnailImages.map((thumb) => (
              <button
              key={thumb.src}
              type="button"
              onClick={() => handleThumbnailClick(thumb)}
              className={`block border rounded overflow-hidden w-16 h-16 ${
                currentImage.src === thumb.src ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'
              }`}
            >
              <img 
                src={thumb.src} 
                alt={`Thumbnail ${thumb.src}`} 
                width={64} 
                height={64} 
                className="w-full h-full object-cover" 
              />
            </button>
            ))}
          </div>
        )}
      </div> {/* End of wrapper div for left column */}

      {/* Columna Derecha: Detalles del producto */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>

        {/* Precios */}
        <div className="mb-4">
          {currentCompareAtPrice && (
            <span className="text-gray-500 line-through mr-2">
              ${formatPrice(currentCompareAtPrice)}
            </span>
          )}
          <span className="text-xl font-semibold">
            ${formatPrice(currentPrice)}
          </span>
        </div>

        {/* Variantes */}
        {product.variants?.map((variantType) => (
          <div key={variantType.name} className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">{variantType.name}</h3>
            <div className="flex gap-2">
              {variantType.options.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => handleVariantSelect(option, variantType.name)}
                  className={`px-3 py-1 border rounded text-sm ${
                    selectedOption?.name === option.name && selectedVariantTypeName === variantType.name
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Botón Agregar al Carrito */}
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: currentPrice,
            images: [currentImage.src]
          }}
          variant={selectedOption ? `${selectedVariantTypeName}: ${selectedOption.name}` : null}
        />
      </div>
    </div>
  );
};

export default ProductDetails;
