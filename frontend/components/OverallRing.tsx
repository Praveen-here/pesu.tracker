'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { spring } from '@/lib/motion';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export default function OverallRing({ percentage, size = 140, strokeWidth = 10 }: Props) {
  const pct = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    pct >= 75 ? 'var(--safe)' : pct >= 65 ? 'var(--warn)' : 'var(--danger)';

  const progressRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!progressRef.current) return;
    progressRef.current.style.strokeDashoffset = String(circumference);
    const timer = setTimeout(() => {
      if (progressRef.current) {
        progressRef.current.style.strokeDashoffset = String(offset);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [offset, circumference]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: `color-mix(in srgb, ${color} 22%, transparent)` }}
        />
        {/* Progress */}
        <circle
          ref={progressRef}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{
            stroke: color,
            transition: 'stroke-dashoffset 1.2s var(--ease-ios)',
          }}
        />
      </svg>

      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="t-num" style={{ fontSize: size * 0.24, lineHeight: 1, fontWeight: 700 }}>
          {pct}%
        </span>
        <span className="secondary" style={{ fontSize: Math.max(11, size * 0.1), marginTop: 2, fontWeight: 500 }}>
          overall
        </span>
      </div>
    </motion.div>
  );
}
