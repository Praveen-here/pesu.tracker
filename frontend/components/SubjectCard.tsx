'use client';

import { motion } from 'framer-motion';
import ProgressBar from './ProgressBar';
import { AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { rise } from '@/lib/motion';

export interface Subject {
  courseCode: string;
  courseName: string;
  attended: number;
  total: number;
  percentage: number;
  canBunk: number;
  classesNeededFor75: number;
  status: 'safe' | 'warning' | 'danger';
}

interface Props {
  subject: Subject;
  index: number;
}

export default function SubjectCard({ subject, index }: Props) {
  const { courseCode, courseName, attended, total, percentage, canBunk, classesNeededFor75, status } = subject;

  const statusColor =
    status === 'safe' ? 'var(--safe)' : status === 'warning' ? 'var(--warn)' : 'var(--danger)';

  const badgeClass =
    status === 'safe' ? 'badge-safe' : status === 'warning' ? 'badge-warn' : 'badge-danger';

  const analyticsText =
    status === 'danger'
      ? `Attend ${classesNeededFor75} more class${classesNeededFor75 !== 1 ? 'es' : ''} to reach 75%`
      : canBunk === 0
      ? 'At the 75% limit — don\'t miss any class!'
      : `You can bunk ${canBunk} more class${canBunk !== 1 ? 'es' : ''} safely`;

  const AnalyticsIcon = status === 'danger' ? AlertCircle : canBunk === 0 ? Zap : CheckCircle2;

  return (
    <motion.div
      className="surface"
      {...rise(index)}
      style={{
        padding: '1.125rem 1.125rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="t-headline"
            style={{
              marginBottom: '0.15rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {courseName}
          </h3>
          <span className="t-footnote t-mono secondary">{courseCode}</span>
        </div>

        {/* Percentage badge */}
        <span className={`badge t-num ${badgeClass}`} style={{ fontSize: '0.9375rem', fontWeight: 700, flexShrink: 0 }}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span className="t-footnote secondary">Attendance</span>
          <span className="t-footnote secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {attended}/{total} classes
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <ProgressBar percentage={percentage} />
          {/* 75% marker */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '75%',
              top: '-3px',
              width: '2px',
              height: '12px',
              borderRadius: '1px',
              background: 'var(--label-3)',
            }}
          />
        </div>
      </div>

      {/* Analytics row */}
      <div
        className="t-subhead"
        style={{
          background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
          borderRadius: '12px',
          padding: '0.6rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
        }}
      >
        <AnalyticsIcon className="w-4 h-4" style={{ color: statusColor, flexShrink: 0 }} strokeWidth={2.2} />
        <span>{analyticsText}</span>
      </div>
    </motion.div>
  );
}
