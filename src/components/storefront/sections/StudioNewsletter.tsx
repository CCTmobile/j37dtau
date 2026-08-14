import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Check, Instagram, Facebook, Twitter } from 'lucide-react';
import { MotionReveal } from '../ui/MotionReveal';

export function StudioNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setSubscribed(true);
  };

  const socials = [
    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
    { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' }
  ];

  return (
    <section id="newsletter" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <MotionReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[#0a0a0f] p-8 text-white shadow-2xl md:p-14">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-500/25 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-[100px]" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-300">
                <Mail className="h-4 w-4" />
                The Atelier List
              </span>

              <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight md:text-5xl">
                First Look. First Drop.
                <span className="block text-white/60">First Access.</span>
              </h2>

              <p className="mt-4 max-w-xl text-white/70 md:text-lg">
                Join the VIP list for early access to new collections, private
                flash sales and styling notes from the studio — straight to your inbox.
              </p>

              <div className="mt-8 max-w-xl">
                <AnimatePresence mode="wait">
                  {subscribed ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-6 py-4"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-black">
                        <Check className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Welcome to the atelier list!</p>
                        <p className="text-xs text-white/60">Your first drop is on its way to {email}.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-3 sm:flex-row"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        aria-label="Email address"
                        className="w-full flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-rose-400"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-widest text-black transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
                      >
                        Join the List
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {error && !subscribed && (
                  <p className="mt-2 text-xs text-rose-300">{error}</p>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-white/50">
                  Follow the studio
                </span>
                <div className="h-px w-8 bg-white/20" />
                {socials.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15 }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-rose-400 hover:text-rose-300"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
