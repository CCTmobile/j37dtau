import type { Product } from '../../App';

export interface StorefrontCallbacks {
  onViewProduct: (product: Product) => void;
  onNavigateToCategory: (category: string) => void;
  onShopAll?: () => void;
}
