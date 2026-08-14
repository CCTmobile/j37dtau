export const formatZAR = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const discountPercentage = (product: { price: number; originalPrice?: number }): number => {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
};

export const isOnSale = (product: { price: number; originalPrice?: number }): boolean => {
  return !!product.originalPrice && product.originalPrice > product.price;
};
