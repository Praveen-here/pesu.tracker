'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LogOut, CalendarCheck, ChartLine, ChevronRight } from 'lucide-react';
import ActivityIndicator from '@/components/ActivityIndicator';
import { rise } from '@/lib/motion';

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then(r => { 
        setUserName(r.data.name || r.data.srn || ''); 
        setChecking(false); 
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (checking) return <LoadingScreen />;

  const features = [
    {
      id: 'attendance',
      icon: <CalendarCheck className="w-7 h-7" strokeWidth={1.6} />,
      title: 'Attendance Tracker',
      desc: 'View your subject-wise attendance, safe bunk count, and recovery targets.',
      href: '/dashboard',
    },
    {
      id: 'cgpa',
      icon: <ChartLine className="w-7 h-7" strokeWidth={1.6} />,
      title: 'CGPA Tracker',
      desc: 'See your ISA & ESA marks, minimum scores needed, and CGPA projection for placements.',
      href: '/cgpa',
    },
  ];

  return (
    <main
      className="page"
      style={{
        maxWidth: '640px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingBottom: 'max(3rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <motion.div {...rise(0)} className="large-title-wrap" style={{ paddingBottom: '1.75rem' }}>
        <p className="t-headline secondary" style={{ marginBottom: '0.2rem' }}>PESU Tracker</p>
        <h1 className="t-large-title">
          Welcome back,
          <br />
          <span style={{ color: 'var(--label-2)' }}>{userName}</span>
        </h1>
      </motion.div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.875rem' }}>
        {features.map((f, i) => (
          <motion.div key={f.id} {...rise(i + 1)}>
            <button
              id={`feature-${f.id}`}
              onClick={() => router.push(f.href)}
              className="surface card-link pressable"
              style={{
                width: '100%',
                height: '100%',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
              }}
            >
              <div aria-hidden style={{ color: 'var(--tint)', marginBottom: '1.1rem', display: 'flex' }}>
                {f.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <h2 className="t-title2">{f.title}</h2>
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--label-3)', flexShrink: 0 }} strokeWidth={2.4} />
              </div>
              <p className="t-subhead secondary">{f.desc}</p>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Logout */}
      <motion.div {...rise(3)} style={{ marginTop: '2.5rem' }}>
        <button
          onClick={async () => { await axios.post('/api/auth/logout', {}, { withCredentials: true }); router.replace('/'); }}
          className="surface card-link pressable t-body"
          style={{
            width: '100%',
            minHeight: 52,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--danger)',
          }}
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Sign Out
        </button>
      </motion.div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)' }}>
      <ActivityIndicator size={28} />
    </main>
  );
}
