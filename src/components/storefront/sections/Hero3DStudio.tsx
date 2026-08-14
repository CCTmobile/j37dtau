import { useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants
} from 'framer-motion';
import { ArrowRight, Box, Eye, Sparkles } from 'lucide-react';
import { useProducts } from '../../../contexts/ProductContext';
import { TiltCard } from '../ui/TiltCard';
import { formatZAR } from '../format';
import type { Product } from '../../../App';
import type { StorefrontCallbacks } from '../types';

interface Hero3DStudioProps extends StorefrontCallbacks {
  onOpenPreview: (product: Product) => void;
}

export function Hero3DStudio({
  onNavigateToCategory,
  onOpenPreview
}: Hero3DStudioProps) {
  const { products, loading } = useProducts();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  });

  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 140]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -40]);

  const featured: Product | undefined =
    products.find((p) => p.category === 'Dresses') || products[0];

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative overflow-hidden bg-[#0a0a0f] text-white"
    >
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-rose-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[24rem] w-[24rem] rounded-full bg-amber-400/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
      </motion.div>

      <motion.div
        style={{ y: contentY }}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="relative z-10"
          >
            <motion.div variants={item} className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-rose-300" />
                Global Hub for Fashion
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-white/50 sm:inline">
                25.99° S, 28.12° E — Midrand
              </span>
            </motion.div>

            <motion.p
              variants={item}
              className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-rose-300"
            >
              Rosémama / Since 2014
            </motion.p>

            <motion.h1
              variants={item}
              className="text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              From Sketch to
              <span className="block bg-gradient-to-r from-rose-300 via-amber-200 to-rose-300 bg-clip-text text-transparent">
                Studio-Ready
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-lg text-base text-white/70 md:text-lg"
            >
              A cinematic showcase of this season's silhouettes — every piece
              photographed, verified, and ready to ship from our South African
              atelier to your door.
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => onNavigateToCategory('All')}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-widest text-black transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                Explore Collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              {featured && (
                <button
                  onClick={() => onOpenPreview(featured)}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:border-white/60 hover:bg-white/5"
                >
                  <Box className="h-4 w-4" />
                  Try a 3D Preview
                </button>
              )}
            </motion.div>

            {featured && (
              <motion.div
                variants={item}
                className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-white/60"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  New Season Verified
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Free Shipping Over R3500
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Secure Checkout
                </span>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              className="absolute inset-0 -z-10 scale-125 rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(244,114,182,0.35), transparent 65%)'
              }}
              aria-hidden="true"
            />

            {loading || !featured ? (
              <div className="aspect-[4/5] w-full animate-pulse rounded-[2rem] bg-white/10" />
            ) : (
              <TiltCard maxTilt={9} glare className="group">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5">
                  <img
                    src={featured.images[0]}
                    alt={featured.name}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                    New In
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                        Spotlight Piece
                      </p>
                      <p className="mt-1 max-w-[220px] text-sm font-semibold text-white">
                        {featured.name}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-right backdrop-blur-md">
                      <p className="text-[10px] uppercase tracking-widest text-white/60">
                        {featured.category}
                      </p>
                      <p className="text-base font-bold text-white">
                        {formatZAR(featured.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            )}

            {featured && !loading && (
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                onClick={() => onOpenPreview(featured)}
                className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-[#131318] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition-colors hover:bg-white hover:text-black md:inline-flex"
              >
                <Eye className="h-4 w-4" />
                Inspect in 3D
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
