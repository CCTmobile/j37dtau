import { toast } from 'sonner';
import { useProducts } from '../../../contexts/ProductContext';
import { useCart } from '../../../contexts/CartContext';
import { ProductCard } from '../../ui/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../../ui/carousel';
import { SectionHeader } from '../ui/SectionHeader';
import { MotionReveal } from '../ui/MotionReveal';
import type { StorefrontCallbacks } from '../types';

export function NewArrivalsRail({ onViewProduct, onNavigateToCategory }: StorefrontCallbacks) {
  const { products, loading } = useProducts();
  const { addItem } = useCart();

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
    <section id="new-arrivals" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="New Season"
          title="New Arrivals"
          subtitle="Fresh silhouettes just off the studio rail — styled, fitted and ready for the new season."
          actionLabel="Shop All"
          onAction={() => onNavigateToCategory('All')}
        />

        <MotionReveal>
          {loading || products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <Carousel
              opts={{ align: 'start', loop: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 md:-ml-4">
                {products.slice(0, 10).map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-3 md:pl-4 basis-[70%] sm:basis-1/2 md:basis-1/3 lg:basis-1/5"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={(p) => handleAddToCart(p.id, p.name)}
                      onViewDetails={onViewProduct}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:inline-flex left-0" />
              <CarouselNext className="hidden md:inline-flex right-0" />
            </Carousel>
          )}
        </MotionReveal>
      </div>
    </section>
  );
}
