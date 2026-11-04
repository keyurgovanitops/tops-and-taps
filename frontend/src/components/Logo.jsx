import React, { useId } from 'react';

/**
 * Premium Modern Startup Logo for "TOPS & Taps"
 * Tagline: "Your home. Our hustle."
 * 
 * Emblem Concept:
 * - Roof Gable Apex (TOPS: shelter, roofing, electrical high-points, peak quality)
 * - Hydro-Aero Droplet & Valve Flow (TAPS: plumbing, water, instant-on utilities)
 * - Interlocking geometric 'T' monogram with dynamic light reflections
 */
export default function Logo({ size = 'md', showTagline = true, variant = 'dark' }) {
  const uid = useId().replace(/:/g, '');

  const sizeMap = {
    sm: {
      badge: 'w-8 h-8 rounded-xl',
      svg: 'w-5 h-5',
      primaryText: 'text-base',
      amp: 'text-xs mx-0.5',
      tagline: 'text-[8px] tracking-[0.2em]',
      dot: 'w-1 h-1',
      gap: 'gap-2.5',
    },
    md: {
      badge: 'w-10 h-10 rounded-2xl',
      svg: 'w-6 h-6',
      primaryText: 'text-xl',
      amp: 'text-sm mx-1',
      tagline: 'text-[9.5px] tracking-[0.22em]',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-3',
    },
    lg: {
      badge: 'w-13 h-13 rounded-2xl',
      svg: 'w-8 h-8',
      primaryText: 'text-2xl',
      amp: 'text-base mx-1',
      tagline: 'text-[11px] tracking-[0.25em]',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-3.5',
    },
  };

  const config = sizeMap[size] || sizeMap.md;
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center ${config.gap} select-none group cursor-pointer transition-transform duration-200 active:scale-[0.98]`}>
      {/* ─── Premium Vector Emblem Mark ─── */}
      <div className="relative shrink-0">
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-300"></div>

        {/* Outer Beveled Squircle */}
        <div
          className={`relative ${config.badge} p-[1.5px] bg-gradient-to-b from-white/20 via-cyan-500/20 to-blue-600/30 shadow-lg shadow-blue-950/20`}
        >
          {/* Inner Surface with Obsidian/Sapphire depth */}
          <div className="w-full h-full rounded-[inherit] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-cyan-400/40 transition-colors duration-300">
            {/* Vector Identity */}
            <svg
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${config.svg} transform group-hover:scale-110 transition-transform duration-300`}
            >
              <defs>
                {/* Gradient for Roof / Apex ("TOPS") */}
                <linearGradient id={`roofGrad-${uid}`} x1="8" y1="8" x2="36" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8" />
                  <stop offset="0.5" stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#6366F1" />
                </linearGradient>

                {/* Gradient for Water / Droplet ("TAPS") */}
                <linearGradient id={`dropGrad-${uid}`} x1="16" y1="14" x2="28" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00F0FF" />
                  <stop offset="0.6" stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1E1B4B" />
                </linearGradient>

                {/* Radiant Radial Flare */}
                <radialGradient id={`flare-${uid}`} cx="22" cy="10" r="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient Radial Highlight */}
              <circle cx="22" cy="14" r="14" fill={`url(#flare-${uid})`} />

              {/* 1. "TOPS" Roof Gable Apex (Architectural Peak) */}
              <path
                d="M 9 18.5 L 22 8 L 35 18.5"
                stroke={`url(#roofGrad-${uid})`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 2. Structural Crossbeam (Completing the 'T' Monogram Bar) */}
              <path
                d="M 13 18 H 31"
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />

              {/* 3. "TAPS" Precision Hydro-Aero Droplet (Plumbing & Flow) */}
              <path
                d="M 22 14.5 C 22 14.5 15 22 15 26.8 C 15 30.7 18.1 34 22 34 C 25.9 34 29 30.7 29 26.8 C 29 22 22 14.5 22 14.5 Z"
                fill={`url(#dropGrad-${uid})`}
              />

              {/* 4. Glass Luster / Specular Reflection inside droplet */}
              <path
                d="M 17.5 25.5 C 17.5 23 19 20 20.5 18.5 C 20 20.5 19 23.5 19.5 26 C 19.8 27.5 19.2 28.5 18.2 28 C 17.7 27.3 17.5 26.5 17.5 25.5 Z"
                fill="#FFFFFF"
                fillOpacity="0.45"
              />

              {/* 5. Central Nexus Spark (Craftsmanship & Electrical Core) */}
              <circle cx="22" cy="27" r="1.6" fill="#FFFFFF" fillOpacity="0.9" />

              {/* 6. Precision Apex Star Indicator */}
              <circle cx="22" cy="8" r="1.4" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── Modern Typography Wordmark ─── */}
      <div className="flex flex-col justify-center">
        {/* Wordmark Title Lockup */}
        <div className="flex items-center tracking-tight leading-none">
          <span
            className={`${config.primaryText} font-black tracking-[-0.035em] ${
              isLight ? 'text-white' : 'text-slate-950'
            }`}
          >
            TOPS
          </span>

          {/* Stylized Tech Ampersand */}
          <span
            className={`${config.amp} font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 select-none`}
          >
            &amp;
          </span>

          <span
            className={`${config.primaryText} font-black tracking-[-0.035em] ${
              isLight ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Taps
          </span>
        </div>

        {/* Micro Tagline Lockup */}
        {showTagline && (
          <div className="flex items-center gap-1.5 mt-1 leading-none">
            <span className={`${config.dot} rounded-full bg-cyan-500 animate-pulse shrink-0`}></span>
            <span
              className={`${config.tagline} font-extrabold uppercase ${
                isLight ? 'text-blue-300/80' : 'text-slate-500'
              } group-hover:text-blue-600 transition-colors duration-200`}
            >
              Your home • Our hustle
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
