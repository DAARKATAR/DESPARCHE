import React, { useMemo } from 'react';

interface PainterlyPortraitProps {
  health?: number;
  maxHealth?: number;
  alignment?: 'neutral' | 'sacred' | 'cursed';
  aimAngle?: number;
  lastDamageTime?: number;
  isKnifing?: boolean;
  isShooting?: boolean;
}

export const PainterlyPortrait: React.FC<PainterlyPortraitProps> = ({ 
  health = 100, 
  maxHealth = 100,
  alignment = 'neutral',
  aimAngle = 0,
  lastDamageTime = 0,
  isKnifing = false,
  isShooting = false
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  // DOOM-style Health Tier (0 = Downed, 1 = 80-100%, 2 = 60-79%, 3 = 40-59%, 4 = 20-39%, 5 = 1-19%)
  const doomTier = useMemo(() => {
    if (health <= 0) return 0;
    if (healthPercent >= 80) return 1;
    if (healthPercent >= 60) return 2;
    if (healthPercent >= 40) return 3;
    if (healthPercent >= 20) return 4;
    return 5;
  }, [health, healthPercent]);

  // DOOM "Ouch Face" when taking damage recently
  const isTakingDamage = Date.now() - lastDamageTime < 320;

  // DOOM Eye Glance Direction (Left, Center, Right) based on aimAngle
  const glanceOffset = useMemo(() => {
    const cos = Math.cos(aimAngle);
    if (cos < -0.35) return -2.2; // Glance Left
    if (cos > 0.35) return 2.2;  // Glance Right
    return 0; // Glance Forward
  }, [aimAngle]);

  const isSacred = alignment === 'sacred';
  const isCursed = alignment === 'cursed';

  return (
    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-stone-950 border-2 overflow-hidden select-none shadow-[0_4px_25px_rgba(0,0,0,0.9)] transition-colors duration-300 ${
      isSacred 
        ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
        : isCursed 
        ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)]' 
        : 'border-stone-700/80'
    }`}>
      {/* SVG Canvas for Disco Elysium + DOOM Dynamic Face */}
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full ${isTakingDamage ? 'scale-105 filter drop-shadow-[0_0_8px_#ef4444]' : ''} transition-transform duration-75`}
      >
        <defs>
          {/* Base Background Gradients */}
          <linearGradient id="deBgNeutral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="50%" stopColor="#292524" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>

          <linearGradient id="deBgSacred" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="40%" stopColor="#78350f" />
            <stop offset="80%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>

          <linearGradient id="deBgCursed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#450a0a" />
            <stop offset="45%" stopColor="#1c0707" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>

          {/* Skin Tones for Normal vs Downed */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            {doomTier === 0 ? (
              <>
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </>
            ) : isCursed ? (
              <>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#e7e5e4" />
                <stop offset="45%" stopColor="#d6d3d1" />
                <stop offset="85%" stopColor="#a8a29e" />
                <stop offset="100%" stopColor="#78716c" />
              </>
            )}
          </linearGradient>

          {/* Coat Gradient */}
          <linearGradient id="coatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isSacred ? '#78350f' : isCursed ? '#290e15' : '#44403c'} />
            <stop offset="100%" stopColor="#1c1917" />
          </linearGradient>

          {/* Golden Byzantine Halo Gradient */}
          <radialGradient id="holyHalo" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.95)" />
            <stop offset="60%" stopColor="rgba(245, 158, 11, 0.5)" />
            <stop offset="90%" stopColor="rgba(217, 119, 6, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>

          {/* Cursed Demon Horns Gradient */}
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="35%" stopColor="#450a0a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
        </defs>

        {/* 1. Canvas Textured Oil Background */}
        <rect 
          width="100" 
          height="100" 
          fill={isSacred ? 'url(#deBgSacred)' : isCursed ? 'url(#deBgCursed)' : 'url(#deBgNeutral)'} 
        />

        {/* Impasto Oil Brushstroke Accents */}
        <path d="M 0 15 Q 35 5 70 20 T 100 10 L 100 0 L 0 0 Z" fill="#292524" opacity="0.6" />
        <path d="M 0 85 Q 45 70 80 88 T 100 80 L 100 100 L 0 100 Z" fill="#1c1917" opacity="0.8" />

        {/* 2. ALIGNMENT BACKGROUND FEATURES */}
        {/* SAGRADO: Byzantine Holy Halo with Radiant Sunburst Rays */}
        {isSacred && (
          <g>
            <circle cx="50" cy="38" r="34" fill="url(#holyHalo)" />
            {/* Halo Sunburst Rays */}
            <path d="M 50 2 L 50 12 M 20 12 L 28 19 M 80 12 L 72 19 M 12 38 L 22 38 M 88 38 L 78 38" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
            {/* Sacred golden halo rim */}
            <circle cx="50" cy="38" r="28" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.8" />
          </g>
        )}

        {/* MALDITO: Demonic Horns emerging from head & hellfire embers */}
        {isCursed && (
          <g>
            {/* Left Horn */}
            <path d="M 33 26 C 24 18, 14 6, 12 0 C 18 10, 26 18, 37 22 Z" fill="url(#hornGrad)" stroke="#7f1d1d" strokeWidth="1" />
            {/* Right Horn */}
            <path d="M 67 26 C 76 18, 86 6, 88 0 C 82 10, 74 18, 63 22 Z" fill="url(#hornGrad)" stroke="#7f1d1d" strokeWidth="1" />
            {/* Jagged red demonic aura */}
            <circle cx="50" cy="40" r="32" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.35" strokeDasharray="3 4" />
          </g>
        )}

        {/* 3. Trenchcoat Body & Lapels (Weathered Oil Silhouette) */}
        <path
          d="M 5 100 C 15 68, 25 58, 50 62 C 75 58, 85 68, 95 100 Z"
          fill="url(#coatGrad)"
          stroke="#1c1917"
          strokeWidth="2"
        />

        {/* Lapels */}
        <path d="M 22 68 L 38 95 L 48 68 Z" fill={isSacred ? '#92400e' : '#57534e'} opacity="0.85" />
        <path d="M 78 68 L 62 95 L 52 68 Z" fill={isSacred ? '#78350f' : '#44403c'} opacity="0.85" />

        {/* Collar & Tie / Amulet */}
        <path d="M 40 55 L 60 55 L 56 68 L 44 68 Z" fill="#292524" />
        {isSacred ? (
          /* Holy Saint Pendant */
          <polygon points="47,58 53,58 50,67" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        ) : isCursed ? (
          /* Cursed Blood Talisman */
          <circle cx="50" cy="62" r="3.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
        ) : (
          /* Red Necktie */
          <polygon points="47,56 50,66 53,56" fill="#dc2626" opacity="0.85" />
        )}

        {/* 4. Head & Jaw Anatomy (Angular Disco Elysium Style) */}
        <path
          d="M 32 30 C 30 12, 70 12, 68 30 C 68 45, 60 56, 50 58 C 40 56, 32 45, 32 30 Z"
          fill="url(#skinGrad)"
          stroke="#1c1917"
          strokeWidth="1.6"
        />

        {/* MALDITO: Cursed black veins creeping on neck & jaw */}
        {isCursed && doomTier > 0 && (
          <g opacity="0.85">
            <path d="M 36 50 Q 42 53 46 56" stroke="#450a0a" strokeWidth="1.2" fill="none" />
            <path d="M 64 50 Q 58 54 54 57" stroke="#450a0a" strokeWidth="1.2" fill="none" />
            <path d="M 48 57 L 50 63" stroke="#7f1d1d" strokeWidth="1" fill="none" />
          </g>
        )}

        {/* Messy Hair / Fedora Trim */}
        <path
          d="M 28 26 C 26 8, 74 8, 72 26 C 65 20, 50 18, 28 26 Z"
          fill="#1c1917"
        />
        <path d="M 26 22 L 34 16 L 44 18 L 52 14 L 66 18 L 74 24" stroke="#44403c" strokeWidth="2.5" fill="none" />

        {/* Sunken eye shadows (Deep socket chiaroscuro) */}
        <ellipse cx="42" cy="32" rx="5" ry="3.5" fill="#292524" opacity={doomTier >= 4 ? 0.95 : 0.8} />
        <ellipse cx="58" cy="32" rx="5" ry="3.5" fill="#292524" opacity={doomTier >= 4 ? 0.95 : 0.8} />

        {/* 5. DOOM EYES (Glance direction + Health trauma + Alignment glow) */}
        {doomTier === 0 ? (
          /* DOWNED / DEAD: Rollback hollow skull eyes */
          <g>
            <ellipse cx="42" cy="32" rx="3.5" ry="2.5" fill="#0f172a" />
            <ellipse cx="58" cy="32" rx="3.5" ry="2.5" fill="#0f172a" />
            <circle cx="42" cy="31" r="1.2" fill="#ef4444" opacity="0.6" />
            <circle cx="58" cy="31" r="1.2" fill="#ef4444" opacity="0.6" />
          </g>
        ) : doomTier >= 4 ? (
          /* SEVERELY HURT (Tier 4 & 5): Left eye swollen shut with bruised welt, right eye manic */
          <g>
            {/* Swollen Left Eye (slitted purple welt) */}
            <line x1="38" y1="32.5" x2="46" y2="32.5" stroke="#450a0a" strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="42" cy="32.5" rx="5.5" ry="4" fill="#7f1d1d" opacity="0.45" />

            {/* Right Eye: Wide open, desperate, bloodshot */}
            <circle cx={58 + glanceOffset} cy="32" r="2.4" fill={isSacred ? '#38bdf8' : isCursed ? '#ef4444' : '#ffffff'} />
            <circle cx={58 + glanceOffset} cy="32" r="1.3" fill={isSacred ? '#fde047' : isCursed ? '#facc15' : '#000000'} />
            {/* Blood vessels */}
            <line x1="55" y1="32" x2="57" y2="32" stroke="#dc2626" strokeWidth="0.8" />
          </g>
        ) : (
          /* NORMAL / INJURED (Tiers 1, 2, 3): Glancing Eyes */
          <g>
            {/* Left Eye */}
            <circle cx={42 + glanceOffset} cy="32" r="2" fill={isSacred ? '#38bdf8' : isCursed ? '#ef4444' : '#facc15'} />
            <circle cx={42 + glanceOffset} cy="32" r="1.1" fill={isSacred ? '#ffffff' : isCursed ? '#facc15' : '#1c1917'} />

            {/* Right Eye */}
            <circle cx={58 + glanceOffset} cy="32" r="2" fill={isSacred ? '#38bdf8' : isCursed ? '#ef4444' : '#facc15'} />
            <circle cx={58 + glanceOffset} cy="32" r="1.1" fill={isSacred ? '#ffffff' : isCursed ? '#facc15' : '#1c1917'} />
          </g>
        )}

        {/* Eyebrows (Furrowed in rage / pain) */}
        {isTakingDamage ? (
          /* Shocked Raised Eyebrows */
          <g stroke="#1c1917" strokeWidth="2" strokeLinecap="round">
            <line x1="36" y1="27" x2="47" y2="29" />
            <line x1="64" y1="27" x2="53" y2="29" />
          </g>
        ) : doomTier >= 3 ? (
          /* Furrowed Aggressive DOOM Brow */
          <g stroke="#1c1917" strokeWidth="2.4" strokeLinecap="round">
            <line x1="37" y1="29" x2="47" y2="27" />
            <line x1="63" y1="29" x2="53" y2="27" />
          </g>
        ) : (
          /* Stern Detective Brow */
          <g stroke="#1c1917" strokeWidth="2" strokeLinecap="round">
            <line x1="37" y1="28" x2="47" y2="28" />
            <line x1="63" y1="28" x2="53" y2="28" />
          </g>
        )}

        {/* Nose Bridge */}
        <path d="M 50 28 L 48 39 L 53 40" stroke="#57534e" strokeWidth="1.8" fill="none" />

        {/* Rough Stubble / Beard */}
        <path
          d="M 36 38 C 36 52, 64 52, 64 38 C 60 48, 40 48, 36 38 Z"
          fill="#292524"
          opacity="0.85"
        />

        {/* 6. DOOM MOUTH (Cigarette, Clenched Teeth, Bloody Gasp, Downed) */}
        {doomTier === 0 ? (
          /* Dead: Slack, fallen jaw with dark void */
          <path d="M 44 47 Q 50 51 56 47 Z" fill="#0f172a" stroke="#450a0a" strokeWidth="1.4" />
        ) : isTakingDamage ? (
          /* OUCH Face: Open screaming / gasping grimace */
          <path d="M 44 46 Q 50 52 56 46 Q 50 44 44 46 Z" fill="#450a0a" stroke="#1c1917" strokeWidth="1.8" />
        ) : (isKnifing || isShooting || doomTier >= 3) ? (
          /* Clenched Bloody Teeth Grimace */
          <g>
            <path d="M 43 45 L 57 45 L 55 49 L 45 49 Z" fill="#ffffff" stroke="#1c1917" strokeWidth="1.4" />
            {/* Teeth vertical dividers */}
            <line x1="47" y1="45" x2="47" y2="49" stroke="#7f1d1d" strokeWidth="1" />
            <line x1="50" y1="45" x2="50" y2="49" stroke="#7f1d1d" strokeWidth="1" />
            <line x1="53" y1="45" x2="53" y2="49" stroke="#7f1d1d" strokeWidth="1" />
          </g>
        ) : (
          /* Resolute Grim Mouth with Cigarette */
          <g>
            <line x1="45" y1="46" x2="54" y2="46" stroke="#1c1917" strokeWidth="1.8" />
            {/* Cigarette in mouth corner */}
            <line x1="41" y1="48" x2="45" y2="46" stroke="#e5e5e5" strokeWidth="1.5" />
            <circle cx="40" cy="48.5" r="1.4" fill="#ef4444" className="animate-pulse" />
            {/* Smoke wisp */}
            <path d="M 39 48 Q 34 42 36 35 T 32 24" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1" fill="none" />
          </g>
        )}

        {/* 7. DOOM CLASSIC BLOOD & GORE ACCUMULATION */}
        {/* Tier 2 (Health < 80%): Bruise on cheek & blood scratch */}
        {doomTier >= 2 && (
          <g>
            {/* Cut on forehead/eyebrow */}
            <path d="M 43 25 L 45 30" stroke="#991b1b" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cheek bruise */}
            <ellipse cx="61" cy="41" rx="4" ry="3" fill="#581c87" opacity="0.35" />
          </g>
        )}

        {/* Tier 3 (Health < 60%): Bloody Nose & Mouth Blood */}
        {doomTier >= 3 && (
          <g>
            {/* Blood dripping from nose (Classic Doomguy) */}
            <path d="M 50 40 L 49 45 L 48 48" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
            {/* Blood cut on right cheek */}
            <path d="M 58 36 L 65 42" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Tier 4 & 5 (Health < 40%): Heavy Blood Streams & Trauma */}
        {doomTier >= 4 && (
          <g>
            {/* Blood running down chin */}
            <path d="M 49 48 L 50 56 L 52 64" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" />
            {/* Blood spatter across cheek */}
            <circle cx="38" cy="41" r="1.4" fill="#dc2626" />
            <circle cx="40" cy="38" r="1.1" fill="#dc2626" />
            <circle cx="63" cy="46" r="1.6" fill="#991b1b" />
            {/* Heavy blood smear on collar */}
            <path d="M 32 68 Q 36 78 34 85" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Tier 5 (Health < 20%): Massive Near-Death Gore Coverage */}
        {doomTier === 5 && (
          <g>
            <path d="M 38 28 L 36 46 L 39 54" stroke="#7f1d1d" strokeWidth="3" opacity="0.85" />
            <path d="M 64 30 L 67 48 L 63 58" stroke="#991b1b" strokeWidth="2.8" opacity="0.85" />
            <rect width="100" height="100" fill="rgba(185, 28, 28, 0.25)" className="animate-pulse" />
          </g>
        )}

        {/* Downed (0 HP): Ghostly death tears & skull shadow */}
        {doomTier === 0 && (
          <g>
            <path d="M 42 34 L 41 52" stroke="#450a0a" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            <path d="M 58 34 L 59 52" stroke="#450a0a" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            <circle cx="50" cy="50" r="30" fill="rgba(15, 23, 42, 0.4)" />
          </g>
        )}

        {/* 8. SAGRADO DIVINE STIGMA / CURSED RUNIC BRAND */}
        {isSacred && (
          <g>
            {/* Holy Radiant Cross on Forehead */}
            <line x1="50" y1="18" x2="50" y2="26" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="46" y1="21" x2="54" y2="21" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
            {/* Golden stitch threads sealing blood wounds */}
            {doomTier >= 2 && (
              <path d="M 42 27 L 46 29 M 48 39 L 51 44" stroke="#fef08a" strokeWidth="1.2" />
            )}
          </g>
        )}

        {isCursed && (
          <g>
            {/* Cursed 115 Sigil on Forehead */}
            <polygon points="50,18 47,24 53,24" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
            <circle cx="50" cy="22" r="1" fill="#facc15" />
          </g>
        )}

        {/* 9. Overall Dramatic Lighting Overlay */}
        {isSacred ? (
          <rect width="100" height="100" fill="rgba(245, 158, 11, 0.15)" />
        ) : isCursed ? (
          <rect width="100" height="100" fill="rgba(220, 38, 38, 0.18)" />
        ) : (
          <rect width="100" height="100" fill="rgba(245, 158, 11, 0.08)" />
        )}
      </svg>

      {/* Frame Rivets */}
      <div className={`absolute top-0.5 left-0.5 w-1 h-1 rounded-full ${isSacred ? 'bg-amber-400' : isCursed ? 'bg-red-500' : 'bg-stone-500'}`} />
      <div className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${isSacred ? 'bg-amber-400' : isCursed ? 'bg-red-500' : 'bg-stone-500'}`} />
      <div className={`absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full ${isSacred ? 'bg-amber-400' : isCursed ? 'bg-red-500' : 'bg-stone-500'}`} />
      <div className={`absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full ${isSacred ? 'bg-amber-400' : isCursed ? 'bg-red-500' : 'bg-stone-500'}`} />

      {/* Hit Flash / Low Health Red Frame Overlay */}
      {isTakingDamage && (
        <div className="absolute inset-0 bg-red-600/40 pointer-events-none animate-ping" />
      )}
      {doomTier >= 4 && (
        <div className="absolute inset-0 border-2 border-red-600/80 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
