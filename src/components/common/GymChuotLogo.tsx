import React from 'react';

interface GymChuotLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  logoSrc?: string;
}

export const GymChuotLogo: React.FC<GymChuotLogoProps> = ({
  size = 'md',
  className = '',
  logoSrc,
}) => {
  const dimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${dimensions[size]} ${className}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt="Đi tập đê! Logo"
          className="w-full h-full object-cover rounded-[22%]"
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1024 1024"
          className="w-full h-full drop-shadow-sm transition-transform duration-200 ease-in-out hover:scale-105"
          aria-label="Đi tập đê! Logo"
        >
          <defs>
            <linearGradient id="ditapde-squircle-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F37259" />
              <stop offset="55%" stopColor="#E4483C" />
              <stop offset="100%" stopColor="#C23629" />
            </linearGradient>
            <mask id="ditapde-dumbbell-holes">
              <rect width="1024" height="1024" fill="white" />
              <circle cx="307" cy="614" r="58" fill="black" />
              <circle cx="717" cy="410" r="58" fill="black" />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="1024"
            height="1024"
            rx="225"
            ry="225"
            fill="url(#ditapde-squircle-bg)"
          />
          <g mask="url(#ditapde-dumbbell-holes)" fill="#17161A">
            <line
              x1="307"
              y1="614"
              x2="717"
              y2="410"
              stroke="#17161A"
              strokeWidth="92"
              strokeLinecap="butt"
            />
            <circle cx="307" cy="614" r="150" />
            <circle cx="717" cy="410" r="150" />
          </g>
        </svg>
      )}
    </div>
  );
};
