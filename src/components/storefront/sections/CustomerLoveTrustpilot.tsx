import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { TrustpilotWidget } from '../../ui/TrustpilotWidget';
import { SectionHeader } from '../ui/SectionHeader';
import { MotionReveal } from '../ui/MotionReveal';
import type { StorefrontCallbacks } from '../types';

const TESTIMONIALS = [
  {
    quote:
      'The quality genuinely surprised me — the stitching and fabric feel like a premium atelier piece, not an online buy.',
    name: 'Lerato M.',
    location: 'Johannesburg'
  },
  {
    quote:
      'Ordered on Monday, wore it Friday. Fit was exactly as the size guide promised and the packaging was beautiful.',
    name: 'Sarah K.',
    location: 'Cape Town'
  },
  {
    quote:
      'Their live chat helped me pick the right size in two minutes. This is how online fashion should feel.',
    name: 'Naledi T.',
    location: 'Durban'
  }
];

export function CustomerLoveTrustpilot({ onNavigateToCategory }: StorefrontCallbacks) {
  return (
    <section id="reviews" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Verified Voices"
          title="Customer Love"
          subtitle="Real feedback from verified customers who shop the studio."
          actionLabel="View All Products"
          onAction={() => onNavigateToCategory('All')}
        />

        <MotionReveal>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-border bg-background/70 p-6 backdrop-blur-md dark:bg-card/60"
              >
                <Quote className="h-7 w-7 text-primary/40" />
                <div className="mt-4 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.6 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * (i + index * 5) }}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </motion.span>
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  "{testimonial.quote}"
                </p>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">Verified Buyer · {testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1}>
          <div className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-secondary/10 p-6 dark:from-primary/10 dark:to-secondary/10 md:p-8">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
              <div className="text-center lg:text-left">
                <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                  Rated on Trustpilot
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Join our community — share your experience after your next order.
                </p>
              </div>
              <a
                href="https://www.trustpilot.com/review/rosemamaclothing.store"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:scale-[1.03]"
              >
                <Star className="h-4 w-4" />
                Write a Review
              </a>
            </div>
            <div className="mt-8 flex justify-center">
              <TrustpilotWidget
                widgetType="review-carousel"
                width="100%"
                height="200"
                className="max-w-4xl"
              />
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
