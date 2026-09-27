import React from 'react';

export interface AvanyxBrandLogoProps {
  size?: number;
  className?: string;
  variant?: 'monogram' | 'full';
  showText?: boolean;
}

/**
 * AVENYX Official Brand Logo
 * Clean, futuristic AI-company identity with stylized apex monogram and precision wordmark.
 */
export const AvanyxBrandLogo: React.FC<AvanyxBrandLogoProps> = ({
  size = 28,
  className = '',
  variant = 'full',
  showText = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Modern Futuristic Monogram Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="avanyxGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#38BDF8" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="avanyxGlow" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="#0B0F1C" />
        <rect width="32" height="32" rx="8" fill="url(#avanyxGlow)" />
        <rect width="31" height="31" x="0.5" y="0.5" rx="7.5" stroke="#334155" strokeOpacity="0.4" />
        
        {/* Stylized A Monogram with Nexus Core */}
        <path d="M16 5.5L25 24.5H20.5L16 15L11.5 24.5H7L16 5.5Z" fill="url(#avanyxGrad)" />
        <path d="M10.5 20.5H21.5" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="12" r="1.8" fill="#FFFFFF" />
      </svg>

      {/* Modern Wordmark */}
      {(showText || variant === 'full') && (
        <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base font-sans">
          avanyx
        </span>
      )}
    </div>
  );
};

/**
 * Mascot Logo (for AI Chat screen & profile area)
 */
export { AvanyxMascot as LavaModelLogo, AvanyxMascot as AvanyxMascot } from './AvanyxMascot';
