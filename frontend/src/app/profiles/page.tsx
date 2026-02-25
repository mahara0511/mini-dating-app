'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { getUsers, createLike, checkLiked, User, MatchData } from '@/lib/api';

export default function ProfilesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likingId, setLikingId] = useState<string | null>(null);
  const [matchPopup, setMatchPopup] = useState<MatchData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentUserId');
    const name = localStorage.getItem('currentUserName');
    if (id) setCurrentUserId(id);
    if (name) setCurrentUserName(name);
    loadUsers(id);
  }, []);

  const loadUsers = async (myId: string | null) => {
    try {
      const data = await getUsers();
      setUsers(data);

      // Check which users current user already liked
      if (myId) {
        const likeChecks: Record<string, boolean> = {};
        for (const user of data) {
          if (user.id !== myId) {
            try {
              const liked = await checkLiked(myId, user.id);
              likeChecks[user.id] = liked;
            } catch {
              likeChecks[user.id] = false;
            }
          }
        }
        setLikedMap(likeChecks);
      }
    } catch (err) {
      showToast('Không thể tải danh sách profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (toUserId: string) => {
    if (!currentUserId) {
      showToast('Vui lòng đăng nhập hoặc tạo profile trước', 'error');
      return;
    }

    setLikingId(toUserId);
    try {
      const result = await createLike(currentUserId, toUserId);
      setLikedMap((prev) => ({ ...prev, [toUserId]: true }));

      if (result.isMatch && result.match) {
        setMatchPopup(result.match);
      } else {
        showToast('💖 Đã like!', 'success');
      }
    } catch (err: any) {
      if (err.message?.includes('Already liked')) {
        showToast('Bạn đã like người này rồi', 'error');
        setLikedMap((prev) => ({ ...prev, [toUserId]: true }));
      } else {
        showToast(err.message || 'Có lỗi xảy ra', 'error');
      }
    } finally {
      setLikingId(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      default: return 'Khác';
    }
  };

  const otherUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
      <main className="page-enter" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🔍 Khám Phá
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
            Duyệt profiles và like người bạn thích
          </p>
        </div>

        {!currentUserId && (
          <div className="glass-card" style={{
            padding: '20px 24px',
            marginBottom: '24px',
            textAlign: 'center',
            borderColor: 'rgba(250, 112, 154, 0.3)',
            background: 'rgba(250, 112, 154, 0.08)',
          }}>
            <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
              ⚠️ Bạn cần <a href="/create-profile" style={{ color: '#f093fb', fontWeight: 600 }}>tạo profile</a> hoặc <a href="/login" style={{ color: '#667eea', fontWeight: 600 }}>đăng nhập</a> để bắt đầu like
            </p>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : otherUsers.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😢</div>
            <p style={{ color: 'rgba(226, 232, 240, 0.6)', fontSize: '1.1rem' }}>
              Chưa có profile nào. Hãy là người đầu tiên tạo profile!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {otherUsers.map((user) => (
              <div key={user.id} className="profile-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  {/* Avatar */}
                  <div className={`avatar avatar-${user.gender}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px', color: '#f1f5f9' }}>
                      {user.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.85rem' }}>
                        {user.age} tuổi
                      </span>
                      <span className={`gender-tag gender-${user.gender}`}>
                        {getGenderLabel(user.gender)}
                      </span>
                    </div>
                  </div>
                </div>

                {user.bio && (
                  <p style={{
                    color: 'rgba(226, 232, 240, 0.6)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    borderLeft: '3px solid rgba(102, 126, 234, 0.3)',
                  }}>
                    &ldquo;{user.bio}&rdquo;
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(226, 232, 240, 0.3)', fontSize: '0.8rem' }}>
                    {user.email}
                  </span>

                  <button
                    className={`btn-like ${likedMap[user.id] ? 'liked' : ''}`}
                    onClick={() => handleLike(user.id)}
                    disabled={!currentUserId || likedMap[user.id] || likingId === user.id}
                  >
                    {likingId === user.id ? (
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    ) : likedMap[user.id] ? (
                      <>✅ Đã Like</>
                    ) : (
                      <>❤️ Like</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Match Popup */}
      {matchPopup && (
        <div className="match-overlay" onClick={() => setMatchPopup(null)}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <div className="match-hearts">💕</div>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              marginTop: '16px',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              It&apos;s a Match!
            </h2>
            <p style={{ color: 'rgba(226, 232, 240, 0.6)', marginBottom: '8px', fontSize: '1rem' }}>
              Bạn và <strong style={{ color: '#f093fb' }}>
                {matchPopup.userA?.name === currentUserName ? matchPopup.userB?.name : matchPopup.userA?.name}
              </strong> đều thích nhau!
            </p>
            <p style={{ color: 'rgba(226, 232, 240, 0.4)', marginBottom: '28px', fontSize: '0.9rem' }}>
              Hãy lên lịch hẹn gặp nhé 🎉
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a href={`/schedule/${matchPopup.id}`}>
                <button className="btn-primary">
                  📅 Hẹn lịch ngay
                </button>
              </a>
              <button
                className="btn-secondary"
                onClick={() => setMatchPopup(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
