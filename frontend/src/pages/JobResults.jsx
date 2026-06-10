import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToastStore } from '../store/toastStore';

const JobResults = () => {
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

  const [jobs, setJobs] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'resume', 'onboarding', 'api'
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorType(null);

        // Fetch preferences first
        let prefsRes;
        try {
          prefsRes = await client.get('/api/preferences');
          setPreferences(prefsRes.data);
        } catch (e) {
          setErrorType('onboarding');
          setIsLoading(false);
          showToast('Please complete onboarding first.', 'info');
          navigate('/onboarding');
          return;
        }

        // Fetch jobs
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
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Recommended Jobs</h1>
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 shadow-sm p-4 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-6 w-2/3 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-1/4 bg-gray-200 rounded-full mb-6"></div>
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4"></div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="min-h-[44px] w-full sm:w-1/2 bg-gray-200 rounded-lg"></div>
                <div className="min-h-[44px] w-full sm:w-1/2 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (errorType === 'api') {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 md:p-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Couldn't load jobs</h2>
          <p className="text-gray-600 mb-6">Try refreshing the page or checking your connection.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-6 py-2 min-h-[44px] rounded-lg font-medium hover:bg-red-700 transition-colors w-full sm:w-auto"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Recommended Jobs</h1>
          {preferences && (
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              {preferences.desired_role} • {preferences.location}
            </p>
          )}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto min-h-[44px] text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 md:p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No jobs found.</p>
          <p className="text-gray-400">Try updating your preferences or uploading a different resume.</p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/onboarding" className="min-h-[44px] flex items-center justify-center bg-blue-50 text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
              Update Preferences
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const matchScore = job.match_score ? Math.round(job.match_score) : 0;
            let scoreColor = 'text-red-600';
            let barColor = 'bg-red-500';
            
            if (matchScore > 70) {
              scoreColor = 'text-green-600';
              barColor = 'bg-green-500';
            } else if (matchScore >= 40) {
              scoreColor = 'text-amber-500';
              barColor = 'bg-amber-400';
            }

            return (
              <div key={job.job_hash || job.job_id} className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-gray-900">{job.company || job.employer_name}</p>
                </div>
                
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2 line-clamp-2">{job.job_title}</h3>
                
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    📍 {cleanLocation(job.job_city || job.location)}
                  </span>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs md:text-sm text-gray-500 font-medium">Match</span>
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {matchScore > 0 ? `${matchScore}%` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${matchScore}%` }}></div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/jobs/${job.job_hash || job.job_id}`}
                      className="min-h-[44px] flex items-center justify-center flex-1 text-center border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      View Skill Gap
                    </Link>
                    {job.job_apply_link ? (
                      <a
                        href={job.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] flex items-center justify-center flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Apply →
                      </a>
                    ) : (
                      <button disabled className="min-h-[44px] flex items-center justify-center flex-1 text-center bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                        Apply →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobResults;
