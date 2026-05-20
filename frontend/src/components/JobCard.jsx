import React from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  const {
    job_title,
    employer_name,
    employer_logo,
    job_city,
    job_country,
    job_employment_type,
    match_score, // Percentage score from ranker (e.g. 85.5)
    job_id
  } = job;

  const matchPercentage = match_score ? Math.round(match_score) : null;

  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 flex-shrink-0 bg-gray-50 rounded-lg border flex items-center justify-center overflow-hidden">
            {employer_logo ? (
              <img src={employer_logo} alt={employer_name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-xl font-bold text-gray-400">{employer_name?.[0]}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{job_title}</h3>
            <p className="text-gray-600 font-medium">{employer_name}</p>
          </div>
        </div>
        {matchPercentage !== null && (
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              matchPercentage > 85 ? 'bg-green-100 text-green-700' : 
              matchPercentage > 70 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {matchPercentage}% Match
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          {job_employment_type}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
          {job_city ? `${job_city}, ${job_country}` : 'Remote'}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link 
          to={`/jobs/${job_id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-500"
        >
          View Details →
        </Link>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Quick Apply
        </button>
      </div>
    </div>
  );
};

export default JobCard;
