import React, { useState } from 'react';
import { Feather } from 'lucide-react';

interface TazhibFrameProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'gold' | 'turquoise';
  dense?: boolean;
}

/** Rectangular manuscript frame with traditional Persian Tazhib illumination corner brackets */
export const TazhibFrame: React.FC<TazhibFrameProps> = ({
  children,
  className = '',
  accent = 'gold',
  dense = false,
}) => {
  const strokeColor = accent === 'turquoise' ? '#1D7A7A' : '#A68336';
  const dotColor = accent === 'turquoise' ? '#C6A553' : '#1D7A7A';
  const size = dense ? 18 : 24;

  const cornerSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none select-none"
    >
      <path
        d="M2 22V6C2 3.8 3.8 2 6 2H22"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M5.5 16.5V8.5C5.5 6.8 6.8 5.5 8.5 5.5H16.5"
        stroke={strokeColor}
        strokeWidth="0.85"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="8.5" r="1.4" fill={dotColor} />
      <circle cx="13.5" cy="5.5" r="0.9" fill={strokeColor} />
      <circle cx="5.5" cy="13.5" r="0.9" fill={strokeColor} />
    </svg>
  );

  return (
    <div className={`relative vellum-sheet rounded-sm ${className}`}>
      <span className="absolute top-1.5 left-1.5">{cornerSvg}</span>
      <span className="absolute top-1.5 right-1.5 scale-x-[-1]">{cornerSvg}</span>
      <span className="absolute bottom-1.5 left-1.5 scale-y-[-1]">{cornerSvg}</span>
      <span className="absolute bottom-1.5 right-1.5 scale-[-1]">{cornerSvg}</span>
      {children}
    </div>
  );
};

/** Calligraphic dot-work and quill-stroke horizontal divider */
export const CalligraphicDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 my-4 ${className}`} aria-hidden="true">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#B89547]/55 to-[#B89547]/80" />
    <svg width="56" height="14" viewBox="0 0 56 14" fill="none">
      <circle cx="7" cy="7" r="1.4" fill="#1D7A7A" />
      <path
        d="M14 7C19 2.5 23 2.5 28 7C33 11.5 37 11.5 42 7"
        stroke="#9B7B2F"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M14 7C19 11.5 23 11.5 28 7C33 2.5 37 2.5 42 7"
        stroke="#1D7A7A"
        strokeWidth="0.8"
        strokeOpacity="0.65"
        strokeLinecap="round"
      />
      <circle cx="28" cy="7" r="2.2" fill="#C6A553" stroke="#3D3124" strokeWidth="0.8" />
      <circle cx="49" cy="7" r="1.4" fill="#1D7A7A" />
    </svg>
    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#B89547]/55 to-[#B89547]/80" />
  </div>
);

/** Central Illuminated Nava-Negar Calligraphic Medallion Emblem */
export const NavaNegarEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 96,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* Outer Shamsa rosette */}
    <circle cx="60" cy="60" r="54" stroke="#C6A553" strokeWidth="1.4" strokeDasharray="2 3" />
    <circle cx="60" cy="60" r="47" stroke="#9B7B2F" strokeWidth="1.5" fill="#FAF4EA" />
    {/* Interlocking Persian geometric 8-point star (Rub el Hizb) */}
    <rect
      x="26"
      y="26"
      width="68"
      height="68"
      rx="2"
      stroke="#1D7A7A"
      strokeWidth="1.35"
      fill="rgba(29,122,122,0.06)"
    />
    <rect
      x="26"
      y="26"
      width="68"
      height="68"
      rx="2"
      transform="rotate(45 60 60)"
      stroke="#C6A553"
      strokeWidth="1.5"
      fill="rgba(198,165,83,0.09)"
    />
    <circle cx="60" cy="60" r="31" fill="#3D3124" stroke="#C6A553" strokeWidth="1.6" />
    <circle cx="60" cy="60" r="26.5" stroke="#C6A553" strokeOpacity="0.55" strokeWidth="0.8" />
    {/* Stylized Nasta'liq / Diwani sweeping reed-pen monogram & sound wave */}
    <path
      d="M42 70C46 53 53 45 60 44C66 43 69 49 65 56C61 63 54 66 57 71C60 76 72 72 78 58"
      stroke="#F5EADD"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Calligraphic Nuqta (rhombus ink dots) */}
    <rect x="57" y="37" width="4.5" height="4.5" transform="rotate(45 59.25 39.25)" fill="#C6A553" />
    <rect x="69" y="67" width="4" height="4" transform="rotate(45 71 69)" fill="#4BB0B0" />
    <rect x="44" y="49" width="3.5" height="3.5" transform="rotate(45 45.75 50.75)" fill="#C6A553" />
  </svg>
);

/** Resilient archival image with zero-broken-image fallback */
export const ArchivalImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}> = ({ src, alt, className = '', fallbackTitle }) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EFE2D0] via-[#E5D3B8] to-[#D6BC92] text-[#3D3124] p-3 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Feather className="w-6 h-6 text-[#9B7B2F] mb-1.5" />
        <span className="font-calligraphy italic text-xs leading-tight line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};
