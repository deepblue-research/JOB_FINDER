import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToastStore } from '../store/toastStore';

const cleanLocation = (loc) => {
  if (!loc) return 'India';
  return loc.split(',').map(p => p.trim())
    .filter(p => p && !['undefined', 'null', 'None', 'N/A'].includes(p))
    .join(', ') || 'India';
};

const getMatchColor = (score) => {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#d97706';
  return '#94a3b8';
};

const MatchRing = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score));
  const color = getMatchColor(pct);
  return (
    <div style={{
      width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
      display: 'grid', placeItems: 'center',
      background: `conic-gradient(${color} ${pct}%, rgba(15,23,42,0.08) 0)`,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: '#fff',
        display: 'grid', placeItems: 'center',
        fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13.5, color,
      }}>
        {pct}%
      </div>
    </div>
  );
};

const JobResults = () => {
  const [jobs, setJobs] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [resume, setResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);
  const [activeModeFilters, setActiveModeFilters] = useState([]);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorType(null);
        try {
          const prefsRes = await client.get('/api/preferences');
          setPreferences(prefsRes.data);
          // Pre-select all modes from preferences as active filters
          if (prefsRes.data?.work_mode) {
            const modes = prefsRes.data.work_mode.split(',').map(m => m.trim()).filter(Boolean);
            setActiveModeFilters(modes);
          }
        } catch (e) {
          setErrorType('onboarding');
          setIsLoading(false);
          showToast('Please complete onboarding first.', 'info');
          navigate('/onboarding');
          return;
        }
        try {
          const resumeRes = await client.get('/api/resumes/');
          setResume(resumeRes.data);
        } catch (e) {}
        try {
          const jobsRes = await client.get('/api/jobs/recommendations');
          setJobs(jobsRes.data.jobs || []);
        } catch (e) {
          const detail = e.response?.data?.detail?.toLowerCase() || '';
          if (detail.includes('resume')) {
            setErrorType('resume');
            showToast('Please upload your resume first.', 'info');
            navigate('/upload');
          } else if (detail.includes('preference') || detail.includes('onboarding')) {
            setErrorType('onboarding');
            showToast('Please complete onboarding first.', 'info');
            navigate('/onboarding');
          } else {
            setErrorType('api');
            showToast('Failed to load job recommendations.', 'error');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate, showToast]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,40px)' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 12, width: 80, background: 'rgba(37,99,235,0.15)', borderRadius: 8, marginBottom: 10 }} />
          <div style={{ height: 32, width: 260, background: 'rgba(15,23,42,0.08)', borderRadius: 10 }} />
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: '0 1 300px' }}>
            <div className="card" style={{ padding: 22, height: 280 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card" style={{ padding: 22, height: 100 }}>
                <div style={{ width: '60%', height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 6, marginBottom: 10 }} />
                <div style={{ width: '40%', height: 10, background: 'rgba(15,23,42,0.04)', borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorType === 'api') {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, marginBottom: 10 }}>Couldn't load jobs</div>
          <p style={{ color: '#64748b', fontSize: 14.5, marginBottom: 24 }}>Check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '13px 28px', borderRadius: 12, border: 'none',
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >Retry</button>
        </div>
      </div>
    );
  }

  const skills = resume?.skills_keywords?.skills || [];

  // Parse saved work modes from preferences
  const prefModes = preferences?.work_mode
    ? preferences.work_mode.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  // Classify each job by work mode
  const jobMode = (job) => {
    const type = (job.job_employment_type || '').toLowerCase();
    const city = (job.job_city || job.location || '').toLowerCase();
    if (job.job_is_remote || city.includes('remote') || type.includes('remote')) return 'Remote';
    if (type.includes('hybrid') || city.includes('hybrid')) return 'Hybrid';
    return 'On-site';
  };

  // Filter jobs: if no mode filters active, show all
  const filteredJobs = activeModeFilters.length === 0
    ? jobs
    : jobs.filter(job => activeModeFilters.includes(jobMode(job)));

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,40px)' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>
          Your matches
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(26px,3.6vw,38px)', letterSpacing: '-0.02em',
        }}>
          {jobs.length > 0 ? `We found ${jobs.length} strong matches for you` : 'No matches found yet'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ flex: '0 1 300px', minWidth: 260, position: 'sticky', top: 84 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#2563eb', display: 'grid', placeItems: 'center',
                color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 14,
              }}>YOU</div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>Your profile</div>
                {preferences?.desired_role && (
                  <div style={{ fontSize: 12.5, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {preferences.desired_role}
                  </div>
                )}
              </div>
            </div>

            {/* Resume strength bar */}
            {resume && (() => {
              const ats = resume.ats_score || 0;
              const label = ats >= 70 ? 'Strong' : ats >= 40 ? 'Good' : 'Fair';
              const width = ats >= 70 ? '82%' : ats >= 40 ? '58%' : '32%';
              const color = ats >= 70 ? '#059669' : ats >= 40 ? '#2563eb' : '#d97706';
              return (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                    <span style={{ color: '#64748b' }}>Resume strength</span>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, color }}>{label}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width, borderRadius: 99, background: color === '#059669' ? '#10b981' : color }} />
                  </div>
                </div>
              );
            })()}

            {skills.length > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 16 }} />
                <div className="section-label" style={{ marginBottom: 12 }}>Skills we found</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                  {skills.slice(0, 10).map((skill, i) => (
                    <span key={i} style={{
                      padding: '6px 11px', borderRadius: 8,
                      background: 'rgba(15,23,42,0.045)', border: '1px solid rgba(15,23,42,0.08)',
                      fontSize: 12.5, color: '#475569',
                    }}>{skill}</span>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => navigate('/upload')}
              style={{
                width: '100%', padding: 11, borderRadius: 10,
                background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
                color: '#1e293b', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >Re-upload resume</button>
          </div>
        </aside>

        {/* Job list */}
        <div style={{ flex: '1 1 480px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Work-mode filter chips — only shown if preferences have modes */}
          {prefModes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
              {prefModes.map(mode => {
                const active = activeModeFilters.includes(mode);
                const modeIcon = mode === 'Remote' ? '🌐' : mode === 'Hybrid' ? '⚡' : '🏢';
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveModeFilters(prev =>
                      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
                    )}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                      border: active ? '1.5px solid #2563eb' : '1.5px solid rgba(15,23,42,0.12)',
                      background: active ? 'rgba(37,99,235,0.08)' : '#fff',
                      color: active ? '#2563eb' : '#475569',
                      fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 13.5,
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span>{modeIcon}</span> {mode}
                    {active && <span style={{ fontSize: 11, marginLeft: 2 }}>✓</span>}
                  </button>
                );
              })}
              {activeModeFilters.length > 0 && activeModeFilters.length < prefModes.length && (
                <button
                  onClick={() => setActiveModeFilters(prefModes)}
                  style={{
                    padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                    border: '1.5px solid rgba(15,23,42,0.12)', background: 'transparent',
                    color: '#94a3b8', fontFamily: "'Hanken Grotesk'", fontWeight: 500, fontSize: 13,
                  }}
                >Show all</button>
              )}
            </div>
          )}

          {filteredJobs.length === 0 && jobs.length > 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
                No jobs match this filter
              </div>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                Try selecting a different work mode above.
              </p>
              <button
                onClick={() => setActiveModeFilters(prefModes)}
                style={{
                  padding: '11px 22px', borderRadius: 10, border: 'none',
                  background: '#2563eb', color: '#fff',
                  fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >Show all modes</button>
            </div>
          ) : null}

          {jobs.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No jobs found</div>
              <p style={{ color: '#64748b', fontSize: 14.5, marginBottom: 24 }}>
                Try updating your preferences or uploading a different resume.
              </p>
              <Link to="/onboarding" style={{
                display: 'inline-flex', padding: '13px 24px', borderRadius: 12,
                background: '#2563eb', color: '#fff', textDecoration: 'none',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15,
              }}>Update Preferences</Link>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const score = job.match_score ? Math.round(job.match_score) : 0;
              const company = job.employer_name || job.company || 'Company';
              const location = cleanLocation(job.job_city || job.location);
              const jobId = job.job_hash || job.job_id;

              return (
                <Link
                  key={jobId}
                  to={`/jobs/${jobId}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="card" style={{
                    padding: 22, cursor: 'pointer',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(15,23,42,0.07)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {score > 0 && <MatchRing score={score} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                          <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, lineHeight: 1.25, color: '#1e293b' }}>
                            {job.job_title}
                          </h3>
                        </div>
                        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                          {company} · {location} {job.job_employment_type && `· ${job.job_employment_type}`}
                        </div>
                        {/* Matched skill chips from resume */}
                        {skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {skills.slice(0, 3).map((skill, si) => (
                              <span key={si} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 10px', borderRadius: 8,
                                background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.22)',
                                fontSize: 12, fontWeight: 500, color: '#059669',
                              }}>✓ {skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Right: salary + posted date */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                        {(job.job_min_salary || job.job_max_salary) && (
                          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap' }}>
                            {job.job_min_salary && `$${Math.round(job.job_min_salary / 1000)}k`}
                            {job.job_min_salary && job.job_max_salary && '–'}
                            {job.job_max_salary && `$${Math.round(job.job_max_salary / 1000)}k`}
                          </span>
                        )}
                        {job.job_posted_at_datetime_utc && (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>
                            {(() => {
                              const days = Math.floor((Date.now() - new Date(job.job_posted_at_datetime_utc)) / 86400000);
                              return days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default JobResults;
