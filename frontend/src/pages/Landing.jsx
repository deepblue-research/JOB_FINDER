import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fadeUp">

      {/* ── Hero ── exact design structure: h1 is a flex sibling, NOT inside left div */}
      <section style={{
        maxWidth: 1180, margin: '0 auto',
        padding: 'clamp(40px,7vw,88px) clamp(20px,5vw,40px) clamp(32px,5vw,56px)',
        display: 'flex', flexWrap: 'wrap',
        gap: 'clamp(36px,5vw,64px)', alignItems: 'center',
      }}>
        {/* h1 — direct flex child, takes full row at large font size via flex-wrap */}
        <h1 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(38px,5.5vw,62px)', lineHeight: 1.02,
          letterSpacing: '-0.03em', marginBottom: 22, textWrap: 'balance',
          width: '100%',
        }}>
          Your resume, matched to your first real jo<span style={{ fontSize: 'clamp(38px,5.5vw,62px)', letterSpacing: '-0.03em' }}>b.</span>
        </h1>

        {/* Left div — flex:1 1 380px per design */}
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <p style={{
            fontSize: 'clamp(16px,1.8vw,19px)', lineHeight: 1.55,
            color: '#475569', maxWidth: 520, marginBottom: 34, textWrap: 'pretty',
          }}>
            Upload your resume once. We read your skills, score every entry-level role against them, and show you exactly where you fit — no endless scrolling, no guesswork.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 26px', border: 'none', borderRadius: 12,
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
              }}
            >Upload your resume <span style={{ fontSize: 18 }}>→</span></button>
            <a href="#how" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '16px 24px', borderRadius: 12,
              border: '1px solid rgba(15,23,42,0.12)',
              color: '#1e293b', textDecoration: 'none',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16,
            }}>See how it works</a>
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26 }}>12k+</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>entry-level roles</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26 }}>30s</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>to your matches</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26 }}>No fee</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>free for students</div>
            </div>
          </div>
        </div>

        {/* Right div — flex:1 1 360px per design */}
        <div style={{ flex: '1 1 360px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'linear-gradient(180deg,#ffffff,#f4f8ff)',
            border: '1px solid rgba(15,23,42,0.08)', borderRadius: 22, padding: 24,
            boxShadow: '0 30px 70px -30px rgba(15,23,42,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>Top match</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Updated just now</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: 'conic-gradient(#2563eb 96%, rgba(15,23,42,0.1) 0)',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 14,
                }}>96%</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, lineHeight: 1.2 }}>Junior Product Analyst</div>
                <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>Northbeam · Remote</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {['✓ Data Analysis', '✓ SQL', '✓ Excel'].map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 11px', borderRadius: 8,
                  background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
                  fontSize: 12.5, fontWeight: 500, color: '#059669',
                }}>{tag}</span>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 16 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#475569' }}>$68k–$82k · Full-time</span>
              <span style={{
                padding: '9px 16px', borderRadius: 9,
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13.5,
              }}>Apply</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,5vw,72px) clamp(20px,5vw,40px)' }}>
        <h2 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(26px,3.5vw,36px)', letterSpacing: '-0.02em', marginBottom: 8,
        }}>Three steps to your shortlist</h2>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 40 }}>No profiles to fill out. Your resume does the work.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {[
            { n: '1', title: 'Upload your resume',   desc: "Drop in a PDF or Word doc. That's the only thing we need to get started." },
            { n: '2', title: 'We read your skills',  desc: 'We pull out your real strengths and score every open role against them.' },
            { n: '3', title: 'Apply with one click', desc: 'See your match score, apply to the best fits, and skip the rest.' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{
              background: '#fff', border: '1px solid rgba(15,23,42,0.07)', borderRadius: 18,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04),0 12px 32px -16px rgba(37,99,235,0.16)',
              padding: 28,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'rgba(37,99,235,0.1)', color: '#2563eb',
                display: 'grid', placeItems: 'center',
                fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17, marginBottom: 18,
              }}>{n}</div>
              <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 19, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px', border: 'none', borderRadius: 12,
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
            }}
          >Get my matches <span style={{ fontSize: 18 }}>→</span></button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(15,23,42,0.06)', marginTop: 40 }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto',
          padding: '28px clamp(20px,5vw,40px)',
          display: 'flex', flexWrap: 'wrap', gap: 14,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, background: '#2563eb',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13,
            }}>J</div>
            <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>JobMatch</span>
          </div>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>© 2026 JobMatch · Free for students</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
