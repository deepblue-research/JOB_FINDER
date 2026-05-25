import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import useJobStore from '../store/jobStore';
import { useToastStore } from '../store/toastStore';

const JobDetail = () => {
  const cleanLocation = (loc) => {
    if (!loc) return 'India'
    return loc
        .split(',')
        .map(p => p.trim())
        .filter(p => 
            p && 
            p !== 'undefined' && 
            p !== 'null' && 
            p !== 'None' && 
            p !== 'N/A' &&
            p !== 'undefined'
        )
        .join(', ') || 'India'
  }

  const params = useParams();
  const jobHash = params.job_hash || params.job_id;
  
  const skillGaps = useJobStore((state) => state.skillGaps);
  const setSkillGap = useJobStore((state) => state.setSkillGap);
  const showToast = useToastStore((state) => state.showToast);

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [analysisState, setAnalysisState] = useState('initial'); // 'initial', 'loading', 'result', 'error'
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingTexts = [
    "Reading your resume...",
    "Analysing job requirements...",
    "Finding your skill gaps...",
    "Generating course recommendations..."
  ];

  const [feedbackGiven, setFeedbackGiven] = useState(false);

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
    if (jobHash) {
      fetchJob();
    }
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
      console.error('Analysis error:', err);
      setAnalysisState('error');
      showToast("Error generating skill gap analysis.", "error");
    }
  };

  const handleFeedback = async (rating) => {
    try {
      await client.post('/api/feedback', null, {
        params: { job_id: jobHash, rating }
      });
      setFeedbackGiven(true);
      setTimeout(() => setFeedbackGiven(false), 3000);
    } catch (err) {
      console.error('Feedback failed', err);
      showToast("Error submitting feedback.", "error");
    }
  };

  if (jobLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading job details...</p>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="max-w-xl mx-auto px-4 md:px-8 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{jobError}</p>
          <Link to="/jobs" className="bg-blue-600 text-white px-6 py-2 min-h-[44px] flex items-center justify-center rounded-lg font-medium hover:bg-blue-700">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:gap-6">
        
        {/* LEFT COLUMN */}
        <div className="md:w-3/5">
          <Link to="/jobs" className="text-blue-600 hover:text-blue-500 font-medium mb-4 inline-flex items-center min-h-[44px]">
            &larr; Back to Jobs
          </Link>
          <div className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
            {job.employer_name || job.company}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.job_title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              📍 {cleanLocation([job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '))}
            </span>
            {job.job_employment_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {job.job_employment_type}
              </span>
            )}
          </div>

          <a 
            href={job.job_apply_link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-lg font-medium transition-colors mb-8 ${job.job_apply_link ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'}`}
          >
            Apply Now &rarr;
          </a>

          <div 
            className="text-gray-700 leading-relaxed max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: job?.job_description || job?.description || '' }}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:w-2/5 mt-8 md:mt-0 sticky top-4 self-start">
          <div className="bg-white border rounded-xl shadow-sm p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
            
            {analysisState === 'initial' && (
              <div className="text-center py-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Gap Analysis</h2>
                <p className="text-gray-600 mb-6 text-sm">Find out exactly what skills you're missing for this role and get personalized course recommendations to bridge the gap.</p>
                <button 
                  onClick={handleAnalyse}
                  className="bg-blue-600 text-white px-6 py-3 min-h-[44px] rounded-lg font-medium hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
                >
                  Analyse My Gaps
                </button>
              </div>
            )}

            {analysisState === 'loading' && (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600 font-medium animate-pulse">{loadingTexts[loadingTextIndex]}</p>
              </div>
            )}

            {analysisState === 'error' && (
              <div className="text-center py-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Couldn't analyse</h2>
                <p className="text-gray-600 mb-6 text-sm">There was an error generating the skill gap analysis.</p>
                <button 
                  onClick={handleAnalyse}
                  className="bg-red-600 text-white px-6 py-2 min-h-[44px] rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center w-full"
                >
                  Try Again
                </button>
              </div>
            )}

            {analysisState === 'result' && analysisResult && (
              <div>
                {/* Score Banner */}
                {(() => {
                  const score = analysisResult.fit_score || 0;
                  let colorClass = 'text-red-500';
                  let bannerClass = 'bg-red-50 border-red-200 text-red-700';
                  let bannerText = 'Skill gap';
                  
                  if (score > 70) {
                    colorClass = 'text-green-500';
                    bannerClass = 'bg-green-50 border-green-200 text-green-700';
                    bannerText = 'Strong match';
                  } else if (score >= 40) {
                    colorClass = 'text-amber-500';
                    bannerClass = 'bg-amber-50 border-amber-200 text-amber-700';
                    bannerText = 'Good potential';
                  }

                  return (
                    <div className="text-center mb-6">
                      <div className="mb-2">
                        <span className={`text-5xl font-black ${colorClass}`}>{score}%</span>
                        <span className="text-gray-500 ml-2 font-medium">Fit</span>
                      </div>
                      <div className={`inline-block px-4 py-1 rounded-full border text-sm font-semibold ${bannerClass}`}>
                        {bannerText}
                      </div>
                    </div>
                  );
                })()}

                {/* You already have */}
                {analysisResult.present_skills && analysisResult.present_skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">✅ You already have</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.present_skills.map((skill, idx) => (
                        <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* You are missing */}
                {analysisResult.missing_skills && analysisResult.missing_skills.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">❌ You are missing</h3>
                    <div className="space-y-4">
                      {analysisResult.missing_skills.map((gap, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-900">{gap.skill}</span>
                            {gap.importance && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {gap.importance}
                              </span>
                            )}
                          </div>
                          {gap.why_needed && (
                            <p className="text-sm text-gray-600 italic mb-3">{gap.why_needed}</p>
                          )}
                          {gap.course_recommendations && gap.course_recommendations.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {gap.course_recommendations.map((course, cIdx) => (
                                <a 
                                  key={cIdx} 
                                  href={course.url || `https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block bg-white border border-blue-100 p-2 min-h-[44px] rounded hover:border-blue-300 transition-colors"
                                >
                                  <div className="text-xs text-gray-500 font-medium">{course.platform || 'Course'}</div>
                                  <div className="text-sm text-blue-600 font-semibold">{course.title || 'Recommended Course'}</div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2">
                              <a 
                                href={`https://www.coursera.org/search?query=${encodeURIComponent(gap.skill)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white border border-blue-100 p-2 min-h-[44px] rounded hover:border-blue-300 transition-colors"
                              >
                                <div className="text-xs text-gray-500 font-medium">Coursera</div>
                                <div className="text-sm text-blue-600 font-semibold">Search for courses on {gap.skill}</div>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <span className="text-2xl mb-2 block">🎉</span>
                    <h3 className="font-bold text-green-800">You meet all requirements!</h3>
                    <p className="text-green-600 text-sm mt-1">Your resume is a perfect match for this role.</p>
                  </div>
                )}

                {/* Feedback */}
                <div className="mt-8 border-t pt-4 text-center">
                  <p className="text-sm text-gray-600 font-medium mb-3">Was this helpful?</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => handleFeedback(1)} className="text-2xl min-h-[44px] min-w-[44px] hover:scale-110 transition-transform">👎</button>
                    <button onClick={() => handleFeedback(3)} className="text-2xl min-h-[44px] min-w-[44px] hover:scale-110 transition-transform">😐</button>
                    <button onClick={() => handleFeedback(5)} className="text-2xl min-h-[44px] min-w-[44px] hover:scale-110 transition-transform">👍</button>
                  </div>
                  {feedbackGiven && (
                    <p className="text-green-600 text-sm font-medium mt-2 animate-pulse">Thanks for your feedback!</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
