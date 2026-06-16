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
    match_score,
    job_id
  } = job;

  const matchPercentage = match_score ? Math.round(match_score) : null;

  let scoreBg = 'bg-gray-100 text-gray-600';
  if (matchPercentage > 85) scoreBg = 'bg-green-100 text-green-700';
  else if (matchPercentage > 70) scoreBg = 'bg-blue-100 text-blue-700';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
            {employer_logo ? (
              <img src={employer_logo} alt={employer_name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm font-bold text-gray-400">{employer_name?.[0]}</span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{job_title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{employer_name}</p>
          </div>
        </div>
        {matchPercentage !== null && (
          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${scoreBg}`}>
            {matchPercentage}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {job_employment_type && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
            {job_employment_type}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {job_city ? `${job_city}, ${job_country}` : 'Remote'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <Link
          to={`/jobs/${job_id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View details →
        </Link>
        <button className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
          Quick Apply
        </button>
      </div>
    </div>
  );
};

export default JobCard;
