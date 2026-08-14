import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Gem, Headset, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';
import { MotionReveal } from '../ui/MotionReveal';
import type { StorefrontCallbacks } from '../types';

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Free shipping on all orders over R3500, delivered across South Africa and beyond.',
    gradient: 'from-rose-500 to-orange-400'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: '100% protected checkout with encrypted transactions on every single order.',
    gradient: 'from-emerald-500 to-teal-400'
  },
  {
    icon: Gem,
    title: 'Curated Couture',
    description: "Studio-selected fabrics and silhouettes you won't find on the mass-market rail.",
    gradient: 'from-indigo-500 to-purple-400'
  },
  {
    icon: Headset,
    title: '24/7 Support',
    description: 'Real humans on live chat, ready to help with sizing, styling or your order.',
    gradient: 'from-amber-500 to-yellow-400'
  }
];

export function WhyRosemamaGrid({ onNavigateToCategory }: StorefrontCallbacks) {
  return (
    <section id="why-rosemama" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="The Rosémama Promise"
          title="Why Rosémama"
          subtitle="Four reasons our community keeps coming back — built into every order."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <MotionReveal key={feature.title} delay={index * 0.07}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-border bg-background/70 p-6 backdrop-blur-md dark:bg-card/60"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                <button
                  onClick={() => onNavigateToCategory('All')}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-foreground opacity-60 transition-all group-hover:opacity-100"
                >
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
