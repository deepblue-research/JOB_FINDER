import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('jm_token');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Resume', path: '/upload' },
    { name: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => {
    if (path === '/jobs') return location.pathname.startsWith('/jobs');
    return location.pathname === path;
  };

  // Also show main navbar on the landing page (/) so it renders the nav
  // but hide on login/register (already handled above)

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      padding: '14px clamp(12px,4vw,32px)',
      background: 'linear-gradient(180deg, rgba(246,249,255,0.95), rgba(246,249,255,0.6) 70%, transparent)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <nav style={{
        maxWidth: 1240, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
        padding: '11px 14px 11px 20px',
        borderRadius: 18,
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.08)',
        boxShadow: '0 18px 44px -26px rgba(15,23,42,0.1)',
      }}>
        {/* Left: Logo + links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.5vw,30px)', minWidth: 0 }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: '#2563eb',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17,
            }}>J</div>
            <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', color: '#1e293b' }}>
              JobMatch
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontFamily: "'Hanken Grotesk'",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'color 0.12s, background 0.12s',
                  color: isActive(link.path) ? '#2563eb' : '#475569',
                  background: isActive(link.path) ? 'rgba(37,99,235,0.08)' : 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Build resume + profile + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link
            to="/build-resume"
            className="hidden sm:inline-flex"
            style={{
              alignItems: 'center', gap: 8,
              padding: '9px 17px',
              border: 'none', borderRadius: 11,
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            + Build resume
          </Link>

          <div className="hidden sm:block" style={{ width: 1, height: 22, background: 'rgba(15,23,42,0.1)', margin: '0 4px' }} />

          <Link
            to="/profile"
            className="hidden sm:inline-flex"
            style={{
              alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 6px',
              border: '1px solid rgba(15,23,42,0.1)', borderRadius: 99,
              background: 'transparent', color: '#475569',
              fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#3b82f6',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: "'Space Grotesk'",
            }}>
              {(localStorage.getItem('jm_email') || 'U')[0].toUpperCase()}
            </span>
            Profile
          </Link>

          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38,
              border: '1px solid rgba(15,23,42,0.1)', borderRadius: 11,
              background: 'transparent', color: '#64748b',
              fontSize: 16, cursor: 'pointer',
            }}
          >
            ⏻
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38,
              border: '1px solid rgba(15,23,42,0.1)', borderRadius: 11,
              background: 'transparent', color: '#64748b',
              cursor: 'pointer',
            }}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div style={{
          maxWidth: 1240, margin: '8px auto 0',
          borderRadius: 18,
          background: '#ffffff',
          border: '1px solid rgba(15,23,42,0.08)',
          boxShadow: '0 18px 44px -26px rgba(15,23,42,0.1)',
          padding: '12px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: 10,
                fontFamily: "'Hanken Grotesk'",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                color: isActive(link.path) ? '#2563eb' : '#475569',
                background: isActive(link.path) ? 'rgba(37,99,235,0.08)' : 'transparent',
                marginBottom: 2,
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
