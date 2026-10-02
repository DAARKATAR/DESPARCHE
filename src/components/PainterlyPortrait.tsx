import React from 'react';

interface PainterlyPortraitProps {
  isLowHealth?: boolean;
}

export const PainterlyPortrait: React.FC<PainterlyPortraitProps> = ({ isLowHealth = false }) => {
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-stone-950 border-2 border-stone-700/80 shadow-[0_4px_15px_rgba(0,0,0,0.8)] overflow-hidden select-none">
      {/* Weathered Portrait Canvas (Disco Elysium oil painting homage) */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: isLowHealth ? 'contrast(1.2) saturate(0.85)' : 'none' }}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="50%" stopColor="#292524" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>

          <linearGradient id="coatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#44403c" />
            <stop offset="100%" stopColor="#1c1917" />
          </linearGradient>

          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d6d3d1" />
            <stop offset="50%" stopColor="#a8a29e" />
            <stop offset="100%" stopColor="#78716c" />
          </linearGradient>

          <linearGradient id="amberGlow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.3)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </linearGradient>
        </defs>

        {/* Textured dark background */}
        <rect width="100" height="100" fill="url(#bgGrad)" />

        {/* Impasto brushstrokes background atmosphere */}
        <path d="M 0 20 Q 30 10 60 25 T 100 15 L 100 0 L 0 0 Z" fill="#292524" opacity="0.6" />
        <path d="M 0 80 Q 40 70 70 85 T 100 75 L 100 100 L 0 100 Z" fill="#1c1917" opacity="0.8" />

        {/* Trenchcoat Shoulders & Lapels (Heavy oil paint silhouette) */}
        <path
          d="M 5 100 C 15 68, 25 58, 50 62 C 75 58, 85 68, 95 100 Z"
          fill="url(#coatGrad)"
          stroke="#1c1917"
          strokeWidth="2"
        />

        {/* Coat Lapel Left */}
        <path d="M 22 68 L 38 95 L 48 68 Z" fill="#57534e" opacity="0.75" />
        {/* Coat Lapel Right */}
        <path d="M 78 68 L 62 95 L 52 68 Z" fill="#44403c" opacity="0.85" />

        {/* Neck & Shirt */}
        <path d="M 40 55 L 60 55 L 56 68 L 44 68 Z" fill="#292524" />
        <polygon points="46,56 50,66 54,56" fill="#dc2626" opacity="0.85" />

        {/* Chiseled Head & Jaw (Harry Du Bois / Detective silhouette) */}
        <path
          d="M 32 30 C 30 12, 70 12, 68 30 C 68 45, 60 56, 50 58 C 40 56, 32 45, 32 30 Z"
          fill="url(#faceGrad)"
        />

        {/* Messy Hair / Fedora Trim */}
        <path
          d="M 28 26 C 26 8, 74 8, 72 26 C 65 20, 50 18, 28 26 Z"
          fill="#1c1917"
        />
        <path d="M 26 22 L 34 16 L 44 18 L 52 14 L 66 18 L 74 24" stroke="#44403c" strokeWidth="2.5" fill="none" />

        {/* Sunken eye shadows (Disco Elysium deep socket shadow) */}
        <ellipse cx="42" cy="32" rx="4.5" ry="3" fill="#44403c" opacity="0.8" />
        <ellipse cx="58" cy="32" rx="4.5" ry="3" fill="#292524" opacity="0.9" />

        {/* Eyes (weary and sharp) */}
        <circle cx="43" cy="32.5" r="1.5" fill="#facc15" />
        <circle cx="57" cy="32.5" r="1.5" fill="#facc15" />

        {/* Nose bridge (sharp painterly angular stroke) */}
        <path d="M 50 28 L 48 39 L 53 40" stroke="#57534e" strokeWidth="1.8" fill="none" />

        {/* Rough Scruffy Beard / Stubble */}
        <path
          d="M 36 38 C 36 52, 64 52, 64 38 C 60 48, 40 48, 36 38 Z"
          fill="#292524"
          opacity="0.85"
        />

        {/* Mouth (grim, cigarette in corner) */}
        <line x1="45" y1="46" x2="54" y2="46" stroke="#1c1917" strokeWidth="1.8" />

        {/* Glowing cigarette ember tip & smoke wisp */}
        <circle cx="41" cy="48" r="1.8" fill="#ef4444" className="animate-pulse" />
        <path d="M 40 47 Q 36 42 38 36 T 34 26" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" fill="none" />

        {/* Bruise / Blood cut highlight on cheek */}
        <path d="M 57 37 L 63 41" stroke="#991b1b" strokeWidth="1.5" />

        {/* Warm amber street/lantern light wash (from lower left) */}
        <rect width="100" height="100" fill="url(#amberGlow)" />
      </svg>

      {/* Frame Corner Accents (Vintage brass rivets) */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-amber-500/80 rounded-full" />
      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-amber-500/80 rounded-full" />
      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-amber-500/80 rounded-full" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-amber-500/80 rounded-full" />

      {/* Low Health Blood Spatter border */}
      {isLowHealth && (
        <div className="absolute inset-0 border-2 border-red-600/90 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
