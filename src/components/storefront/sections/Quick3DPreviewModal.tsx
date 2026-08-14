import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring
} from 'framer-motion';
import { ShoppingBag, X, Eye, Move3d } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../../contexts/CartContext';
import { formatZAR, discountPercentage } from '../format';
import type { Product } from '../../../App';

interface Quick3DPreviewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewDetails: (product: Product) => void;
}

export function Quick3DPreviewModal({
  product,
  onClose,
  onViewDetails
}: Quick3DPreviewModalProps) {
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const rotateY = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });

  useEffect(() => {
    setImageIndex(0);
    setSelectedSize(product?.sizes[0] || '');
    setSelectedColor(product?.colors[0] || '');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [product, onClose]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !product) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 50);
    rotateX.set((0.5 - py) * 30);
  };

  const handlePointerLeave = () => {
    rotateY.set(0);
    rotateX.set(0);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const size = selectedSize || product.sizes[0] || 'M';
    const color = selectedColor || product.colors[0] || 'Default';
    const success = await addItem(product, size, color, 1);
    if (success) {
      toast.success(`${product.name} added to bag`);
    } else {
      toast.error('Failed to add item to bag');
    }
  };

  const images = product?.images?.length ? product.images : ['/images/placeholder-product.svg'];
  const currentImage = images[imageIndex] || images[0];
  const discount = product ? discountPercentage(product) : 0;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} 3D preview`}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid max-h-[90vh] w-full max-w-5xl overflow-hidden overflow-y-auto rounded-3xl border border-white/15 bg-[#111116] text-white shadow-2xl md:grid-cols-2"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/40 p-2 text-white/80 transition-colors hover:bg-white hover:text-black"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex flex-col items-center justify-center bg-[#0c0c10] p-6 md:p-10">
              <div style={{ perspective: 1200 }} className="w-full max-w-md">
                <motion.div
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                  style={{
                    rotateX: reduceMotion ? 0 : rotateX,
                    rotateY: reduceMotion ? 0 : rotateY,
                    transformStyle: 'preserve-3d'
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="aspect-[3/4] w-full rounded-2xl border border-white/10 object-cover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
                  />
                </motion.div>
              </div>

              {images.length > 1 && (
                <div className="mt-5 flex gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setImageIndex(index)}
                      className={`h-14 w-11 overflow-hidden rounded-lg border-2 transition-all ${
                        index === imageIndex
                          ? 'border-rose-400'
                          : 'border-white/15 hover:border-white/40'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
                <Move3d className="h-3 w-3" />
                Move your cursor to rotate the garment
              </span>
            </div>

            <div className="flex flex-col gap-6 p-6 md:p-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-300">
                  {product.category}
                </p>
                <h3 className="mt-2 text-2xl font-bold uppercase tracking-tight md:text-3xl">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{formatZAR(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-base text-white/40 line-through">
                      {formatZAR(product.originalPrice)}
                    </span>
                    <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300">
                      -{discount}%
                    </span>
                  </>
                )}
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed text-white/60">
                  {product.description}
                </p>
              )}

              {product.colors?.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
                    Colour — {selectedColor || product.colors[0]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const active = (selectedColor || product.colors[0]) === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? 'border-rose-400 bg-rose-500/20 text-white'
                              : 'border-white/20 text-white/70 hover:border-white/50'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.sizes?.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
                    Size — {selectedSize || product.sizes[0]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const active = (selectedSize || product.sizes[0]) === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? 'border-rose-400 bg-rose-500/20 text-white'
                              : 'border-white/20 text-white/70 hover:border-white/50'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-widest text-black transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add to Bag
                </button>
                <button
                  onClick={() => onViewDetails(product)}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/5"
                >
                  <Eye className="h-4 w-4" />
                  View Full Details
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
