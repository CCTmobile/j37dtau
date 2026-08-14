import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const MESSAGES = [
  'FREE DELIVERY ON ORDERS OVER R3500',
  'NEW ATELIER DROP — LIVE NOW',
  'STUDIO-QUALITY PIECES FOR THE MODERN WOMAN',
  'SECURE CHECKOUT & EASY RETURNS'
];

export function AnnouncementTicker() {
  const [paused, setPaused] = useState(false);
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div
      className="relative z-50 overflow-hidden bg-[#0a0a0f] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-hidden="true"
    >
      <style>{`
        @keyframes storefront-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
      <div
        className="flex w-max items-center gap-10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em]"
        style={{
          animation: 'storefront-ticker 30s linear infinite',
          animationPlayState: paused ? 'paused' : 'running'
        }}
      >
        {items.map((message, index) => (
          <span key={index} className="flex items-center gap-10 whitespace-nowrap">
            {message}
            <Sparkles className="h-3 w-3 opacity-60" />
          </span>
        ))}
      </div>
    </div>
  );
}
