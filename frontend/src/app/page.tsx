'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentUserId');
    const name = localStorage.getItem('currentUserName');
    if (id) setCurrentUserId(id);
    if (name) setCurrentUserName(name);
  }, []);

  return (
    <>
      <Navbar currentUserId={currentUserId} currentUserName={currentUserName} />

      <main className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Hero Section */}
        <section style={{
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Floating Hearts BG */}
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            {['💕', '✨', '💗', '🌟', '💖', '💜', '💫'].map((emoji, i) => (
              <span key={i} style={{
                position: 'absolute',
                fontSize: `${1.8 + i * 0.3}rem`,
                left: `${10 + i * 12}%`,
                top: `${20 + Math.sin(i) * 30}%`,
                opacity: 0.15,
                animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
              }}>
                {emoji}
              </span>
            ))}
          </div>

          <style jsx>{`
            @keyframes float {
              from { transform: translateY(0px) rotate(0deg); }
              to { transform: translateY(-20px) rotate(5deg); }
            }
          `}</style>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '5rem', marginBottom: '16px' }}>💕</div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '20px',
              letterSpacing: '-0.03em',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Tìm người ấy
              </span>
              <br />
              <span style={{ color: '#e2e8f0' }}>của bạn</span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: 'rgba(226, 232, 240, 0.6)',
              maxWidth: '520px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}>
              Mini Dating App – Tạo profile, khám phá, like và match. 
              Khi cả hai đều thích nhau, hẹn lịch gặp mặt ngay!
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/create-profile">
                <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  Tạo Profile Ngay
                </button>
              </Link>
              <Link href="/profiles">
                <button className="btn-secondary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                  Khám Phá
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '80px 0' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '48px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Cách hoạt động
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                icon: '👤',
                title: 'Tạo Profile',
                desc: 'Điền thông tin cá nhân: tên, tuổi, giới tính, bio và email để tạo profile của bạn.',
              },
              {
                icon: '💖',
                title: 'Like & Match',
                desc: 'Duyệt profiles và like người bạn thích. Khi cả hai cùng like nhau → It\'s a Match!',
              },
              {
                icon: '📅',
                title: 'Hẹn Lịch',
                desc: 'Sau khi match, chọn thời gian rảnh trong 3 tuần tới. Hệ thống tự tìm slot trùng.',
              },
            ].map((feature, i) => (
              <div key={i} className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: '#e2e8f0' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'rgba(226, 232, 240, 0.6)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Login Quick Access */}
        {!currentUserId && (
          <section style={{ padding: '40px 0 80px', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>
                Đã có profile?
              </h3>
              <p style={{ color: 'rgba(226, 232, 240, 0.6)', marginBottom: '24px' }}>
                Đăng nhập bằng email để truy cập các matches của bạn
              </p>
              <Link href="/login">
                <button className="btn-primary">
                  Đăng nhập
                </button>
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
