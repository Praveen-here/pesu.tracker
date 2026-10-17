'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, RotateCw, LogOut } from 'lucide-react';
import ActivityIndicator from './ActivityIndicator';

interface Props {
  title: string;
  maxWidth: string;
  onBack: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
}

export default function NavBar({ title, maxWidth, onBack, onRefresh, refreshing, onLogout }: Props) {
  const { scrollY } = useScroll();
  // The glass and inline title fade in as the large title scrolls under the bar.
  const barOpacity = useTransform(scrollY, [0, 40], [0, 1]);
  const titleOpacity = useTransform(scrollY, [36, 64], [0, 1]);

  return (
    <header className="navbar">
      <motion.div className="navbar-material" style={{ opacity: barOpacity }} />
      <div className="navbar-inner" style={{ maxWidth }}>
        <div>
          <button className="text-btn pressable" onClick={onBack} title="Home">
            <ChevronLeft className="w-[26px] h-[26px]" strokeWidth={2.2} style={{ marginLeft: -4 }} />
            Home
          </button>
        </div>

        <motion.span className="navbar-title" style={{ opacity: titleOpacity }} aria-hidden>
          {title}
        </motion.span>

        <div className="navbar-actions">
          <button
            className="icon-btn pressable"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh"
          >
            {refreshing ? <ActivityIndicator size={16} /> : <RotateCw className="w-[17px] h-[17px]" strokeWidth={2.2} />}
          </button>
          <button className="icon-btn pressable" onClick={onLogout} title="Sign Out" aria-label="Sign Out">
            <LogOut className="w-[17px] h-[17px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  );
}
