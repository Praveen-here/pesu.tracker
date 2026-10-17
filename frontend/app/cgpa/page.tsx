'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckCircle2, AlertCircle, X, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react';
import NavBar from '@/components/NavBar';
import ActivityIndicator from '@/components/ActivityIndicator';
import { spring, sheetSpring, tap, rise } from '@/lib/motion';
import { logout, refreshResults, getPercentile } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Scenario {
  isa2Val: number;
  finalIsa: number;
  minEsa: number;
  esaImpossible: boolean;
  esaSecured: boolean;
}

interface Analysis {
  state: 'none' | 'isa1_done' | 'isa2_done' | 'complete' | 'zero_credit';
  currentIsa1: number | null;
  currentIsa2: number | null;
  assignment: number | null;
  finalIsa: number | null;
  minEsa: number | null;
  scenarios: Scenario[] | null;
  impossible: boolean;
  alreadySecured: boolean;
}

interface Subject {
  courseCode: string;
  courseName: string;
  credits: { earned: number; total: number } | null;
  isZeroCredit?: boolean;
  marks: {
    isa1?: { score: number | null; max: number };
    isa2?: { score: number | null; max: number };
    assignment?: { score: number | null; max: number };
    finalIsa?: { score: number | null };
    esa?: string | null;
  };
  analysis: Analysis;
}

interface SemResult {
  semId: string;
  semLabel: string;
  isCompleted: boolean;
  sgpa: number | null;
  cgpa: number | null;
  earnedCredits: number | null;
  totalCredits: number | null;
  esaDescription: string | null;
  projectedSgpa: number | null;
  subjects: Subject[];
}

interface ResultsData {
  results: SemResult[];
  cgpa: number | null;
  sems: { id: string; label: string }[];
}

interface SubjectPercentile {
  courseCode: string;
  courseName: string;
  credits: number;
  percentile: number;
  totalStudents: number;
  assessments: { type: string; percentile: number; marks: number; maxMarks: number }[];
}

interface PercentileData {
  semLabel: string;
  overallPercentile: number;
  topPercentage: number;
  standing: string;
  comparisonText: string;
  subjectCount: number;
  subjects: SubjectPercentile[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CGPAPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [percentile, setPercentile] = useState<PercentileData | null>(null);
  const [percentileLoading, setPercentileLoading] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await axios.get('/api/results', { withCredentials: true });
      setData(r.data);
      if (r.data.results?.length > 0) setSelectedSem(r.data.results[0].semId);
      
      // Check if user has seen info this session
      if (!sessionStorage.getItem('cgpaInfoSeen')) {
        setShowOverlay(true);
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) router.replace('/');
      else setError('Could not load your results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Fetch percentile after results are loaded
  useEffect(() => {
    if (!data) return;
    setPercentileLoading(true);
    getPercentile()
      .then(r => { if (r.data?.overallPercentile != null) setPercentile(r.data); })
      .catch(() => { /* silently fail — percentile is optional */ })
      .finally(() => setPercentileLoading(false));
  }, [data]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      await refreshResults(); // Clears cache
      await fetchResults();   // Fetches fresh data
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) router.replace('/');
      else setError('Failed to refresh results.');
    } finally {
      setRefreshing(false);
    }
  }

  function closeOverlay() {
    sessionStorage.setItem('cgpaInfoSeen', 'true');
    setShowOverlay(false);
  }

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    router.replace('/');
  }

  // Full-page skeleton only on first load; refreshes keep content and spin the nav button.
  if (loading && !data) return <Spinner />;
  if (error)   return <ErrorScreen msg={error} onRetry={fetchResults} onBack={() => router.push('/home')} />;
  if (!data || data.results.length === 0) return <EmptyScreen onBack={() => router.push('/home')} />;

  const currentSem = data.results.find(r => r.semId === selectedSem) ?? data.results[0];
  const completedSems = data.results.filter(s => s.isCompleted && s.sgpa);

  return (
    <>
      {/* ── Info Sheet ── */}
      <AnimatePresence>
        {showOverlay && (
          <>
            <motion.div
              key="scrim"
              className="sheet-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={spring}
              onClick={closeOverlay}
            />
            <div className="sheet-host" key="sheet">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="calc-sheet-title"
                className="sheet"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={sheetSpring}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.08, bottom: 1 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 500) closeOverlay();
                }}
                style={{ position: 'relative' }}
              >
                <div className="grabber" aria-hidden />
                <button
                  onClick={closeOverlay}
                  className="icon-btn pressable"
                  aria-label="Close"
                  style={{ position: 'absolute', top: '1rem', right: '1rem', width: 30, height: 30, color: 'var(--label-2)' }}
                >
                  <X className="w-4 h-4" strokeWidth={2.6} />
                </button>
                <h2 id="calc-sheet-title" className="t-title2" style={{ marginBottom: '1rem', paddingRight: '2.5rem' }}>
                  How it&apos;s calculated
                </h2>
                <ul className="inset-fill t-subhead" style={{ listStyle: 'none', overflow: 'hidden' }}>
                  {[
                    <>Your goal is <strong>CGPA ≥ 8.0</strong>, which means scoring a Grade B in each subject.</>,
                    <>Grade B requires <strong>105 out of 150</strong> total marks.</>,
                    <><strong>No assumptions</strong> are made for ISA and ESA marks; we only calculate based on exact scores needed.</>,
                    <><strong>Assignments</strong> are fixed at a realistic average of <strong>8.5 / 10</strong>.</>,
                  ].map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.8rem 1rem',
                        borderTop: i ? '0.5px solid var(--separator)' : 'none',
                      }}
                    >
                      <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.2} style={{ color: 'var(--tint)', flexShrink: 0, marginTop: 1 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={closeOverlay} className="btn-primary pressable" style={{ marginTop: '1.5rem' }}>
                  Got it
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <NavBar
        title="CGPA"
        maxWidth="860px"
        onBack={() => router.push('/home')}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onLogout={handleLogout}
      />

      <main className="page" style={{ maxWidth: '860px' }}>
        <motion.div {...rise(0)} className="large-title-wrap">
          <h1 className="t-large-title">CGPA Tracker</h1>
        </motion.div>

        {/* ── CGPA + Percentile Summary ── */}
        <motion.div {...rise(1)}
          style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'flex-start' }}>
          {data.cgpa !== null && (
            <ScoreCard label="Your CGPA" value={data.cgpa.toFixed(2)}
              sub={data.cgpa >= 8 ? 'Placement ready' : 'Below 8.0'}
              color={data.cgpa >= 8 ? 'var(--safe)' : 'var(--warn)'} />
          )}
          <PercentileCard data={percentile} loading={percentileLoading} />
        </motion.div>

        {/* ── Sem Tabs ── */}
        {data.results.length > 1 && (
          <motion.div {...rise(2)} style={{ marginBottom: '1.25rem' }}>
            <div className="segmented" role="tablist" aria-label="Semester">
              {data.results.map(r => (
                <button
                  key={r.semId}
                  role="tab"
                  aria-selected={selectedSem === r.semId}
                  onClick={() => setSelectedSem(r.semId)}
                  className="segment"
                >
                  {selectedSem === r.semId && (
                    <motion.span layoutId="sem-thumb" className="segment-thumb" transition={spring} />
                  )}
                  <span className="segment-label">{r.semLabel} {r.isCompleted ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedSem} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ ...spring, visualDuration: 0.25 }}>
            {currentSem.isCompleted
              ? <CompletedView sem={currentSem} />
              : <InProgressView sem={currentSem} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}

// ─── Completed Semester ────────────────────────────────────────────────────────
function CompletedView({ sem }: { sem: SemResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div className="surface" style={{ padding: '1.1rem 1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {sem.sgpa && <KV label="SGPA" value={sem.sgpa.toFixed(2)} color="var(--label)" />}
        {sem.cgpa && <KV label="CGPA" value={sem.cgpa.toFixed(2)} color="var(--label-2)" />}
        {sem.earnedCredits && sem.totalCredits && <KV label="Credits" value={`${sem.earnedCredits}/${sem.totalCredits}`} color="var(--safe)" />}
        {sem.esaDescription && <p className="t-footnote secondary" style={{ marginLeft: 'auto' }}>{sem.esaDescription}</p>}
      </div>
      {sem.subjects.map((sub, i) => (
        <motion.div key={sub.courseCode} {...rise(i)}
          className="surface" style={{ padding: '1.1rem 1.25rem' }}>
          <SubjectHead sub={sub} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            {sub.isZeroCredit ? (
              // 0-credit subjects: only show ESA grade
              sub.marks.esa && <Chip label="Grade" val={sub.marks.esa} highlight />
            ) : (
              <>
                {sub.marks.isa1     && <Chip label="ISA 1"     val={`${sub.marks.isa1.score ?? '—'}/40`} />}
                {sub.marks.isa2     && <Chip label="ISA 2"     val={`${sub.marks.isa2.score ?? '—'}/40`} />}
                {sub.marks.assignment && <Chip label="Assignment" val={`${sub.marks.assignment.score ?? '—'}/10`} />}
                {sub.marks.finalIsa && <Chip label="Final ISA" val={`${sub.marks.finalIsa.score ?? '—'}/50`} />}
                {sub.marks.esa      && <Chip label="ESA Grade" val={sub.marks.esa} highlight />}
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── In-Progress Semester ──────────────────────────────────────────────────────
function InProgressView({ sem }: { sem: SemResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {sem.subjects.map((sub, i) => {
        const a = sub.analysis;
        return (
          <motion.div key={sub.courseCode}
            {...rise(i)}
            className="surface"
            style={{ padding: '1.25rem' }}>

            {/* Subject name + status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
              <SubjectHead sub={sub} dot={borderColor(a)} />
              <StatusPill a={a} />
            </div>

            {/* 0-credit subject: just show grade */}
            {a.state === 'zero_credit' && (
              <p className="t-subhead secondary">
                {sub.marks.esa ? (
                  <>Grade: <strong style={{ color: 'var(--label)' }}>{sub.marks.esa}</strong></>
                ) : (
                  'No credit subject — grade only, not included in CGPA calculation.'
                )}
              </p>
            )}

            {/* ISA 1 / ISA 2 / Assignment / Final ISA chips */}
            {a.state !== 'zero_credit' && a.currentIsa1 !== null && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <Chip label="ISA 1 (done)" val={`${a.currentIsa1}/40`} highlight />
                {a.currentIsa2 !== null && <Chip label="ISA 2 (done)" val={`${a.currentIsa2}/40`} highlight />}
                {a.assignment !== null && <Chip label="Assignment" val={`${a.assignment}/10`} highlight />}
                {a.finalIsa !== null && <Chip label="Final ISA" val={`${a.finalIsa.toFixed(1)}/50`} />}
              </div>
            )}

            {/* ISA1 done — show range table */}
            {a.state === 'isa1_done' && a.scenarios && (
              <ScenarioTable scenarios={a.scenarios} />
            )}

            {/* ISA2 done — show exact ESA needed */}
            {a.state === 'isa2_done' && a.minEsa !== null && (
              <ExactEsa minEsa={a.minEsa} impossible={a.impossible} secured={a.alreadySecured} />
            )}

            {/* Complete */}
            {a.state === 'complete' && (
              <p className="t-subhead" style={{ color: 'var(--safe)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} style={{ flexShrink: 0 }} /> Semester complete — check the completed semester tab for your grade.
              </p>
            )}

            {/* Nothing yet */}
            {a.state === 'none' && (
              <p className="t-subhead secondary">
                No marks recorded yet. You need <strong style={{ color: 'var(--label)' }}>105 / 150</strong> total for CGPA ≥ 8.
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Scenario Table ───────────────────────────────────────────────────────────
function ScenarioTable({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div>
      <p className="t-footnote secondary" style={{ fontWeight: 500, marginBottom: '0.5rem', padding: '0 4px' }}>
        Minimum ESA needed for CGPA ≥ 8, depending on your ISA 2 score
      </p>
      <div className="inset-fill" style={{ overflow: 'hidden' }}>
        {scenarios.map((sc, i) => {
          const pct    = sc.minEsa / 100;
          const color  = sc.esaImpossible ? 'var(--danger)' : sc.esaSecured ? 'var(--safe)' : pct > 0.85 ? 'var(--warn)' : 'var(--safe)';
          return (
            <div key={sc.isa2Val} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
              flexWrap: 'wrap', borderTop: i ? '0.5px solid var(--separator)' : 'none',
            }}>
              {/* ISA2 label */}
              <div style={{ minWidth: '104px' }}>
                <span className="t-footnote secondary">ISA 2 = </span>
                <span className="t-num" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{sc.isa2Val}/40</span>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--label-3)' }} strokeWidth={2.4} />

              {/* ESA needed */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                {sc.esaSecured ? (
                  <span className="t-subhead" style={{ fontWeight: 600, color: 'var(--safe)' }}>Already secured</span>
                ) : sc.esaImpossible ? (
                  <span className="t-subhead" style={{ fontWeight: 600, color: 'var(--danger)' }}>Not achievable</span>
                ) : (
                  <>
                    <span className="t-footnote secondary">need ESA ≥ </span>
                    <span className="t-num" style={{ fontWeight: 700, fontSize: '1.0625rem', color }}>{sc.minEsa}/100</span>
                  </>
                )}
              </div>

              {/* Mini bar */}
              {!sc.esaImpossible && !sc.esaSecured && (
                <div style={{ width: '72px', height: '5px', background: 'var(--fill-2)', borderRadius: '99px', overflow: 'hidden' }}>
                  <motion.div initial={{ x: '-100%' }} animate={{ x: `${sc.minEsa - 100}%` }} transition={{ ...spring, visualDuration: 0.6 }}
                    style={{ width: '100%', height: '100%', background: color, borderRadius: '99px' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="t-caption secondary" style={{ marginTop: '0.5rem', padding: '0 4px' }}>
        * Assignment assumed 8.5/10. All other values are exact math — no guessing.
      </p>
    </div>
  );
}

// ─── Exact ESA (ISA2 done) ────────────────────────────────────────────────────
function ExactEsa({ minEsa, impossible, secured }: { minEsa: number; impossible: boolean; secured: boolean }) {
  const color = impossible ? 'var(--danger)' : secured ? 'var(--safe)' : minEsa > 85 ? 'var(--warn)' : 'var(--safe)';
  return (
    <div className="inset-fill" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <p className="t-footnote secondary" style={{ fontWeight: 500 }}>You need in ESA (exact — no assumptions)</p>
      {secured ? (
        <p className="t-title2" style={{ color: 'var(--safe)' }}>Already secured CGPA ≥ 8</p>
      ) : impossible ? (
        <p className="t-headline" style={{ color: 'var(--danger)' }}>Cannot reach 105 even with 100 in ESA</p>
      ) : (
        <>
          <p className="t-num" style={{ fontSize: '2.75rem', fontWeight: 700, color, lineHeight: 1 }}>
            {minEsa}<span className="secondary" style={{ fontSize: '1.0625rem', fontWeight: 500 }}>/100</span>
          </p>
          <p className="t-footnote secondary">
            This is the exact minimum. ISA 1 + ISA 2 are both known, so no assumptions made.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function SubjectHead({ sub, dot }: { sub: Subject; dot?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p className="t-footnote t-mono secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {dot && <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
        {sub.courseCode}
      </p>
      <p className="t-headline" style={{ marginTop: '0.15rem' }}>{sub.courseName}</p>
    </div>
  );
}

function Chip({ label, val, highlight }: { label: string; val: string; highlight?: boolean }) {
  return (
    <div className="inset-fill" style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', padding: '0.5rem 0.85rem', borderRadius: '12px', minWidth: '88px' }}>
      <span className="t-caption secondary" style={{ fontWeight: 500 }}>{label}</span>
      <span className="t-num" style={{ fontSize: '1.0625rem', fontWeight: 600, color: highlight ? 'var(--label)' : 'var(--label-2)' }}>{val}</span>
    </div>
  );
}

function KV({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="t-footnote secondary" style={{ marginBottom: '0.1rem', fontWeight: 500 }}>{label}</p>
      <p className="t-num" style={{ fontSize: '1.625rem', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</p>
    </div>
  );
}

function ScoreCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="surface" style={{ padding: '1.1rem 1.4rem', flex: '1 1 150px', minWidth: '150px' }}>
      <p className="t-footnote secondary" style={{ fontWeight: 500, marginBottom: '0.3rem' }}>{label}</p>
      <p className="t-num" style={{ fontWeight: 700, fontSize: '2.25rem', color, lineHeight: 1 }}>{value}</p>
      <p className="t-footnote secondary" style={{ marginTop: '0.4rem' }}>{sub}</p>
    </div>
  );
}

// ─── Percentile Card ──────────────────────────────────────────────────────────
function PercentileCard({ data, loading }: { data: PercentileData | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="surface" style={{ padding: '1.1rem 1.4rem', flex: '1 1 220px', minWidth: '220px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '5px solid var(--fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--label-2)', flexShrink: 0 }}>
          <ActivityIndicator size={18} />
        </div>
        <div>
          <p className="t-footnote secondary" style={{ fontWeight: 500 }}>Computing rank</p>
          <p className="t-subhead" style={{ marginTop: '0.1rem' }}>Analyzing class data…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface" style={{ padding: '1.1rem 1.4rem', flex: '1 1 220px', minWidth: '220px' }}>
        <p className="t-footnote secondary" style={{ fontWeight: 500, marginBottom: '0.3rem' }}>Class standing</p>
        <p className="t-subhead secondary">Not enough data yet</p>
      </div>
    );
  }

  const pct = data.overallPercentile;
  const glowColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--blue)' : pct >= 40 ? 'var(--orange)' : 'var(--red)';
  const circumference = 2 * Math.PI * 24; // r=24
  const dashOffset = circumference - (circumference * pct) / 100;

  return (
    <motion.div
      whileTap={tap}
      className="surface card-link"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      style={{
        padding: '1.1rem 1.4rem',
        flex: '2 1 280px',
        minWidth: '280px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', position: 'relative' }}>
        {/* Animated Percentile Ring */}
        <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="24" fill="none" strokeWidth="6" style={{ stroke: `color-mix(in srgb, ${glowColor} 22%, transparent)` }} />
            <motion.circle
              cx="30" cy="30" r="24" fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ stroke: glowColor }}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ ...spring, visualDuration: 1, delay: 0.3 }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span className="t-num" style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1 }}>
              {data.topPercentage}%
            </span>
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.4} style={{ color: glowColor }} />
            <p className="t-footnote secondary" style={{ fontWeight: 500 }}>
              {data.semLabel} Standing
            </p>
          </div>
          <p className="t-title2">
            Top {data.topPercentage}%
          </p>
          <p className="t-footnote secondary" style={{ marginTop: '0.15rem' }}>
            {data.comparisonText} · {data.standing}
          </p>
        </div>

        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={spring} style={{ display: 'flex', color: 'var(--label-3)', alignSelf: 'center' }}>
          <ChevronDown className="w-5 h-5" strokeWidth={2.4} />
        </motion.span>
      </div>

      {/* Expanded: Subject breakdown */}
      <AnimatePresence initial={false}>
        {expanded && data.subjects && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '0.5px solid var(--separator)', paddingTop: '0.85rem', marginTop: '1rem' }}>
              <p className="t-footnote secondary" style={{ fontWeight: 500, marginBottom: '0.6rem' }}>
                Subject breakdown
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {data.subjects.map(sub => {
                  const barColor = sub.percentile >= 80 ? 'var(--green)' : sub.percentile >= 60 ? 'var(--blue)' : sub.percentile >= 40 ? 'var(--orange)' : 'var(--red)';
                  return (
                    <div key={sub.courseCode}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem', gap: '0.5rem' }}>
                        <span className="t-footnote" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {sub.courseName}
                        </span>
                        <span className="t-footnote t-num" style={{ fontWeight: 700, color: barColor }}>
                          Top {100 - sub.percentile}%
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: 'var(--fill)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: `${sub.percentile - 100}%` }}
                          transition={{ ...spring, visualDuration: 0.7, delay: 0.1 }}
                          style={{ width: '100%', height: '100%', borderRadius: 99, background: barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="t-caption tertiary" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                Based on currently published results · Tap to collapse
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <p className="t-caption tertiary" style={{ marginTop: '0.6rem', textAlign: 'center' }}>
          Tap to see subject breakdown
        </p>
      )}
    </motion.div>
  );
}

function StatusPill({ a }: { a: Analysis }) {
  if (a.state === 'zero_credit') return <Pill label="No Credit" color="var(--label-2)" bg="var(--fill)" />;
  if (a.impossible)      return <Pill label="Very tough" color="var(--danger)" bg="var(--danger-dim)" />;
  if (a.alreadySecured)  return <Pill label="On track" color="var(--safe)" bg="var(--safe-dim)" />;
  if (a.state === 'complete')   return <Pill label="Done" color="var(--safe)" bg="var(--safe-dim)" />;
  if (a.state === 'isa2_done')  return <Pill label="ISA Done" color="var(--tint)" bg="color-mix(in srgb, var(--tint) 14%, transparent)" />;
  if (a.state === 'isa1_done')  return <Pill label="ISA 1 Done" color="var(--warn)" bg="var(--warn-dim)" />;
  return <Pill label="Not started" color="var(--label-2)" bg="var(--fill)" />;
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="badge" style={{ background: bg, color, flexShrink: 0 }}>
      {label}
    </span>
  );
}

function borderColor(a: Analysis) {
  if (a.state === 'zero_credit') return 'var(--label-3)';
  if (a.impossible)     return 'var(--danger)';
  if (a.alreadySecured) return 'var(--safe)';
  if (a.state === 'isa2_done' || a.state === 'isa1_done') return 'var(--tint)';
  return 'var(--label-3)';
}

// ─── Loading / Error / Empty ──────────────────────────────────────────────────
function Spinner() {
  return (
    <main className="page" style={{ maxWidth: '860px', paddingTop: '4.5rem' }} aria-busy="true" aria-label="Loading results">
      <div style={{ height: '44px', width: '60%', maxWidth: '320px', marginBottom: '1.5rem', borderRadius: '12px' }} className="shimmer" />
      <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <div style={{ height: '112px', flex: '1 1 150px' }} className="shimmer" />
        <div style={{ height: '112px', flex: '2 1 280px' }} className="shimmer" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: '150px' }} className="shimmer" />
        ))}
      </div>
    </main>
  );
}

function ErrorScreen({ msg, onRetry, onBack }: { msg: string; onRetry: () => void; onBack: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
      <AlertCircle className="w-12 h-12" strokeWidth={1.6} style={{ color: 'var(--label-3)', marginBottom: '0.25rem' }} />
      <p className="t-title2">Something went wrong</p>
      <p className="t-body secondary" style={{ maxWidth: '380px' }}>{msg}</p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button onClick={onBack}  className="btn-secondary pressable">Back</button>
        <button onClick={onRetry} className="btn-primary pressable" style={{ width: 'auto', minHeight: 44 }}>Retry</button>
      </div>
    </main>
  );
}

function EmptyScreen({ onBack }: { onBack: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
      <AlertCircle className="w-12 h-12" strokeWidth={1.6} style={{ color: 'var(--label-3)', marginBottom: '0.25rem' }} />
      <p className="t-body secondary">No results data available yet.</p>
      <button onClick={onBack} className="btn-primary pressable" style={{ width: 'auto', minHeight: 44, marginTop: '1rem' }}>Back</button>
    </main>
  );
}
