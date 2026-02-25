'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getMatches, MatchData } from '@/lib/api';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentUserId');
    const name = localStorage.getItem('currentUserName');
    if (id) {
      setCurrentUserId(id);
      setCurrentUserName(name);
      loadMatches(id);
    } else {
      router.push('/login');
    }
  }, []);

  const loadMatches = async (userId: string) => {
    try {
      const data = await getMatches(userId);
      setMatches(data);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  const getPartner = (match: MatchData) => {
    return match.userAId === currentUserId ? match.userB : match.userA;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />
      <main className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 800,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            💕 Matches của bạn
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.95rem' }}>
            Những người đã match với bạn
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px', color: '#e2e8f0' }}>
              Chưa có match nào
            </h3>
            <p style={{ color: 'rgba(226, 232, 240, 0.5)', marginBottom: '24px' }}>
              Hãy khám phá và like những người bạn thích. Khi cả hai cùng like → Match!
            </p>
            <a href="/profiles">
              <button className="btn-primary">Khám phá ngay</button>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map((match) => {
              const partner = getPartner(match);
              return (
                <div key={match.id} className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Partner Avatar */}
                    <div className={`avatar avatar-${partner?.gender || 'other'}`} style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                      {partner?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>
                          {partner?.name || 'Unknown'}
                        </h3>
                        <span className="match-badge" style={{ animation: 'none' }}>
                          💕 Matched!
                        </span>
                      </div>
                      <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.85rem' }}>
                        {partner?.age} tuổi • {partner?.gender === 'male' ? 'Nam' : partner?.gender === 'female' ? 'Nữ' : 'Khác'}
                      </p>
                      {partner?.bio && (
                        <p style={{ color: 'rgba(226, 232, 240, 0.4)', fontSize: '0.85rem', marginTop: '4px' }}>
                          {partner.bio}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {match.scheduledDate ? (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}>
                          <p style={{ color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                            📅 Date đã hẹn
                          </p>
                          <p style={{ color: '#a7f3d0', fontSize: '0.8rem' }}>
                            {formatDate(match.scheduledDate)}
                          </p>
                          <p style={{ color: '#a7f3d0', fontSize: '0.8rem' }}>
                            {match.scheduledTimeStart} - {match.scheduledTimeEnd}
                          </p>
                        </div>
                      ) : (
                        <a href={`/schedule/${match.id}`}>
                          <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                            Hẹn lịch
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
