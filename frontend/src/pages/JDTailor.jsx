import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import enrichmentClient from '../api/enrichmentClient';

// ─── Step constants ───────────────────────────────────────────────────────────
const STEP_JD      = 'jd';        // user pastes job description
const STEP_LOADING = 'loading';   // waiting for Round 1
const STEP_FOLLOWUP= 'followup';  // answer follow-up questions
const STEP_ENHANCE = 'enhance';   // waiting for Round 2
const STEP_DONE    = 'done';      // final resume ready

export default function JDTailor() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedJD = location.state?.jobDescription || '';
  const passedRawText = location.state?.rawText || '';

  const [step, setStep]                   = useState(STEP_JD);
  const [jobDescription, setJobDescription] = useState(passedJD);
  const [sessionId, setSessionId]         = useState(null);
  const [loadingMsg, setLoadingMsg]       = useState('');
  const [error, setError]                 = useState(null);

  // Round 1 results
  const [jdMatchScore, setJdMatchScore]   = useState(null);
  const [skillGaps, setSkillGaps]         = useState([]);
  const [followupQs, setFollowupQs]       = useState([]);
  const [answers, setAnswers]             = useState({});

  // Round 2 results
  const [changesSummary, setChangesSummary] = useState([]);
  const [downloadUrl, setDownloadUrl]     = useState(null);
  const [draftUrl, setDraftUrl]           = useState(null);

  // ── Auto-start if a job description was passed in ──────────────────────────

  React.useEffect(() => {
    if (passedJD.trim()) {
      handleOptimize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const scoreColor = (score) => {
    if (score >= 75) return '#059669';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  // ── Step 1 → Round 1 ────────────────────────────────────────────────────────

  const handleOptimize = async () => {
    if (!jobDescription.trim()) { setError('Please paste a job description first.'); return; }
    setError(null);
    setStep(STEP_LOADING);
    setLoadingMsg('Creating your enrichment session…');

    try {
      // 1. Create session
      const sessionRes = await enrichmentClient.post('/sessions/');
      const sid = sessionRes.data.session_id;
      setSessionId(sid);

      // 2. Seed session with uploaded resume if available
      if (passedRawText.trim()) {
        setLoadingMsg('Loading your resume…');
        await enrichmentClient.post('/sessions/seed', {
          session_id: sid,
          raw_text: passedRawText,
        });
      }

      setLoadingMsg('Tailoring your resume to the job description…');
      // 2. Round 1 — rewrite + follow-up questions
      const optimizeRes = await enrichmentClient.post('/optimize/', {
        session_id: sid,
        job_description: jobDescription,
      });

      const { followup_questions, skill_gaps, jd_match_score, rewritten_download_url } = optimizeRes.data;

      setFollowupQs(followup_questions || []);
      setSkillGaps(skill_gaps || []);
      setJdMatchScore(jd_match_score ?? null);
      setDraftUrl(`http://localhost:8080${rewritten_download_url}`);

      // Pre-fill answers object with empty strings
      const initial = {};
      (followup_questions || []).forEach((q, i) => { initial[i] = ''; });
      setAnswers(initial);

      setStep(STEP_FOLLOWUP);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Is the enrichment backend running on port 8080?');
      setStep(STEP_JD);
    }
  };

  // ── Step 2 → Round 2 ────────────────────────────────────────────────────────

  const handleEnhance = async () => {
    setError(null);
    setStep(STEP_ENHANCE);
    setLoadingMsg('Incorporating your answers and generating the final resume…');

    // Convert array-indexed answers to question-keyed dict
    const followup_answers = {};
    followupQs.forEach((q, i) => {
      followup_answers[q] = answers[i] || '';
    });

    try {
      const enhanceRes = await enrichmentClient.post('/optimize/enhance', {
        session_id: sessionId,
        followup_answers,
      });

      const { download_url, changes_summary } = enhanceRes.data;
      setDownloadUrl(`http://localhost:8080${download_url}`);
      setChangesSummary(changes_summary || []);
      setStep(STEP_DONE);
    } catch (err) {
      setError(err.response?.data?.detail || 'Enhancement failed. Please try again.');
      setStep(STEP_FOLLOWUP);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────────

  const card = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid rgba(15,23,42,0.09)',
    boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
    padding: 'clamp(24px,4vw,40px)',
  };

  const btn = (variant = 'primary') => ({
    padding: '14px 28px',
    borderRadius: 12,
    border: variant === 'primary' ? 'none' : '1px solid rgba(15,23,42,0.15)',
    background: variant === 'primary' ? '#2563eb' : 'transparent',
    color: variant === 'primary' ? '#fff' : '#1e293b',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: variant === 'primary' ? '0 10px 28px -12px #2563eb' : 'none',
  });

  const label = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 8,
    display: 'block',
  };

  const wrap = {
    maxWidth: 700,
    margin: '0 auto',
    padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,40px)',
  };

  // ── Render: loading spinner ──────────────────────────────────────────────────

  if (step === STEP_LOADING || step === STEP_ENHANCE) {
    return (
      <div style={{ ...wrap, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '4px solid rgba(15,23,42,0.08)',
          borderTopColor: '#2563eb',
          animation: 'spin 0.9s linear infinite',
          margin: '0 auto 28px',
        }} />
        <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 22, marginBottom: 8 }}>
          {loadingMsg}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>This may take 15–30 seconds — Gemini is working.</p>
      </div>
    );
  }

  // ── Render: Step 1 — paste JD ───────────────────────────────────────────────

  if (step === STEP_JD) {
    return (
      <div style={wrap}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(28px,4vw,38px)', letterSpacing: '-0.02em', marginBottom: 10 }}>
            Tailor your resume
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.6 }}>
            Paste a job description and we'll rewrite your resume to match it — powered by Gemini.
          </p>
        </div>

        <div style={card}>
          <label style={label}>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={e => { setJobDescription(e.target.value); setError(null); }}
            placeholder="Paste the full job description here…"
            rows={12}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1.5px solid rgba(15,23,42,0.12)',
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: '#1e293b',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'rgba(15,23,42,0.015)',
            }}
          />

          {error && (
            <div style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 13.5, color: '#dc2626', fontWeight: 500,
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={btn('secondary')}>← Back</button>
            <button
              onClick={handleOptimize}
              disabled={!jobDescription.trim()}
              style={{ ...btn('primary'), flex: 1, minWidth: 200, opacity: jobDescription.trim() ? 1 : 0.5 }}
            >
              Tailor my resume →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Step 2 — follow-up questions ────────────────────────────────────

  if (step === STEP_FOLLOWUP) {
    return (
      <div style={wrap}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(24px,4vw,34px)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            A few more details
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.5 }}>
            Answer these questions so we can personalise the final version.
          </p>
        </div>

        {/* Match score + skill gaps */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          {jdMatchScore !== null && (
            <div style={{
              ...card, flex: '0 0 auto', textAlign: 'center',
              padding: '18px 28px',
            }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 32, color: scoreColor(jdMatchScore) }}>
                {Math.round(jdMatchScore)}%
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 4 }}>JD Match</div>
            </div>
          )}

          {skillGaps.length > 0 && (
            <div style={{ ...card, flex: 1 }}>
              <span style={label}>Skill Gaps to Address</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {skillGaps.map((gap, i) => (
                  <span key={i} style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 13,
                    background: 'rgba(220,38,38,0.08)', color: '#b91c1c',
                    border: '1px solid rgba(220,38,38,0.2)', fontWeight: 500,
                  }}>{typeof gap === 'object' ? (gap.skill || JSON.stringify(gap)) : gap}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Draft download */}
        {draftUrl && (
          <div style={{ marginBottom: 20 }}>
            <a href={draftUrl} download style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)',
              color: '#2563eb', fontWeight: 600, fontSize: 13.5, textDecoration: 'none',
            }}>
              ↓ Download draft resume (Round 1)
            </a>
          </div>
        )}

        {/* Follow-up questions */}
        <div style={card}>
          <span style={label}>Follow-up Questions</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
            {followupQs.map((q, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14.5, color: '#1e293b', marginBottom: 8 }}>
                  {i + 1}. {typeof q === 'object' ? (q.question_text || q.question || JSON.stringify(q)) : q}
                </div>
                <textarea
                  value={answers[i] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Your answer…"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1.5px solid rgba(15,23,42,0.12)',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#1e293b',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.015)',
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 13.5, color: '#dc2626', fontWeight: 500,
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={() => setStep(STEP_JD)} style={btn('secondary')}>← Change JD</button>
            <button onClick={handleEnhance} style={{ ...btn('primary'), flex: 1, minWidth: 200 }}>
              Generate final resume →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Step 3 — done ───────────────────────────────────────────────────

  if (step === STEP_DONE) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 20px', fontSize: 30,
          }}>✓</div>

          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(24px,4vw,32px)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your tailored resume is ready!
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>
            Gemini has personalised it based on the job description and your answers.
          </p>

          {changesSummary.length > 0 && (
            <div style={{
              textAlign: 'left', marginBottom: 28,
              background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)',
              borderRadius: 14, padding: '16px 20px',
            }}>
              <span style={{ ...label, color: '#059669' }}>What changed</span>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {changesSummary.map((c, i) => (
                  <li key={i} style={{ fontSize: 13.5, color: '#065f46', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#059669', flexShrink: 0 }}>✔</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {downloadUrl && (
              <a href={downloadUrl} download style={{
                ...btn('primary'),
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                ↓ Download final resume
              </a>
            )}
            <button onClick={() => navigate('/jobs')} style={btn('secondary')}>
              View job matches →
            </button>
            <button onClick={() => {
              setStep(STEP_JD);
              setJobDescription('');
              setSessionId(null);
              setFollowupQs([]);
              setAnswers({});
              setSkillGaps([]);
              setJdMatchScore(null);
              setDownloadUrl(null);
              setDraftUrl(null);
              setChangesSummary([]);
            }} style={{ ...btn('secondary'), fontSize: 13.5 }}>
              Tailor for another job
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
