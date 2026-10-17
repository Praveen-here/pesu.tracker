'use client';

import { MotionConfig } from 'framer-motion';

// Honours the OS "Reduce Motion" setting: transforms are dropped, fades remain.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
