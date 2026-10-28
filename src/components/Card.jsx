import React, { useId } from 'react';
import { motion } from 'framer-motion';

// Detect reduced motion preference once at module load
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SIZES = {
  sm: { width: 56,  height: 80,  valueSize: '0.55rem', suitSmall: '0.5rem',  suitCenter: '1.5rem', borderRadius: '0.35rem' },
  md: { width: 80,  height: 112, valueSize: '0.7rem',  suitSmall: '0.65rem', suitCenter: '2.2rem', borderRadius: '0.5rem'  },
  lg: { width: 96,  height: 140, valueSize: '0.85rem', suitSmall: '0.75rem', suitCenter: '2.8rem', borderRadius: '0.6rem'  },
};

const Card = ({ suit, value, isFaceUp = true, size = 'lg', className = '', style = {} }) => {
  const isRed = suit === '♥' || suit === '♦';
  const suitColor = isRed ? '#dc2626' : '#111827';

  // Unique IDs per card instance — prevents gradient/clipPath ID collisions
  // when multiple face-down cards exist in the DOM simultaneously.
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');
  const goldId   = `gold-${uid}`;
  const clipId   = `clip-${uid}`;
  const patternId = `pat-${uid}`;

  const dim = SIZES[size] || SIZES.lg;
  const flipDuration = prefersReducedMotion ? 0 : 0.38;

  return (
    <motion.div
      // Removed `layout` — was triggering O(n²) layout recalc on every animation
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      className={`card-wrapper ${className}`}
      style={{
        ...style,
        width:  dim.width,
        height: dim.height,
        perspective: '800px',
        flexShrink: 0,
      }}
    >
      {/* Inner container that handles the flip */}
      <motion.div
        initial={false}
        animate={{ rotateY: isFaceUp ? 0 : 180 }}
        transition={{ duration: flipDuration, ease: 'easeInOut' }}
        className="card-inner"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── FRONT FACE ─────────────────────────── */}
        <div
          className="card-front"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: dim.borderRadius,
          }}
        >
          {/* Top-left index */}
          <div className="card-top-index" style={{ color: suitColor }}>
            <span className="card-value-text" style={{ fontSize: dim.valueSize }}>
              {value}
            </span>
            <span className="card-suit-small" style={{ fontSize: dim.suitSmall }}>
              {suit}
            </span>
          </div>

          {/* Prominent centre suit */}
          <div className="card-center-suit-wrapper">
            <span className="card-center-suit" style={{ color: suitColor, fontSize: dim.suitCenter }}>
              {suit}
            </span>
          </div>

          {/* Bottom-right corner index (inverted) */}
          <div
            style={{
              position: 'absolute',
              bottom: '0.3rem',
              right: '0.3rem',
              transform: 'rotate(180deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: suitColor,
              lineHeight: 1,
              opacity: 0.7,
            }}
          >
            <span className="card-value-text" style={{ fontSize: dim.valueSize }}>{value}</span>
            <span className="card-suit-small" style={{ fontSize: dim.suitSmall }}>{suit}</span>
          </div>
        </div>

        {/* ── BACK FACE — original royal/themed design ── */}
        <div
          className="card-back"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: dim.borderRadius,
          }}
        >
          <svg
            viewBox="0 0 100 140"
            xmlns="http://www.w3.org/2000/svg"
            className="card-back-svg"
            aria-hidden="true"
          >
            <defs>
              {/* Gold gradient — unique ID per card instance */}
              <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#fde68a" />
                <stop offset="45%"  stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Clip inner content area — unique ID per card instance */}
              <clipPath id={clipId}>
                <rect x="6" y="6" width="88" height="128" rx="4" />
              </clipPath>

              {/*
                ── KEY PERF FIX ─────────────────────────────────────
                SVG <pattern> defines ONE diamond shape and tiles it.
                Replaces 70 individual <path> elements with 1 <rect>.
                This reduces DOM nodes by ~98% for the lattice alone.
                ──────────────────────────────────────────────────────
              */}
              <pattern id={patternId} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                <path
                  d="M7,1 l5,6 l-5,6 l-5,-6 z"
                  fill="none"
                  stroke={`url(#${goldId})`}
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>

            {/* Background fill — uses CSS var so theme can override */}
            <rect width="100" height="140" rx="7" fill="var(--card-back)" />

            {/* Outer gold border */}
            <rect x="2" y="2" width="96" height="136" rx="6" fill="none" stroke={`url(#${goldId})`} strokeWidth="1.5" />
            {/* White inset border */}
            <rect x="4.5" y="4.5" width="91" height="131" rx="4.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />

            {/* Diamond lattice — 1 rect instead of 70 paths */}
            <rect
              x="6" y="6" width="88" height="128"
              fill={`url(#${patternId})`}
              opacity="0.55"
              clipPath={`url(#${clipId})`}
            />

            {/* Center ornate circle */}
            <circle cx="50" cy="70" r="18" fill="none" stroke={`url(#${goldId})`} strokeWidth="1.2" />
            <circle cx="50" cy="70" r="14.5" fill="rgba(0,0,0,0.25)" stroke={`url(#${goldId})`} strokeWidth="0.5" />

            {/* Scrollwork petals at N/S/E/W of circle */}
            {[[-18, 0], [18, 0], [0, -18], [0, 18]].map(([dx, dy], i) => (
              <ellipse key={i} cx={50 + dx} cy={70 + dy} rx="3" ry="1.5"
                stroke={`url(#${goldId})`} strokeWidth="0.6" fill="none"
                transform={`rotate(${i * 90}, ${50 + dx}, ${70 + dy})`} />
            ))}

            {/* Crown icon — simplified SVG crown */}
            <g transform="translate(50,70)" fill={`url(#${goldId})`}>
              <rect x="-8" y="2" width="16" height="3.5" rx="0.8" />
              <polygon points="-8,2 -6,-4 -4,0" />
              <polygon points="0,2 0,-6 0,2" />
              <polygon points="8,2 6,-4 4,0" />
              <polygon points="-4,0 0,-6 4,0 3,2 -3,2" />
              <circle cx="-5.5" cy="3.5" r="1" opacity="0.7" />
              <circle cx="0"    cy="3.5" r="1" opacity="0.7" />
              <circle cx="5.5"  cy="3.5" r="1" opacity="0.7" />
            </g>

            {/* Corner ornaments */}
            <g opacity="0.7">
              <path d="M8,8 Q11,8 11,11"   fill="none" stroke={`url(#${goldId})`} strokeWidth="0.8" />
              <circle cx="9"  cy="9"   r="1.2" fill={`url(#${goldId})`} />
              <path d="M92,8 Q89,8 89,11"  fill="none" stroke={`url(#${goldId})`} strokeWidth="0.8" />
              <circle cx="91" cy="9"   r="1.2" fill={`url(#${goldId})`} />
              <path d="M8,132 Q11,132 11,129"  fill="none" stroke={`url(#${goldId})`} strokeWidth="0.8" />
              <circle cx="9"  cy="131" r="1.2" fill={`url(#${goldId})`} />
              <path d="M92,132 Q89,132 89,129" fill="none" stroke={`url(#${goldId})`} strokeWidth="0.8" />
              <circle cx="91" cy="131" r="1.2" fill={`url(#${goldId})`} />
            </g>
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Card;
