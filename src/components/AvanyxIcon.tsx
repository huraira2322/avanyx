import React from 'react';

interface AvanyxIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const AvanyxIcon: React.FC<AvanyxIconProps> = ({ className = 'w-7 h-7', size, glow = true }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      style={style}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#38BDF8] to-[#A855F7] p-1.5 border border-cyan-400/30 transition-transform duration-200 hover:scale-105 shadow-sm shadow-indigo-500/25 ${
        glow ? 'avanyx-brand-glow' : ''
      } ${className}`}
    >
      {/* Subtle highlight overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />

      {/* Avanyx Signature Apex Monogram */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white filter drop-shadow-[0_1px_4px_rgba(56,189,248,0.5)] relative z-10"
      >
        <path d="M12 2.5L20.5 19.5H16.5L12 10.5L7.5 19.5H3.5L12 2.5Z" fill="white" />
        <path d="M6.5 16H17.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1.5" fill="#0B0F1C" />
      </svg>
    </div>
  );
};
