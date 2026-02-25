'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getUserByEmail } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const user = await getUserByEmail(email.trim().toLowerCase());
      if (!user) {
        setError('No profile found with this email. Please create a new profile!');
        setLoading(false);
        return;
      }

      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('currentUserName', user.name);
      localStorage.setItem('currentUserEmail', user.email);

      router.push('/profiles');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-enter" style={{ maxWidth: '450px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔑</div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Log In
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
            Enter the email you used to create your profile
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '0.9rem',
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  Searching...
                </span>
              ) : (
                'Log In'
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'rgba(226, 232, 240, 0.4)', fontSize: '0.9rem' }}>
                Don't have a profile?{' '}
              </span>
              <a
                href="/create-profile"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Create one →
              </a>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
