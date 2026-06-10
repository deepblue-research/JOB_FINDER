import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('analysis'); // 'analysis' or 'resume'
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const navigate = useNavigate();
  const { setResumeUploaded } = useAuthStore();

  useEffect(() => {
    const fetchExistingResume = async () => {
      try {
        const response = await client.get('/api/resumes/');
        if (response.data) {
          setResults({
            ats_score: response.data.ats_score,
            ats_tips: response.data.ats_tips || [],
            parsed_data: response.data.parsed_json,
            raw_text: response.data.raw_text
          });
          setResumeUploaded(true);
        }
      } catch (err) {
        console.log('No existing resume found or error fetching:', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchExistingResume();
  }, [setResumeUploaded]);

  useEffect(() => {
    let url = null;
    if (viewMode === 'resume' && !pdfUrl && !isPdfLoading) {
      const fetchPdf = async () => {
        setIsPdfLoading(true);
        setPdfError(null);
        try {
          const response = await client.get('/api/resumes/download', {
            responseType: 'blob'
          });
          url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          setPdfUrl(url);
        } catch (err) {
          console.error("Error fetching PDF:", err);
          setPdfError("Failed to load original PDF. It might be missing from the server.");
        } finally {
          setIsPdfLoading(false);
        }
      };
      fetchPdf();
    }
    
    // Only revoke when the entire component unmounts to prevent breaking the view when toggling tabs
    return () => {
      // Note: This cleanup will only run when ResumeUpload unmounts
    };
  }, [viewMode, pdfUrl, isPdfLoading]);

  // Cleanup PDF URL on component unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
      setPdfUrl(null); // Clear old PDF if re-uploading
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

      // After upload, results should be set and viewMode stays analysis
      setResults({
        ...response.data,
        raw_text: response.data.parsed_data?.raw || "" // Fallback for raw text if available
      });
      
      // Force a refresh of the PDF URL next time they click 'Full Resume'
      setPdfUrl(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload resume. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadStatus(null);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center mt-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading resume data...</p>
      </div>
    );
  }

  if (results) {
    const { ats_score, ats_tips, parsed_data } = results;
    const isGoodScore = ats_score >= 40;

    return (
      <div className="max-w-4xl mx-auto mt-10 mb-20">
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {isGoodScore ? 'Resume Analysis' : 'Action Required: Improve Your Resume'}
              </h1>
              <p className="text-gray-500 mt-2">
                Your ATS Compatibility Score: {Math.round(ats_score)}/100
              </p>
            </div>
            <div className={`inline-flex items-center justify-center h-24 w-24 rounded-full border-4 ${isGoodScore ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'}`}>
              <span className="text-3xl font-bold">{Math.round(ats_score)}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-8">
            <button
              onClick={() => setViewMode('analysis')}
              className={`pb-4 px-6 text-sm font-bold transition-colors relative ${
                viewMode === 'analysis' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Analysis View
              {viewMode === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => setViewMode('resume')}
              className={`pb-4 px-6 text-sm font-bold transition-colors relative ${
                viewMode === 'resume' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Full Resume
              {viewMode === 'resume' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          </div>

          {viewMode === 'analysis' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* Skills */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Extracted Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(parsed_data?.skills || []).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100">
                        {skill}
                      </span>
                    ))}
                    {(!parsed_data?.skills || parsed_data.skills.length === 0) && (
                      <p className="text-gray-400 italic">No skills detected.</p>
                    )}
                  </div>
                </div>

                {/* Experience */}
                {parsed_data?.experience && parsed_data.experience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Experience</h3>
                    <div className="space-y-4">
                      {parsed_data.experience.map((exp, i) => (
                        <div key={i} className="border-l-2 border-blue-100 pl-4 py-1">
                          <h4 className="font-bold text-gray-900">{exp.role || exp.title}</h4>
                          <p className="text-blue-600 font-medium">{exp.company}</p>
                          <p className="text-gray-500 text-sm">{exp.duration || exp.dates}</p>
                          {exp.description && (
                            <p className="text-gray-600 mt-2 text-sm">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsed_data?.education && parsed_data.education.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Education</h3>
                    <div className="space-y-4">
                      {parsed_data.education.map((edu, i) => (
                        <div key={i} className="border-l-2 border-green-100 pl-4 py-1">
                          <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                          <p className="text-green-600 font-medium">{edu.institution || edu.school}</p>
                          <p className="text-gray-500 text-sm">{edu.year || edu.dates}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {ats_tips && ats_tips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h3 className="text-amber-800 font-bold mb-4 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ATS Optimization Tips
                    </h3>
                    <ul className="space-y-3">
                      {ats_tips.map((tip, i) => (
                        <li key={i} className="text-amber-700 text-sm flex items-start">
                          <span className="mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/jobs')}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md shadow-blue-100"
                  >
                    Find Matching Jobs →
                  </button>
                  <button 
                    onClick={() => { setResults(null); setFile(null); }}
                    className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                  >
                    Update/Re-upload Resume
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-100 border rounded-xl p-4 md:p-8 min-h-[600px] flex flex-col">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full flex-grow rounded shadow-lg bg-white"
                    title="Resume PDF"
                  />
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p>Loading original document...</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => { setResults(null); setFile(null); setPdfUrl(null); }}
                  className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                >
                  Re-upload
                </button>
                <button 
                  onClick={() => navigate('/jobs')}
                  className="bg-blue-600 text-white px-8 py-2 rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md shadow-blue-100"
                >
                  Find Jobs →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-20 bg-white rounded-xl border shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload your resume</h1>
        <p className="text-gray-500 mt-2">We'll analyze your skills and match you with the best jobs</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">PDF up to 10MB</p>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
                {file.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing Resume...'}
            </span>
          ) : (
            'Analyze My Resume'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResumeUpload;
