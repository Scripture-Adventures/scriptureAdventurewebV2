import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

export default function TasterLogin() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState(0); // 0 = Intro, 1 = Login Form
  
  // Auth states
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const setTasterEmail = useAppStore(state => state.setTasterEmail);
  const setTasterOnboardingDone = useAppStore(state => state.setTasterOnboardingDone);
  const navigate = useNavigate();

  const slides = [
    '/assets/images/d020a680-4942-492e-9950-700b6f8f80a0_2.jpg',
    '/assets/images/ee899802-91ef-4076-9877-3f6d96ce8060.JPG',
    '/assets/images/0c3c56c7-18f1-429f-bbe6-87e29a2af5f1.JPG',
    '/assets/images/6a5a03a6-f980-4be7-bfc9-8a5a2179960e_2.jpg'
  ];

  // Auto-advance slides every 4 seconds if on the intro step
  useEffect(() => {
    if (step !== 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step, slides.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const currentCohortId = useAppStore.getState().currentCohortId || useAppStore.getState().currentCohort?.id;
      let data = null;
      if (currentCohortId) {
        const res = await supabase
          .from('taster_members')
          .select('*')
          .eq('email', email)
          .eq('current_cohort_id', currentCohortId)
          .maybeSingle();
        if (res.error) throw res.error;
        data = res.data;
      } else {
        const res = await supabase
          .from('taster_members')
          .select('*')
          .eq('email', email)
          .limit(1);
        if (res.error) throw res.error;
        data = res.data?.[0] ?? null;
      }
      if (!data) {
        setError('No taster account found for this email.');
        return;
      }

      useAppStore.getState().setTasterEmail(email);
      useAppStore.getState().setTasterOnboardingDone(true);
      useAppStore.getState().setLoggedIn(true);
      useAppStore.getState().setTasterDetails(data);
      if (data.current_cohort_id != null) useAppStore.getState().setCurrentCohortId(String(data.current_cohort_id));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
      {/* Background Slideshow */}
      {slides.map((src, index) => (
        <img 
          key={index}
          src={src}
          alt={`Slide ${index}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: currentSlide === index ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: 0
          }}
        />
      ))}

      {/* Dark overlay to ensure text readability */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Top Header Logo Component */}
        <div style={{ padding: '40px 24px', flex: 1 }}>
          {step === 0 && (
            <div className="animate-fade-in" style={{ transition: 'all 0.5s' }}>
              <div style={{ 
                width: '48px', height: '48px', 
                backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px', border: '1px solid rgba(255,255,255,0.3)',
                overflow: 'hidden'
              }}>
                <img src="/assets/images/app_launcher_icon.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ backgroundColor: 'rgba(57, 210, 192, 0.4)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', backdropFilter: 'blur(5px)' }}>
                Taster Session
              </span>
            </div>
          )}
        </div>

        {/* Bottom Floating Glass Card */}
        <div 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTopLeftRadius: '32px',
            borderTopRightRadius: '32px',
            padding: '32px 24px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: step === 0 ? 'translateY(0)' : 'translateY(0)',
          }}
          className="animate-slide-up"
        >
          {step === 0 ? (
            <div className="animate-fade-in">
              <h1 style={{ fontFamily: 'var(--font-script)', color: 'var(--primary)', fontSize: '36px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Hello Adventurer
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '8px', marginBottom: '32px', lineHeight: 1.5 }}>
                Thank you for deciding to trial our Taster Session. Let's get you set up.
              </p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                {slides.map((_, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      height: '4px',
                      flex: 1,
                      backgroundColor: currentSlide === idx ? 'var(--primary)' : 'rgba(125, 17, 17, 0.2)',
                      borderRadius: '2px',
                      transition: 'background-color 0.3s',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>

              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', height: '56px', borderRadius: '16px', 
                  fontSize: '18px', fontWeight: '600',
                  boxShadow: '0 8px 20px rgba(125, 17, 17, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="animate-fade-in flex-col" style={{ paddingBottom: '20px' }}>
              <button 
                onClick={() => setStep(0)}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '24px',
                  fontWeight: '600', cursor: 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <h2 style={{ color: 'var(--primary)', fontSize: '28px', fontWeight: 800, margin: 0 }}>Taster Login</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '32px' }}>
                Please enter the email address associated with your taster session.
              </p>

              <form onSubmit={handleLogin} className="flex-col" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="input-field"
                    style={{ borderRadius: '12px', padding: '16px', backgroundColor: 'var(--surface-elevated)', border: '1px solid rgba(0,0,0,0.05)' }} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div style={{ padding: '12px', backgroundColor: 'rgba(255, 89, 99, 0.1)', color: 'var(--error)', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', marginTop: '16px' }} disabled={loading}>
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
