import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const Profile = () => {
  const [account, setAccount] = useState(null);
  const [resume, setResume] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('analysis'); // 'analysis' or 'resume'
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

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

  useEffect(() => {
    let url = null;
    if (viewMode === 'resume' && !pdfUrl && !isPdfLoading && !pdfError) {
      const fetchPdf = async () => {
        setIsPdfLoading(true);
        setPdfError(null);
        try {
          const response = await client.get('/api/resumes/file', {
            responseType: 'blob'
          });
          url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          setPdfUrl(url);
        } catch (err) {
          console.error("Error fetching PDF:", err);
          setPdfError("Failed to load original PDF.");
        } finally {
          setIsPdfLoading(false);
        }
      };
      fetchPdf();
    }
  }, [viewMode, pdfUrl, isPdfLoading, pdfError]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center mt-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading profile...</p>
      </div>
    );
  }

  // To give the resume section more space if "Full Resume" is active,
  // we could let it span more columns, but let's keep it responsive.
  const resumeColSpan = viewMode === 'resume' ? 'md:col-span-3 lg:col-span-2' : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Your Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3 items-start">
        
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
        <div className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col ${resumeColSpan}`}>
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

          {resume && (
            <div className="flex border-b mb-6">
              <button
                onClick={() => setViewMode('analysis')}
                className={`pb-2 px-4 text-sm font-bold transition-colors relative ${
                  viewMode === 'analysis' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Analysis View
                {viewMode === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
              </button>
              <button
                onClick={() => setViewMode('resume')}
                className={`pb-2 px-4 text-sm font-bold transition-colors relative ${
                  viewMode === 'resume' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Full Resume
                {viewMode === 'resume' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
              </button>
            </div>
          )}

          {resume ? (
            <div className="flex-grow">
              {viewMode === 'analysis' ? (
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
              ) : (
                <div className="mb-4">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-96 rounded-xl border bg-gray-50"
                      title="Your Resume"
                    />
                  ) : pdfError ? (
                    <p className="text-red-500 text-sm">{pdfError}</p>
                  ) : (
                    <div className="flex justify-center items-center h-96 border rounded-xl bg-gray-50">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm flex-grow mb-4">No resume uploaded.</p>
          )}
          
          <div className="mt-auto pt-6 space-y-2">
            <Link to="/upload" className="text-center block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm">
              {resume ? 'View Full Analysis' : 'Upload Resume'}
            </Link>
            {resume && (
              <Link to="/upload" className="text-center block w-full bg-white hover:bg-gray-50 border text-gray-600 py-2 rounded-lg transition-colors text-sm font-medium">
                Update Resume
              </Link>
            )}
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
          <div className="mt-6 mt-auto">
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
