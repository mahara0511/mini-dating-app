'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  currentUserId?: string | null;
  currentUserName?: string | null;
}

export default function Navbar({ currentUserId, currentUserName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('currentUserEmail');
    router.push('/');
    window.location.reload();
  };

  return (
    <nav className="nav-bar">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem' }}>💕</span>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            MiniDate
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/profiles" className={`nav-link ${pathname === '/profiles' ? 'active' : ''}`}>
            Discover
          </Link>
          {currentUserId && (
            <Link href="/matches" className={`nav-link ${pathname === '/matches' || pathname?.startsWith('/schedule') ? 'active' : ''}`}>
              Matches
            </Link>
          )}
          {!currentUserId && (
            <Link href="/create-profile" className={`nav-link ${pathname === '/create-profile' ? 'active' : ''}`}>
              Create Profile
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentUserName ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'white',
                }}>
                  {currentUserName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{currentUserName}</span>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '50px',
                  padding: '6px 14px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.color = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.color = '#fca5a5';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">
              <button
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '8px 18px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Log In
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

