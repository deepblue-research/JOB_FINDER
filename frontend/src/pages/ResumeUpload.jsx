import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [replacing, setReplacing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStepIndex, setParseStepIndex] = useState(0);
  const navigate = useNavigate();

  const PARSE_STEPS = [
    'Reading your resume…',
    'Extracting skills…',
    'Scoring ATS compatibility…',
    'Almost done…',
  ];

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await client.get('/api/resumes/');
        setExistingResume(res.data);
      } catch (e) {
        // 404 = no resume yet
      } finally {
        setCheckingExisting(false);
      }
    };
    fetchExisting();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file first.'); return; }
    setIsLoading(true);
    setError(null);
    setUploadStatus('parsing');
    setParseProgress(0);
    setParseStepIndex(0);

    // Animate progress bar while upload is in flight
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 8 + 3;
      if (progress >= 90) { progress = 90; clearInterval(progressInterval); }
      setParseProgress(Math.round(progress));
      setParseStepIndex(Math.min(Math.floor(progress / 25), 3));
    }, 400);

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await client.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(progressInterval);
      setParseProgress(100);
      setParseStepIndex(3);
      setTimeout(() => {
        setResults(response.data);
        setExistingResume(null);
        setReplacing(false);
        setIsLoading(false);
        setUploadStatus(null);
      }, 400);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.response?.data?.detail || 'Failed to upload resume. Please try again.');
      setIsLoading(false);
      setUploadStatus(null);
    }
  };

  if (checkingExisting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '4px solid rgba(15,23,42,0.08)',
          borderTopColor: '#2563eb',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    );
  }

  // Parsing / uploading screen
  if (uploadStatus === 'parsing') {
    return (
      <div className="animate-fadeUp" style={{
        maxWidth: 560, margin: '0 auto',
        padding: 'clamp(60px,10vw,120px) clamp(20px,5vw,40px)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 74, height: 74, margin: '0 auto 28px',
          borderRadius: '50%',
          border: '4px solid rgba(15,23,42,0.08)',
          borderTopColor: '#2563eb',
          animation: 'spin 0.9s linear infinite',
        }} />
        <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 24, marginBottom: 10 }}>
          {PARSE_STEPS[parseStepIndex]}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14.5, marginBottom: 30 }}>{file?.name}</p>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${parseProgress}%`,
            borderRadius: 99,
            background: '#2563eb',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ marginTop: 12, fontFamily: "'Space Grotesk'", fontWeight: 600, color: '#64748b', fontSize: 14 }}>
          {parseProgress}%
        </div>
      </div>
    );
  }

  // After upload — show results
  if (results) {
    const { ats_score, ats_tips, parsed_data } = results;
    const isGood = ats_score >= 40;

    return (
      <div className="animate-fadeUp" style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(20px,5vw,40px)' }}>
        <div className="card" style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="animate-pop" style={{
              width: 84, height: 84, margin: '0 auto 20px',
              borderRadius: '50%',
              background: isGood ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.1)',
              border: `1px solid ${isGood ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.25)'}`,
              display: 'grid', placeItems: 'center',
            }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 26, color: isGood ? '#059669' : '#dc2626' }}>
                {Math.round(ats_score)}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(24px,3vw,30px)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {isGood ? 'Resume Analysis Complete' : 'Action Required'}
            </h1>
            <p style={{ color: '#64748b', fontSize: 14.5 }}>ATS Compatibility Score: <strong>{Math.round(ats_score)}/100</strong></p>
          </div>

          {!isGood && ats_tips?.length > 0 && (
            <div style={{
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 14, padding: 18, marginBottom: 22,
            }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14, color: '#dc2626', marginBottom: 10 }}>Issues to fix</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ats_tips.map((tip, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, color: '#b91c1c' }}>
                    <span style={{ color: '#dc2626', flexShrink: 0 }}>›</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isGood && parsed_data?.skills?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Skills we found</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {parsed_data.skills.map((skill, i) => (
                  <span key={i} className="skill-tag">✓ {skill}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                flex: 1, minWidth: 180, padding: '15px 24px', border: 'none', borderRadius: 12,
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer',
                boxShadow: '0 14px 34px -16px #2563eb',
              }}
            >
              {isGood ? 'Find matching jobs →' : 'View jobs anyway →'}
            </button>
            {!isGood && (
              <button
                onClick={() => { setResults(null); setFile(null); }}
                style={{
                  padding: '15px 24px', borderRadius: 12,
                  background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
                  color: '#1e293b', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer',
                }}
              >
                Re-upload
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Existing resume view
  if (existingResume && !replacing) {
    const skills = existingResume.skills_keywords?.skills || [];
    const atsScore = existingResume.ats_score ? Math.round(existingResume.ats_score) : null;
    const isGood = atsScore >= 40;

    return (
      <div className="animate-fadeUp" style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(20px,5vw,40px)' }}>
        <div className="card" style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(22px,3vw,28px)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Your Resume
              </h1>
              <p style={{ color: '#64748b', fontSize: 14.5 }}>Resume on file and ready for matching</p>
            </div>
            {atsScore !== null && (
              <div style={{
                padding: '12px 18px', borderRadius: 14, textAlign: 'center',
                background: isGood ? 'rgba(5,150,105,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${isGood ? 'rgba(5,150,105,0.25)' : 'rgba(245,158,11,0.25)'}`,
              }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 24, color: isGood ? '#059669' : '#d97706' }}>
                  {atsScore}
                </div>
                <div style={{ fontSize: 12, color: isGood ? '#059669' : '#d97706', fontWeight: 600, marginTop: 2 }}>ATS Score</div>
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Detected skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="skill-tag">✓ {skill}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                flex: 1, minWidth: 180, padding: '14px 24px', border: 'none', borderRadius: 12,
                background: '#2563eb', color: '#fff',
                fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            >
              View Job Matches →
            </button>
            <button
              onClick={() => setReplacing(true)}
              style={{
                padding: '14px 24px', borderRadius: 12,
                background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
                color: '#1e293b', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            >
              Replace Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload form
  return (
    <div className="animate-fadeUp" style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,40px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-0.02em', marginBottom: 12,
        }}>Upload your resume</h1>
        <p style={{ color: '#64748b', fontSize: 16.5, lineHeight: 1.5 }}>
          We'll read it in seconds and match you to roles you can actually land.
        </p>
      </div>

      <form onSubmit={handleUpload}>
        <label style={{
          display: 'block', cursor: 'pointer',
          border: '1.5px dashed rgba(15,23,42,0.18)',
          borderRadius: 20,
          padding: 'clamp(36px,6vw,56px) 32px',
          textAlign: 'center',
          background: file ? 'rgba(37,99,235,0.04)' : 'rgba(15,23,42,0.025)',
          borderColor: file ? '#2563eb' : 'rgba(15,23,42,0.18)',
          transition: 'all 0.15s ease',
        }}>
          <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{
            width: 62, height: 62, borderRadius: '50%',
            background: 'rgba(37,99,235,0.1)', color: '#2563eb',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 20px', fontSize: 28,
          }}>↑</div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 20, marginBottom: 6 }}>
            {file ? file.name : 'Drag & drop your resume'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14.5 }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB · PDF` : 'or click to browse — PDF up to 10 MB'}
          </div>
        </label>

        {error && (
          <div style={{
            marginTop: 16, padding: '12px 14px', borderRadius: 11,
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
            fontSize: 13.5, color: '#dc2626', fontWeight: 500,
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          {replacing && (
            <button
              type="button"
              onClick={() => { setReplacing(false); setFile(null); setError(null); }}
              style={{
                padding: '14px 24px', borderRadius: 12,
                background: 'transparent', border: '1px solid rgba(15,23,42,0.12)',
                color: '#1e293b', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            >Cancel</button>
          )}
          <button
            type="submit"
            disabled={!file || isLoading}
            style={{
              flex: 1, minWidth: 180, padding: '15px 24px', border: 'none', borderRadius: 12,
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, cursor: (!file || isLoading) ? 'default' : 'pointer',
              boxShadow: '0 14px 34px -16px #2563eb',
              opacity: (!file || isLoading) ? 0.5 : 1,
            }}
          >
            {isLoading
              ? (uploadStatus === 'uploading' ? 'Uploading…' : 'Analysing resume…')
              : (replacing ? 'Upload & Replace' : 'Analyse my resume')}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24 }}>
        <span style={{ color: '#94a3b8', fontSize: 14 }}>Don't have it handy?</span>
        <button type="button" onClick={() => navigate('/build-resume')} style={{
          background: 'none', border: 'none', color: '#2563eb',
          fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14,
          cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
        }}>Make a Resume using AI</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, color: '#94a3b8', fontSize: 13 }}>
        <span style={{ color: '#059669' }}>🔒</span> Your resume is private. We never share it without your say-so.
      </div>
    </div>
  );
};

export default ResumeUpload;
