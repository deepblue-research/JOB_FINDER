import React, { useEffect, useState } from 'react';
import client from '../api/client';
import JobCard from '../components/JobCard';

const JobResults = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const response = await client.get('/api/jobs/recommendations');
        setJobs(response.data.jobs || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.response?.data?.detail || 'Failed to load job recommendations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Finding the best matches for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Recommended Jobs</h1>
        <p className="text-gray-600 mt-2">Based on your resume and career preferences</p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-lg">No matching jobs found at the moment.</p>
          <p className="text-gray-400 mt-1">Try updating your preferences or uploading a different resume.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <JobCard key={job.job_hash} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobResults;
