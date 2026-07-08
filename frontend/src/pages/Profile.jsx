import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

const Profile = () => {
  const [account, setAccount] = useState(null);
  const [resume, setResume] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [accountRes, resumeRes, prefRes] = await Promise.allSettled([
          client.get('/auth/me'),
          client.get('/api/resumes/'),
          client.get('/api/preferences/'),
        ]);
        if (accountRes.status === 'fulfilled') setAccount(accountRes.value.data);
        if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data);
        if (prefRes.status === 'fulfilled') setPreferences(prefRes.value.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jm_token');
    localStorage.removeItem('jm_email');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '4px solid rgba(15,23,42,0.08)', borderTopColor: '#2563eb',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading profile…</p>
      </div>
    );
  }

  const initials = account?.email?.[0]?.toUpperCase() || '?';
  const skills = resume?.skills_keywords?.skills || [];
  const atsScore = resume?.ats_score ? Math.round(resume.ats_score) : null;
  const resumeStrength = atsScore === null ? null : atsScore >= 70 ? 'Strong' : atsScore >= 40 ? 'Good' : 'Fair';
  const resumeStrengthColor = resumeStrength === 'Strong' ? '#059669' : resumeStrength === 'Good' ? '#2563eb' : '#d97706';
  const modes = preferences?.work_mode
    ? preferences.work_mode.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,40px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
          background: '#3b82f6', display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(22px,3vw,28px)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {account?.email || 'Your Profile'}
          </h1>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {account?.college && `${account.college} · `}{account?.batch_year && `Class of ${account.batch_year}`}
          </div>
        </div>
        <button
          onClick={() => navigate('/upload')}
          style={{
            padding: '11px 18px', borderRadius: 11, border: 'none',
            background: '#2563eb', color: '#fff',
            fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >Update resume</button>
      </div>

      {/* Stat cards — matching design: Applications sent / Matched roles / Resume strength */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: '#1e293b' }}>0</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Applications sent</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: '#1e293b' }}>
            {skills.length > 0 ? skills.length : '—'}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Matched roles</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: resumeStrengthColor || '#94a3b8' }}>
            {resumeStrength || '—'}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Resume strength</div>
        </div>
      </div>

      {/* Preferences card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="section-label">Job preferences</div>
          <Link to="/onboarding" style={{
            padding: '8px 15px', borderRadius: 9,
            background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
            color: '#2563eb', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13,
            textDecoration: 'none',
          }}>Edit preferences</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
              Desired role
            </div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: preferences?.desired_role ? '#1e293b' : '#94a3b8' }}>
              {preferences?.desired_role || 'Not set'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
              Location
            </div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: preferences?.desired_location ? '#1e293b' : '#94a3b8' }}>
              {preferences?.desired_location || 'Not set'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
              Work mode
            </div>
            {modes.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {modes.map(m => (
                  <span key={m} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 99,
                    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                    fontSize: 13.5, fontWeight: 600, color: '#2563eb',
                  }}>{m}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: '#94a3b8' }}>Not set</div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Skills from your resume</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill, i) => (
              <span key={i} style={{
                padding: '7px 13px', borderRadius: 9,
                background: 'rgba(15,23,42,0.045)', border: '1px solid rgba(15,23,42,0.08)',
                fontSize: 13, color: '#475569',
              }}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/jobs" style={{
          padding: '12px 20px', borderRadius: 11,
          background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
          color: '#1e293b', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14.5,
          textDecoration: 'none',
        }}>View my matches</Link>
        <button onClick={handleLogout} style={{
          padding: '12px 20px', borderRadius: 11,
          background: 'transparent', border: '1px solid rgba(220,38,38,0.3)',
          color: '#dc2626', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
        }}>Log out</button>
      </div>
    </div>
  );
};

export default Profile;
