/**
 * Formats a number as a Chilean Peso (CLP) string.
 * Example: 29990 => "29.990"
 * @param amount The numeric amount to format.
 * @returns The formatted price string.
 */
export function formatPriceCLP(amount: number): string {
  // Ensure we have a whole number
  const wholeAmount = Math.round(amount); 
  
  // Use Intl.NumberFormat for locale-aware formatting (handles separators)
  // 'es-CL' locale uses '.' as the thousands separator.
  // We set maximumFractionDigits to 0 as CLP doesn't use decimals.
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'decimal', // Use 'decimal' instead of 'currency' to avoid the currency symbol if not desired everywhere
    maximumFractionDigits: 0, 
    minimumFractionDigits: 0, 
  });
  
  return formatter.format(wholeAmount);
}
