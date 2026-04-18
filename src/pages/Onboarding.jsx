import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { ADMIN_WHATSAPP_URL, SUPPORT_EMAIL } from '../lib/config';
import { verifyMainMemberForCohort, isDevTestMainEmail } from '../lib/mainMemberQualification';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState(0); // 0 = Intro, 1 = Login Form
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cohort states
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [tasterCohorts, setTasterCohorts] = useState([]);
  const [selectedTasterCohort, setSelectedTasterCohort] = useState('');

  const [notQualifiedDialog, setNotQualifiedDialog] = useState({ open: false, reason: null });
  
  const setLoggedIn = useAppStore(state => state.setLoggedIn);
  const navigate = useNavigate();

  const slides = [
    '/assets/images/d020a680-4942-492e-9950-700b6f8f80a0_2.jpg',
    '/assets/images/ee899802-91ef-4076-9877-3f6d96ce8060.JPG',
    '/assets/images/0c3c56c7-18f1-429f-bbe6-87e29a2af5f1.JPG',
    '/assets/images/6a5a03a6-f980-4be7-bfc9-8a5a2179960e_2.jpg' // Added the welcome image as the final slide
  ];

  // Auto-advance slides every 4 seconds if on the intro step
  useEffect(() => {
    if (step !== 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step, slides.length]);

  useEffect(() => {
    async function fetchCohorts() {
      const { data } = await supabase
        .from('current_cohort')
        .select('id, nomenclature, taster_session_on, taster_group_link, sermon_link, taster_start_date, start_date, main_group_link, circles');
      if (data) {
        setCohorts(data);
        setTasterCohorts(data.filter(c => c.taster_session_on === true));
      }
    }
    fetchCohorts();
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('sa_main_not_qualified');
    if (!raw) return;
    sessionStorage.removeItem('sa_main_not_qualified');
    const reason =
      raw === 'wrong_cohort'
        ? 'wrong_cohort'
        : raw === 'no_member'
          ? 'no_member'
          : raw === 'fetch_error'
            ? 'fetch_error'
            : 'not_in_cohort';
    setNotQualifiedDialog({ open: true, reason });
    setStep(1);
  }, []);

  const notQualifiedCopy = (() => {
    const r = notQualifiedDialog.reason;
    if (r === 'wrong_cohort') {
      return {
        title: 'Cohort mismatch',
        body:
          'The cohort you selected does not match your assigned cohort. Please choose the cohort you were placed in, or complete the steps to join this cohort.',
      };
    }
    if (r === 'no_member') {
      return {
        title: 'No membership found',
        body:
          'We could not find your details in our main member list. You are not able to access the main adventure until your account is set up.',
      };
    }
    if (r === 'fetch_error') {
      return {
        title: 'Could not verify membership',
        body:
          'We could not confirm your membership status. Check your connection and try again, or contact the admins for help.',
      };
    }
    return {
      title: 'Not qualified for this cohort',
      body:
        'Your account is not marked as active in the current cohort. Complete whatever is required to qualify, or message the admins on WhatsApp for assistance.',
    };
  })();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedCohort) {
      setError("Please select a valid cohort");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const userEmail = data.user?.email || email;

      if (!isDevTestMainEmail(userEmail)) {
        const check = await verifyMainMemberForCohort(supabase, userEmail, selectedCohort);
        if (!check.ok) {
          await supabase.auth.signOut();
          setNotQualifiedDialog({ open: true, reason: check.reason });
          return;
        }
      }

      useAppStore.getState().setTasterEmail(userEmail);
      useAppStore.getState().setCurrentCohortId(selectedCohort);
      const cohortObj = cohorts.find((c) => String(c.id) === String(selectedCohort));
      if (cohortObj) {
        useAppStore.getState().setCurrentCohort(cohortObj);
      }
      setLoggedIn(true);
      navigate('/');
    } catch (err) {
      console.warn("Supabase Error:", err.message);
      if (isDevTestMainEmail(email)) {
        setLoggedIn(true);
        useAppStore.getState().setTasterEmail(email);
        useAppStore.getState().setCurrentCohortId(selectedCohort);
        const cohortObj = cohorts.find((c) => String(c.id) === String(selectedCohort));
        if (cohortObj) {
          useAppStore.getState().setCurrentCohort(cohortObj);
        }
        navigate('/');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTasterLogin = () => {
    if (!selectedTasterCohort) {
      setError("Please select a taster cohort");
      return;
    }
    // selectedTasterCohort holds the cohort id as a string
    useAppStore.getState().setCurrentCohortId(selectedTasterCohort);
    const cohortObj = tasterCohorts.find(
      (c) => String(c.id) === String(selectedTasterCohort)
    );
    if (cohortObj) {
      useAppStore.getState().setCurrentCohort(cohortObj);
    }
    navigate('/taster-login');
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
      {notQualifiedDialog.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="not-qualified-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setNotQualifiedDialog({ open: false, reason: null })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface-elevated, #fff)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              border: '1px solid rgba(125,17,17,0.12)',
            }}
          >
            <h3
              id="not-qualified-title"
              style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}
            >
              {notQualifiedCopy.title}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '15px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {notQualifiedCopy.body}
            </p>
            <div className="flex-col" style={{ gap: '10px' }}>
              {ADMIN_WHATSAPP_URL ? (
                <a
                  href={ADMIN_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-center"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    gap: '8px',
                    fontWeight: '700',
                  }}
                >
                  <MessageCircle size={20} />
                  Message admins on WhatsApp
                </a>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Ask your facilitator for the admin WhatsApp number, or email support below.
                </p>
              )}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Main member cohort access')}`}
                className="btn flex-center"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  gap: '8px',
                  fontWeight: '600',
                  background: 'rgba(125,17,17,0.08)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(125,17,17,0.2)',
                }}
              >
                <Mail size={20} />
                Email support
              </a>
              <button
                type="button"
                className="btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  fontWeight: '600',
                }}
                onClick={() => setNotQualifiedDialog({ open: false, reason: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
                Thank you for making this decision. Begin your journey into the scriptures today.
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
                Get Started
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

              <h2 style={{ color: 'var(--primary)', fontSize: '28px', fontWeight: 800, margin: 0 }}>Log In</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '32px' }}>
                Welcome back. Please fill in your details.
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

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="input-field"
                      style={{
                        borderRadius: '12px',
                        padding: '16px',
                        paddingRight: '52px',
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--surface-elevated)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Current Cohort</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      value={selectedCohort}
                      onChange={(e) => setSelectedCohort(e.target.value)}
                      className="input-field"
                      style={{ 
                        borderRadius: '12px', padding: '16px', 
                        backgroundColor: 'var(--surface-elevated)', 
                        border: '1px solid rgba(0,0,0,0.05)',
                        appearance: 'none', width: '100%'
                      }}
                    >
                      <option value="">Select a cohort...</option>
                      {cohorts.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.nomenclature}</option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {error && <div style={{ padding: '12px', backgroundColor: 'rgba(255, 89, 99, 0.1)', color: 'var(--error)', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', marginTop: '8px' }} disabled={loading}>
                  {loading ? 'Logging In...' : 'Log In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <a href="#" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>Forgot Password?</a>
                </div>
              </form>

              {tasterCohorts.length > 0 && (
                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(57, 210, 192, 0.1)', color: 'var(--secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Try it Out
                    </span>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Taster Session Cohort</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={selectedTasterCohort}
                        onChange={(e) => setSelectedTasterCohort(e.target.value)}
                        className="input-field"
                        style={{ 
                          borderRadius: '12px', padding: '16px', 
                          backgroundColor: 'var(--surface-elevated)', 
                          border: '1px solid rgba(0,0,0,0.05)',
                          appearance: 'none', width: '100%'
                        }}
                      >
                        <option value="">Select a taster cohort...</option>
                        {tasterCohorts.map((c, i) => (
                          <option key={i} value={String(c.id)}>{c.nomenclature}</option>
                        ))}
                      </select>
                      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleTasterLogin} 
                    className="btn" 
                    style={{ 
                      width: '100%', height: '56px', borderRadius: '12px', 
                      fontSize: '16px', fontWeight: '600',
                      backgroundColor: 'transparent',
                      border: '2px solid var(--primary)',
                      color: 'var(--primary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Log In to Taster Session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
