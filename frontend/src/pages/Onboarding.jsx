import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const Onboarding = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      experience_level: 'fresher'
    }
  });

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const selectedMode = watch('work_mode');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await client.post('/api/preferences', data);
      navigate('/upload');
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const workModes = [
    { value: 'Remote', icon: '🌐', label: 'Remote' },
    { value: 'On-site', icon: '🏢', label: 'On-site' },
    { value: 'Hybrid', icon: '⚡', label: 'Hybrid' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8">
        <div className="mb-8">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Step 1 of 2</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">What are you looking for?</h1>
          <p className="text-gray-500 mt-1.5 text-sm">We'll find the right jobs for you</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Desired role</label>
            <input
              type="text"
              {...register('desired_role', { required: 'Desired role is required' })}
              placeholder="e.g. Data Analyst, Software Engineer"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">Be specific — used to search for matching jobs</p>
            {errors.desired_role && <p className="text-red-500 text-xs mt-1">{errors.desired_role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred city</label>
            <input
              type="text"
              {...register('desired_location', { required: 'Preferred city is required' })}
              placeholder="e.g. Bangalore, Mumbai, Hyderabad"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
            {errors.desired_location && <p className="text-red-500 text-xs mt-1">{errors.desired_location.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Work mode</label>
            <div className="grid grid-cols-3 gap-3">
              {workModes.map(({ value, icon, label }) => (
                <label
                  key={value}
                  className={`cursor-pointer border-2 rounded-xl py-4 text-center transition-all ${
                    selectedMode === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={value}
                    {...register('work_mode', { required: 'Work mode is required' })}
                    className="hidden"
                  />
                  <span className="block text-xl mb-1">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
            {errors.work_mode && <p className="text-red-500 text-xs mt-1.5">{errors.work_mode.message}</p>}
          </div>

          <input type="hidden" {...register('experience_level')} value="fresher" />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {isLoading ? 'Saving...' : 'Continue to Resume Upload →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
