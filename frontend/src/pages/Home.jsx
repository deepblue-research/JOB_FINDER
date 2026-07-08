import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const cleanLocation = (loc) => {
  if (!loc) return '';
  return loc.split(',').map(p => p.trim())
    .filter(p => p && !['undefined', 'null', 'None', 'N/A'].includes(p))
    .join(', ') || '';
};

const getMatchColor = (score) => {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#d97706';
  return '#94a3b8';
};

const CardSkeleton = () => (
  <div style={{
    width: '100%', maxWidth: 420,
    background: 'linear-gradient(180deg,#ffffff,#f4f8ff)',
    border: '1px solid rgba(15,23,42,0.08)', borderRadius: 22, padding: 24,
    boxShadow: '0 30px 70px -30px rgba(15,23,42,0.12)',
  }}>
    {[100, 100, 60, 60, 40].map((w, i) => (
      <div key={i} style={{
        height: i === 1 ? 52 : 14, width: `${w}%`,
        background: 'rgba(15,23,42,0.07)', borderRadius: 8, marginBottom: 16,
      }} />
    ))}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [topJob, setTopJob] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [topJobId, setTopJobId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsRes, resumeRes] = await Promise.allSettled([
          client.get('/api/jobs/recommendations'),
          client.get('/api/resumes/'),
        ]);
        if (jobsRes.status === 'fulfilled') {
          const jobs = jobsRes.value.data.jobs || [];
          if (jobs.length > 0) {
            setTopJob(jobs[0]);
            setTopJobId(jobs[0].job_hash || jobs[0].job_id);
          }
        }
        if (resumeRes.status === 'fulfilled') {
          setResumeSkills(resumeRes.value.data?.skills_keywords?.skills || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="animate-fadeUp">

      {/* ── Hero ── exact design structure: h1 is a flex sibling, NOT inside left div */}
      <section style={{
        maxWidth: 1180, margin: '0 auto',
        padding: 'clamp(40px,7vw,88px) clamp(20px,5vw,40px) clamp(32px,5vw,56px)',
        display: 'flex', flexWrap: 'wrap',
        gap: 'clamp(36px,5vw,64px)', alignItems: 'center',
      }}>
        {/* h1 — direct flex child, takes full row via width:100% */}
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
              onClick={() => navigate('/upload')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 26px', border: 'none', borderRadius: 12,
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
              }}
            >Upload your resume <span style={{ fontSize: 18 }}>→</span></button>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '16px 24px', borderRadius: 12,
                border: '1px solid rgba(15,23,42,0.12)',
                background: 'transparent', color: '#1e293b',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
              }}
            >See all matches</button>
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

        {/* Right div — flex:1 1 360px per design — live top job card */}
        <div style={{ flex: '1 1 360px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
          {loading ? <CardSkeleton /> : topJob ? (
            (() => {
              const score = Math.round(topJob.match_score || 0);
              const color = getMatchColor(score);
              const company = topJob.employer_name || topJob.company || 'Company';
              const location = cleanLocation(topJob.job_city || topJob.location);
              const displaySkills = resumeSkills.slice(0, 3);

              return (
                <div style={{
                  width: '100%', maxWidth: 420,
                  background: 'linear-gradient(180deg,#ffffff,#f4f8ff)',
                  border: '1px solid rgba(15,23,42,0.08)', borderRadius: 22, padding: 24,
                  boxShadow: '0 30px 70px -30px rgba(15,23,42,0.12)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>Top match</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>From your results</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      display: 'grid', placeItems: 'center',
                      background: `conic-gradient(${color} ${score}%, rgba(15,23,42,0.1) 0)`,
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', background: '#fff',
                        display: 'grid', placeItems: 'center',
                        fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 14, color,
                      }}>{score}%</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{topJob.job_title}</div>
                      <div style={{ fontSize: 14, color: '#64748b', marginTop: 3 }}>
                        {company}{location ? ` · ${location}` : ''}
                      </div>
                    </div>
                  </div>
                  {displaySkills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                      {displaySkills.map(skill => (
                        <span key={skill} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 11px', borderRadius: 8,
                          background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
                          fontSize: 12.5, fontWeight: 500, color: '#059669',
                        }}>✓ {skill}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 16 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>{topJob.job_employment_type || 'Full-time'}</span>
                    <Link
                      to={`/jobs/${topJobId}`}
                      style={{
                        padding: '9px 16px', borderRadius: 9,
                        background: '#2563eb', color: '#fff',
                        fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 13.5,
                        textDecoration: 'none',
                      }}
                    >View job</Link>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{
              width: '100%', maxWidth: 420,
              background: 'linear-gradient(180deg,#ffffff,#f4f8ff)',
              border: '1.5px dashed rgba(37,99,235,0.3)', borderRadius: 22, padding: 36,
              textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: 'rgba(37,99,235,0.08)',
                display: 'grid', placeItems: 'center', margin: '0 auto 18px', fontSize: 24,
              }}>📄</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 17, marginBottom: 8 }}>No matches yet</div>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.55, marginBottom: 22 }}>
                Upload your resume to see your top job match here.
              </p>
              <button
                onClick={() => navigate('/upload')}
                style={{
                  padding: '11px 22px', borderRadius: 10, border: 'none',
                  background: '#2563eb', color: '#fff',
                  fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >Upload resume</button>
            </div>
          )}
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
            onClick={() => navigate('/jobs')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 28px', border: 'none', borderRadius: 12,
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
            }}
          >Get my matches <span style={{ fontSize: 18 }}>→</span></button>
        </div>
      </section>

    </div>
  );
};

export default Home;
