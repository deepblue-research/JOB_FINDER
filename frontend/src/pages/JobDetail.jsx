import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

const JobDetail = () => {
  const { job_id } = useParams();
  const [job, setJob] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setIsLoading(true);
        const response = await client.get(`/api/jobs/details/${job_id}`);
        setJob(response.data);
        
        // Trigger skill gap analysis once job details are fetched
        analyzeSkillGap(response.data);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [job_id]);

  const analyzeSkillGap = async (jobData) => {
    try {
      setIsAnalyzing(true);
      const response = await client.post('/api/skill-gap/analyze', {
        job_id: jobData.job_id,
        job_description: jobData.job_description
      });
      setSkillGap(response.data);
    } catch (err) {
      console.error('Skill gap analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">{error || 'Job not found'}</h2>
        <Link to="/jobs" className="text-blue-600 hover:underline mt-4 block">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/jobs" className="text-sm font-medium text-gray-500 hover:text-gray-700 mb-8 inline-block">
        ← Back to Recommended Jobs
      </Link>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                {job.employer_logo ? (
                  <img src={job.employer_logo} alt={job.employer_name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">{job.employer_name?.[0]}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.job_title}</h1>
                <p className="text-lg text-gray-600 font-medium">{job.employer_name}</p>
              </div>
            </div>
            <a 
              href={job.job_apply_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Apply on Company Site
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 mr-2">Location:</span>
              {job.job_city ? `${job.job_city}, ${job.job_country}` : 'Remote'}
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 mr-2">Type:</span>
              {job.job_employment_type}
            </div>
            <div className="flex items-center">
              <span className="font-semibold text-gray-700 mr-2">Posted:</span>
              {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-line">
              {job.job_description}
            </div>
          </div>

          <div>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 sticky top-8">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                AI Insights
              </h3>
              
              {isAnalyzing ? (
                <div className="flex items-center space-x-2 text-blue-700 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent"></div>
                  <span>Analyzing skill gaps...</span>
                </div>
              ) : skill_gap ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Matching Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skill_gap.matching_skills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {skill_gap.missing_skills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Upskilling Plan</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      {skill_gap.recommendations?.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-blue-700">Analysis not available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
