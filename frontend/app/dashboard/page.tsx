'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SubjectCard, { Subject } from '@/components/SubjectCard';
import OverallRing from '@/components/OverallRing';
import { getAttendance, refreshAttendance, logout, getMe } from '@/lib/api';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { rise, spring } from '@/lib/motion';

export default function DashboardPage() {
  const router = useRouter();
  const [srn, setSrn] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  const loadAttendance = useCallback(async (force = false) => {
    try {
      const data = force ? await refreshAttendance() : await getAttendance();
      setSubjects(data.attendance || []);
      setFetchedAt(data.fetchedAt || Date.now());
      setSrn(data.srn || '');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace('/');
      } else {
        setError('Failed to load attendance. Please try refreshing.');
      }
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      try {
        const me = await getMe();
        if (!me.ok) { router.replace('/'); return; }
        setSrn(me.srn);
        await loadAttendance(false);
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadAttendance, router]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    await loadAttendance(true);
    setRefreshing(false);
  }

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    router.replace('/');
  }

  // Computed overall percentage
  const overallPct = subjects.length
    ? Math.round(
        subjects.reduce((sum, s) => sum + s.attended, 0) /
        subjects.reduce((sum, s) => sum + s.total, 0) * 100
      )
    : 0;

  const dangerCount = subjects.filter((s) => s.status === 'danger').length;
  const safeCount = subjects.filter((s) => s.status === 'safe').length;

  // Skeleton
  if (loading) {
    return (
      <main className="page" style={{ maxWidth: '960px', paddingTop: '4.5rem' }}>
        <div style={{ height: '44px', width: '60%', maxWidth: '320px', marginBottom: '1.5rem', borderRadius: '12px' }} className="shimmer" />
        <div style={{ height: '170px', marginBottom: '1.5rem' }} className="shimmer" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '170px' }} className="shimmer" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
      <NavBar
        title="Attendance"
        maxWidth="960px"
        onBack={() => router.push('/home')}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLogout={handleLogout}
      />

      <main className="page" style={{ maxWidth: '960px' }}>
        {/* ── Large title ── */}
        <motion.div {...rise(0)} className="large-title-wrap">
          <h1 className="t-large-title">Attendance Tracker</h1>
        </motion.div>

        {/* ── Error ── */}
        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              style={{ overflow: 'hidden' }}
            >
              <div
                role="alert"
                className="t-subhead"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--danger-dim)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  color: 'var(--danger)',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle className="w-4 h-4" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overall Stats Card ── */}
        <motion.section
          className="surface"
          {...rise(1)}
          style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}
          aria-label="Overall attendance summary"
        >
          <h2 className="t-headline" style={{ marginBottom: '1rem' }}>
            Semester Overview
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            {/* Ring */}
            <OverallRing percentage={overallPct} size={120} strokeWidth={12} />

            {/* Stats */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '1rem 1.5rem' }}>
                <StatPill label="Subjects" value={subjects.length} color="var(--label)" />
                <StatPill label="Safe" value={safeCount} color="var(--safe)" />
                <StatPill label="At Risk" value={dangerCount} color="var(--danger)" />
                <StatPill
                  label="Total Classes"
                  value={subjects.reduce((s, x) => s + x.total, 0)}
                  color="var(--label)"
                />
              </div>
            </div>
          </div>
          {fetchedAt && (
            <p className="t-footnote secondary" style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '0.5px solid var(--separator)' }}>
              Last fetched: {new Date(fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </motion.section>

        {/* ── Subject Cards Grid ── */}
        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="secondary"
            style={{ textAlign: 'center', padding: '3rem 1rem' }}
          >
            <p className="t-body">No attendance data found. Try refreshing.</p>
          </motion.div>
        ) : (
          <>
            <h2 className="t-title2" style={{ padding: '0 4px', marginBottom: '0.75rem' }}>Subjects</h2>
            <section
              aria-label="Subject attendance cards"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.875rem',
              }}
            >
              {subjects.map((subject, i) => (
                <SubjectCard key={subject.courseCode} subject={subject} index={i} />
              ))}
            </section>
          </>
        )}
      </main>
    </>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="t-footnote secondary" style={{ marginBottom: '0.2rem', fontWeight: 500 }}>{label}</div>
      <div className="t-num" style={{ fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1.05 }}>{value}</div>
    </div>
  );
}
