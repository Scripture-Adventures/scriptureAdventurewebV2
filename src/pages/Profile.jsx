import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, HelpCircle, ShieldAlert, Clock, BookOpen, Phone, Mail, User, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const {
    tasterOnboardingDone,
    tasterEmail,
    currentCohortId,
    setCurrentCohortId,
    setLoggedIn,
    setTasterOnboardingDone,
  } = useAppStore();
  const navigate = useNavigate();

  const [tasterMember, setTasterMember] = useState(null);
  const [mainMember, setMainMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      try {
        if (tasterOnboardingDone) {
          setMainMember(null);
          if (!tasterEmail) {
            setTasterMember(null);
            return;
          }
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
          if (!cancelled && data) {
            setTasterMember(data);
            if (data.current_cohort_id != null) {
              setCurrentCohortId(String(data.current_cohort_id));
            }
          } else if (!cancelled) {
            setTasterMember(null);
          }
        } else {
          setTasterMember(null);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.email || cancelled) {
            setMainMember(null);
            return;
          }
          const { data, error } = await supabase
            .from('main_members')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          if (error) console.error('Error loading main profile:', error);
          if (!cancelled) setMainMember(data ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
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

  const formatMainValue = (val) => {
    if (val == null || val === '') return '—';
    if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const MainFieldRow = ({ label, value }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid rgba(15,23,42,0.08)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{formatMainValue(value)}</span>
    </div>
  );

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
    const m = mainMember;
    const initials = m
      ? (`${m.firstname?.charAt(0) || ''}${m.lastname?.charAt(0) || ''}` || (m.email?.charAt(0) || 'M')).toUpperCase()
      : 'M';
    const fullName = m
      ? `${m.firstname || ''} ${m.lastname || ''}`.trim() || m.email || 'Member'
      : 'Member';

    const mainCard = (title, icon, children) => (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 16px',
          marginBottom: 14,
          boxShadow: '0 8px 18px rgba(15,23,42,0.05)',
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {icon}
          {title}
        </p>
        {children}
      </div>
    );

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
          {!m ? (
            <div
              className="glass-card"
              style={{ padding: '20px', marginBottom: 18, textAlign: 'center', borderRadius: 20 }}
            >
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 15 }}>
                We couldn&apos;t load your details from the member list. If this keeps happening, contact support.
              </p>
            </div>
          ) : (
            <>
              {mainCard(
                'Identity',
                <User size={16} color="var(--primary)" />,
                <>
                  <MainFieldRow label="First name" value={m.firstname} />
                  <MainFieldRow label="Last name" value={m.lastname} />
                  <MainFieldRow label="Email" value={m.email} />
                  <MainFieldRow label="SA number" value={m.sanumber} />
                  <MainFieldRow label="Member ID" value={m.id} />
                </>
              )}
              {mainCard(
                'Contact',
                <Phone size={16} color="var(--primary)" />,
                <>
                  <MainFieldRow label="Phone" value={m.phonenumber} />
                  <MainFieldRow label="WhatsApp" value={m.whatsapp} />
                </>
              )}
              {mainCard(
                'Cohort & program',
                <Hash size={16} color="var(--primary)" />,
                <>
                  <MainFieldRow label="Current cohort ID" value={m.current_cohort_id} />
                  <MainFieldRow label="In current cohort" value={m.isincurrentcohort} />
                  <MainFieldRow label="Status" value={m.status} />
                  <MainFieldRow label="Role" value={m.role} />
                  <MainFieldRow label="Circle number" value={m.circle_number} />
                  <MainFieldRow label="Plan created" value={m.plancreated} />
                  <MainFieldRow label="Probation visits" value={m.probationvisits} />
                </>
              )}
              {mainCard(
                'Accountability',
                <Hash size={16} color="var(--primary)" />,
                <>
                  <MainFieldRow label="Partner ID" value={m.partnerid} />
                  <MainFieldRow label="Rep ID" value={m.repid} />
                </>
              )}
              {mainCard(
                'Bio',
                <User size={16} color="var(--primary)" />,
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, fontWeight: 500 }}>{formatMainValue(m.bio)}</p>
              )}
              {mainCard(
                'History',
                <Hash size={16} color="var(--primary)" />,
                <>
                  <MainFieldRow label="Previous SA numbers" value={m.prevsanumbers} />
                  <MainFieldRow label="Previous groups" value={m.previousgroups} />
                </>
              )}
            </>
          )}

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
