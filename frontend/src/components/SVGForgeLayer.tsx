interface SVGForgeLayerProps {
  variant?: 'hero' | 'subtle';
}

export default function SVGForgeLayer({ variant = 'subtle' }: SVGForgeLayerProps) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="forgeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FF4500" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="moltenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FF8C00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background forge glow */}
          <circle cx="600" cy="400" r="400" fill="url(#forgeGlow)" className="animate-gold-pulse" />
          <circle cx="300" cy="600" r="300" fill="url(#forgeGlow)" className="animate-gold-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="900" cy="200" r="250" fill="url(#forgeGlow)" className="animate-gold-pulse" style={{ animationDelay: '2s' }} />

          {/* Molten metal streams */}
          <path
            d="M 0 200 Q 300 250 600 200 T 1200 200"
            stroke="url(#moltenGradient)"
            strokeWidth="3"
            fill="none"
            className="animate-shimmer-wave"
          />
          <path
            d="M 0 400 Q 400 450 800 400 T 1200 400"
            stroke="url(#moltenGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-shimmer-wave"
            style={{ animationDelay: '1.5s' }}
          />
          <path
            d="M 0 600 Q 200 650 400 600 T 1200 600"
            stroke="url(#moltenGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-shimmer-wave"
            style={{ animationDelay: '0.5s' }}
          />

          {/* Forge anvil silhouette */}
          <g opacity="0.15" className="animate-ember-float">
            <rect x="500" y="500" width="200" height="80" rx="10" fill="#FF8C00" />
            <polygon points="550,500 650,500 600,450" fill="#FF4500" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="subtleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <circle cx="600" cy="400" r="300" fill="url(#subtleGlow)" className="animate-gold-pulse" />
        <circle cx="200" cy="200" r="150" fill="url(#subtleGlow)" className="animate-gold-pulse" style={{ animationDelay: '1s' }} />
        <circle cx="1000" cy="600" r="200" fill="url(#subtleGlow)" className="animate-gold-pulse" style={{ animationDelay: '2s' }} />
      </svg>
    </div>
  );
}
