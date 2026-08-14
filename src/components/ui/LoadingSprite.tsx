import React, { useState, useEffect } from 'react';

export function LoadingSprite({ onComplete }: { onComplete: () => void }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onComplete, 800); // wait for fade out
    }, 2000); // show for 2s

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-[#f5f5f0] flex flex-col items-center justify-center transition-opacity duration-700 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Liquid circle animations */}
        <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
        <div className="absolute inset-2 bg-orange-400 rounded-full animate-pulse opacity-40 mix-blend-multiply filter blur-sm"></div>
        <div className="absolute inset-6 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
        <div className="absolute inset-6 bg-black rounded-full flex items-center justify-center text-white font-bold tracking-widest z-10 overflow-hidden">
           <span className="relative z-10 text-xl font-serif">RM</span>
           <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      <h1 className="mt-8 text-2xl font-serif tracking-widest text-black animate-pulse">ROSEMAMA</h1>
    </div>
  );
}
