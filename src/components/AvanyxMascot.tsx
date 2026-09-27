import React from 'react';

interface AvanyxMascotProps {
  className?: string;
  size?: number;
  sparkles?: boolean;
}

/**
 * Avanyx AI Assistant Mascot
 * Replaced the old robotic AI orb with the clean Avanyx Monogram.
 */
export const AvanyxMascot: React.FC<AvanyxMascotProps> = ({
  className = '',
  size = 64,
  sparkles = true,
}) => {
  return <AvanyxLogoMonogram size={size} className={className} />;
};

export const AvanyxLogoMonogram: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#38BDF8] flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/30 select-none shrink-0 ${className}`}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L20 20H16L12 11.5L8 20H4L12 3Z"
          fill="currentColor"
        />
        <path d="M7 16H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
};
