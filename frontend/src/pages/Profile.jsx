import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const Profile = () => {
  const [account, setAccount] = useState(null);
  const [resume, setResume] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [accountRes, resumeRes, prefRes] = await Promise.allSettled([
          client.get('/auth/me'),
          client.get('/api/resumes/'),
          client.get('/api/preferences/')
        ]);
        if (accountRes.status === 'fulfilled') setAccount(accountRes.value.data);
        if (resumeRes.status === 'fulfilled') setResume(resumeRes.value.data);
        if (prefRes.status === 'fulfilled') setPreferences(prefRes.value.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  const initials = account?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-lg">{initials}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          {account?.email && <p className="text-gray-500 text-sm mt-0.5">{account.email}</p>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 items-stretch">

        {/* Account Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Account</h2>
          </div>

          {account ? (
            <div className="space-y-4 flex-grow">
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email</span>
                <span className="text-sm font-medium text-gray-800 break-all">{account.email || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">College</span>
                <span className="text-sm font-medium text-gray-800">{account.college || 'Not set'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Batch Year</span>
                <span className="text-sm font-medium text-gray-800">{account.batch_year || 'Not set'}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm flex-grow">Account details not found.</p>
          )}
        </div>

        {/* Resume Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">Resume</h2>
            </div>
            {resume?.ats_score !== undefined && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                resume.ats_score > 70 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {resume.ats_score}% ATS
              </span>
            )}
          </div>

          {resume ? (
            <div className="flex-grow">
              <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">Detected Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {(resume.skills_keywords?.skills || []).slice(0, 10).map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
                {(resume.skills_keywords?.skills || []).length === 0 && (
                  <span className="text-gray-400 text-sm italic">No skills detected.</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm flex-grow">No resume uploaded yet.</p>
          )}

          <div className="mt-5 pt-4 border-t border-gray-50">
            <Link
              to="/upload"
              className="block w-full text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm transition-colors"
            >
              {resume ? 'Re-upload Resume' : 'Upload Resume'}
            </Link>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Preferences</h2>
          </div>

          {preferences ? (
            <div className="space-y-4 flex-grow">
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Desired Role</span>
                <span className="text-sm font-medium text-gray-800">{preferences.desired_role || 'Not set'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Location</span>
                <span className="text-sm font-medium text-gray-800">{preferences.desired_location || 'Not set'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Work Mode</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {preferences.work_mode || 'Not set'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm flex-grow">No preferences set.</p>
          )}

          <div className="mt-5 pt-4 border-t border-gray-50">
            <Link
              to="/onboarding"
              className="block w-full text-center bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-medium py-2 rounded-xl text-sm transition-colors"
            >
              Edit Preferences
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
