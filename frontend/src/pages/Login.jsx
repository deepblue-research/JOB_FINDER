import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.post('/auth/login', data);
      setToken(response.data.access_token);
      try {
        const userRes = await client.get('/auth/me');
        setUser(userRes.data);
        if (userRes.data?.email) localStorage.setItem('jm_email', userRes.data.email);
      } catch (e) {}
      navigate('/home');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      {/* Left panel — blue */}
      <div style={{
        flex: '1 1 460px', minWidth: 300,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(32px,5vw,56px)',
        background: 'radial-gradient(125% 95% at 12% 8%, #3b82f6 0%, #2563eb 48%, #1e40af 100%)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: '#fff', display: 'grid', placeItems: 'center',
            color: '#2563eb', fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 19,
          }}>J</div>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 21, letterSpacing: '-0.02em', color: '#fff' }}>
            JobMatch
          </span>
        </div>

        {/* Floating preview card */}
        <div style={{ position: 'relative', zIndex: 2, margin: 'clamp(28px,5vw,48px) 0' }}>
          <div className="animate-floaty" style={{
            width: '100%', maxWidth: 340,
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 18,
            padding: 20,
            boxShadow: '0 30px 70px -30px rgba(15,30,70,0.45)',
            transform: 'rotate(-2deg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                background: 'conic-gradient(#fff 96%, rgba(255,255,255,0.28) 0)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#1e40af',
                  display: 'grid', placeItems: 'center',
                  fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: '#fff',
                }}>96%</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16, color: '#fff' }}>Junior Product Analyst</div>
                <div style={{ fontSize: 13, color: '#c7d7f5', marginTop: 2 }}>Northbeam · Remote</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['✓ SQL', '✓ Excel', '✓ Analytics'].map(t => (
                <span key={t} style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  fontSize: 12, fontWeight: 500, color: '#fff',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontFamily: "'Space Grotesk'", fontWeight: 700,
            fontSize: 'clamp(24px,3vw,32px)', lineHeight: 1.12,
            letterSpacing: '-0.02em', marginBottom: 12,
            color: '#fff',
          }}>Land your first role, faster.</h2>
          <p style={{ color: '#c7d7f5', fontSize: 15, lineHeight: 1.55, maxWidth: 380 }}>
            Sign in to pick up where you left off — your matches, applications, and resume are waiting.
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
          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 30 }}>
            <span style={{ fontSize: 13.5, color: '#64748b' }}>Don't have an account?</span>
            <Link to="/register" style={{
              padding: '9px 18px', borderRadius: 99,
              background: '#fff', border: '1.5px solid rgba(15,23,42,0.14)',
              color: '#1e293b', fontFamily: "'Space Grotesk'", fontWeight: 600,
              fontSize: 12.5, letterSpacing: '0.03em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>Sign up</Link>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk'", fontWeight: 700,
            fontSize: 'clamp(28px,3.2vw,34px)', letterSpacing: '-0.02em', marginBottom: 8,
          }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 30 }}>Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                  <label className="label-text" style={{ margin: 0 }}>Password</label>
                  <button type="button" style={{
                    background: 'none', border: 'none', color: '#2563eb',
                    fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  }}>Forgot password?</button>
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="Enter your password"
                  className="input-field"
                />
                {errors.password && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 7, fontWeight: 500 }}>{errors.password.message}</div>}
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
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  padding: '15px 44px',
                  borderRadius: 99,
                  background: '#2563eb', color: '#fff', border: 'none',
                  fontFamily: "'Space Grotesk'", fontWeight: 600,
                  fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: isLoading ? 'default' : 'pointer',
                  boxShadow: '0 14px 30px -12px rgba(37,99,235,0.5)',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
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

export default Login;
