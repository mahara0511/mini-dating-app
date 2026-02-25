'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createUser } from '@/lib/api';

export default function CreateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    email: '',
  });

  useEffect(() => {
    const id = localStorage.getItem('currentUserId');
    const name = localStorage.getItem('currentUserName');
    if (id) setCurrentUserId(id);
    if (name) setCurrentUserName(name);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!form.name.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }
    if (!form.age || parseInt(form.age) < 18 || parseInt(form.age) > 100) {
      setError('Age must be between 18 and 100');
      setLoading(false);
      return;
    }
    if (!form.gender) {
      setError('Please select a gender');
      setLoading(false);
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Please enter a valid email');
      setLoading(false);
      return;
    }

    try {
      const user = await createUser({
        name: form.name.trim(),
        age: parseInt(form.age),
        gender: form.gender,
        bio: form.bio.trim(),
        email: form.email.trim().toLowerCase(),
      });

      // Save to localStorage for session
      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('currentUserName', user.name);
      localStorage.setItem('currentUserEmail', user.email);

      setSuccess(true);
      setTimeout(() => {
        router.push('/profiles');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
      <main className="page-enter" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✨</div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Create Profile
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
            Fill in your info to start finding your match
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label className="form-label" htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Age & Gender Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label" htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  className="input-field"
                  placeholder="18"
                  min={18}
                  max={100}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  className="select-field"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="input-field"
                placeholder="Write a few lines about yourself..."
                rows={4}
                style={{ resize: 'vertical' }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <p style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.4)', marginTop: '6px' }}>
                Email is used for account identification
              </p>
            </div>

            {/* Error */}
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

            {/* Success */}
            {success && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#6ee7b7',
                fontSize: '0.9rem',
              }}>
                Profile created successfully! Redirecting...
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || success}
              style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                   Creating...
                </span>
              ) : success ? (
                'Created!'
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
