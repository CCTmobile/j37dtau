import { useState } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useProducts } from '../../contexts/ProductContext';
import { BottomSpacer } from '../ui/bottom-spacer';
import { AnnouncementTicker } from './sections/AnnouncementTicker';
import { Hero3DStudio } from './sections/Hero3DStudio';
import { MovingDressReel } from './sections/MovingDressReel';
import { NewArrivalsRail } from './sections/NewArrivalsRail';
import { CollectionGrid } from './sections/CollectionGrid';
import { AtelierBrandStory } from './sections/AtelierBrandStory';
import { BestsellersSaleMatrix } from './sections/BestsellersSaleMatrix';
import { WhyRosemamaGrid } from './sections/WhyRosemamaGrid';
import { CustomerLoveTrustpilot } from './sections/CustomerLoveTrustpilot';
import { StudioNewsletter } from './sections/StudioNewsletter';
import { Quick3DPreviewModal } from './sections/Quick3DPreviewModal';
import type { Product } from '../../App';
import type { StorefrontCallbacks } from './types';

export function StorefrontHome({
  onViewProduct,
  onNavigateToCategory,
  onShopAll
}: StorefrontCallbacks) {
  const { loading } = useProducts();
  const reduceMotion = useReducedMotion();
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  const callbacks: StorefrontCallbacks = {
    onViewProduct,
    onNavigateToCategory,
    onShopAll
  };

  return (
    <div className="overflow-x-hidden bg-background">
      {!reduceMotion && (
        <motion.div
          style={{ scaleX }}
          className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-rose-500"
          aria-hidden="true"
        />
      )}

      <AnnouncementTicker />

      {loading ? (
        <div className="flex h-[70vh] items-center justify-center bg-[#0a0a0f]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-rose-400" />
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Preparing the studio…
            </p>
          </div>
        </div>
      ) : (
        <Hero3DStudio {...callbacks} onOpenPreview={setPreviewProduct} />
      )}

      <MovingDressReel />
      <NewArrivalsRail {...callbacks} />
      <CollectionGrid {...callbacks} />
      <AtelierBrandStory />
      <BestsellersSaleMatrix {...callbacks} />
      <WhyRosemamaGrid {...callbacks} />
      <CustomerLoveTrustpilot {...callbacks} />
      <StudioNewsletter />

      <Quick3DPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onViewDetails={(product) => {
          onViewProduct(product);
          setPreviewProduct(null);
        }}
      />

      <BottomSpacer />
    </div>
  );
}
