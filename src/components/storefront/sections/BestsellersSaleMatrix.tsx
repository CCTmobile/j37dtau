import { toast } from 'sonner';
import { useProducts } from '../../../contexts/ProductContext';
import { useCart } from '../../../contexts/CartContext';
import { ProductCard } from '../../ui/ProductCard';
import { SectionHeader } from '../ui/SectionHeader';
import { MotionReveal } from '../ui/MotionReveal';
import { isOnSale } from '../format';
import type { StorefrontCallbacks } from '../types';

export function BestsellersSaleMatrix({ onViewProduct, onNavigateToCategory }: StorefrontCallbacks) {
  const { products, loading } = useProducts();
  const { addItem } = useCart();

  const bestsellers = products
    .filter((p) => p.rating >= 4.5 || isOnSale(p))
    .sort((a, b) => {
      const aDiscount = a.originalPrice && a.originalPrice > a.price ? a.originalPrice - a.price : 0;
      const bDiscount = b.originalPrice && b.originalPrice > b.price ? b.originalPrice - b.price : 0;
      return bDiscount - aDiscount;
    })
    .slice(0, 8);

  const handleAddToCart = async (productId: string, name: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const size = product.sizes[0] || 'M';
    const color = product.colors[0] || 'Default';
    const success = await addItem(product, size, color, 1);
    if (success) {
      toast.success(`${name} added to bag`);
    } else {
      toast.error('Failed to add item to bag');
    }
  };

  return (
    <section id="bestsellers" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Most Wanted"
          title="Bestsellers & Limited Offers"
          subtitle="The pieces our customers keep coming back for — including this season's limited-offer reductions."
          actionLabel="View All Products"
          onAction={() => onNavigateToCategory('All')}
        />

        <MotionReveal>
          {loading || bestsellers.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {bestsellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(p) => handleAddToCart(p.id, p.name)}
                  onViewDetails={onViewProduct}
                />
              ))}
            </div>
          )}
        </MotionReveal>
      </div>
    </section>
  );
}
