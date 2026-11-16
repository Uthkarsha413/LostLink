import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
}

export default function Logo({
  className = "",
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* GEOMETRIC SVG GLYPH: Modern Interlocking L's + Location Pulse Beacon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        {/* Ambient Backlight Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300" />

        {/* SVG Container */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_2px_12px_rgba(147,51,234,0.4)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logo-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="logo-grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Rounded Shield Tile */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="#0A0E1A"
            stroke="url(#logo-grad-primary)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* First Dynamic Geometry: Left 'L' Track with Beveled Tip */}
          <path
            d="M13 12V32C13 33.6569 14.3431 35 16 35H34"
            stroke="url(#logo-grad-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Second Interlocking 'L' Path (Inverted Loop forming a Beacon Node) */}
          <path
            d="M35 24V16C35 14.3431 33.6569 13 32 13H21"
            stroke="url(#logo-grad-accent)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 0"
          />

          {/* Center Intersection Pulse Star/Diamond */}
          <polygon
            points="24,19 28,24 24,29 20,24"
            fill="#38BDF8"
            filter="url(#node-glow)"
          />

          {/* Core White Spark Point */}
          <circle cx="24" cy="24" r="1.75" fill="#FFFFFF" />
        </svg>
      </div>

      {/* WORDMARK */}
      {showWordmark && (
        <div className="flex flex-col leading-none tracking-tight">
          <div className="flex items-center">
            <span
              className={`font-black tracking-wider text-white ${textSizes[size]}`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              LOST
            </span>
            <span
              className={`font-black tracking-wider bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent ${textSizes[size]}`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              LINK
            </span>
            <span className="inline-block ml-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
          </div>
          <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-medium">
            Campus Recovery Network
          </span>
        </div>
      )}
    </div>
  );
}
