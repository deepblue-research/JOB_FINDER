import React, { useState, useEffect } from 'react';
import enrichmentClient from '../api/enrichmentClient';

const STEPS = {
  INTRO: 'intro',
  QUESTIONS: 'questions',
  GENERATING: 'generating',
  GENERATE_ERROR: 'generate_error',
  ATS: 'ats',
  L2_QUESTIONS: 'l2_questions',
  IMPROVING: 'improving',
  IMPROVED: 'improved',
  JD_INPUT: 'jd_input',
  OPTIMIZING: 'optimizing',
  L3_FOLLOWUP: 'l3_followup',
  ENHANCING: 'enhancing',
  FINAL: 'final',
};

export default function ResumeBuilder() {
  const [step, setStep] = useState(STEPS.INTRO);
  const [sessionId, setSessionId] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [atsResult, setAtsResult] = useState(null);
  const [l2Questions, setL2Questions] = useState([]);
  const [l2Answers, setL2Answers] = useState({});
  const [improvedScore, setImprovedScore] = useState(null);
  const [jdText, setJdText] = useState('');
  const [l3Data, setL3Data] = useState(null);
  const [l3Answers, setL3Answers] = useState({});
  const [finalData, setFinalData] = useState(null);
  const [error, setError] = useState(null);
  const [otherInputs, setOtherInputs] = useState({});

  const currentSection = sections[sectionIndex];

  async function startSession() {
    setError(null);
    try {
      const [sessionRes, questionsRes] = await Promise.all([
        enrichmentClient.post('/sessions'),
        enrichmentClient.get('/questions'),
      ]);
      setSessionId(sessionRes.data.session_id);
      setSections(questionsRes.data);
      setSectionIndex(0);
      setAnswers({});
      setStep(STEPS.QUESTIONS);
    } catch (e) {
      setError('Failed to start session. Is the enrichment service running?');
    }
  }

  function handleAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleMultiSelect(questionId, option) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
  }

  function nextSection() {
    if (sectionIndex < sections.length - 1) {
      setSectionIndex((i) => i + 1);
    } else {
      generateResume();
    }
  }

  function prevSection() {
    if (sectionIndex > 0) setSectionIndex((i) => i - 1);
  }

  async function generateResume() {
    setStep(STEPS.GENERATING);
    setError(null);
    try {
      await enrichmentClient.post('/generate', { session_id: sessionId, answers });
      const atsRes = await enrichmentClient.get(`/ats-score/${sessionId}`);
      setAtsResult(atsRes.data.ats_result);
      setL2Questions(atsRes.data.followup_questions || []);
      setStep(STEPS.ATS);
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      const isRateLimit = detail.includes('429') || detail.toLowerCase().includes('too many requests') || detail.toLowerCase().includes('quota');
      setError(isRateLimit
        ? 'The AI is temporarily busy (rate limit). Please wait a few seconds and try again.'
        : detail || 'Failed to generate resume. Please try again.');
      setStep(STEPS.GENERATE_ERROR);
    }
  }

  async function improveResume() {
    setStep(STEPS.IMPROVING);
    setError(null);
    try {
      const res = await enrichmentClient.post('/improve', {
        session_id: sessionId,
        l2_answers: l2Answers,
      });
      setImprovedScore({ score: res.data.new_ats_score, label: res.data.new_ats_label });
      setStep(STEPS.IMPROVED);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to improve resume.');
      setStep(STEPS.L2_QUESTIONS);
    }
  }

  async function optimizeResume() {
    setStep(STEPS.OPTIMIZING);
    setError(null);
    try {
      const res = await enrichmentClient.post('/optimize', {
        session_id: sessionId,
        job_description: jdText,
      });
      setL3Data(res.data);
      setL3Answers({});
      setStep(STEPS.L3_FOLLOWUP);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to optimize resume.');
      setStep(STEPS.JD_INPUT);
    }
  }

  async function enhanceResume() {
    setStep(STEPS.ENHANCING);
    setError(null);
    try {
      const res = await enrichmentClient.post('/optimize/enhance', {
        session_id: sessionId,
        followup_answers: l3Answers,
      });
      setFinalData(res.data);
      setStep(STEPS.FINAL);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to finalize resume.');
      setStep(STEPS.L3_FOLLOWUP);
    }
  }

  function downloadUrl(path) {
    return `http://localhost:8080${path}`;
  }

  // ── Render helpers ──────────────────────────────────────────────

  if (step === STEPS.INTRO) {
    return (
      <div className="max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI Resume Builder</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Answer a few questions and our AI will build a professional resume for you, score it for ATS compatibility, and tailor it to any job.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
            {[
              { label: 'L1', desc: 'Build your resume' },
              { label: 'L2', desc: 'Improve weak areas' },
              { label: 'L3', desc: 'Tailor to a job' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-blue-600 font-bold text-lg">{s.label}</div>
                <div className="text-gray-500">{s.desc}</div>
              </div>
            ))}
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            onClick={startSession}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Building
          </button>
        </div>
      </div>
    );
  }

  if (step === STEPS.QUESTIONS && currentSection) {
    const progress = Math.round(((sectionIndex + 1) / sections.length) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{currentSection.section_name}</span>
            <span>{sectionIndex + 1} / {sections.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{currentSection.section_name}</h2>
          <div className="space-y-6">
            {currentSection.questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {q.question_text}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {q.hint && <p className="text-xs text-gray-400 mb-2">{q.hint}</p>}

                {q.input_type === 'text' && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {q.input_type === 'textarea' && (
                  <textarea
                    rows={4}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}

                {q.input_type === 'mcq' && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswer(q.id, opt)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          answers[q.id] === opt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {(q.input_type === 'multi-select' || q.input_type === 'checkbox') && q.options && (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const selected = (answers[q.id] || []).includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleMultiSelect(q.id, opt)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {(answers[q.id] || []).some((o) => o === 'Other' || o.startsWith('Other:')) && (
                      <input
                        type="text"
                        placeholder="Please specify…"
                        value={otherInputs[q.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOtherInputs((prev) => ({ ...prev, [q.id]: val }));
                          setAnswers((prev) => {
                            const current = (prev[q.id] || []).filter((o) => o !== 'Other' && !o.startsWith('Other:'));
                            return { ...prev, [q.id]: [...current, val ? `Other: ${val}` : 'Other'] };
                          });
                        }}
                        className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={prevSection}
              disabled={sectionIndex === 0}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextSection}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {sectionIndex === sections.length - 1 ? 'Generate Resume' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.GENERATE_ERROR) {
    return (
      <div className="max-w-md mx-auto mt-32 text-center px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-500 mb-6 text-3xl">
            ⚠
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Generation failed</h2>
          <p className="text-gray-500 text-sm mb-8">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={generateResume}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => { setStep(STEPS.QUESTIONS); setError(null); }}
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Go back to questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.GENERATING || step === STEPS.IMPROVING || step === STEPS.OPTIMIZING || step === STEPS.ENHANCING) {
    const messages = {
      [STEPS.GENERATING]: 'Generating your resume with AI...',
      [STEPS.IMPROVING]: 'Improving your resume...',
      [STEPS.OPTIMIZING]: 'Tailoring resume to job description...',
      [STEPS.ENHANCING]: 'Finalizing your tailored resume...',
    };
    return (
      <div className="max-w-md mx-auto mt-32 text-center px-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700">{messages[step]}</p>
        <p className="text-sm text-gray-400 mt-2">This may take 15–30 seconds</p>
      </div>
    );
  }

  if (step === STEPS.ATS && atsResult) {
    const score = atsResult.total_score;
    const color = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
    const colorMap = {
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
    };
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-4 ${colorMap[color]}`}>
              <span className="text-2xl font-bold">{score}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">ATS Score: {score}/100</h2>
            <p className="text-gray-500 mt-1">{atsResult.label}</p>
          </div>

          <a
            href={downloadUrl(`/generate/download/${sessionId}`)}
            className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors mb-6"
          >
            Download L1 Resume (.docx)
          </a>

          {atsResult.weak_areas?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Areas to improve</h3>
              <ul className="space-y-1">
                {atsResult.weak_areas.map((area, i) => (
                  <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                    <span className="mt-0.5">•</span>{area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {l2Questions.length > 0 && (
            <button
              onClick={() => setStep(STEPS.L2_QUESTIONS)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Improve Resume (L2) →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === STEPS.L2_QUESTIONS) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Fill in the gaps</h2>
          <p className="text-gray-500 text-sm mb-6">These questions target your resume's weak areas.</p>

          <div className="space-y-6">
            {l2Questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{q.question_text}</label>
                {q.why && <p className="text-xs text-blue-500 mb-2">{q.why}</p>}
                {q.input_type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={l2Answers[q.id] || ''}
                    onChange={(e) => setL2Answers((p) => ({ ...p, [q.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={l2Answers[q.id] || ''}
                    onChange={(e) => setL2Answers((p) => ({ ...p, [q.id]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStep(STEPS.ATS)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={improveResume}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Improve Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.IMPROVED) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Resume Improved!</h2>
          {improvedScore && (
            <p className="text-gray-500 mb-6">New ATS Score: <span className="font-bold text-green-600">{improvedScore.score}/100</span> — {improvedScore.label}</p>
          )}

          <a
            href={downloadUrl(`/improve/download/${sessionId}`)}
            className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors mb-4"
          >
            Download Improved Resume (.docx)
          </a>

          <button
            onClick={() => setStep(STEPS.JD_INPUT)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Tailor to a Job (L3) →
          </button>
        </div>
      </div>
    );
  }

  if (step === STEPS.JD_INPUT) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Paste a Job Description</h2>
          <p className="text-gray-500 text-sm mb-6">We'll rewrite your resume to match this job's keywords and requirements.</p>

          <textarea
            rows={10}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(STEPS.IMPROVED)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={optimizeResume}
              disabled={!jdText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Optimize Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.L3_FOLLOWUP && l3Data) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Round 1 Complete</h2>
              <p className="text-gray-500 text-sm mt-1">JD Match Score: <span className="font-bold text-blue-600">{l3Data.jd_match_score}/100</span></p>
            </div>
            <a
              href={downloadUrl(`/optimize/download/${sessionId}`)}
              className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Download Draft
            </a>
          </div>

          {l3Data.skill_gaps?.length > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Skill Gaps</h3>
              <div className="space-y-2">
                {l3Data.skill_gaps.map((gap, i) => (
                  <div key={i}>
                    <span className="text-sm font-medium text-amber-900">{gap.skill}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {gap.resources?.map((r, j) => (
                        <a key={j} href={r} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">{r}</a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {l3Data.followup_questions?.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-700 mb-4">Answer these to finalize your resume</h3>
              <div className="space-y-5">
                {l3Data.followup_questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{q.question_text}</label>
                    {q.why && <p className="text-xs text-blue-500 mb-2">{q.why}</p>}
                    {q.input_type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={l3Answers[q.id] || ''}
                        onChange={(e) => setL3Answers((p) => ({ ...p, [q.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={l3Answers[q.id] || ''}
                        onChange={(e) => setL3Answers((p) => ({ ...p, [q.id]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStep(STEPS.JD_INPUT)}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={enhanceResume}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Finalize Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.FINAL && finalData) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Resume is Ready!</h2>
            <p className="text-gray-500 mt-1 text-sm">Tailored and optimized for the job description.</p>
          </div>

          <a
            href={downloadUrl(`/optimize/download-final/${sessionId}`)}
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            Download Final Resume (.docx)
          </a>

          {finalData.changes_summary?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">What changed</h3>
              <ul className="space-y-1">
                {finalData.changes_summary.map((c, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setStep(STEPS.INTRO);
              setSessionId(null);
              setAnswers({});
              setAtsResult(null);
              setL2Questions([]);
              setL2Answers({});
              setImprovedScore(null);
              setJdText('');
              setL3Data(null);
              setL3Answers({});
              setFinalData(null);
            }}
            className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Build Another Resume
          </button>
        </div>
      </div>
    );
  }

  return null;
}
