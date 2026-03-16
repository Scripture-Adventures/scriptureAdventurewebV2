import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, HelpCircle, ShieldAlert, Award, FileText, Clock, BookOpen, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const {
    tasterOnboardingDone,
    tasterEmail,
    currentCohortId,
    setCurrentCohortId,
    setLoggedIn,
    setTasterOnboardingDone,
    userDataCohortMember,
  } = useAppStore();
  const navigate = useNavigate();

  const [tasterMember, setTasterMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasterMember = async () => {
      if (!tasterOnboardingDone || !tasterEmail) {
        setLoading(false);
        return;
      }
      try {
        const cohortId = currentCohortId;
        let data = null;
        if (cohortId) {
          const { data: byCohort, error } = await supabase
            .from('taster_members')
            .select('*')
            .eq('email', tasterEmail)
            .eq('current_cohort_id', cohortId)
            .maybeSingle();
          if (error) console.error('Error loading taster profile (cohort):', error);
          data = byCohort;
        } else {
          const { data: rows, error } = await supabase
            .from('taster_members')
            .select('*')
            .eq('email', tasterEmail)
            .limit(1);
          if (error) console.error('Error loading taster profile:', error);
          data = rows?.[0] ?? null;
        }
        if (data) {
          setTasterMember(data);
          if (data.current_cohort_id != null) {
            setCurrentCohortId(String(data.current_cohort_id));
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadTasterMember();
  }, [tasterOnboardingDone, tasterEmail, currentCohortId, setCurrentCohortId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setTasterOnboardingDone(false);
    setCurrentCohortId('');
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const isTaster = tasterOnboardingDone;

  // Main member data (from cohort member state)
  const mainMember = !isTaster ? userDataCohortMember : null;

  const renderTasterProfile = () => {
    const member = tasterMember;
    if (!member) return null;

    const initials = `${member.firstname?.charAt(0) || ''}${member.lastname?.charAt(0) || ''}` || 'T';
    const fullName = `${member.firstname || ''} ${member.lastname || ''}`.trim() || 'Taster Member';

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at top left, #FFE4E4 0, #FFFFFF 45%, #FFF8F4 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Hero header */}
        <div
          style={{
            padding: '24px 16px 32px',
            background:
              'linear-gradient(135deg, rgba(125,17,17,1) 0%, rgba(125,17,17,0.85) 40%, rgba(57,210,192,0.9) 100%)',
            borderBottomLeftRadius: '32px',
            borderBottomRightRadius: '32px',
            boxShadow: '0 18px 35px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.16)',
                borderRadius: '999px',
                border: 'none',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <span style={{ fontSize: 18 }}>{'←'}</span>
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}>
              TASTER PROFILE
            </span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '24px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              {initials}
            </div>
            <div style={{ color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{fullName}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                SAT Number: <strong>{member.satnumber || 'Not set'}</strong>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.8 }}>Current Taster Cohort</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px 32px', marginTop: -16 }}>
          {/* Key stats card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: '16px 18px',
              marginBottom: 18,
              boxShadow: '0 10px 25px rgba(15,23,42,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(125,17,17,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} color="var(--primary)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Adventure Reports</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {(member.total_submission ?? member.totalSubmission ?? 0)}/5
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Sermon Submitted</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {member.sermon_submitted ? 'Yes' : 'Not yet'}
              </p>
            </div>
          </div>

          {/* Detail cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '14px 16px',
                boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Contact
              </p>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="var(--primary)" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{member.email || 'No email'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Phone size={16} color="var(--primary)" />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {member.Confirm_Phone_number || member.confirmPhoneNumber || 'No phone'}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '14px 16px',
                boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Personal
              </p>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gender</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{member.Gender || member.gender || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Birthday</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{member.Birthday || member.birthday || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '14px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
              }}
              onClick={() => navigate('/adventure-report')}
            >
              <BookOpen size={18} />
              Submit Adventure Report
            </button>

            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '14px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMainProfile = () => {
    const member = mainMember;
    // If we don't have main member details, show a very simple fallback
    const fallbackEmail = tasterEmail || 'Member';
    const initials =
      (member?.firstName?.charAt(0) || member?.firstname?.charAt(0) || fallbackEmail.charAt(0) || 'M').toUpperCase();
    const fullName =
      `${member?.firstName || member?.firstname || ''} ${member?.lastName || member?.lastname || ''}`.trim() ||
      fallbackEmail;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at top, #EEF2FF 0, #FFFFFF 45%, #FDF2F8 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '24px 16px 28px',
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,64,175,0.95) 45%, rgba(129,140,248,0.9) 100%)',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            boxShadow: '0 18px 35px rgba(15,23,42,0.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: '999px',
                border: 'none',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <span style={{ fontSize: 18 }}>{'←'}</span>
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
              MAIN PROFILE
            </span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '999px',
                backgroundColor: 'rgba(15,23,42,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 28,
                fontWeight: 800,
                boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
              }}
            >
              {initials}
            </div>
            <div style={{ color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{fullName}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>Scripture Adventure Member</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 16px 32px', marginTop: -14 }}>
          {/* Quick actions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: '16px 18px',
              marginBottom: 18,
              boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => navigate('/adventure-report')}
            >
              <Award size={18} />
              Adventure Report
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => navigate('/sermon-report')}
            >
              <FileText size={18} />
              Sermon Report
            </button>
          </div>

          {/* Support & legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => navigate('/support')}
            >
              <HelpCircle size={18} />
              Support
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => navigate('/privacy')}
            >
              <ShieldAlert size={18} />
              Privacy Policy
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: 'var(--error)',
              }}
              onClick={async () => {
                await supabase.auth.signOut();
                setLoggedIn(false);
                navigate('/onboarding');
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  };

  return isTaster ? renderTasterProfile() : renderMainProfile();
}
