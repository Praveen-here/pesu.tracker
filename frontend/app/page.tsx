'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import ActivityIndicator from '@/components/ActivityIndicator';
import BrandMark from '@/components/BrandMark';
import { spring } from '@/lib/motion';

export default function LoginPage() {
  const router = useRouter();
  const [srn, setSrn] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (!srn.trim() || !password.trim()) {
      setError('Please enter both SRN and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/login', { srn: srn.trim(), password }, { withCredentials: true });
      router.push('/home');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [srn, password, router]);

  // Global Enter key listener — handles autofill case where no input is focused
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) handleSubmit(e);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleSubmit, loading]);


  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(2rem, env(safe-area-inset-top)) 16px max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}
      >
        {/* App icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <BrandMark size={44} />
          </div>
          <h1 className="t-title" style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            PESU Tracker
          </h1>
          <p className="t-subhead secondary">Track · Bunk · Stay Safe</p>
        </div>

        <h2 className="section-header">Sign in with PESU Academy</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field-group">
            {/* SRN */}
            <div className="field">
              <label htmlFor="srn-input">SRN</label>
              <input
                id="srn-input"
                type="text"
                placeholder="e.g. PES1PG25CA317"
                value={srn}
                onChange={(e) => setSrn(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as unknown as FormEvent); }}
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="characters"
              />
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Required"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as unknown as FormEvent); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                id="toggle-password"
                className="pressable"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--label-3)',
                  flexShrink: 0,
                }}
              >
                {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                style={{ overflow: 'hidden' }}
              >
                <p
                  role="alert"
                  className="t-subhead"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    color: 'var(--danger)',
                    background: 'var(--danger-dim)',
                    borderRadius: '12px',
                    padding: '0.7rem 0.9rem',
                  }}
                >
                  <AlertCircle className="w-4 h-4" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            id="login-btn"
            className="btn-primary pressable"
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <ActivityIndicator size={18} color="#ffffff" />
                Signing In…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p
          className="t-footnote secondary"
          style={{
            marginTop: '1.25rem',
            padding: '0 1rem',
            textAlign: 'center',
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <Lock className="w-3.5 h-3.5" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Your credentials are never stored. They are used only to fetch your attendance and marks from PESU Academy and are discarded immediately.</span>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="t-caption tertiary"
        style={{ marginTop: '2.5rem' }}
      >
        Not affiliated with PES University
      </motion.p>
    </main>
  );
}
