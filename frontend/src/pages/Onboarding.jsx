import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const PRESET_CITIES = [
  'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Remote',
];

const Onboarding = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { experience_level: 'fresher' },
  });

  const [selectedCities, setSelectedCities] = useState([]);
  const [customCityInput, setCustomCityInput] = useState('');
  const [cityError, setCityError] = useState(false);
  const [selectedModes, setSelectedModes] = useState([]);
  const [modeError, setModeError] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
    setCityError(false);
  };

  const handleCustomCityKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = customCityInput.trim();
      if (val && !selectedCities.includes(val)) {
        setSelectedCities((prev) => [...prev, val]);
        setCityError(false);
      }
      setCustomCityInput('');
    }
  };

  const onSubmit = async (data) => {
    let valid = true;
    if (selectedCities.length === 0) { setCityError(true); valid = false; }
    if (selectedModes.length === 0) { setModeError(true); valid = false; }
    if (!valid) return;

    setIsLoading(true);
    setError(null);
    try {
      await client.post('/api/preferences', {
        ...data,
        desired_location: selectedCities.join(', '),
        work_mode: selectedModes.join(', '),
      });
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
    <div className="animate-fadeUp" style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(20px,5vw,40px)' }}>
      <div className="card" style={{ padding: 'clamp(24px,4vw,40px)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 13px', borderRadius: 99,
          background: 'rgba(37,99,235,0.1)',
          fontSize: 13, fontWeight: 600, color: '#2563eb',
          marginBottom: 18,
        }}>Step 1 of 2</div>

        <h1 style={{
          fontFamily: "'Space Grotesk'", fontWeight: 700,
          fontSize: 'clamp(26px,3.4vw,34px)', letterSpacing: '-0.02em', marginBottom: 8,
        }}>What are you looking for?</h1>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>We'll find the right jobs for you.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Desired role */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              Desired role
            </label>
            <input
              type="text"
              {...register('desired_role', { required: 'Desired role is required' })}
              placeholder="e.g. Data Analyst, Software Engineer"
              className="input-field"
            />
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 7 }}>Be specific — used to search for matching jobs.</div>
            {errors.desired_role && (
              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 6, fontWeight: 500 }}>{errors.desired_role.message}</div>
            )}
          </div>

          {/* Preferred cities — chip selector */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
              Preferred cities{' '}
              <span style={{ fontWeight: 500, color: '#94a3b8' }}>· pick one or more</span>
            </label>

            {/* Preset city chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 11 }}>
              {PRESET_CITIES.map((city) => {
                const active = selectedCities.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 99,
                      border: active ? '1.5px solid #2563eb' : '1.5px solid rgba(15,23,42,0.14)',
                      background: active ? 'rgba(37,99,235,0.08)' : '#fff',
                      color: active ? '#2563eb' : '#475569',
                      fontFamily: "'Hanken Grotesk'",
                      fontWeight: 600,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {active && <span style={{ marginRight: 5 }}>✓</span>}{city}
                  </button>
                );
              })}
            </div>

            {/* Custom city input */}
            <input
              type="text"
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              onKeyDown={handleCustomCityKey}
              placeholder="Other — type a city and press Enter"
              className="input-field"
            />

            {/* Show added custom cities */}
            {selectedCities.filter(c => !PRESET_CITIES.includes(c)).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                {selectedCities.filter(c => !PRESET_CITIES.includes(c)).map((city) => (
                  <span key={city} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 99,
                    background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
                    fontSize: 13, fontWeight: 600, color: '#2563eb',
                  }}>
                    {city}
                    <button
                      type="button"
                      onClick={() => setSelectedCities(prev => prev.filter(c => c !== city))}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {cityError && (
              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 8, fontWeight: 500 }}>Select at least one city.</div>
            )}
          </div>

          {/* Work mode */}
          <div style={{ marginBottom: 30 }}>
            <label style={{ display: 'block', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
              Work mode{' '}
              <span style={{ fontWeight: 500, color: '#94a3b8' }}>· pick one or more</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {workModes.map(({ value, icon, label }) => {
                const active = selectedModes.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelectedModes(prev =>
                        prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
                      );
                      setModeError(false);
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 8, padding: '18px 12px',
                      borderRadius: 14, cursor: 'pointer',
                      border: active ? '2px solid #2563eb' : '1.5px solid rgba(15,23,42,0.12)',
                      background: active ? 'rgba(37,99,235,0.07)' : '#fff',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: active ? '#2563eb' : '#1e293b' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 12, color: active ? '#2563eb' : 'transparent', fontWeight: 700 }}>✓</span>
                  </button>
                );
              })}
            </div>
            {modeError && (
              <div style={{ fontSize: 13, color: '#dc2626', marginTop: 8, fontWeight: 500 }}>Select at least one work mode.</div>
            )}
          </div>

          <input type="hidden" {...register('experience_level')} value="fresher" />

          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: 11, marginBottom: 16,
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 13.5, color: '#dc2626', fontWeight: 500,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: 16, border: 'none', borderRadius: 12,
              background: '#2563eb', color: '#fff',
              fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16.5,
              cursor: isLoading ? 'default' : 'pointer',
              boxShadow: '0 14px 34px -16px #2563eb',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Saving…' : 'Continue to Resume Upload →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
