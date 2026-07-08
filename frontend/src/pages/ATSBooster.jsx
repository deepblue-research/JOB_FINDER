import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import enrichmentClient from '../api/enrichmentClient';

const STEP_LOADING  = 'loading';
const STEP_QUESTIONS = 'questions';
const STEP_IMPROVING = 'improving';
const STEP_DONE     = 'done';

export default function ATSBooster() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedRawText = location.state?.rawText || '';

  const [step, setStep]           = React.useState(STEP_LOADING);
  const [sessionId, setSessionId] = React.useState(null);
  const [atsResult, setAtsResult] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers]     = React.useState({});
  const [newScore, setNewScore]   = React.useState(null);
  const [downloadUrl, setDownloadUrl] = React.useState(null);
  const [error, setError]         = React.useState(null);

  React.useEffect(() => {
    startFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFlow = async () => {
    try {
      // 1. Create session
      const sessionRes = await enrichmentClient.post('/sessions/');
      const sid = sessionRes.data.session_id;
      setSessionId(sid);

      // 2. Seed with uploaded resume
      if (passedRawText.trim()) {
        await enrichmentClient.post('/sessions/seed', {
          session_id: sid,
          raw_text: passedRawText,
        });
      }

      // 3. Get ATS score + follow-up questions
      const atsRes = await enrichmentClient.get(`/ats-score/${sid}`);
      setAtsResult(atsRes.data.ats_result);
      const qs = atsRes.data.followup_questions || [];
      setQuestions(qs);
      const initial = {};
      qs.forEach((q, i) => { initial[i] = ''; });
      setAnswers(initial);
      setStep(STEP_QUESTIONS);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Is the enrichment backend running?');
      setStep(STEP_QUESTIONS);
    }
  };

  const handleImprove = async () => {
    setStep(STEP_IMPROVING);
    try {
      const l2_answers = {};
      questions.forEach((q, i) => {
        const key = typeof q === 'object' ? (q.id || q.question_text || i) : q;
        l2_answers[key] = answers[i] || '';
      });
      const res = await enrichmentClient.post('/improve', {
        session_id: sessionId,
        l2_answers,
      });
      setNewScore(res.data.new_ats_score);
      setDownloadUrl(`http://localhost:8080${res.data.download_url}`);
      setStep(STEP_DONE);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to improve resume.');
      setStep(STEP_QUESTIONS);
    }
  };

  const card = {
    background: '#fff', borderRadius: 20,
    border: '1px solid rgba(15,23,42,0.09)',
    boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
    padding: 'clamp(24px,4vw,40px)',
  };

  const btn = (variant = 'primary') => ({
    padding: '14px 28px', borderRadius: 12,
    border: variant === 'primary' ? 'none' : '1px solid rgba(15,23,42,0.15)',
    background: variant === 'primary' ? '#2563eb' : 'transparent',
    color: variant === 'primary' ? '#fff' : '#1e293b',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600, fontSize: 15, cursor: 'pointer',
  });

  const wrap = {
    maxWidth: 700, margin: '0 auto',
    padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,40px)',
  };

  const scoreColor = (s) => s >= 75 ? '#059669' : s >= 50 ? '#d97706' : '#dc2626';

  if (step === STEP_LOADING || step === STEP_IMPROVING) {
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
          {step === STEP_LOADING ? 'Analysing your resume…' : 'Improving your resume…'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>This may take 15–30 seconds.</p>
      </div>
    );
  }

  if (step === STEP_QUESTIONS) {
    return (
      <div style={wrap}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(28px,4vw,38px)', letterSpacing: '-0.02em', marginBottom: 10 }}>
            Boost your ATS score
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.6 }}>
            Answer these questions to improve your resume's ATS score.
          </p>
        </div>

        {atsResult && (
          <div style={{ ...card, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 40, color: scoreColor(atsResult.score) }}>
                {atsResult.score}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Current ATS Score</div>
            </div>
            {atsResult.weak_areas?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Weak areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {atsResult.weak_areas.map((area, i) => (
                    <span key={i} style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 12.5,
                      background: 'rgba(220,38,38,0.08)', color: '#b91c1c',
                      border: '1px solid rgba(220,38,38,0.2)', fontWeight: 500,
                    }}>{area}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 14px', borderRadius: 10,
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
            fontSize: 13.5, color: '#dc2626', fontWeight: 500,
          }}>{error}</div>
        )}

        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16, display: 'block' }}>
            Follow-up Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {questions.map((q, i) => (
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
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: '1.5px solid rgba(15,23,42,0.12)',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontSize: 14, lineHeight: 1.6, color: '#1e293b',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    background: 'rgba(15,23,42,0.015)',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={btn('secondary')}>← Back</button>
            <button onClick={handleImprove} style={{ ...btn('primary'), flex: 1, minWidth: 200 }}>
              Improve my resume →
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Resume improved!
          </h1>
          {newScore !== null && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 48, color: scoreColor(newScore) }}>{newScore}</span>
              <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 14 }}>new ATS score</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {downloadUrl && (
              <a href={downloadUrl} download style={{ ...btn('primary'), textDecoration: 'none', display: 'inline-block' }}>
                ↓ Download improved resume
              </a>
            )}
            <button onClick={() => navigate('/jobs')} style={btn('secondary')}>View job matches →</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}