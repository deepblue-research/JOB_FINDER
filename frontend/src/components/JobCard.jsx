import React from 'react';
import { Link } from 'react-router-dom';

const getMatchColor = (score) => {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#d97706';
  return '#94a3b8';
};

const JobCard = ({ job }) => {
  const {
    job_title,
    employer_name,
    job_city,
    job_country,
    job_employment_type,
    match_score,
    job_id,
  } = job;

  const score = match_score ? Math.round(match_score) : null;
  const color = score ? getMatchColor(score) : '#94a3b8';

  return (
    <div className="card" style={{
      padding: 22, cursor: 'pointer',
      transition: 'border-color 0.15s ease, transform 0.15s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(15,23,42,0.07)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
        {/* Match ring */}
        {score !== null && (
          <div style={{
            width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: `conic-gradient(${color} ${score}%, rgba(15,23,42,0.08) 0)`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#fff',
              display: 'grid', placeItems: 'center',
              fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 12, color,
            }}>{score}%</div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, lineHeight: 1.25, color: '#1e293b', marginBottom: 3 }}>
            {job_title}
          </h3>
          <div style={{ fontSize: 13.5, color: '#64748b' }}>
            {employer_name} · {job_city ? `${job_city}, ${job_country}` : 'Remote'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {job_employment_type && (
          <span style={{
            padding: '5px 10px', borderRadius: 8,
            background: 'rgba(15,23,42,0.045)', border: '1px solid rgba(15,23,42,0.08)',
            fontSize: 12.5, color: '#475569',
          }}>{job_employment_type}</span>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginBottom: 14 }} />
      <Link
        to={`/jobs/${job_id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14,
          color: '#2563eb', textDecoration: 'none',
        }}
      >
        View details →
      </Link>
    </div>
  );
};

export default JobCard;
