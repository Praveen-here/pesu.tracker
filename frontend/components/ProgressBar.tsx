'use client';

import { useEffect, useRef } from 'react';

interface Props {
  percentage: number;
}

export default function ProgressBar({ percentage }: Props) {
  const pct = Math.min(100, Math.max(0, percentage));
  const fillRef = useRef<HTMLDivElement>(null);

  const color =
    pct >= 75 ? 'var(--safe)' : pct >= 65 ? 'var(--warn)' : 'var(--danger)';

  // Slide a full-width fill with transform so the animation stays on the compositor.
  useEffect(() => {
    if (!fillRef.current) return;
    fillRef.current.style.transform = 'translateX(-100%)';
    const timer = setTimeout(() => {
      if (fillRef.current) {
        fillRef.current.style.transform = `translateX(${pct - 100}%)`;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="progress-track" aria-label={`${pct}% attendance`}>
      <div
        ref={fillRef}
        className="progress-fill"
        style={{ background: color }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
