import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import useJobStore from '../store/jobStore';
import { useToastStore } from '../store/toastStore';

const JobDetail = () => {
  const cleanLocation = (loc) => {
    if (!loc) return 'India';
    return loc
      .split(',')
      .map(p => p.trim())
      .filter(p => p && p !== 'undefined' && p !== 'null' && p !== 'None' && p !== 'N/A')
      .join(', ') || 'India';
  };

  const params = useParams();
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

  const loadingTexts = [
    "Reading your resume...",
    "Analysing job requirements...",
    "Finding your skill gaps...",
    "Generating course recommendations..."
  ];

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setJobLoading(true);
        const res = await client.get(`/api/jobs/details/${jobHash}`);
        setJob(res.data);
      } catch (err) {
        setJobError("Couldn't load job details.");
        showToast("Failed to load job details.", "error");
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
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000);
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
        job_description: job?.job_description || job?.description || ''
      });
      setAnalysisResult(res.data);
      setSkillGap(jobHash, res.data);
      setAnalysisState('result');
    } catch (err) {
      setAnalysisState('error');
      showToast("Error generating skill gap analysis.", "error");
    }
  };

  const handleFeedback = async (rating) => {
    try {
      await client.post('/api/feedback', null, { params: { job_id: jobHash, rating } });
      setFeedbackGiven(true);
      setTimeout(() => setFeedbackGiven(false), 3000);
    } catch (err) {
      showToast("Error submitting feedback.", "error");
    }
  };

  if (jobLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading job details...</p>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="max-w-xl mx-auto px-4 md:px-8 py-12 text-center">
        <div className="bg-white border border-red-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 text-sm mb-6">{jobError}</p>
          <Link to="/jobs" className="inline-flex items-center bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:gap-8">

        {/* LEFT COLUMN */}
        <div className="md:w-3/5">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {job.employer_name || job.company}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.job_title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {cleanLocation([job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '))}
            </span>
            {job.job_employment_type && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                {job.job_employment_type}
              </span>
            )}
          </div>

          <a
            href={job.job_apply_link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors mb-8 ${
              job.job_apply_link
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            Apply Now →
          </a>

          <div
            className="text-gray-700 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2"
            dangerouslySetInnerHTML={{ __html: job?.job_description || job?.description || '' }}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:w-2/5 mt-8 md:mt-0 sticky top-20 self-start">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">

            {analysisState === 'initial' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Skill Gap Analysis</h2>
                <p className="text-gray-500 text-sm mb-6">Find out exactly what skills you're missing and get course recommendations to bridge the gap.</p>
                <button
                  onClick={handleAnalyse}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  Analyse My Gaps
                </button>
              </div>
            )}

            {analysisState === 'loading' && (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
                <p className="text-gray-500 text-sm font-medium animate-pulse">{loadingTexts[loadingTextIndex]}</p>
              </div>
            )}

            {analysisState === 'error' && (
              <div className="text-center py-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Analysis failed</h2>
                <p className="text-gray-500 text-sm mb-6">There was an error generating the analysis.</p>
                <button
                  onClick={handleAnalyse}
                  className="w-full bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {analysisState === 'result' && analysisResult && (() => {
              const score = analysisResult.fit_score || 0;
              let scoreColor = 'text-red-500';
              let scoreBanner = 'bg-red-50 border-red-200 text-red-700';
              let bannerLabel = 'Skill gap';

              if (score > 70) {
                scoreColor = 'text-green-500';
                scoreBanner = 'bg-green-50 border-green-200 text-green-700';
                bannerLabel = 'Strong match';
              } else if (score >= 40) {
                scoreColor = 'text-amber-500';
                scoreBanner = 'bg-amber-50 border-amber-200 text-amber-700';
                bannerLabel = 'Good potential';
              }

              return (
                <div>
                  <div className="text-center mb-6 pb-6 border-b border-gray-100">
                    <span className={`text-5xl font-black ${scoreColor}`}>{score}%</span>
                    <span className="text-gray-400 ml-2 text-sm font-medium">fit</span>
                    <div className="mt-2">
                      <span className={`inline-block px-4 py-1 rounded-full border text-xs font-semibold ${scoreBanner}`}>
                        {bannerLabel}
                      </span>
                    </div>
                  </div>

                  {analysisResult.present_skills?.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        You already have
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.present_skills.map((skill, idx) => (
                          <span key={idx} className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.missing_skills?.length > 0 ? (
                    <div className="mb-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Skills to learn
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.missing_skills.map((gap, idx) => (
                          <div key={idx} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{gap.skill}</span>
                              {gap.importance && (
                                <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg font-medium">
                                  {gap.importance}
                                </span>
                              )}
                            </div>
                            {gap.why_needed && (
                              <p className="text-xs text-gray-500 italic mb-3">{gap.why_needed}</p>
                            )}
                            {gap.course_recommendations?.length > 0 ? (
                              <div className="space-y-1.5 mt-2">
                                {gap.course_recommendations.map((course, cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={course.url || `https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-white border border-gray-100 p-2.5 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs text-gray-400 font-medium">{course.platform || 'Course'}</div>
                                      <div className="text-xs text-blue-600 font-semibold truncate">{course.title || 'Recommended Course'}</div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <a
                                href={`https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-white border border-gray-100 p-2.5 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors mt-2"
                              >
                                <div className="flex-1">
                                  <div className="text-xs text-gray-400 font-medium">Coursera</div>
                                  <div className="text-xs text-blue-600 font-semibold">Search courses on {gap.skill}</div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <h3 className="font-semibold text-green-800 text-sm">You meet all requirements!</h3>
                      <p className="text-green-600 text-xs mt-1">Your resume is a great match for this role.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 font-medium mb-3">Was this helpful?</p>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleFeedback(1)} className="text-xl min-h-[40px] min-w-[40px] hover:scale-110 transition-transform">👎</button>
                      <button onClick={() => handleFeedback(3)} className="text-xl min-h-[40px] min-w-[40px] hover:scale-110 transition-transform">😐</button>
                      <button onClick={() => handleFeedback(5)} className="text-xl min-h-[40px] min-w-[40px] hover:scale-110 transition-transform">👍</button>
                    </div>
                    {feedbackGiven && (
                      <p className="text-green-600 text-xs font-medium mt-2">Thanks for your feedback!</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
