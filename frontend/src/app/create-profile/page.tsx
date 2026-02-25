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
      setError('Vui lòng nhập tên');
      setLoading(false);
      return;
    }
    if (!form.age || parseInt(form.age) < 18 || parseInt(form.age) > 100) {
      setError('Tuổi phải từ 18 đến 100');
      setLoading(false);
      return;
    }
    if (!form.gender) {
      setError('Vui lòng chọn giới tính');
      setLoading(false);
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
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
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
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
            Tạo Profile
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
            Điền thông tin để bắt đầu tìm kiếm người ấy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label className="form-label" htmlFor="name">Tên</label>
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="Nhập tên của bạn"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Age & Gender Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label" htmlFor="age">Tuổi</label>
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
                <label className="form-label" htmlFor="gender">Giới tính</label>
                <select
                  id="gender"
                  className="select-field"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Chọn...</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="form-label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="input-field"
                placeholder="Viết vài dòng giới thiệu về bản thân..."
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
                Email dùng để định danh tài khoản
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
                ✅ Profile đã được tạo thành công! Đang chuyển hướng...
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
                  Đang tạo...
                </span>
              ) : success ? (
                'Đã tạo!'
              ) : (
                'Tạo Profile'
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
