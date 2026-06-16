import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToastStore } from '../store/toastStore';

const getCompanyGradient = (name) => {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-pink-600',
    'from-sky-500 to-blue-600',
    'from-indigo-500 to-violet-600',
    'from-green-500 to-emerald-600',
  ];
  const idx = (name?.toUpperCase().charCodeAt(0) || 65) % gradients.length;
  return gradients[idx];
};

const getMatchInfo = (score) => {
  if (score >= 80) return { label: 'Excellent', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  if (score >= 65) return { label: 'Good', bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' };
  if (score >= 45) return { label: 'Fair', bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' };
  return { label: 'Low', bar: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
};

const cleanLocation = (loc) => {
  if (!loc) return 'India';
  return loc.split(',').map(p => p.trim())
    .filter(p => p && !['undefined', 'null', 'None', 'N/A'].includes(p))
    .join(', ') || 'India';
};

const JobResults = () => {
  const [jobs, setJobs] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);
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
        } catch (e) {
          setErrorType('onboarding');
          setIsLoading(false);
          showToast('Please complete onboarding first.', 'info');
          navigate('/onboarding');
          return;
        }
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
      <div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="h-4 w-32 bg-white/20 rounded-lg animate-pulse mb-3" />
            <div className="h-8 w-48 bg-white/30 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-5 w-28 bg-gray-100 rounded-full mb-4" />
                <div className="h-14 bg-gray-100 rounded-xl mb-4" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorType === 'api') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Couldn't load jobs</h2>
          <p className="text-gray-500 text-sm mb-6">Check your connection and try again.</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">AI-Powered Matches</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Your Job Feed</h1>
              {preferences && (
                <div className="flex flex-wrap items-center gap-3 mt-2.5">
                  <span className="inline-flex items-center gap-1.5 text-blue-100 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                    {preferences.desired_role}
                  </span>
                  <span className="text-blue-400">·</span>
                  <span className="inline-flex items-center gap-1.5 text-blue-100 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {preferences.desired_location}
                  </span>
                </div>
              )}
            </div>

            {jobs.length > 0 && (
              <div className="hidden sm:flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3.5 text-center flex-shrink-0">
                <span className="text-3xl font-black text-white leading-none">{jobs.length}</span>
                <span className="text-blue-200 text-xs font-medium mt-1">jobs matched</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-gray-400 text-sm mb-6">Try updating your preferences or uploading a different resume.</p>
            <Link to="/onboarding" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">
              Update Preferences
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{jobs.length}</span> results &nbsp;·&nbsp; sorted by match score
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map((job) => {
                const score = job.match_score ? Math.round(job.match_score) : 0;
                const company = job.company || job.employer_name || 'Company';
                const gradient = getCompanyGradient(company);
                const match = getMatchInfo(score);
                const initial = company.charAt(0).toUpperCase();
                const location = cleanLocation(job.job_city || job.location);

                return (
                  <div
                    key={job.job_hash || job.job_id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Card body */}
                    <div className="p-5 flex-1">
                      {/* Company + title */}
                      <div className="flex gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center shadow-sm`}>
                          <span className="text-white text-base font-bold">{initial}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{company}</p>
                          <h3 className="text-sm font-bold text-gray-900 leading-snug mt-0.5 line-clamp-2">{job.job_title}</h3>
                        </div>
                      </div>

                      {/* Location tag */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {location}
                        </span>
                        {job.job_employment_type && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {job.job_employment_type}
                          </span>
                        )}
                      </div>

                      {/* Match score block */}
                      {score > 0 && (
                        <div className={`rounded-xl border px-3.5 py-3 ${match.bg} ${match.border}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500">Match Score</span>
                            <span className={`text-sm font-black ${match.text}`}>{score}% &nbsp;·&nbsp; {match.label}</span>
                          </div>
                          <div className="w-full bg-white/70 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${match.bar} transition-all`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Apply CTA */}
                    <div className="px-5 pb-5 pt-1">
                      {job.job_apply_link ? (
                        <a
                          href={job.job_apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                        >
                          Apply Now
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      ) : (
                        <div className="flex w-full items-center justify-center bg-gray-100 text-gray-400 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed select-none">
                          No Link Available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobResults;
