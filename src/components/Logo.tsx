import React from 'react';

export default function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 240 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A3E635" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Modern Ticket Icon */}
      <g filter="url(#logoGlow)">
        <path 
          d="M10 25C10 22.2386 12.2386 20 15 20H55C57.7614 20 60 22.2386 60 25V35C57 35 55 37 55 40C55 43 57 45 60 45V55C60 57.7614 57.7614 60 55 60H15C12.2386 60 10 57.7614 10 55V45C13 45 15 43 15 40C15 37 13 35 10 35V25Z" 
          fill="url(#logoGradient)" 
        />
        <circle cx="35" cy="40" r="8" fill="black" fillOpacity="0.2" />
        <path d="M30 40H40M35 35V45" stroke="black" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Text: LUAN */}
      <text 
        x="75" 
        y="42" 
        fill="white" 
        style={{ font: '900 38px Inter, sans-serif', letterSpacing: '-0.06em' }}
      >
        LUAN
      </text>
      
      {/* Text: SORTEIOS */}
      <text 
        x="75" 
        y="62" 
        fill="#A3E635" 
        style={{ font: '900 14px Inter, sans-serif', letterSpacing: '0.4em' }}
      >
        SORTEIOS
      </text>
    </svg>
  );
}
