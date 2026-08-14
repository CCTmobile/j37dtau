import { useState } from 'react';
import { useProducts } from '../../../contexts/ProductContext';

export function MovingDressReel() {
  const { products, loading } = useProducts();
  const [paused, setPaused] = useState(false);

  const images = products
    .flatMap((p) => p.images)
    .filter((src) => src && src.startsWith('http'))
    .slice(0, 16);

  if (loading || images.length === 0) {
    return (
      <div className="border-y border-border bg-muted/40 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-52 w-40 flex-shrink-0 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const reel = [...images, ...images];

  return (
    <div className="border-y border-border bg-muted/30 py-10 md:py-14">
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-hidden="true"
      >
        <style>{`
          @keyframes storefront-reel { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>
        <div
          className="flex w-max gap-4"
          style={{
            animation: 'storefront-reel 60s linear infinite',
            animationPlayState: paused ? 'paused' : 'running'
          }}
        >
          {reel.map((src, index) => {
            const isAlt = index % 2 === 0;
            return (
              <div
                key={index}
                className={`relative flex-shrink-0 overflow-hidden rounded-2xl border border-border shadow-lg ${
                  isAlt ? 'h-56 w-40' : 'h-48 w-36'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
