import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useProducts } from '../../../contexts/ProductContext';
import { TiltCard } from '../ui/TiltCard';
import { SectionHeader } from '../ui/SectionHeader';
import { MotionReveal } from '../ui/MotionReveal';
import type { StorefrontCallbacks } from '../types';

const CATEGORIES = ['Dresses', 'Casual', 'Shoes', 'Outwear', 'Party', 'Accessories'];

export function CollectionGrid({ onNavigateToCategory }: StorefrontCallbacks) {
  const { products, loading } = useProducts();

  const tiles = CATEGORIES.map((category) => {
    const items = products.filter((p) => p.category === category);
    const cover = items[0]?.images?.[0];
    return { category, count: items.length, cover };
  });

  return (
    <section id="collections" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Curated Hubs"
          title="Shop by Collection"
          subtitle="Six dedicated studios — each with its own silhouette, story and styling direction."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile, index) => (
            <MotionReveal
              key={tile.category}
              delay={index * 0.06}
              className="group"
            >
              <TiltCard maxTilt={7} className="group h-full">
                <button
                  onClick={() => onNavigateToCategory(tile.category)}
                  className="relative block h-full w-full overflow-hidden rounded-3xl text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {loading ? (
                    <div className="aspect-[4/5] w-full animate-pulse bg-muted" />
                  ) : tile.cover ? (
                    <img
                      src={tile.cover}
                      alt={tile.category}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted text-muted-foreground">
                      No images yet
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
                      {tile.count} {tile.count === 1 ? 'Piece' : 'Pieces'}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <h3 className="text-2xl font-bold uppercase tracking-tight text-white">
                        {tile.category}
                      </h3>
                      <motion.span
                        whileHover={{ x: 4 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </motion.span>
                    </div>
                  </div>
                </button>
              </TiltCard>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
