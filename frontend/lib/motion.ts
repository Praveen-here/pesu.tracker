import type { Transition } from 'framer-motion';

// Critically damped spring (damping 1.0, response ~0.35s) — default for UI.
export const spring: Transition = { type: 'spring', visualDuration: 0.35, bounce: 0 };

// Slightly underdamped (damping ~0.8, response 0.3s) — sheets and drawers.
export const sheetSpring: Transition = { type: 'spring', visualDuration: 0.3, bounce: 0.2 };

// Press feedback: scale down on touch-down within 100ms.
export const tap = { scale: 0.97, transition: { type: 'spring', visualDuration: 0.1, bounce: 0 } } as const;

// Subtle entrance used for lists and cards.
export function rise(index = 0) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring, delay: Math.min(index, 10) * 0.035 },
  };
}
