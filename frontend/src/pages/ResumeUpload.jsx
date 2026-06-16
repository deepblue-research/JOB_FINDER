import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [replacing, setReplacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await client.get('/api/resumes/');
        setExistingResume(res.data);
      } catch (e) {
        // 404 means no resume yet — show upload form
      } finally {
        setCheckingExisting(false);
      }
    };
    fetchExisting();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadStatus('processing');
      const response = await client.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(response.data);
      setExistingResume(null);
      setReplacing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload resume. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadStatus(null);
    }
  };

  // Initial loading check
  if (checkingExisting) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // After fresh upload — show results
  if (results) {
    const { ats_score, ats_tips, parsed_data } = results;
    const isGoodScore = ats_score >= 40;

    return (
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center h-20 w-20 rounded-2xl mb-4 shadow-sm ${isGoodScore ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className={`text-2xl font-black ${isGoodScore ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(ats_score)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isGoodScore ? 'Resume Analysis Complete' : 'Action Required'}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              ATS Compatibility Score: <span className="font-semibold">{Math.round(ats_score)}/100</span>
            </p>
          </div>

          {!isGoodScore && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h3 className="text-red-800 font-semibold mb-3 flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Issues to fix
              </h3>
              <ul className="space-y-2">
                {ats_tips.map((tip, i) => (
                  <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">•</span>{tip}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setResults(null); setFile(null); }}
                className="mt-5 w-full bg-red-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-red-700 transition-colors"
              >
                Re-upload improved resume
              </button>
            </div>
          )}

          {isGoodScore && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Extracted Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {parsed_data.skills?.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Find matching jobs →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Existing resume view
  if (existingResume && !replacing) {
    const skills = existingResume.skills_keywords?.skills || [];
    const atsScore = existingResume.ats_score ? Math.round(existingResume.ats_score) : null;
    const isGoodScore = atsScore >= 40;

    return (
      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Resume</h1>
              <p className="text-gray-500 text-sm mt-1">Resume on file and ready for matching</p>
            </div>
            {atsScore !== null && (
              <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl ${isGoodScore ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                <span className={`text-2xl font-black leading-none ${isGoodScore ? 'text-green-600' : 'text-amber-600'}`}>{atsScore}</span>
                <span className={`text-xs font-medium mt-0.5 ${isGoodScore ? 'text-green-500' : 'text-amber-500'}`}>ATS Score</span>
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/jobs')}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors text-center"
            >
              View Job Matches →
            </button>
            <button
              onClick={() => setReplacing(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors text-center"
            >
              Replace Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Upload form (no resume yet, or replacing)
  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
        <div className="mb-8">
          {!replacing && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Step 2 of 2</span>}
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {replacing ? 'Replace your resume' : 'Upload your resume'}
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            {replacing ? 'Upload a new PDF to replace your current resume.' : 'We\'ll analyse your skills and match you with the best jobs'}
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}>
              <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" />
              <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF up to 10MB</p>
            </div>
          </label>

          {file && (
            <div className="flex items-center justify-between p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-900 truncate max-w-[200px]">{file.name}</span>
              </div>
              <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {replacing && (
              <button
                type="button"
                onClick={() => { setReplacing(false); setFile(null); setError(null); }}
                className="sm:w-auto px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!file || isLoading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 font-medium text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Analysing resume...'}
                </span>
              ) : (
                replacing ? 'Upload & Replace' : 'Analyse my resume'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResumeUpload;
