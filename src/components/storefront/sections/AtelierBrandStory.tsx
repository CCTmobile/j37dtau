import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { MotionReveal } from '../ui/MotionReveal';

const CURRENT_YEAR = new Date().getFullYear();

export function AtelierBrandStory() {
  const { products } = useProducts();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const firstY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : 40, reduceMotion ? 0 : -40]);
  const secondY = useTransform(scrollYProgress, [0, 1], [reduceMotion ? 0 : -30, reduceMotion ? 0 : 50]);

  const dresses = products.filter((p) => p.category === 'Dresses');
  const accessories = products.filter((p) => p.category === 'Accessories');
  const imageA = dresses[0]?.images?.[0];
  const imageB = accessories[0]?.images?.[0] || products[1]?.images?.[0];

  const years = Math.max(CURRENT_YEAR - 2014, 1);

  const stats = [
    { value: years, suffix: '+', label: 'Years of Craft' },
    { value: products.length, label: 'Curated Styles' },
    { value: 98, suffix: '%', label: 'Satisfaction' },
    { value: 9, suffix: '', label: 'Cities Served' }
  ];

  return (
    <section id="story" ref={ref} className="py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <motion.div
              style={{ y: firstY }}
              className="relative z-10 overflow-hidden rounded-3xl border border-border shadow-2xl"
            >
              {imageA ? (
                <img
                  src={imageA}
                  alt="Rosémama atelier piece"
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-muted" />
              )}
            </motion.div>

            {imageB && (
              <motion.div
                style={{ y: secondY }}
                className="absolute -bottom-10 -right-4 z-20 w-1/2 overflow-hidden rounded-2xl border-4 border-background shadow-2xl md:-right-10"
              >
                <img
                  src={imageB}
                  alt="Rosémama detail shot"
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </motion.div>
            )}

            <div className="absolute -left-3 top-6 z-30 rotate-[-6deg] rounded-xl bg-rose-500 px-4 py-3 text-white shadow-xl md:-left-6">
              <p className="text-2xl font-bold leading-none">EST.</p>
              <p className="text-sm font-semibold tracking-widest">2014</p>
            </div>
          </div>

          <div>
            <MotionReveal>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                <span className="h-px w-8 bg-current opacity-60" />
                The Rosémama Story
              </span>
            </MotionReveal>

            <MotionReveal delay={0.05}>
              <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
                Where the Sketch
                <span className="block text-rose-500">Becomes Signature</span>
              </h2>
            </MotionReveal>

            <MotionReveal delay={0.1}>
              <div className="mt-6 space-y-4 text-muted-foreground md:text-lg">
                <p>
                  Every Rosémama piece begins as a hand-drawn sketch inside a
                  small Midrand studio. From first line to final stitch, our
                  garments are cut, fitted and finished to feel as considered as
                  they look.
                </p>
                <p>
                  We photograph everything ourselves, control our own quality
                  standards, and ship with care from South Africa to wherever
                  you are. No middlemen, no shortcuts — just studio-ready fashion.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.15}>
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                    />
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </MotionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
