import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        batch_year: data.batch_year ? parseInt(data.batch_year, 10) : null,
      };
      const response = await client.post('/auth/register', payload);
      setToken(response.data.access_token);
      if (data.email) localStorage.setItem('jm_email', data.email);
      navigate('/onboarding');
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail === 'Email already registered') {
        setError('Email already exists');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      {/* Left panel */}
      <div style={{
        flex: '1 1 460px', minWidth: 300,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(32px,5vw,56px)',
        background: 'radial-gradient(125% 95% at 12% 8%, #3b82f6 0%, #2563eb 48%, #1e40af 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: '#fff', display: 'grid', placeItems: 'center',
            color: '#2563eb', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 19,
          }}>J</div>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', color: '#fff' }}>
            JobMatch
          </span>
        </div>

        <div style={{ margin: 'clamp(28px,5vw,48px) 0' }}>
          <div className="animate-floaty" style={{
            width: '100%', maxWidth: 340,
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 18, padding: 20,
            boxShadow: '0 30px 70px -30px rgba(15,30,70,0.45)',
            transform: 'rotate(-2deg)',
          }}>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 10 }}>
              Three steps to your shortlist
            </div>
            {['Upload your resume', 'We read your skills', 'Apply with one click'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 12, color: '#fff',
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#c7d7f5' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{
            fontFamily: "'Space Grotesk'", fontWeight: 700,
            fontSize: 'clamp(24px,3vw,32px)', lineHeight: 1.12,
            letterSpacing: '-0.02em', marginBottom: 12, color: '#fff',
          }}>Your resume, matched to your first real job.</h2>
          <p style={{ color: '#c7d7f5', fontSize: 15, lineHeight: 1.55, maxWidth: 380 }}>
            Create your free account. No credit card needed.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: '1 1 440px', minWidth: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px,5vw,56px)',
        background: '#f6f9ff',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 30 }}>
            <span style={{ fontSize: 13.5, color: '#64748b' }}>Already have an account?</span>
            <Link to="/login" style={{
              padding: '9px 18px', borderRadius: 99,
              background: '#fff', border: '1.5px solid rgba(15,23,42,0.14)',
              color: '#1e293b', fontFamily: "'Space Grotesk'", fontWeight: 600,
              fontSize: 12.5, letterSpacing: '0.03em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>Sign in</Link>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk'", fontWeight: 700,
            fontSize: 'clamp(28px,3.2vw,34px)', letterSpacing: '-0.02em', marginBottom: 8,
          }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 30 }}>Free for students and new graduates.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="label-text">Email address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="you@example.com"
                  className="input-field"
                />
                {errors.email && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 7, fontWeight: 500 }}>{errors.email.message}</div>}
              </div>

              <div>
                <label className="label-text">Password</label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                  placeholder="Enter your password"
                  className="input-field"
                />
                {errors.password && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 7, fontWeight: 500 }}>{errors.password.message}</div>}
              </div>

              <div>
                <label className="label-text">
                  College <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  {...register('college')}
                  placeholder="e.g. IIT Bombay"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">
                  Batch Year <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  type="number"
                  {...register('batch_year', {
                    min: { value: 2020, message: 'Year must be 2020 or later' },
                    max: { value: 2030, message: 'Year must be 2030 or earlier' },
                  })}
                  placeholder="e.g. 2026"
                  className="input-field"
                />
                {errors.batch_year && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 7, fontWeight: 500 }}>{errors.batch_year.message}</div>}
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px', borderRadius: 11,
                  background: 'rgba(220,38,38,0.07)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  fontSize: 13.5, color: '#dc2626', fontWeight: 500,
                }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  alignSelf: 'flex-start', marginTop: 6,
                  padding: '15px 44px', borderRadius: 99,
                  background: '#2563eb', color: '#fff', border: 'none',
                  fontFamily: "'Space Grotesk'", fontWeight: 600,
                  fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: isLoading ? 'default' : 'pointer',
                  boxShadow: '0 14px 30px -12px rgba(37,99,235,0.5)',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.1)' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.1)' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              padding: 11, borderRadius: 11,
              background: '#fff', color: '#1e293b', border: '1px solid rgba(15,23,42,0.14)',
              fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, color: '#4285F4' }}>G</span> Google
            </button>
            <button type="button" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              padding: 11, borderRadius: 11,
              background: '#fff', color: '#1e293b', border: '1px solid rgba(15,23,42,0.14)',
              fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, color: '#1877F2' }}>f</span> Facebook
            </button>
          </div>

          <p style={{ marginTop: 26, fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
            By continuing you agree to JobMatch's Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
