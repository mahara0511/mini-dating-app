'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  currentUserId?: string | null;
  currentUserName?: string | null;
}

export default function Navbar({ currentUserId, currentUserName }: NavbarProps) {
  const pathname = usePathname();

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
            Trang chủ
          </Link>
          <Link href="/profiles" className={`nav-link ${pathname === '/profiles' ? 'active' : ''}`}>
            Khám phá
          </Link>
          {currentUserId && (
            <Link href="/matches" className={`nav-link ${pathname === '/matches' || pathname?.startsWith('/schedule') ? 'active' : ''}`}>
              Matches
            </Link>
          )}
          <Link href="/create-profile" className={`nav-link ${pathname === '/create-profile' ? 'active' : ''}`}>
            Tạo Profile
          </Link>
        </div>

        {currentUserName && (
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
        )}
      </div>
    </nav>
  );
}
