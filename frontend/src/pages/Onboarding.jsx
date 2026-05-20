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

  return (
    <div className="max-w-xl mx-auto mt-20 bg-white rounded-xl border shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tell us what you're looking for</h1>
        <p className="text-gray-500 mt-2">We'll find the right jobs for you</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What role are you looking for?</label>
          <input
            type="text"
            {...register('desired_role', { required: 'Desired role is required' })}
            placeholder="e.g. Data Analyst, Software Engineer, Frontend Developer"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Be specific — used to search LinkedIn and Indeed</p>
          {errors.desired_role && <p className="text-red-500 text-sm mt-1">{errors.desired_role.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred city</label>
          <input
            type="text"
            {...register('desired_location', { required: 'Preferred city is required' })}
            placeholder="e.g. Bangalore, Mumbai, Hyderabad"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.desired_location && <p className="text-red-500 text-sm mt-1">{errors.desired_location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
          <div className="grid grid-cols-3 gap-4">
            {['Remote', 'On-site', 'Hybrid'].map((mode) => (
              <label 
                key={mode} 
                className={`cursor-pointer border rounded-lg py-3 text-center transition-colors ${
                  selectedMode === mode ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <input 
                  type="radio" 
                  value={mode} 
                  {...register('work_mode', { required: 'Work mode is required' })} 
                  className="hidden" 
                />
                <span className="font-medium">{mode}</span>
              </label>
            ))}
          </div>
          {errors.work_mode && <p className="text-red-500 text-sm mt-1">{errors.work_mode.message}</p>}
        </div>

        <input type="hidden" {...register('experience_level')} value="fresher" />

        {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {isLoading ? 'Saving...' : 'Find My Jobs →'}
        </button>
      </form>
    </div>
  );
};

export default Onboarding;