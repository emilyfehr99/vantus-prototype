
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Shield / V Shape */}
      <path 
        d="M10 20L50 90L90 20L50 35L10 20Z" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinejoin="miter"
      />
      {/* Inner Light Beam */}
      <path 
        d="M50 35L50 80" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="square"
      />
    </svg>
  );
};
