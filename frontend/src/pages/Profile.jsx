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
      <div className="max-w-4xl mx-auto p-6 text-center mt-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        
        {/* Account Card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account</h2>
          {account ? (
            <div className="space-y-4 flex-grow text-gray-700">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</span>
                <span className="font-medium text-gray-900 break-all">{account.email || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">College</span>
                <span className="font-medium text-gray-900">{account.college || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Batch Year</span>
                <span className="font-medium text-gray-900">{account.batch_year || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm flex-grow">Account details not found.</p>
          )}
        </div>

        {/* Resume Card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Resume</h2>
            {resume && resume.ats_score !== undefined && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                resume.ats_score > 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {resume.ats_score}% ATS Score
              </span>
            )}
          </div>
          {resume ? (
            <div className="flex-grow">
              <div className="mb-4">
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Detected Skills</span>
                <div className="flex flex-wrap gap-2">
                  {(resume.skills || []).slice(0, 10).map((skill, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                  {(resume.skills || []).length === 0 && (
                    <span className="text-gray-400 text-sm italic">No skills detected.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm flex-grow">No resume uploaded.</p>
          )}
          <div className="mt-6">
            <Link to="/upload" className="text-center block w-full bg-gray-50 hover:bg-gray-100 border text-gray-700 font-medium py-2 rounded-lg transition-colors">
              {resume ? 'Re-upload' : 'Upload Resume'}
            </Link>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-white rounded-xl border p-6 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
          {preferences ? (
            <div className="space-y-4 flex-grow text-gray-700">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Desired Role</span>
                <span className="font-medium text-gray-900">{preferences.desired_role || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Location</span>
                <span className="font-medium text-gray-900">{preferences.location || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Work Mode</span>
                <span className="font-medium text-gray-900">{preferences.work_mode || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm flex-grow">No preferences set.</p>
          )}
          <div className="mt-6">
            <Link to="/onboarding" className="text-center block w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium py-2 rounded-lg transition-colors">
              Edit
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
