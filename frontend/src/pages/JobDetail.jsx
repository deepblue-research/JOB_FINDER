import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import useJobStore from '../store/jobStore';
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

const JobDetail = () => {
  const params = useParams();
  const navigate = useNavigate();
  const jobHash = params.job_hash || params.job_id;

  const skillGaps = useJobStore((state) => state.skillGaps);
  const setSkillGap = useJobStore((state) => state.setSkillGap);
  const showToast = useToastStore((state) => state.showToast);

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);
  const [analysisState, setAnalysisState] = useState('initial');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [applied, setApplied] = useState(false);

  const loadingTexts = [
    'Reading your resume…',
    'Analysing job requirements…',
    'Finding your skill gaps…',
    'Generating course recommendations…',
  ];

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setJobLoading(true);
        const res = await client.get(`/api/jobs/details/${jobHash}`);
        setJob(res.data);
      } catch (err) {
        setJobError("Couldn't load job details.");
        showToast('Failed to load job details.', 'error');
      } finally {
        setJobLoading(false);
      }
    };
    if (jobHash) fetchJob();
  }, [jobHash, showToast]);

  useEffect(() => {
    if (jobHash && skillGaps[jobHash]) {
      setAnalysisState('result');
      setAnalysisResult(skillGaps[jobHash]);
    }
  }, [jobHash, skillGaps]);

  useEffect(() => {
    let interval;
    if (analysisState === 'loading') {
      interval = setInterval(() => setLoadingTextIndex((p) => (p + 1) % loadingTexts.length), 2000);
    }
    return () => clearInterval(interval);
  }, [analysisState, loadingTexts.length]);

  const handleAnalyse = async () => {
    if (!job) return;
    try {
      setAnalysisState('loading');
      setLoadingTextIndex(0);
      const res = await client.post('/api/skill-gap/analyze', {
        job_hash: jobHash,
        job_description: job?.job_description || job?.description || '',
      });
      setAnalysisResult(res.data);
      setSkillGap(jobHash, res.data);
      setAnalysisState('result');
    } catch (err) {
      setAnalysisState('error');
      showToast('Error generating skill gap analysis.', 'error');
    }
  };

  const handleFeedback = async (rating) => {
    try {
      await client.post('/api/feedback', null, { params: { job_id: jobHash, rating } });
      setFeedbackGiven(true);
      setTimeout(() => setFeedbackGiven(false), 3000);
    } catch (err) {
      showToast('Error submitting feedback.', 'error');
    }
  };

  if (jobLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '4px solid rgba(15,23,42,0.08)', borderTopColor: '#2563eb',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading job details…</p>
      </div>
    );
  }

  if (jobError) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 22, marginBottom: 10 }}>Error</h2>
          <p style={{ color: '#64748b', fontSize: 14.5, marginBottom: 24 }}>{jobError}</p>
          <Link to="/jobs" style={{
            display: 'inline-flex', padding: '13px 24px', borderRadius: 12,
            background: '#2563eb', color: '#fff', textDecoration: 'none',
            fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15,
          }}>← Back to Jobs</Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  // Applied confirmation screen
  if (applied) {
    return (
      <div className="animate-fadeUp" style={{
        maxWidth: 560, margin: '0 auto',
        padding: 'clamp(50px,8vw,96px) clamp(20px,5vw,40px)',
        textAlign: 'center',
      }}>
        <div className="animate-pop" style={{
          width: 84, height: 84, margin: '0 auto 26px',
          borderRadius: '50%',
          background: 'rgba(5,150,105,0.12)',
          border: '1px solid rgba(5,150,105,0.3)',
          display: 'grid', placeItems: 'center',
          fontSize: 38, color: '#059669',
        }}>✓</div>

        <h1 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(26px,3.6vw,34px)', letterSpacing: '-0.02em', marginBottom: 12,
        }}>Application sent!</h1>
        <p style={{ color: '#475569', fontSize: 16.5, lineHeight: 1.55, marginBottom: 32 }}>
          Your resume is on its way to{' '}
          <strong style={{ color: '#1e293b' }}>{job.employer_name || job.company}</strong> for the{' '}
          <strong style={{ color: '#1e293b' }}>{job.job_title}</strong> role.
        </p>

        <div className="card" style={{ padding: 22, textAlign: 'left', marginBottom: 28 }}>
          <div className="section-label" style={{ marginBottom: 14 }}>What happens next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {[
              "You'll get a confirmation email within a few minutes.",
              'Most teams here respond to new grads within 5 business days.',
              "We'll keep surfacing similar roles while you wait.",
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ color: '#2563eb', fontSize: 16, flexShrink: 0 }}>›</span>
                <span style={{ color: '#475569', fontSize: 14.5, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/jobs" style={{
            padding: '14px 24px', borderRadius: 12, border: 'none',
            background: '#2563eb', color: '#fff', textDecoration: 'none',
            fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15,
          }}>Back to my matches</Link>
          <Link to="/jobs" style={{
            padding: '14px 24px', borderRadius: 12,
            background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
            color: '#1e293b', textDecoration: 'none',
            fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
          }}>Done</Link>
        </div>
      </div>
    );
  }

  const score = job.match_score ? Math.round(job.match_score) : 0;
  const matchColor = getMatchColor(score);
  const location = cleanLocation([job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '));

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(20px,5vw,40px)' }}>
      {/* Back */}
      <Link
        to="/jobs"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', color: '#64748b',
          fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14,
          textDecoration: 'none', marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 17 }}>←</span> Back to matches
      </Link>

      <div className="card" style={{ padding: 'clamp(22px,4vw,32px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
          {score > 0 && (
            <div style={{
              width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: `conic-gradient(${matchColor} ${score}%, rgba(15,23,42,0.08) 0)`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#fff',
                display: 'grid', placeItems: 'center',
                fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13.5, color: matchColor,
              }}>{score}%</div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{
              fontFamily: "'Space Grotesk'", fontWeight: 700,
              fontSize: 'clamp(22px,3vw,28px)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 6,
            }}>{job.job_title}</h1>
            <div style={{ fontSize: 14.5, color: '#64748b', marginBottom: 6 }}>
              {job.employer_name || job.company} · {location}
              {job.job_employment_type && ` · ${job.job_employment_type}`}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (job.job_apply_link) window.open(job.job_apply_link, '_blank', 'noopener,noreferrer');
              setApplied(true);
            }}
            disabled={!job.job_apply_link}
            style={{
              flex: 1, minWidth: 180, padding: '15px 24px', border: 'none', borderRadius: 12,
              background: job.job_apply_link ? '#2563eb' : '#e2e8f0',
              color: job.job_apply_link ? '#fff' : '#94a3b8',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16,
              cursor: job.job_apply_link ? 'pointer' : 'not-allowed',
            }}
          >
            Apply Now →
          </button>
          <button
            onClick={handleAnalyse}
            disabled={analysisState === 'loading'}
            style={{
              padding: '15px 24px', borderRadius: 12,
              background: 'transparent', border: '1.5px solid #2563eb',
              color: '#2563eb', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
              cursor: analysisState === 'loading' ? 'default' : 'pointer',
              opacity: analysisState === 'loading' ? 0.5 : 1,
            }}
          >
            Skill Gap
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('jm_token');
                const resumeRes = await fetch('http://localhost:8000/api/resumes/', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const resumeData = await resumeRes.json();
                navigate('/jd-tailor', {
                  state: {
                    jobDescription: job?.job_description || job?.description || '',
                    rawText: resumeData.raw_text || ''
                  }
                });
              } catch (e) {
                navigate('/jd-tailor', {
                  state: {
                    jobDescription: job?.job_description || job?.description || '',
                    rawText: ''
                  }
                });
              }
            }}
            style={{
              padding: '15px 24px', borderRadius: 12,
              background: 'transparent', border: '1.5px solid #059669',
              color: '#059669', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Tweak resume to match JD
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 24 }} />

        {/* Skill gap panel */}
        {analysisState === 'initial' && (
          <div style={{
            background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: 14, padding: 24, marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Skill Gap Analysis</div>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18 }}>
              Find exactly what skills you're missing and get course recommendations to bridge the gap.
            </p>
            <button
              onClick={handleAnalyse}
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
              }}
            >Analyse My Gaps</button>
          </div>
        )}

        {analysisState === 'loading' && (
          <div style={{
            padding: '32px 24px', textAlign: 'center', marginBottom: 24,
            background: 'rgba(15,23,42,0.02)', borderRadius: 14,
          }}>
            <div style={{
              width: 44, height: 44, margin: '0 auto 16px',
              borderRadius: '50%', border: '4px solid rgba(15,23,42,0.08)',
              borderTopColor: '#2563eb', animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>{loadingTexts[loadingTextIndex]}</p>
          </div>
        )}

        {analysisState === 'error' && (
          <div style={{
            padding: 24, textAlign: 'center', marginBottom: 24,
            background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)',
            borderRadius: 14,
          }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analysis failed</div>
            <button onClick={handleAnalyse} style={{
              padding: '12px 24px', borderRadius: 12, border: 'none',
              background: '#dc2626', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Try Again</button>
          </div>
        )}

        {analysisState === 'result' && analysisResult && (() => {
          const fitScore = analysisResult.fit_score || 0;
          const fitColor = fitScore > 70 ? '#059669' : fitScore >= 40 ? '#d97706' : '#dc2626';
          const fitLabel = fitScore > 70 ? 'Strong match' : fitScore >= 40 ? 'Good potential' : 'Skill gap';

          return (
            <div style={{
              background: 'rgba(15,23,42,0.02)', border: '1px solid rgba(15,23,42,0.07)',
              borderRadius: 14, padding: 24, marginBottom: 24,
            }}>
              <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
                <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 48, color: fitColor }}>{fitScore}%</span>
                <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 14, fontWeight: 500 }}>fit</span>
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    display: 'inline-block', padding: '5px 14px', borderRadius: 99,
                    background: `${fitColor}15`, border: `1px solid ${fitColor}40`,
                    fontSize: 12.5, fontWeight: 600, color: fitColor,
                  }}>{fitLabel}</span>
                </div>
              </div>

              {analysisResult.present_skills?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>You already have</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {analysisResult.present_skills.map((skill, i) => (
                      <span key={i} className="skill-tag">✓ {skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.missing_skills?.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>Skills to learn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analysisResult.missing_skills.map((gap, i) => (
                      <div key={i} style={{
                        border: '1px solid rgba(15,23,42,0.07)', borderRadius: 12, padding: 14,
                        background: '#fff',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{gap.skill}</span>
                          {gap.importance && (
                            <span style={{
                              fontSize: 11.5, background: 'rgba(15,23,42,0.05)',
                              border: '1px solid rgba(15,23,42,0.1)', color: '#64748b',
                              padding: '3px 9px', borderRadius: 6, fontWeight: 500,
                            }}>{gap.importance}</span>
                          )}
                        </div>
                        {gap.why_needed && (
                          <p style={{ fontSize: 12.5, color: '#64748b', fontStyle: 'italic', marginBottom: 10 }}>{gap.why_needed}</p>
                        )}
                        {gap.course_recommendations?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {gap.course_recommendations.map((course, ci) => (
                              <a
                                key={ci}
                                href={course.url || `https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 12px', borderRadius: 9,
                                  background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                                  textDecoration: 'none', transition: 'background 0.1s',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>{course.platform || 'Course'}</div>
                                  <div style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600 }}>{course.title || 'Recommended Course'}</div>
                                </div>
                                <span style={{ color: '#94a3b8', fontSize: 14 }}>↗</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <a
                            href={`https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 9,
                              background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                              textDecoration: 'none',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Coursera</div>
                              <div style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600 }}>Search courses on {gap.skill}</div>
                            </div>
                            <span style={{ color: '#94a3b8' }}>↗</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
                  borderRadius: 12, padding: 18, textAlign: 'center', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: '#059669', marginBottom: 4 }}>
                    You meet all requirements!
                  </div>
                  <p style={{ color: '#047857', fontSize: 13 }}>Your resume is a great match for this role.</p>
                </div>
              )}

              <div style={{ paddingTop: 16, borderTop: '1px solid rgba(15,23,42,0.07)', textAlign: 'center' }}>
                <p style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 500, marginBottom: 10 }}>Was this helpful?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  {[['👎', 1], ['😐', 3], ['👍', 5]].map(([emoji, rating]) => (
                    <button key={rating} onClick={() => handleFeedback(rating)}
                      style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                      {emoji}
                    </button>
                  ))}
                </div>
                {feedbackGiven && (
                  <p style={{ color: '#059669', fontSize: 12.5, fontWeight: 500, marginTop: 6 }}>Thanks for your feedback!</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Job description */}
        <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 17, marginBottom: 12 }}>About the role</h3>
        <div
          style={{ color: '#475569', fontSize: 15, lineHeight: 1.65, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}
          dangerouslySetInnerHTML={{ __html: job?.job_description || job?.description || '' }}
        />
      </div>
    </div>
  );
};

export default JobDetail;
